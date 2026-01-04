// routes/visitorRoutes.js
const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');

// GET visitor count
router.get('/count', async (req, res) => {
  try {
    console.log('📊 Fetching visitor count from MongoDB');
    
    let visitor = await Visitor.findOne({ identifier: 'global_visitor_count' });
    
    // If no record exists, create one
    if (!visitor) {
      console.log('👤 Creating initial visitor record');
      visitor = await Visitor.create({
        identifier: 'global_visitor_count',
        count: 1024
      });
    }
    
    console.log(`✅ Visitor count: ${visitor.count}`);
    
    res.status(200).json({
      success: true,
      count: visitor.count,
      lastUpdated: visitor.updatedAt,
      timestamp: new Date().toISOString(),
      message: 'Visitor count retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching visitor count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor count',
      message: error.message
    });
  }
});

// POST increment visitor count
router.post('/increment', async (req, res) => {
  try {
    console.log('📈 Incrementing visitor count');
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    let visitor = await Visitor.findOne({ identifier: 'global_visitor_count' });
    
    if (!visitor) {
      // Create first record
      visitor = await Visitor.create({
        identifier: 'global_visitor_count',
        count: 1,
        dailyVisits: [{ date: today, count: 1 }]
      });
    } else {
      // Increment count
      visitor.count += 1;
      visitor.lastIncrement = new Date();
      
      // Update daily visits
      const todayVisit = visitor.dailyVisits.find(v => v.date === today);
      if (todayVisit) {
        todayVisit.count += 1;
      } else {
        visitor.dailyVisits.push({ date: today, count: 1 });
      }
      
      // Clean up old daily visits
      visitor.cleanupOldDailyVisits();
      
      await visitor.save();
    }
    
    console.log(`✅ Visitor count updated to: ${visitor.count}`);
    
    res.status(200).json({
      success: true,
      count: visitor.count,
      lastUpdated: visitor.updatedAt,
      dailyCount: visitor.dailyVisits.find(v => v.date === today)?.count || 1,
      timestamp: new Date().toISOString(),
      message: 'Visitor count incremented successfully'
    });
  } catch (error) {
    console.error('❌ Error incrementing visitor count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to increment visitor count',
      message: error.message
    });
  }
});

// GET detailed stats (optional, for admin)
router.get('/stats', async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ identifier: 'global_visitor_count' });
    
    if (!visitor) {
      return res.status(200).json({
        success: true,
        count: 1024,
        dailyVisits: [],
        message: 'No visitor record found, using default'
      });
    }
    
    res.status(200).json({
      success: true,
      count: visitor.count,
      createdAt: visitor.createdAt,
      lastUpdated: visitor.updatedAt,
      lastIncrement: visitor.lastIncrement,
      dailyVisits: visitor.dailyVisits,
      totalDays: visitor.dailyVisits.length,
      averagePerDay: visitor.dailyVisits.length > 0 
        ? Math.round(visitor.count / visitor.dailyVisits.length)
        : visitor.count
    });
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor stats'
    });
  }
});

// Reset visitor count (optional, for admin use)
router.post('/reset', async (req, res) => {
  try {
    const { newCount = 1024, adminToken } = req.body;
    
    // Optional: Add admin authentication
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    let visitor = await Visitor.findOne({ identifier: 'global_visitor_count' });
    
    if (!visitor) {
      visitor = await Visitor.create({
        identifier: 'global_visitor_count',
        count: parseInt(newCount)
      });
    } else {
      visitor.count = parseInt(newCount);
      visitor.dailyVisits = [];
      await visitor.save();
    }
    
    console.log(`🔄 Visitor count reset to: ${visitor.count}`);
    
    res.status(200).json({
      success: true,
      count: visitor.count,
      message: 'Visitor count reset successfully'
    });
  } catch (error) {
    console.error('Error resetting visitor count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset visitor count'
    });
  }
});

module.exports = router;
