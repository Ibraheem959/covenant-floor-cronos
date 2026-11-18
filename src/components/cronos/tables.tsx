import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Cards } from "@/components/cronos/bits";
import {
  BaccaratStage,
  DiceStage,
  HiloStage,
  KenoStage,
  Lobby,
  LotteryVisual,
  MineStage,
  PlinkoStage,
  RouletteStage,
  SlotsStage,
} from "@/components/cronos/stage";
import { chainBalances, claimDrip, depositFelt, playOnChain, withdrawFelt, buyScrolls, burnScrolls, drawLottery, readDesk } from "@/lib/cronos/chain";
import { useFloor } from "@/lib/cronos/store";
import { bjTotal, formatFelt, handName, parseFelt, resultLine, type Action } from "@/lib/cronos/logic";

export const PickPage = createContext<(id: string) => void>(() => {});
const CHAIN = true;

function usePlay() {
  const api = useFloor();
  const [local, setLocal] = useState("");
  const [busy, setBusy] = useState(false);
  const live = CHAIN && Boolean(api.state.address && api.state.chainOk);

  async function play(action: () => Action, chain?: () => Promise<void>, wait = 780) {
    try {
      setLocal("");
      setBusy(true);
      if (chain) {
        if (!live) throw new Error("Connect a Cronos wallet.");
        await chain();
        const row = await chainBalances(api.state.address);
        api.send({ type: "synced", wallet: row.wallet, vault: row.vault, bank: row.bank, burned: row.burned, buyback: row.buyback, stakers: row.stakers, cro: row.cro });
      } else if (live) {
        throw new Error("This table is not on the Cronos contract yet.");
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, wait));
        api.send(action());
      }
    } catch (error) {
      setLocal(error instanceof Error ? error.message : "That play did not settle.");
    } finally {
      setBusy(false);
    }
  }

  return { ...api, local, busy, live, play };
}

function Cashier() {
  const { state, send, live } = usePlay();
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const vault = state.address ? state.chainVault : 0n;

  async function run(task: () => Promise<void> | void) {
    try {
      setNote("");
      setBusy(true);
      await task();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "The wallet refused that.");
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    const row = await chainBalances(state.address);
    send({ type: "synced", wallet: row.wallet, vault: row.vault, bank: row.bank, burned: row.burned, buyback: row.buyback, stakers: row.stakers, cro: row.cro });
  }

  return (
    <section className="cashier-panel" aria-label="FELT vault">
      <div className="cashier-balance">
        <span className="eyebrow">PLAYER VAULT</span>
        <strong>{formatFelt(vault)} FELT</strong>
        <small>Wagers come out of this balance.</small>
      </div>
      <div className="cashier-actions">
        <label className="field">
          <span>Amount · FELT</span>
          <input value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} />
        </label>
        <button type="button" className="action-button" disabled={busy} onClick={() => void run(async () => {
          if (!live) throw new Error("Connect a Cronos wallet.");
          await depositFelt(parseFelt(amount));
          await refresh();
        })}>Deposit</button>
        <button type="button" className="action-button" disabled={busy} onClick={() => void run(async () => {
          if (!live) throw new Error("Connect a Cronos wallet.");
          await withdrawFelt(parseFelt(amount));
          await refresh();
        })}>Withdraw</button>
      </div>
      {live ? <button type="button" className="action-button action-primary cashier-claim" disabled={busy} onClick={() => void run(async () => { await claimDrip(); await refresh(); })}>Claim 10,000</button> : null}
      {note ? <p className="inline-error">{note}</p> : null}
    </section>
  );
}

function Play({ page, title, busy, stage, children }: { page: string; title: string; busy: boolean; stage: ReactNode; children: ReactNode }) {
  const { state } = useFloor();
  const last = state.last.game === page ? state.last : null;
  const tone = last?.tone === "win" ? "win" : last?.tone === "loss" ? "loss" : "push";
  return (
    <div className="grid gap-4">
      <Cashier />
      <div className="game-room-grid">
        <section className="game-table-card" aria-label={`${title} table`}>
          <div className="game-table-top">
            <div>
              <span className="eyebrow">ON-CHAIN TABLE</span>
              <h2>{title}</h2>
            </div>
            <span className={`table-state ${busy ? "table-state-busy" : last ? "table-state-settled" : ""}`}>
              <i />
              {busy ? "SETTLING" : last ? last.title : "READY"}
            </span>
          </div>
          {stage}
          <div className={`round-banner ${busy ? "round-pending" : last ? `round-${tone}` : "round-idle"}`} role="status">
            <strong>{busy ? "YOUR TABLE IS MOVING" : last?.title ?? "LAST SETTLED ROUND"}</strong>
            <span>{busy ? "The table stops when this round settles." : last?.line ?? "Place a wager. The result lands on this felt."}</span>
          </div>
        </section>
        <section className="game-controls">
          <div className="game-controls-heading">
            <span className="eyebrow">YOUR NEXT MOVE</span>
            <h2>Play {title}</h2>
            <p>1–10,000 FELT a wager. A win returns to this vault in the same round.</p>
          </div>
          <div className="game-action-grid">{children}</div>
        </section>
      </div>
    </div>
  );
}

function Move({ label, busy, onSubmit, children }: { label: string; busy?: boolean; onSubmit: () => void; children?: ReactNode }) {
  return (
    <form className="action-card" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      {children ? <div className="field-list">{children}</div> : null}
      <button className="action-button action-primary" type="submit" disabled={busy}>
        <span>{busy ? "Waiting…" : label}</span>
        <span>{busy ? "•••" : "↗"}</span>
      </button>
    </form>
  );
}

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { id: string; label: string }[] }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  );
}

function Amount({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} inputMode="decimal" onChange={(event) => onChange(event.target.value)} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function Fault({ text }: { text: string }) {
  if (!text) return null;
  return <p className="inline-error">{text}</p>;
}

export function DicePage() {
  const play = usePlay();
  const [mode, setMode] = useState("0");
  const [target, setTarget] = useState("7");
  const [stake, setStake] = useState("10");
  const sum = Number(/summed to (\d+)/.exec(play.state.last.game === "dice" ? play.state.last.line : "")?.[1] ?? 0);
  const calls = ["Under 7", "Over 7", "Exact 7", "Exact sum"];
  return (
    <Play page="dice" title="Dice" busy={play.busy} stage={<DiceStage sum={!play.busy && sum >= 2 ? sum : null} rolling={play.busy} call={calls[Number(mode)]} />}>
      <Move label="Roll dice" busy={play.busy} onSubmit={() => void play.play(
        () => ({ type: "dice", mode: Number(mode), target: Number(target), stake: parseFelt(stake) }),
        async () => {
          const played = await playOnChain("dice", [Number(mode), BigInt(target), parseFelt(stake)]);
          play.send({ type: "chain-play", game: "dice", line: resultLine(played.payout, played.stake, played.detail), stake: played.stake, payout: played.payout });
        },
      )}>
        <Choice label="Bet mode" value={mode} onChange={setMode} options={[{ id: "0", label: "Under 7" }, { id: "1", label: "Over 7" }, { id: "2", label: "Exact 7" }, { id: "3", label: "Exact sum" }]} />
        {mode === "3" ? <Amount label="Exact sum" value={target} onChange={setTarget} hint="2 to 12. Other modes ignore this." /> : null}
        <Amount label="Wager · FELT" value={stake} onChange={setStake} />
        <Fault text={play.local} />
      </Move>
    </Play>
  );
}

export function RoulettePage() {
  const play = usePlay();
  const [kind, setKind] = useState("1");
  const [pick, setPick] = useState("17");
  const [stake, setStake] = useState("10");
  const pocket = Number(/landed on (\d+)/.exec(play.state.last.game === "roulette" ? play.state.last.line : "")?.[1] ?? -1);
  return (
    <Play page="roulette" title="Roulette" busy={play.busy} stage={<RouletteStage pocket={!play.busy && pocket >= 0 ? pocket : null} rolling={play.busy} />}>
      <Move label="Place roulette wager" busy={play.busy} onSubmit={() => void play.play(
        () => ({ type: "roulette", kind: Number(kind), pick: Number(pick), stake: parseFelt(stake) }),
        async () => {
          const played = await playOnChain("roulette", [Number(kind), BigInt(pick), parseFelt(stake)]);
          play.send({ type: "chain-play", game: "roulette", line: resultLine(played.payout, played.stake, played.detail), stake: played.stake, payout: played.payout });
        },
      )}>
        <Choice label="Bet type" value={kind} onChange={setKind} options={[{ id: "0", label: "Exact number" }, { id: "1", label: "Red" }, { id: "2", label: "Black" }, { id: "3", label: "Even" }, { id: "4", label: "Odd" }, { id: "5", label: "Dozen" }]} />
        {kind === "0" || kind === "5" ? <Amount label={kind === "5" ? "Dozen · 1–3" : "Number · 0–36"} value={pick} onChange={setPick} /> : null}
        <Amount label="Wager · FELT" value={stake} onChange={setStake} />
        <Fault text={play.local} />
      </Move>
    </Play>
  );
}

export function SlotsPage() {
  const play = usePlay();
  const [stake, setStake] = useState("10");
  const reels = /Reels (.+)\./.exec(play.state.last.game === "slots" ? play.state.last.line : "")?.[1]?.split(/\s*(?:·|\|)\s*/) ?? [];
  return (
    <Play page="slots" title="Slots" busy={play.busy} stage={<SlotsStage reels={reels} rolling={play.busy} />}>
      <Move label="Spin" busy={play.busy} onSubmit={() => void play.play(
        () => ({ type: "slots", stake: parseFelt(stake) }),
        async () => {
          const played = await playOnChain("slots", [parseFelt(stake)]);
          play.send({ type: "chain-play", game: "slots", line: resultLine(played.payout, played.stake, played.detail), stake: played.stake, payout: played.payout });
        },
      )}>
        <Amount label="Wager · FELT" value={stake} onChange={setStake} />
        <Fault text={play.local} />
      </Move>
    </Play>
  );
}

export function PlinkoPage() {
  const play = usePlay();
  const [diff, setDiff] = useState("1");
  const [stake, setStake] = useState("10");
  const bucket = Number(/bucket (\d+)/.exec(play.state.last.game === "plinko" ? play.state.last.line : "")?.[1] ?? -1);
  return (
    <Play page="plinko" title="Plinko" busy={play.busy} stage={<PlinkoStage bucket={bucket} rolling={play.busy} />}>
      <Move label="Drop" busy={play.busy} onSubmit={() => void play.play(
        () => ({ type: "plinko", difficulty: Number(diff), stake: parseFelt(stake) }),
        async () => {
          const played = await playOnChain("plinko", [Number(diff), parseFelt(stake)]);
          play.send({ type: "chain-play", game: "plinko", line: resultLine(played.payout, played.stake, played.detail), stake: played.stake, payout: played.payout });
        },
      )}>
        <Choice label="Difficulty" value={diff} onChange={setDiff} options={[{ id: "0", label: "Low" }, { id: "1", label: "Medium" }, { id: "2", label: "High" }]} />
        <Amount label="Wager · FELT" value={stake} onChange={setStake} />
        <Fault text={play.local} />
      </Move>
    </Play>
  );
}

export function KenoPage() {
  const play = usePlay();
  const [picks, setPicks] = useState<number[]>([]);
  const [stake, setStake] = useState("10");
  const hits = /(\d+) of /.exec(play.state.last.game === "keno" ? play.state.last.line : "")?.[1];
  function toggle(n: number) {
    setPicks((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : cur.length >= 10 ? cur : [...cur, n].sort((a, b) => a - b)));
  }
  return (
    <Play page="keno" title="Keno" busy={play.busy} stage={<KenoStage picks={picks} onToggle={toggle} hits={play.busy ? "DRAWING" : hits ? `${hits} HITS` : undefined} />}>
      <Move label="Play keno" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "keno", picks, stake: parseFelt(stake) }))}>
        <Amount label="Wager · FELT" value={stake} onChange={setStake} hint={`${picks.length} selected on the board. Choose 1 to 10.`} />
        <Fault text={play.local} />
      </Move>
    </Play>
  );
}

export function BaccaratPage() {
  const play = usePlay();
  const [side, setSide] = useState("0");
  const [stake, setStake] = useState("10");
  const found = /Player (\d+), banker (\d+)/.exec(play.state.last.game === "baccarat" ? play.state.last.line : "");
  return (
    <Play page="baccarat" title="Baccarat" busy={play.busy} stage={<BaccaratStage rolling={play.busy} player={found ? Number(found[1]) : null} banker={found ? Number(found[2]) : null} />}>
      <Move label="Deal baccarat" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "baccarat", side: Number(side), stake: parseFelt(stake) }))}>
        <Choice label="Bet side" value={side} onChange={setSide} options={[{ id: "0", label: "Player" }, { id: "1", label: "Banker" }, { id: "2", label: "Tie" }]} />
        <Amount label="Wager · FELT" value={stake} onChange={setStake} />
        <Fault text={play.local} />
      </Move>
    </Play>
  );
}

export function HiloPage() {
  const play = usePlay();
  const [stake, setStake] = useState("10");
  const hand = play.state.hilo[play.state.acting];
  return (
    <Play page="hi-lo" title="Hi-Lo" busy={play.busy} stage={<HiloStage card={hand?.card ?? null} rolling={play.busy} />}>
      {hand?.alive ? (
        <>
          <Move label="Higher" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "hilo-guess", higher: true }), undefined, 520)} />
          <Move label="Lower" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "hilo-guess", higher: false }), undefined, 520)} />
          <Move label="Cash out" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "hilo-cash" }), undefined, 420)} />
        </>
      ) : (
        <Move label="Deal hand" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "hilo-deal", stake: parseFelt(stake) }))}>
          <Amount label="Wager · FELT" value={stake} onChange={setStake} />
          <Fault text={play.local} />
        </Move>
      )}
      {hand?.alive ? <Fault text={play.local} /> : null}
    </Play>
  );
}

export function MinesPage() {
  const play = usePlay();
  const [stake, setStake] = useState("10");
  const board = play.state.mines[play.state.acting];
  return (
    <Play
      page="mines"
      title="Mines"
      busy={play.busy}
      stage={<MineStage alive={Boolean(board?.alive)} busy={play.busy} revealed={board?.revealed ?? []} boom={board?.boom} onReveal={(tile) => void play.play(() => ({ type: "mines-reveal", tile }), undefined, 420)} />}
    >
      {board?.alive ? (
        <Move label="Cash out" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "mines-cash" }), undefined, 420)} />
      ) : (
        <Move label="Start round" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "mines-start", stake: parseFelt(stake) }))}>
          <Amount label="Wager · FELT" value={stake} onChange={setStake} hint="Then tap a tile on the board." />
          <Fault text={play.local} />
        </Move>
      )}
      {board?.alive ? <Fault text={play.local} /> : null}
    </Play>
  );
}

export function BjPage() {
  const play = usePlay();
  const [stake, setStake] = useState("10");
  const bj = play.state.bj[play.state.acting];
  const open = Boolean(bj && bj.phase === 1);
  return (
    <Play page="blackjack" title="Blackjack" busy={play.busy} stage={
      <div className={`game-stage card-table-stage ${play.busy ? "stage-active" : ""}`}>
        <div className="card-table-heading"><span>DEALER</span><span>BLACKJACK</span></div>
        <div className="card-row"><span>Dealer {bj ? bjTotal(bj.dealer) : ""}</span><Cards cards={bj?.dealer ?? []} /></div>
        {(bj?.hands ?? [[]]).map((hand, index) => (
          <div className="card-row" key={index}><span>You {hand.length ? bjTotal(hand) : ""}</span><Cards cards={hand} /></div>
        ))}
      </div>
    }>
      {open ? (
        <>
          <Move label="Hit" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "bj-hit" }), undefined, 480)} />
          <Move label="Stand" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "bj-stand" }), undefined, 480)} />
          <Move label="Double" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "bj-double" }), undefined, 480)} />
          <Move label="Split" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "bj-split" }), undefined, 480)} />
        </>
      ) : (
        <Move label="Deal" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "bj-deal", stake: parseFelt(stake) }))}>
          <Amount label="Even wager · FELT" value={stake} onChange={setStake} />
          <Fault text={play.local} />
        </Move>
      )}
    </Play>
  );
}

export function PokerPage() {
  const play = usePlay();
  const [ante, setAnte] = useState("10");
  const hand = play.state.poker[play.state.acting];
  const showDealer = Boolean(hand && hand.phase === 0 && hand.scoreP);
  return (
    <Play page="poker" title="Poker" busy={play.busy} stage={
      <div className="game-stage card-table-stage">
        <div className="card-table-heading"><span>BOARD</span><span>{showDealer && hand ? handName(hand.scoreD) : "HOLD'EM"}</span></div>
        <div className="card-row"><span>Board</span><Cards cards={hand?.board ?? []} /></div>
        <div className="card-row"><span>Your hole cards</span><Cards cards={hand?.hole ?? []} /></div>
        {showDealer && hand ? <div className="card-row"><span>House</span><Cards cards={hand.dealer} /></div> : null}
      </div>
    }>
      {hand?.phase === 1 ? (
        <>
          <Move label="Call · 2× ante" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "poker-call" }), undefined, 520)} />
          <Move label="Fold" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "poker-fold" }), undefined, 420)} />
        </>
      ) : (
        <Move label="Deal" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "poker-deal", ante: parseFelt(ante) }))}>
          <Amount label="Ante · FELT" value={ante} onChange={setAnte} hint="1 to 5,000. A call is twice this." />
          <Fault text={play.local} />
        </Move>
      )}
    </Play>
  );
}

export function DuelPage() {
  const play = usePlay();
  const [buy, setBuy] = useState("20");
  const [extra, setExtra] = useState("2");
  const p = play.state.pvp;
  const me = play.state.acting;
  const street = ["", "", "Preflop", "Flop", "Turn", "River"][p?.phase ?? 0] ?? "";
  return (
    <Play page="duel" title="Heads-Up" busy={play.busy} stage={
      <div className="game-stage">
        <div className="table-oval">
          <span>{street || "FELT"}</span>
          <strong>{p ? formatFelt(p.pot) : "—"}</strong>
          <small>POT</small>
        </div>
        {p && p.phase >= 2 ? (
          <div className="card-row">
            <Cards cards={p.board} />
            <Cards cards={me === 0 || p.phase === 0 ? p.hole[me] : []} />
          </div>
        ) : null}
      </div>
    }>
      {p && p.phase >= 2 ? (
        p.toAct === me ? (
          <>
            <Move label="Check" busy={play.busy} onSubmit={() => play.send({ type: "pvp-check" })} />
            <Move label="Call" busy={play.busy} onSubmit={() => play.send({ type: "pvp-call" })} />
            <Move label="All-in" busy={play.busy} onSubmit={() => play.send({ type: "pvp-allin" })} />
            <Move label="Fold" busy={play.busy} onSubmit={() => play.send({ type: "pvp-fold" })} />
            <Move label="Raise" busy={play.busy} onSubmit={() => play.send({ type: "pvp-raise", extra: parseFelt(extra) })}>
              <Amount label="Raise extra · FELT" value={extra} onChange={setExtra} />
              <Fault text={play.local} />
            </Move>
          </>
        ) : <p className="same-transaction-note">Switch seats to take the other chair.</p>
      ) : (
        <>
          <Move label="Host the table" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "pvp-host", buy: parseFelt(buy) }), undefined, 360)}>
            <Amount label="Buy-in · whole FELT" value={buy} onChange={setBuy} hint="20 to 50,000. You are the small blind." />
            <Fault text={play.local} />
          </Move>
          <Move label="Sit and deal" busy={play.busy} onSubmit={() => play.send({ type: "pvp-join" })} />
          <Move label="Leave" busy={play.busy} onSubmit={() => play.send({ type: "pvp-leave" })} />
        </>
      )}
    </Play>
  );
}

export function TablePage() {
  const play = usePlay();
  const [stake, setStake] = useState("10");
  const [chair, setChair] = useState("0");
  const t = play.state.table;
  return (
    <Play page="table" title="Table" busy={play.busy} stage={
      <div className="game-stage card-table-stage">
        <div className="card-table-heading"><span>SHARED TABLE</span><span>{t.phase === 2 ? "IN PLAY" : "OPEN"}</span></div>
        <div className="card-row"><span>Dealer</span><Cards cards={t.dealer} /></div>
        {([0, 1] as const).map((id) => (
          <div className="card-row" key={id}>
            <span>Seat {id === 0 ? "A" : "B"} {t.hands[id].length ? bjTotal(t.hands[id]) : ""}</span>
            <Cards cards={t.hands[id]} />
          </div>
        ))}
      </div>
    }>
      {t.phase === 2 ? (
        <>
          <Move label="Hit" onSubmit={() => play.send({ type: "table-hit" })} />
          <Move label="Stand" onSubmit={() => play.send({ type: "table-stand" })} />
          <Move label="Double" onSubmit={() => play.send({ type: "table-double" })} />
        </>
      ) : (
        <>
          <Move label="Take that seat" onSubmit={() => void play.play(() => {
            play.send({ type: "act", seat: Number(chair) === 1 ? 1 : 0 });
            return { type: "table-sit", seat: Number(chair) === 1 ? 1 : 0, stake: parseFelt(stake) };
          }, undefined, 360)}>
            <Choice label="Seat" value={chair} onChange={setChair} options={[{ id: "0", label: "Seat A" }, { id: "1", label: "Seat B" }]} />
            <Amount label="Even wager · FELT" value={stake} onChange={setStake} />
            <Fault text={play.local} />
          </Move>
          <Move label="Leave" onSubmit={() => play.send({ type: "table-leave" })} />
        </>
      )}
    </Play>
  );
}

export function LotteryPage() {
  const play = usePlay();
  const open = useContext(PickPage);
  const [n, setN] = useState("1");
  const [chain, setChain] = useState({ pot: 0n, round: 1n, mine: 0n });
  useEffect(() => {
    let stop = false;
    void readDesk(play.state.address).then((row) => {
      if (!stop) setChain({ pot: row.pot, round: row.round, mine: row.mine });
    }).catch(() => undefined);
    return () => { stop = true; };
  }, [play.state.address, play.busy]);
  const round = play.live ? chain.round.toString() : String(play.state.round);
  const pot = play.live ? chain.pot : play.state.pot;
  return (
    <div className="grid gap-4">
      <div className="rule-card">
        <div className="rule-mark">01</div>
        <div>
          <strong>Draw pays 90% · 10% carries</strong>
          <p>One scroll is 1,000 FELT. Paying fills the pot. Burning still enters the draw.</p>
        </div>
      </div>
      <LotteryVisual round={round} pot={`${formatFelt(pot)} FELT`} />
      <div className="game-action-grid">
        <Move label="Pay into pot" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "scroll-pay", n: Number(n) }), () => buyScrolls(Number(n)), 280)}>
          <Amount label="Scrolls" value={n} onChange={setN} />
        </Move>
        <Move label="Burn scrolls" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "scroll-burn", n: Number(n) }), () => burnScrolls(Number(n)), 280)} />
        <Move label="Draw" busy={play.busy} onSubmit={() => void play.play(() => ({ type: "draw" }), () => drawLottery(), 280)} />
      </div>
      <Fault text={play.local} />
      <p className="text-sm text-muted">{play.live ? `Your scrolls this round: ${chain.mine.toString()}.` : `Scrolls on this table: ${play.state.totalTickets}.`}</p>
      <Lobby onOpen={open} />
    </div>
  );
}
