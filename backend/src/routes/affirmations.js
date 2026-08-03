import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachActiveDream } from '../middleware/dream.js';
import { uploadAudio } from '../middleware/upload.js';
import {
  listAffirmations,
  addAffirmation,
  toggleActive,
  deleteAffirmation,
  todayAffirmation,
  uploadVoice,
} from '../controllers/affirmationsController.js';

const router = Router();

router.use(requireAuth);
router.use(attachActiveDream);

router.get('/', listAffirmations);
router.get('/today', todayAffirmation);
router.post('/', addAffirmation);
router.post('/:id/voice', uploadAudio.single('audio'), uploadVoice);
router.patch('/:id/toggle', toggleActive);
router.delete('/:id', deleteAffirmation);

export default router;
