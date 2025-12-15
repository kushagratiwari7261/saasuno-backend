const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Add logging middleware for debugging
router.use((req, res, next) => {
  console.log(`[ADMIN API] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Simple check - you can add proper authentication later
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN || 'SaasUno@2025'}`) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Admin access required.'
    });
  }
  next();
};

// Get all contacts with filtering (Admin only)
router.get('/contacts', authenticateAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by status
    if (status && ['pending', 'contacted', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    // Search by name, email, or company
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Contact.countDocuments(query);
    
    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// ✅ ADDED: Update contact (Admin only) - General PATCH endpoint
// This fixes the 404 error - frontend is calling PATCH /api/admin/contacts/:id
router.patch('/contacts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`Updating contact ${id} with:`, updates);
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID format'
      });
    }
    
    // Find contact first to ensure it exists
    const existingContact = await Contact.findById(id);
    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // Update contact
    const contact = await Contact.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: contact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Update contact error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Update contact status (Admin only) - Specific endpoint for status only
router.patch('/contacts/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'contacted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, contacted, rejected)'
      });
    }
    
    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      data: contact,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Get statistics (Admin only)
router.get('/statistics', authenticateAdmin, async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const pendingContacts = await Contact.countDocuments({ status: 'pending' });
    const contactedContacts = await Contact.countDocuments({ status: 'contacted' });
    const rejectedContacts = await Contact.countDocuments({ status: 'rejected' });
    
    // Get contacts per day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await Contact.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalContacts,
        pending: pendingContacts,
        contacted: contactedContacts,
        rejected: rejectedContacts,
        dailyStats
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Delete contact (Admin only)
router.delete('/contacts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findByIdAndDelete(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;