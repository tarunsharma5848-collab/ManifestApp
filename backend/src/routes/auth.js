import { Router } from 'express';
import { requestOtp, verifyOtp, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', requireAuth, getMe);

export default router;
