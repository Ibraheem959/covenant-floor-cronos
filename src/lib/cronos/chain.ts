import { BrowserProvider, Contract, JsonRpcProvider, MaxUint256, type TransactionReceipt } from "ethers";
import { FELT, FLOOR } from "@/lib/cronos/addresses";
import { SCROLL } from "@/lib/cronos/logic";

const RPC = "https://evm.cronos.org";

const feltAbi = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
];

const floorAbi = [
  "function deposit(uint256)",
  "function withdraw(uint256)",
  "function fundHouse(uint256)",
  "function vault(address) view returns (uint256)",
  "function bank() view returns (uint256)",
  "function burned() view returns (uint256)",
  "function buybackPot() view returns (uint256)",
  "function stakers() view returns (uint256)",
  "function dice(uint8,uint256,uint256)",
  "function settleDice(address)",
  "function roulette(uint8,uint256,uint256)",
  "function settleRoulette(address)",
  "function slots(uint256)",
  "function settleSlots(address)",
  "function plinko(uint8,uint256)",
  "function settlePlinko(address)",
  "function sealScroll(uint256)",
  "function burnScroll(uint256)",
  "function draw()",
  "function settleDraw()",
  "function pot() view returns (uint256)",
  "function round() view returns (uint256)",
  "function tickets(address) view returns (uint256)",
  "function totalTickets() view returns (uint256)",
  "function drawBlock() view returns (uint64)",
  "function nextJob() view returns (uint256)",
  "function jobs(uint256) view returns (uint256 id, address creator, address worker, uint256 pay, uint64 deadline, uint64 submittedAt, uint8 state, string brief, string work, string reason)",
  "function openJob(string,uint256,uint256)",
  "function submitJob(uint256,string)",
  "function approveJob(uint256)",
  "function rejectJob(uint256,string)",
  "function settleJob(uint256)",
  "function cancelJob(uint256)",
  "function proposeWithdraw(address,uint256)",
  "function approveWithdraw()",
  "function rejectWithdraw()",
  "function executeWithdraw()",
  "function proposal() view returns (address to, uint256 amount, bool open)",
  "event Play(address indexed player, string game, uint256 stake, uint256 payout, string detail)",
];

export type ChainJob = {
  index: number;
  id: bigint;
  creator: string;
  worker: string;
  pay: bigint;
  deadline: bigint;
  submittedAt: bigint;
  state: number;
  brief: string;
  work: string;
  reason: string;
};

export type ChainProposal = { to: string; amount: bigint; open: boolean };

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, fn: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, fn: (...args: unknown[]) => void) => void;
};

let activeWallet: Eth | null = null;

export function setActiveWallet(provider: Eth | null) {
  activeWallet = provider;
}

function ethereum(): Eth {
  if (!activeWallet) throw new Error("Choose a wallet. Disconnect does not keep the last one.");
  return activeWallet;
}

function isCronos(chain: unknown) {
  const text = String(chain ?? "").trim().toLowerCase();
  const id = text.startsWith("0x") ? Number.parseInt(text, 16) : Number(text);
  return id === 25;
}

async function signer() {
  const eth = ethereum();
  const chain = await eth.request({ method: "eth_chainId" });
  if (!isCronos(chain)) throw new Error("Switch the wallet to Cronos, chain 25.");
  const provider = new BrowserProvider(eth, 25);
  return provider.getSigner();
}

async function sent(tx: Promise<{ wait: () => Promise<TransactionReceipt | null> }>): Promise<TransactionReceipt> {
  const sentTx = await Promise.race([
    tx,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("The wallet did not open. Unlock it and try Add to the house again.")), 90_000);
    }),
  ]);
  const receipt = await sentTx.wait();
  if (!receipt || receipt.status !== 1) throw new Error("The transaction failed.");
  return receipt;
}

function reader() {
  return new JsonRpcProvider(RPC, 25, { staticNetwork: true });
}

function valid(address: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(address) ? address : "";
}

export async function chainBalances(address = "") {
  const provider = reader();
  const felt = new Contract(FELT, feltAbi, provider);
  const floor = new Contract(FLOOR, floorAbi, provider);
  const who = valid(address);
  const [wallet, vault, bank, burned, buyback, stakers, cro] = await Promise.all([
    who ? (felt.balanceOf(who) as Promise<bigint>) : 0n,
    who ? (floor.vault(who) as Promise<bigint>) : 0n,
    floor.bank() as Promise<bigint>,
    floor.burned() as Promise<bigint>,
    floor.buybackPot() as Promise<bigint>,
    floor.stakers() as Promise<bigint>,
    who ? provider.getBalance(who) : 0n,
  ]);
  return { wallet, vault, bank, burned, buyback, stakers, cro };
}

export async function readDesk(address = "") {
  const provider = reader();
  const floor = new Contract(FLOOR, floorAbi, provider);
  const who = valid(address);
  const [pot, round, mine, total, drawBlock, nextJob, proposal] = await Promise.all([
    floor.pot() as Promise<bigint>,
    floor.round() as Promise<bigint>,
    who ? (floor.tickets(who) as Promise<bigint>) : 0n,
    floor.totalTickets() as Promise<bigint>,
    floor.drawBlock() as Promise<bigint>,
    floor.nextJob() as Promise<bigint>,
    floor.proposal() as Promise<{ to: string; amount: bigint; open: boolean }>,
  ]);
  const jobs: ChainJob[] = [];
  const count = Number(nextJob) - 1;
  for (let index = 0; index < count; index++) {
    const row = await floor.jobs(index);
    jobs.push({
      index,
      id: row.id,
      creator: row.creator,
      worker: row.worker,
      pay: row.pay,
      deadline: row.deadline,
      submittedAt: row.submittedAt,
      state: Number(row.state),
      brief: row.brief,
      work: row.work,
      reason: row.reason,
    });
  }
  return {
    pot,
    round,
    mine,
    total,
    drawBlock,
    jobs,
    proposal: {
      to: proposal.to,
      amount: proposal.amount,
      open: proposal.open,
    } satisfies ChainProposal,
  };
}

async function allow(amount: bigint) {
  const account = await signer();
  const me = await account.getAddress();
  const feltRead = new Contract(FELT, feltAbi, reader());
  const allowance = (await feltRead.allowance(me, FLOOR)) as bigint;
  if (allowance < amount) {
    const felt = new Contract(FELT, feltAbi, account);
    await sent(felt.approve(FLOOR, MaxUint256));
  }
  return account;
}

export async function depositFelt(amount: bigint) {
  const account = await allow(amount);
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.deposit(amount));
}

export async function withdrawFelt(amount: bigint) {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.withdraw(amount));
}

async function cover(stake: bigint) {
  const account = await signer();
  const me = await account.getAddress();
  const felt = new Contract(FELT, feltAbi, reader());
  const floor = new Contract(FLOOR, floorAbi, reader());
  const vault = (await floor.vault(me)) as bigint;
  if (vault >= stake) return me;
  const need = stake - vault;
  const balance = (await felt.balanceOf(me)) as bigint;
  if (balance < need) throw new Error("The vault is empty and this wallet has no FELT to deposit.");
  await allow(need);
  const writer = new Contract(FLOOR, floorAbi, account);
  await sent(writer.deposit(need));
  return me;
}

async function after(blockNumber: number, provider: { getBlockNumber: () => Promise<number> }) {
  for (let i = 0; i < 40; i++) {
    if ((await provider.getBlockNumber()) > blockNumber) return;
    if (i === 39) throw new Error("Wait a moment, then try again.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

export async function playOnChain(kind: "dice" | "roulette" | "slots" | "plinko", args: Array<number | bigint>) {
  const account = await signer();
  const provider = account.provider;
  if (!provider) throw new Error("The wallet has no provider.");
  const me = await cover(BigInt(args[args.length - 1]));
  const floor = new Contract(FLOOR, floorAbi, account);
  const open = await sent(floor[kind](...args));
  await after(open.blockNumber, provider);
  const settle =
    kind === "dice" ? "settleDice" : kind === "roulette" ? "settleRoulette" : kind === "slots" ? "settleSlots" : "settlePlinko";
  const receipt = await sent(floor[settle](me));
  for (const log of receipt.logs) {
    try {
      const parsed = floor.interface.parseLog(log);
      if (parsed?.name === "Play" && parsed.args.detail !== "locked") {
        return { game: String(parsed.args.game), detail: String(parsed.args.detail), stake: parsed.args.stake as bigint, payout: parsed.args.payout as bigint };
      }
    } catch {
      /* other contracts */
    }
  }
  throw new Error("The bet settled, but the receipt had no result.");
}

export async function buyScrolls(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error("Choose 1 to 100 scrolls.");
  const account = await allow(SCROLL * BigInt(n));
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.sealScroll(n));
}

export async function burnScrolls(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error("Choose 1 to 100 scrolls.");
  const account = await allow(SCROLL * BigInt(n));
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.burnScroll(n));
}

export async function drawLottery() {
  const account = await signer();
  const provider = account.provider;
  if (!provider) throw new Error("The wallet has no provider.");
  const floor = new Contract(FLOOR, floorAbi, account);
  const pending = (await floor.drawBlock()) as bigint;
  if (pending === 0n) {
    const open = await sent(floor.draw());
    await after(open.blockNumber, provider);
  }
  await sent(floor.settleDraw());
}

export async function postJob(brief: string, hours: number, pay: bigint) {
  await cover(pay);
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.openJob(brief, hours, pay));
}

export async function sendWork(index: number, work: string) {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.submitJob(index, work));
}

export async function payJob(index: number) {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.approveJob(index));
}

export async function returnJob(index: number, reason: string) {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.rejectJob(index, reason));
}

export async function silenceJob(index: number) {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.settleJob(index));
}

export async function cancelJob(index: number) {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.cancelJob(index));
}

export async function fundHouse(amount: bigint) {
  const account = await allow(amount);
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.fundHouse(amount));
}

export async function proposeHouse(to: string, amount: bigint) {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.proposeWithdraw(to, amount));
}

export async function approveHouse() {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.approveWithdraw());
}

export async function rejectHouse() {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.rejectWithdraw());
}

export async function sendHouse() {
  const account = await signer();
  const floor = new Contract(FLOOR, floorAbi, account);
  await sent(floor.executeWithdraw());
}
