const Medication = require('../models/Medication');

// 🔐 Helper: safely extract user ID from JWT middleware
const getUserIdFromToken = (req) => {
  return req?.user?.userId || req?.user?.id || req?.user?._id;
};

// 🧩 Helper: generate reminders for 30 days × all scheduled times
const generate30DayReminders = (schedule) => {
  const reminders = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const date = d.toISOString().split('T')[0]; // YYYY-MM-DD

    for (const time of schedule) {
      reminders.push({
        date,
        time,
        status: 'Pending',
        updatedAt: new Date(),
      });
    }
  }

  return reminders;
};

// ------------------------------------------------------------
// POST /api/reminder/add
// Body: { name, dosage, schedule: ["08:00", "20:00"] }
// ------------------------------------------------------------
exports.addMedication = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, dosage, schedule } = req.body;
    if (!name || !dosage || !Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'name, dosage, and schedule[] are required',
      });
    }

    const reminders = generate30DayReminders(schedule);

    const medication = await Medication.create({
      userId,
      name,
      dosage,
      schedule,
      reminders,
    });

    res.status(201).json({
      success: true,
      message: 'Medication added successfully (30-day reminders created)',
      data: medication,
    });
  } catch (error) {
    console.error('❌ addMedication error:', error);
    res.status(500).json({ success: false, message: 'Server error while adding medication' });
  }
};

// ------------------------------------------------------------
// GET /api/reminder/list
// ------------------------------------------------------------
exports.getMedications = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const meds = await Medication.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: 'Medications fetched successfully',
      count: meds.length,
      data: meds,
    });
  } catch (error) {
    console.error('❌ getMedications error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching medications' });
  }
};

// ------------------------------------------------------------
// PATCH /api/reminder/update-status
// Body: { medicationId, date, time, status }
// ------------------------------------------------------------
exports.updateReminderStatus = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { medicationId, date, time, status } = req.body;
    const allowed = ['Taken', 'Remind Later', 'Skipped', 'Pending'];

    if (!medicationId || !date || !time || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'medicationId, date, time, and valid status are required',
      });
    }

    const med = await Medication.findOneAndUpdate(
      { _id: medicationId, userId, 'reminders.date': date, 'reminders.time': time },
      {
        $set: {
          'reminders.$.status': status,
          'reminders.$.updatedAt': new Date(),
        },
        $push: {
          history: { date, time, status, at: new Date() },
        },
      },
      { new: true }
    );

    if (!med) {
      return res.status(404).json({
        success: false,
        message: 'Medication or reminder entry not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Reminder status updated to "${status}"`,
      data: med,
    });
  } catch (error) {
    console.error('❌ updateReminderStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating reminder' });
  }
};

// ------------------------------------------------------------
// DELETE /api/reminder/delete/:id
// ------------------------------------------------------------
exports.deleteMedication = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { id } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const deletedMed = await Medication.findOneAndDelete({ _id: id, userId });

    if (!deletedMed) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Medication deleted successfully',
    });
  } catch (error) {
    console.error('❌ deleteMedication error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting medication' });
  }
};
