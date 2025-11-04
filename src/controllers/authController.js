const jwt = require('jsonwebtoken');
const {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  changePasswordSchema,
  acceptFPCodeSchema,
} = require('../middlewares/validator');
const User = require('../models/usersModel');
const { doHash, doHashValidation, hmacProcess } = require('../utils/hashing');
const transport = require('../middlewares/sendMail');

// ======================================
// SIGNUP
// ======================================
exports.signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { error } = signupSchema.validate({ email, password });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(401)
        .json({ success: false, message: 'User already exists!' });
    }

    const hashedPassword = await doHash(password, 12);
    const newUser = new User({ email, password: hashedPassword });
    const result = await newUser.save();
    result.password = undefined;

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        userId: result._id,
        email: result.email,
        verified: result.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: '24h' }
    );

    // ✅ Return token with user data
    res.status(201).json({
      success: true,
      message: 'Your account has been created successfully',
      token,
      user: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ======================================
// SIGNIN
// ======================================
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { error } = signinSchema.validate({ email, password });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select('+password');
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: 'User does not exist!' });
    }

    const valid = await doHashValidation(password, existingUser.password);
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials!' });
    }

    // ✅ Generate token on signin
    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: '8h' }
    );

    res
      .cookie('Authorization', 'Bearer ' + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
      })
      .json({
        success: true,
        message: 'Logged in successfully',
        token,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ======================================
// SIGNOUT
// ======================================
exports.signout = async (req, res) => {
  res.clearCookie('Authorization');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ======================================
// SEND VERIFICATION CODE
// ======================================
exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser)
      return res
        .status(404)
        .json({ success: false, message: 'User does not exist!' });

    if (existingUser.verified)
      return res
        .status(400)
        .json({ success: false, message: 'You are already verified!' });

    const codeValue = Math.floor(Math.random() * 1000000).toString();
    const info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: 'Verification Code',
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();

      return res.status(200).json({ success: true, message: 'Code sent!' });
    }

    res.status(400).json({ success: false, message: 'Code send failed!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ======================================
// VERIFY VERIFICATION CODE
// ======================================
exports.verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;

  try {
    const { error } = acceptCodeSchema.validate({ email, providedCode });
    if (error)
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });

    const existingUser = await User.findOne({ email }).select(
      '+verificationCode +verificationCodeValidation'
    );

    if (!existingUser)
      return res
        .status(401)
        .json({ success: false, message: 'User does not exist!' });

    if (existingUser.verified)
      return res
        .status(400)
        .json({ success: false, message: 'You are already verified!' });

    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    )
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or missing code!' });

    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000)
      return res
        .status(400)
        .json({ success: false, message: 'Code has expired!' });

    const hashedCodeValue = hmacProcess(
      providedCode.toString(),
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res
        .status(200)
        .json({ success: true, message: 'Account verified successfully!' });
    }

    res
      .status(400)
      .json({ success: false, message: 'Verification failed. Incorrect code.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ======================================
// CHANGE PASSWORD
// ======================================
exports.changePassword = async (req, res) => {
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
    if (error)
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });

    if (!verified)
      return res
        .status(401)
        .json({ success: false, message: 'You are not a verified user!' });

    const existingUser = await User.findOne({ _id: userId }).select('+password');
    if (!existingUser)
      return res
        .status(401)
        .json({ success: false, message: 'User does not exist!' });

    const valid = await doHashValidation(oldPassword, existingUser.password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, message: 'Invalid old password!' });

    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();

    res.status(200).json({ success: true, message: 'Password updated!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ======================================
// SEND FORGOT PASSWORD CODE
// ======================================
exports.sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser)
      return res
        .status(404)
        .json({ success: false, message: 'User does not exist!' });

    const codeValue = Math.floor(Math.random() * 1000000).toString();
    const info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: 'Forgot Password Code',
      html: `<h1>${codeValue}</h1>`,
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({ success: true, message: 'Code sent!' });
    }

    res.status(400).json({ success: false, message: 'Failed to send code!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ======================================
// VERIFY FORGOT PASSWORD CODE
// ======================================
exports.verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;

  try {
    const { error } = acceptFPCodeSchema.validate({
      email,
      providedCode,
      newPassword,
    });
    if (error)
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });

    const existingUser = await User.findOne({ email }).select(
      '+forgotPasswordCode +forgotPasswordCodeValidation'
    );

    if (!existingUser)
      return res
        .status(401)
        .json({ success: false, message: 'User does not exist!' });

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    )
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or missing code!' });

    if (Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000)
      return res
        .status(400)
        .json({ success: false, message: 'Code has expired!' });

    const hashedCodeValue = hmacProcess(
      providedCode.toString(),
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      const hashedPassword = await doHash(newPassword, 12);
      existingUser.password = hashedPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();

      return res
        .status(200)
        .json({ success: true, message: 'Password updated!' });
    }

    res.status(400).json({
      success: false,
      message: 'Incorrect verification code!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateFcmToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ success: false, message: 'Missing userId or fcmToken' });
    }

    const user = await User.findByIdAndUpdate(userId, { fcmToken }, { new: true });
    res.json({ success: true, message: 'Token updated', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
