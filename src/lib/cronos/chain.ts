import { BrowserProvider, Contract, MaxUint256, type TransactionReceipt } from "ethers";
import { FELT, FLOOR } from "@/lib/cronos/addresses";

const feltAbi = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function drip()",
  "function dripped(address) view returns (bool)",
];

const floorAbi = [
  "function deposit(uint256)",
  "function withdraw(uint256)",
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
  "event Play(address indexed player, string game, uint256 stake, uint256 payout, string detail)",
];

type Eth = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };

function ethereum(): Eth {
  const eth = (window as Window & { ethereum?: Eth }).ethereum;
  if (!eth) throw new Error("No Cronos wallet is available in this browser.");
  return eth;
}

async function signer() {
  const provider = new BrowserProvider(ethereum());
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 25) throw new Error("Switch the wallet to Cronos, chain 25.");
  return provider.getSigner();
}

async function sent(tx: Promise<{ wait: () => Promise<TransactionReceipt | null> }>): Promise<TransactionReceipt> {
  const receipt = await (await tx).wait();
  if (!receipt || receipt.status !== 1) throw new Error("The transaction failed.");
  return receipt;
}

export async function chainBalances(address: string) {
  const provider = new BrowserProvider(ethereum());
  const felt = new Contract(FELT, feltAbi, provider);
  const floor = new Contract(FLOOR, floorAbi, provider);
  const [wallet, vault, bank, burned, buyback, stakers] = await Promise.all([
    felt.balanceOf(address) as Promise<bigint>,
    floor.vault(address) as Promise<bigint>,
    floor.bank() as Promise<bigint>,
    floor.burned() as Promise<bigint>,
    floor.buybackPot() as Promise<bigint>,
    floor.stakers() as Promise<bigint>,
  ]);
  return { wallet, vault, bank, burned, buyback, stakers };
}

export async function claimDrip() {
  const account = await signer();
  const felt = new Contract(FELT, feltAbi, account);
  await sent(felt.drip());
}

export async function depositFelt(amount: bigint) {
  const account = await signer();
  const me = await account.getAddress();
  const felt = new Contract(FELT, feltAbi, account);
  const floor = new Contract(FLOOR, floorAbi, account);
  const allowance = (await felt.allowance(me, FLOOR)) as bigint;
  if (allowance < amount) await sent(felt.approve(FLOOR, MaxUint256));
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
  const felt = new Contract(FELT, feltAbi, account);
  const floor = new Contract(FLOOR, floorAbi, account);
  const vault = (await floor.vault(me)) as bigint;
  if (vault >= stake) return me;
  const need = stake - vault;
  const balance = (await felt.balanceOf(me)) as bigint;
  if (balance < need) throw new Error("Not enough FELT. Claim 10,000 chips on the wallet page first.");
  const allowance = (await felt.allowance(me, FLOOR)) as bigint;
  if (allowance < need) await sent(felt.approve(FLOOR, MaxUint256));
  await sent(floor.deposit(need));
  return me;
}

export async function playOnChain(kind: "dice" | "roulette" | "slots" | "plinko", args: Array<number | bigint>) {
  const account = await signer();
  const provider = account.provider;
  if (!provider) throw new Error("The wallet has no provider.");
  const me = await cover(BigInt(args[args.length - 1]));
  const floor = new Contract(FLOOR, floorAbi, account);
  const open = await sent(floor[kind](...args));
  for (let i = 0; i < 40; i++) {
    if ((await provider.getBlockNumber()) > open.blockNumber) break;
    if (i === 39) throw new Error("Wait a moment and roll again.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
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
