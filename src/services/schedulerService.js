// src/services/schedulerService.js
const cron = require('node-cron');
const Medication = require('../models/Medication');
const User = require('../models/usersModel');
const { sendPush } = require('./fcmService');

// Helper to check if current time matches a reminder time (within a few minutes)
const isTimeMatch = (targetTime) => {
  const now = new Date();
  const [hour, minute] = targetTime.split(':').map(Number);
  return now.getHours() === hour && Math.abs(now.getMinutes() - minute) <= 2; // 2-min window
};

// 🚀 Start cron scheduler
exports.startReminderScheduler = () => {
  console.log('⏰ MedTrack Reminder Scheduler started...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      console.log(`🕒 Checking reminders at ${now.toLocaleTimeString()}`);

      // Fetch all medications
      const meds = await Medication.find();

      for (const med of meds) {
        for (const reminder of med.reminders) {
          if (reminder.status === 'Pending' && isTimeMatch(reminder.time)) {
            // Find user and check if they have an FCM token
            const user = await User.findById(med.userId);
            if (user && user.fcmToken) {
              await sendPush(
                user.fcmToken,
                `💊 ${med.name} Reminder`,
                `It's time to take your ${med.dosage} dose scheduled for ${reminder.time}`
              );
              console.log(`✅ Sent reminder to ${user.email} for ${med.name} at ${reminder.time}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Scheduler error:', err.message);
    }
  });
};
