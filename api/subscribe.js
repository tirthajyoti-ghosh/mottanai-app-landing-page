// api/subscribe.js
import { MongoClient } from 'mongodb';

// Create cached connection variable
let cachedDb = null;

// Function to connect to database
async function connectToDatabase() {
  // If the database connection is cached, use it
  if (cachedDb) {
    return cachedDb;
  }

  // If no connection is cached, create a new one
  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Select the database
  const db = client.db(process.env.MONGODB_DB);
  
  // Cache the database connection
  cachedDb = db;
  return db;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  try {
    // Connect to the database
    const db = await connectToDatabase();
    
    // Check if email already exists
    const existingUser = await db
      .collection('waitlist')
      .findOne({ email: email.toLowerCase() });
      
    if (existingUser) {
      return res.status(400).json({ 
        error: 'This email is already on our waitlist' 
      });
    }
    
    // Insert the new email
    await db.collection('waitlist').insertOne({
      email: email.toLowerCase(),
      joinedAt: new Date()
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'You have been added to our waitlist!' 
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Failed to subscribe. Please try again later.' 
    });
  }
}
