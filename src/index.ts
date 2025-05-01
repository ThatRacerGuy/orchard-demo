import express from 'express';

import { validateSimulateYieldRequest } from './validation';

// Helper function to get a random percentage between 5 and 20 for wind events
function getRandomReductionPercentage(): number {
  return Math.random() * (20 - 5) + 5;
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello world');
});

// Define the POST route with correct typing for the request body
app.post('/simulate-yield', (req, res) => {
  const requestBody = req.body;

  // Use the imported validation function
  if (!validateSimulateYieldRequest(requestBody)) {
    res.status(400).json({ error: 'Invalid request body structure' });
  }

  const { tree_count, potential_yield_per_tree, growing_season_data } = requestBody;

  // Calculate estimated total yield
  let estimated_total_yield = tree_count * potential_yield_per_tree;

  // Check if any 'Pre-Harvest' stages have wind_speed_kmh over 40, and apply reduction
  growing_season_data.forEach((data: any) => {
    if (data.stage === 'Pre-Harvest' && data.wind_speed_kmh && data.wind_speed_kmh > 40) {
      // Apply a random reduction for this day
      const reductionPercentage = getRandomReductionPercentage();
      const reductionAmount = (reductionPercentage / 100) * estimated_total_yield;
      estimated_total_yield -= reductionAmount;
    }
  });

  // Round the estimated total yield to the nearest whole number
  estimated_total_yield = Math.round(estimated_total_yield);

  // Send the result as a response, including growing_season_data
  res.json({
    estimated_total_yield
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
