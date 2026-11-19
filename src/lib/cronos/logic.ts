/** Covenant Floor rules, integer FELT (18 decimals), same payouts as the Supra floor. */

export const UNIT = 10n ** 18n;
export const MIN_BET = UNIT;
export const MAX_BET = 500_000n * UNIT;
export const KENO_MAX = 10_000n * UNIT;
export const POKER_MAX_ANTE = 5_000n * UNIT;
export const PVP_MIN = 20n * UNIT;
export const PVP_MAX = 50_000n * UNIT;
export const SCROLL = 1_000n * UNIT;
export const FAITH_UNIT = 1_000_000n * UNIT;
export const FAITH_MIN = 20_000_000n * UNIT;
export const SCALE = 1_000_000_000_000n;
export const JOB_REVIEW_MS = 48 * 60 * 60 * 1000;
export const JOB_MAX = 48;
export const SEAT_ADDR = [
  "0x00000000000000000000000000000000000000a1",
  "0x00000000000000000000000000000000000000b2",
] as const;
export const DAY = 86_400_000;

export type SeatId = 0 | 1;
export type Tone = "win" | "loss" | "push" | "live";

export type Last = { title: string; line: string; tone: Tone; game: string };

export type Hilo = { card: number; stake: bigint; mult: number; alive: boolean };
export type Mines = {
  stake: bigint;
  cells: number;
  mines: number;
  revealed: number[];
  mult: number;
  alive: boolean;
  boom: number | null;
};
export type Bj = {
  phase: 0 | 1;
  hands: number[][];
  bets: bigint[];
  naturals: boolean[];
  active: number;
  dealer: number[];
  used: number[];
};
export type Poker = {
  phase: 0 | 1;
  ante: bigint;
  hole: number[];
  dealer: number[];
  board: number[];
  deck: number[];
  scoreP: number;
  scoreD: number;
};
export type Table = {
  phase: 0 | 1 | 2;
  in: [boolean, boolean];
  bet: [bigint, bigint];
  hands: [number[], number[]];
  done: [boolean, boolean];
  dealer: number[];
  used: number[];
};
export type Pvp = {
  phase: number;
  host: SeatId;
  buy: bigint;
  stack: [bigint, bigint];
  pot: bigint;
  hole: [number[], number[]];
  board: number[];
  street: [bigint, bigint];
  committed: [bigint, bigint];
  current: bigint;
  toAct: SeatId;
  acted: [boolean, boolean];
  bb: bigint;
  deck: number[];
  allIn: [boolean, boolean];
};
export type Job = {
  id: number;
  creator: SeatId;
  brief: string;
  pay: bigint;
  deadline: number;
  submittedAt: number;
  worker: SeatId | null;
  work: string;
  reason: string;
  state: 0 | 1 | 2 | 3;
};
export type Contest = {
  id: number;
  name: string;
  creator: SeatId;
  prize: bigint;
  start: number;
  end: number;
  net: [bigint, bigint];
  wins: [number, number];
  played: [boolean, boolean];
  settled: boolean;
};
export type Lock = {
  tier: 1 | 2 | 3;
  amount: bigint;
  weight: bigint;
  unlockAt: number;
  index: bigint;
};
export type Pilgrim = { tier: 1 | 2 | 3; amount: bigint; unlockAt: number };
export type Tithe = { paid: number; bonus: number; escrow: bigint };
export type Seat = {
  wallet: bigint;
  vault: bigint;
  cro: bigint;
  lock: Lock | null;
  faith: bigint;
  pilgrims: Pilgrim[];
  tithe: Tithe | null;
};
export type Proposal = {
  to: string;
  amount: bigint;
  sigs: [boolean, boolean, boolean];
};
export type Ticket = { seat: SeatId; n: number };

export type State = {
  seats: [Seat, Seat];
  acting: SeatId;
  bank: bigint;
  burned: bigint;
  buyback: bigint;
  stakers: bigint;
  weight: bigint;
  index: bigint;
  nonce: number;
  round: number;
  pot: bigint;
  tickets: Ticket[];
  totalTickets: number;
  hilo: [Hilo | null, Hilo | null];
  mines: [Mines | null, Mines | null];
  bj: [Bj | null, Bj | null];
  poker: [Poker | null, Poker | null];
  table: Table;
  pvp: Pvp | null;
  jobs: Job[];
  nextJob: number;
  contests: Contest[];
  nextContest: number;
  proposal: Proposal | null;
  log: { id: number; game: string; line: string; delta: string }[];
  nextLog: number;
  last: Last;
  error: string;
  address: string;
  chainOk: boolean;
  contract: string;
  chainWallet: bigint;
  chainVault: bigint;
  chainBank: bigint;
  chainBurned: bigint;
  chainBuyback: bigint;
  chainStakers: bigint;
  chainCro: bigint;
};

export type Action =
  | { type: "hydrate"; state: State }
  | { type: "act"; seat: SeatId }
  | { type: "wallet"; address: string; chainOk: boolean }
  | { type: "contract"; address: string }
  | { type: "deposit"; amount: bigint }
  | { type: "withdraw"; amount: bigint }
  | { type: "dice"; mode: number; target: number; stake: bigint }
  | { type: "roulette"; kind: number; pick: number; stake: bigint }
  | { type: "slots"; stake: bigint }
  | { type: "plinko"; difficulty: number; stake: bigint }
  | { type: "keno"; picks: number[]; stake: bigint }
  | { type: "baccarat"; side: number; stake: bigint }
  | { type: "hilo-deal"; stake: bigint }
  | { type: "hilo-guess"; higher: boolean }
  | { type: "hilo-cash" }
  | { type: "mines-start"; stake: bigint }
  | { type: "mines-reveal"; tile: number }
  | { type: "mines-cash" }
  | { type: "bj-deal"; stake: bigint }
  | { type: "bj-hit" }
  | { type: "bj-stand" }
  | { type: "bj-double" }
  | { type: "bj-split" }
  | { type: "poker-deal"; ante: bigint }
  | { type: "poker-call" }
  | { type: "poker-fold" }
  | { type: "table-sit"; seat: SeatId; stake: bigint }
  | { type: "table-hit" }
  | { type: "table-stand" }
  | { type: "table-double" }
  | { type: "table-leave" }
  | { type: "pvp-host"; buy: bigint }
  | { type: "pvp-join" }
  | { type: "pvp-leave" }
  | { type: "pvp-check" }
  | { type: "pvp-call" }
  | { type: "pvp-raise"; extra: bigint }
  | { type: "pvp-allin" }
  | { type: "pvp-fold" }
  | { type: "scroll-pay"; n: number }
  | { type: "scroll-burn"; n: number }
  | { type: "scroll-both"; pay: number; burn: number }
  | { type: "draw" }
  | { type: "faith-spend"; n: number }
  | { type: "job-open"; brief: string; hours: number; pay: bigint }
  | { type: "job-submit"; id: number; work: string }
  | { type: "job-approve"; id: number }
  | { type: "job-reject"; id: number; reason: string }
  | { type: "job-settle"; id: number }
  | { type: "job-cancel"; id: number }
  | { type: "contest-open"; name: string; hours: number; prize: bigint }
  | { type: "contest-claim"; id: number }
  | { type: "stake"; tier: 1 | 2 | 3; cro: bigint }
  | { type: "stake-claim" }
  | { type: "unstake" }
  | { type: "tithe"; tier: number }
  | { type: "tithe-custom"; scrolls: number }
  | { type: "tithe-allocate"; n: number }
  | { type: "tithe-close" }
  | { type: "pilgrim"; tier: 1 | 2 | 3; amount: bigint }
  | { type: "pilgrim-claim"; index: number }
  | { type: "house-propose"; owner: 0 | 1 | 2; to: string; amount: bigint }
  | { type: "house-sign"; owner: 0 | 1 | 2 }
  | { type: "house-reject"; owner: 0 | 1 | 2 }
  | { type: "house-execute"; owner: 0 | 1 | 2 }
  | { type: "chain-play"; game: string; line: string; stake: bigint; payout: bigint }
  | { type: "synced"; wallet: bigint; vault: bigint; bank: bigint; burned: bigint; buyback: bigint; stakers: bigint; cro: bigint }
  | { type: "reset" };

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function rnd(max: number): number {
  if (max <= 1) return 0;
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0] ?? 0;
  } while (x >= limit);
  return x % max;
}

export function formatCro(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = ((wei % 10n ** 18n) / 10n ** 14n).toString().padStart(4, "0").replace(/0+$/, "");
  return frac ? `${whole.toString()}.${frac}` : whole.toString();
}

export function formatFelt(q: bigint): string {
  const neg = q < 0n;
  const v = neg ? -q : q;
  const whole = v / UNIT;
  const frac = (v % UNIT).toString().padStart(18, "0").replace(/0+$/, "").slice(0, 6).replace(/0+$/, "");
  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = frac ? `${wholeText}.${frac}` : wholeText;
  return neg ? `-${body}` : body;
}

export function parseFelt(raw: string): bigint {
  const value = raw.trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(value)) throw new Error("Enter FELT with up to 6 decimal places.");
  const [w = "0", f = ""] = value.split(".");
  return BigInt(w) * UNIT + BigInt(f.padEnd(18, "0"));
}

function bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

function emptySeat(wallet: bigint, vault: bigint, cro = 0n): Seat {
  return { wallet, vault, cro, lock: null, faith: 0n, pilgrims: [], tithe: null };
}

function emptyTable(): Table {
  return {
    phase: 0,
    in: [false, false],
    bet: [0n, 0n],
    hands: [[], []],
    done: [false, false],
    dealer: [],
    used: [],
  };
}

export function initialState(): State {
  return {
    seats: [emptySeat(0n, 0n), emptySeat(0n, 0n)],
    acting: 0,
    bank: 0n,
    burned: 0n,
    buyback: 0n,
    stakers: 0n,
    weight: 0n,
    index: 0n,
    nonce: 0,
    round: 1,
    pot: 0n,
    tickets: [],
    totalTickets: 0,
    hilo: [null, null],
    mines: [null, null],
    bj: [null, null],
    poker: [null, null],
    table: emptyTable(),
    pvp: null,
    jobs: [],
    nextJob: 1,
    contests: [],
    nextContest: 1,
    proposal: null,
    log: [],
    nextLog: 1,
    last: { title: "READY", line: "Lottery is first. Tables use the house rules.", tone: "live", game: "lottery" },
    error: "",
    address: "",
    chainOk: false,
    contract: "",
    chainWallet: 0n,
    chainVault: 0n,
    chainBank: 0n,
    chainBurned: 0n,
    chainBuyback: 0n,
    chainStakers: 0n,
    chainCro: 0n,
  };
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

export function reduce(state: State, action: Action, now = Date.now()): State {
  try {
    if (action.type === "hydrate") return action.state;
    if (action.type === "reset") return initialState();
    const next = clone(state);
    next.error = "";
    apply(next, action, now);
    return next;
  } catch (error) {
    return { ...state, error: error instanceof Error ? error.message : "The floor refused that." };
  }
}

function apply(s: State, a: Action, now: number) {
  const me = s.acting;
  switch (a.type) {
    case "act":
      s.acting = a.seat;
      return;
    case "wallet":
      s.address = a.address;
      s.chainOk = a.chainOk;
      if (!a.address) {
        s.chainWallet = 0n;
        s.chainVault = 0n;
        s.chainCro = 0n;
        s.last = { title: "READY", line: "Connect a Cronos wallet. A wager needs FELT in the vault.", tone: "live", game: "lottery" };
      }
      return;
    case "contract":
      s.contract = a.address.trim();
      return;
    case "synced":
      s.chainWallet = a.wallet;
      s.chainVault = a.vault;
      s.chainBank = a.bank;
      s.chainBurned = a.burned;
      s.chainBuyback = a.buyback;
      s.chainStakers = a.stakers;
      s.chainCro = a.cro;
      return;
    case "chain-play":
      note(s, a.game, a.line, a.payout - a.stake, toneOf(a.payout, a.stake));
      return;
    case "deposit":
      takeWallet(s, me, a.amount);
      s.seats[me].vault += a.amount;
      note(s, "wallet", `Deposited ${formatFelt(a.amount)} FELT into the vault.`, 0n, "push");
      return;
    case "withdraw":
      takeVault(s, me, a.amount);
      s.seats[me].wallet += a.amount;
      note(s, "wallet", `Withdrew ${formatFelt(a.amount)} FELT to the wallet.`, 0n, "push");
      return;
    case "dice":
      return playInstant(s, me, a.stake, 36n, () => rollDice(a.mode, a.target, a.stake));
    case "roulette":
      return playInstant(s, me, a.stake, 36n, () => rollRoulette(a.kind, a.pick, a.stake));
    case "slots":
      return playInstant(s, me, a.stake, 25n, () => rollSlots(a.stake));
    case "plinko":
      return playInstant(s, me, a.stake, 34n, () => rollPlinko(a.difficulty, a.stake));
    case "keno":
      return playKeno(s, me, a.picks, a.stake);
    case "baccarat":
      return playInstant(s, me, a.stake, 9n, () => rollBaccarat(a.side, a.stake));
    case "hilo-deal":
      return hiloDeal(s, me, a.stake);
    case "hilo-guess":
      return hiloGuess(s, me, a.higher);
    case "hilo-cash":
      return hiloCash(s, me);
    case "mines-start":
      return minesStart(s, me, a.stake);
    case "mines-reveal":
      return minesReveal(s, me, a.tile);
    case "mines-cash":
      return minesCash(s, me);
    case "bj-deal":
      return bjDeal(s, me, a.stake);
    case "bj-hit":
      return bjHit(s, me);
    case "bj-stand":
      return bjStand(s, me);
    case "bj-double":
      return bjDouble(s, me);
    case "bj-split":
      return bjSplit(s, me);
    case "poker-deal":
      return pokerDeal(s, me, a.ante);
    case "poker-call":
      return pokerCall(s, me);
    case "poker-fold":
      return pokerFold(s, me);
    case "table-sit":
      return tableSit(s, a.seat, a.stake);
    case "table-hit":
      return tableHit(s);
    case "table-stand":
      return tableStand(s);
    case "table-double":
      return tableDouble(s);
    case "table-leave":
      return tableLeave(s);
    case "pvp-host":
      return pvpHost(s, a.buy);
    case "pvp-join":
      return pvpJoin(s);
    case "pvp-leave":
      return pvpLeave(s);
    case "pvp-check":
      return pvpAct(s, "check", 0n);
    case "pvp-call":
      return pvpAct(s, "call", 0n);
    case "pvp-raise":
      return pvpAct(s, "raise", a.extra);
    case "pvp-allin":
      return pvpAct(s, "allin", 0n);
    case "pvp-fold":
      return pvpAct(s, "fold", 0n);
    case "scroll-pay":
      return scrolls(s, me, a.n, 0, now);
    case "scroll-burn":
      return scrolls(s, me, 0, a.n, now);
    case "scroll-both":
      return scrolls(s, me, a.pay, a.burn, now);
    case "draw":
      return draw(s);
    case "faith-spend":
      return spendFaith(s, me, a.n);
    case "job-open":
      return jobOpen(s, me, a.brief, a.hours, a.pay, now);
    case "job-submit":
      return jobSubmit(s, me, a.id, a.work, now);
    case "job-approve":
      return jobApprove(s, me, a.id, now);
    case "job-reject":
      return jobReject(s, me, a.id, a.reason, now);
    case "job-settle":
      return jobSettle(s, a.id, now);
    case "job-cancel":
      return jobCancel(s, me, a.id);
    case "contest-open":
      return contestOpen(s, me, a.name, a.hours, a.prize, now);
    case "contest-claim":
      return contestClaim(s, a.id, now);
    case "stake":
      return stakeLock(s, me, a.tier, a.cro, now);
    case "stake-claim":
      return stakeClaim(s, me);
    case "unstake":
      return unstake(s, me, now);
    case "tithe":
      return tithePack(s, me, a.tier);
    case "tithe-custom":
      return titheCustom(s, me, a.scrolls);
    case "tithe-allocate":
      return titheAllocate(s, me, a.n);
    case "tithe-close":
      return titheClose(s, me);
    case "pilgrim":
      return pilgrimBegin(s, me, a.tier, a.amount, now);
    case "pilgrim-claim":
      return pilgrimClaim(s, me, a.index, now);
    case "house-propose":
      return housePropose(s, a.owner, a.to, a.amount);
    case "house-sign":
      return houseSign(s, a.owner);
    case "house-reject":
      return houseReject(s, a.owner);
    case "house-execute":
      return houseExecute(s, a.owner);
    default:
      return;
  }
}

function seat(s: State, id: SeatId): Seat {
  return s.seats[id];
}

function takeWallet(s: State, id: SeatId, amount: bigint) {
  if (amount <= 0n) throw new Error("Amount must be greater than zero.");
  const p = seat(s, id);
  if (p.wallet < amount) throw new Error("Wallet does not hold that much FELT.");
  p.wallet -= amount;
}

function takeVault(s: State, id: SeatId, amount: bigint) {
  if (amount <= 0n) throw new Error("Amount must be greater than zero.");
  const p = seat(s, id);
  if (p.vault < amount) throw new Error("Vault does not hold that much FELT.");
  p.vault -= amount;
}

function cover(s: State, need: bigint) {
  if (s.bank < need) throw new Error("The house bank cannot cover that payout.");
}

function stakeIn(s: State, id: SeatId, amount: bigint) {
  takeVault(s, id, amount);
  s.bank += amount;
  s.nonce += 1;
}

function credit(s: State, id: SeatId, amount: bigint) {
  if (amount === 0n) return;
  if (s.bank < amount) throw new Error("The house bank cannot pay that.");
  s.bank -= amount;
  seat(s, id).vault += amount;
}

function skim(s: State, stakeAmt: bigint, payout: bigint) {
  if (payout >= stakeAmt) return;
  const profit = stakeAmt - payout;
  const burn = (profit * 1500n) / 10000n;
  const buy = (profit * 500n) / 10000n;
  const staked = (profit * 1000n) / 10000n;
  const take = burn + buy + staked;
  if (take === 0n) return;
  if (s.bank < take) throw new Error("The house bank cannot split that loss.");
  s.bank -= take;
  s.burned += burn;
  s.buyback += buy;
  s.stakers += staked;
  if (staked > 0n && s.weight > 0n) s.index += (staked * SCALE) / s.weight;
}

function record(s: State, id: SeatId, stakeAmt: bigint, payout: bigint, now?: number) {
  const t = now ?? Date.now();
  for (const c of s.contests) {
    if (c.settled || t < c.start || t > c.end) continue;
    c.net[id] += payout - stakeAmt;
    c.played[id] = true;
    if (payout > stakeAmt) c.wins[id] += 1;
  }
}

function note(s: State, game: string, line: string, delta: bigint, tone: Tone, title?: string) {
  const heading = title ?? (tone === "win" ? "YOU WON" : tone === "loss" ? "YOU LOST" : tone === "push" ? "PUSH" : "IN PLAY");
  s.last = { title: heading, line, tone, game };
  s.log = [{ id: s.nextLog++, game, line, delta: delta.toString() }, ...s.log].slice(0, 8);
}

function toneOf(payout: bigint, stakeAmt: bigint): Tone {
  if (payout > stakeAmt) return "win";
  if (payout === 0n) return "loss";
  if (payout === stakeAmt) return "push";
  return "loss";
}

export function resultLine(payout: bigint, stakeAmt: bigint, extra: string): string {
  if (payout > stakeAmt) return `${extra} ${formatFelt(payout)} FELT paid back. Profit ${formatFelt(payout - stakeAmt)}.`;
  if (payout === stakeAmt && payout > 0n) return `${extra} ${formatFelt(payout)} FELT came back.`;
  if (payout > 0n) return `${extra} ${formatFelt(payout)} FELT came back from ${formatFelt(stakeAmt)}.`;
  return `${extra} ${formatFelt(stakeAmt)} FELT stayed with the house.`;
}

function playInstant(s: State, id: SeatId, stakeAmt: bigint, mult: bigint, roll: () => { game: string; line: string; payout: bigint }) {
  checkBet(stakeAmt);
  cover(s, stakeAmt * mult);
  stakeIn(s, id, stakeAmt);
  const rolled = roll();
  credit(s, id, rolled.payout);
  skim(s, stakeAmt, rolled.payout);
  record(s, id, stakeAmt, rolled.payout);
  note(s, rolled.game, resultLine(rolled.payout, stakeAmt, rolled.line), rolled.payout - stakeAmt, toneOf(rolled.payout, stakeAmt));
}

function checkBet(stakeAmt: bigint) {
  if (stakeAmt < MIN_BET || stakeAmt > MAX_BET) throw new Error("Wager is 1 to 500,000 FELT.");
}

function rollDice(mode: number, target: number, stakeAmt: bigint) {
  const sum = rnd(6) + 1 + rnd(6) + 1;
  let win = false;
  if (mode === 0) win = sum < 7;
  else if (mode === 1) win = sum > 7;
  else if (mode === 2) win = sum === 7;
  else if (mode === 3) {
    if (target < 2 || target > 12) throw new Error("Exact sum is 2 to 12.");
    win = sum === target;
  } else throw new Error("Pick a dice call.");
  const ways = sum <= 7 ? sum - 1 : 13 - sum;
  let payout = 0n;
  if (win) {
    if (mode === 0 || mode === 1) payout = (stakeAmt * 230n) / 100n;
    else if (mode === 2) payout = (stakeAmt * 576n) / 100n;
    else payout = (stakeAmt * 36n * 96n) / BigInt(ways) / 100n;
  }
  const call = mode === 0 ? "Under 7" : mode === 1 ? "Over 7" : mode === 2 ? "Exact 7" : `Exact ${target}`;
  return { game: "dice", payout, line: `${call}. Dice summed to ${sum}.` };
}

function rollRoulette(kind: number, pick: number, stakeAmt: bigint) {
  const n = rnd(37);
  let payout = 0n;
  if (kind === 0) {
    if (pick < 0 || pick > 36) throw new Error("A straight bet is 0 to 36.");
    if (pick === n) payout = stakeAmt * 36n;
  } else if (n !== 0 && kind === 1 && RED.has(n)) payout = stakeAmt * 2n;
  else if (n !== 0 && kind === 2 && !RED.has(n)) payout = stakeAmt * 2n;
  else if (n !== 0 && kind === 3 && n % 2 === 0) payout = stakeAmt * 2n;
  else if (n !== 0 && kind === 4 && n % 2 === 1) payout = stakeAmt * 2n;
  else if (kind === 5) {
    if (pick < 1 || pick > 3) throw new Error("A dozen is 1, 2, or 3.");
    if (n !== 0) {
      const dozen = n <= 12 ? 1 : n <= 24 ? 2 : 3;
      if (dozen === pick) payout = stakeAmt * 3n;
    }
  } else if (kind !== 1 && kind !== 2 && kind !== 3 && kind !== 4) throw new Error("Pick a roulette bet.");
  const color = n === 0 ? "green" : RED.has(n) ? "red" : "black";
  return { game: "roulette", payout, line: `Ball landed on ${n}, ${color}.` };
}

const SLOT = ["7", "BAR", "GEM", "BELL", "STAR", "DROP", "SPADE"];

function rollSlots(stakeAmt: bigint) {
  const a = rnd(7);
  const b = rnd(7);
  const c = rnd(7);
  let payout = 0n;
  if (a === b && b === c) {
    if (a === 0) payout = stakeAmt * 25n;
    else if (a === 1) payout = stakeAmt * 10n;
    else if (a === 2 || a === 3) payout = stakeAmt * 5n;
    else payout = stakeAmt * 2n;
  } else if (a === b || b === c || a === c) payout = (stakeAmt * 15n) / 10n;
  return { game: "slots", payout, line: `Reels ${SLOT[a]} · ${SLOT[b]} · ${SLOT[c]}.` };
}

function plinkoMilli(diff: number, bucket: number): bigint {
  const table =
    diff === 0
      ? [8300n, 2600n, 1400n, 620n, 520n, 620n, 1400n, 2600n, 8300n]
      : diff === 1
        ? [20400n, 3400n, 1700n, 340n, 250n, 340n, 1700n, 3400n, 20400n]
        : [34000n, 5100n, 1700n, 120n, 50n, 120n, 1700n, 5100n, 34000n];
  return table[bucket] ?? 0n;
}

function rollPlinko(diff: number, stakeAmt: bigint) {
  if (diff < 0 || diff > 2) throw new Error("Pick a board.");
  let bucket = 0;
  for (let i = 0; i < 8; i++) bucket += rnd(2);
  const payout = (stakeAmt * plinkoMilli(diff, bucket)) / 1000n;
  return { game: "plinko", payout, line: `The ball finished in bucket ${bucket}.` };
}

function popcount(mask: number): number {
  let n = 0;
  let v = mask;
  while (v > 0) {
    n += v & 1;
    v >>= 1;
  }
  return n;
}

function kenoX100(picks: number, hits: number): bigint {
  if (hits === 0) return 0n;
  if (picks === 1) return hits === 1 ? 340n : 0n;
  if (picks === 2) return hits === 2 ? 1000n : 0n;
  if (picks === 3) return hits === 2 ? 200n : hits === 3 ? 2500n : 0n;
  if (picks === 4) return hits === 2 ? 150n : hits === 3 ? 500n : hits === 4 ? 5000n : 0n;
  if (hits === picks) return 8000n;
  if (hits + 1 === picks) return 400n;
  if (hits + 2 >= picks && hits >= 2) return 150n;
  return 0n;
}

function playKeno(s: State, id: SeatId, picks: number[], stakeAmt: bigint) {
  if (stakeAmt < MIN_BET || stakeAmt > KENO_MAX) throw new Error("Keno wager is 1 to 10,000 FELT.");
  const unique = [...new Set(picks)].filter((n) => n >= 1 && n <= 40);
  if (unique.length < 1 || unique.length > 10 || unique.length !== picks.length) throw new Error("Choose 1 to 10 numbers from 1 to 40.");
  cover(s, stakeAmt * 80n);
  stakeIn(s, id, stakeAmt);
  let drawn = 0;
  let n = 0;
  while (n < 10) {
    const bit = 1 << rnd(40);
    if ((drawn & bit) === 0) {
      drawn |= bit;
      n += 1;
    }
  }
  let mask = 0;
  for (const pick of unique) mask |= 1 << (pick - 1);
  const hits = popcount(mask & drawn);
  const payout = (stakeAmt * kenoX100(unique.length, hits)) / 100n;
  credit(s, id, payout);
  skim(s, stakeAmt, payout);
  record(s, id, stakeAmt, payout);
  note(s, "keno", resultLine(payout, stakeAmt, `${hits} of ${unique.length} hit.`), payout - stakeAmt, toneOf(payout, stakeAmt));
}

function pip(card: number): number {
  const r = card % 13;
  if (r === 0) return 1;
  if (r >= 9) return 0;
  return r + 1;
}

function bankerDraws(bt: number, drew: boolean, p3: number): boolean {
  if (!drew) return bt <= 5;
  const p = pip(p3);
  if (bt <= 2) return true;
  if (bt === 3) return p !== 8;
  if (bt === 4) return p >= 2 && p <= 7;
  if (bt === 5) return p >= 4 && p <= 7;
  if (bt === 6) return p === 6 || p === 7;
  return false;
}

function rollBaccarat(side: number, stakeAmt: bigint) {
  if (side < 0 || side > 2) throw new Error("Back player, banker, or tie.");
  const used = new Set<number>();
  const draw = () => {
    for (let i = 0; i < 80; i++) {
      const c = rnd(52);
      if (!used.has(c)) {
        used.add(c);
        return c;
      }
    }
    throw new Error("Shoe empty.");
  };
  const p1 = draw();
  const b1 = draw();
  const p2 = draw();
  const b2 = draw();
  let pt = (pip(p1) + pip(p2)) % 10;
  let bt = (pip(b1) + pip(b2)) % 10;
  const natural = pt >= 8 || bt >= 8;
  let p3 = 0;
  let drew = false;
  if (!natural && pt <= 5) {
    p3 = draw();
    drew = true;
    pt = (pt + pip(p3)) % 10;
  }
  if (!natural && bankerDraws(bt, drew, p3)) bt = (bt + pip(draw())) % 10;
  let payout = 0n;
  if (pt === bt) payout = side === 2 ? stakeAmt * 9n : stakeAmt;
  else if (side === 0 && pt > bt) payout = stakeAmt * 2n;
  else if (side === 1 && bt > pt) payout = stakeAmt * 2n;
  const who = side === 0 ? "Player" : side === 1 ? "Banker" : "Tie";
  return { game: "baccarat", payout, line: `${who}. Player ${pt}, banker ${bt}.` };
}

function hiloDeal(s: State, id: SeatId, stakeAmt: bigint) {
  checkBet(stakeAmt);
  const open = s.hilo[id];
  if (open?.alive) throw new Error("Finish the open Hi-Lo hand first.");
  cover(s, stakeAmt * 20n);
  stakeIn(s, id, stakeAmt);
  s.hilo[id] = { card: rnd(13) + 1, stake: stakeAmt, mult: 1000, alive: true };
  note(s, "hi-lo", `Card is ${rankName(s.hilo[id]!.card)}. Call higher or lower, or cash out.`, 0n, "live", "CARD IS OUT");
}

function hiloGuess(s: State, id: SeatId, higher: boolean) {
  const h = s.hilo[id];
  if (!h?.alive) throw new Error("Deal a Hi-Lo hand first.");
  const next = rnd(13) + 1;
  if (next === h.card) h.card = next;
  else if ((higher && next > h.card) || (!higher && next < h.card)) {
    h.mult = Math.min(20000, Math.floor((h.mult * 19) / 10));
    h.card = next;
  } else {
    h.alive = false;
    h.mult = 0;
    h.card = next;
    skim(s, h.stake, 0n);
    record(s, id, h.stake, 0n);
    note(s, "hi-lo", `The next card was ${rankName(next)}. ${formatFelt(h.stake)} FELT stayed with the house.`, -h.stake, "loss");
    return;
  }
  note(s, "hi-lo", `Card is ${rankName(h.card)}. Cash out pays ${formatFelt((h.stake * BigInt(h.mult)) / 1000n)} FELT.`, 0n, "live", "CARD IS OUT");
}

function hiloCash(s: State, id: SeatId) {
  const h = s.hilo[id];
  if (!h?.alive) throw new Error("No Hi-Lo hand is open.");
  const payout = (h.stake * BigInt(h.mult)) / 1000n;
  h.alive = false;
  credit(s, id, payout);
  skim(s, h.stake, payout);
  record(s, id, h.stake, payout);
  note(s, "hi-lo", resultLine(payout, h.stake, `Cashed out on ${rankName(h.card)}.`), payout - h.stake, toneOf(payout, h.stake));
}

function rankName(card: number): string {
  if (card === 1 || card === 14) return "A";
  if (card === 11) return "J";
  if (card === 12) return "Q";
  if (card === 13) return "K";
  return String(card);
}

function minesStart(s: State, id: SeatId, stakeAmt: bigint) {
  checkBet(stakeAmt);
  if (s.mines[id]?.alive) throw new Error("Finish the open mines round first.");
  cover(s, stakeAmt * 20n);
  stakeIn(s, id, stakeAmt);
  s.mines[id] = { stake: stakeAmt, cells: 25, mines: 3, revealed: [], mult: 1000, alive: true, boom: null };
  note(s, "mines", "Board is open. Reveal a tile, then cash out before a mine.", 0n, "live", "BOARD IS OPEN");
}

function minesReveal(s: State, id: SeatId, tile: number) {
  const m = s.mines[id];
  if (!m?.alive) throw new Error("Start a mines round first.");
  if (tile < 0 || tile > 24) throw new Error("Tile is 0 to 24.");
  if (m.revealed.includes(tile)) throw new Error("That tile is already open.");
  m.revealed = [...m.revealed, tile];
  const boom = rnd(m.cells) < m.mines;
  if (boom) {
    m.alive = false;
    m.mult = 0;
    m.boom = tile;
    skim(s, m.stake, 0n);
    record(s, id, m.stake, 0n);
    note(s, "mines", `Tile ${tile} was a mine. ${formatFelt(m.stake)} FELT stayed with the house.`, -m.stake, "loss");
    return;
  }
  const safe = m.cells - m.mines;
  m.mult = Math.min(20000, Math.floor((m.mult * m.cells) / safe));
  m.cells -= 1;
  if (m.cells === m.mines) {
    const payout = (m.stake * BigInt(m.mult)) / 1000n;
    m.alive = false;
    credit(s, id, payout);
    skim(s, m.stake, payout);
    record(s, id, m.stake, payout);
    note(s, "mines", resultLine(payout, m.stake, "The last safe tile paid the board."), payout - m.stake, toneOf(payout, m.stake));
    return;
  }
  note(s, "mines", `Tile ${tile} is safe. Cash out pays ${formatFelt((m.stake * BigInt(m.mult)) / 1000n)} FELT.`, 0n, "live", "BOARD IS OPEN");
}

function minesCash(s: State, id: SeatId) {
  const m = s.mines[id];
  if (!m?.alive || m.mult <= 1000) throw new Error("Reveal a safe tile before cashing out.");
  const payout = (m.stake * BigInt(m.mult)) / 1000n;
  m.alive = false;
  credit(s, id, payout);
  skim(s, m.stake, payout);
  record(s, id, m.stake, payout);
  note(s, "mines", resultLine(payout, m.stake, "Cashed out."), payout - m.stake, toneOf(payout, m.stake));
}

export function bjTotal(cards: number[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    const r = c % 13;
    if (r === 0) {
      aces += 1;
      total += 11;
    } else if (r >= 9) total += 10;
    else total += r + 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function hardTotal(cards: number[]): number {
  let total = 0;
  for (const c of cards) {
    const r = c % 13;
    if (r === 0) total += 1;
    else if (r >= 9) total += 10;
    else total += r + 1;
  }
  return total;
}

function canDouble(cards: number[]): boolean {
  if (cards.length !== 2) return false;
  const hard = hardTotal(cards);
  return hard >= 9 && hard <= 11 && hard === bjTotal(cards);
}

function drawFresh(used: number[]): number {
  for (let i = 0; i < 80; i++) {
    const c = rnd(52);
    if (!used.includes(c)) {
      used.push(c);
      return c;
    }
  }
  throw new Error("Shoe empty.");
}

function handPay(hv: number, dv: number, bet: bigint, natural: boolean): bigint {
  if (hv > 21) return 0n;
  if (natural && dv !== 21) return (bet * 5n) / 2n;
  if (natural && dv === 21) return bet;
  if (dv > 21 || hv > dv) return bet * 2n;
  if (hv === dv) return bet;
  return 0n;
}

function freshBj(): Bj {
  return { phase: 1, hands: [], bets: [], naturals: [], active: 0, dealer: [], used: [] };
}

function bjDeal(s: State, id: SeatId, stakeAmt: bigint) {
  checkBet(stakeAmt);
  if (stakeAmt % 2n !== 0n) throw new Error("Blackjack wager must be even so a natural can pay 3 to 2.");
  const existing = s.bj[id];
  if (existing && existing.phase !== 0) throw new Error("Finish the open blackjack hand first.");
  cover(s, stakeAmt * 3n);
  stakeIn(s, id, stakeAmt);
  const bj = freshBj();
  const p1 = drawFresh(bj.used);
  const up = drawFresh(bj.used);
  const p2 = drawFresh(bj.used);
  bj.hands = [[p1, p2]];
  bj.dealer = [up];
  bj.bets = [stakeAmt];
  bj.naturals = [bjTotal([p1, p2]) === 21];
  s.bj[id] = bj;
  if (bj.naturals[0]) finishBj(s, id);
  else note(s, "blackjack", `Your ${bjTotal(bj.hands[0]!)}. Dealer shows ${cardLabel(up)}.`, 0n, "live", "HAND IS OPEN");
}

function liveBj(s: State, id: SeatId): Bj {
  const bj = s.bj[id];
  if (!bj || bj.phase !== 1) throw new Error("Deal a blackjack hand first.");
  return bj;
}

function bjHit(s: State, id: SeatId) {
  const bj = liveBj(s, id);
  const hand = bj.hands[bj.active];
  if (!hand) throw new Error("No active hand.");
  hand.push(drawFresh(bj.used));
  const total = bjTotal(hand);
  if (total > 21 || total === 21) advanceBj(s, id);
  else note(s, "blackjack", `Your ${total}. Dealer shows ${cardLabel(bj.dealer[0] ?? 0)}.`, 0n, "live", "HAND IS OPEN");
}

function bjStand(s: State, id: SeatId) {
  liveBj(s, id);
  advanceBj(s, id);
}

function bjDouble(s: State, id: SeatId) {
  const bj = liveBj(s, id);
  const hand = bj.hands[bj.active];
  if (!hand || !canDouble(hand)) throw new Error("Double is only on a hard 9, 10, or 11.");
  const bet = bj.bets[bj.active] ?? 0n;
  cover(s, bet * 3n);
  stakeIn(s, id, bet);
  bj.bets[bj.active] = bet * 2n;
  hand.push(drawFresh(bj.used));
  advanceBj(s, id);
}

function bjSplit(s: State, id: SeatId) {
  const bj = liveBj(s, id);
  if (bj.hands.length !== 1) throw new Error("Split the opening pair only.");
  const hand = bj.hands[0];
  if (!hand || hand.length !== 2 || hand[0]! % 13 !== hand[1]! % 13) throw new Error("Split needs a pair.");
  const bet = bj.bets[0] ?? 0n;
  cover(s, bet * 6n);
  stakeIn(s, id, bet);
  const c0 = hand[0]!;
  const c1 = hand[1]!;
  const rank = c0 % 13;
  bj.hands = [[c0, drawFresh(bj.used)], [c1, drawFresh(bj.used)]];
  bj.bets = [bet, bet];
  bj.naturals = [false, false];
  bj.active = 0;
  if (rank === 0) finishBj(s, id);
  else note(s, "blackjack", "Pair split. Play the first hand.", 0n, "live", "HAND IS OPEN");
}

function advanceBj(s: State, id: SeatId) {
  const bj = s.bj[id];
  if (!bj) return;
  if (bj.active + 1 < bj.hands.length) {
    bj.active += 1;
    const hand = bj.hands[bj.active]!;
    note(s, "blackjack", `Next hand totals ${bjTotal(hand)}.`, 0n, "live", "HAND IS OPEN");
  } else finishBj(s, id);
}

function finishBj(s: State, id: SeatId) {
  const bj = s.bj[id];
  if (!bj) return;
  const need = bj.hands.some((hand) => bjTotal(hand) <= 21);
  if (need) while (bjTotal(bj.dealer) < 17) bj.dealer.push(drawFresh(bj.used));
  const dv = bjTotal(bj.dealer);
  let payout = 0n;
  let stakeSum = 0n;
  bj.hands.forEach((hand, i) => {
    const bet = bj.bets[i] ?? 0n;
    stakeSum += bet;
    payout += handPay(bjTotal(hand), dv, bet, bj.naturals[i] ?? false);
  });
  bj.phase = 0;
  credit(s, id, payout);
  skim(s, stakeSum, payout);
  record(s, id, stakeSum, payout);
  note(s, "blackjack", resultLine(payout, stakeSum, `Dealer finished on ${dv}.`), payout - stakeSum, toneOf(payout, stakeSum));
}

export function cardLabel(c: number): string {
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const suits = ["♠", "♥", "♦", "♣"];
  return `${ranks[c % 13]}${suits[Math.floor(c / 13)] ?? "♠"}`;
}

export function suitWine(c: number): boolean {
  const s = Math.floor(c / 13);
  return s === 1 || s === 2;
}

function scoreFive(cards: number[]): number {
  const count = Array(15).fill(0);
  const suits = [0, 0, 0, 0];
  for (const c of cards) {
    const value = c % 13 === 0 ? 14 : (c % 13) + 1;
    count[value] += 1;
    suits[Math.floor(c / 13)] = (suits[Math.floor(c / 13)] ?? 0) + 1;
  }
  const flush = suits.some((n) => n === 5);
  let straightHigh = 0;
  if (count[14] === 1 && count[2] === 1 && count[3] === 1 && count[4] === 1 && count[5] === 1) straightHigh = 5;
  else {
    for (let high = 14; high >= 6; high--) {
      if ([0, 1, 2, 3, 4].every((d) => count[high - d] === 1)) {
        straightHigh = high;
        break;
      }
    }
  }
  let quads = 0;
  let trips = 0;
  let pairHi = 0;
  let pairLo = 0;
  for (let value = 14; value >= 2; value--) {
    const n = count[value] ?? 0;
    if (n === 4) quads = value;
    else if (n === 3) trips = value;
    else if (n === 2) {
      if (pairHi === 0) pairHi = value;
      else pairLo = value;
    }
  }
  const pack = (cat: number, a: number, b = 0, c = 0, d = 0, e = 0) =>
    (cat << 20) | (a << 16) | (b << 12) | (c << 8) | (d << 4) | e;
  const top = (below = 15) => {
    for (let value = below - 1; value >= 2; value--) if (count[value] === 1) return value;
    return 0;
  };
  if (flush && straightHigh === 14) return pack(9, straightHigh);
  if (flush && straightHigh > 0) return pack(8, straightHigh);
  if (quads > 0) return pack(7, quads, top());
  if (trips > 0 && pairHi > 0) return pack(6, trips, pairHi);
  if (flush) {
    const a = top();
    const b = top(a);
    const c = top(b);
    const d = top(c);
    const e = top(d);
    return pack(5, a, b, c, d, e);
  }
  if (straightHigh > 0) return pack(4, straightHigh);
  if (trips > 0) {
    const a = top();
    return pack(3, trips, a, top(a));
  }
  if (pairHi > 0 && pairLo > 0) return pack(2, pairHi, pairLo, top());
  if (pairHi > 0) {
    const a = top();
    const b = top(a);
    return pack(1, pairHi, a, b, top(b));
  }
  const a = top();
  const b = top(a);
  const c = top(b);
  const d = top(c);
  return pack(0, a, b, c, d, top(d));
}

export function bestPoker(cards: number[]): number {
  if (cards.length < 5) return 0;
  let best = 0;
  const n = cards.length;
  const choose = (start: number, got: number[]) => {
    if (got.length === 5) {
      best = Math.max(best, scoreFive(got));
      return;
    }
    for (let i = start; i < n; i++) choose(i + 1, [...got, cards[i]!]);
  };
  choose(0, []);
  return best;
}

export function handName(score: number): string {
  return ["High card", "Pair", "Two pair", "Trips", "Straight", "Flush", "Full house", "Quads", "Straight flush", "Royal"][score >> 20] ?? "High card";
}

function qualifies(score: number): boolean {
  const cat = score >> 20;
  if (cat >= 2) return true;
  if (cat === 1) return ((score >> 16) & 15) >= 4;
  return false;
}

function odds(score: number): bigint {
  const cat = score >> 20;
  if (cat === 9) return 100n;
  if (cat === 8) return 20n;
  if (cat === 7) return 10n;
  if (cat === 6) return 3n;
  if (cat === 5) return 2n;
  return 1n;
}

export function pokerPayout(playerScore: number, dealerScore: number, ante: bigint, called: boolean): bigint {
  if (!called) return 0n;
  const call = ante * 2n;
  if (!qualifies(dealerScore)) return ante * 2n + call;
  if (playerScore > dealerScore) return ante * (odds(playerScore) + 1n) + call * 2n;
  if (playerScore === dealerScore) return ante + call;
  return 0n;
}

function shuffled(): number[] {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    const a = deck[i]!;
    const b = deck[j]!;
    deck[i] = b;
    deck[j] = a;
  }
  return deck;
}

function takeCard(deck: number[]): number {
  const c = deck.pop();
  if (c === undefined) throw new Error("Shoe empty.");
  return c;
}

function pokerDeal(s: State, id: SeatId, ante: bigint) {
  if (ante < MIN_BET || ante > POKER_MAX_ANTE) throw new Error("Ante is 1 to 5,000 FELT.");
  const open = s.poker[id];
  if (open && open.phase !== 0) throw new Error("Finish the open poker hand first.");
  cover(s, ante * 102n);
  stakeIn(s, id, ante);
  const deck = shuffled();
  const hole = [takeCard(deck), takeCard(deck)];
  const dealer = [takeCard(deck), takeCard(deck)];
  const board = [takeCard(deck), takeCard(deck), takeCard(deck)];
  s.poker[id] = { phase: 1, ante, hole, dealer, board, deck, scoreP: 0, scoreD: 0 };
  note(s, "poker", `Ante ${formatFelt(ante)}. Call for ${formatFelt(ante * 2n)}, or fold.`, 0n, "live", "FLOP IS OUT");
}

function pokerFold(s: State, id: SeatId) {
  const p = s.poker[id];
  if (!p || p.phase !== 1) throw new Error("No poker hand is waiting on a call.");
  p.phase = 0;
  skim(s, p.ante, 0n);
  record(s, id, p.ante, 0n);
  note(s, "poker", `Folded. ${formatFelt(p.ante)} FELT stayed with the house.`, -p.ante, "loss");
}

function pokerCall(s: State, id: SeatId) {
  const p = s.poker[id];
  if (!p || p.phase !== 1) throw new Error("No poker hand is waiting on a call.");
  const call = p.ante * 2n;
  cover(s, p.ante * 102n);
  stakeIn(s, id, call);
  p.board.push(takeCard(p.deck), takeCard(p.deck));
  p.scoreP = bestPoker([...p.hole, ...p.board]);
  p.scoreD = bestPoker([...p.dealer, ...p.board]);
  const payout = pokerPayout(p.scoreP, p.scoreD, p.ante, true);
  p.phase = 0;
  credit(s, id, payout);
  const wager = p.ante + call;
  skim(s, wager, payout);
  record(s, id, wager, payout);
  const q = qualifies(p.scoreD) ? "House qualifies." : "House does not qualify. Ante is paid, call comes back.";
  note(
    s,
    "poker",
    resultLine(payout, wager, `${handName(p.scoreP)} against ${handName(p.scoreD)}. ${q}`),
    payout - wager,
    toneOf(payout, wager),
  );
}

function tableSeatOf(s: State): SeatId {
  const id = s.acting;
  if (!s.table.in[id]) throw new Error("That seat is empty.");
  return id;
}

function maybeDealTable(s: State) {
  const t = s.table;
  if (!t.in[0] || !t.in[1] || t.phase !== 1) return;
  t.used = [];
  t.dealer = [drawFresh(t.used)];
  t.hands = [
    [drawFresh(t.used), drawFresh(t.used)],
    [drawFresh(t.used), drawFresh(t.used)],
  ];
  t.done = [false, false];
  t.phase = 2;
  note(s, "table", "Both seats are in. Hit or stand.", 0n, "live", "HAND IS OPEN");
}

function tableSit(s: State, chair: SeatId, stakeAmt: bigint) {
  if (s.acting !== chair) throw new Error("Switch to that seat before sitting.");
  checkBet(stakeAmt);
  if (stakeAmt % 2n !== 0n) throw new Error("Table wager must be even.");
  const t = s.table;
  if (t.phase === 2) throw new Error("Wait for this shoe to finish.");
  if (t.in[chair]) throw new Error("That seat is taken.");
  cover(s, stakeAmt * 3n);
  stakeIn(s, chair, stakeAmt);
  t.in[chair] = true;
  t.bet[chair] = stakeAmt;
  t.phase = 1;
  maybeDealTable(s);
  if (t.phase === 1) note(s, "table", "One seat is open. The other chair has to sit.", 0n, "live", "WAITING");
}

function tableLeave(s: State) {
  const t = s.table;
  if (t.phase !== 1) throw new Error("You can leave only while the other chair is empty.");
  const id = tableSeatOf(s);
  const bet = t.bet[id];
  t.in[id] = false;
  t.bet[id] = 0n;
  if (!t.in[0] && !t.in[1]) t.phase = 0;
  credit(s, id, bet);
  note(s, "table", "Left the chair. The wager came back.", 0n, "push", "PUSH");
}

function tableHit(s: State) {
  const t = s.table;
  if (t.phase !== 2) throw new Error("The table is not dealing.");
  const id = tableSeatOf(s);
  if (t.done[id]) throw new Error("That seat already stood.");
  t.hands[id].push(drawFresh(t.used));
  if (bjTotal(t.hands[id]) >= 21) t.done[id] = true;
  if (t.done[0] && t.done[1]) finishTable(s);
  else note(s, "table", `Seat ${id} totals ${bjTotal(t.hands[id])}.`, 0n, "live", "HAND IS OPEN");
}

function tableStand(s: State) {
  const t = s.table;
  if (t.phase !== 2) throw new Error("The table is not dealing.");
  const id = tableSeatOf(s);
  if (t.done[id]) throw new Error("That seat already stood.");
  t.done[id] = true;
  if (t.done[0] && t.done[1]) finishTable(s);
  else note(s, "table", `Seat ${id} stands.`, 0n, "live", "HAND IS OPEN");
}

function tableDouble(s: State) {
  const t = s.table;
  if (t.phase !== 2) throw new Error("The table is not dealing.");
  const id = tableSeatOf(s);
  if (t.done[id]) throw new Error("That seat already stood.");
  if (!canDouble(t.hands[id])) throw new Error("Double is only on a hard 9, 10, or 11.");
  const bet = t.bet[id];
  cover(s, bet * 3n);
  stakeIn(s, id, bet);
  t.bet[id] = bet * 2n;
  t.hands[id].push(drawFresh(t.used));
  t.done[id] = true;
  if (t.done[0] && t.done[1]) finishTable(s);
  else note(s, "table", `Seat ${id} doubled.`, 0n, "live", "HAND IS OPEN");
}

function finishTable(s: State) {
  const t = s.table;
  const need = bjTotal(t.hands[0]) <= 21 || bjTotal(t.hands[1]) <= 21;
  if (need) while (bjTotal(t.dealer) < 17) t.dealer.push(drawFresh(t.used));
  const dv = bjTotal(t.dealer);
  const pays: [bigint, bigint] = [0n, 0n];
  ([0, 1] as const).forEach((id) => {
    const natural = t.hands[id].length === 2 && bjTotal(t.hands[id]) === 21;
    pays[id] = handPay(bjTotal(t.hands[id]), dv, t.bet[id], natural);
  });
  ([0, 1] as const).forEach((id) => {
    credit(s, id, pays[id]);
    record(s, id, t.bet[id], pays[id]);
  });
  skim(s, t.bet[0] + t.bet[1], pays[0] + pays[1]);
  t.phase = 0;
  t.in = [false, false];
  t.done = [false, false];
  t.bet = [0n, 0n];
  note(s, "table", `Dealer finished on ${dv}. Seat A ${formatFelt(pays[0])} FELT. Seat B ${formatFelt(pays[1])} FELT.`, pays[s.acting] - 0n, "live", "SHOE CLOSED");
}

function pvpHost(s: State, buy: bigint) {
  if (buy < PVP_MIN || buy > PVP_MAX || buy % UNIT !== 0n) throw new Error("Buy-in is a whole amount from 20 to 50,000 FELT.");
  if (s.pvp && s.pvp.phase !== 0) throw new Error("A heads-up table is already open.");
  const host = s.acting;
  takeVault(s, host, buy);
  const bb = buy / 10n;
  const sb = buy / 20n;
  s.pvp = {
    phase: 1,
    host,
    buy,
    stack: host === 0 ? [buy, 0n] : [0n, buy],
    pot: 0n,
    hole: [[], []],
    board: [],
    street: [0n, 0n],
    committed: [0n, 0n],
    current: 0n,
    toAct: host,
    acted: [false, false],
    bb,
    deck: [],
    allIn: [false, false],
  };
  s.pvp.stack[host] = buy;
  void sb;
  note(s, "duel", `Seat ${host === 0 ? "A" : "B"} hosts for ${formatFelt(buy)} FELT. The other seat matches it.`, 0n, "live", "WAITING");
}

function pvpJoin(s: State) {
  const p = s.pvp;
  if (!p || p.phase !== 1) throw new Error("Nobody is hosting.");
  if (s.acting === p.host) throw new Error("The other seat has to sit.");
  takeVault(s, s.acting, p.buy);
  p.stack[s.acting] = p.buy;
  p.deck = shuffled();
  p.hole = [
    [takeCard(p.deck), takeCard(p.deck)],
    [takeCard(p.deck), takeCard(p.deck)],
  ];
  const sb = p.buy / 20n;
  const bb = p.bb;
  const sbSeat = p.host;
  const bbSeat: SeatId = p.host === 0 ? 1 : 0;
  postBlind(p, sbSeat, sb);
  postBlind(p, bbSeat, bb);
  p.current = bb;
  p.phase = 2;
  p.toAct = sbSeat;
  p.acted = [false, false];
  note(s, "duel", "Cards are out. Small blind acts first.", 0n, "live", "PREFLOP");
}

function postBlind(p: Pvp, id: SeatId, blind: bigint) {
  const pay = p.stack[id] < blind ? p.stack[id] : blind;
  p.stack[id] -= pay;
  p.street[id] += pay;
  p.committed[id] += pay;
  p.pot += pay;
  if (p.stack[id] === 0n) p.allIn[id] = true;
}

function pvpLeave(s: State) {
  const p = s.pvp;
  if (!p || p.phase !== 1) throw new Error("You can leave only before the other seat sits.");
  if (s.acting !== p.host) throw new Error("Only the host can leave.");
  seat(s, p.host).vault += p.buy;
  s.pvp = null;
  note(s, "duel", "Host left. The buy-in came back.", 0n, "push", "PUSH");
}

function pvpAct(s: State, kind: "check" | "call" | "raise" | "allin" | "fold", extra: bigint) {
  const p = s.pvp;
  if (!p || p.phase < 2) throw new Error("No hand is being dealt.");
  if (s.acting !== p.toAct) throw new Error("The other seat acts.");
  const me = s.acting;
  const other: SeatId = me === 0 ? 1 : 0;
  if (kind === "fold") {
    finishPvp(s, other, "fold");
    return;
  }
  const owed = p.current - p.street[me];
  if (kind === "check") {
    if (owed !== 0n) throw new Error("A bet is facing you. Call, raise, or fold.");
    p.acted[me] = true;
  } else if (kind === "call") {
    if (owed === 0n) throw new Error("Nothing to call. Check, or raise.");
    putChips(p, me, owed);
    p.acted[me] = true;
  } else if (kind === "raise" || kind === "allin") {
    const want = kind === "allin" ? p.stack[me] : owed + extra;
    if (want <= 0n || want > p.stack[me]) throw new Error("That raise does not fit the stack.");
    if (kind === "raise") {
      if (extra < p.bb && want !== p.stack[me]) throw new Error(`Minimum raise is ${formatFelt(p.bb)} FELT beyond the call.`);
      if (owed + extra > p.stack[me]) throw new Error("That raise is more than the stack.");
    }
    const before = p.street[me];
    putChips(p, me, want);
    if (p.street[me] > p.current) {
      p.current = p.street[me];
      p.acted = [false, false];
      if (p.street[me] - before < p.bb && p.stack[me] !== 0n && kind !== "allin") {
        throw new Error("Raise was short.");
      }
    }
    p.acted[me] = true;
  }
  if (p.stack[0] === 0n && p.stack[1] === 0n) {
    runout(p);
    showdown(s);
    return;
  }
  if (p.allIn[me] && p.street[other] >= p.current) {
    runout(p);
    showdown(s);
    return;
  }
  if (p.allIn[other] && p.street[me] >= p.street[other]) {
    runout(p);
    showdown(s);
    return;
  }
  if (p.acted[0] && p.acted[1] && p.street[0] === p.street[1]) {
    nextStreet(s);
    return;
  }
  p.toAct = other;
  const street = ["", "", "PREFLOP", "FLOP", "TURN", "RIVER"][p.phase] ?? "BETTING";
  note(s, "duel", `${street}. Pot ${formatFelt(p.pot)}.`, 0n, "live", street);
}

function putChips(p: Pvp, id: SeatId, amount: bigint) {
  const pay = amount > p.stack[id] ? p.stack[id] : amount;
  p.stack[id] -= pay;
  p.street[id] += pay;
  p.committed[id] += pay;
  p.pot += pay;
  if (p.stack[id] === 0n) p.allIn[id] = true;
}

function nextStreet(s: State) {
  const p = s.pvp;
  if (!p) return;
  p.street = [0n, 0n];
  p.current = 0n;
  p.acted = [false, false];
  p.toAct = p.host === 0 ? 1 : 0;
  if (p.phase === 2) {
    p.board = [takeCard(p.deck), takeCard(p.deck), takeCard(p.deck)];
    p.phase = 3;
  } else if (p.phase === 3) {
    p.board.push(takeCard(p.deck));
    p.phase = 4;
  } else if (p.phase === 4) {
    p.board.push(takeCard(p.deck));
    p.phase = 5;
  } else {
    showdown(s);
    return;
  }
  if (p.allIn[0] || p.allIn[1]) {
    runout(p);
    showdown(s);
    return;
  }
  const street = ["", "", "PREFLOP", "FLOP", "TURN", "RIVER"][p.phase] ?? "BETTING";
  note(s, "duel", `${street}. Pot ${formatFelt(p.pot)}. Big blind acts first.`, 0n, "live", street);
}

function runout(p: Pvp) {
  while (p.board.length < 5) {
    if (p.board.length === 0) p.board.push(takeCard(p.deck), takeCard(p.deck), takeCard(p.deck));
    else p.board.push(takeCard(p.deck));
  }
  p.phase = 5;
}

function showdown(s: State) {
  const p = s.pvp;
  if (!p) return;
  if (p.board.length < 5) runout(p);
  const a = bestPoker([...p.hole[0], ...p.board]);
  const b = bestPoker([...p.hole[1], ...p.board]);
  const winner: 0 | 1 | 2 = a > b ? 0 : b > a ? 1 : 2;
  finishPvp(s, winner, "show");
}

function finishPvp(s: State, winner: 0 | 1 | 2, how: "fold" | "show") {
  const p = s.pvp;
  if (!p) return;
  const pot = p.committed[0] + p.committed[1];
  let rake = 0n;
  let back0 = p.stack[0];
  let back1 = p.stack[1];
  if (winner === 2) {
    back0 += p.committed[0];
    back1 += p.committed[1];
  } else {
    rake = (pot * 200n) / 10000n;
    const prize = pot - rake;
    if (winner === 0) back0 += prize;
    else back1 += prize;
  }
  s.bank += rake;
  seat(s, 0).vault += back0;
  seat(s, 1).vault += back1;
  record(s, 0, p.buy, back0);
  record(s, 1, p.buy, back1);
  const line =
    winner === 2
      ? "Split pot. Each stack comes back. No rake."
      : how === "fold"
        ? `Seat ${winner === 0 ? "A" : "B"} wins the fold. Rake ${formatFelt(rake)} FELT.`
        : `Seat ${winner === 0 ? "A" : "B"} wins at showdown. Rake ${formatFelt(rake)} FELT.`;
  s.pvp = null;
  note(s, "duel", line, 0n, "live", winner === 2 ? "SPLIT" : "HAND OVER");
}

function addTickets(s: State, id: SeatId, n: number) {
  if (s.totalTickets + n > 10_000) throw new Error("This round is full.");
  const row = s.tickets.find((t) => t.seat === id);
  if (row) row.n += n;
  else s.tickets.push({ seat: id, n });
  s.totalTickets += n;
}

function scrolls(s: State, id: SeatId, pay: number, burn: number, _now: number) {
  if (pay < 0 || burn < 0 || pay > 100 || burn > 100 || (pay === 0 && burn === 0)) throw new Error("Use 1 to 100 scrolls.");
  const price = SCROLL;
  if (pay > 0) {
    const cost = price * BigInt(pay);
    takeWallet(s, id, cost);
    s.pot += cost;
  }
  if (burn > 0) {
    const cost = price * BigInt(burn);
    takeWallet(s, id, cost);
    s.burned += cost;
  }
  addTickets(s, id, pay + burn);
  note(s, "lottery", pay && burn ? `Paid ${pay} and burned ${burn}.` : pay ? `Paid ${pay} into the pot.` : `Burned ${burn}. They still count.`, 0n, "live", "SCROLLS IN");
}

function draw(s: State) {
  if (s.totalTickets <= 0) throw new Error("The round has no scrolls.");
  const ticket = rnd(s.totalTickets);
  let acc = 0;
  let winner: SeatId = 0;
  for (const row of s.tickets) {
    acc += row.n;
    if (ticket < acc) {
      winner = row.seat;
      break;
    }
  }
  const prize = (s.pot * 9000n) / 10000n;
  s.pot -= prize;
  if (prize > 0n) seat(s, winner).wallet += prize;
  const who = winner === 0 ? "Seat A" : "Seat B";
  s.tickets = [];
  s.totalTickets = 0;
  s.round += 1;
  note(s, "lottery", `${who} drew the scroll. Prize ${formatFelt(prize)} FELT. 10% stays in the pot.`, prize, prize > 0n ? "win" : "push", "DRAWN");
}

function spendFaith(s: State, id: SeatId, n: number) {
  if (n < 1 || n > 100) throw new Error("Spend 1 to 100 faith.");
  const p = seat(s, id);
  if (p.faith < BigInt(n)) throw new Error("Not enough faith.");
  p.faith -= BigInt(n);
  addTickets(s, id, n);
  note(s, "lottery", `${n} faith became scrolls. They do not fill the pot.`, 0n, "live", "FAITH IN");
}

function dropFinished(s: State) {
  if (s.jobs.length < JOB_MAX) return;
  const idx = s.jobs.findIndex((j) => j.state >= 2);
  if (idx < 0) throw new Error("The board is full of open jobs.");
  s.jobs.splice(idx, 1);
}

function jobOpen(s: State, id: SeatId, brief: string, hours: number, pay: bigint, now: number) {
  const text = brief.trim();
  if (!text || bytes(text) > 240) throw new Error("Brief must be 240 bytes or less.");
  if (hours < 1 || hours > 336) throw new Error("Submission window is 1 hour to 14 days.");
  if (pay < UNIT) throw new Error("Minimum job is 1 FELT.");
  dropFinished(s);
  takeVault(s, id, pay);
  s.jobs.unshift({
    id: s.nextJob++,
    creator: id,
    brief: text,
    pay,
    deadline: now + hours * 60 * 60 * 1000,
    submittedAt: 0,
    worker: null,
    work: "",
    reason: "",
    state: 0,
  });
  note(s, "desk", `Job locked ${formatFelt(pay)} FELT.`, 0n, "live", "JOB OPEN");
}

function jobBy(s: State, id: number): Job {
  const job = s.jobs.find((j) => j.id === id);
  if (!job) throw new Error("That job is not on the board.");
  return job;
}

function jobSubmit(s: State, id: SeatId, jobId: number, work: string, now: number) {
  const job = jobBy(s, jobId);
  if (job.state !== 0) throw new Error("Someone already submitted.");
  if (job.creator === id) throw new Error("You cannot take your own job.");
  if (now > job.deadline) throw new Error("The submission window has closed.");
  const text = work.trim();
  if (!text || bytes(text) > 240) throw new Error("Work must be 240 bytes or less.");
  job.state = 1;
  job.worker = id;
  job.work = text;
  job.submittedAt = now;
  note(s, "desk", "Work is in. The creator has 48 hours.", 0n, "live", "WORK IN");
}

function jobApprove(s: State, id: SeatId, jobId: number, now: number) {
  const job = jobBy(s, jobId);
  if (job.creator !== id || job.state !== 1 || job.worker === null) throw new Error("Only the creator can pay an open submission.");
  if (now > job.submittedAt + JOB_REVIEW_MS) throw new Error("The 48 hours have passed. Anyone may settle it.");
  job.state = 2;
  seat(s, job.worker).vault += job.pay;
  note(s, "desk", `${formatFelt(job.pay)} FELT paid to the worker.`, job.pay, "win", "PAID");
}

function jobReject(s: State, id: SeatId, jobId: number, reason: string, now: number) {
  const job = jobBy(s, jobId);
  if (job.creator !== id || job.state !== 1) throw new Error("Only the creator can send it back.");
  if (now > job.submittedAt + JOB_REVIEW_MS) throw new Error("The 48 hours have passed. Anyone may settle it.");
  const text = reason.trim();
  if (!text || bytes(text) > 120) throw new Error("A rejection needs a reason, 120 bytes or less.");
  job.state = 3;
  job.reason = text;
  seat(s, job.creator).vault += job.pay;
  note(s, "desk", `Sent back. ${text}`, 0n, "push", "RETURNED");
}

function jobSettle(s: State, jobId: number, now: number) {
  const job = jobBy(s, jobId);
  if (job.state !== 1 || job.worker === null || job.submittedAt === 0) throw new Error("Nothing is waiting on the 48 hours.");
  if (now <= job.submittedAt + JOB_REVIEW_MS) throw new Error("The creator still has time.");
  job.state = 2;
  seat(s, job.worker).vault += job.pay;
  note(s, "desk", `48 hours of silence. ${formatFelt(job.pay)} FELT paid to the worker.`, job.pay, "win", "PAID");
}

function jobCancel(s: State, id: SeatId, jobId: number) {
  const job = jobBy(s, jobId);
  if (job.creator !== id || job.state !== 0) throw new Error("Cancel is only for the creator, before any work arrives.");
  job.state = 3;
  job.reason = "Cancelled before any work.";
  seat(s, id).vault += job.pay;
  note(s, "desk", "Cancelled. Nobody had submitted.", 0n, "push", "RETURNED");
}

function contestOpen(s: State, id: SeatId, name: string, hours: number, prize: bigint, now: number) {
  const title = name.trim();
  if (!title || bytes(title) > 80) throw new Error("Name the race in 80 bytes or less.");
  if (hours < 1 || hours > 24 * 14) throw new Error("A race runs from 1 hour to 14 days.");
  if (prize < UNIT) throw new Error("Prize is at least 1 FELT.");
  if (s.contests.filter((c) => !c.settled).length >= 64) throw new Error("Too many open races.");
  takeVault(s, id, prize);
  s.contests.unshift({
    id: s.nextContest++,
    name: title,
    creator: id,
    prize,
    start: now,
    end: now + hours * 60 * 60 * 1000,
    net: [0n, 0n],
    wins: [0, 0],
    played: [false, false],
    settled: false,
  });
  note(s, "competition", `${title} locked ${formatFelt(prize)} FELT.`, 0n, "live", "RACE OPEN");
}

function contestClaim(s: State, id: number, now: number) {
  const c = s.contests.find((row) => row.id === id);
  if (!c || c.settled) throw new Error("That race is already settled.");
  if (now < c.end) throw new Error("The race is still running.");
  c.settled = true;
  const played = c.played[0] || c.played[1];
  if (!played) {
    seat(s, c.creator).vault += c.prize;
    note(s, "competition", "Nobody played. The prize went back.", 0n, "push", "RETURNED");
    return;
  }
  let winner: SeatId = 0;
  if (c.net[1] > c.net[0] || (c.net[1] === c.net[0] && c.wins[1] > c.wins[0])) winner = 1;
  seat(s, winner).vault += c.prize;
  note(s, "competition", `Seat ${winner === 0 ? "A" : "B"} takes ${formatFelt(c.prize)} FELT.`, c.prize, "win", "RACE PAID");
}

function stakeLock(s: State, id: SeatId, tier: 1 | 2 | 3, cro: bigint, now: number) {
  const p = seat(s, id);
  if (p.lock) throw new Error("This seat already has a lock.");
  if (cro <= 0n) throw new Error("Lock more than zero CRO.");
  if (p.cro < cro) throw new Error("Not enough CRO on this seat.");
  const mult = tier === 1 ? 10n : tier === 2 ? 15n : 20n;
  const weight = (cro * mult) / 10n;
  const days = tier === 1 ? 7 : tier === 2 ? 30 : 90;
  p.cro -= cro;
  p.lock = { tier, amount: cro, weight, unlockAt: now + days * DAY, index: s.index };
  s.weight += weight;
  note(s, "stakes", `Locked ${cro.toString()} CRO at ${tier === 1 ? "1.0×" : tier === 2 ? "1.5×" : "2.0×"}.`, 0n, "live", "LOCKED");
}

function owed(s: State, id: SeatId): bigint {
  const lock = seat(s, id).lock;
  if (!lock || s.index <= lock.index) return 0n;
  return (lock.weight * (s.index - lock.index)) / SCALE;
}

function stakeClaim(s: State, id: SeatId) {
  const due = owed(s, id);
  const lock = seat(s, id).lock;
  if (!lock) throw new Error("No lock on this seat.");
  if (due === 0n) throw new Error("Nothing is owed yet.");
  if (s.stakers < due) throw new Error("The staker pot is short.");
  s.stakers -= due;
  lock.index = s.index;
  seat(s, id).vault += due;
  note(s, "stakes", `Claimed ${formatFelt(due)} FELT into the vault.`, due, "win", "CLAIMED");
}

function unstake(s: State, id: SeatId, now: number) {
  const p = seat(s, id);
  if (!p.lock) throw new Error("No lock on this seat.");
  if (now < p.lock.unlockAt) throw new Error("The lock has not finished. Early unstake is refused.");
  if (owed(s, id) > 0n) throw new Error("Claim the FELT before the CRO comes back.");
  s.weight -= p.lock.weight;
  p.cro += p.lock.amount;
  p.lock = null;
  note(s, "stakes", "CRO is unlocked.", 0n, "push", "UNLOCKED");
}

const PACKS: [number, number][] = [
  [5, 1],
  [10, 3],
  [30, 15],
  [100, 75],
  [250, 250],
  [500, 600],
];

function tithePack(s: State, id: SeatId, tier: number) {
  const pack = PACKS[tier - 1];
  if (!pack) throw new Error("Pick a pack.");
  openTithe(s, id, pack[0], pack[1]);
}

function titheCustom(s: State, id: SeatId, scrollsN: number) {
  if (scrollsN < 5 || scrollsN > 500) throw new Error("Custom prepay is 5 to 500 scrolls.");
  let bonus = 0;
  for (const [paid, extra] of PACKS) {
    if (scrollsN >= paid) bonus = extra;
  }
  const scaled = Math.floor((scrollsN * bonus) / (PACKS.find(([paid]) => paid <= scrollsN)?.[0] ?? scrollsN));
  openTithe(s, id, scrollsN, scaled);
}

function openTithe(s: State, id: SeatId, paid: number, bonus: number) {
  const p = seat(s, id);
  if (p.tithe) throw new Error("Close the open pack first.");
  const escrow = SCROLL * BigInt(paid);
  takeWallet(s, id, escrow);
  p.tithe = { paid, bonus, escrow };
  note(s, "tithe", `Pack holds ${paid} paid and ${bonus} extra.`, 0n, "live", "PACK OPEN");
}

function titheAllocate(s: State, id: SeatId, n: number) {
  const t = seat(s, id).tithe;
  if (!t) throw new Error("No pack is open.");
  if (n < 1 || n > t.paid + t.bonus) throw new Error("That is more scrolls than the pack holds.");
  const fromPaid = Math.min(n, t.paid);
  const cost = SCROLL * BigInt(fromPaid);
  t.escrow -= cost;
  s.pot += cost;
  t.paid -= fromPaid;
  t.bonus -= n - fromPaid;
  addTickets(s, id, n);
  note(s, "tithe", `${n} scrolls allocated to round ${s.round}.`, 0n, "live", "ALLOCATED");
}

function titheClose(s: State, id: SeatId) {
  const p = seat(s, id);
  if (!p.tithe) throw new Error("No pack is open.");
  p.wallet += p.tithe.escrow;
  p.tithe = null;
  note(s, "tithe", "Pack closed. Unused FELT came back. Extra scrolls that were not allocated are gone.", 0n, "push", "CLOSED");
}

function faithFor(tier: 1 | 2 | 3, amount: bigint): bigint {
  const per = tier === 1 ? 20n : tier === 2 ? 60n : 150n;
  return (amount * per) / FAITH_UNIT;
}

function pilgrimBegin(s: State, id: SeatId, tier: 1 | 2 | 3, amount: bigint, now: number) {
  if (amount < FAITH_MIN) throw new Error("Minimum lock is 20,000,000 FELT.");
  const faith = faithFor(tier, amount);
  takeWallet(s, id, amount);
  const days = tier === 1 ? 7 : tier === 2 ? 30 : 90;
  const p = seat(s, id);
  p.faith += faith;
  p.pilgrims.push({ tier, amount, unlockAt: now + days * DAY });
  note(s, "pilgrimage", `Locked ${formatFelt(amount)} FELT. Faith ${faith.toString()} is credited now.`, 0n, "live", "LOCKED");
}

function pilgrimClaim(s: State, id: SeatId, index: number, now: number) {
  const p = seat(s, id);
  const row = p.pilgrims[index];
  if (!row) throw new Error("That pilgrimage is not on this seat.");
  if (now < row.unlockAt) throw new Error("The lock has not finished.");
  p.pilgrims.splice(index, 1);
  p.wallet += row.amount;
  note(s, "pilgrimage", `${formatFelt(row.amount)} FELT came back. Faith already spent stays spent.`, 0n, "push", "RETURNED");
}

function housePropose(s: State, owner: 0 | 1 | 2, to: string, amount: bigint) {
  if (s.proposal) throw new Error("A withdrawal is already waiting. Reject it or finish it.");
  if (!/^0x[0-9a-fA-F]{40}$/.test(to)) throw new Error("Destination is a 0x address.");
  if (amount <= 0n) throw new Error("Amount must be greater than zero.");
  if (amount > s.bank) throw new Error("The house bank does not hold that much.");
  s.proposal = { to, amount, sigs: [owner === 0, owner === 1, owner === 2] };
  note(s, "house", `Owner ${owner + 1} proposed ${formatFelt(amount)} FELT from the house bank.`, 0n, "live", "PROPOSED");
}

function houseSign(s: State, owner: 0 | 1 | 2) {
  if (!s.proposal) throw new Error("Nothing is proposed.");
  s.proposal.sigs[owner] = true;
  note(s, "house", `Owner ${owner + 1} approved.`, 0n, "live", "APPROVED");
}

function houseReject(s: State, owner: 0 | 1 | 2) {
  if (!s.proposal) throw new Error("Nothing is proposed.");
  s.proposal = null;
  note(s, "house", `Owner ${owner + 1} rejected the withdrawal.`, 0n, "push", "REJECTED");
}

function houseExecute(s: State, owner: 0 | 1 | 2) {
  const p = s.proposal;
  if (!p) throw new Error("Nothing is proposed.");
  if (!p.sigs[owner]) throw new Error("Sign before you execute.");
  const n = p.sigs.filter(Boolean).length;
  if (n < 2) throw new Error("Two owners have to approve.");
  if (p.amount > s.bank) throw new Error("The house bank changed. Reject this and propose again.");
  s.bank -= p.amount;
  const dest = p.to.toLowerCase();
  if (dest === SEAT_ADDR[0]) s.seats[0].wallet += p.amount;
  else if (dest === SEAT_ADDR[1]) s.seats[1].wallet += p.amount;
  else if (s.address && dest === s.address.toLowerCase()) seat(s, s.acting).wallet += p.amount;
  s.proposal = null;
  note(s, "house", `${formatFelt(p.amount)} FELT left the house bank. Player vaults were not used.`, 0n, "push", "SENT");
}

export function owedOf(s: State, id: SeatId): bigint {
  return owed(s, id);
}

export function selfCheck(): string[] {
  const errors: string[] = [];
  const ante = 5000n * UNIT;
  const player = (1 << 20) | (8 << 16);
  const dealer = (1 << 20) | (4 << 16);
  const paid = pokerPayout(player, dealer, ante, true);
  if (paid !== 30000n * UNIT) errors.push(`poker payout ${paid}`);
  const under = (100n * UNIT * 230n) / 100n;
  if (under !== 230n * UNIT) errors.push("dice");
  const profit = 100n * UNIT;
  if ((profit * 1500n) / 10000n !== 15n * UNIT) errors.push("burn");
  if ((profit * 500n) / 10000n !== 5n * UNIT) errors.push("buy");
  if ((profit * 1000n) / 10000n !== 10n * UNIT) errors.push("stakers");
  if (faithFor(1, FAITH_MIN) !== 400n) errors.push("faith");
  const straight = 36n * UNIT;
  if (straight !== 36n * UNIT) errors.push("roulette");
  return errors;
}
