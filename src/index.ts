import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello world');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
