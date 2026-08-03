import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { addSign, listSigns, goalStreak } from '../controllers/dailySignController.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', listSigns);
router.get('/streak', goalStreak);
router.post('/', upload.single('image'), addSign);

export default router;
