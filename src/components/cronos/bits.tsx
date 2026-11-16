import type { ReactNode } from "react";
import { cardLabel, suitWine } from "@/lib/cronos/logic";

export function Go({
  children,
  onClick,
  quiet,
  disabled,
  testId,
}: {
  children: ReactNode;
  onClick: () => void;
  quiet?: boolean;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition disabled:opacity-40 ${
        quiet ? "border border-line bg-panel text-parchment" : "bg-gold text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs tracking-wide text-muted uppercase">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        className="min-h-11 rounded-lg border border-line bg-ink px-3 text-parchment outline-none focus:border-gold"
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Area({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs tracking-wide text-muted uppercase">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="rounded-lg border border-line bg-ink px-3 py-3 text-parchment outline-none focus:border-gold"
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Picks({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
              on ? "border-gold bg-gold text-ink" : "border-line bg-panel text-parchment"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Cards({ cards }: { cards: number[] }) {
  if (cards.length === 0) return <p className="text-sm text-muted">No cards yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {cards.map((card, index) => (
        <div
          key={`${card}-${index}`}
          className={`grid h-16 w-12 place-items-center rounded-lg border border-line bg-parchment font-display text-lg ${
            suitWine(card) ? "text-wine" : "text-ink"
          }`}
        >
          {cardLabel(card)}
        </div>
      ))}
    </div>
  );
}

export function Stage({ title, line, tone }: { title: string; line: string; tone: string }) {
  const color = tone === "win" ? "text-gold" : tone === "loss" ? "text-wine" : "text-parchment";
  return (
    <section className="grid gap-2 rounded-card border border-line bg-stone p-4">
      <p className="text-xs tracking-wide text-muted uppercase">Result</p>
      <h3 className={`font-display text-3xl ${color}`}>{title}</h3>
      <p className="text-sm text-parchment">{line}</p>
    </section>
  );
}

export function PageHead({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <header className="grid gap-2">
      <p className="text-xs tracking-[0.16em] text-gold uppercase">{eyebrow}</p>
      <h2 className="font-display text-4xl text-parchment">{title}</h2>
      <p className="max-w-xl text-sm text-muted">{copy}</p>
    </header>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-line bg-ink px-3 py-3">
      <span className="text-xs tracking-wide text-muted uppercase">{label}</span>
      <strong className="num-strip font-display text-xl text-parchment">{value}</strong>
    </div>
  );
}
