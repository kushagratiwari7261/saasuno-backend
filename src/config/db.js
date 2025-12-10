const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Log the URI (hide password for security)
    const uri = process.env.MONGODB_URI;
    const safeUri = uri ? uri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@') : 'Not set';
    console.log('📡 URI:', safeUri);
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB Connected Successfully');
    console.log('🏢 Database:', mongoose.connection.db.databaseName);
    console.log('📊 Collections:', (await mongoose.connection.db.collections()).map(c => c.collectionName));
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    console.error('💡 Check:');
    console.error('1. MongoDB Atlas cluster is running');
    console.error('2. IP is whitelisted (0.0.0.0/0 for all)');
    console.error('3. Username/password is correct');
    console.error('4. Network connection is stable');
    process.exit(1);
  }
};

module.exports = connectDB;