# Chart Tooltip Per-Ticker Prices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the portfolio value chart hover tooltip with each selected ticker’s USD closes: entry → hover date, plus latest.

**Architecture:** Extend `computePortfolio`’s `valueSeries` points to embed per-ticker USD prices resolved with the same close helpers as position math. Replace the default Recharts tooltip in `PortfolioSummary` with custom content that renders portfolio € value and the ticker list.

**Tech Stack:** TypeScript, React, Recharts, Node test runner via `tsx --test`

**Spec:** `docs/superpowers/specs/2026-11-10-chart-tooltip-prices-design.md`

## Global Constraints

- Chart remains a single aggregate € value series (no price lines on the chart).
- Tooltip share prices are USD only.
- Tickers in the tooltip match the selected holdings used for the chart.
- Reuse `closeForEntry` / `closeOnOrBefore` for weekends and new listings.
- Keep changes scoped to portfolio math + summary tooltip; no EUR conversion of share prices in the tooltip.

## File map

- Modify: `src/lib/portfolio.ts` — types + embed `tickers` on each valueSeries point
- Modify: `src/lib/portfolio.test.ts` — assert ticker prices on series points
- Modify: `src/lib/format.ts` — optional small USD money formatter if needed (or inline Intl in tooltip)
- Create: `src/components/ChartTooltip.tsx` — custom Recharts tooltip content
- Modify: `src/components/PortfolioSummary.tsx` — wire custom tooltip

---

### Task 1: Embed ticker USD prices in valueSeries

**Files:**
- Modify: `src/lib/portfolio.ts`
- Modify: `src/lib/portfolio.test.ts`

**Interfaces:**
- Consumes: existing `closeForEntry`, `closeOnOrBefore`, holdings built in `computePortfolio`
- Produces:
  ```ts
  export type ValueSeriesTicker = {
    symbol: string;
    entryUsd: number;
    hoverUsd: number;
    latestUsd: number;
  };
  export type ValueSeriesPoint = {
    date: string;
    valueEur: number;
    tickers: ValueSeriesTicker[];
  };
  // PortfolioResult.valueSeries: ValueSeriesPoint[]
  ```

- [ ] **Step 1: Write the failing test**

Add to `src/lib/portfolio.test.ts` inside `describe("computePortfolio")`:

```ts
it("embeds entry, hover, and latest USD prices on valueSeries points", () => {
  const result = computePortfolio({
    capitalEur: 1000,
    entryDate: "2025-04-01",
    asOfDate: "2025-04-10",
    positions: [
      { symbol: "AAA", weightPercent: 60 },
      { symbol: "BBB", weightPercent: 40 },
    ],
    priceSeriesBySymbol: {
      AAA: [
        { date: "2025-04-01", close: 100 },
        { date: "2025-04-05", close: 105 },
        { date: "2025-04-10", close: 110 },
      ],
      BBB: [
        { date: "2025-04-01", close: 50 },
        { date: "2025-04-05", close: 45 },
        { date: "2025-04-10", close: 40 },
      ],
    },
    fxSeries: [
      { date: "2025-04-01", close: 1.1 },
      { date: "2025-04-05", close: 1.05 },
      { date: "2025-04-10", close: 1.0 },
    ],
  });

  const mid = result.valueSeries.find((p) => p.date === "2025-04-05");
  assert.ok(mid);
  assert.deepEqual(mid.tickers, [
    { symbol: "AAA", entryUsd: 100, hoverUsd: 105, latestUsd: 110 },
    { symbol: "BBB", entryUsd: 50, hoverUsd: 45, latestUsd: 40 },
  ]);

  const last = result.valueSeries[result.valueSeries.length - 1]!;
  assert.equal(last.date, "2025-04-10");
  assert.deepEqual(last.tickers, [
    { symbol: "AAA", entryUsd: 100, hoverUsd: 110, latestUsd: 110 },
    { symbol: "BBB", entryUsd: 50, hoverUsd: 40, latestUsd: 40 },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test`
Expected: FAIL — `tickers` undefined / missing on valueSeries points

- [ ] **Step 3: Minimal implementation in portfolio.ts**

1. Add exported types `ValueSeriesTicker` and `ValueSeriesPoint`.
2. Change `PortfolioResult.valueSeries` to `ValueSeriesPoint[]`.
3. When building holdings / positionResults, also keep each holding’s `entryUsd` and `latestUsd` (from the entry/latest closes already computed).
4. Inside the per-date loop, after resolving each holding’s hover close (`px`), push:

```ts
tickers.push({
  symbol: holding.symbol,
  entryUsd: holding.entryUsd,
  hoverUsd: px.date > date ? holding.entryUsd : px.close, // or skip cash-sleeve edge: use entryUsd when not yet trading
  latestUsd: holding.latestUsd,
});
```

For the new-listing cash-sleeve branch (`px.date > date`), set `hoverUsd` to `entryUsd` (no traded price yet that day) — matches “closest available” UX without inventing a mark.

5. `valueSeries.push({ date, valueEur: ..., tickers })`.

- [ ] **Step 4: Run tests — expect PASS**

Run: `yarn test`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/portfolio.ts src/lib/portfolio.test.ts
git commit -m "Embed per-ticker USD prices on portfolio value series points."
```

---

### Task 2: Custom chart tooltip UI

**Files:**
- Create: `src/components/ChartTooltip.tsx`
- Modify: `src/components/PortfolioSummary.tsx`
- Modify: `src/lib/format.ts` (add `formatUsdPrice` if useful — compact `$` style)

**Interfaces:**
- Consumes: `ValueSeriesPoint` / `ValueSeriesTicker` from `../lib/portfolio.ts`; `formatEur`, `pnlClass` / `pnlChartColor` from format helpers
- Produces: `ChartTooltip` React component usable as Recharts `content={ChartTooltip}`

- [ ] **Step 1: Add USD price formatter + smoke test**

In `src/lib/format.ts`:

```ts
const usdPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatUsdPrice(value: number): string {
  return usdPrice.format(value);
}
```

In `src/lib/format.test.ts` add:

```ts
it("formats USD prices", () => {
  assert.equal(formatUsdPrice(105.5), "$105.50");
});
```

(Import `formatUsdPrice`.)

- [ ] **Step 2: Run format test — expect PASS after implementing formatter**

Run: `yarn test`

- [ ] **Step 3: Create ChartTooltip.tsx**

```tsx
import type { TooltipProps } from "recharts";
import type { ValueSeriesPoint } from "../lib/portfolio.ts";
import { formatEur, formatUsdPrice, pnlClass } from "../lib/format.ts";

type Props = TooltipProps<number, string>;

export function ChartTooltip({ active, payload, label }: Props) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as ValueSeriesPoint | undefined;
  if (!point) return null;

  return (
    <div
      className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink shadow-lg"
      style={{ minWidth: 200 }}
    >
      <div className="mb-1 text-muted">{String(label)}</div>
      <div className="mb-2 font-semibold">{formatEur(point.valueEur)}</div>
      <ul className="m-0 list-none space-y-1 p-0">
        {point.tickers.map((t) => (
          <li key={t.symbol} className="flex flex-col gap-0.5">
            <span className="font-semibold tracking-wide">{t.symbol}</span>
            <span className={pnlClass(t.hoverUsd - t.entryUsd)}>
              {formatUsdPrice(t.entryUsd)} → {formatUsdPrice(t.hoverUsd)}
            </span>
            <span className="text-xs text-muted">
              now {formatUsdPrice(t.latestUsd)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Adjust class names to match existing Tailwind tokens in `src/styles.css` (`border-border`, `bg-panel`, etc. — if those utilities are not defined, reuse the inline `contentStyle` colors from the current Tooltip).

- [ ] **Step 4: Wire into PortfolioSummary**

Replace default `<Tooltip formatter=... contentStyle=... />` with:

```tsx
<Tooltip content={<ChartTooltip />} />
```

Import `ChartTooltip` from `./ChartTooltip.tsx`.

- [ ] **Step 5: Typecheck + tests**

Run: `yarn verify`
Expected: typecheck + tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ChartTooltip.tsx src/components/PortfolioSummary.tsx src/lib/format.ts src/lib/format.test.ts
git commit -m "Show entry, hover, and latest USD prices in the chart tooltip."
```

---

### Task 3: Manual sanity check

- [ ] **Step 1:** `yarn dev` — hover chart with full universe; confirm list of tickers with `$entry → $hover` and `now $latest`.
- [ ] **Step 2:** Narrow focus to one ticker; confirm tooltip lists only that symbol; chart still € value.
- [ ] **Step 3:** No further commit unless fixes needed.
