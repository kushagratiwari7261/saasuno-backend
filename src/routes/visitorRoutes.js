// routes/visitorRoutes.js
const express = require('express');
const router = express.Router();

// In-memory store for visitor count
// You can replace this with MongoDB later if needed
let visitorCount = 1024;

// GET visitor count
router.get('/count', (req, res) => {
  try {
    console.log('📊 Visitor count requested');
    
    res.status(200).json({
      success: true,
      count: visitorCount,
      timestamp: new Date().toISOString(),
      message: 'Visitor count retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching visitor count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor count'
    });
  }
});

// POST increment visitor count
router.post('/increment', (req, res) => {
  try {
    visitorCount++;
    console.log(`📈 Visitor count incremented to: ${visitorCount}`);
    
    res.status(200).json({
      success: true,
      count: visitorCount,
      message: 'Visitor count incremented successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error incrementing visitor count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to increment visitor count'
    });
  }
});

// Reset visitor count (optional, for admin use)
router.post('/reset', (req, res) => {
  try {
    const { newCount = 1024 } = req.body;
    visitorCount = parseInt(newCount);
    
    console.log(`🔄 Visitor count reset to: ${visitorCount}`);
    
    res.status(200).json({
      success: true,
      count: visitorCount,
      message: 'Visitor count reset successfully',
      timestamp: new Date().toISOString()
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
