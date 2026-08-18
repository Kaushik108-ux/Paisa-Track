require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budgets');
const expenseRoutes = require('./routes/expenses');
const insightRoutes = require('./routes/insights');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/insights', insightRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Initialize DB and start server
async function startServer() {
  try {
    // Force DB initialization on startup
    await getDb();

    app.listen(PORT, () => {
      console.log(`PaisaTrack Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err.message);
    process.exit(1);
  }
}

startServer();
