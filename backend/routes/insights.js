const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware
router.use(authMiddleware);

// Helper to get days in month (1-indexed month: 1=Jan, 12=Dec)
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// @route   GET api/insights/summary
// @desc    Get dashboard metrics, category totals, and smart insights
router.get('/summary', async (req, res) => {
  const { month } = req.query; // Expects "YYYY-MM"
  const userId = req.user.id;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Please provide month in YYYY-MM format.' });
  }

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);

  try {
    const db = await getDb();

    // 1. Fetch budget for this month
    const budgetRow = await db.get(
      'SELECT amount FROM budgets WHERE user_id = ? AND month = ? AND year = ?',
      [userId, monthNum, year]
    );
    const budget = budgetRow ? budgetRow.amount : 0;

    // 2. Fetch expenses for this month
    const expenses = await db.all(
      'SELECT * FROM expenses WHERE user_id = ? AND budget_month = ?',
      [userId, month]
    );

    // Calculate sum of expenses
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget - totalSpent;
    const percentageUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;

    // 3. Calculate remaining days and recommended daily spending
    const today = new Date();
    // System time date components
    const systemYear = today.getFullYear();
    const systemMonth = today.getMonth() + 1; // JS month is 0-indexed
    const systemDate = today.getDate();

    let remainingDays = 0;
    let elapsedDays = 0;
    const totalDaysInMonth = getDaysInMonth(year, monthNum);

    if (year === systemYear && monthNum === systemMonth) {
      remainingDays = totalDaysInMonth - systemDate + 1; // include today
      elapsedDays = systemDate;
    } else if (year > systemYear || (year === systemYear && monthNum > systemMonth)) {
      remainingDays = totalDaysInMonth;
      elapsedDays = 0;
    } else {
      remainingDays = 0;
      elapsedDays = totalDaysInMonth;
    }

    const recommendedDailyLimit = remainingDays > 0 && remaining > 0 ? remaining / remainingDays : 0;

    // 4. Calculate today's spending
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const todayExpenses = await db.all(
      'SELECT amount FROM expenses WHERE user_id = ? AND date = ?',
      [userId, todayStr]
    );
    const todaySpent = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const isTodayExceeded = recommendedDailyLimit > 0 && todaySpent > recommendedDailyLimit;

    // 5. Category-wise totals
    const categoryTotalsMap = {};
    // Initialize all valid categories to 0
    const categories = [
      'Food', 'Transport', 'Study', 'Shopping', 'Entertainment',
      'Mobile/Recharge', 'Laundry', 'Health', 'Hostel', 'Other'
    ];
    categories.forEach(cat => {
      categoryTotalsMap[cat] = 0;
    });

    expenses.forEach(exp => {
      if (categoryTotalsMap[exp.category] !== undefined) {
        categoryTotalsMap[exp.category] += exp.amount;
      } else {
        categoryTotalsMap[exp.category] = exp.amount;
      }
    });

    const categoryBreakdown = Object.keys(categoryTotalsMap).map(cat => {
      const amt = categoryTotalsMap[cat];
      return {
        category: cat,
        amount: amt,
        percentage: totalSpent > 0 ? parseFloat(((amt / totalSpent) * 100).toFixed(1)) : 0
      };
    }).sort((a, b) => b.amount - a.amount);

    // 6. Highest spending category
    let highestCategory = null;
    const activeCategories = categoryBreakdown.filter(c => c.amount > 0);
    if (activeCategories.length > 0) {
      highestCategory = activeCategories[0];
    }

    // 7. Largest individual expense
    let largestExpense = null;
    if (expenses.length > 0) {
      largestExpense = expenses.reduce((max, exp) => exp.amount > max.amount ? exp : max, expenses[0]);
    }

    // 8. Smart Insights & Comparisons
    const insights = [];

    // Insight 1: Budget Alert
    if (budget > 0) {
      if (percentageUsed >= 100) {
        insights.push(`You have exceeded your monthly budget by ₹${Math.abs(remaining).toFixed(2)}.`);
      } else if (percentageUsed >= 85) {
        insights.push(`You have used ${percentageUsed.toFixed(1)}% of your budget. Consider reducing unnecessary spending.`);
      } else if (percentageUsed >= 70) {
        insights.push(`You have used ${percentageUsed.toFixed(1)}% of your monthly budget.`);
      } else {
        insights.push(`You have used ${percentageUsed.toFixed(1)}% of your monthly budget. Nice job keeping it under control!`);
      }
    } else {
      insights.push('Set your monthly budget to start tracking your finances effectively.');
    }

    // Insight 2: Highest Category
    if (highestCategory) {
      insights.push(`${highestCategory.category} is your highest spending category this month, accounting for ${highestCategory.percentage}% of your total spending.`);
    }

    // Insight 3: Daily recommendation
    if (remainingDays > 0) {
      if (remaining > 0) {
        insights.push(`You have ₹${remaining.toFixed(2)} remaining for the next ${remainingDays} days (₹${recommendedDailyLimit.toFixed(2)}/day).`);
      } else {
        insights.push(`You have no remaining budget for the final ${remainingDays} days of the month.`);
      }
    }

    // Insight 4: Average Daily spending
    if (elapsedDays > 0 && totalSpent > 0) {
      const avgDaily = totalSpent / elapsedDays;
      insights.push(`Your average daily spending this month is ₹${avgDaily.toFixed(2)}.`);
    }

    // 9. Compare with previous month
    // Find previous month (YYYY-MM)
    let prevMonthNum = monthNum - 1;
    let prevYear = year;
    if (prevMonthNum === 0) {
      prevMonthNum = 12;
      prevYear = year - 1;
    }
    const prevMonthStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;

    // Get previous month total spent
    const prevExpenses = await db.all(
      'SELECT amount, category FROM expenses WHERE user_id = ? AND budget_month = ?',
      [userId, prevMonthStr]
    );
    const prevTotalSpent = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    let comparisonText = '';
    let categoryComparisonText = '';

    if (expenses.length > 0 || prevExpenses.length > 0) {
      const diff = totalSpent - prevTotalSpent;
      if (diff > 0) {
        comparisonText = `You spent ₹${diff.toFixed(2)} more this month than last month (${prevMonthStr}).`;
      } else if (diff < 0) {
        comparisonText = `You reduced your spending by ₹${Math.abs(diff).toFixed(2)} compared with last month (${prevMonthStr}).`;
      } else {
        comparisonText = `You spent exactly the same amount as last month.`;
      }
      insights.push(comparisonText);

      // Compare categories where historical data exists
      if (highestCategory) {
        const prevCatTotal = prevExpenses
          .filter(e => e.category === highestCategory.category)
          .reduce((sum, exp) => sum + exp.amount, 0);
        
        const catDiff = highestCategory.amount - prevCatTotal;
        if (catDiff > 0) {
          categoryComparisonText = `${highestCategory.category} spending increased by ₹${catDiff.toFixed(2)} compared with last month.`;
          insights.push(categoryComparisonText);
        } else if (catDiff < 0) {
          categoryComparisonText = `${highestCategory.category} spending decreased by ₹${Math.abs(catDiff).toFixed(2)} compared with last month.`;
          insights.push(categoryComparisonText);
        }
      }
    }

    // Return everything
    res.json({
      budget,
      totalSpent,
      remaining,
      percentageUsed,
      remainingDays,
      recommendedDailyLimit,
      todaySpent,
      isTodayExceeded,
      highestCategory,
      largestExpense,
      categoryBreakdown,
      insights,
      comparison: {
        prevMonth: prevMonthStr,
        prevTotalSpent,
        difference: totalSpent - prevTotalSpent,
        comparisonText,
        categoryComparisonText
      }
    });

  } catch (err) {
    console.error('Get summary error:', err.message);
    res.status(500).json({ error: 'Server error calculating dashboard metrics.' });
  }
});

// @route   GET api/insights/history
// @desc    Get historical monthly spending data for comparison charts (last 6 months)
router.get('/history', async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  const historyList = [];

  try {
    const db = await getDb();

    // Loop through the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthStr = `${y}-${String(m).padStart(2, '0')}`;

      // Fetch budget
      const budgetRow = await db.get(
        'SELECT amount FROM budgets WHERE user_id = ? AND month = ? AND year = ?',
        [userId, m, y]
      );
      const budget = budgetRow ? budgetRow.amount : 0;

      // Fetch expenses
      const expenseRow = await db.get(
        'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND budget_month = ?',
        [userId, monthStr]
      );
      const spent = expenseRow && expenseRow.total ? expenseRow.total : 0;

      historyList.push({
        monthKey: monthStr,
        monthName: d.toLocaleString('default', { month: 'short' }),
        year: y,
        budget,
        spent,
        remaining: budget - spent
      });
    }

    res.json(historyList);
  } catch (err) {
    console.error('Get history error:', err.message);
    res.status(500).json({ error: 'Server error retrieving budget history.' });
  }
});

// @route   GET api/insights/category/:category
// @desc    Get detailed list of expenses for a specific category in a given month
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  const { month } = req.query; // "YYYY-MM"
  const userId = req.user.id;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Please provide month in YYYY-MM format.' });
  }

  try {
    const db = await getDb();

    const expenses = await db.all(
      'SELECT * FROM expenses WHERE user_id = ? AND category = ? AND budget_month = ? ORDER BY date DESC, created_at DESC',
      [userId, category, month]
    );

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Grouping by description/sub-element (e.g. outside dinner, snacks)
    const breakdownMap = {};
    expenses.forEach(e => {
      const desc = e.description.trim();
      if (!breakdownMap[desc]) {
        breakdownMap[desc] = 0;
      }
      breakdownMap[desc] += e.amount;
    });

    const detailedBreakdown = Object.keys(breakdownMap).map(desc => ({
      name: desc,
      amount: breakdownMap[desc],
      percentage: total > 0 ? parseFloat(((breakdownMap[desc] / total) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.amount - a.amount);

    res.json({
      category,
      month,
      total,
      expenses,
      detailedBreakdown
    });

  } catch (err) {
    console.error('Get category detail error:', err.message);
    res.status(500).json({ error: 'Server error calculating category breakdown details.' });
  }
});

module.exports = router;
