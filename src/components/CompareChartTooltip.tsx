import { formatEur } from "../lib/format.ts";

export type CompareSeriesMeta = {
  id: string;
  label: string;
  color: string;
};

type CompareChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    dataKey?: string | number;
    value?: number | string;
    color?: string;
  }>;
  series: CompareSeriesMeta[];
};

export function CompareChartTooltip({
  active,
  label,
  payload,
  series,
}: CompareChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const byId = new Map(series.map((s) => [s.id, s]));
  const rows = payload
    .map((item) => {
      const id = String(item.dataKey ?? "");
      const meta = byId.get(id);
      if (!meta || typeof item.value !== "number") return null;
      return { ...meta, value: item.value };
    })
    .filter((row): row is CompareSeriesMeta & { value: number } => row != null);

  if (rows.length === 0) return null;

  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink">
      <div className="mb-2 text-muted">{String(label ?? "")}</div>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ background: row.color }}
                aria-hidden
              />
              <span>{row.label}</span>
            </span>
            <span className="font-semibold tabular-nums">
              {formatEur(row.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
