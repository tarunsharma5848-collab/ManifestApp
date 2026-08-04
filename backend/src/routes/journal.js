import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachActiveDream } from '../middleware/dream.js';
import { listEntries, addEntry, updateEntry, deleteEntry, getStreak } from '../controllers/journalController.js';

const router = Router();

router.use(requireAuth);
router.use(attachActiveDream);

router.get('/', listEntries);
router.get('/streak', getStreak);
router.post('/', addEntry);
router.patch('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router;
