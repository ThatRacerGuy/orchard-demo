import { GrowingSeasonData } from '../types';

const parseEnv = (key: string, fallback: number): number =>
  parseFloat(process.env[key] || `${fallback}`);

const randomPercent = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

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

const BLOOM_FROST_REDUCTION_MIN = parseEnv('BLOOM_FROST_REDUCTION_MIN', 50);
const BLOOM_FROST_REDUCTION_MAX = parseEnv('BLOOM_FROST_REDUCTION_MAX', 90);
function scaleReduction(min: number, max: number, days: number, maxDays: number): number {
  const clampedDays = Math.min(days, maxDays);
  const ratio = clampedDays / maxDays;
  return min + (max - min) * ratio;
}
export function applyBloomFrostReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const bloomDays = data
    .filter(entry => entry.stage === 'Bloom')
    .sort((a, b) => a.day - b.day);

  let maxConsecutiveFrost = 0;
  let currentStreak = 0;

  for (const day of bloomDays) {
    if (day.frost_occurred) {
      currentStreak += 1;
      maxConsecutiveFrost = Math.max(maxConsecutiveFrost, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  if (maxConsecutiveFrost > 0) {
    // Scale reduction based on length of frost streak (up to 5 days)
    const reductionPercent = scaleReduction(
      BLOOM_FROST_REDUCTION_MIN,
      BLOOM_FROST_REDUCTION_MAX,
      maxConsecutiveFrost,
      5
    );

    return yieldEstimate - (reductionPercent / 100) * yieldEstimate;
  }

  return yieldEstimate;
}

const FRUIT_SET_HEAT_THRESHOLD = parseEnv('FRUIT_SET_HEAT_THRESHOLD', 32);
const FRUIT_SET_HEAT_REDUCTION_MIN = parseEnv('FRUIT_SET_HEAT_REDUCTION_MIN', 1);
const FRUIT_SET_HEAT_REDUCTION_MAX = parseEnv('FRUIT_SET_HEAT_REDUCTION_MAX', 5);
export function applyFruitSetHeatReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const fruitSetDays = data
    .filter(entry => entry.stage === 'Fruit Set')
    .sort((a, b) => a.day - b.day);

  let adjustedYield = yieldEstimate;
  let currentStreak = 0;

  for (let i = 0; i <= fruitSetDays.length; i++) {
    const day = fruitSetDays[i];
    const isHot = day && day.temperature_celsius > FRUIT_SET_HEAT_THRESHOLD;

    if (isHot) {
      currentStreak++;
    } else {
      if (currentStreak >= 2) {
        const reductionPercent = scaleReduction(
          FRUIT_SET_HEAT_REDUCTION_MIN,
          FRUIT_SET_HEAT_REDUCTION_MAX,
          currentStreak,
          5 // scale max reduction at 5+ days
        );
        adjustedYield -= (reductionPercent / 100) * adjustedYield;
      }
      currentStreak = 0;
    }
  }

  return adjustedYield;
}

const FRUIT_SET_HOT_DRY_TEMP = parseEnv('FRUIT_SET_HOT_DRY_TEMP', FRUIT_SET_HEAT_THRESHOLD);
const FRUIT_SET_HOT_DRY_RAIN = parseEnv('FRUIT_SET_HOT_DRY_RAIN', 2);
const FRUIT_SET_HOT_DRY_REDUCTION_MIN = parseEnv('FRUIT_SET_HOT_DRY_REDUCTION_MIN', 1);
const FRUIT_SET_HOT_DRY_REDUCTION_MAX = parseEnv('FRUIT_SET_HOT_DRY_REDUCTION_MAX', 5);
export function applyFruitSetHotDryReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const fruitSetDays = data
    .filter(entry => entry.stage === 'Fruit Set')
    .sort((a, b) => a.day - b.day);

  let adjustedYield = yieldEstimate;
  let currentStreak = 0;

  for (let i = 0; i <= fruitSetDays.length; i++) {
    const day = fruitSetDays[i];
    const isHotAndDry = day &&
      day.temperature_celsius >= FRUIT_SET_HOT_DRY_TEMP &&
      day.rainfall_mm < FRUIT_SET_HOT_DRY_RAIN;

    if (isHotAndDry) {
      currentStreak++;
    } else {
      if (currentStreak >= 2) {
        const reductionPercent = scaleReduction(
          FRUIT_SET_HOT_DRY_REDUCTION_MIN,
          FRUIT_SET_HOT_DRY_REDUCTION_MAX,
          currentStreak,
          5 // max effect scales to 5-day streaks
        );
        adjustedYield -= (reductionPercent / 100) * adjustedYield;
      }
      currentStreak = 0;
    }
  }

  return adjustedYield;
}

export function calculateEstimatedYield(
  treeCount: number,
  yieldPerTree: number,
  seasonData: GrowingSeasonData[]
): number {
  let yieldEstimate = treeCount * yieldPerTree;
  
  // Bloom stage
  yieldEstimate = applyBloomFrostReduction(yieldEstimate, seasonData);
  yieldEstimate = applyBloomTemperatureReduction(yieldEstimate, seasonData);
  yieldEstimate = applyBloomRainReduction(yieldEstimate, seasonData);
  yieldEstimate = applyBloomWindReduction(yieldEstimate, seasonData);
  // Fruit Set stage
  yieldEstimate = applyFruitSetHeatReduction(yieldEstimate, seasonData);
  yieldEstimate = applyFruitSetHotDryReduction(yieldEstimate, seasonData);
  // Fruit Growth stage
  yieldEstimate = applyDroughtReduction(yieldEstimate, seasonData);
  yieldEstimate = applyHeatStressReduction(yieldEstimate, seasonData);
  // Pre-Harvest / Harvest stage
  yieldEstimate = applyWindReduction(yieldEstimate, seasonData);

  return Math.round(yieldEstimate);
}
