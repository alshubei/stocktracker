import { FX_SYMBOL, historyPayload, isIsoDate } from "../_lib/market";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const from = String(url.searchParams.get("from") ?? "").trim();
    const to = String(url.searchParams.get("to") ?? "").trim();

    if (!isIsoDate(from) || !isIsoDate(to)) {
      return Response.json(
        {
          error: "Query params required: from (YYYY-MM-DD), to (YYYY-MM-DD)",
        },
        { status: 400 },
      );
    }

    return Response.json(await historyPayload(FX_SYMBOL, from, to));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
