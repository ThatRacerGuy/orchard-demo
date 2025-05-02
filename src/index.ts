import express from 'express';
import dotenv from 'dotenv';

import { validateSimulateYieldRequest } from './validation';
import { calculateEstimatedYield } from './services/yieldCalculator';
import { SimulationResult } from './models/SimulationResult';
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

  // Calculate estimated total yield
  const estimated_total_yield = calculateEstimatedYield(
    tree_count,
    potential_yield_per_tree,
    growing_season_data
  );

  // Send the result as a response, including growing_season_data
  res.json({
    estimated_total_yield
  });

  // Save the data to the MongoDB
  const result = new SimulationResult({
    tree_count: tree_count,
    potential_yield_per_tree: potential_yield_per_tree,
    estimated_total_yield: estimated_total_yield,
    growing_season_data: growing_season_data
  });
  await result.save();
});

// Define a GET route for all simulation results added via cURL
app.get('/results', async (_req, res) => {
  const results = await SimulationResult.find().sort({ createdAt: -1 }).limit(10);
  res.json(results);
});

// Define a GET route for historical simulation calculations
app.get('/historical-risk-analysis', async (_req, res) => {
  try {
    const results = await SimulationResult.find({}, 'estimated_total_yield');

    const totalSimulations = results.length;

    if (totalSimulations === 0) {
      res.status(200).json({
        total_simulations: 0,
        average_estimated_yield: 0
      });
    }

    const totalYield = results.reduce((sum, doc) => sum + doc.estimated_total_yield, 0);
    const averageYield = totalYield / totalSimulations;

    res.json({
      total_simulations: totalSimulations,
      average_estimated_yield: averageYield
    });
  } catch (error) {
    console.error('Error fetching historical risk analysis:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
