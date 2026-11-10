# Stocktracker

Private what-if portfolio tracker by **Mokhtar Al-Shubei** (`alshubei83@gmail.com`).

You pick a capital (e.g. €1,000), an entry date, and weights; the app shows what that virtual buy would be worth now across a hardcoded ticker universe. Not investment advice; no live brokerage.

## Stack

- Node `24.22.2` (see `.nvmrc`)
- Yarn
- Vite + React + TypeScript
- Tailwind CSS v4
- Express proxy → Yahoo Finance

## Run

```bash
nvm use
yarn
yarn dev
```

- UI: http://localhost:5173  
- Proxy: http://localhost:8787  

## Scripts

- `yarn dev` — UI + proxy
- `yarn test` — portfolio math unit tests
- `yarn typecheck` — TypeScript check
- `yarn verify` — typecheck + tests

## Config

Edit `src/config/universe.ts` for tickers and default weights.

## Deploy (Vercel)

Static UI + serverless `/api/*` (same Yahoo proxy as local Express). On the free Hobby plan this is normally covered by included serverless invocations — no separate Yahoo fee. Local `yarn dev` still uses Express on `:8787`.
