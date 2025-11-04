// src/routers/reminderRouter.js
const express = require('express');
const router = express.Router();
const { identifier } = require('../middlewares/identification');
const reminderController = require('../controllers/reminderController');

// Add a medication with its schedule
router.post('/add', identifier, reminderController.addMedication);

// List all medications for the logged-in user
router.get('/list', identifier, reminderController.getMedications);

// Update a single reminder time’s status (Taken / Remind Later / Skipped / Pending)
router.patch('/update-status', identifier, reminderController.updateReminderStatus);

module.exports = router;


// src/controllers/reminderController.js (add below addMedication)
exports.getMedications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const meds = await Medication.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: 'Medications fetched successfully',
      data: meds,
    });
  } catch (error) {
    console.error('getMedications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
