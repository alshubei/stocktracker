# Stocktracker What-If Portfolio Tracker — Design

**Date:** 2026-11-08  
**Status:** Approved

## Goal

A personal local React app that answers: *“If I had put €X into these positions with these weights on date D, what would the portfolio be worth now?”* — including side-by-side preset entry dates (e.g. before a crash vs later entry).

This is not a full trading platform. It is a fixed-point what-if dashboard for virtual entry decisions.

## Decisions

| Topic | Choice |
|-------|--------|
| Allocation | Custom weights on one shared capital pot |
| Entry dates | Editable active date + preset comparison cards |
| Market data | Yahoo Finance via local Express proxy |
| Currency | EUR primary, USD secondary (via EURUSD) |
| Package manager | Yarn |
| Node | `.nvmrc` → `24.22.2` |

## Universe (hardcoded)

| Symbol | Name |
|--------|------|
| NVDA | NVIDIA |
| DTCR | Global X Data Center & Digital Infrastructure ETF |
| SPUS | SP Funds S&P 500 Sharia ETF |
| CIBR | First Trust NASDAQ Cybersecurity ETF |
| AVGO | Broadcom |
| NOW | ServiceNow |
| SNDK | SanDisk |
| SKHY | SK Hynix (NASDAQ: SKHY) |

Defaults live in `src/config/universe.ts` (tickers, default equal weights, preset scenario dates/labels). Adding tickers in v1 means editing that file.

## Architecture

```
Vite React UI  --history/fx-->  Express proxy  -->  Yahoo Finance
       |
       +--> localStorage (capital, weights, active entry date)
       +--> portfolio math engine
```

### Proxy API

- `GET /api/history?symbol=&from=&to=` → daily closes
- `GET /api/fx/eurusd?from=&to=` → EURUSD daily closes
- ~15 min in-memory cache
- Non-trading day → previous available close
- Failures → HTTP error; UI shows message and keeps last good session data if any

### Portfolio math (v1)

1. User sets total capital in EUR and weight % per ticker (must sum to 100; warn otherwise; equal-split helper).
2. On entry date: for each ticker, `eurAllocated = capital * weight`, convert to USD at entry EURUSD, `shares = usdAllocated / entryClose`.
3. Now: `usdValue = shares * latestClose`, convert to EUR at latest EURUSD.
4. Ignore dividends, fees, taxes; use Yahoo’s series as returned.
5. Display EUR primary, USD secondary everywhere money appears.

### Persisted state (`localStorage`)

- capital EUR
- weights per symbol
- active entry date
- Presets stay in config; clicking a preset sets the active entry date

## UI (single page)

1. **Top bar** — title, capital €, active entry date, refresh
2. **Preset strip** — named cards; each shows portfolio value & % if entered that day; click loads as active date
3. **Summary** — current value € / $, P&L € / %, value chart entry→now
4. **Positions table** — ticker, weight %, € allocated, entry price, shares, now €, P&L, now $

## Out of scope (v1)

Auth, brokerage sync, alerts, dividends, UI ticker add/remove, multi-portfolio accounts.

## Stack

- Vite + React + TypeScript frontend
- Express proxy for Yahoo
- Recharts for the value chart
- Yarn; Node 24.22.2 via `.nvmrc`
- `yarn dev` runs UI + proxy together
- Light unit tests for portfolio math

## Success criteria

- Change entry date → portfolio P&L and chart update from that fixed point
- Change weights/capital → reallocates and recomputes
- Preset cards show comparable “what if entered then” results
- Values readable in € with $ secondary
- Runs locally with `nvm use` + `yarn` + `yarn dev`
