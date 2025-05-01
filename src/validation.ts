import { SimulateYieldRequest, GrowingSeasonData } from './types';

// Validate the structure of the growing season data
export function validateGrowingSeasonData(growingSeasonData: GrowingSeasonData[]): boolean {
  return Array.isArray(growingSeasonData) && growingSeasonData.every(item => 
    typeof item.day === 'number' &&
    typeof item.stage === 'string' &&
    typeof item.temperature_celsius === 'number' &&
    typeof item.rainfall_mm === 'number' &&
    // Validate optional 'frost_occurred' if present
    (item.frost_occurred === undefined || typeof item.frost_occurred === 'boolean') &&
    // Validate optional 'wind_speed_kmh' if present
    (item.wind_speed_kmh === undefined || typeof item.wind_speed_kmh === 'number')
  );
}

// Validate the entire request body
export function validateSimulateYieldRequest(reqBody: SimulateYieldRequest): boolean {
  const { tree_count, potential_yield_per_tree, growing_season_data } = reqBody;

  if (typeof tree_count !== 'number' || typeof potential_yield_per_tree !== 'number') {
    return false;
  }

  // Validate growing_season_data
  if (!validateGrowingSeasonData(growing_season_data)) {
    return false;
  }

  return true;
}
