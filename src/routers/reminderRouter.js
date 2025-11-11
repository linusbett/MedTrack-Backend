// src/routers/reminderRouter.js
const express = require('express');
const router = express.Router();
const { identifier } = require('../middlewares/identification');
const reminderController = require('../controllers/reminderController');

//Add a medication with its schedule
router.post('/add', identifier, reminderController.addMedication);

//List all medications for the logged-in user
router.get('/list', identifier, reminderController.getMedications);

//Get reminders for today
router.get('/today', identifier, reminderController.getTodayReminders);

//Get reminder history (last 7 days, Taken/Skipped)
router.get('/history', identifier, reminderController.getReminderHistory);

//Update reminder status (Taken / Remind Later / Skipped / Pending)
router.patch('/update-status', identifier, reminderController.updateReminderStatus);

//Delete a medication by ID
router.delete('/delete/:id', identifier, reminderController.deleteMedication);

module.exports = router;
