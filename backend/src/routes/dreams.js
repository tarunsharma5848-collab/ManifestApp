import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listDreams,
  getActiveDream,
  createDream,
  activateDream,
  checkDuplicate,
  deleteDream,
} from '../controllers/dreamsController.js';

const router = Router();

router.use(requireAuth);

router.get('/', listDreams);
router.get('/active', getActiveDream);
router.get('/check-duplicate', checkDuplicate);
router.post('/', createDream);
router.patch('/:id/activate', activateDream);
router.delete('/:id', deleteDream);

export default router;
