require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = [
  'https://kaushik108-ux.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN.replace(/\/$/, ''));
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (such as mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist or if in non-production
    const isAllowed = allowedOrigins.some(allowed => 
      origin === allowed || origin.startsWith(allowed)
    );

    if (isAllowed || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Fallback: allow with origin header
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request body
app.use(express.json());

// Health check endpoint for uptime monitoring and cloud deploy probes
const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    service: 'PaisaTrack API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Import routes
const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budgets');
const expenseRoutes = require('./routes/expenses');
const insightRoutes = require('./routes/insights');

// Mount routes (both /api prefix and root for maximum client compatibility)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/expenses', expenseRoutes);
app.use('/api/insights', insightRoutes);
app.use('/insights', insightRoutes);

// 404 JSON fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong on the server.' });
});

// Initialize DB and start server
async function startServer() {
  try {
    // Force DB initialization on startup
    await getDb();

    const HOST = '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`PaisaTrack Server running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err.message);
    process.exit(1);
  }
}

startServer();
