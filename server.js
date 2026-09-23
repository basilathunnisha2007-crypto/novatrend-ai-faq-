// server.js
// NovaTrend AI shopping assistant: Express + MongoDB REST API and the static
// frontend (homepage, login, role dashboards) in public/.

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

// Imported after dotenv so modules can read GEMINI_API_KEY / JWT_SECRET / MONGODB_URI
// at module scope.
const { connectDatabase } = await import('./config/db.js');
const { seedDatabase } = await import('./seed.js');
const { default: apiRoutes } = await import('./routes/index.js');

const app = express();
const publicDir = join(dirname(fileURLToPath(import.meta.url)), 'public');

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.use('/api', apiRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route.' }));

app.use((error, _req, res, _next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3000;

await connectDatabase();
await seedDatabase();

app.listen(PORT, () => {
  console.log(`NovaTrend AI Assistant running on http://localhost:${PORT}`);
});
