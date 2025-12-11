const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Create new contact
router.post('/', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      console.log('⚠️ MongoDB not connected, saving in demo mode');
      return res.status(200).json({
        success: true,
        message: '✅ Contact form submitted successfully!',
        note: 'Demo mode - MongoDB not connected. Set MONGODB_URI to save to database.',
        demoData: {
          name: req.body.name,
          email: req.body.email,
          company: req.body.company,
          timestamp: new Date()
        }
      });
    }
    
    const Contact = require('../models/Contact');
    const contact = await Contact.create(req.body);
    
    res.status(201).json({
      success: true,
      data: contact,
    
    });
    
  } catch (error) {
    console.error('Contact creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to save contact'
    });
  }
});

// Get all contacts (for admin)
router.get('/', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(200).json({
        success: true,
        message: 'Demo mode - MongoDB not connected',
        count: 0,
        data: [
          {
            _id: 'demo-1',
            name: 'Demo User',
            email: 'demo@example.com',
            company: 'Demo Company',
            message: 'This is demo data. Connect MongoDB to see real submissions.',
            createdAt: new Date(),
            status: 'pending',
            notes: ''
          }
        ]
      });
    }
    
    const Contact = require('../models/Contact');
    const contacts = await Contact.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// Get single contact
router.get('/:id', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(404).json({
        success: false,
        message: 'MongoDB not connected. Cannot fetch contact.'
      });
    }
    
    const Contact = require('../models/Contact');
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;