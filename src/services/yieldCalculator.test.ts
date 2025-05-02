import { calculateEstimatedYield } from './yieldCalculator';
import { GrowingSeasonData } from '../types';

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

  it('applies fruit set heat streak reduction (1-5%) for >32°C)', () => {
    const data: GrowingSeasonData[] = [
      { day: 1, stage: 'Fruit Set', temperature_celsius: 33, rainfall_mm: 5, frost_occurred: false },
      { day: 2, stage: 'Fruit Set', temperature_celsius: 34, rainfall_mm: 3, frost_occurred: false },
    ];
    const result = calculateEstimatedYield(baseTrees, yieldPerTree, data);
    expect(result).toBeLessThan(1000);
    expect(result).toBeGreaterThan(900);
  });

  it('applies fruit set hot & dry streak (1-5%) for temp ≥32 & rain <2mm)', () => {
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
});
