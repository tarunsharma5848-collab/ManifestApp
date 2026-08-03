import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachActiveDream } from '../middleware/dream.js';
import { getUniverse } from '../controllers/universeController.js';

const router = Router();

router.use(requireAuth);
router.use(attachActiveDream);
router.get('/', getUniverse);

export default router;
