import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello world');
});

app.post('/simulate-yield', (req, res) => {
  const { tree_count, potential_yield_per_tree } = req.body;

  const estimated_total_yield = Number(tree_count) * Number(potential_yield_per_tree);

  res.json({
    estimated_total_yield
  });
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
