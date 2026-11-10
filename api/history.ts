import type { VercelRequest, VercelResponse } from "@vercel/node";
import { historyPayload, isIsoDate } from "./lib/market";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const symbol = String(req.query.symbol ?? "")
      .trim()
      .toUpperCase();
    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();

    if (!symbol || !isIsoDate(from) || !isIsoDate(to)) {
      res.status(400).json({
        error:
          "Query params required: symbol, from (YYYY-MM-DD), to (YYYY-MM-DD)",
      });
      return;
    }

    res.status(200).json(await historyPayload(symbol, from, to));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({ error: message });
  }
}
