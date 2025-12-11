require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Parse FRONTEND_URL as comma-separated list for multiple origins
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

console.log('🌐 Allowed CORS Origins:', allowedOrigins);
console.log('⚙️ Environment:', process.env.NODE_ENV);

// CORS configuration optimized for production and development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Development: Allowing CORS from: ${origin}`);
      return callback(null, true);
    }
    
    // In production, check against allowed list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    console.log(`🚫 CORS blocked in production: ${origin}`);
    console.log(`📋 Allowed origins: ${allowedOrigins.join(', ')}`);
    return callback(new Error(`CORS policy: Origin ${origin} is not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
let mongoConnected = false;

(async () => {
  try {
    mongoConnected = await connectDB();
    console.log(`📡 MongoDB Status: ${mongoConnected ? '✅ Connected' : '❌ Not Connected'}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    mongoConnected = false;
  }
})();

// Routes
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'Running',
    mongodb: {
      status: dbStatus,
      connected: mongoConnected
    },
    environment: process.env.NODE_ENV || 'development',
    cors: {
      enabled: true,
      allowed_origins: allowedOrigins
    },
    endpoints: {
      contact_form: 'POST /api/contacts',
      get_contacts: 'GET /api/contacts',
      admin: {
        get_contacts: 'GET /api/admin/contacts',
        update_contact: 'PATCH /api/admin/contacts/:id',
        delete_contact: 'DELETE /api/admin/contacts/:id'
      }
    }
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '🚀 Backend API is operational!',
    timestamp: new Date().toISOString(),
    mongodb: mongoConnected ? 'Connected ✅' : 'Not Connected ❌',
    cors: 'Enabled',
    request_origin: req.headers.origin || 'Not specified'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎯 SaaSuno Backend API',
    version: '1.0.0',
    status: 'Live',
    documentation: {
      health: 'GET /api/health',
      test: 'GET /api/test',
      contact_form: 'POST /api/contacts',
      admin_dashboard: 'GET /api/admin/contacts (requires auth)'
    },
    mongodb: mongoConnected ? '✅ Connected' : '⚠️ Not Connected (running in offline mode)',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.url} does not exist`,
    available_routes: {
      root: 'GET /',
      health: 'GET /api/health',
      test: 'GET /api/test',
      contact_form: 'POST /api/contacts',
      admin: 'GET /api/admin/* (protected)'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  
  // Handle CORS errors specifically
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Error',
      message: err.message,
      allowed_origins: allowedOrigins,
      your_origin: req.headers.origin || 'Not specified'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong on the server',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 SERVER STARTED`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 MongoDB: ${mongoConnected ? '✅ Connected' : '⚠️ Not Connected'}`);
  console.log(`🔐 Admin Token: ${process.env.ADMIN_TOKEN ? 'Set' : 'Not Set'}`);
  console.log('='.repeat(60));
  
  // Show CORS info
  console.log('\n🌐 CORS Configuration:');
  console.log(`   Mode: ${process.env.NODE_ENV === 'development' ? 'Development (All origins allowed)' : 'Production (Restricted origins)'}`);
  console.log(`   Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log('');
});