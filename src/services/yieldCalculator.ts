import { GrowingSeasonData } from '../types';
import dotenv from 'dotenv';

dotenv.config();

function parseEnv(name: string, fallback: number): number {
  const val = process.env[name];
  return val ? parseFloat(val) : fallback;
}

export function randomPercent(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function scaleReduction(min: number, max: number, days: number, maxDays: number): number {
  const clamped = Math.min(days, maxDays);
  const ratio = clamped / maxDays;
  return min + (max - min) * ratio;
}

// --- ENV CONFIG ---
const PRE_HARVEST_WIND_THRESHOLD = parseEnv('PRE_HARVEST_WIND_THRESHOLD', 40);
const PRE_HARVEST_WIND_REDUCTION_MIN = parseEnv('PRE_HARVEST_WIND_REDUCTION_MIN', 5);
const PRE_HARVEST_WIND_REDUCTION_MAX = parseEnv('PRE_HARVEST_WIND_REDUCTION_MAX', 20);

const FRUIT_GROWTH_HEAT_THRESHOLD = parseEnv('FRUIT_GROWTH_HEAT_THRESHOLD', 35);
const FRUIT_GROWTH_HEAT_REDUCTION = parseEnv('FRUIT_GROWTH_HEAT_REDUCTION', 0.2);

const FRUIT_GROWTH_DROUGHT_REDUCTION = parseEnv('FRUIT_GROWTH_DROUGHT_REDUCTION', 0.5);

const FRUIT_SET_HEAT_THRESHOLD = parseEnv('FRUIT_SET_HEAT_THRESHOLD', 32);
const FRUIT_SET_HEAT_REDUCTION_MIN = parseEnv('FRUIT_SET_HEAT_REDUCTION_MIN', 1);
const FRUIT_SET_HEAT_REDUCTION_MAX = parseEnv('FRUIT_SET_HEAT_REDUCTION_MAX', 5);

const FRUIT_SET_HOT_DRY_TEMP = parseEnv('FRUIT_SET_HOT_DRY_TEMP', 32);
const FRUIT_SET_HOT_DRY_RAIN = parseEnv('FRUIT_SET_HOT_DRY_RAIN', 2);
const FRUIT_SET_HOT_DRY_REDUCTION_MIN = parseEnv('FRUIT_SET_HOT_DRY_REDUCTION_MIN', 1);
const FRUIT_SET_HOT_DRY_REDUCTION_MAX = parseEnv('FRUIT_SET_HOT_DRY_REDUCTION_MAX', 5);

const BLOOM_FROST_REDUCTION_MIN = parseEnv('BLOOM_FROST_REDUCTION_MIN', 50);
const BLOOM_FROST_REDUCTION_MAX = parseEnv('BLOOM_FROST_REDUCTION_MAX', 90);
const BLOOM_RAIN_THRESHOLD = parseEnv('BLOOM_RAIN_THRESHOLD', 20);
const BLOOM_RAIN_REDUCTION = parseEnv('BLOOM_RAIN_REDUCTION', 10);
const BLOOM_WIND_THRESHOLD = parseEnv('BLOOM_WIND_THRESHOLD', 30);
const BLOOM_WIND_REDUCTION = parseEnv('BLOOM_WIND_REDUCTION', 5);
const BLOOM_TEMP_LOW = parseEnv('BLOOM_TEMP_LOW', 12);
const BLOOM_TEMP_HIGH = parseEnv('BLOOM_TEMP_HIGH', 28);
const BLOOM_TEMP_REDUCTION_MIN = parseEnv('BLOOM_TEMP_REDUCTION_MIN', 5);
const BLOOM_TEMP_REDUCTION_MAX = parseEnv('BLOOM_TEMP_REDUCTION_MAX', 15);

export function applyPreHarvestWindReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  return data.filter(d => d.stage === 'Pre-Harvest' && d.wind_speed_kmh && d.wind_speed_kmh > PRE_HARVEST_WIND_THRESHOLD)
    .reduce((y, _) => y - (randomPercent(PRE_HARVEST_WIND_REDUCTION_MIN, PRE_HARVEST_WIND_REDUCTION_MAX) / 100) * y, yieldEstimate);
}

export function applyHeatStressReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const count = data.filter(d => d.stage === 'Fruit Growth' && d.temperature_celsius > FRUIT_GROWTH_HEAT_THRESHOLD).length;
  return yieldEstimate - ((FRUIT_GROWTH_HEAT_REDUCTION / 100) * count * yieldEstimate);
}

export function applyDroughtReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const fgDays = data.filter(d => d.stage === 'Fruit Growth').sort((a, b) => a.day - b.day);
  let maxStreak = 0, streak = 0;
  for (const day of fgDays) {
    if (day.rainfall_mm === 0) {
      streak++;
      if (streak >= 4) maxStreak++;
    } else {
      streak = 0;
    }
  }
  return yieldEstimate - ((FRUIT_GROWTH_DROUGHT_REDUCTION / 100) * maxStreak * yieldEstimate);
}

export function applyFruitSetHeatReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const fsDays = data.filter(d => d.stage === 'Fruit Set').sort((a, b) => a.day - b.day);
  let streak = 0, adjustedYield = yieldEstimate;

  for (let i = 0; i <= fsDays.length; i++) {
    const d = fsDays[i];
    const hot = d && d.temperature_celsius > FRUIT_SET_HEAT_THRESHOLD;
    if (hot) {
      streak++;
    } else {
      if (streak >= 2) {
        const reduction = randomPercent(FRUIT_SET_HEAT_REDUCTION_MIN, FRUIT_SET_HEAT_REDUCTION_MAX);
        adjustedYield -= (reduction / 100) * adjustedYield;
      }
      streak = 0;
    }
  }
  return adjustedYield;
}

export function applyFruitSetHotDryReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const fsDays = data.filter(d => d.stage === 'Fruit Set').sort((a, b) => a.day - b.day);
  let streak = 0, adjustedYield = yieldEstimate;

  for (let i = 0; i <= fsDays.length; i++) {
    const d = fsDays[i];
    const hotDry = d && d.temperature_celsius >= FRUIT_SET_HOT_DRY_TEMP && d.rainfall_mm < FRUIT_SET_HOT_DRY_RAIN;
    if (hotDry) {
      streak++;
    } else {
      if (streak >= 2) {
        const reduction = randomPercent(FRUIT_SET_HOT_DRY_REDUCTION_MIN, FRUIT_SET_HOT_DRY_REDUCTION_MAX);
        adjustedYield -= (reduction / 100) * adjustedYield;
      }
      streak = 0;
    }
  }
  return adjustedYield;
}

export function applyBloomFrostReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const bloomDays = data.filter(d => d.stage === 'Bloom').sort((a, b) => a.day - b.day);
  let streak = 0, maxStreak = 0;

  for (const d of bloomDays) {
    if (d.frost_occurred) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }

  if (maxStreak > 0) {
    const reduction = scaleReduction(BLOOM_FROST_REDUCTION_MIN, BLOOM_FROST_REDUCTION_MAX, maxStreak, 5);
    return yieldEstimate - (reduction / 100) * yieldEstimate;
  }

  return yieldEstimate;
}

export function applyBloomRainReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const days = data.filter(d => d.stage === 'Bloom' && d.rainfall_mm > BLOOM_RAIN_THRESHOLD).length;
  return yieldEstimate - (BLOOM_RAIN_REDUCTION / 100) * days * yieldEstimate;
}

export function applyBloomWindReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const days = data.filter(d => d.stage === 'Bloom' && d.wind_speed_kmh && d.wind_speed_kmh > BLOOM_WIND_THRESHOLD).length;
  return yieldEstimate - (BLOOM_WIND_REDUCTION / 100) * days * yieldEstimate;
}

export function applyBloomTemperatureReduction(yieldEstimate: number, data: GrowingSeasonData[]): number {
  const days = data.filter(d =>
    d.stage === 'Bloom' &&
    (d.temperature_celsius < BLOOM_TEMP_LOW || d.temperature_celsius > BLOOM_TEMP_HIGH)
  ).length;

  for (let i = 0; i < days; i++) {
    const reduction = randomPercent(BLOOM_TEMP_REDUCTION_MIN, BLOOM_TEMP_REDUCTION_MAX);
    yieldEstimate -= (reduction / 100) * yieldEstimate;
  }

  return yieldEstimate;
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
  yieldEstimate = applyPreHarvestWindReduction(yieldEstimate, seasonData);

  return Math.round(yieldEstimate) > 0 ? Math.round(yieldEstimate) : 0;
}
