import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import visionBoardRoutes from './routes/visionBoard.js';
import affirmationsRoutes from './routes/affirmations.js';
import journalRoutes from './routes/journal.js';
import goalsRoutes from './routes/goals.js';
import dailySignsRoutes from './routes/dailySigns.js';
import gamificationRoutes from './routes/gamification.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://192.168.18.242:5173/', // apna actual network IP daalo yahan
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/vision-board', visionBoardRoutes);
app.use('/api/affirmations', affirmationsRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/goals/:goalId/signs', dailySignsRoutes);
app.use('/api/gamification', gamificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Manifest backend running on port ${PORT}`));