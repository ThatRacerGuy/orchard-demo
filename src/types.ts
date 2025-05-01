// Define the GrowingSeasonData structure
export interface GrowingSeasonData {
  day: number;
  stage: string;
  temperature_celsius: number;
  rainfall_mm: number;
  frost_occurred?: boolean; // Optional
  wind_speed_kmh?: number; // Optional
}

// Define the SimulateYieldRequest structure
export interface SimulateYieldRequest {
  tree_count: number;
  potential_yield_per_tree: number;
  growing_season_data: GrowingSeasonData[];
}
