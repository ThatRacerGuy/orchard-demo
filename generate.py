import json
import random
import os
from datetime import datetime

# Create folder if it doesn't exist
output_dir = "simulations"
os.makedirs(output_dir, exist_ok=True)

# Define the growth stages
stages = ['Bud Break', 'Bloom', 'Fruit Set', 'Fruit Growth', 'Pre-Harvest']
days_per_stage = 30
day_counter = 1
season_data = []

for stage in stages:
    for _ in range(days_per_stage):
        if stage == 'Bud Break':
            temp = round(random.uniform(-2, 14), 1)
            rain = round(random.uniform(0, 8), 1)
            frost = random.random() < 0.15
            entry = {
                "day": day_counter,
                "stage": stage,
                "temperature_celsius": temp,
                "rainfall_mm": rain,
                "frost_occurred": frost,
            }

        elif stage == 'Bloom':
            temp = round(random.uniform(-2, 18), 1)
            rain = round(random.uniform(0, 30), 1)
            frost = random.random() < 0.1
            wind = round(random.uniform(0, 40), 1)
            entry = {
                "day": day_counter,
                "stage": stage,
                "temperature_celsius": temp,
                "rainfall_mm": rain,
                "frost_occurred": frost,
                "wind_speed_kmh": wind
            }

        elif stage == 'Fruit Set':
            temp = round(random.uniform(0, 30), 1)
            rain = round(random.uniform(0, 5), 1)
            frost = random.random() < 0.05
            wind = round(random.uniform(0, 20), 1)
            entry = {
                "day": day_counter,
                "stage": stage,
                "temperature_celsius": temp,
                "rainfall_mm": rain,
                "frost_occurred": frost,
                "wind_speed_kmh": wind
            }

        elif stage == 'Fruit Growth':
            temp = round(random.uniform(12, 38), 1)
            rain = round(random.uniform(0, 3), 1)
            wind = round(random.uniform(0, 50), 1)
            entry = {
                "day": day_counter,
                "stage": stage,
                "temperature_celsius": temp,
                "rainfall_mm": rain,
                "wind_speed_kmh": wind
            }

        elif stage == 'Pre-Harvest':
            temp = round(random.uniform(20, 38), 1)
            rain = round(random.uniform(0, 5), 1)
            wind = round(random.uniform(0, 50), 1)
            entry = {
                "day": day_counter,
                "stage": stage,
                "temperature_celsius": temp,
                "rainfall_mm": rain,
                "wind_speed_kmh": wind
            }

        season_data.append(entry)
        day_counter += 1

# Final JSON structure
payload = {
    "tree_count": 150,
    "potential_yield_per_tree": 500,
    "growing_season_data": season_data
}

# Use timestamp for unique filename
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
filename = os.path.join(output_dir, f"season_{timestamp}.json")

with open(filename, "w") as f:
    json.dump(payload, f, indent=2)

print("✅ Generated JSON file with 150 days of realistic weather.")
