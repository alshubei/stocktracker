export type WeightInputMode = "percent" | "eur";

export function weightToEur(weightPercent: number, capitalEur: number): number {
  if (!Number.isFinite(weightPercent) || !Number.isFinite(capitalEur)) return 0;
  return Math.round(((capitalEur * weightPercent) / 100) * 100) / 100;
}

export function eurToWeight(eurAmount: number, capitalEur: number): number {
  if (
    !Number.isFinite(eurAmount) ||
    !Number.isFinite(capitalEur) ||
    capitalEur <= 0
  ) {
    return 0;
  }
  return Math.round((eurAmount / capitalEur) * 100 * 100) / 100;
}

/** Sum of weights for the given symbols only. */
export function selectedWeightSum(
  symbols: string[],
  weights: Record<string, number>,
): number {
  return symbols.reduce((sum, symbol) => sum + (weights[symbol] ?? 0), 0);
}

/**
 * Set one ticker to `eurAmount`, split remaining capital equally across other
 * selected symbols (weights always sum to 100% among `selectedSymbols`).
 */
export function redistributeEurAllocation(
  weights: Record<string, number>,
  selectedSymbols: string[],
  symbol: string,
  eurAmount: number,
  capitalEur: number,
): Record<string, number> {
  if (selectedSymbols.length === 0 || capitalEur <= 0) return weights;

  const selected = new Set(selectedSymbols);
  if (!selected.has(symbol)) return weights;

  const capped = Math.max(0, Math.min(eurAmount, capitalEur));
  const others = selectedSymbols.filter((s) => s !== symbol);
  const next = { ...weights };

  if (others.length === 0) {
    next[symbol] = 100;
    return next;
  }

  const primaryPct = eurToWeight(capped, capitalEur);
  next[symbol] = primaryPct;

  const remainingEur = capitalEur - weightToEur(primaryPct, capitalEur);
  const eachEur = remainingEur / others.length;
  let assigned = primaryPct;

  others.forEach((s, index) => {
    if (index === others.length - 1) {
      next[s] = Math.round((100 - assigned) * 100) / 100;
    } else {
      const pct = eurToWeight(eachEur, capitalEur);
      next[s] = pct;
      assigned = Math.round((assigned + pct) * 100) / 100;
    }
  });

  return next;
}
