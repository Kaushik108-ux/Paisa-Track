// Resolve base API URL from Vite environment variable (VITE_API_URL) or default to relative '/api'
const RAW_API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL.trim() 
  : '';

// Robust API base formatter that handles with/without trailing slash and with/without /api
const getApiBase = () => {
  if (!RAW_API_URL) return '/api';
  let clean = RAW_API_URL.replace(/\/+$/, '');
  if (clean.endsWith('/api')) {
    return clean;
  }
  return `${clean}/api`;
};

const API_BASE = getApiBase();

// Retrieve token from LocalStorage
const getToken = () => {
  try {
    return localStorage.getItem('paisatrack_token');
  } catch (e) {
    return null;
  }
};

// Save or remove token
export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('paisatrack_token', token);
    } else {
      localStorage.removeItem('paisatrack_token');
    }
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

// Standard Categories matching the entire app
const DEFAULT_CATEGORIES = [
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

// In-Browser Client Storage Engine (runs on static hosts like GitHub Pages)
function handleClientStorage(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let body = {};
  if (options.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch (e) {
      body = {};
    }
  }

  const token = getToken();

  // Helper storage accessors with safe fallback
  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem('paisatrack_local_users') || '[]');
    } catch (e) {
      return [];
    }
  };

  const saveUsers = (u) => {
    try {
      localStorage.setItem('paisatrack_local_users', JSON.stringify(u));
    } catch (e) {}
  };

  const getBudgets = () => {
    try {
      return JSON.parse(localStorage.getItem('paisatrack_local_budgets') || '[]');
    } catch (e) {
      return [];
    }
  };

  const saveBudgets = (b) => {
    try {
      localStorage.setItem('paisatrack_local_budgets', JSON.stringify(b));
    } catch (e) {}
  };

  const getExpenses = () => {
    try {
      return JSON.parse(localStorage.getItem('paisatrack_local_expenses') || '[]');
    } catch (e) {
      return [];
    }
  };

  const saveExpenses = (e) => {
    try {
      localStorage.setItem('paisatrack_local_expenses', JSON.stringify(e));
    } catch (e) {}
  };

  // Safe endpoint path and query parsing
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const [path, queryString = ''] = cleanEndpoint.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString).entries());

  // Current user from token
  const getCurrentUser = () => {
    if (!token) return null;
    const users = getUsers();
    if (users.length === 0) {
      const defaultUser = {
        id: 101,
        name: 'Kaushik',
        email: 'user@paisatrack.app',
        password: 'password123',
        created_at: new Date().toISOString()
      };
      users.push(defaultUser);
      saveUsers(users);
      return defaultUser;
    }
    const found = users.find(u => 'local_token_' + u.id === token || u.id.toString() === token);
    return found || users[0];
  };

  // 1. Auth Register
  if (path === '/auth/register' && method === 'POST') {
    const { name, email, password } = body;
    if (!name || !email || !password) {
      throw Object.assign(new Error('Please provide name, email, and password.'), { status: 400 });
    }
    const users = getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw Object.assign(new Error('A user with this email address already exists.'), { status: 400 });
    }
    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);

    const userObj = { id: newUser.id, name: newUser.name, email: newUser.email };
    const userToken = 'local_token_' + newUser.id;
    return { user: userObj, token: userToken };
  }

  // 2. Auth Login
  if (path === '/auth/login' && method === 'POST') {
    const { email, password } = body;
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user || user.password !== password) {
      throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
    }
    const userObj = { id: user.id, name: user.name, email: user.email };
    const userToken = 'local_token_' + user.id;
    return { user: userObj, token: userToken };
  }

  // 3. Auth Me
  if (path === '/auth/me' && method === 'GET') {
    const user = getCurrentUser();
    if (!user) {
      throw Object.assign(new Error('Authentication required.'), { status: 401 });
    }
    return { id: user.id, name: user.name, email: user.email };
  }

  // Require auth for all remaining routes
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw Object.assign(new Error('Authentication token is missing or invalid.'), { status: 401 });
  }
  const userId = currentUser.id;

  // 4. Budgets
  if (path.startsWith('/budgets')) {
    if (method === 'GET') {
      const monthParam = params.month;
      const budgets = getBudgets();
      if (monthParam) {
        const [yStr, mStr] = monthParam.split('-');
        const y = parseInt(yStr);
        const m = parseInt(mStr);
        const b = budgets.find(item => item.userId === userId && (item.month === monthParam || (item.year === y && item.monthNum === m)));
        return b ? { month: b.month || monthParam, amount: b.amount } : null;
      }
      return budgets.filter(b => b.userId === userId);
    }

    if (method === 'POST') {
      const { month, year, amount } = body;
      const parsedAmount = parseFloat(amount) || 0;
      let monthStr = '';
      let monthNum = 1;
      let yearNum = 2026;

      if (typeof month === 'string' && month.includes('-')) {
        monthStr = month;
        const [y, m] = month.split('-');
        yearNum = parseInt(y);
        monthNum = parseInt(m);
      } else {
        monthNum = parseInt(month);
        yearNum = parseInt(year) || new Date().getFullYear();
        monthStr = `${yearNum}-${String(monthNum).padStart(2, '0')}`;
      }

      const budgets = getBudgets();
      const idx = budgets.findIndex(item => 
        item.userId === userId && 
        (item.month === monthStr || (item.year === yearNum && item.monthNum === monthNum))
      );

      const budgetEntry = {
        userId,
        month: monthStr,
        monthNum,
        year: yearNum,
        amount: parsedAmount
      };

      if (idx >= 0) {
        budgets[idx] = budgetEntry;
      } else {
        budgets.push(budgetEntry);
      }
      saveBudgets(budgets);
      return { message: 'Budget set successfully.', budget: { ...budgetEntry, exists: true } };
    }
  }

  // 5. Expenses
  if (path.startsWith('/expenses')) {
    const expenses = getExpenses();
    const idMatch = path.match(/^\/expenses\/(\d+)$/);

    if (idMatch) {
      const expenseId = parseInt(idMatch[1]);
      const idx = expenses.findIndex(e => e.id === expenseId && e.userId === userId);

      if (method === 'PUT') {
        if (idx === -1) throw Object.assign(new Error('Expense not found.'), { status: 404 });
        const { amount, description, category, date, note } = body;
        const budgetMonth = date ? date.substring(0, 7) : new Date().toISOString().substring(0, 7);
        expenses[idx] = {
          ...expenses[idx],
          amount: parseFloat(amount),
          description: (description || '').trim(),
          category: category || 'Other',
          date,
          budgetMonth,
          note: note ? note.trim() : null
        };
        saveExpenses(expenses);
        return expenses[idx];
      }

      if (method === 'DELETE') {
        if (idx === -1) throw Object.assign(new Error('Expense not found.'), { status: 404 });
        expenses.splice(idx, 1);
        saveExpenses(expenses);
        return { message: 'Expense deleted successfully.' };
      }
    }

    if (method === 'GET') {
      const month = params.month;
      const search = (params.search || '').toLowerCase();
      const category = params.category || '';
      const sort = params.sort || 'date-desc';

      let userExpenses = expenses.filter(e => e.userId === userId && e.budgetMonth === month);

      if (category && category !== 'all') {
        userExpenses = userExpenses.filter(e => e.category === category);
      }
      if (search) {
        userExpenses = userExpenses.filter(e =>
          (e.description && e.description.toLowerCase().includes(search)) ||
          (e.note && e.note.toLowerCase().includes(search))
        );
      }

      userExpenses.sort((a, b) => {
        if (sort === 'date-asc' || sort === 'date-ASC') return new Date(a.date) - new Date(b.date);
        if (sort === 'amount-desc' || sort === 'amount-DESC') return b.amount - a.amount;
        if (sort === 'amount-asc' || sort === 'amount-ASC') return a.amount - b.amount;
        return new Date(b.date) - new Date(a.date);
      });

      return userExpenses;
    }

    if (method === 'POST') {
      const { amount, description, category, date, note } = body;
      const budgetMonth = date ? date.substring(0, 7) : new Date().toISOString().substring(0, 7);
      const newExpense = {
        id: Date.now(),
        userId,
        amount: parseFloat(amount),
        description: (description || '').trim(),
        category: category || 'Other',
        date: date || new Date().toISOString().split('T')[0],
        budgetMonth,
        note: note ? note.trim() : null,
        created_at: new Date().toISOString()
      };
      expenses.push(newExpense);
      saveExpenses(expenses);
      return newExpense;
    }
  }

  // 6. Insights Summary
  if (path === '/insights/summary' && method === 'GET') {
    const month = params.month || new Date().toISOString().substring(0, 7);
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr) || new Date().getFullYear();
    const monthNum = parseInt(monthStr) || (new Date().getMonth() + 1);

    const budgets = getBudgets();
    const budgetObj = budgets.find(b => 
      b.userId === userId && 
      (b.month === month || (b.year === year && b.monthNum === monthNum))
    );
    const budget = budgetObj ? budgetObj.amount : 0;

    const expenses = getExpenses().filter(e => e.userId === userId && e.budgetMonth === month);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget - totalSpent;
    const percentageUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;

    const today = new Date();
    const systemYear = today.getFullYear();
    const systemMonth = today.getMonth() + 1;
    const systemDate = today.getDate();

    let remainingDays = 0;
    const totalDaysInMonth = getDaysInMonth(year, monthNum);

    if (year === systemYear && monthNum === systemMonth) {
      remainingDays = totalDaysInMonth - systemDate + 1;
    } else if (year > systemYear || (year === systemYear && monthNum > systemMonth)) {
      remainingDays = totalDaysInMonth;
    } else {
      remainingDays = 0;
    }

    const recommendedDailyLimit = remainingDays > 0 && remaining > 0 ? remaining / remainingDays : 0;

    const catTotals = {};
    DEFAULT_CATEGORIES.forEach(cat => {
      catTotals[cat] = 0;
    });

    expenses.forEach(e => {
      const cat = e.category || 'Other';
      catTotals[cat] = (catTotals[cat] || 0) + e.amount;
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
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

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
    }
    if (highestCategory) {
      insights.push(`🏆 ${highestCategory.category} is your highest spending category this month (${highestCategory.percentage}% of total).`);
    }
    if (recommendedDailyLimit > 0 && remainingDays > 0) {
      insights.push(`💡 Recommended daily spending limit: ${formatINR(recommendedDailyLimit)}/day for the remaining ${remainingDays} days.`);
    }
    if (expenses.length === 0) {
      insights.push(`📝 No expenses recorded for ${month} yet. Click '+ Add Expense' to begin tracking.`);
    }

    // Previous month comparison for Monthly History tab
    const prevDate = new Date(year, monthNum - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const prevExpenses = getExpenses().filter(e => e.userId === userId && e.budgetMonth === prevMonthStr);
    const prevSpent = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const diff = totalSpent - prevSpent;
    const percentageChange = prevSpent > 0 ? parseFloat(((diff / prevSpent) * 100).toFixed(1)) : 0;

    const comparison = {
      previousMonth: prevMonthStr,
      previousMonthSpent: prevSpent,
      difference: diff,
      percentageChange,
      isHigher: diff > 0
    };

    return {
      budget,
      totalSpent,
      remaining,
      percentageUsed,
      remainingDays,
      recommendedDailyLimit,
      todaySpent: 0,
      isTodayExceeded: false,
      highestCategory,
      largestExpense,
      categoryBreakdown,
      recentTransactions,
      insights,
      comparison
    };
  }

  // 7. Insights History
  if (path === '/insights/history' && method === 'GET') {
    const months = [];
    const now = new Date();
    const budgets = getBudgets();
    const expenses = getExpenses();

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mName = d.toLocaleString('default', { month: 'short', year: 'numeric' });

      const bObj = budgets.find(b => 
        b.userId === userId && 
        (b.month === mStr || (b.year === y && b.monthNum === m))
      );
      const bAmt = bObj ? bObj.amount : 0;

      const mExpenses = expenses.filter(e => e.userId === userId && e.budgetMonth === mStr);
      const spent = mExpenses.reduce((sum, e) => sum + e.amount, 0);

      months.push({
        month: mStr,
        monthName: mName,
        budget: bAmt,
        spent,
        remaining: bAmt - spent,
        percentageUsed: bAmt > 0 ? (spent / bAmt) * 100 : 0
      });
    }

    return months.reverse();
  }

  // 8. Insights Category (supports /insights/category/:category and /insights/category?category=...)
  if (path.startsWith('/insights/category') && method === 'GET') {
    let targetCategory = params.category;
    if (!targetCategory) {
      const prefix = '/insights/category/';
      if (path.startsWith(prefix)) {
        targetCategory = decodeURIComponent(path.substring(prefix.length));
      }
    }

    const month = params.month || new Date().toISOString().substring(0, 7);
    const expenses = getExpenses().filter(
      e => e.userId === userId && 
           e.budgetMonth === month && 
           e.category && 
           (e.category.toLowerCase() === (targetCategory || '').toLowerCase() ||
            encodeURIComponent(e.category.toLowerCase()) === (targetCategory || '').toLowerCase())
    );
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const subGroups = {};
    expenses.forEach(e => {
      const name = (e.description || 'Other').trim();
      subGroups[name] = (subGroups[name] || 0) + e.amount;
    });

    const detailedBreakdown = Object.keys(subGroups).map(name => ({
      name,
      amount: subGroups[name],
      percentage: total > 0 ? parseFloat(((subGroups[name] / total) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      category: targetCategory,
      total,
      percentage: 100,
      detailedBreakdown,
      expenses
    };
  }

  throw Object.assign(new Error(`Endpoint ${path} not found.`), { status: 404 });
}

async function apiRequest(endpoint, options = {}) {
  // If file: protocol is used locally without any web server, fallback to client storage
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return handleClientStorage(endpoint, options);
  }

  // Attempt to reach configured backend API
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${API_BASE}${cleanEndpoint}`;

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.warn(`Non-JSON response received from ${targetUrl}:`, text.slice(0, 120));
      if (!response.ok) {
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw Object.assign(
            new Error('Backend server is spinning up or unavailable on Render. Please wait ~30 seconds and try again.'),
            { status: response.status }
          );
        }
        if (response.status === 404) {
          throw Object.assign(
            new Error(`Endpoint not found (404) at ${targetUrl}. Please verify your backend deployment URL.`),
            { status: 404 }
          );
        }
        throw Object.assign(
          new Error(`Server returned error (${response.status}). Please check your backend service.`),
          { status: response.status }
        );
      }
      return handleClientStorage(endpoint, options);
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network failure (CORS error, DNS error, server unreachable)
    console.warn(`Network error requesting ${targetUrl}:`, err.message);
    if (RAW_API_URL) {
      throw new Error(`Unable to connect to backend at ${RAW_API_URL}. The server may be asleep or waking up. Please wait 30 seconds and try again.`);
    }
    return handleClientStorage(endpoint, options);
  }
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options }),
};
