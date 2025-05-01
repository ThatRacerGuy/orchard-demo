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

Request body (in JSON):
```
{
  "tree_count": 150,
  "potential_yield_per_tree": 500, // Max potential apples per tree in a PERFECT season
}
```
Full POST (using cURL):
```
curl -X POST http://localhost:3000/simulate-yield \
  -H "Content-Type: application/json" \
  -d '{"tree_count": 150, "potential_yield_per_tree": 500}'
```
Response
```
{
  "estimated_total_yield": 75000
}
```
