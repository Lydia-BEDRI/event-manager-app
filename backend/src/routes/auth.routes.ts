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
  updateProfile,
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
import { twoFactorLimiter } from '../middlewares/rateLimiter';
import {
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorStatus,
  regenerateBackupCodes,
  setupTwoFactor,
  verifyTwoFactorLogin,
} from '../controllers/twoFactor.controller';

const router = Router();

router.post('/register', registerLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', resetPasswordLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.post('/2fa/login/verify', twoFactorLimiter, verifyTwoFactorLogin);
router.get('/2fa/status', authenticate, getTwoFactorStatus);
router.post('/2fa/setup', authenticate, setupTwoFactor);
router.post('/2fa/enable', authenticate, twoFactorLimiter, enableTwoFactor);
router.post('/2fa/disable', authenticate, twoFactorLimiter, disableTwoFactor);
router.post('/2fa/backup-codes', authenticate, twoFactorLimiter, regenerateBackupCodes);
router.get('/me', authenticate, getMe);
router.patch('/role', authenticate, authorize('ADMIN'), updateUserRole);
router.patch('/profile', authenticate, updateProfile);

export default router;
