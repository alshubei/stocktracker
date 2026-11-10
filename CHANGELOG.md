# Changelog

## 11.10.2026 — 2026-11-10

- Focus ticker list uses compact one-line rows instead of large cards.
- Saving a snapshot with an empty name shows an error to write a name.
- Snapshots help text opens under an info icon (slide), not as always-visible copy.
- Chart hover panel scrolls when many tickers or snapshots are listed.
- Summary centers Current value and P&L; EURUSD sits as a quiet line under them with a green/red arrow vs entry.
- Snapshots: save up to 5 named portfolios (capital, entry date, tickers, weights). Locked curves compare to the live what-if on the chart; stored in localStorage.
- Removed Pre-crash / Dip / Rebound / Today preset entry cards for this phase.
- UI: tool-style header with a short how-to line (no eyebrow/marketing pitch), flat background, quieter panels, plain Stock/ETF labels.
- Calendar versioning: `package.json` stamp `M.dd.yyyy`, changelog, footer shows `Version …`.
- Impressum footer (author, contact, source) plus clearer product copy in title and README.
- Default entry date is five UTC calendar days ago; storage schema v2 refreshes older saved entry dates once.
