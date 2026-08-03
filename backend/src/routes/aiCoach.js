import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachActiveDream } from '../middleware/dream.js';
import { getHistory, sendMessage, clearHistory } from '../controllers/aiCoachController.js';

const router = Router();

router.use(requireAuth);
router.use(attachActiveDream);
router.get('/', getHistory);
router.post('/', sendMessage);
router.delete('/', clearHistory);

export default router;
