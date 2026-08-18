const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all expense routes
router.use(authMiddleware);

// Valid categories as specified in requirements
const VALID_CATEGORIES = [
  'Food',
  'Transport',
  'Study',
  'Shopping',
  'Entertainment',
  'Mobile/Recharge',
  'Laundry',
  'Health',
  'Hostel',
  'Other'
];

// Helper to validate date format (YYYY-MM-DD)
function isValidDate(dateString) {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false;  // Invalid format
  const d = new Date(dateString);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 10) === dateString;
}

// @route   GET api/expenses
// @desc    Get expenses with optional filtering, search, and sorting
router.get('/', async (req, res) => {
  const { month, category, search, sortBy, sortOrder } = req.query;
  const userId = req.user.id;

  let query = 'SELECT * FROM expenses WHERE user_id = ?';
  const params = [userId];

  // Filter by Month (YYYY-MM)
  if (month) {
    query += ' AND budget_month = ?';
    params.push(month);
  }

  // Filter by Category
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  // Filter by Search Query (matching description or note)
  if (search) {
    query += ' AND (description LIKE ? OR note LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  // Sorting
  let orderColumn = 'date';
  let orderDir = 'DESC';

  if (sortBy === 'amount') {
    orderColumn = 'amount';
  } else if (sortBy === 'date') {
    orderColumn = 'date';
  }

  if (sortOrder === 'ASC' || sortOrder === 'DESC') {
    orderDir = sortOrder;
  } else {
    // Default: Sort by date DESC, then created_at DESC (newest first)
    if (orderColumn === 'date') {
      orderColumn = 'date DESC, created_at';
    }
  }

  query += ` ORDER BY ${orderColumn} ${orderDir}`;

  try {
    const db = await getDb();
    const expenses = await db.all(query, params);
    res.json(expenses);
  } catch (err) {
    console.error('Get expenses error:', err.message);
    res.status(500).json({ error: 'Server error retrieving expenses.' });
  }
});

// @route   POST api/expenses
// @desc    Add a new expense
router.post('/', async (req, res) => {
  const { amount, description, category, date, note } = req.body;
  const parsedAmount = parseFloat(amount);

  // Validations
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a number greater than 0.' });
  }
  if (!description || description.trim() === '') {
    return res.status(400).json({ error: 'Description ("What did you spend on?") is required.' });
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: 'Please provide a valid date in YYYY-MM-DD format.' });
  }

  const budget_month = date.substring(0, 7); // Extract "YYYY-MM"

  try {
    const db = await getDb();
    
    const result = await db.run(
      `INSERT INTO expenses (user_id, budget_month, date, amount, description, category, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, budget_month, date, parsedAmount, description.trim(), category, note ? note.trim() : null]
    );

    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Expense added successfully.', expense });
  } catch (err) {
    console.error('Add expense error:', err.message);
    res.status(500).json({ error: 'Server error adding expense.' });
  }
});

// @route   PUT api/expenses/:id
// @desc    Edit an existing expense
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { amount, description, category, date, note } = req.body;
  const parsedAmount = parseFloat(amount);

  // Validations
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a number greater than 0.' });
  }
  if (!description || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: 'Please provide a valid date in YYYY-MM-DD format.' });
  }

  const budget_month = date.substring(0, 7);

  try {
    const db = await getDb();

    // Verify ownership
    const existingExpense = await db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found or unauthorized.' });
    }

    await db.run(
      `UPDATE expenses 
       SET budget_month = ?, date = ?, amount = ?, description = ?, category = ?, note = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [budget_month, date, parsedAmount, description.trim(), category, note ? note.trim() : null, id]
    );

    const updatedExpense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
    res.json({ message: 'Expense updated successfully.', expense: updatedExpense });
  } catch (err) {
    console.error('Update expense error:', err.message);
    res.status(500).json({ error: 'Server error updating expense.' });
  }
});

// @route   DELETE api/expenses/:id
// @desc    Delete an expense
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();

    // Verify ownership
    const existingExpense = await db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found or unauthorized.' });
    }

    await db.run('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ message: 'Expense deleted successfully.', id: parseInt(id) });
  } catch (err) {
    console.error('Delete expense error:', err.message);
    res.status(500).json({ error: 'Server error deleting expense.' });
  }
});

module.exports = router;
