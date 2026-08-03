import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStatus, spin } from '../controllers/rewardWheelController.js';

const router = Router();

router.use(requireAuth);
router.get('/status', getStatus);
router.post('/spin', spin);

export default router;
