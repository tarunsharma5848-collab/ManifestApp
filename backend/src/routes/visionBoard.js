import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachActiveDream } from '../middleware/dream.js';
import { upload } from '../middleware/upload.js';
import { listItems, addItem, deleteItem } from '../controllers/visionBoardController.js';

const router = Router();

router.use(requireAuth);
router.use(attachActiveDream);

router.get('/', listItems);
router.post('/', upload.single('image'), addItem);
router.delete('/:id', deleteItem);

export default router;
