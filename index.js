const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');  // ✅ import first

dotenv.config();                   // ✅ load .env immediately

const authRouter = require('./src/routers/authRouter');
const postsRouter = require('./src/routers/postRouter');
const reminderRouter = require('./src/routers/reminderRouter');


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection error:', err.message));

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);

// reminder api 
app.use('/api/reminder', reminderRouter);

app.get('/', (req, res) => res.json({ message: 'Hello from the server' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
