import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachActiveDream } from '../middleware/dream.js';
import { listGoals, addGoal, toggleStatus, deleteGoal } from '../controllers/goalsController.js';

const router = Router();

router.use(requireAuth);
router.use(attachActiveDream);

router.get('/', listGoals);
router.post('/', addGoal);
router.patch('/:id/toggle', toggleStatus);
router.delete('/:id', deleteGoal);

export default router;
