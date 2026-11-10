const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

export function formatEur(value: number): string {
  return eur.format(value);
}

export function formatUsd(value: number): string {
  return usd.format(value);
}

export function formatPct(value: number): string {
  return `${pct.format(value)}%`;
}

export function formatShares(value: number): string {
  return value.toLocaleString("de-DE", {
    maximumFractionDigits: 4,
  });
}

export function pnlClass(value: number): string {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted";
}

/** Chart stroke/fill hex aligned with --color-pos / --color-neg / --color-muted. */
export function pnlChartColor(value: number): string {
  if (value > 0) return "#3dba8a";
  if (value < 0) return "#e07a6a";
  return "#93a59b";
}
