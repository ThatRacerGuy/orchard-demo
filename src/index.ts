import express from 'express';
import dotenv from 'dotenv';

import { validateSimulateYieldRequest } from './validation';
// import { calculateEstimatedYield } from './services/yieldCalculator';
import { GrowingSeasonData } from './types'; // Adjust path based on your project structure
import {
  applyBloomFrostReduction,
  applyBloomTemperatureReduction,
  applyBloomRainReduction,
  applyBloomWindReduction,
  applyFruitSetHeatReduction,
  applyFruitSetHotDryReduction,
  applyHeatStressReduction,
  applyDroughtReduction,
  applyPreHarvestWindReduction
} from './services/yieldCalculator';
import { SimulationResult } from './models/SimulationResult'; // Adjust path as needed
import { connectToDatabase } from './db';

dotenv.config();
connectToDatabase();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('POST endpoint: /simulate-yield');
});

// Define the POST route with correct typing for the request body
app.post('/simulate-yield', async (req, res) => {
  const requestBody = req.body;

  // Use the imported validation function
  if (!validateSimulateYieldRequest(requestBody)) {
    res.status(400).json({ error: 'Invalid request body structure' });
  }

  const { tree_count, potential_yield_per_tree, growing_season_data } = requestBody;

  // Calculate the base estimated yield
  let yieldEstimate = tree_count * potential_yield_per_tree;
  
  // Create an array to hold all the events and reductions
  const events: { event: string, reductionPercent: number }[] = [];

  // Apply each reduction function and capture any events
  const reductionFunctions = [
    applyBloomFrostReduction,
    applyBloomTemperatureReduction,
    applyBloomRainReduction,
    applyBloomWindReduction,
    applyFruitSetHeatReduction,
    applyFruitSetHotDryReduction,
    applyHeatStressReduction,
    applyDroughtReduction,
    applyPreHarvestWindReduction,
  ];

  for (const reductionFunc of reductionFunctions) {
    const result = reductionFunc(yieldEstimate, growing_season_data);
    yieldEstimate = result.yield;

    if (result.event) {
      events.push({
        event: result.event,
        reductionPercent: result.percent || 0
      });
    }
  }

  // Round the yield to make sure it's a clean number
  yieldEstimate = Math.round(yieldEstimate) > 0 ? Math.round(yieldEstimate) : 0;

  // Send the result as a response
  const response = {
    estimated_total_yield: yieldEstimate,
    events // Add the calculated events
  };

  // Save the result to the MongoDB database
  const result = new SimulationResult({
    tree_count,
    potential_yield_per_tree,
    estimated_total_yield: yieldEstimate,
    growing_season_data,
    events
  });

  await result.save();

  // Send the response back to the client
  res.json(response);
});

// Define a GET route for all simulation results added via cURL
app.get('/results', async (_req, res) => {
  const results = await SimulationResult.find().sort({ createdAt: -1 }).limit(10);
  res.json(results);
});

// Define a GET route for historical simulation calculations
app.get('/historical-risk-analysis', async (_req, res) => {
  try {
    const results = await SimulationResult.find({}, 'estimated_total_yield tree_count potential_yield_per_tree');

    const totalSimulations = results.length;

    if (totalSimulations === 0) {
      res.status(200).json({
        total_simulations: 0,
        average_estimated_yield: 0,
        average_potential_yield: 0
      });
    }

    const totalEstimatedYield = results.reduce(
      (sum, doc) => sum + doc.estimated_total_yield,
      0
    );

    const totalPotentialYield = results.reduce(
      (sum, doc) => sum + (doc.tree_count * doc.potential_yield_per_tree),
      0
    );

    const averageEstimatedYield = totalEstimatedYield / totalSimulations;
    const averagePotentialYield = totalPotentialYield / totalSimulations;

    res.json({
      total_simulations: totalSimulations,
      average_estimated_yield: averageEstimatedYield,
      average_potential_yield: averagePotentialYield,
      overall_average_yield_as_percent_of_potential: Math.round((averageEstimatedYield / averagePotentialYield) * 100)
    });
  } catch (error) {
    console.error('Error fetching historical risk analysis:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
