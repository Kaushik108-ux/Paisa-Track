import { auth, db } from '../services/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

// Standard Categories matching the entire app
export const DEFAULT_CATEGORIES = [
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

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function formatINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
}

// Helper to get currently authenticated Firebase user or throw
function getAuthenticatedUser() {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error('Authentication required. Please log in.');
    error.status = 401;
    throw error;
  }
  return user;
}

// Helper to parse query parameters from endpoint strings like '/expenses?month=2026-08&category=Food'
function parseEndpoint(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const [path, queryString = ''] = cleanEndpoint.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString).entries());
  return { path, params };
}

// ==========================================
// Cloud Firestore Data Handlers
// ==========================================

// 1. Expenses Handlers
async function handleExpensesGet(params) {
  const user = getAuthenticatedUser();
  const expensesRef = collection(db, 'users', user.uid, 'expenses');
  
  const snapshot = await getDocs(expensesRef);
  let expenses = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  const month = params.month;
  const search = (params.search || '').toLowerCase();
  const category = params.category || '';
  const sortBy = params.sortBy || 'date';
  const sortOrder = (params.sortOrder || 'DESC').toUpperCase();

  // Filter by month
  if (month) {
    expenses = expenses.filter(e => e.budgetMonth === month || (e.date && e.date.startsWith(month)));
  }

  // Filter by category
  if (category && category !== 'all') {
    expenses = expenses.filter(e => e.category === category);
  }

  // Filter by search string
  if (search) {
    expenses = expenses.filter(e =>
      (e.description && e.description.toLowerCase().includes(search)) ||
      (e.note && e.note.toLowerCase().includes(search))
    );
  }

  // Sorting
  expenses.sort((a, b) => {
    if (sortBy === 'amount') {
      return sortOrder === 'ASC' ? a.amount - b.amount : b.amount - a.amount;
    }
    // Default sort by date
    const dateA = new Date(a.date || a.createdAt || 0).getTime();
    const dateB = new Date(b.date || b.createdAt || 0).getTime();
    return sortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
  });

  return expenses;
}

async function handleExpensesPost(body) {
  const user = getAuthenticatedUser();
  const { amount, description, category, date, note } = body;
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw Object.assign(new Error('Amount must be a number greater than 0.'), { status: 400 });
  }
  if (!description || !description.trim()) {
    throw Object.assign(new Error('Description is required.'), { status: 400 });
  }

  const selectedDate = date || new Date().toISOString().split('T')[0];
  const budgetMonth = selectedDate.substring(0, 7);

  const expenseData = {
    amount: parsedAmount,
    description: description.trim(),
    category: category || 'Other',
    date: selectedDate,
    budgetMonth,
    note: note ? note.trim() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'users', user.uid, 'expenses'), expenseData);
  return { id: docRef.id, ...expenseData };
}

async function handleExpensesPut(id, body) {
  const user = getAuthenticatedUser();
  const { amount, description, category, date, note } = body;
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw Object.assign(new Error('Amount must be a number greater than 0.'), { status: 400 });
  }

  const selectedDate = date || new Date().toISOString().split('T')[0];
  const budgetMonth = selectedDate.substring(0, 7);

  const updateData = {
    amount: parsedAmount,
    description: (description || '').trim(),
    category: category || 'Other',
    date: selectedDate,
    budgetMonth,
    note: note ? note.trim() : null,
    updatedAt: new Date().toISOString()
  };

  const docRef = doc(db, 'users', user.uid, 'expenses', id);
  await updateDoc(docRef, updateData);
  return { id, ...updateData };
}

async function handleExpensesDelete(id) {
  const user = getAuthenticatedUser();
  const docRef = doc(db, 'users', user.uid, 'expenses', id);
  await deleteDoc(docRef);
  return { message: 'Expense deleted successfully.', id };
}

// 2. Budgets Handlers
async function handleBudgetsGet(params, path) {
  const user = getAuthenticatedUser();
  const budgetsRef = collection(db, 'users', user.uid, 'budgets');
  
  // Specific month from URL parameter like /budgets/2026/8 or query ?month=2026-08
  const pathMatch = path.match(/^\/budgets\/(\d+)\/(\d+)$/);
  if (pathMatch) {
    const year = parseInt(pathMatch[1]);
    const monthNum = parseInt(pathMatch[2]);
    const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
    const docSnap = await getDoc(doc(db, 'users', user.uid, 'budgets', monthKey));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data(), exists: true };
    }
    return { amount: 0, exists: false, month: monthKey, monthNum, year };
  }

  const snapshot = await getDocs(budgetsRef);
  const budgets = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  if (params.month) {
    const b = budgets.find(item => item.month === params.month || item.id === params.month);
    return b ? { month: b.month || params.month, amount: b.amount, exists: true } : { amount: 0, exists: false, month: params.month };
  }

  return budgets;
}

async function handleBudgetsPost(body) {
  const user = getAuthenticatedUser();
  const { month, year, amount } = body;
  const parsedAmount = parseFloat(amount) || 0;
  
  let monthStr = '';
  let monthNum = 1;
  let yearNum = new Date().getFullYear();

  if (typeof month === 'string' && month.includes('-')) {
    monthStr = month;
    const [y, m] = month.split('-');
    yearNum = parseInt(y);
    monthNum = parseInt(m);
  } else {
    monthNum = parseInt(month) || (new Date().getMonth() + 1);
    yearNum = parseInt(year) || new Date().getFullYear();
    monthStr = `${yearNum}-${String(monthNum).padStart(2, '0')}`;
  }

  const budgetData = {
    month: monthStr,
    monthNum,
    year: yearNum,
    amount: parsedAmount,
    updatedAt: new Date().toISOString()
  };

  const docRef = doc(db, 'users', user.uid, 'budgets', monthStr);
  await setDoc(docRef, budgetData, { merge: true });

  return {
    message: 'Budget set successfully.',
    budget: { id: monthStr, ...budgetData, exists: true }
  };
}

// 3. Insights Handlers
async function handleInsightsSummary(params) {
  const user = getAuthenticatedUser();
  const month = params.month || new Date().toISOString().substring(0, 7);
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr) || new Date().getFullYear();
  const monthNum = parseInt(monthStr) || (new Date().getMonth() + 1);

  // 1. Fetch budget doc
  const budgetDocSnap = await getDoc(doc(db, 'users', user.uid, 'budgets', month));
  const budget = budgetDocSnap.exists() ? (budgetDocSnap.data().amount || 0) : 0;

  // 2. Fetch expenses for current month
  const expensesRef = collection(db, 'users', user.uid, 'expenses');
  const snapshot = await getDocs(expensesRef);
  const allUserExpenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const expenses = allUserExpenses.filter(e => e.budgetMonth === month || (e.date && e.date.startsWith(month)));
  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remaining = budget - totalSpent;
  const percentageUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;

  // 3. Daily spending limits calculation
  const today = new Date();
  const systemYear = today.getFullYear();
  const systemMonth = today.getMonth() + 1;
  const systemDate = today.getDate();
  const todayStr = today.toISOString().split('T')[0];

  let remainingDays = 0;
  let elapsedDays = 0;
  const totalDaysInMonth = getDaysInMonth(year, monthNum);

  if (year === systemYear && monthNum === systemMonth) {
    remainingDays = totalDaysInMonth - systemDate + 1;
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
  const todayExpenses = expenses.filter(e => e.date === todayStr);
  const todaySpent = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const isTodayExceeded = recommendedDailyLimit > 0 && todaySpent > recommendedDailyLimit;

  // 5. Category breakdown
  const catTotals = {};
  DEFAULT_CATEGORIES.forEach(cat => {
    catTotals[cat] = 0;
  });

  expenses.forEach(e => {
    const cat = e.category || 'Other';
    catTotals[cat] = (catTotals[cat] || 0) + (Number(e.amount) || 0);
  });

  let highestCatName = null;
  let highestCatAmount = 0;
  Object.keys(catTotals).forEach(cat => {
    if (catTotals[cat] > highestCatAmount) {
      highestCatAmount = catTotals[cat];
      highestCatName = cat;
    }
  });

  const highestCategory = highestCatName && highestCatAmount > 0
    ? {
        category: highestCatName,
        amount: highestCatAmount,
        percentage: totalSpent > 0 ? parseFloat(((highestCatAmount / totalSpent) * 100).toFixed(1)) : 0
      }
    : null;

  let largestExpense = null;
  if (expenses.length > 0) {
    const sortedByAmt = [...expenses].sort((a, b) => b.amount - a.amount);
    largestExpense = sortedByAmt[0];
  }

  const categoryBreakdown = Object.keys(catTotals).map(cat => {
    const amt = catTotals[cat] || 0;
    return {
      category: cat,
      amount: amt,
      percentage: totalSpent > 0 ? parseFloat(((amt / totalSpent) * 100).toFixed(1)) : 0
    };
  }).sort((a, b) => b.amount - a.amount);

  const recentTransactions = [...expenses]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);

  // 6. Smart insights
  const insights = [];
  if (budget > 0) {
    if (percentageUsed >= 100) {
      insights.push(`🚨 You have exceeded your monthly budget by ${formatINR(totalSpent - budget)}! Freeze all non-essential spending.`);
    } else if (percentageUsed >= 85) {
      insights.push(`⚠️ Critical warning: You have used ${percentageUsed.toFixed(1)}% of your monthly budget. Only ${formatINR(remaining)} remains.`);
    } else if (percentageUsed >= 70) {
      insights.push(`🟡 You've reached ${percentageUsed.toFixed(1)}% of your budget. Spend with caution for the rest of the month.`);
    } else {
      insights.push(`✅ Great job! You are within your budget with ${formatINR(remaining)} available.`);
    }
  } else {
    insights.push(`📝 Set your monthly budget to start tracking your finances effectively.`);
  }

  if (highestCategory) {
    insights.push(`🏆 ${highestCategory.category} is your highest spending category this month (${highestCategory.percentage}% of total).`);
  }
  if (recommendedDailyLimit > 0 && remainingDays > 0) {
    insights.push(`💡 Recommended daily spending limit: ${formatINR(recommendedDailyLimit)}/day for the remaining ${remainingDays} days.`);
  }
  if (elapsedDays > 0 && totalSpent > 0) {
    const avgDaily = totalSpent / elapsedDays;
    insights.push(`📊 Your average daily spending this month is ${formatINR(avgDaily)}.`);
  }
  if (expenses.length === 0) {
    insights.push(`📝 No expenses recorded for ${month} yet. Click '+ Add Expense' to begin tracking.`);
  }

  // 7. Previous month comparison
  let prevMonthNum = monthNum - 1;
  let prevYear = year;
  if (prevMonthNum === 0) {
    prevMonthNum = 12;
    prevYear = year - 1;
  }
  const prevMonthStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;
  const prevExpenses = allUserExpenses.filter(e => e.budgetMonth === prevMonthStr || (e.date && e.date.startsWith(prevMonthStr)));
  const prevTotalSpent = prevExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const diff = totalSpent - prevTotalSpent;
  const percentageChange = prevTotalSpent > 0 ? parseFloat(((diff / prevTotalSpent) * 100).toFixed(1)) : 0;

  let comparisonText = '';
  let categoryComparisonText = '';

  if (expenses.length > 0 || prevExpenses.length > 0) {
    if (diff > 0) {
      comparisonText = `You spent ${formatINR(diff)} more this month than last month (${prevMonthStr}).`;
    } else if (diff < 0) {
      comparisonText = `You reduced your spending by ${formatINR(Math.abs(diff))} compared with last month (${prevMonthStr}).`;
    } else {
      comparisonText = `You spent exactly the same amount as last month.`;
    }

    if (highestCategory) {
      const prevCatTotal = prevExpenses
        .filter(e => e.category === highestCategory.category)
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      const catDiff = highestCategory.amount - prevCatTotal;
      if (catDiff > 0) {
        categoryComparisonText = `${highestCategory.category} spending increased by ${formatINR(catDiff)} compared with last month.`;
      } else if (catDiff < 0) {
        categoryComparisonText = `${highestCategory.category} spending decreased by ${formatINR(Math.abs(catDiff))} compared with last month.`;
      }
    }
  }

  const comparison = {
    prevMonth: prevMonthStr,
    previousMonth: prevMonthStr,
    prevTotalSpent,
    previousMonthSpent: prevTotalSpent,
    difference: diff,
    percentageChange,
    isHigher: diff > 0,
    comparisonText,
    categoryComparisonText
  };

  return {
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
    recentTransactions,
    expenses,
    insights,
    comparison
  };
}

async function handleInsightsHistory() {
  const user = getAuthenticatedUser();
  const today = new Date();
  const months = [];

  // Fetch all budgets and all expenses once for speed
  const budgetsRef = collection(db, 'users', user.uid, 'budgets');
  const expensesRef = collection(db, 'users', user.uid, 'expenses');

  const [budgetsSnap, expensesSnap] = await Promise.all([
    getDocs(budgetsRef),
    getDocs(expensesRef)
  ]);

  const allBudgets = budgetsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const allExpenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const mStr = `${y}-${String(m).padStart(2, '0')}`;
    const mName = d.toLocaleString('default', { month: 'short' });

    const bObj = allBudgets.find(b => b.month === mStr || b.id === mStr || (b.year === y && b.monthNum === m));
    const bAmt = bObj ? (Number(bObj.amount) || 0) : 0;

    const mExpenses = allExpenses.filter(e => e.budgetMonth === mStr || (e.date && e.date.startsWith(mStr)));
    const spent = mExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    months.push({
      monthKey: mStr,
      month: mStr,
      monthName: mName,
      year: y,
      budget: bAmt,
      spent,
      remaining: bAmt - spent,
      percentageUsed: bAmt > 0 ? (spent / bAmt) * 100 : 0
    });
  }

  return months;
}

async function handleInsightsCategory(params, path) {
  const user = getAuthenticatedUser();
  let targetCategory = params.category;
  
  if (!targetCategory) {
    const prefix = '/insights/category/';
    if (path.startsWith(prefix)) {
      targetCategory = decodeURIComponent(path.substring(prefix.length));
    }
  }

  const month = params.month || new Date().toISOString().substring(0, 7);
  const expensesRef = collection(db, 'users', user.uid, 'expenses');
  const snapshot = await getDocs(expensesRef);
  const allUserExpenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  const expenses = allUserExpenses.filter(
    e => (e.budgetMonth === month || (e.date && e.date.startsWith(month))) &&
         e.category &&
         e.category.toLowerCase() === (targetCategory || '').toLowerCase()
  );

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const subGroups = {};
  expenses.forEach(e => {
    const name = (e.description || 'Other').trim();
    subGroups[name] = (subGroups[name] || 0) + (Number(e.amount) || 0);
  });

  const detailedBreakdown = Object.keys(subGroups).map(name => ({
    name,
    amount: subGroups[name],
    percentage: total > 0 ? parseFloat(((subGroups[name] / total) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.amount - a.amount);

  return {
    category: targetCategory,
    month,
    total,
    percentage: 100,
    detailedBreakdown,
    expenses
  };
}

// 4. Auth Me Handler
async function handleAuthMe() {
  const user = getAuthenticatedUser();
  const userDocSnap = await getDoc(doc(db, 'users', user.uid));
  const userData = userDocSnap.exists() ? userDocSnap.data() : {};

  return {
    id: user.uid,
    uid: user.uid,
    name: userData.name || user.displayName || user.email.split('@')[0],
    email: user.email,
    created_at: userData.createdAt || user.metadata.creationTime || new Date().toISOString()
  };
}

// Main API request dispatcher that implements direct Firestore queries
async function apiRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const { path, params } = parseEndpoint(endpoint);
  
  let body = {};
  if (options.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      body = options.body;
    }
  }

  // 1. Auth Me
  if (path === '/auth/me' && method === 'GET') {
    return handleAuthMe();
  }

  // 2. Budgets
  if (path.startsWith('/budgets')) {
    if (method === 'GET') {
      return handleBudgetsGet(params, path);
    }
    if (method === 'POST') {
      return handleBudgetsPost(body);
    }
  }

  // 3. Expenses
  if (path.startsWith('/expenses')) {
    const idMatch = path.match(/^\/expenses\/([^/?]+)$/);
    if (idMatch) {
      const expenseId = idMatch[1];
      if (method === 'PUT') {
        return handleExpensesPut(expenseId, body);
      }
      if (method === 'DELETE') {
        return handleExpensesDelete(expenseId);
      }
    }
    if (method === 'GET') {
      return handleExpensesGet(params);
    }
    if (method === 'POST') {
      return handleExpensesPost(body);
    }
  }

  // 4. Insights Summary
  if (path === '/insights/summary' && method === 'GET') {
    return handleInsightsSummary(params);
  }

  // 5. Insights History
  if (path === '/insights/history' && method === 'GET') {
    return handleInsightsHistory();
  }

  // 6. Insights Category
  if (path.startsWith('/insights/category') && method === 'GET') {
    return handleInsightsCategory(params, path);
  }

  throw Object.assign(new Error(`Endpoint ${path} not found.`), { status: 404 });
}

export const setToken = () => {
  // Maintained for backward compatibility; Firebase SDK persists session automatically
};

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiRequest(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => apiRequest(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options }),
};
