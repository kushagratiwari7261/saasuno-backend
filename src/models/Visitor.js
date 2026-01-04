// models/Visitor.js
const mongoose = require('mongoose');

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
  dailyVisits: [
    {
      date: String, // Format: YYYY-MM-DD
      count: Number
    }
  ],
  lastIncrement: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Ensure dailyVisits array doesn't get too large
visitorSchema.methods.cleanupOldDailyVisits = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  this.dailyVisits = this.dailyVisits.filter(visit => {
    const visitDate = new Date(visit.date);
    return visitDate >= thirtyDaysAgo;
  });
};

module.exports = mongoose.model('Visitor', visitorSchema);
