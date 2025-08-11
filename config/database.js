const mongoose = require('mongoose');

const connectTODB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined. Please check your .env file.');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections in the pool
      serverSelectionTimeoutMS: 10000, // Increased timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      // Removed deprecated options: useNewUrlParser, useUnifiedTopology
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set up connection event listeners for better monitoring
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    
    // Provide specific guidance for common issues
    if (error.message.includes('IP that isn\'t whitelisted')) {
      console.error('\n🔧 SOLUTION: Your IP address is not whitelisted in MongoDB Atlas.');
      console.error('📋 To fix this:');
      console.error('1. Go to MongoDB Atlas dashboard');
      console.error('2. Navigate to Network Access');
      console.error('3. Click "Add IP Address"');
      console.error('4. Add your current IP or use "0.0.0.0/0" for all IPs (less secure)');
      console.error('5. Or use "Allow Access from Anywhere" for development');
    } else if (error.message.includes('MONGODB_URI environment variable is not defined')) {
      console.error('\n🔧 SOLUTION: Create a .env file in the stile-backend directory with:');
      console.error('MONGODB_URI=your_mongodb_connection_string_here');
    }
    
    process.exit(1);
  }
};

module.exports = { connectTODB };