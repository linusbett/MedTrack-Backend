const mongoose = require('mongoose');

const reminderEntrySchema = new mongoose.Schema({
    time: { type: String, required: true }, // "08:00"
    status: {
        type: String,
        enum: ['Pending', 'Taken', 'Remind Later', 'Skipped'],
        default: 'Pending',
    },
    updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const medicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true }, // e.g. "500mg", "2 tabs"

    // List of times per day (e.g., ["08:00", "20:00"])
    schedule: {
        type: [String], // e.g. ["08:00", "14:00", "20:00"]
        validate: [(arr) => arr.length > 0, 'Schedule must have at least one time'],
        required: true,
    },

    // 📜 History of all changes (for audit/tracking)
    history: {
        type: [{
            time: String,
            status: String,
            at: { type: Date, default: Date.now },
        }, ],
        default: [],
    },
}, { timestamps: true });

module.exports = mongoose.model('Medication', medicationSchema);
