import { calculateEstimatedYield } from './yieldCalculator';
import { GrowingSeasonData } from '../types';

jest.mock('./yieldCalculator', () => {
  const original = jest.requireActual('./yieldCalculator');
  return {
    ...original,
    randomPercent: jest.fn(() => 10), // Always return 10% for test consistency
  };
});

const baseTrees = 100;
const yieldPerTree = 10; // Max yield = 1000

describe('Yield Simulation Tests', () => {
  it('applies bloom frost reduction (50-90%) based on consecutive frost days', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Bloom', temperature_celsius: 10, rainfall_mm: 2, frost_occurred: true },
      { day: 2, stage: 'Bloom', temperature_celsius: 9, rainfall_mm: 3, frost_occurred: true },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(1000);
    expect(result).toBeGreaterThanOrEqual(100);
    expect(result).toBeLessThanOrEqual(500);
  });

  it('applies bloom rain reduction (10% per day)', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Bloom', temperature_celsius: 18, rainfall_mm: 25, frost_occurred: false },
      { day: 2, stage: 'Bloom', temperature_celsius: 19, rainfall_mm: 30, frost_occurred: false },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(820); // 1000 - 10% - 10% = 810
  });

  it('applies bloom wind reduction (5% per day > 30km/h)', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Bloom', temperature_celsius: 20, rainfall_mm: 0, frost_occurred: false, wind_speed_kmh: 35 },
      { day: 2, stage: 'Bloom', temperature_celsius: 22, rainfall_mm: 0, frost_occurred: false, wind_speed_kmh: 33 },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(905); // Expecting around 902.5 after 2x5% compounding
  });

  it('applies bloom temperature stress (5-15%) on extreme temps', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Bloom', temperature_celsius: 11, rainfall_mm: 1, frost_occurred: false },
      { day: 2, stage: 'Bloom', temperature_celsius: 29, rainfall_mm: 0, frost_occurred: false },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(950); // 2 temp stress days: expect 10–30% loss
  });

  it('applies fruit growth heat stress (0.2% per day > 35°C)', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Fruit Growth', temperature_celsius: 36, rainfall_mm: 5, frost_occurred: false },
      { day: 2, stage: 'Fruit Growth', temperature_celsius: 37, rainfall_mm: 2, frost_occurred: false },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(997); // ~0.4% total reduction
  });

  it('applies fruit growth drought stress (0.5% per day for 4+ dry streak)', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Fruit Growth', temperature_celsius: 30, rainfall_mm: 0, frost_occurred: false },
      { day: 2, stage: 'Fruit Growth', temperature_celsius: 29, rainfall_mm: 0, frost_occurred: false },
      { day: 3, stage: 'Fruit Growth', temperature_celsius: 28, rainfall_mm: 0, frost_occurred: false },
      { day: 4, stage: 'Fruit Growth', temperature_celsius: 27, rainfall_mm: 0, frost_occurred: false },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(996); // ~0.5% reduction
  });

  it('applies fruit set heat streak reduction (1-5%) for >32°C', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Fruit Set', temperature_celsius: 33, rainfall_mm: 5, frost_occurred: false },
      { day: 2, stage: 'Fruit Set', temperature_celsius: 34, rainfall_mm: 3, frost_occurred: false },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(1000);
    expect(result).toBeGreaterThan(900);
  });

  it('applies fruit set hot & dry streak (1-5%) for temp ≥32 & rain <2mm', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Fruit Set', temperature_celsius: 33, rainfall_mm: 1, frost_occurred: false },
      { day: 2, stage: 'Fruit Set', temperature_celsius: 34, rainfall_mm: 0.5, frost_occurred: false },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(1000);
    expect(result).toBeGreaterThan(900);
  });

  it('applies pre-harvest wind reduction (5-20% per day > 40km/h)', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Pre-Harvest', temperature_celsius: 25, rainfall_mm: 2, frost_occurred: false, wind_speed_kmh: 45 },
      { day: 2, stage: 'Pre-Harvest', temperature_celsius: 24, rainfall_mm: 1, frost_occurred: false, wind_speed_kmh: 50 },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(900); // Could be significant
  });

  it('handles 150-day full season with minimal weather-related reductions', () => {
    const data: GrowingSeasonData[] = [];
  
    const stages = ['Bud Break', 'Bloom', 'Fruit Set', 'Fruit Growth', 'Pre-Harvest'] as const;
    const daysPerStage = Math.floor(150 / stages.length);
  
    let day = 1;
    for (const stage of stages) {
      for (let i = 0; i < daysPerStage; i++) {
        data.push({
          day: day++,
          stage,
          temperature_celsius:
            stage === 'Bloom' ? 13 : stage === 'Fruit Set' ? 31.9 : stage === 'Fruit Growth' ? 34.9 : 25,
          rainfall_mm: stage === 'Fruit Growth' ? 1 : 5,
          frost_occurred: false,
          wind_speed_kmh:
            stage === 'Bloom' ? 29 :
            stage === 'Pre-Harvest' ? 39.9 : undefined
        });
      }
    }
  
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeCloseTo(1000, 0); // Should remain near base yield
  });
  
  it('handles 150-day season with devastating frost during Bloom stage', () => {
    const data: GrowingSeasonData[] = [];
  
    const stages = ['Bud Break', 'Bloom', 'Fruit Set', 'Fruit Growth', 'Pre-Harvest'] as const;
    const daysPerStage = Math.floor(150 / stages.length);
  
    let day = 1;
  
    for (const stage of stages) {
      for (let i = 0; i < daysPerStage; i++) {
        let frost_occurred = false;
  
        // Introduce a long frost streak during Bloom (20 consecutive frost days)
        if (stage === 'Bloom' && i >= 5 && i < 25) {
          frost_occurred = true;
        }
  
        data.push({
          day: day++,
          stage,
          temperature_celsius: stage === 'Bloom' ? 5 : 20,
          rainfall_mm: 5,
          frost_occurred,
          wind_speed_kmh: 10,
        });
      }
    }
  
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
  
    // Frost streak should cause a huge reduction (at least 50–90%)
    expect(result).toBeLessThan(500);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('handles 150-day season with persistent cold, wet, and windy weather', () => {
    const data: GrowingSeasonData[] = [];
  
    const stages = ['Bud Break', 'Bloom', 'Fruit Set', 'Fruit Growth', 'Pre-Harvest'] as const;
    const daysPerStage = Math.floor(150 / stages.length);
    let day = 1;
  
    for (const stage of stages) {
      for (let i = 0; i < daysPerStage; i++) {
        const entry = {
          day: day++,
          stage,
          temperature_celsius:
            stage === 'Bloom' ? 10 : 14, // Cold throughout, Bloom < 12-15°C
          rainfall_mm:
            stage === 'Bloom' ? 25 : 10, // Heavy rain during Bloom
          frost_occurred: false,
          wind_speed_kmh:
            stage === 'Bloom' ? 35 : stage === 'Pre-Harvest' ? 45 : 20, // Windy in Bloom and Pre-Harvest
        };
        data.push(entry);
      }
    }
  
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
  
    // Expect notable yield drop due to:
    // - Cold Bloom temps => random -5% to -15% per day
    // - Bloom rain >20mm => -10% per day
    // - Bloom wind >30 => -5% per day
    // - Pre-Harvest wind >40 => random -5% to -20% per day
  
    expect(result).toBeLessThan(300); // High cumulative reductions expected
    expect(result).toBeGreaterThan(0); // Sanity check
  });

  it('handles 150-day season with significant summer drought and heat in fruit set and growth stages', () => {
    const data: GrowingSeasonData[] = [];
  
    const stages = ['Bud Break', 'Bloom', 'Fruit Set', 'Fruit Growth', 'Pre-Harvest'] as const;
    const daysPerStage = Math.floor(150 / stages.length);
    let day = 1;
  
    for (const stage of stages) {
      for (let i = 0; i < daysPerStage; i++) {
        let entry = {
          day: day++,
          stage,
          temperature_celsius: 25,
          rainfall_mm: 5,
          frost_occurred: false,
          wind_speed_kmh: 10,
        };
  
        // Simulate extreme conditions in Fruit Set and Fruit Growth
        if (stage === 'Fruit Set') {
          entry.temperature_celsius = 34; // >32°C = heat stress
          entry.rainfall_mm = 1;           // <2mm = dry
        }
  
        if (stage === 'Fruit Growth') {
          entry.temperature_celsius = 36; // >35°C = heat penalty
          entry.rainfall_mm = 0;          // triggers drought logic
        }
  
        data.push(entry);
      }
    }
  
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
  
    // Expect reductions from:
    // - Fruit Set heat streaks: 1–5% per instance
    // - Fruit Set hot & dry: additional 1–5% per streak
    // - Fruit Growth heat: 0.2% per day
    // - Fruit Growth drought (4+ zero-rain days): 0.5% per streak day
  
    expect(result).toBeLessThan(800); // Significant cumulative stress
    expect(result).toBeGreaterThan(0); // Should not go below zero
  });

  it('handles 150-day season with high winds at the end of Pre-Harvest stage', () => {
    const data: GrowingSeasonData[] = [];
  
    const stages = ['Bud Break', 'Bloom', 'Fruit Set', 'Fruit Growth', 'Pre-Harvest'] as const;
    const daysPerStage = Math.floor(150 / stages.length);
    let day = 1;
  
    for (const stage of stages) {
      for (let i = 0; i < daysPerStage; i++) {
        const isPreHarvestWindy = stage === 'Pre-Harvest' && i >= daysPerStage - 5;
  
        data.push({
          day: day++,
          stage,
          temperature_celsius: 22,
          rainfall_mm: 5,
          frost_occurred: false,
          wind_speed_kmh: isPreHarvestWindy ? 45 : 10, // Only last 5 days are windy
        });
      }
    }
  
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
  
    // 5 windy days at end of Pre-Harvest should apply 5 reductions of 5%–20% each
    // Base yield = 1000. Max reduction ~70%, min ~25%
  
    expect(result).toBeLessThan(750);  // Some reduction
    expect(result).toBeGreaterThan(300); // Shouldn’t be catastrophic
  });
  
  it('handles 150-day season with 0 trees', () => {
    const data: GrowingSeasonData[] = [];
  
    const stages = ['Bud Break', 'Bloom', 'Fruit Set', 'Fruit Growth', 'Pre-Harvest'] as const;
    const daysPerStage = Math.floor(150 / stages.length);
    let day = 1;
  
    for (const stage of stages) {
      for (let i = 0; i < daysPerStage; i++) {
        data.push({
          day: day++,
          stage,
          temperature_celsius: 22,
          rainfall_mm: 5,
          frost_occurred: false,
          wind_speed_kmh: 10,
        });
      }
    }
  
    const result = calculateEstimatedYield(0, yieldPerTree, data);
  
    // With 0 trees, the expected yield should be 0
    expect(result).toBe(0);
  });

  it('handles 150-day season without any growing season data', () => {
    const data: GrowingSeasonData[] = []; // No data
  
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
  
    // With no data, no reductions should apply → yield = tree_count * yield_per_tree
    expect(result).toBe(1000);
  });  
});
