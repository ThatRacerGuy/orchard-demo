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

### Optional
Create a `.env` file in the root folder to modify variable values used in the harvest reduction calculations
```
# Pre-Harvest wind
PRE_HARVEST_WIND_THRESHOLD=40
PRE_HARVEST_WIND_REDUCTION_MIN=5
PRE_HARVEST_WIND_REDUCTION_MAX=15

# Fruit Growth heat
FRUIT_GROWTH_HEAT_THRESHOLD=35
FRUIT_GROWTH_HEAT_REDUCTION=0.2

# Fruit Growth drought
FRUIT_GROWTH_DROUGHT_STREAK=4
FRUIT_GROWTH_DROUGHT_REDUCTION=0.5

# Bloom rain
BLOOM_RAIN_THRESHOLD=20
BLOOM_RAIN_REDUCTION=10

# Bloom wind
BLOOM_WIND_THRESHOLD=30
BLOOM_WIND_REDUCTION=5

# Bloom temperature thresholds
BLOOM_TEMP_LOW_MIN=12
BLOOM_TEMP_LOW_MAX=15
BLOOM_TEMP_HIGH_MIN=28
BLOOM_TEMP_HIGH_MAX=30
BLOOM_TEMP_REDUCTION_MIN=5
BLOOM_TEMP_REDUCTION_MAX=15

# Bloom frost
BLOOM_FROST_REDUCTION_MIN=50
BLOOM_FROST_REDUCTION_MAX=90

# Fruit Set heatwave
FRUIT_SET_HEAT_THRESHOLD=32
FRUIT_SET_HEAT_REDUCTION_MIN=1
FRUIT_SET_HEAT_REDUCTION_MAX=5

# Fruit Set hot/dry
FRUIT_SET_HOT_DRY_TEMP=32
FRUIT_SET_HOT_DRY_RAIN=2
FRUIT_SET_HOT_DRY_REDUCTION_MIN=1
FRUIT_SET_HOT_DRY_REDUCTION_MAX=5
```

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
