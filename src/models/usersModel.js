const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // 🔔 FCM Token for push notifications
    fcmToken: {
      type: String,
      default: null,
    },

    // 📧 User Email
    email: {
      type: String,
      required: [true, 'Email is required!'],
      trim: true,
      unique: [true, 'Email must be unique!'], // this already creates an index
      minLength: [5, 'Email must have at least 5 characters!'],
      lowercase: true,
    },

    // 🔐 User Password
    password: {
      type: String,
      required: [true, 'Password must be provided!'],
      trim: true,
      select: false,
    },

    // ✅ Account Verification
    verified: {
      type: Boolean,
      default: false,
    },

    verificationCode: {
      type: String,
      select: false,
    },

    verificationCodeValidation: {
      type: Number,
      select: false,
    },

    // 🔁 Forgot Password Handling
    forgotPasswordCode: {
      type: String,
      select: false,
    },

    forgotPasswordCodeValidation: {
      type: Number,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ⚡ Removed duplicate index definition

module.exports = mongoose.model('User', userSchema);
