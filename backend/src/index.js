import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import dreamsRoutes from './routes/dreams.js';
import visionBoardRoutes from './routes/visionBoard.js';
import affirmationsRoutes from './routes/affirmations.js';
import journalRoutes from './routes/journal.js';
import goalsRoutes from './routes/goals.js';
import dailySignsRoutes from './routes/dailySigns.js';
import gamificationRoutes from './routes/gamification.js';
import dashboardRoutes from './routes/dashboard.js';
import rewardWheelRoutes from './routes/rewardWheel.js';
import aiCoachRoutes from './routes/aiCoach.js';
import universeRoutes from './routes/universe.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/dreams', dreamsRoutes);
app.use('/api/vision-board', visionBoardRoutes);
app.use('/api/affirmations', affirmationsRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/goals/:goalId/signs', dailySignsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reward-wheel', rewardWheelRoutes);
app.use('/api/ai-coach', aiCoachRoutes);
app.use('/api/universe', universeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Manifest backend running on port ${PORT}`));
