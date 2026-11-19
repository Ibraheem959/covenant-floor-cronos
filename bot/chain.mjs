const RPC = "https://rpc-mainnet.supra.com";
export const MODULE =
  "0xb16caf04d8d60bea001e71e36a020ac657b3e318b942a6f090703c5ebd9da371";
const FLOOR = `${MODULE}::floor`;
export const QUANTS = 100_000_000n;
export const FELT_QUANTS = 1_000_000n;

const GAME_CODE = {
  dice: 2,
  roulette: 3,
  slots: 4,
  plinko: 5,
  keno: 6,
  baccarat: 7,
  hilo_guess: 8,
  hilo_cashout: 8,
  mines_reveal: 9,
  mines_cashout: 9,
  bj_deal: 10,
  bj_hit: 10,
  bj_stand: 10,
  bj_double: 10,
  bj_split: 10,
  table_hit: 11,
  table_stand: 11,
  table_double: 11,
  poker_call: 12,
  poker_fold: 12,
};

export const GAME_LABEL = {
  dice: "DICE",
  roulette: "ROULETTE",
  slots: "SLOTS",
  plinko: "PLINKO",
  keno: "KENO",
  baccarat: "BACCARAT",
  hilo_guess: "HI-LO",
  hilo_cashout: "HI-LO",
  mines_reveal: "MINES",
  mines_cashout: "MINES",
  bj_deal: "BLACKJACK",
  bj_hit: "BLACKJACK",
  bj_stand: "BLACKJACK",
  bj_double: "BLACKJACK",
  bj_split: "BLACKJACK",
  table_hit: "TABLE",
  table_stand: "TABLE",
  table_double: "TABLE",
  poker_call: "POKER",
  poker_fold: "POKER",
};

async function rpc(path, options) {
  const response = await fetch(`${RPC}${path}`, {
    ...options,
    signal: AbortSignal.timeout(15000),
    headers: {
      "user-agent": "felt-floor-bot/1.0",
      accept: "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Supra ${response.status} ${path}`);
  }
  return response;
}

export async function view(name, args = []) {
  const response = await rpc("/rpc/v3/view", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      function: `${FLOOR}::${name}`,
      type_arguments: [],
      arguments: args,
    }),
  });
  const body = await response.json();
  if (!Array.isArray(body.result) || body.result.length !== 1) {
    throw new Error(`Bad view ${name}`);
  }
  return body.result[0];
}

export async function viewMany(name, args = []) {
  const response = await rpc("/rpc/v3/view", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      function: `${FLOOR}::${name}`,
      type_arguments: [],
      arguments: args,
    }),
  });
  const body = await response.json();
  if (!Array.isArray(body.result)) throw new Error(`Bad view ${name}`);
  return body.result;
}

export async function latestHeight() {
  const response = await rpc("/rpc/v3/block");
  const body = await response.json();
  return Number(body.header.height);
}

export async function userTransactions(height) {
  const response = await rpc(
    `/rpc/v3/block/height/${height}?with_finalized_transactions=true&type=user`,
  );
  const body = await response.json();
  return Array.isArray(body.transactions) ? body.transactions : [];
}

export function floorCall(tx) {
  const move = tx?.payload?.Move;
  const fn = move?.function;
  if (typeof fn !== "string" || !fn.startsWith(`${FLOOR}::`)) return null;
  if (tx.status !== "Success") return null;
  if (tx.output?.Move?.vm_status && tx.output.Move.vm_status !== "Executed successfully") {
    return null;
  }
  const sender = tx.header?.sender?.Move;
  if (typeof sender !== "string") return null;
  return {
    hash: tx.hash,
    name: fn.slice(FLOOR.length + 2),
    args: Array.isArray(move.arguments) ? move.arguments : [],
    sender,
    events: tx.output?.Move?.events ?? [],
    time: tx.block_header?.timestamp?.utc_date_time ?? null,
  };
}

export async function readLast(address) {
  const [game, detail, payout, stake] = await Promise.all([
    view("last_game", [address]),
    view("last_detail", [address]),
    view("last_payout", [address]),
    view("last_stake", [address]),
  ]);
  return {
    game: Number(game),
    detail: BigInt(detail),
    payout: BigInt(payout),
    stake: BigInt(stake),
  };
}

export function settlementOf(call, last, phase = null) {
  const expected = GAME_CODE[call.name];
  if (expected === undefined || !last || last.game !== expected) return null;
  const namedStake = stakeArg(call);
  if (namedStake !== null && last.stake !== namedStake) return null;

  if (call.name === "hilo_guess") {
    if (last.detail < 100n) return null;
    return { stake: last.stake, payout: 0n, settled: true };
  }
  if (call.name === "mines_reveal") {
    const finished = last.detail >= 100n || last.payout > 0n;
    if (!finished) return null;
    return { stake: last.stake, payout: last.payout, settled: true };
  }
  if (call.name.startsWith("bj_") || call.name.startsWith("table_")) {
    if (phase !== 0) return null;
  }
  if (call.name === "poker_call" || call.name === "poker_fold") {
    if (phase !== 2) return null;
  }
  if (last.stake === 0n) return null;
  return { stake: last.stake, payout: last.payout, settled: true };
}

function stakeArg(call) {
  const instant = ["dice", "roulette", "slots", "plinko", "keno", "baccarat", "bj_deal"];
  if (!instant.includes(call.name)) return null;
  const raw = call.args[call.args.length - 1];
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export function depositsTo(call) {
  return call.events
    .filter((event) => event.type === "0x1::coin::CoinDeposit")
    .map((event) => ({
      account: event.data?.account,
      amount: BigInt(event.data?.amount ?? 0),
    }))
    .filter((row) => row.account && row.amount > 0n);
}

export function formatSupra(quants) {
  return formatUnits(quants, QUANTS, 8);
}

export function formatFelt(quants) {
  return formatUnits(quants, FELT_QUANTS, 6);
}

function formatUnits(quants, scale, places) {
  const amount = BigInt(quants);
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const whole = absolute / scale;
  const fraction = (absolute % scale).toString().padStart(places, "0").replace(/0+$/, "");
  const text = `${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction ? `.${fraction}` : ""}`;
  return negative ? `-${text}` : text;
}

export function formatMultiple(payout, stake) {
  if (stake <= 0n) return "0";
  const scaled = (payout * 100n) / stake;
  const whole = scaled / 100n;
  const fraction = (scaled % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

export function shortAddress(address) {
  const hex = address.toLowerCase();
  if (hex.length < 12) return hex;
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "\u0026amp;")
    .replaceAll("<", "\u0026lt;")
    .replaceAll(">", "\u0026gt;");
}
