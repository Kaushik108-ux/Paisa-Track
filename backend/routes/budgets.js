const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all budget routes
router.use(authMiddleware);

// @route   GET api/budgets
// @desc    Get all budgets for user
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const budgets = await db.all(
      'SELECT id, month, year, amount, created_at FROM budgets WHERE user_id = ? ORDER BY year DESC, month DESC',
      [req.user.id]
    );
    res.json(budgets);
  } catch (err) {
    console.error('Get budgets error:', err.message);
    res.status(500).json({ error: 'Server error retrieving budgets.' });
  }
});

// @route   GET api/budgets/:year/:month
// @desc    Get budget for specific month
router.get('/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const parsedYear = parseInt(year);
  const parsedMonth = parseInt(month);

  if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    return res.status(400).json({ error: 'Invalid month or year.' });
  }

  try {
    const db = await getDb();
    const budget = await db.get(
      'SELECT id, month, year, amount FROM budgets WHERE user_id = ? AND month = ? AND year = ?',
      [req.user.id, parsedMonth, parsedYear]
    );

    if (!budget) {
      return res.json({ amount: 0, exists: false, month: parsedMonth, year: parsedYear });
    }

    res.json({ ...budget, exists: true });
  } catch (err) {
    console.error('Get single budget error:', err.message);
    res.status(500).json({ error: 'Server error retrieving budget.' });
  }
});

// @route   POST api/budgets
// @desc    Create or update monthly budget
router.post('/', async (req, res) => {
  const { month, year, amount } = req.body;
  const parsedMonth = parseInt(month);
  const parsedYear = parseInt(year);
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    return res.status(400).json({ error: 'Invalid month. Must be between 1 and 12.' });
  }
  if (isNaN(parsedYear) || parsedYear < 2000) {
    return res.status(400).json({ error: 'Invalid year.' });
  }
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    return res.status(400).json({ error: 'Budget amount cannot be negative.' });
  }

  try {
    const db = await getDb();
    
    // SQLite UPSERT syntax
    await db.run(`
      INSERT INTO budgets (user_id, month, year, amount)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, month, year)
      DO UPDATE SET amount = EXCLUDED.amount
    `, [req.user.id, parsedMonth, parsedYear, parsedAmount]);

    // Fetch the upserted budget to return it
    const budget = await db.get(
      'SELECT id, month, year, amount, created_at FROM budgets WHERE user_id = ? AND month = ? AND year = ?',
      [req.user.id, parsedMonth, parsedYear]
    );

    res.json({ message: 'Budget set successfully.', budget: { ...budget, exists: true } });
  } catch (err) {
    console.error('Set budget error:', err.message);
    res.status(500).json({ error: 'Server error setting budget.' });
  }
});

module.exports = router;
