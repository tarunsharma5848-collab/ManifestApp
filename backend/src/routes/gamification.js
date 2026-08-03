import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMyStatus } from '../controllers/gamificationController.js';

const router = Router();

router.use(requireAuth);
router.get('/me', getMyStatus);

export default router;
