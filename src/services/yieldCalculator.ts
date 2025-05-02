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

export function applyPreHarvestWindReduction(yieldEstimate: number, data: GrowingSeasonData[]) {
  const days = data.filter(d => d.stage === 'Pre-Harvest' && d.wind_speed_kmh && d.wind_speed_kmh > PRE_HARVEST_WIND_THRESHOLD);
  if (days.length === 0) return { yield: yieldEstimate };

  let adjustedYield = yieldEstimate;
  let totalReduction = 0;

  for (const _ of days) {
    const reduction = randomPercent(PRE_HARVEST_WIND_REDUCTION_MIN, PRE_HARVEST_WIND_REDUCTION_MAX);
    totalReduction += reduction;
    adjustedYield -= (reduction / 100) * adjustedYield;
  }

  return {
    yield: adjustedYield,
    event: 'High Wind Pre-Harvest',
    percent: totalReduction / days.length
  };
}

export function applyHeatStressReduction(yieldEstimate: number, data: GrowingSeasonData[]) {
  const count = data.filter(d => d.stage === 'Fruit Growth' && d.temperature_celsius > FRUIT_GROWTH_HEAT_THRESHOLD).length;
  if (count === 0) return { yield: yieldEstimate };

  const reductionTotal = (FRUIT_GROWTH_HEAT_REDUCTION / 100) * count * yieldEstimate;
  return {
    yield: yieldEstimate - reductionTotal,
    event: 'Heat Stress During Fruit Growth',
    percent: (reductionTotal / yieldEstimate) * 100
  };
}

export function applyDroughtReduction(yieldEstimate: number, data: GrowingSeasonData[]) {
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

  if (maxStreak === 0) return { yield: yieldEstimate };

  const reduction = (FRUIT_GROWTH_DROUGHT_REDUCTION / 100) * maxStreak * yieldEstimate;
  return {
    yield: yieldEstimate - reduction,
    event: 'Prolonged Summer Drought',
    percent: (reduction / yieldEstimate) * 100
  };
}

export function applyFruitSetHeatReduction(yieldEstimate: number, data: GrowingSeasonData[]) {
  const fsDays = data.filter(d => d.stage === 'Fruit Set').sort((a, b) => a.day - b.day);
  let streak = 0, adjustedYield = yieldEstimate, reductionEvents = 0, totalReduction = 0;

  for (let i = 0; i <= fsDays.length; i++) {
    const d = fsDays[i];
    const hot = d && d.temperature_celsius > FRUIT_SET_HEAT_THRESHOLD;
    if (hot) {
      streak++;
    } else {
      if (streak >= 2) {
        const reduction = randomPercent(FRUIT_SET_HEAT_REDUCTION_MIN, FRUIT_SET_HEAT_REDUCTION_MAX);
        totalReduction += reduction;
        adjustedYield -= (reduction / 100) * adjustedYield;
        reductionEvents++;
      }
      streak = 0;
    }
  }

  if (reductionEvents === 0) return { yield: yieldEstimate };

  return {
    yield: adjustedYield,
    event: 'Heatwaves During Fruit Set',
    percent: totalReduction / reductionEvents
  };
}

export function applyFruitSetHotDryReduction(yieldEstimate: number, data: GrowingSeasonData[]) {
  const fsDays = data.filter(d => d.stage === 'Fruit Set').sort((a, b) => a.day - b.day);
  let streak = 0, adjustedYield = yieldEstimate, totalReduction = 0, events = 0;

  for (let i = 0; i <= fsDays.length; i++) {
    const d = fsDays[i];
    const hotDry = d && d.temperature_celsius >= FRUIT_SET_HOT_DRY_TEMP && d.rainfall_mm < FRUIT_SET_HOT_DRY_RAIN;
    if (hotDry) {
      streak++;
    } else {
      if (streak >= 2) {
        const reduction = randomPercent(FRUIT_SET_HOT_DRY_REDUCTION_MIN, FRUIT_SET_HOT_DRY_REDUCTION_MAX);
        totalReduction += reduction;
        adjustedYield -= (reduction / 100) * adjustedYield;
        events++;
      }
      streak = 0;
    }
  }

  if (events === 0) return { yield: yieldEstimate };

  return {
    yield: adjustedYield,
    event: 'Hot and Dry Conditions During Fruit Set',
    percent: totalReduction / events
  };
}

export function applyBloomFrostReduction(yieldEstimate: number, data: GrowingSeasonData[]): { yield: number; event?: string; percent?: number } {
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
    const newYield = yieldEstimate - (reduction / 100) * yieldEstimate;
    return {
      yield: newYield,
      event: 'Frost during Bloom',
      percent: reduction
    };
  }

  return { yield: yieldEstimate };
}

export function applyBloomRainReduction(yieldEstimate: number, data: GrowingSeasonData[]) {
  const days = data.filter(d => d.stage === 'Bloom' && d.rainfall_mm > BLOOM_RAIN_THRESHOLD).length;
  if (days === 0) return { yield: yieldEstimate };

  const reduction = (BLOOM_RAIN_REDUCTION / 100) * days * yieldEstimate;
  return {
    yield: yieldEstimate - reduction,
    event: 'Heavy Rain During Bloom',
    percent: (reduction / yieldEstimate) * 100
  };
}

export function applyBloomWindReduction(yieldEstimate: number, data: GrowingSeasonData[]) {
  const days = data.filter(d => d.stage === 'Bloom' && d.wind_speed_kmh && d.wind_speed_kmh > BLOOM_WIND_THRESHOLD).length;
  if (days === 0) return { yield: yieldEstimate };

  const reduction = (BLOOM_WIND_REDUCTION / 100) * days * yieldEstimate;
  return {
    yield: yieldEstimate - reduction,
    event: 'High Wind During Bloom',
    percent: (reduction / yieldEstimate) * 100
  };
}

export function applyBloomTemperatureReduction(yieldEstimate: number, data: GrowingSeasonData[]) {
  const days = data.filter(d =>
    d.stage === 'Bloom' &&
    (d.temperature_celsius < BLOOM_TEMP_LOW || d.temperature_celsius > BLOOM_TEMP_HIGH)
  );

  if (days.length === 0) return { yield: yieldEstimate };

  let adjustedYield = yieldEstimate;
  let totalReduction = 0;

  for (let i = 0; i < days.length; i++) {
    const reduction = randomPercent(BLOOM_TEMP_REDUCTION_MIN, BLOOM_TEMP_REDUCTION_MAX);
    totalReduction += reduction;
    adjustedYield -= (reduction / 100) * adjustedYield;
  }

  return {
    yield: adjustedYield,
    event: 'Unfavorable Temperature During Bloom',
    percent: totalReduction / days.length
  };
}

export function calculateEstimatedYield(
  treeCount: number,
  yieldPerTree: number,
  seasonData: GrowingSeasonData[]
): number {
  let yieldEstimate = treeCount * yieldPerTree;
  const majorEvents: { event: string; percent: number }[] = [];

  function applyAndTrack(fn: (yieldEstimate: number, data: GrowingSeasonData[]) => { yield: number; event?: string; percent?: number }) {
    const result = fn(yieldEstimate, seasonData);
    yieldEstimate = result.yield;
    if (result.event && typeof result.percent === 'number') {
      majorEvents.push({ event: result.event, percent: result.percent });
    }
  }

  // Apply stages with tracking
  applyAndTrack(applyBloomFrostReduction);
  applyAndTrack(applyBloomTemperatureReduction);
  applyAndTrack(applyBloomRainReduction);
  applyAndTrack(applyBloomWindReduction);
  applyAndTrack(applyFruitSetHeatReduction);
  applyAndTrack(applyFruitSetHotDryReduction);
  applyAndTrack(applyDroughtReduction);
  applyAndTrack(applyHeatStressReduction);
  applyAndTrack(applyPreHarvestWindReduction);
  
  // Bloom stage
  //yieldEstimate = applyBloomFrostReduction(yieldEstimate, seasonData);
  //yieldEstimate = applyBloomTemperatureReduction(yieldEstimate, seasonData);
  //yieldEstimate = applyBloomRainReduction(yieldEstimate, seasonData);
  //yieldEstimate = applyBloomWindReduction(yieldEstimate, seasonData);
  // Fruit Set stage
  //yieldEstimate = applyFruitSetHeatReduction(yieldEstimate, seasonData);
  //yieldEstimate = applyFruitSetHotDryReduction(yieldEstimate, seasonData);
  // Fruit Growth stage
  //yieldEstimate = applyDroughtReduction(yieldEstimate, seasonData);
  //yieldEstimate = applyHeatStressReduction(yieldEstimate, seasonData);
  // Pre-Harvest / Harvest stage
  //yieldEstimate = applyPreHarvestWindReduction(yieldEstimate, seasonData);

  return Math.round(yieldEstimate) > 0 ? Math.round(yieldEstimate) : 0;
}
