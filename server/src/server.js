import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', message: 'SkillTrack API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', requireAuth, taskRoutes);

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`SkillTrack API listening at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  });