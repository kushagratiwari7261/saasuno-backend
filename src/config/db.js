const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Try to connect but don't crash if it fails
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    
    console.log('✅ MongoDB Connected Successfully');
    return true;
    
  } catch (error) {
    console.error('⚠️ MongoDB Connection Failed:', error.message);
    console.log('🔄 Starting server WITHOUT MongoDB connection...');
    console.log('📝 Note: Form submissions will work but not save to database');
    console.log('💡 Fix: Check MONGODB_URI in Render environment variables');
    
    // Return false but DON'T exit the process
    return false;
  }
};

module.exports = connectDB;