import cors from "cors";
import express from "express";
import { FX_SYMBOL, historyPayload, isIsoDate } from "./market.ts";

const PORT = Number(process.env.PORT ?? 8787);

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

    if (!symbol || !isIsoDate(from) || !isIsoDate(to)) {
      res.status(400).json({
        error:
          "Query params required: symbol, from (YYYY-MM-DD), to (YYYY-MM-DD)",
      });
      return;
    }

    res.json(await historyPayload(symbol, from, to));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

app.get("/api/fx/eurusd", async (req, res) => {
  try {
    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();

    if (!isIsoDate(from) || !isIsoDate(to)) {
      res.status(400).json({
        error: "Query params required: from (YYYY-MM-DD), to (YYYY-MM-DD)",
      });
      return;
    }

    res.json(await historyPayload(FX_SYMBOL, from, to));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`stocktracker proxy listening on http://localhost:${PORT}`);
});
