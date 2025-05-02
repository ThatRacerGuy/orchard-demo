# Advanced Orchard Microservice Simulation Challenge (Apple Tree Edition) - John Jennings

This demo was created to satisfy the requirements outlined at https://github.com/asynnestvedt/eval_apples_advanced. In the following sections, I will add inforation about how to install this demo code on your local machine, how this demo satisfies the outlined requirements, code rationalle, and other considerations.

The purpose of this demo is to simulate **apple crop yield potential** based on weather patterns throughout a **growing season** of 150 to 200+ days. This simulation recognizes that apple yield isn't determined daily but is influenced by cumulative weather and critical events during specific developmental stages (like bloom, fruit set, and growth). I am far from an expert in apple growing yields; in fact, I am allergic to apples. But this is only a simulation...

Some key variables used by both the simulation POST and the test cases are the `tree_count` (the number of trees in the orchard), `potential_yield_per_tree` (the maximum number of apples each tree can produce), and `growing_season_data` (data about the weather for each of the 150 to 200+ days of the growing season). The daily weather found in `growing_season_data` has the potential to allow the trees to maintain max or near-max growing yield, if the weather is optimal for most of all of the days, or it has the potential to introduce adverse weather conditions (high temperatures, snow, wind, drought, etc.). Each adverse weather event has a corresponsing calculation to simulate the negative effect on the potential apple yield per tree. The calculation logic can be round in a later section of this README.

## Prerequisites

1. Node.js - I used Node.js version 23 on my local machine in this coding challenge, but version 22+ should be sufficient. More information about installing Node.js can be found at https://nodejs.org/.
2. Docker - I used OrbStack locally as a desktop client for Docker, but there are many options. More information about Docker installation can be found at https://www.docker.com/, including information about Docker Desktop, a similar desktop client.

## Installation
Note: all commands in this section should be run from the command line at the project root folder.

To ensure tests running outside the Docker container have all prerequisites met, we can first run the following command:
```
npm install
```
Because the necessary Docker files are in place in this repo, we can then run a few simple commands in our terminal:
```
docker-compose up --build
```
The `--build` is necessary on the first run to install all necessary dependent code.
To stop the Docker container, we can run in the terminal:
```
docker-compose down
```
To bring the container back up, assuming it is not the first time we are building locally, we can run in the terminal:
```
docker-compose up
```

### Optional
1. Python - Python is not used for this simulation app. Rather, it helps generate data that can be used in the simulation to save us from manually creating many simulation cases. More information about installing Python can be found at https://www.python.org/.

We can now visit `http://localhost:3000` in our browser to view the site.

### Optional Installation Step
Because many variables are used to simulate the growing season, we can store the values used in an `.env` file, though it is not included in this repository. You can create an `.env` file in the root folder of this repo to modify variable values used in the harvest reduction calculations. This step is optional because default values will be used in the calculation without an `.env` file being present. A sample `.env` file code is below:
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

## Calculation Logic

Each stage has extreme weather events that can negatively impact the potential total yield in a growing season - the negative impact being less apples produced. Given the requirements outlined, there are clear calculations needed, again depending on the stage. The following logic is used, given the values set in the `.env` file (or default):

- Bloom stage
  1. If a frost orrurs, which is a boolean value, the `estimated_total_yield` will be reduced 50% for 1 day up to 90% for 5+ days
  2. If temperatures are too low or high, the `estimated_total_yield` will be reduced by a random amount between 5 and 15% per day
  3. If there is heavy rain, the `estimated_total_yield` will be reduced by 10% per day
  4. If there is high wind, the `estimated_total_yield` will be reduced by 5% per day
- Fruit Set stage
  1. If there is extreme heat for consecutive days, the `estimated_total_yield` will be reduced by a random amount between 1 and 5% per consecutive day occurance (heatwave)
  2. If there is a drought and high temperature for consecutive days, the `estimated_total_yield` will be reduced by a random amount between 1 and 5% per consecutive day occurance (drought)
- Fruit Growth stage
  1. Id there are drought conditions, the `estimated_total_yield` will be reduced 0.5% per number of consecutive days
  2. If there is extreme heat, the `estimated_total_yield` will be reduced 0.2% per day
- Pre-Harvest stage
  1. If there are high winds, the `estimated_total_yield` will be reduced by a random amount between 5 and 20% per day/occurance

## Simulation

To simulate the `estimated_total_yield` (the calculated number of apples produced in the orchard in a growing season, with adverse weather conditions factored in), we need to run a POST to a particular endpoint in the app.

The POST path will be `http://localhost:3000/simulate-yield`, and it will need to contain JSON data is the request body.

Now, it is not easy to simulate the weather patterns over 150 days by hand. Therefore, we can use an included Python script to generate JSON file data to be used in the simulation. It is optional to use the Python script, which is why Python is an optional prerequisite in this app. However, it can be very useful to create many JSON files of growing data.

A request body may look similar to the following JSON, whcih is from the demo instructions:
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
One JSON file is also contained in this repo at `simulations/season_sample.json`, which can be used for the simulation.

### POST /simulate-yield

The full instruction to run the simulation is to run `cURL` on the command line, using the sample JSON file, where the filename of the JSON file can be changed for different simulations:

```
curl -X POST http://localhost:3000/simulate-yield \
  -H "Content-Type: application/json" \
  -d @simulations/season_sample.json
```
The expected response will be returned as `estimated_total_yield`:
```
{
  "estimated_total_yield": <Number between 0 and the maximum potential yield>
}
```
*Did your simulation result in more or less apples than you thought? Beware the hard frost...*

To generate additional simulation cases, you may optionally run the Python script to save additional JSON files:

```
python generate.py
```
It is possible in your local Python you may need to append the major version, such as:
```
python3 generate.py
```

Again, this is not a requirement, but it help create simulation data much faster than other ways.

## Testing

The app can be tested with included test cases contained at the file `src/services/yieldCalculator.test.ts`. These are mainly individual tests of each grown stage's extreme weather events as well as a few cases with full season data with some extreme weather.

The test cases are as follows, to match the extreme weather calculations:

- applies bloom frost reduction (50-90%) based on consecutive frost days
- applies bloom rain reduction (10% per day)
- applies bloom wind reduction (5% per day > 30km/h)
- applies bloom temperature stress (5-15%) on extreme temps
- applies fruit growth heat stress (0.2% per day > 35°C)
- applies fruit growth drought stress (0.5% per day for 4+ dry streak)
- applies fruit set heat streak reduction (1-5%) for >32°C
- applies fruit set hot & dry streak (1-5%) for temp ≥32 & rain <2mm
- applies pre-harvest wind reduction (5-20% per day > 40km/h)
- handles 150-day full season with minimal weather-related reductions
- handles 150-day season with devastating frost during Bloom stage
- handles 150-day season with persistent cold, wet, and windy weather
- handles 150-day season with significant summer drought and heat in fruit set and growth stages
- handles 150-day season with high winds at the end of Pre-Harvest stage
- handles 150-day season with 0 trees
- handles 150-day season without any growing season data

## Saving Simulation Data

Everytime we run cURL to simulate a growing season, the data is saved in a database - in this case a MongoDB database. The saved data, which we may refer to as historic data, can be viewed at http://localhost:3000/results.

This saved historic data will be used for an additional endpoint.
