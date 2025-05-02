import { GrowingSeasonData } from '../types';

function getRandomReductionPercentage(): number {
  return Math.random() * (20 - 5) + 5;
}

export function applyWindReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  return data.reduce((totalYield, entry) => {
    if (entry.stage === 'Pre-Harvest' && entry.wind_speed_kmh && entry.wind_speed_kmh > 40) {
      const reduction = getRandomReductionPercentage();
      return totalYield - (reduction / 100) * totalYield;
    }
    return totalYield;
  }, yieldEstimate);
}

export function applyHeatStressReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  return data.reduce((totalYield, entry) => {
    if (entry.stage === 'Fruit Growth' && entry.temperature_celsius > 35) {
      return totalYield - (0.2 / 100) * totalYield;
    }
    return totalYield;
  }, yieldEstimate);
}

export function applyDroughtReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const fruitGrowthDays = data
    .filter(entry => entry.stage === 'Fruit Growth')
    .sort((a, b) => a.day - b.day);

  let zeroRainStreak = 0;
  let adjustedYield = yieldEstimate;

  for (let i = 0; i < fruitGrowthDays.length; i++) {
    if (fruitGrowthDays[i].rainfall_mm === 0) {
      zeroRainStreak++;
    } else {
      zeroRainStreak = 0;
    }

    if (zeroRainStreak >= 4) {
      adjustedYield -= (0.5 / 100) * adjustedYield;
    }
  }

  return adjustedYield;
}

export function applyBloomRainReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  return data.reduce((totalYield, entry) => {
    if (entry.stage === 'Bloom' && entry.rainfall_mm > 20) {
      return totalYield - (10 / 100) * totalYield;
    }
    return totalYield;
  }, yieldEstimate);
}


export function calculateEstimatedYield(
  treeCount: number,
  yieldPerTree: number,
  seasonData: GrowingSeasonData[]
): number {
  let yieldEstimate = treeCount * yieldPerTree;

  yieldEstimate = applyWindReduction(yieldEstimate, seasonData);
  yieldEstimate = applyHeatStressReduction(yieldEstimate, seasonData);
  yieldEstimate = applyDroughtReduction(yieldEstimate, seasonData);
  yieldEstimate = applyBloomRainReduction(yieldEstimate, seasonData);

  return Math.round(yieldEstimate);
}
