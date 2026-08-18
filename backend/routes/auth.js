const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'paisatrack_secret_key_2026';

// @route   POST api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const db = await getDb();

    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email.toLowerCase(), password_hash]
    );

    const userId = result.lastID;

    // Create JWT
    const token = jwt.sign({ id: userId, email: email.toLowerCase() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email: email.toLowerCase(),
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }

  try {
    const db = await getDb();

    // Check for user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// @route   GET api/auth/me
// @desc    Get user data
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Auth check error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Reset password (simulation/simple reset)
router.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Please provide email and new password.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const db = await getDb();

    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(404).json({ error: 'No user registered with this email.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, user.id]);

    res.json({ message: 'Password has been reset successfully. You can now login.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
