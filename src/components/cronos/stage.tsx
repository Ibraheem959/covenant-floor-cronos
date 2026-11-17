import type { ReactNode } from "react";

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function GameRoom({
  title,
  hint,
  busy,
  stage,
  children,
}: {
  title: string;
  hint: string;
  busy?: boolean;
  stage: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="game-room-grid">
      <div className="game-table-card">
        <div className="game-table-top">
          <div>
            <span className="eyebrow">TABLE</span>
            <h2>{title}</h2>
          </div>
          <span className={`table-state ${busy ? "table-state-busy" : "table-state-settled"}`}>
            <i />
            {busy ? "SETTLING" : "READY"}
          </span>
        </div>
        {stage}
      </div>
      <section className="game-controls">
        <div className="game-controls-heading">
          <span className="eyebrow">YOUR NEXT MOVE</span>
          <h2>Play {title}</h2>
          <p>{hint}</p>
        </div>
        <div className="game-action-grid">{children}</div>
      </section>
    </div>
  );
}

function Die({ face, rolling }: { face: number | null; rolling: boolean }) {
  return (
    <div className={`dice-die ${rolling ? "dice-die-rolling" : ""}`}>
      {face === null ? (
        <span className="die-question">?</span>
      ) : (
        <span className="die-pips">
          {Array.from({ length: 9 }, (_, index) => (
            <i key={index} className={PIPS[face]?.includes(index) ? "pip-visible" : ""} />
          ))}
        </span>
      )}
    </div>
  );
}

export function DiceStage({ sum, rolling, call }: { sum: number | null; rolling: boolean; call?: string }) {
  const first = sum === null ? null : Math.max(1, Math.min(6, Math.ceil(sum / 2)));
  const second = sum === null || first === null ? null : sum - first;
  return (
    <div className={`game-stage dice-stage ${rolling ? "stage-active" : ""}`}>
      <div className="dice-pair">
        <Die face={rolling ? null : first} rolling={rolling} />
        <Die face={rolling ? null : second} rolling={rolling} />
      </div>
      <div className="stage-readout">
        <span>SUM</span>
        <strong>{rolling ? "ROLLING" : sum ?? "—"}</strong>
        {call ? <small>{call}</small> : null}
      </div>
    </div>
  );
}

export function RouletteStage({ pocket, rolling }: { pocket: number | null; rolling: boolean }) {
  const color = pocket === 0 ? "green" : pocket !== null && RED.has(pocket) ? "red" : "black";
  return (
    <div className={`game-stage ${rolling ? "stage-active" : ""}`}>
      <div className={`roulette-ring ${rolling ? "roulette-spinning" : ""}`}>
        <span className="roulette-orbit-line" />
        <strong className={`roulette-pocket pocket-${pocket === null ? "black" : color}`}>{rolling ? "?" : pocket ?? "—"}</strong>
        <i className="roulette-pointer" />
      </div>
      <div className="stage-readout">
        <span>POCKET</span>
        <strong>{rolling ? "SPINNING" : pocket === null ? "—" : `${pocket} · ${color.toUpperCase()}`}</strong>
      </div>
    </div>
  );
}

export function SlotsStage({ reels, rolling }: { reels: string[]; rolling: boolean }) {
  const faces = rolling ? ["·", "·", "·"] : [reels[0] ?? "—", reels[1] ?? "—", reels[2] ?? "—"];
  return (
    <div className={`game-stage slots-stage ${rolling ? "stage-active" : ""}`}>
      <div className="slot-machine">
        <span className="slot-machine-label">FELT · THREE REELS</span>
        <div className="slot-reels-live">
          {faces.map((face, index) => (
            <div className={`slot-reel ${rolling ? "slot-reel-rolling" : ""}`} key={index}>
              <span>{face}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlinkoStage({ bucket, rolling }: { bucket: number; rolling: boolean }) {
  const landed = !rolling && bucket >= 0 && bucket <= 8;
  return (
    <div className={`game-stage plinko-stage ${rolling ? "stage-active" : ""}`}>
      <div className="plinko-board">
        <svg viewBox="0 0 100 185" aria-hidden>
          {Array.from({ length: 7 }, (_, row) =>
            Array.from({ length: row + 1 }, (_, column) => {
              const x = 50 + (column - row / 2) * 12;
              return <circle key={`${row}-${column}`} cx={x} cy={22 + row * 20} r="1.15" />;
            }),
          )}
        </svg>
        <span className={`plinko-ball ${rolling ? "plinko-ball-falling" : ""}`} style={{ left: `${12.5 + (landed ? bucket : 4) * 9.375}%`, top: landed ? "78%" : undefined }} />
        <div className="plinko-buckets">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} className={landed && bucket === index ? "bucket-landed" : ""}>
              {landed && bucket === index ? "●" : index}
            </span>
          ))}
        </div>
      </div>
      <div className="stage-readout">
        <span>BUCKET</span>
        <strong>{rolling ? "DROPPING" : landed ? bucket : "—"}</strong>
      </div>
    </div>
  );
}

export function KenoStage({ picks, onToggle, hits }: { picks: number[]; onToggle?: (n: number) => void; hits?: string }) {
  const chosen = new Set(picks);
  return (
    <div className="game-stage keno-stage">
      <div className="keno-board">
        {Array.from({ length: 40 }, (_, index) => {
          const number = index + 1;
          const on = chosen.has(number);
          if (!onToggle) return <span key={number} className={on ? "keno-picked" : ""}>{number}</span>;
          return (
            <button key={number} type="button" className={`keno-number ${on ? "keno-number-active" : ""}`} onClick={() => onToggle(number)}>
              {number}
            </button>
          );
        })}
      </div>
      <div className="stage-readout">
        <span>PICKS · {picks.length || "—"}</span>
        <strong>{hits ?? "CHOOSE 1–10"}</strong>
      </div>
    </div>
  );
}

export function MineStage({
  revealed,
  boom,
  alive,
  busy,
  onReveal,
}: {
  revealed: number[];
  boom?: number | null;
  alive: boolean;
  busy?: boolean;
  onReveal: (tile: number) => void;
}) {
  const open = new Set(revealed);
  return (
    <div className="game-stage mines-stage">
      <div className="mine-board">
        {Array.from({ length: 25 }, (_, tile) => {
          const isMine = boom === tile;
          const isSafe = open.has(tile) && !isMine;
          return (
            <button key={tile} type="button" disabled={!alive || busy} className={`${isMine ? "tile-mine" : ""} ${isSafe ? "tile-safe" : ""} ${busy && !isMine && !isSafe ? "tile-shimmer" : ""}`} onClick={() => onReveal(tile)}>
              {isMine ? "×" : isSafe ? "✓" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BaccaratStage({ player, banker, rolling }: { player: number | null; banker: number | null; rolling: boolean }) {
  return (
    <div className={`game-stage baccarat-stage ${rolling ? "stage-active" : ""}`}>
      <div className="baccarat-total">
        <span>PLAYER</span>
        <strong>{rolling ? "—" : player ?? "—"}</strong>
      </div>
      <span className="baccarat-divider">VS</span>
      <div className="baccarat-total">
        <span>BANKER</span>
        <strong>{rolling ? "—" : banker ?? "—"}</strong>
      </div>
    </div>
  );
}

const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function HiloStage({ card, rolling }: { card: number | null; rolling: boolean }) {
  const label = card !== null && card >= 1 && card <= 13 ? RANKS[card] : "—";
  return (
    <div className={`game-stage hilo-stage ${rolling ? "stage-active" : ""}`}>
      <div className={`number-card ${rolling ? "number-card-flip" : ""}`}>
        <span>{rolling ? "?" : label}</span>
        <small>FELT</small>
      </div>
      <div className="stage-readout">
        <span>{rolling ? "NEXT CARD" : "CURRENT CARD"}</span>
        <strong>{rolling ? "FLIPPING" : label}</strong>
      </div>
    </div>
  );
}

export function LotteryVisual({ round, pot }: { round: string; pot: string }) {
  return (
    <div className="lottery-visual">
      <div className="lottery-orbit orbit-a" />
      <div className="lottery-orbit orbit-b" />
      <div className="lottery-coin">L</div>
      <div className="lottery-copy">
        <span className="eyebrow">ROUND {round}</span>
        <strong>{pot}</strong>
        <small>Current pot</small>
      </div>
      <div className="lottery-side">
        <span>DRAW</span>
        <b>90% / 10%</b>
      </div>
    </div>
  );
}

const LOBBY = [
  ["dice", "Dice", "On-chain round", "Pick a mode and wager."],
  ["roulette", "Roulette", "European wheel", "Choose a bet and a pocket."],
  ["slots", "Slots", "Three reels", "One wager. Three reels."],
  ["plinko", "Plinko", "Three settings", "Choose the board, then drop."],
  ["keno", "Keno", "40 numbers", "Select up to 10 numbers."],
  ["baccarat", "Baccarat", "Player · Banker · Tie", "Choose a side."],
  ["hi-lo", "Hi-Lo", "One card", "Call higher or lower."],
  ["mines", "Mines", "25 tiles", "Reveal a tile or cash out."],
  ["blackjack", "Blackjack", "Single player", "Hit, stand, double, or split."],
  ["poker", "Poker", "Ante and call", "Ante, then call twice or fold."],
] as const;

export function Lobby({ onOpen }: { onOpen: (id: (typeof LOBBY)[number][0]) => void }) {
  return (
    <section className="featured-games">
      <div className="featured-games-heading">
        <div>
          <span className="eyebrow">ONE VAULT · TEN GAMES</span>
          <h2>Pick your table</h2>
        </div>
      </div>
      <div className="lobby-game-grid">
        {LOBBY.map(([id, name, label, copy], index) => (
          <button key={id} type="button" className="lobby-game-card" onClick={() => onOpen(id)}>
            <div className="game-card-art" aria-hidden>
              {id === "dice" ? <div className="casino-die"><i /><i /><i /><i /><i /></div> : null}
              {id === "roulette" ? <div className="roulette-wheel"><i /><b /></div> : null}
              {id === "slots" ? <div className="slot-reels"><span>F</span><span>E</span><span>L</span></div> : null}
              {id === "plinko" ? <div className="plinko-dots">{Array.from({ length: 15 }, (_, i) => <i key={i} />)}</div> : null}
              {id === "keno" ? <div className="keno-mini">{Array.from({ length: 16 }, (_, i) => <i key={i} />)}</div> : null}
              {id === "baccarat" || id === "blackjack" || id === "poker" ? <div className="card-pair"><i /><i /></div> : null}
              {id === "hi-lo" ? <div className="hilo-mark"><span>↑</span><b>OR</b><span>↓</span></div> : null}
              {id === "mines" ? <div className="mine-mini">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div> : null}
            </div>
            <div className="game-card-body">
              <div>
                <span className="game-card-label">{label}</span>
                <h3>{name}</h3>
                <p>{copy}</p>
              </div>
              <span className="game-card-arrow">↗</span>
            </div>
            <span className="game-card-index">{String(index + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
