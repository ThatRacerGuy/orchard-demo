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
app.get('/historical-risk-analysis', async (_req, res) => {
  try {
    // Step 1: Retrieve all simulation results
    const simulations = await SimulationResult.find();

    const totalSimulations = simulations.length;

    if (totalSimulations === 0) {
      res.status(200).json({ message: "No simulations found." });
    }

    let totalEstimatedYield = 0;
    let totalPotentialYield = 0;
    let totalYieldReductionByEvent: { [key: string]: { totalReduction: number, count: number } } = {};

    // Step 2: Process each simulation and calculate the yield reduction for each event
    simulations.forEach((simulation) => {
      const { events, tree_count, potential_yield_per_tree, estimated_total_yield } = simulation;

      // Update total estimated yield and potential yield
      totalEstimatedYield += estimated_total_yield;
      totalPotentialYield += tree_count * potential_yield_per_tree;

      // If no events, skip this simulation
      if (!events || events.length === 0) return;

      // Calculate the yield reduction caused by each event
      events.forEach((event) => {
        const reductionAmount = (event.reductionPercent / 100) * estimated_total_yield;

        if (!totalYieldReductionByEvent[event.event]) {
          totalYieldReductionByEvent[event.event] = { totalReduction: 0, count: 0 };
        }

        totalYieldReductionByEvent[event.event].totalReduction += reductionAmount;
        totalYieldReductionByEvent[event.event].count += 1;
      });
    });

    // Step 3: Calculate average reduction per event
    let averageReductionByEvent = [];
    for (const eventName in totalYieldReductionByEvent) {
      const { totalReduction, count } = totalYieldReductionByEvent[eventName];
      const averageReduction = totalReduction / count;

      averageReductionByEvent.push({
        event: eventName,
        average_yield_reduction: averageReduction.toFixed(2),
        occurrence_count: count
      });
    }

    // Step 4: Sort events by average yield reduction, in descending order
    averageReductionByEvent = averageReductionByEvent.sort((a, b) => {
      // Convert average_yield_reduction to number for comparison
      return parseFloat(b.average_yield_reduction) - parseFloat(a.average_yield_reduction);
    });

    // Step 5: Calculate averages
    const averageEstimatedYield = totalEstimatedYield / totalSimulations;
    const averagePotentialYield = totalPotentialYield / totalSimulations;

    // Step 6: Send the response with the most impactful events
    res.json({
      total_simulations: totalSimulations,
      average_estimated_yield: averageEstimatedYield.toFixed(2),
      average_potential_yield: averagePotentialYield.toFixed(2),
      average_reduction_by_event: averageReductionByEvent.slice(0, 5), // Only show top 5 most impactful events
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching historical risk analysis' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
