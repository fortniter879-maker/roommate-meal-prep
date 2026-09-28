import type { ReactNode } from "react";

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** One bar per day. Hovering or focusing a bar shows its date and value. */
export function DailyBars({
  data,
  format,
  label,
}: {
  data: { date: string; value: number }[];
  format: (value: number) => string;
  label: string;
}) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const ticks = data.length > 1 ? [data[0], data[Math.floor((data.length - 1) / 2)], data[data.length - 1]] : data;

  return (
    <figure>
      <div className="flex justify-end text-xs text-muted">{max > 0 && `max ${format(max)}`}</div>
      <div
        className="flex h-36 items-end gap-[2px] border-b border-border"
        role="img"
        aria-label={`${label} per day, ${data.length} days`}
      >
        {data.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end" tabIndex={0}>
            <div
              className="w-full rounded-t-[4px] bg-accent group-hover:opacity-80 group-focus:opacity-80"
              style={{ height: max ? `${(d.value / max) * 100}%` : 0 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs shadow group-hover:block group-focus:block">
              <div className="text-muted">{shortDate(d.date)}</div>
              <div className="font-medium">{format(d.value)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        {ticks.map((t, i) => (
          <span key={i}>{shortDate(t.date)}</span>
        ))}
      </div>
    </figure>
  );
}

/** Horizontal bars for comparing a few people or items. */
export function BarList({ rows }: { rows: { key: string; label: ReactNode; value: number; display: string }[] }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex justify-between gap-3">
            <span>{r.label}</span>
            <span className="font-medium">{r.display}</span>
          </div>
          <div className="h-2 rounded-full bg-background">
            <div className="h-2 rounded-full bg-accent" style={{ width: max ? `${(r.value / max) * 100}%` : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const MACROS = [
  { key: "protein", label: "Protein", color: "bg-series-1" },
  { key: "carbs", label: "Carbs", color: "bg-series-2" },
  { key: "fat", label: "Fat", color: "bg-series-3" },
] as const;

/** Where calories come from, as one stacked bar with a labelled legend. */
export function MacroBar({ split }: { split: { protein: number; carbs: number; fat: number } }) {
  return (
    <figure>
      <div className="flex h-4 gap-[2px]" role="img" aria-label="Calories by macronutrient">
        {MACROS.map((m) =>
          split[m.key] > 0 ? (
            <div
              key={m.key}
              className={`${m.color} first:rounded-l-[4px] last:rounded-r-[4px]`}
              style={{ width: `${split[m.key] * 100}%` }}
              title={`${m.label}: ${Math.round(split[m.key] * 100)}%`}
            />
          ) : null,
        )}
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {MACROS.map((m) => (
          <span key={m.key} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-sm ${m.color}`} aria-hidden />
            {m.label} <span className="font-medium">{Math.round(split[m.key] * 100)}%</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
