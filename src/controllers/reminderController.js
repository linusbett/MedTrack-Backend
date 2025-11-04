// src/controllers/reminderController.js
const Medication = require('../models/Medication');

// ✅ Extracts the user ID safely from the JWT payload
const getUserIdFromToken = (req) => {
  // Our token contains userId (not _id)
  return req?.user?.userId || req?.user?.id || req?.user?._id;
};

// ------------------------------------------------------------
// POST /api/reminder/add
// ------------------------------------------------------------
exports.addMedication = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, dosage, schedule } = req.body;

    // Validate request body
    if (!name || !dosage || !Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'name, dosage, and schedule[] are required',
      });
    }

    // Create reminders with default "Pending" status
    const reminders = schedule.map((t) => ({
      time: t,
      status: 'Pending',
      createdAt: new Date(),
    }));

    const medication = await Medication.create({
      userId,
      name,
      dosage,
      schedule,
      reminders,
    });

    return res.status(201).json({
      success: true,
      message: 'Medication added successfully',
      data: medication,
    });
  } catch (error) {
    console.error('addMedication error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ------------------------------------------------------------
// GET /api/reminder/list
// ------------------------------------------------------------
exports.getMedications = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const meds = await Medication.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: 'Medications fetched successfully',
      data: meds,
    });
  } catch (error) {
    console.error('getMedications error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ------------------------------------------------------------
// PATCH /api/reminder/update-status
// body: { medicationId, time, status: "Taken"|"Remind Later"|"Skipped" }
// ------------------------------------------------------------
exports.updateReminderStatus = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { medicationId, time, status } = req.body;
    const allowed = ['Taken', 'Remind Later', 'Skipped', 'Pending'];

    if (!medicationId || !time || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'medicationId, time, and valid status are required',
      });
    }

    const med = await Medication.findOneAndUpdate(
      { _id: medicationId, userId, 'reminders.time': time },
      {
        $set: {
          'reminders.$.status': status,
          'reminders.$.updatedAt': new Date(),
        },
        $push: {
          history: { time, status, at: new Date() },
        },
      },
      { new: true }
    );

    if (!med) {
      return res.status(404).json({
        success: false,
        message: 'Medication or reminder time not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reminder status updated',
      data: med,
    });
  } catch (error) {
    console.error('updateReminderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
