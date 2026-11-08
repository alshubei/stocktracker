# Stocktracker

Local what-if portfolio tracker: pick an entry date and custom weights, then see what a fixed euro investment would be worth now across hardcoded tickers.

## Stack

- Node `24.22.2` (see `.nvmrc`)
- Yarn
- Vite + React + TypeScript
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

Edit `src/config/universe.ts` for tickers, default weights, and preset entry scenarios.
