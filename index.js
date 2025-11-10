const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // ✅ import first

dotenv.config(); // ✅ load .env immediately

// ✅ Import Routers
const authRouter = require('./src/routers/authRouter');
const postsRouter = require('./src/routers/postsRouter');
const reminderRouter = require('./src/routers/reminderRouter');
const testRouter = require('./src/routers/testRouter');

// ✅ Import Reminder Scheduler (Step 5)
const { startReminderScheduler } = require('./src/services/schedulerService');

// ✅ Database Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Database connected'))
    .catch(err => console.error('❌ Database connection error:', err.message));

// ✅ Initialize Express
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/reminder', reminderRouter);
app.use('/api/test', testRouter);

// ✅ Default route
app.get('/', (req, res) => res.json({ message: 'Hello from the server' }));

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));