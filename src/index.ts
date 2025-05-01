import express from 'express';

import { validateSimulateYieldRequest } from './validation';

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
  const estimated_total_yield = tree_count * potential_yield_per_tree;

  // Send the result as a response, including growing_season_data
  res.json({
    estimated_total_yield
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
