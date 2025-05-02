import { GrowingSeasonData } from '../types';

const parseEnv = (key: string, fallback: number): number =>
  parseFloat(process.env[key] || `${fallback}`);

const randomPercent = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

function getRandomReductionPercentage(): number {
  return Math.random() * (20 - 5) + 5;
}

const PRE_HARVEST_WIND_THRESHOLD = parseEnv('PRE_HARVEST_WIND_THRESHOLD', 40);
const PRE_HARVEST_WIND_REDUCTION_MIN = parseEnv('PRE_HARVEST_WIND_REDUCTION_MI', 5);
const PRE_HARVEST_WIND_REDUCTION_MAX = parseEnv('PRE_HARVEST_WIND_REDUCTION_MAX', 15);
export function applyWindReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  return data.reduce((totalYield, entry) => {
    if (entry.stage === 'Pre-Harvest' && entry.wind_speed_kmh && entry.wind_speed_kmh > PRE_HARVEST_WIND_THRESHOLD) {
      const reduction = randomPercent(PRE_HARVEST_WIND_REDUCTION_MIN, PRE_HARVEST_WIND_REDUCTION_MAX);
      return totalYield - (reduction / 100) * totalYield;
    }
    return totalYield;
  }, yieldEstimate);
}

const FRUIT_GROWTH_HEAT_THRESHOLD = parseEnv('FRUIT_GROWTH_HEAT_THRESHOLD', 35);
const FRUIT_GROWTH_HEAT_REDUCTION = parseEnv('FRUIT_GROWTH_HEAT_REDUCTION', 0.2);
export function applyHeatStressReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  return data.reduce((totalYield, entry) => {
    if (entry.stage === 'Fruit Growth' && entry.temperature_celsius > FRUIT_GROWTH_HEAT_THRESHOLD) {
      return totalYield - (FRUIT_GROWTH_HEAT_REDUCTION / 100) * totalYield;
    }
    return totalYield;
  }, yieldEstimate);
}

const FRUIT_GROWTH_DROUGHT_STREAK = parseEnv('FRUIT_GROWTH_DROUGHT_STREAK', 4);
const FRUIT_GROWTH_DROUGHT_REDUCTION = parseEnv('FRUIT_GROWTH_DROUGHT_REDUCTION', 0.5);
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

    if (zeroRainStreak >= FRUIT_GROWTH_DROUGHT_STREAK) {
      adjustedYield -= (FRUIT_GROWTH_DROUGHT_REDUCTION / 100) * adjustedYield;
    }
  }

  return adjustedYield;
}

const BLOOM_RAIN_THRESHOLD = parseEnv('BLOOM_RAIN_THRESHOLD', 20);
const BLOOM_RAIN_REDUCTION = parseEnv('BLOOM_RAIN_REDUCTION', 10);
export function applyBloomRainReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  return data.reduce((totalYield, entry) => {
    if (entry.stage === 'Bloom' && entry.rainfall_mm > BLOOM_RAIN_THRESHOLD) {
      return totalYield - (BLOOM_RAIN_REDUCTION / 100) * totalYield;
    }
    return totalYield;
  }, yieldEstimate);
}

const BLOOM_WIND_THRESHOLD = parseEnv('BLOOM_WIND_THRESHOLD', 30);
const BLOOM_WIND_REDUCTION = parseEnv('BLOOM_WIND_REDUCTION', 5);
export function applyBloomWindReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  return data.reduce((totalYield, entry) => {
    if (entry.stage === 'Bloom' && entry.wind_speed_kmh && entry.wind_speed_kmh > BLOOM_WIND_THRESHOLD) {
      return totalYield - (BLOOM_WIND_REDUCTION / 100) * totalYield;
    }
    return totalYield;
  }, yieldEstimate);
}

const BLOOM_TEMP_LOW_MIN = parseEnv('BLOOM_TEMP_LOW_MIN', 12);
const BLOOM_TEMP_LOW_MAX = parseEnv('BLOOM_TEMP_LOW_MAX', 15);
const BLOOM_TEMP_HIGH_MIN = parseEnv('BLOOM_TEMP_HIGH_MIN', 28);
const BLOOM_TEMP_HIGH_MAX = parseEnv('BLOOM_TEMP_HIGH_MAX', 30);
const BLOOM_TEMP_REDUCTION_MIN = parseEnv('BLOOM_TEMP_REDUCTION_MIN', 5);
const BLOOM_TEMP_REDUCTION_MAX = parseEnv('BLOOM_TEMP_REDUCTION_MAX', 15);
export function applyBloomTemperatureReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  return data.reduce((totalYield, entry) => {
    if (
      entry.stage === 'Bloom' &&
      (
        (entry.temperature_celsius >= BLOOM_TEMP_HIGH_MIN && entry.temperature_celsius <= BLOOM_TEMP_HIGH_MAX) ||
        (entry.temperature_celsius >= BLOOM_TEMP_LOW_MIN && entry.temperature_celsius <= BLOOM_TEMP_LOW_MAX)
      )
    ) {
      const reduction = randomPercent(BLOOM_TEMP_REDUCTION_MIN, BLOOM_TEMP_REDUCTION_MAX);
      return totalYield - (reduction / 100) * totalYield;
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
  
  // Bloom stage
  yieldEstimate = applyBloomTemperatureReduction(yieldEstimate, seasonData);
  yieldEstimate = applyBloomRainReduction(yieldEstimate, seasonData);
  yieldEstimate = applyBloomWindReduction(yieldEstimate, seasonData);
  // Fruit Set stage
  // Fruit Growth stage
  yieldEstimate = applyDroughtReduction(yieldEstimate, seasonData);
  yieldEstimate = applyHeatStressReduction(yieldEstimate, seasonData);
  // Pre-Harvest / Harvest stage
  yieldEstimate = applyWindReduction(yieldEstimate, seasonData);

  return Math.round(yieldEstimate);
}
