const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8082;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'setuhub_marketplace';

let db;

// Connect to MongoDB
MongoClient.connect(MONGO_URL)
  .then(client => {
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes

// Get all collections
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    res.json(collectionNames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collection stats
app.get('/api/collections/:name/stats', async (req, res) => {
  try {
    const collection = db.collection(req.params.name);
    const count = await collection.countDocuments();
    const sample = await collection.find().limit(1).toArray();
    res.json({ count, sample: sample[0] || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Query collection
app.post('/api/query', async (req, res) => {
  try {
    const { collection: collectionName, query, limit = 50, skip = 0, sort } = req.body;
    const collection = db.collection(collectionName);
    
    let parsedQuery = {};
    let parsedSort = {};
    
    // Parse query if it's a string
    if (typeof query === 'string' && query.trim()) {
      try {
        parsedQuery = JSON.parse(query);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON query' });
      }
    } else if (typeof query === 'object') {
      parsedQuery = query;
    }
    
    // Parse sort
    if (sort) {
      parsedSort = typeof sort === 'string' ? JSON.parse(sort) : sort;
    }
    
    const cursor = collection.find(parsedQuery, { projection: { _id: 0 } });
    
    if (Object.keys(parsedSort).length > 0) {
      cursor.sort(parsedSort);
    }
    
    const results = await cursor.skip(skip).limit(limit).toArray();
    const total = await collection.countDocuments(parsedQuery);
    
    res.json({ results, total, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export collection
app.get('/api/export/:collection', async (req, res) => {
  try {
    const collection = db.collection(req.params.collection);
    const data = await collection.find({}, { projection: { _id: 0 } }).toArray();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.collection}.json`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aggregate query
app.post('/api/aggregate', async (req, res) => {
  try {
    const { collection: collectionName, pipeline } = req.body;
    const collection = db.collection(collectionName);
    
    const parsedPipeline = typeof pipeline === 'string' ? JSON.parse(pipeline) : pipeline;
    const results = await collection.aggregate(parsedPipeline).toArray();
    
    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Database Admin UI running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Access at: http://localhost:${PORT}`);
});
