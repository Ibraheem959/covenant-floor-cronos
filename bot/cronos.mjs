import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { escapeHtml, formatMultiple, shortAddress } from "./chain.mjs";

const RPC = process.env.CRONOS_RPC || "https://evm.cronos.org";
const FLOOR = "0x828D84Ec3Ca9B307be03aD1658a6D98Bf2C4c269";
const PLAY_TOPIC = "0x4604e1e6dd5abe456f081d0d88cd87f05afbfe4e9bd011b3654ff470d7e74e33";
const HOUSE_TOPIC = "0x53830f159a54d10c11bc5258401539181cd3ba65e8881a5de719af03470f087d";
const FELT_TOKEN = "0x03b9d039e4a9de5c89c43b5917a39daacedea391";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const CALLS = {
  "0x251affd3": "seal",
  "0x800d3b12": "burn",
  "0x0eecae21": "draw",
  "0x4a951d8d": "settle",
  "0x8746cf98": "fund",
};
const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT = (process.env.TELEGRAM_CHAT_ID ?? "").trim();
const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const STATE_FILE = path.join(DATA, "cronos.json");
const RULE = "━━━━━━━━━━━━━━━━━";
const LABELS = {
  dice: "DICE",
  roulette: "ROULETTE",
  slots: "SLOTS",
  plinko: "PLINKO",
  keno: "KENO",
  baccarat: "BACCARAT",
  poker: "POKER",
  lottery: "LOTTERY",
};

let started = false;
let state = { block: 0, hourKey: "", dayKey: "", hour: emptyBucket(), day: emptyBucket() };

function emptyBucket() {
  return { rounds: 0, wagered: 0n, paid: 0n, loss: 0n, biggest: null };
}

function loadBucket(raw) {
  if (!raw) return emptyBucket();
  return {
    rounds: raw.rounds ?? 0,
    wagered: BigInt(raw.wagered ?? 0),
    paid: BigInt(raw.paid ?? 0),
    loss: BigInt(raw.loss ?? 0),
    biggest: raw.biggest
      ? { ...raw.biggest, stake: BigInt(raw.biggest.stake), payout: BigInt(raw.biggest.payout) }
      : null,
  };
}

function dumpBucket(bucket) {
  return {
    rounds: bucket.rounds,
    wagered: bucket.wagered.toString(),
    paid: bucket.paid.toString(),
    loss: bucket.loss.toString(),
    biggest: bucket.biggest
      ? { ...bucket.biggest, stake: bucket.biggest.stake.toString(), payout: bucket.biggest.payout.toString() }
      : null,
  };
}

function word(data, index) {
  return BigInt(`0x${data.slice(2 + index * 64, 2 + (index + 1) * 64)}`);
}

function readString(data, offset) {
  const start = Number(offset) / 32;
  const length = Number(word(data, start));
  const hex = data.slice(2 + (start + 1) * 64, 2 + (start + 1) * 64 + length * 2);
  return Buffer.from(hex, "hex").toString("utf8");
}

export function decodePlay(log) {
  const data = log.data;
  const player = `0x${log.topics[1].slice(26)}`;
  return {
    player,
    game: readString(data, word(data, 0)),
    stake: word(data, 1),
    payout: word(data, 2),
    detail: readString(data, word(data, 3)),
  };
}

export function decodeHouse(log) {
  return { amount: word(log.data, 0), to: `0x${log.data.slice(2 + 64 + 24)}` };
}

function feltLine(amount) {
  const scale = 10n ** 18n;
  const whole = amount / scale;
  const fraction = (amount % scale).toString().padStart(18, "0").replace(/0+$/, "").slice(0, 6).replace(/0+$/, "");
  const text = `${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction ? `.${fraction}` : ""}`;
  return `${text} FELT`;
}

function hourKey(date = new Date()) {
  return date.toISOString().slice(0, 13);
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function say(text) {
  if (!TOKEN || !CHAT) return;
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.description || "Telegram send failed");
}

function addRound(bucket, row) {
  bucket.rounds += 1;
  bucket.wagered += row.stake;
  bucket.paid += row.payout;
  if (row.payout < row.stake) bucket.loss += row.stake - row.payout;
  if (row.payout > row.stake && (!bucket.biggest || row.payout > bucket.biggest.payout)) bucket.biggest = row;
}

function playText(row) {
  const label = LABELS[row.game] || row.game.toUpperCase();
  const detail = escapeHtml(row.detail);
  const who = shortAddress(row.player);
  const tail = ["Cronos · covenantfelt.xyz", who];
  if (row.payout > row.stake) {
    return [
      "<b>FELT</b>",
      label,
      RULE,
      `<b>Paid back ${feltLine(row.payout)}</b> (${formatMultiple(row.payout, row.stake)}× the wager)`,
      `Profit: ${feltLine(row.payout - row.stake)}`,
      `Wager: ${feltLine(row.stake)}`,
      detail,
      ...tail,
    ].filter(Boolean).join("\n");
  }
  if (row.payout === row.stake) {
    return ["<b>FELT</b>", label, RULE, `Push. ${feltLine(row.stake)} returned.`, detail, ...tail].filter(Boolean).join("\n");
  }
  if (row.payout === 0n) {
    const loss = row.stake;
    return [
      "<b>FELT</b>",
      label,
      RULE,
      `Loss: ${feltLine(loss)}`,
      detail,
      `Burned ${feltLine((loss * 1500n) / 10000n)} · sink ${feltLine((loss * 500n) / 10000n)} · stakers ${feltLine((loss * 1000n) / 10000n)}`,
      ...tail,
    ].filter(Boolean).join("\n");
  }
  const loss = row.stake - row.payout;
  return [
    "<b>FELT</b>",
    label,
    RULE,
    `Paid back ${feltLine(row.payout)} from ${feltLine(row.stake)}.`,
    detail,
    `Burned ${feltLine((loss * 1500n) / 10000n)} · sink ${feltLine((loss * 500n) / 10000n)} · stakers ${feltLine((loss * 1000n) / 10000n)}`,
    ...tail,
  ].filter(Boolean).join("\n");
}

function report(title, bucket) {
  const lines = [
    "<b>FELT</b>",
    title,
    RULE,
    `Rounds: ${bucket.rounds}`,
    `Wagered: ${feltLine(bucket.wagered)}`,
    `Paid back: ${feltLine(bucket.paid)}`,
    "Cronos · covenantfelt.xyz",
  ];
  if (bucket.biggest) {
    lines.splice(5, 0, `Biggest: ${LABELS[bucket.biggest.game] || bucket.biggest.game} ${feltLine(bucket.biggest.stake)} → ${feltLine(bucket.biggest.payout)}`);
  }
  return lines.join("\n");
}

async function rpc(method, params) {
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || "Cronos RPC failed");
  return payload.result;
}

async function load() {
  try {
    const parsed = JSON.parse(await readFile(STATE_FILE, "utf8"));
    state = {
      block: Number(parsed.block || 0),
      hourKey: parsed.hourKey || "",
      dayKey: parsed.dayKey || "",
      hour: loadBucket(parsed.hour),
      day: loadBucket(parsed.day),
    };
  } catch {
    state.block = Number(await rpc("eth_blockNumber", []));
  }
  if (!state.hourKey) state.hourKey = hourKey();
  if (!state.dayKey) state.dayKey = dayKey();
}

async function save() {
  await mkdir(DATA, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify({
    block: state.block,
    hourKey: state.hourKey,
    dayKey: state.dayKey,
    hour: dumpBucket(state.hour),
    day: dumpBucket(state.day),
  }, null, 2));
}

async function announce(log) {
  if (log.topics[0] === HOUSE_TOPIC) {
    const sent = decodeHouse(log);
    await say([
      "<b>FELT</b>",
      "HOUSE BANK",
      RULE,
      `${feltLine(sent.amount)} left the house bank.`,
      "Player vaults were not used.",
      shortAddress(sent.to),
      "Cronos · covenantfelt.xyz",
    ].join("\n"));
    return;
  }
  const row = decodePlay(log);
  if (row.detail === "locked" || row.stake === 0n) return;
  addRound(state.hour, row);
  addRound(state.day, row);
  await say(playText(row));
}

function arg(input) {
  const hex = String(input || "").slice(10, 74);
  return hex ? BigInt(`0x${hex}`) : 0n;
}

async function onFloorTx(tx) {
  const kind = CALLS[String(tx.input || "").slice(0, 10).toLowerCase()];
  if (!kind) return;
  const who = shortAddress(tx.from);
  if (kind === "seal" || kind === "burn") {
    const n = arg(tx.input);
    await say([
      "<b>FELT</b>",
      "LOTTERY",
      RULE,
      kind === "seal" ? `Paid ${n.toString()} scroll${n === 1n ? "" : "s"} into the pot.` : `Burned ${n.toString()} scroll${n === 1n ? "" : "s"}. They still enter the draw.`,
      who,
      "Cronos · covenantfelt.xyz",
    ].join("\n"));
    return;
  }
  if (kind === "draw") {
    await say(["<b>FELT</b>", "LOTTERY", RULE, "The draw is locked. It settles on the next block.", who, "Cronos · covenantfelt.xyz"].join("\n"));
    return;
  }
  if (kind === "fund") {
    await say(["<b>FELT</b>", "HOUSE BANK", RULE, `${feltLine(arg(tx.input))} added to the house bank.`, who, "Cronos · covenantfelt.xyz"].join("\n"));
    return;
  }
  const receipt = await rpc("eth_getTransactionReceipt", [tx.hash]);
  let paid = 0n;
  let winner = "";
  for (const log of receipt?.logs || []) {
    if (String(log.address).toLowerCase() !== FELT_TOKEN.toLowerCase() || log.topics?.[0] !== TRANSFER_TOPIC) continue;
    const from = `0x${String(log.topics[1] || "").slice(26)}`.toLowerCase();
    if (from !== FLOOR.toLowerCase()) continue;
    paid = BigInt(log.data);
    winner = `0x${String(log.topics[2] || "").slice(26)}`;
  }
  await say([
    "<b>FELT</b>",
    "LOTTERY",
    RULE,
    paid > 0n ? `<b>${feltLine(paid)} drawn</b>` : "The draw paid nothing.",
    paid > 0n ? `Winner ${shortAddress(winner)}` : "No ticket was paid.",
    "90% left the pot. 10% stayed.",
    "Cronos · covenantfelt.xyz",
  ].filter(Boolean).join("\n"));
}

async function scan() {
  const tip = Number(await rpc("eth_blockNumber", []));
  if (!state.block || state.block > tip) state.block = tip;
  let from = state.block + 1;
  while (from <= tip) {
    const to = Math.min(tip, from + 199);
    const logs = await rpc("eth_getLogs", [{
      address: FLOOR,
      fromBlock: `0x${from.toString(16)}`,
      toBlock: `0x${to.toString(16)}`,
      topics: [[PLAY_TOPIC, HOUSE_TOPIC]],
    }]);
    for (const log of logs) await announce(log);
    for (let n = from; n <= to; n += 1) {
      const block = await rpc("eth_getBlockByNumber", [`0x${n.toString(16)}`, true]);
      for (const tx of block?.transactions || []) {
        if (String(tx.to || "").toLowerCase() !== FLOOR.toLowerCase()) continue;
        await onFloorTx(tx);
      }
    }
    state.block = to;
    from = to + 1;
  }
}

async function roll() {
  const nowHour = hourKey();
  const nowDay = dayKey();
  if (state.hourKey !== nowHour) {
    if (state.hour.rounds) await say(report(`HOUR ${state.hourKey.replace("T", " ")}:00 UTC`, state.hour));
    state.hour = emptyBucket();
    state.hourKey = nowHour;
  }
  if (state.dayKey !== nowDay) {
    if (state.day.rounds) await say(report(`DAY ${state.dayKey}`, state.day));
    state.day = emptyBucket();
    state.dayKey = nowDay;
  }
}

async function tick() {
  await scan();
  await roll();
  await save();
}

export async function runOnce() {
  if (!TOKEN || !CHAT) throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required.");
  await load();
  await tick();
  console.log(`Cronos announcer checked through block ${state.block}`);
}

export function startCronos() {
  if (started || process.env.CRONOS_WATCH !== "1") return;
  if (!TOKEN || !CHAT) {
    console.error("Cronos announcer needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.");
    return;
  }
  started = true;
  const loop = async () => {
    await load();
    console.log(`Cronos announcer watching ${FLOOR} from block ${state.block}`);
    for (;;) {
      try {
        await tick();
      } catch (error) {
        console.error("cronos", error.message);
      }
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  };
  loop().catch((error) => console.error("cronos", error.message));
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  const job = process.env.CRONOS_ONCE === "1" ? runOnce() : (process.env.CRONOS_WATCH = "1", startCronos(), new Promise(() => {}));
  Promise.resolve(job).catch((error) => {
    console.error("cronos", error.message);
    process.exitCode = 1;
  });
}
