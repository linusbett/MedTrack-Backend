const mongoose = require('mongoose');

// 🔹 Reminder sub-schema (now includes `date` + `time`)
const reminderEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // e.g. "2025-11-10"
    time: { type: String, required: true }, // e.g. "08:00"
    status: {
      type: String,
      enum: ['Pending', 'Taken', 'Remind Later', 'Skipped'],
      default: 'Pending',
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// 🔹 Medication main schema
const medicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true }, // e.g. "500mg", "2 tabs"

    // List of times per day (e.g., ["08:00", "20:00"])
    schedule: {
      type: [String],
      required: true,
      validate: [(arr) => arr.length > 0, 'Schedule must contain at least one time'],
    },

    // 🕒 30-Day reminders (each includes both date and time)
    reminders: {
      type: [reminderEntrySchema],
      default: [],
    },

    // 📜 History of all changes (for audit/tracking)
    history: {
      type: [
        {
          date: { type: String },
          time: { type: String },
          status: { type: String },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Optional index for performance (filter by user or date)
medicationSchema.index({ userId: 1 });
medicationSchema.index({ 'reminders.date': 1 });

module.exports = mongoose.model('Medication', medicationSchema);
