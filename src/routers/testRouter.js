const express = require('express');
const { sendPush } = require('../services/fcmService');
const router = express.Router();

// test notification route
router.post('/push', async (req, res) => {
  try {
    const { token, title, body } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'FCM token required' });

    await sendPush(token, title || 'Test Push', body || 'This is a MedTrack test notification');
    res.status(200).json({ success: true, message: 'Notification sent!' });
  } catch (error) {
    console.error('❌ Push test failed:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send push' });
  }
});

module.exports = router;
