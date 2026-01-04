// routes/visitorRoutes.js - MONGODB VERSION
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define Visitor schema directly (no separate model file needed)
const visitorSchema = new mongoose.Schema({
  identifier: {
    type: String,
    default: 'global_visitor_count',
    unique: true
  },
  count: {
    type: Number,
    default: 1024,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Use existing connection, don't create new model file
const Visitor = mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);

// GET visitor count
router.get('/count', async (req, res) => {
  try {
    console.log('📊 Fetching visitor count from MongoDB');
    
    let visitor = await Visitor.findOne({ identifier: 'global_visitor_count' });
    
    // If no record exists, create one
    if (!visitor) {
      console.log('👤 Creating initial visitor record in MongoDB');
      visitor = await Visitor.create({
        identifier: 'global_visitor_count',
        count: 1024
      });
    }
    
    console.log(`✅ Visitor count from DB: ${visitor.count}`);
    
    res.status(200).json({
      success: true,
      count: visitor.count,
      lastUpdated: visitor.lastUpdated,
      storedIn: 'MongoDB',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ MongoDB Error fetching visitor count:', error);
    
    // Fallback to in-memory if MongoDB fails
    res.status(200).json({
      success: true,
      count: 1024,
      storedIn: 'Memory (MongoDB failed)',
      timestamp: new Date().toISOString()
    });
  }
});

// POST increment visitor count
router.post('/increment', async (req, res) => {
  try {
    console.log('📈 Incrementing visitor count in MongoDB');
    
    let visitor = await Visitor.findOne({ identifier: 'global_visitor_count' });
    
    if (!visitor) {
      // Create first record
      visitor = await Visitor.create({
        identifier: 'global_visitor_count',
        count: 1
      });
    } else {
      // Increment count
      visitor.count += 1;
      visitor.lastUpdated = new Date();
      await visitor.save();
    }
    
    console.log(`✅ Visitor count updated in DB: ${visitor.count}`);
    
    res.status(200).json({
      success: true,
      count: visitor.count,
      lastUpdated: visitor.lastUpdated,
      storedIn: 'MongoDB',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ MongoDB Error incrementing visitor count:', error);
    
    // Fallback response
    res.status(200).json({
      success: true,
      count: 1024,
      storedIn: 'Memory (MongoDB failed)',
      timestamp: new Date().toISOString()
    });
  }
});

// GET stats
router.get('/stats', async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ identifier: 'global_visitor_count' });
    
    res.status(200).json({
      success: true,
      count: visitor ? visitor.count : 1024,
      lastUpdated: visitor ? visitor.lastUpdated : new Date(),
      totalRecords: await Visitor.countDocuments(),
      database: 'MongoDB'
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
