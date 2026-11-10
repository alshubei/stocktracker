# Chart tooltip per-ticker prices

## Goal

Keep the summary chart as aggregate portfolio **€ value**, but enrich the hover tooltip so each selected product shows USD closes: **entry → hover date**, plus **latest** (as-of).

## Decisions

| Topic | Choice |
| --- | --- |
| Chart series | Unchanged: single € portfolio value line |
| Tooltip prices | USD only (native Yahoo closes) |
| Tickers listed | Currently selected / focused holdings only (same set as the chart) |
| price1 | Entry close (selected entry date, existing `closeForEntry` rules) |
| price2 | Close on/before the hovered chart date |
| Latest | Close on/before portfolio `asOfDate`, shown beside the pair |

## Data

Extend each `valueSeries` point while computing the series in `computePortfolio`:

```ts
{
  date: string;
  valueEur: number;
  tickers: Array<{
    symbol: string;
    entryUsd: number;
    hoverUsd: number;
    latestUsd: number;
  }>;
}
```

- Build `tickers` for the same holdings already used for that day’s € mark.
- Resolve `entryUsd` / `hoverUsd` / `latestUsd` with the same helpers as position math (`closeForEntry` / `closeOnOrBefore`) so weekends and new listings match the positions table.
- `entryUsd` and `latestUsd` are constant across the series for a given compute; `hoverUsd` varies by point date.
- Order tickers as in `positions` / selection order.

## UI

Custom Recharts tooltip content in `PortfolioSummary`:

1. Date of the hovered point.
2. Portfolio value: `formatEur(valueEur)` (existing line).
3. For each ticker in `payload.tickers`:
   - `SYMBOL`
   - `$entry → $hover` (USD)
   - muted secondary: `now $latest`

Use existing dark tooltip chrome (`#1b2621` / border). Color the `$entry → $hover` change with the same pos/neg palette as P&L text when hover differs from entry; flat stays muted.

No second chart series; no EUR conversion of share prices in the tooltip.

## Out of scope

- Plotting raw prices on the chart itself
- Showing non-selected universe tickers in the tooltip
- Intraday / non-daily intervals
- Dividends, fees, bid/ask

## Testing

- Unit test: `computePortfolio` valueSeries points include `tickers` with correct `entryUsd`, `hoverUsd`, and `latestUsd` for a multi-day fixture (including a mid-series hover day).
- Existing portfolio math assertions remain green.

## Success criteria

- Hovering the chart lists each selected product with USD entry → hover and latest.
- Narrowing ticker focus changes both the chart and the tooltip list together.
- Empty / loading portfolio still shows the existing empty summary state.
