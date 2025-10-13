const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');


require("dotenv").config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'CHATBASE_API_KEY', 'CHATBASE_BOT_ID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('💡 Please check your .env file or copy env-template.txt to .env and fill in the values');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => {
      console.warn(
        "⚠️ MongoDB connection failed, continuing without database:",
        err.message
      );
      console.log(
        "💡 To enable database features, check your internet connection and reconnect to the internet"
      );
    });
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));

// Configure CORS to accept multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://maternalhub.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

// Rate limiting
const { generalLimiter, authLimiter, chatLimiter } = require('./middleware/rateLimiter');
app.use(generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");
const chatRoutes = require("./routes/chat");
const adminRoutes = require("./routes/admin");
const pregnancyRoutes = require("./routes/pregnancy");
const appointmentRoutes = require("./routes/appointments");
const { HOSPITALS_DATA } = require('./data/hospitals');
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", healthRoutes);
app.use("/api/chat", chatLimiter, chatRoutes);
app.use("/api/admin", authLimiter, adminRoutes);
app.use("/api/pregnancy", pregnancyRoutes);
app.use("/api/appointments", authLimiter, appointmentRoutes);

// Add slots endpoint without auth (for fetching available slots)
app.get("/api/appointments/slots/:centerId/:date", (req, res) => {
  const { centerId, date } = req.params;

  // Check if the center exists
  const center = HOSPITALS_DATA.find(h => h.id.toString() === centerId.toString());
  if (!center) {
    return res.status(404).json({ error: 'Health center not found' });
  }

  // Generate available slots (mock data - in production, check existing appointments)
  const slots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  ];

  res.json({
    slots,
    centerId,
    date,
    centerName: center.name,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Maternal Health API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Error handling middleware
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');

// 404 handler
app.use("*", notFound);

// Global error handler
app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Maternal Health API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'https://maternalhub.vercel.app'}`);
  
  // Start keep-alive service in production to prevent Render from sleeping
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    const { startKeepAlive } = require('./utils/keepAlive');
    startKeepAlive('https://maternal-server.onrender.com');
  }
});

module.exports = app;
