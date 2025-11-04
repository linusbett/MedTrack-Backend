const express = require('express');
const authController = require('../controllers/authController');
const { identifier } = require('../middlewares/identification'); // ✅ matches your file name
const router = express.Router();

// Auth routes
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', identifier, authController.signout);

// Verification routes
router.patch('/send-verification-code', identifier, authController.sendVerificationCode);
router.patch('/verify-verification-code', identifier, authController.verifyVerificationCode);
router.patch('/change-password', identifier, authController.changePassword);

// Forgot password routes
router.patch('/send-forgot-password-code', authController.sendForgotPasswordCode);
router.patch('/verify-forgot-password-code', authController.verifyForgotPasswordCode);
router.patch('/update-fcm-token', identifier, authController.updateFcmToken);

module.exports = router;
