const express = require('express');
const authController = require('../controllers/authController');
const { identifier } = require('../middlewares/identification');
const router = express.Router();

// 🧩 Auth routes
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', identifier, authController.signout);

// 🧠 Verification routes
router.patch('/send-verification-code', identifier, authController.sendVerificationCode);
router.patch('/verify-verification-code', identifier, authController.verifyVerificationCode);
router.patch('/change-password', identifier, authController.changePassword);

// 🔁 Forgot password routes
router.patch('/send-forgot-password-code', authController.sendForgotPasswordCode);
router.patch('/verify-forgot-password-code', authController.verifyForgotPasswordCode);

// 💬 FCM Token Update (Step 4)
router.patch('/update-fcm-token', identifier, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const { fcmToken } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user ID found' });
    }

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    await User.findByIdAndUpdate(userId, { fcmToken });
    res.status(200).json({ success: true, message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('❌ FCM token update error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while updating token' });
  }
});

module.exports = router;