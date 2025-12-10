require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB (but don't crash if it fails)
let mongoConnected = false;

(async () => {
  mongoConnected = await connectDB();
  console.log(`📡 MongoDB Status: ${mongoConnected ? '✅ Connected' : '⚠️ Not Connected'}`);
})();

// Routes
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);

// Health check - show MongoDB status
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    server: 'Running',
    mongodb: dbStatus,
    environment: process.env.NODE_ENV,
    frontend: process.env.FRONTEND_URL
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '🚀 Backend is working!',
    timestamp: new Date(),
    mongodb: mongoConnected ? 'Connected' : 'Not Connected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎯 SaaSuno Backend API',
    status: 'Live',
    endpoints: {
      root: '/',
      health: '/api/health',
      test: '/api/test',
      contactForm: 'POST /api/contacts',
      getContacts: 'GET /api/contacts',
      admin: {
        getContacts: 'GET /api/admin/contacts',
        statistics: 'GET /api/admin/statistics'
      }
    },
    mongodb: mongoConnected ? '✅ Connected' : '⚠️ Not Connected'
  });
});

// Start server (even if MongoDB fails!)
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 SERVER STARTED on port ${PORT}`);
  console.log(`🌐 URL: https://saasuno-backend.onrender.com`);
  console.log(`🔗 Health: https://saasuno-backend.onrender.com/api/health`);
  console.log(`📡 MongoDB: ${mongoConnected ? '✅ Connected' : '⚠️ Not Connected'}`);
  console.log('='.repeat(50));
});