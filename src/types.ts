// Define the GrowingSeasonData structure
export interface GrowingSeasonData {
  day: number;
  stage: string;
  temperature_celsius: number;
  rainfall_mm: number;
  frost_occurred?: boolean; // Optional
  wind_speed_kmh?: number; // Optional

  // NEW OPTIONAL FIELDS:
  major_event?: string; // e.g., 'Frost during Bloom'
  yield_reduction_percent?: number;
}

// Define the SimulateYieldRequest structure
export interface SimulateYieldRequest {
  tree_count: number;
  potential_yield_per_tree: number;
  growing_season_data: GrowingSeasonData[];
}
