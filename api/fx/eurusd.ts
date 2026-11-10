import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FX_SYMBOL, historyPayload, isIsoDate } from "../lib/market";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();

    if (!isIsoDate(from) || !isIsoDate(to)) {
      res.status(400).json({
        error: "Query params required: from (YYYY-MM-DD), to (YYYY-MM-DD)",
      });
      return;
    }

    res.status(200).json(await historyPayload(FX_SYMBOL, from, to));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({ error: message });
  }
}
