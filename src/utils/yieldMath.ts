/**
 * Applies a compounded percentage reduction over a number of days.
 * 
 * @param baseYield - The initial yield before reduction
 * @param percentPerDay - Percentage reduction per day (e.g., 10 means 10%)
 * @param days - Number of days the reduction occurs
 * @returns The adjusted yield after compounded reduction
 */
export function applyCompoundedDailyReduction(baseYield: number, percentPerDay: number, days: number): number {
  const dailyRate = percentPerDay / 100;
  return baseYield * Math.pow(1 - dailyRate, days);
}
