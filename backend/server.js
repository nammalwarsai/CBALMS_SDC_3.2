const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./src/middleware/errorHandler');
const requestId = require('./src/middleware/requestId');
const authRoutes = require('./src/routes/authRoutes');
const passwordRoutes = require('./src/routes/passwordRoutes');

dotenv.config();

// 3.4: Validate required environment variables at startup
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security: HTTP headers
app.use(helmet());

// Attach unique request ID to every request (CQ-10)
app.use(requestId);

// Request logging with request ID correlation
morgan.token('request-id', (req) => req.requestId);
app.use(morgan(':request-id :method :url :status :response-time ms'));

// 3.7: CORS with multi-origin support for production
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// 3.6: Reduced body limit (was 50mb, reduced to 10mb)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
app.use('/api/auth', authLimiter, passwordRoutes);
app.use('/api/attendance', require('./src/routes/attendanceRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/leaves', require('./src/routes/leaveRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/leave-balances', require('./src/routes/leaveBalanceRoutes'));
app.use('/api/holidays', require('./src/routes/holidayRoutes'));

// Initialize Cron Jobs
const { initCronJobs } = require('./src/services/cronService');
initCronJobs();

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// Test Supabase connection on startup (non-blocking)
const { testConnection } = require('./src/config/supabaseClient');
testConnection();

// 3.8: Start server with graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  // Force shutdown after 10 seconds if connections don't close
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

