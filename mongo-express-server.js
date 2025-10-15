const express = require('express');
const mongoExpress = require('mongo-express/lib/middleware');
const mongoExpressConfig = require('mongo-express/config.default.js');

const app = express();
const PORT = 8082;

// Configure mongo-express
mongoExpressConfig.mongodb.connectionString = 'mongodb://localhost:27017';
mongoExpressConfig.mongodb.admin = false;
mongoExpressConfig.site.baseUrl = '/db-admin';
mongoExpressConfig.options.documentsPerPage = 50;
mongoExpressConfig.useBasicAuth = false; // Disable auth for easier access in dev

// Mount mongo-express
app.use('/db-admin', mongoExpress(mongoExpressConfig));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mongo Express is running' });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/db-admin');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Mongo Express running on http://0.0.0.0:${PORT}/db-admin`);
  console.log(`📊 Access your database UI at: http://localhost:${PORT}/db-admin`);
});
