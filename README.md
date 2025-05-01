# Demo

## Prerequisites

## Installation

```
docker build -t orchard .
```
```
docker run -p 3000:3000 orchard
```

Visit `http://localhost:3000` to view the site in progress.

## Simulation

### POST /simulate-yield

Sample request body (in JSON):
```
{
  "tree_count": 150,
  "potential_yield_per_tree": 500, // Max potential apples per tree in a PERFECT season
  "growing_season_data": [
    // Data spanning from bud break through harvest
    {"day": 1, "stage": "Bud Break", "temperature_celsius": 10, "rainfall_mm": 5, "frost_occurred": false},
    {"day": 2, "stage": "Bud Break", "temperature_celsius": 12, "rainfall_mm": 2, "frost_occurred": false},
    // ... days passing ...
    {"day": 30, "stage": "Bloom", "temperature_celsius": 18, "rainfall_mm": 0, "frost_occurred": false},
    {"day": 31, "stage": "Bloom", "temperature_celsius": -1, "rainfall_mm": 0, "frost_occurred": true}, // Critical Frost Event!
    {"day": 32, "stage": "Bloom", "temperature_celsius": 15, "rainfall_mm": 25, "wind_speed_kmh": 10}, // Heavy rain during bloom
    // ... days passing ...
    {"day": 60, "stage": "Fruit Set", "temperature_celsius": 22, "rainfall_mm": 1, "frost_occurred": false},
    // ... days passing ...
    {"day": 100, "stage": "Fruit Growth", "temperature_celsius": 35, "rainfall_mm": 0, "frost_occurred": false}, // Heat stress
    {"day": 101, "stage": "Fruit Growth", "temperature_celsius": 36, "rainfall_mm": 0, "frost_occurred": false}, // Continued heat stress
    // ... days passing ...
    {"day": 170, "stage": "Pre-Harvest", "temperature_celsius": 20, "rainfall_mm": 5, "wind_speed_kmh": 50}, // High wind risk
    // ... up to harvest day ...
  ]
}
```
Full POST (using cURL):
```
curl -X POST http://localhost:3000/simulate-yield \
  -H "Content-Type: application/json" \
  -d '{
    "tree_count": 100,
    "potential_yield_per_tree": 2.5,
    "growing_season_data": [
      { 
        "day": 1, 
        "stage": "Bud Break", 
        "temperature_celsius": 15, 
        "rainfall_mm": 10, 
        "frost_occurred": false, 
        "wind_speed_kmh": 5 
      },
      { 
        "day": 2, 
        "stage": "Pre-Harvest", 
        "temperature_celsius": 20, 
        "rainfall_mm": 0, 
        "frost_occurred": false, 
        "wind_speed_kmh": 45 
      },
      { 
        "day": 3, 
        "stage": "Pre-Harvest", 
        "temperature_celsius": 22, 
        "rainfall_mm": 0, 
        "frost_occurred": false, 
        "wind_speed_kmh": 50 
      }
    ]
  }'
```
Response
```
{
  "estimated_total_yield": <Number between 0 and the maximum potential yield>
}
```
