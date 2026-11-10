import cors from "cors";
import express from "express";
import { closeOnOrBefore, fetchYahooDailyCloses } from "./yahoo.ts";

const PORT = Number(process.env.PORT ?? 8787);
const FX_SYMBOL = "EURUSD=X";

const app = express();
app.use(cors());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/history", async (req, res) => {
  try {
    const symbol = String(req.query.symbol ?? "").trim().toUpperCase();
    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();

    if (!symbol || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      res.status(400).json({
        error: "Query params required: symbol, from (YYYY-MM-DD), to (YYYY-MM-DD)",
      });
      return;
    }

    const series = await fetchYahooDailyCloses(symbol, from, to);
    const filtered = series.filter((p) => p.date >= from && p.date <= to);

    // Ensure the entry-date lookup can still resolve via previous close
    const entry = closeOnOrBefore(series, from);
    const points =
      entry && (filtered.length === 0 || filtered[0]!.date !== entry.date)
        ? [entry, ...filtered.filter((p) => p.date > entry.date)]
        : filtered.length > 0
          ? filtered
          : entry
            ? [entry]
            : [];

    res.json({ symbol, from, to, points });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

app.get("/api/fx/eurusd", async (req, res) => {
  try {
    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      res.status(400).json({
        error: "Query params required: from (YYYY-MM-DD), to (YYYY-MM-DD)",
      });
      return;
    }

    const series = await fetchYahooDailyCloses(FX_SYMBOL, from, to);
    const filtered = series.filter((p) => p.date >= from && p.date <= to);
    const entry = closeOnOrBefore(series, from);
    const points =
      entry && (filtered.length === 0 || filtered[0]!.date !== entry.date)
        ? [entry, ...filtered.filter((p) => p.date > entry.date)]
        : filtered.length > 0
          ? filtered
          : entry
            ? [entry]
            : [];

    res.json({ symbol: FX_SYMBOL, from, to, points });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`stocktracker proxy listening on http://localhost:${PORT}`);
});
