import 'dotenv/config';
import express from 'express';
import prisma from './lib/prisma';
import tasksRouter from './routes/tasks';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});

app.use('/api/tasks', tasksRouter);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
