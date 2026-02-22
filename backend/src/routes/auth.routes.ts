import { Router } from 'express';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateUserRole,
} from '../controllers/auth.controller';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from '../validators/auth.validator';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { loginLimiter, registerLimiter, resetPasswordLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/register', registerLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', resetPasswordLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/me', authenticate, getMe);
router.patch('/role', authenticate, authorize('ADMIN'), updateUserRole);

export default router;
