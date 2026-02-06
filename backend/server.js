const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security: HTTP headers
app.use(helmet());

// Request logging
app.use(morgan('combined'));

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Strict rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login/signup requests per 15 min
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Test route
app.get('/', (req, res) => {
  res.send(`Backend is running on port ${PORT}`);
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/attendance', require('./src/routes/attendanceRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/leaves', require('./src/routes/leaveRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/leave-balances', require('./src/routes/leaveBalanceRoutes'));

// Initialize Cron Jobs
const { initCronJobs } = require('./src/services/cronService');
initCronJobs();

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
