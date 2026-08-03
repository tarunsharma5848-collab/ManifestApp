import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachActiveDream } from '../middleware/dream.js';
import { getStats } from '../controllers/dashboardController.js';

const router = Router();

router.use(requireAuth);
router.use(attachActiveDream);
router.get('/stats', getStats);

export default router;
