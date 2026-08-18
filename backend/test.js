const { getDb } = require('./db');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('--- Starting Backend Integration and Database Tests ---');
  try {
    const db = await getDb();

    // Clean tables for fresh testing
    await db.run('DELETE FROM users');
    await db.run('DELETE FROM budgets');
    await db.run('DELETE FROM expenses');
    console.log('1. Cleared test database tables.');

    // 1. Test User Insert
    const name = 'Test Student';
    const email = 'test@hostel.edu';
    const password = 'studentpassword';
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = await db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    const userId = userResult.lastID;
    console.log(`2. Inserted User: ${name} (ID: ${userId})`);

    // Verify Password Match
    const userRow = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) throw new Error('Password hashing verification failed!');
    console.log('3. Verified password hashing and match successfully.');

    // 2. Test Budget Insert/Upsert
    const month = 8; // August
    const year = 2026;
    const budgetAmount = 8000;

    await db.run(`
      INSERT INTO budgets (user_id, month, year, amount)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, month, year)
      DO UPDATE SET amount = EXCLUDED.amount
    `, [userId, month, year, budgetAmount]);

    const budgetRow = await db.get(
      'SELECT amount FROM budgets WHERE user_id = ? AND month = ? AND year = ?',
      [userId, month, year]
    );
    if (!budgetRow || budgetRow.amount !== budgetAmount) {
      throw new Error('Budget insertion or retrieval failed!');
    }
    console.log(`4. Inserted Budget: ₹${budgetRow.amount} for August 2026`);

    // Test Budget Upsert (Update)
    const newBudgetAmount = 8500;
    await db.run(`
      INSERT INTO budgets (user_id, month, year, amount)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, month, year)
      DO UPDATE SET amount = EXCLUDED.amount
    `, [userId, month, year, newBudgetAmount]);

    const updatedBudgetRow = await db.get(
      'SELECT amount FROM budgets WHERE user_id = ? AND month = ? AND year = ?',
      [userId, month, year]
    );
    if (!updatedBudgetRow || updatedBudgetRow.amount !== newBudgetAmount) {
      throw new Error('Budget UPSERT failed!');
    }
    console.log(`5. Verified Budget Upsert (Updated to ₹${updatedBudgetRow.amount})`);

    // 3. Test Expense Insert
    const expense1 = {
      amount: 150,
      description: 'Hostel Dinner',
      category: 'Food',
      date: '2026-08-19',
      note: 'Late night food'
    };

    const expense2 = {
      amount: 600,
      description: 'Textbooks',
      category: 'Study',
      date: '2026-08-18',
      note: 'Semester exam prep'
    };

    const expResult1 = await db.run(
      `INSERT INTO expenses (user_id, budget_month, date, amount, description, category, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, '2026-08', expense1.date, expense1.amount, expense1.description, expense1.category, expense1.note]
    );

    const expResult2 = await db.run(
      `INSERT INTO expenses (user_id, budget_month, date, amount, description, category, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, '2026-08', expense2.date, expense2.amount, expense2.description, expense2.category, expense2.note]
    );

    console.log(`6. Inserted two expenses. (IDs: ${expResult1.lastID}, ${expResult2.lastID})`);

    // 4. Test Aggregations
    const sumRow = await db.get(
      'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND budget_month = ?',
      [userId, '2026-08']
    );
    const totalSpent = sumRow.total;
    const remaining = newBudgetAmount - totalSpent;
    const percentUsed = (totalSpent / newBudgetAmount) * 100;

    console.log(`7. Calculation results:
       Total Budget: ₹${newBudgetAmount}
       Total Spent:  ₹${totalSpent}
       Remaining:    ₹${remaining}
       Used %:       ${percentUsed.toFixed(1)}%`);

    if (totalSpent !== 750) throw new Error('Expense sum calculation incorrect!');
    if (remaining !== 7750) throw new Error('Remaining calculation incorrect!');

    // 5. Test Category Breakdowns
    const categories = await db.all(
      `SELECT category, SUM(amount) as amount 
       FROM expenses 
       WHERE user_id = ? AND budget_month = ?
       GROUP BY category`,
      [userId, '2026-08']
    );
    console.log('8. Category wise breakdowns:');
    categories.forEach(c => {
      console.log(`   - ${c.category}: ₹${c.amount}`);
    });

    console.log('\n--- ALL BACKEND LOCAL TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('\n*** TEST FAILED ***');
    console.error(err);
    process.exit(1);
  }
}

runTests();
