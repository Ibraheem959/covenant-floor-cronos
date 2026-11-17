import { useEffect, useState } from "react";
import { Menu, Wallet, X } from "lucide-react";
import { Area, Cards, Field, Go, PageHead, Picks, Stage, Stat } from "@/components/cronos/bits";
import { FloorProvider, useFloor } from "@/lib/cronos/store";
import { FELT, FLOOR } from "@/lib/cronos/addresses";
import { chainBalances, claimDrip, depositFelt, playOnChain, withdrawFelt } from "@/lib/cronos/chain";
import {
  FAITH_MIN,
  SEAT_ADDR,
  formatFelt,
  handName,
  owedOf,
  parseFelt,
  resultLine,
  bjTotal,
  type Action,
  type SeatId,
} from "@/lib/cronos/logic";

const NAV = [
  ["lottery", "Lottery"],
  ["desk", "Pay desk"],
  ["competition", "Competition"],
  ["dice", "Dice"],
  ["roulette", "Roulette"],
  ["slots", "Slots"],
  ["plinko", "Plinko"],
  ["keno", "Keno"],
  ["baccarat", "Baccarat"],
  ["hi-lo", "Hi-Lo"],
  ["mines", "Mines"],
  ["blackjack", "Blackjack"],
  ["poker", "Poker"],
  ["duel", "Heads-Up"],
  ["table", "Table"],
  ["wallet", "Wallet"],
  ["stakes", "Stakes"],
  ["tithe", "Tithe"],
  ["pilgrimage", "Pilgrimage"],
  ["house", "House"],
] as const;

type PageId = (typeof NAV)[number][0];

const COPY: Record<PageId, { eyebrow: string; title: string; copy: string }> = {
  lottery: { eyebrow: "Shared pool", title: "The Lottery", copy: "One scroll is 1,000 FELT from the wallet. Paid scrolls fill the pot. Burned scrolls are destroyed and still count. The draw pays 90%. 10% carries." },
  desk: { eyebrow: "Work · not a bet", title: "Pay desk", copy: "Lock FELT from your vault on a brief. The first other seat to submit can be paid. You have 48 hours to pay them or send it back with a reason. Silence pays the worker." },
  competition: { eyebrow: "Play any game", title: "Competition", copy: "A timed race. The prize is locked before the first bet. The seat that comes out ahead by the most FELT takes it. A tie goes to more winning rounds." },
  dice: { eyebrow: "Two dice", title: "Dice", copy: "Under 7 and over 7 pay 2.30×. Exact 7 pays 5.76×. An exact sum pays 36× at 96%, split by the number of ways." },
  roulette: { eyebrow: "0 to 36", title: "Roulette", copy: "A straight pays 36×. Red, black, even, and odd pay 2×. A dozen pays 3×. Zero loses the outside bets." },
  slots: { eyebrow: "Three reels", title: "Slots", copy: "Three 7s pay 25×. Three BARs pay 10×. GEM or BELL triples pay 5×. Any other triple pays 2×. Any pair pays 1.5×." },
  plinko: { eyebrow: "Eight drops", title: "Plinko", copy: "The ball takes eight even left or right steps. Low, medium, and high change the bucket pays. Edges pay the most." },
  keno: { eyebrow: "10 of 40", title: "Keno", copy: "Choose 1 to 10 numbers. Ten numbers are drawn. A full card of hits pays 80×. The wager cap is 10,000 FELT." },
  baccarat: { eyebrow: "Player, banker, tie", title: "Baccarat", copy: "Player and banker pay 2×. A tie pays 9× and returns a player or banker wager. Third-card rules are the standard shoe." },
  "hi-lo": { eyebrow: "One rank at a time", title: "Hi-Lo", copy: "Call the next rank higher or lower. A match stays. A hit multiplies by 1.9, up to 20×. Cash out, or lose the wager on a miss." },
  mines: { eyebrow: "25 tiles · 3 mines", title: "Mines", copy: "Each reveal can be a mine among the tiles still closed. A safe tile raises the cash-out. Hit a mine and the wager stays with the house." },
  blackjack: { eyebrow: "Dealer stands on 17", title: "Blackjack", copy: "Even wagers. A natural pays 3 to 2. Double a hard 9, 10, or 11. Split a pair. Split aces take one card and stand." },
  poker: { eyebrow: "You versus the house", title: "Poker", copy: "Casino hold'em. Ante, see two cards and a flop. Call for exactly twice the ante, or fold. The house needs a pair of fours. A royal pays 100 to 1 on the ante." },
  duel: { eyebrow: "You versus the other seat", title: "Heads-Up", copy: "No-limit hold'em. Matched stacks, 20 to 50,000 FELT. The host is the small blind. Blinds are 1/20 and 1/10 of the buy-in. The winner pays a 2% rake." },
  table: { eyebrow: "Two seats, one shoe", title: "Table", copy: "Both seats put up an even wager. The dealer stands on 17. A natural pays 3 to 2. Leave only while the other chair is empty." },
  wallet: { eyebrow: "Vault", title: "Wallet", copy: "Games take FELT from the vault. Scrolls, packs, and pilgrimage locks take FELT from the wallet. Move funds between them here." },
  stakes: { eyebrow: "CRO lock · FELT rewards", title: "Stakes", copy: "Lock CRO. 7 days is 1.0×, 30 days is 1.5×, 90 days is 2.0×. 10% of each net loss is shared by that weight. Early unstake is refused." },
  tithe: { eyebrow: "Scroll packs", title: "Tithe", copy: "Pay for scrolls ahead. 5 paid receives 6. Larger packs add more. Allocate them into the open round. Close returns unused paid FELT." },
  pilgrimage: { eyebrow: "Faith and lockups", title: "Pilgrimage", copy: "Tier 1 pays 20 faith per 1,000,000 FELT, tier 2 pays 60, tier 3 pays 150. The minimum lock is 20,000,000 FELT. Faith can be spent as scrolls. It does not fill the pot." },
  house: { eyebrow: "Two of three owners", title: "House bank", copy: "A withdrawal takes FELT from the house bank only and pays a named wallet. Two owners must approve. Player vaults, the staker pot, and open jobs are not used." },
};

export function Floor() {
  return (
    <FloorProvider>
      <Shell />
    </FloorProvider>
  );
}

function Shell() {
  const { state, send } = useFloor();
  const [page, setPage] = useState<PageId>("lottery");
  const [open, setOpen] = useState(false);
  const [walletNote, setWalletNote] = useState("");
  const seat = state.seats[state.acting];
  const copy = COPY[page];
  const onChain = Boolean(state.address && state.chainOk);
  const shownVault = onChain ? (state.chainVault ?? 0n) : seat.vault;

  useEffect(() => {
    if (state.contract !== FLOOR) send({ type: "contract", address: FLOOR });
  }, [send, state.contract]);

  useEffect(() => {
    if (!onChain || !state.address) return;
    let stop = false;
    const pull = () => {
      void chainBalances(state.address).then((row) => {
        if (!stop) send({ type: "synced", wallet: row.wallet, vault: row.vault, bank: row.bank, burned: row.burned, buyback: row.buyback, stakers: row.stakers });
      }).catch(() => undefined);
    };
    pull();
    const timer = window.setInterval(pull, 12000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [onChain, send, state.address]);

  async function connect() {
    setWalletNote("");
    const eth = (window as Window & { ethereum?: Eth }).ethereum;
    if (!eth) {
      setWalletNote("No Cronos wallet is available in this browser. The two seats still play.");
      return;
    }
    try {
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x19" }] });
      } catch (error) {
        const code = (error as { code?: number }).code;
        if (code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x19",
                chainName: "Cronos",
                nativeCurrency: { name: "CRO", symbol: "CRO", decimals: 18 },
                rpcUrls: ["https://evm.cronos.com"],
                blockExplorerUrls: ["https://explorer.cronos.com"],
              },
            ],
          });
        } else throw error;
      }
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const chain = (await eth.request({ method: "eth_chainId" })) as string;
      send({ type: "wallet", address: accounts[0] ?? "", chainOk: chain.toLowerCase() === "0x19" });
      setWalletNote(chain.toLowerCase() === "0x19" ? "Connected on Cronos. Claim 10,000 FELT on the wallet page. Gas is CRO." : "This wallet is not on Cronos.");
    } catch (error) {
      setWalletNote(error instanceof Error ? error.message : "The wallet did not connect.");
    }
  }

  return (
    <main className="felt min-h-screen">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-6">
        <aside className="hidden lg:grid lg:content-start lg:gap-4">
          <Brand />
          <Nav page={page} onPick={setPage} />
        </aside>
        <div className="grid gap-5">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div className="grid gap-1 lg:hidden">
              <Brand />
            </div>
            <div className="ml-auto grid justify-items-end gap-2">
              <p className="text-xs tracking-wide text-muted uppercase">{onChain ? "Vault · Cronos" : `Vault · Seat ${state.acting === 0 ? "A" : "B"}`}</p>
              <p className="num-strip font-display text-4xl text-gold" data-testid="chip-balance">
                {formatFelt(shownVault)}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => send({ type: "act", seat: state.acting === 0 ? 1 : 0 })} className="min-h-11 rounded-full border border-line px-4 text-sm">
                  Switch to seat {state.acting === 0 ? "B" : "A"}
                </button>
                <button type="button" onClick={() => void connect()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-4 text-sm font-medium text-ink">
                  <Wallet size={16} aria-hidden />
                  {state.address ? short(state.address) : "Cronos wallet"}
                </button>
                <button type="button" className="icon-button grid min-h-11 min-w-11 place-items-center rounded-full border border-line lg:hidden" aria-label="Open navigation" onClick={() => setOpen((v) => !v)}>
                  {open ? <X size={18} /> : <Menu size={18} />}
                </button>
              </div>
            </div>
          </header>
          {open ? (
            <div className="lg:hidden">
              <Nav page={page} onPick={(id) => { setPage(id); setOpen(false); }} />
            </div>
          ) : null}
          <section className="grid gap-5">
            <PageHead {...copy} />
            {state.error ? <p className="rounded-lg border border-wine px-3 py-3 text-sm text-wine">{state.error}</p> : null}
            {walletNote ? <p className="text-sm text-muted">{walletNote}</p> : null}
            {state.chainOk ? <p className="text-xs tracking-wide text-gold uppercase">Cronos · chain 25</p> : null}
            <Body page={page} />
            {page !== "house" && state.last.game === page ? <Stage title={state.last.title} line={state.last.line} tone={state.last.tone} /> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function Brand() {
  return (
    <div className="brand">
      <div className="brand-emblem">C</div>
      <div>
        <strong>
          COVENANT<span>FLOOR</span>
        </strong>
        <small>CRONOS · FELT</small>
      </div>
    </div>
  );
}

function Nav({ page, onPick }: { page: PageId; onPick: (id: PageId) => void }) {
  return (
    <nav className="grid grid-cols-2 gap-1 lg:grid-cols-1">
      {NAV.map(([id, label], index) => (
        <button key={id} type="button" onClick={() => onPick(id)} className={`nav-link ${page === id ? "nav-link-active" : ""}`}>
          <span className="nav-index">{String(index + 1).padStart(2, "0")}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Body({ page }: { page: PageId }) {
  if (page === "lottery") return <LotteryPage />;
  if (page === "desk") return <DeskPage />;
  if (page === "competition") return <RacePage />;
  if (page === "dice") return <DicePage />;
  if (page === "roulette") return <RoulettePage />;
  if (page === "slots") return <SlotsPage />;
  if (page === "plinko") return <PlinkoPage />;
  if (page === "keno") return <KenoPage />;
  if (page === "baccarat") return <BaccaratPage />;
  if (page === "hi-lo") return <HiloPage />;
  if (page === "mines") return <MinesPage />;
  if (page === "blackjack") return <BjPage />;
  if (page === "poker") return <PokerPage />;
  if (page === "duel") return <DuelPage />;
  if (page === "table") return <TablePage />;
  if (page === "wallet") return <WalletPage />;
  if (page === "stakes") return <StakePage />;
  if (page === "tithe") return <TithePage />;
  if (page === "pilgrimage") return <PilgrimPage />;
  return <HousePage />;
}

function useForm() {
  const api = useFloor();
  const [local, setLocal] = useState("");
  const [busy, setBusy] = useState(false);
  function go(build: () => Action) {
    try {
      setLocal("");
      api.send(build());
    } catch (error) {
      setLocal(error instanceof Error ? error.message : "Check that amount.");
    }
  }
  async function run(task: () => Promise<void>) {
    try {
      setLocal("");
      setBusy(true);
      await task();
    } catch (error) {
      setLocal(error instanceof Error ? error.message : "The wallet refused that.");
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    if (!api.state.address) return;
    const row = await chainBalances(api.state.address);
    api.send({ type: "synced", wallet: row.wallet, vault: row.vault, bank: row.bank, burned: row.burned, buyback: row.buyback, stakers: row.stakers });
  }
  return { ...api, local, go, run, busy, refresh };
}

function Bomb({ text }: { text: string }) {
  if (!text) return null;
  return <p className="text-sm text-wine">{text}</p>;
}

function DiceFace({ n }: { n: number }) {
  const pips: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  return (
    <div className="grid h-16 w-16 grid-cols-3 grid-rows-3 gap-1 rounded-lg bg-parchment p-2">
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={`pip justify-self-center self-center ${pips[n]?.includes(i) ? "on" : ""}`} />
      ))}
    </div>
  );
}

function DicePage() {
  const { go, run, busy, local, state, send } = useForm();
  const [mode, setMode] = useState("0");
  const [target, setTarget] = useState("7");
  const [stake, setStake] = useState("10");
  const sum = Number(/summed to (\d+)/.exec(state.last.line)?.[1] ?? 0);
  const live = Boolean(state.address && state.chainOk);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        {sum >= 2 ? (
          <>
            <DiceFace n={Math.min(6, Math.max(1, sum - 6))} />
            <DiceFace n={sum - Math.min(6, Math.max(1, sum - 6))} />
            <strong className="font-display text-3xl">{sum}</strong>
          </>
        ) : (
          <p className="text-sm text-muted">Two dice. The sum is what pays.</p>
        )}
      </div>
      <Picks value={mode} onChange={setMode} options={[{ id: "0", label: "Under 7" }, { id: "1", label: "Over 7" }, { id: "2", label: "Exact 7" }, { id: "3", label: "Exact sum" }]} />
      {mode === "3" ? <Field label="Exact sum" value={target} onChange={setTarget} hint="2 to 12." /> : null}
      <Field label="Wager · FELT" value={stake} onChange={setStake} hint="1 to 500,000." />
      <Bomb text={local} />
      {live ? <p className="text-sm text-muted">This roll locks on Cronos, then the next block pays it. The wallet will ask twice.</p> : null}
      <Go testId="button-dice" disabled={busy} onClick={() => {
        if (!live) {
          go(() => ({ type: "dice", mode: Number(mode), target: Number(target), stake: parseFelt(stake) }));
          return;
        }
        void run(async () => {
          const played = await playOnChain("dice", [Number(mode), BigInt(target), parseFelt(stake)]);
          send({ type: "chain-play", game: "dice", line: resultLine(played.payout, played.stake, played.detail), stake: played.stake, payout: played.payout });
        });
      }}>{busy ? "Waiting for Cronos" : "Roll dice"}</Go>
    </div>
  );
}

function RoulettePage() {
  const { go, run, busy, local, state, send } = useForm();
  const [kind, setKind] = useState("1");
  const [pick, setPick] = useState("0");
  const [stake, setStake] = useState("10");
  const n = /landed on (\d+)/.exec(state.last.line)?.[1];
  const live = Boolean(state.address && state.chainOk);
  return (
    <div className="grid gap-4">
      <div className="grid h-24 w-24 place-items-center rounded-full border border-gold bg-ink font-display text-3xl">{n ?? "—"}</div>
      <Picks value={kind} onChange={setKind} options={[{ id: "0", label: "Number" }, { id: "1", label: "Red" }, { id: "2", label: "Black" }, { id: "3", label: "Even" }, { id: "4", label: "Odd" }, { id: "5", label: "Dozen" }]} />
      {kind === "0" || kind === "5" ? <Field label={kind === "5" ? "Dozen 1–3" : "Number 0–36"} value={pick} onChange={setPick} /> : null}
      <Field label="Wager · FELT" value={stake} onChange={setStake} />
      <Bomb text={local} />
      <Go disabled={busy} onClick={() => {
        if (!live) {
          go(() => ({ type: "roulette", kind: Number(kind), pick: Number(pick), stake: parseFelt(stake) }));
          return;
        }
        void run(async () => {
          const played = await playOnChain("roulette", [Number(kind), BigInt(pick), parseFelt(stake)]);
          send({ type: "chain-play", game: "roulette", line: resultLine(played.payout, played.stake, played.detail), stake: played.stake, payout: played.payout });
        });
      }}>{busy ? "Waiting for Cronos" : "Spin"}</Go>
    </div>
  );
}

function SlotsPage() {
  const { go, run, busy, local, state, send } = useForm();
  const [stake, setStake] = useState("10");
  const reels = /Reels (.+)\./.exec(state.last.line)?.[1]?.split(/\s*(?:·|\|)\s*/) ?? [];
  const live = Boolean(state.address && state.chainOk);
  return (
    <div className="grid gap-4">
      <div className="flex gap-2">{[0, 1, 2].map((i) => <div key={i} className="grid h-20 w-20 place-items-center rounded-lg border border-line bg-ink font-display text-xl">{reels[i] ?? "—"}</div>)}</div>
      <Field label="Wager · FELT" value={stake} onChange={setStake} />
      <Bomb text={local} />
      <Go disabled={busy} onClick={() => {
        if (!live) {
          go(() => ({ type: "slots", stake: parseFelt(stake) }));
          return;
        }
        void run(async () => {
          const played = await playOnChain("slots", [parseFelt(stake)]);
          send({ type: "chain-play", game: "slots", line: resultLine(played.payout, played.stake, played.detail), stake: played.stake, payout: played.payout });
        });
      }}>{busy ? "Waiting for Cronos" : "Spin"}</Go>
    </div>
  );
}

function PlinkoPage() {
  const { go, run, busy, local, state, send } = useForm();
  const [diff, setDiff] = useState("1");
  const [stake, setStake] = useState("10");
  const bucket = Number(/bucket (\d+)/.exec(state.last.line)?.[1] ?? -1);
  const live = Boolean(state.address && state.chainOk);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">{Array.from({ length: 9 }, (_, i) => <div key={i} className={`grid h-11 w-11 place-items-center rounded-lg border text-sm ${i === bucket ? "border-gold bg-gold text-ink" : "border-line"}`}>{i}</div>)}</div>
      <Picks value={diff} onChange={setDiff} options={[{ id: "0", label: "Low" }, { id: "1", label: "Medium" }, { id: "2", label: "High" }]} />
      <Field label="Wager · FELT" value={stake} onChange={setStake} />
      <Bomb text={local} />
      <Go disabled={busy} onClick={() => {
        if (!live) {
          go(() => ({ type: "plinko", difficulty: Number(diff), stake: parseFelt(stake) }));
          return;
        }
        void run(async () => {
          const played = await playOnChain("plinko", [Number(diff), parseFelt(stake)]);
          send({ type: "chain-play", game: "plinko", line: resultLine(played.payout, played.stake, played.detail), stake: played.stake, payout: played.payout });
        });
      }}>{busy ? "Waiting for Cronos" : "Drop"}</Go>
    </div>
  );
}

function KenoPage() {
  const { go, local } = useForm();
  const [picks, setPicks] = useState<number[]>([]);
  const [stake, setStake] = useState("10");
  function toggle(n: number) {
    setPicks((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : cur.length >= 10 ? cur : [...cur, n]));
  }
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
        {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" onClick={() => toggle(n)} className={`min-h-11 rounded-lg border text-sm ${picks.includes(n) ? "border-gold bg-gold text-ink" : "border-line"}`}>{n}</button>
        ))}
      </div>
      <Field label="Wager · FELT" value={stake} onChange={setStake} hint="Up to 10,000 FELT." />
      <Bomb text={local} />
      <Go onClick={() => go(() => ({ type: "keno", picks, stake: parseFelt(stake) }))}>Play keno</Go>
    </div>
  );
}

function BaccaratPage() {
  const { go, local } = useForm();
  const [side, setSide] = useState("0");
  const [stake, setStake] = useState("10");
  return (
    <div className="grid gap-4">
      <Picks value={side} onChange={setSide} options={[{ id: "0", label: "Player" }, { id: "1", label: "Banker" }, { id: "2", label: "Tie" }]} />
      <Field label="Wager · FELT" value={stake} onChange={setStake} />
      <Bomb text={local} />
      <Go onClick={() => go(() => ({ type: "baccarat", side: Number(side), stake: parseFelt(stake) }))}>Deal</Go>
    </div>
  );
}

function HiloPage() {
  const { state, send, local, go } = useForm();
  const [stake, setStake] = useState("10");
  const hand = state.hilo[state.acting];
  return (
    <div className="grid gap-4">
      <div className="grid h-24 w-16 place-items-center rounded-lg border border-line bg-parchment font-display text-3xl text-ink">{hand ? (hand.card === 1 ? "A" : hand.card > 10 ? ["J", "Q", "K"][hand.card - 11] : hand.card) : "—"}</div>
      {hand?.alive ? (
        <div className="flex flex-wrap gap-2">
          <Go onClick={() => send({ type: "hilo-guess", higher: true })}>Higher</Go>
          <Go quiet onClick={() => send({ type: "hilo-guess", higher: false })}>Lower</Go>
          <Go quiet onClick={() => send({ type: "hilo-cash" })}>Cash out</Go>
        </div>
      ) : (
        <>
          <Field label="Wager · FELT" value={stake} onChange={setStake} />
          <Go onClick={() => go(() => ({ type: "hilo-deal", stake: parseFelt(stake) }))}>Deal</Go>
        </>
      )}
      <Bomb text={local} />
    </div>
  );
}

function MinesPage() {
  const { state, send, go, local } = useForm();
  const [stake, setStake] = useState("10");
  const board = state.mines[state.acting];
  return (
    <div className="grid gap-4">
      <div className="grid max-w-sm grid-cols-5 gap-1">
        {Array.from({ length: 25 }, (_, tile) => {
          const open = board?.revealed.includes(tile);
          const boom = board?.boom === tile;
          return (
            <button key={tile} type="button" disabled={!board?.alive} onClick={() => send({ type: "mines-reveal", tile })} className={`min-h-11 rounded-lg border text-sm ${boom ? "border-wine text-wine" : open ? "border-gold text-gold" : "border-line"}`}>
              {boom ? "Mine" : open ? "Safe" : tile}
            </button>
          );
        })}
      </div>
      {board?.alive ? <Go onClick={() => send({ type: "mines-cash" })}>Cash out</Go> : (
        <>
          <Field label="Wager · FELT" value={stake} onChange={setStake} />
          <Go onClick={() => go(() => ({ type: "mines-start", stake: parseFelt(stake) }))}>Start round</Go>
        </>
      )}
      <Bomb text={local} />
    </div>
  );
}

function BjPage() {
  const { state, send, go, local } = useForm();
  const [stake, setStake] = useState("10");
  const bj = state.bj[state.acting];
  const open = bj && bj.phase === 1;
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><span className="text-xs text-muted uppercase">Dealer</span><Cards cards={bj?.dealer ?? []} /></div>
        <div className="grid gap-2">
          <span className="text-xs text-muted uppercase">You {open ? `· hand ${bj.active + 1}` : ""}</span>
          {(bj?.hands ?? [[]]).map((hand, index) => (
            <div key={index} className="grid gap-1">
              <Cards cards={hand} />
              {hand.length ? <span className="text-xs text-muted">{bjTotal(hand)}</span> : null}
            </div>
          ))}
        </div>
      </div>
      {open ? (
        <div className="flex flex-wrap gap-2">
          <Go onClick={() => send({ type: "bj-hit" })}>Hit</Go>
          <Go quiet onClick={() => send({ type: "bj-stand" })}>Stand</Go>
          <Go quiet onClick={() => send({ type: "bj-double" })}>Double</Go>
          <Go quiet onClick={() => send({ type: "bj-split" })}>Split</Go>
        </div>
      ) : (
        <>
          <Field label="Even wager · FELT" value={stake} onChange={setStake} />
          <Go onClick={() => go(() => ({ type: "bj-deal", stake: parseFelt(stake) }))}>Deal</Go>
        </>
      )}
      <Bomb text={local} />
    </div>
  );
}

function PokerPage() {
  const { state, send, go, local } = useForm();
  const [ante, setAnte] = useState("10");
  const hand = state.poker[state.acting];
  const showDealer = Boolean(hand && hand.phase === 0 && hand.scoreP);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <div className="grid gap-2"><span className="text-xs text-muted uppercase">Board</span><Cards cards={hand?.board ?? []} /></div>
        <div className="grid gap-2"><span className="text-xs text-muted uppercase">Your hole cards</span><Cards cards={hand?.hole ?? []} /></div>
        {showDealer ? (
          <div className="grid gap-2">
            <span className="text-xs text-muted uppercase">House · {hand ? handName(hand.scoreD) : ""}</span>
            <Cards cards={hand?.dealer ?? []} />
          </div>
        ) : null}
      </div>
      {hand?.phase === 1 ? (
        <div className="flex flex-wrap gap-2">
          <Go onClick={() => send({ type: "poker-call" })}>Call · 2× ante</Go>
          <Go quiet onClick={() => send({ type: "poker-fold" })}>Fold</Go>
        </div>
      ) : (
        <>
          <Field label="Ante · FELT" value={ante} onChange={setAnte} hint="1 to 5,000. A call is twice this." />
          <Go testId="button-poker" onClick={() => go(() => ({ type: "poker-deal", ante: parseFelt(ante) }))}>Deal</Go>
        </>
      )}
      <Bomb text={local} />
    </div>
  );
}

function DuelPage() {
  const { state, send, go, local } = useForm();
  const [buy, setBuy] = useState("20");
  const [extra, setExtra] = useState("2");
  const p = state.pvp;
  const me = state.acting;
  const street = ["", "", "Preflop", "Flop", "Turn", "River"][p?.phase ?? 0] ?? "";
  return (
    <div className="grid gap-4">
      {p && p.phase >= 2 ? (
        <>
          <p className="text-sm text-muted">{street}. Pot {formatFelt(p.pot)}. To act: seat {p.toAct === 0 ? "A" : "B"}.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {([0, 1] as const).map((id) => (
              <div key={id} className="grid gap-2 rounded-lg border border-line p-3">
                <span className="text-xs text-muted uppercase">Seat {id === 0 ? "A" : "B"} · stack {formatFelt(p.stack[id])}</span>
                {id === me || p.phase === 0 ? <Cards cards={p.hole[id]} /> : <p className="text-sm text-muted">Two cards face down.</p>}
              </div>
            ))}
          </div>
          <Cards cards={p.board} />
          {p.toAct === me ? (
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                <Go quiet onClick={() => send({ type: "pvp-check" })}>Check</Go>
                <Go onClick={() => send({ type: "pvp-call" })}>Call</Go>
                <Go quiet onClick={() => send({ type: "pvp-allin" })}>All-in</Go>
                <Go quiet onClick={() => send({ type: "pvp-fold" })}>Fold</Go>
              </div>
              <Field label="Raise extra · FELT" value={extra} onChange={setExtra} hint="Added on top of a call." />
              <Go quiet onClick={() => go(() => ({ type: "pvp-raise", extra: parseFelt(extra) }))}>Raise</Go>
            </div>
          ) : <p className="text-sm text-muted">Switch seats to take the other chair.</p>}
        </>
      ) : (
        <>
          <Field label="Buy-in · whole FELT" value={buy} onChange={setBuy} hint="20 to 50,000. You are the small blind." />
          <div className="flex flex-wrap gap-2">
            <Go onClick={() => go(() => ({ type: "pvp-host", buy: parseFelt(buy) }))}>Host the table</Go>
            <Go quiet onClick={() => send({ type: "pvp-join" })}>Sit and deal</Go>
            <Go quiet onClick={() => send({ type: "pvp-leave" })}>Leave</Go>
          </div>
        </>
      )}
      <Bomb text={local} />
    </div>
  );
}

function TablePage() {
  const { state, send, go, local } = useForm();
  const [stake, setStake] = useState("10");
  const [chair, setChair] = useState("0");
  const t = state.table;
  return (
    <div className="grid gap-4">
      <div className="grid gap-2"><span className="text-xs text-muted uppercase">Dealer</span><Cards cards={t.dealer} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {([0, 1] as const).map((id) => (
          <div key={id} className="grid gap-2 rounded-lg border border-line p-3">
            <span className="text-xs text-muted uppercase">Seat {id === 0 ? "A" : "B"} {t.in[id] ? `· ${formatFelt(t.bet[id])}` : "· empty"} {t.done[id] ? "· stood" : ""}</span>
            <Cards cards={t.hands[id]} />
            {t.hands[id].length ? <span className="text-xs text-muted">{bjTotal(t.hands[id])}</span> : null}
          </div>
        ))}
      </div>
      {t.phase === 2 ? (
        <div className="flex flex-wrap gap-2">
          <Go onClick={() => send({ type: "table-hit" })}>Hit</Go>
          <Go quiet onClick={() => send({ type: "table-stand" })}>Stand</Go>
          <Go quiet onClick={() => send({ type: "table-double" })}>Double</Go>
        </div>
      ) : (
        <>
          <Picks value={chair} onChange={setChair} options={[{ id: "0", label: "Seat A" }, { id: "1", label: "Seat B" }]} />
          <Field label="Even wager · FELT" value={stake} onChange={setStake} />
          <div className="flex flex-wrap gap-2">
            <Go onClick={() => go(() => {
              const stakeAmt = parseFelt(stake);
              const seat = Number(chair) as SeatId;
              send({ type: "act", seat });
              return { type: "table-sit", seat, stake: stakeAmt };
            })}>Take that seat</Go>
            <Go quiet onClick={() => send({ type: "table-leave" })}>Leave</Go>
          </div>
        </>
      )}
      <Bomb text={local} />
    </div>
  );
}

function LotteryPage() {
  const { state, send, go, local } = useForm();
  const [n, setN] = useState("1");
  const [burn, setBurn] = useState("0");
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Round" value={String(state.round)} />
        <Stat label="Pot" value={`${formatFelt(state.pot)} FELT`} />
        <Stat label="Scrolls in" value={String(state.totalTickets)} />
      </div>
      <Field label="Scrolls to pay" value={n} onChange={setN} />
      <Field label="Scrolls to burn" value={burn} onChange={setBurn} hint="Burned scrolls still enter the draw." />
      <div className="flex flex-wrap gap-2">
        <Go onClick={() => go(() => ({ type: "scroll-pay", n: Number(n) }))}>Pay into pot</Go>
        <Go quiet onClick={() => go(() => ({ type: "scroll-burn", n: Number(n) }))}>Burn scrolls</Go>
        <Go quiet onClick={() => go(() => ({ type: "scroll-both", pay: Number(n), burn: Number(burn) }))}>Pay and burn</Go>
        <Go onClick={() => send({ type: "draw" })}>Draw</Go>
      </div>
      <ul className="grid gap-1 text-sm text-muted">
        {state.tickets.map((row) => <li key={row.seat}>Seat {row.seat === 0 ? "A" : "B"} · {row.n} scrolls</li>)}
      </ul>
      <Bomb text={local} />
    </div>
  );
}

function DeskPage() {
  const { state, send, go, local } = useForm();
  const [brief, setBrief] = useState("");
  const [hours, setHours] = useState("24");
  const [pay, setPay] = useState("10");
  const [work, setWork] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div className="grid gap-4">
      <Area label="Brief" value={brief} onChange={setBrief} hint="Locked once posted. 240 bytes." />
      <Field label="Hours to submit" value={hours} onChange={setHours} hint="1 to 336." />
      <Field label="Pay · FELT" value={pay} onChange={setPay} hint="From this seat's vault. Minimum 1." />
      <Go onClick={() => go(() => ({ type: "job-open", brief, hours: Number(hours), pay: parseFelt(pay) }))}>Post the job</Go>
      <Area label="Work" value={work} onChange={setWork} hint="The other seat submits. 240 bytes." />
      <Field label="Rejection reason" value={reason} onChange={setReason} hint="Required to send the FELT back. 120 bytes." />
      <Bomb text={local} />
      <ul className="grid gap-3">
        {state.jobs.length === 0 ? <li className="text-sm text-muted">No jobs yet.</li> : null}
        {state.jobs.map((job) => (
          <li key={job.id} className="grid gap-2 rounded-lg border border-line p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong>#{job.id} · {formatFelt(job.pay)} FELT</strong>
              <span className="text-xs text-muted uppercase">{job.state === 0 ? "Open" : job.state === 1 ? "Work in" : job.state === 2 ? "Paid" : "Returned"}</span>
            </div>
            <p className="text-sm">{job.brief}</p>
            {job.work ? <p className="text-sm text-muted">Work: {job.work}</p> : null}
            {job.reason ? <p className="text-sm text-muted">Reason: {job.reason}</p> : null}
            <p className="text-xs text-muted">Seat {job.creator === 0 ? "A" : "B"} posted it. Submit before {new Date(job.deadline).toLocaleString()}.</p>
            <div className="flex flex-wrap gap-2">
              {job.state === 0 ? <Go onClick={() => go(() => ({ type: "job-submit", id: job.id, work }))}>Submit</Go> : null}
              {job.state === 0 ? <Go quiet onClick={() => send({ type: "job-cancel", id: job.id })}>Cancel</Go> : null}
              {job.state === 1 ? <Go onClick={() => send({ type: "job-approve", id: job.id })}>Pay</Go> : null}
              {job.state === 1 ? <Go quiet onClick={() => go(() => ({ type: "job-reject", id: job.id, reason }))}>Send back</Go> : null}
              {job.state === 1 ? <Go quiet onClick={() => send({ type: "job-settle", id: job.id })}>Settle silence</Go> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RacePage() {
  const { state, send, go, local } = useForm();
  const [name, setName] = useState("Tonight");
  const [hours, setHours] = useState("1");
  const [prize, setPrize] = useState("100");
  return (
    <div className="grid gap-4">
      <Field label="Name" value={name} onChange={setName} />
      <Field label="Hours" value={hours} onChange={setHours} />
      <Field label="Prize · FELT" value={prize} onChange={setPrize} hint="Locked from this seat's vault." />
      <Go onClick={() => go(() => ({ type: "contest-open", name, hours: Number(hours), prize: parseFelt(prize) }))}>Open the race</Go>
      <Bomb text={local} />
      <ul className="grid gap-3">
        {state.contests.map((race) => (
          <li key={race.id} className="grid gap-2 rounded-lg border border-line p-3">
            <strong>{race.name} · {formatFelt(race.prize)} FELT</strong>
            <p className="text-sm text-muted">Seat A {formatFelt(race.net[0])} · {race.wins[0]} wins. Seat B {formatFelt(race.net[1])} · {race.wins[1]} wins.</p>
            <p className="text-xs text-muted">{race.settled ? "Settled" : `Ends ${new Date(race.end).toLocaleString()}`}</p>
            {!race.settled ? <Go quiet onClick={() => send({ type: "contest-claim", id: race.id })}>Settle</Go> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WalletPage() {
  const { state, send, go, run, busy, local, refresh } = useForm();
  const [amount, setAmount] = useState("1000");
  const [arm, setArm] = useState(false);
  const seat = state.seats[state.acting];
  const live = Boolean(state.address && state.chainOk);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Wallet" value={`${formatFelt(live ? (state.chainWallet ?? 0n) : seat.wallet)} FELT`} />
        <Stat label="Vault" value={`${formatFelt(live ? (state.chainVault ?? 0n) : seat.vault)} FELT`} />
        <Stat label="CRO" value={live ? "gas" : seat.cro.toString()} />
      </div>
      <Field label="Amount · FELT" value={amount} onChange={setAmount} />
      <div className="flex flex-wrap gap-2">
        {live ? <Go disabled={busy} onClick={() => void run(async () => { await claimDrip(); await refresh(); })}>Claim 10,000 FELT</Go> : null}
        <Go disabled={busy} onClick={() => {
          if (!live) {
            go(() => ({ type: "deposit", amount: parseFelt(amount) }));
            return;
          }
          void run(async () => { await depositFelt(parseFelt(amount)); await refresh(); });
        }}>Deposit to vault</Go>
        <Go quiet disabled={busy} onClick={() => {
          if (!live) {
            go(() => ({ type: "withdraw", amount: parseFelt(amount) }));
            return;
          }
          void run(async () => { await withdrawFelt(parseFelt(amount)); await refresh(); });
        }}>Withdraw</Go>
      </div>
      <p className="text-sm text-muted">House bank {formatFelt(live ? (state.chainBank ?? 0n) : state.bank)} FELT. Burned {formatFelt(live ? (state.chainBurned ?? 0n) : state.burned)}. Buyback {formatFelt(live ? (state.chainBuyback ?? 0n) : state.buyback)}. Set aside for stakers {formatFelt(live ? (state.chainStakers ?? 0n) : state.stakers)}.</p>
      <p className="text-sm text-muted">FELT {FELT}. Each wallet can claim 10,000 FELT once. CRO only pays gas.</p>
      {arm ? <Go quiet onClick={() => send({ type: "reset" })}>Confirm reset of both practice seats</Go> : <Go quiet onClick={() => setArm(true)}>Reset practice seats</Go>}
      <Bomb text={local} />
    </div>
  );
}

function StakePage() {
  const { state, send, go, local } = useForm();
  const [tier, setTier] = useState("1");
  const [cro, setCro] = useState("100");
  const lock = state.seats[state.acting].lock;
  const due = owedOf(state, state.acting);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Your CRO" value={state.seats[state.acting].cro.toString()} />
        <Stat label="Total weight" value={state.weight.toString()} />
        <Stat label="Owed" value={`${formatFelt(due)} FELT`} />
      </div>
      {lock ? <p className="text-sm text-muted">Locked {lock.amount.toString()} CRO at tier {lock.tier}. Unlocks {new Date(lock.unlockAt).toLocaleString()}.</p> : null}
      <Picks value={tier} onChange={setTier} options={[{ id: "1", label: "7 days · 1.0×" }, { id: "2", label: "30 days · 1.5×" }, { id: "3", label: "90 days · 2.0×" }]} />
      <Field label="CRO to lock" value={cro} onChange={setCro} />
      <div className="flex flex-wrap gap-2">
        <Go onClick={() => go(() => ({ type: "stake", tier: Number(tier) as 1 | 2 | 3, cro: BigInt(cro) }))}>Lock</Go>
        <Go quiet onClick={() => send({ type: "stake-claim" })}>Claim FELT</Go>
        <Go quiet onClick={() => send({ type: "unstake" })}>Unstake</Go>
      </div>
      <Bomb text={local} />
    </div>
  );
}

function TithePage() {
  const { state, send, go, local } = useForm();
  const [tier, setTier] = useState("1");
  const [n, setN] = useState("1");
  const pack = state.seats[state.acting].tithe;
  return (
    <div className="grid gap-4">
      <Picks value={tier} onChange={setTier} options={[
        { id: "1", label: "5 → 6" }, { id: "2", label: "10 → 13" }, { id: "3", label: "30 → 45" },
        { id: "4", label: "100 → 175" }, { id: "5", label: "250 → 500" }, { id: "6", label: "500 → 1,100" },
      ]} />
      {pack ? <p className="text-sm text-muted">{pack.paid} paid and {pack.bonus} extra still in the pack. Escrow {formatFelt(pack.escrow)} FELT.</p> : <p className="text-sm text-muted">No pack is open on this seat.</p>}
      <Field label="Scrolls to allocate" value={n} onChange={setN} />
      <div className="flex flex-wrap gap-2">
        <Go onClick={() => go(() => ({ type: "tithe", tier: Number(tier) }))}>Buy pack</Go>
        <Go quiet onClick={() => go(() => ({ type: "tithe-allocate", n: Number(n) }))}>Allocate</Go>
        <Go quiet onClick={() => send({ type: "tithe-close" })}>Close pack</Go>
      </div>
      <Bomb text={local} />
    </div>
  );
}

function PilgrimPage() {
  const { state, send, go, local } = useForm();
  const [tier, setTier] = useState("1");
  const [amount, setAmount] = useState(formatFelt(FAITH_MIN));
  const seat = state.seats[state.acting];
  return (
    <div className="grid gap-4">
      <Stat label="Faith" value={seat.faith.toString()} />
      <Picks value={tier} onChange={setTier} options={[{ id: "1", label: "7 days · 20" }, { id: "2", label: "30 days · 60" }, { id: "3", label: "90 days · 150" }]} />
      <Field label="FELT to lock" value={amount} onChange={setAmount} hint="Minimum 20,000,000 FELT from the wallet." />
      <div className="flex flex-wrap gap-2">
        <Go onClick={() => go(() => ({ type: "pilgrim", tier: Number(tier) as 1 | 2 | 3, amount: parseFelt(amount) }))}>Begin</Go>
        <Go quiet onClick={() => go(() => ({ type: "faith-spend", n: 1 }))}>Spend 1 faith</Go>
      </div>
      <ul className="grid gap-2">
        {seat.pilgrims.map((row, index) => (
          <li key={`${row.unlockAt}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-3 text-sm">
            <span>{formatFelt(row.amount)} FELT · unlocks {new Date(row.unlockAt).toLocaleDateString()}</span>
            <Go quiet onClick={() => send({ type: "pilgrim-claim", index })}>Claim</Go>
          </li>
        ))}
      </ul>
      <Bomb text={local} />
    </div>
  );
}

function HousePage() {
  const { state, send, go, local } = useForm();
  const [owner, setOwner] = useState("0");
  const [to, setTo] = useState<string>(SEAT_ADDR[0]);
  const [amount, setAmount] = useState("1000");
  const [contract, setContract] = useState(state.contract);
  const who = Number(owner) as 0 | 1 | 2;
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="House bank" value={`${formatFelt(state.bank)} FELT`} />
        <Stat label="Staker pot" value={`${formatFelt(state.stakers)} FELT`} />
        <Stat label="Burned" value={`${formatFelt(state.burned)} FELT`} />
      </div>
      <p className="text-sm text-muted">Of a net loss, 15% is burned, 5% is buyback, 10% is set aside for stakers, and 70% stays in the house. Buyback is {formatFelt(state.chainOk ? (state.chainBuyback ?? 0n) : state.buyback)} FELT.</p>
      <p className="text-sm text-muted">House {FLOOR}. FELT {FELT}. Dice, roulette, slots, and plinko settle on that contract when the Cronos wallet is connected. The other tables still use the practice seats.</p>
      <Field label="Published contract" value={contract} onChange={setContract} hint="Paste the Cronos address after you publish." />
      <Go quiet onClick={() => send({ type: "contract", address: contract })}>Save contract</Go>
      <Picks value={owner} onChange={setOwner} options={[{ id: "0", label: "Owner 1" }, { id: "1", label: "Owner 2" }, { id: "2", label: "Owner 3" }]} />
      <Field label="Destination" value={to} onChange={setTo} hint={`Seat A ${SEAT_ADDR[0]} · Seat B ${SEAT_ADDR[1]}`} />
      <Field label="Amount · FELT" value={amount} onChange={setAmount} />
      <div className="flex flex-wrap gap-2">
        <Go onClick={() => go(() => ({ type: "house-propose", owner: who, to, amount: parseFelt(amount) }))}>Propose</Go>
        <Go quiet onClick={() => send({ type: "house-sign", owner: who })}>Approve</Go>
        <Go quiet onClick={() => send({ type: "house-execute", owner: who })}>Send</Go>
        <Go quiet onClick={() => send({ type: "house-reject", owner: who })}>Reject</Go>
      </div>
      {state.proposal ? <p className="text-sm">Waiting: {formatFelt(state.proposal.amount)} FELT to {short(state.proposal.to)}. Signatures {state.proposal.sigs.map((on) => (on ? "yes" : "no")).join(" · ")}.</p> : <p className="text-sm text-muted">No withdrawal is waiting.</p>}
      <Bomb text={local} />
      <p className="text-xs text-muted">A 5,000 ante and a 10,000 call return 30,000 when the player wins with a pair the house qualifies under. Profit is 15,000.</p>
    </div>
  );
}

function short(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

