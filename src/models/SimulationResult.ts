import mongoose, { Schema, Document } from 'mongoose';

interface WeatherDay {
  day: number;
  stage: string;
  temperature_celsius: number;
  rainfall_mm: number;
  frost_occurred?: boolean;
  wind_speed_kmh?: number;
}

interface Event {
  event: string;
  reductionPercent: number; // The reduction percentage caused by the event
}

export interface SimulationResultDocument extends Document {
  tree_count: number;
  potential_yield_per_tree: number;
  estimated_total_yield: number;
  growing_season_data: WeatherDay[];
  events: Event[]; // New field to store the events
  createdAt: Date;
}

const SimulationResultSchema = new Schema<SimulationResultDocument>(
  {
    tree_count: { type: Number, required: true },
    potential_yield_per_tree: { type: Number, required: true },
    estimated_total_yield: { type: Number, required: true },
    growing_season_data: [
      {
        day: { type: Number, required: true },
        stage: { type: String, required: true },
        temperature_celsius: { type: Number, required: true },
        rainfall_mm: { type: Number, required: true },
        frost_occurred: { type: Boolean, required: false },
        wind_speed_kmh: { type: Number, required: false }
      }
    ],
    events: [
      {
        event: { type: String, required: true },
        reductionPercent: { type: Number, required: true }
      }
    ]
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SimulationResult = mongoose.model<SimulationResultDocument>(
  'SimulationResult',
  SimulationResultSchema
);
