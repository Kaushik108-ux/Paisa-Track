const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbConnection = null;

async function getDb() {
  if (dbConnection) return dbConnection;

  const dbPath = path.join(__dirname, 'paisatrack.db');
  
  dbConnection = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await dbConnection.run('PRAGMA foreign_keys = ON;');

  // Initialize tables
  await dbConnection.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
      year INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount >= 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE (user_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      budget_month TEXT NOT NULL, -- Format "YYYY-MM"
      date TEXT NOT NULL,         -- Format "YYYY-MM-DD"
      amount REAL NOT NULL CHECK(amount > 0),
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  console.log('SQLite Database initialized successfully at:', dbPath);
  return dbConnection;
}

module.exports = { getDb };
