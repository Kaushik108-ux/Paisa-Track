import React, { useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { 
  IndianRupee, TrendingUp, AlertTriangle, Lightbulb, 
  Edit2, Calendar, CheckCircle2, ChevronRight, Info
} from 'lucide-react';

// Color map for categories
const CATEGORY_COLORS = {
  Food: '#f87171',         // Red/Rose
  Transport: '#60a5fa',    // Blue
  Study: '#34d399',        // Emerald
  Shopping: '#fbbf24',      // Amber
  Entertainment: '#a78bfa',  // Purple
  'Mobile/Recharge': '#f472b6', // Pink
  Laundry: '#fb7185',      // Rose
  Health: '#fb923c',       // Orange
  Hostel: '#2dd4bf',       // Teal
  Other: '#94a3b8'         // Slate
};

export default function Dashboard({ 
  selectedMonth, 
  setSelectedMonth, 
  refreshTrigger, 
  triggerRefresh,
  onAddExpenseClick, 
  setCurrentTab 
}) {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => selectedMonth ? parseInt(selectedMonth.split('-')[0]) : 2026);

  // Fetch summary metrics
  useEffect(() => {
    let isMounted = true;
    async function fetchSummary() {
      setLoading(true);
      try {
        const summaryData = await api.get(`/insights/summary?month=${selectedMonth}`);
        if (isMounted) {
          setData(summaryData);
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [selectedMonth, refreshTrigger]);

  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!newBudget || parseFloat(newBudget) < 0) return;

    setBudgetSubmitting(true);
    try {
      const [year, month] = selectedMonth.split('-');
      await api.post('/budgets', {
        month: parseInt(month),
        year: parseInt(year),
        amount: parseFloat(newBudget)
      });
      setBudgetModalOpen(false);
      triggerRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update budget.');
    } finally {
      setBudgetSubmitting(false);
    }
  };

  // Indian currency formatter helper
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Dynamic time-based welcome message
  const getGreetingText = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return 'Good morning';
    if (hr >= 12 && hr < 17) return 'Good afternoon';
    if (hr >= 17 && hr < 21) return 'Good evening';
    return 'Good night';
  };

  const getGreetingEmoji = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return '☀️';
    if (hr >= 12 && hr < 17) return '🌤️';
    if (hr >= 17 && hr < 21) return '🌆';
    return '🌙';
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-navy-700 border-t-brand-teal rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  const {
    budget = 0,
    totalSpent = 0,
    remaining = 0,
    percentageUsed = 0,
    recommendedDailyLimit = 0,
    isTodayExceeded = false,
    categoryBreakdown = [],
    insights = [],
    largestExpense = null,
    todaySpent = 0
  } = data || {};

  // Status mapping
  let budgetStatus = 'Normal';
  let progressColor = 'bg-brand-green';
  let textThemeColor = 'text-brand-green';

  if (percentageUsed >= 100) {
    budgetStatus = 'Exceeded';
    progressColor = 'bg-brand-red';
    textThemeColor = 'text-brand-red';
  } else if (percentageUsed >= 85) {
    budgetStatus = 'Critical';
    progressColor = 'bg-brand-orange';
    textThemeColor = 'text-brand-orange';
  } else if (percentageUsed >= 70) {
    budgetStatus = 'Warning';
    progressColor = 'bg-brand-yellow';
    textThemeColor = 'text-brand-yellow';
  }

  const chartData = categoryBreakdown
    .filter(cat => cat.amount > 0)
    .map(cat => ({
      name: cat.category,
      value: cat.amount,
      color: CATEGORY_COLORS[cat.category] || '#94a3b8'
    }));

  const [currentYear, currentMonth] = (selectedMonth || '2026-08').split('-');
  const selectedMonthDate = new Date(parseInt(currentYear) || 2026, (parseInt(currentMonth) || 8) - 1, 1);
  const monthName = selectedMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">
            {getGreetingText()}{user && user.name ? `, ${user.name.split(' ')[0]}` : ''}! {getGreetingEmoji()}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Here's your spending overview for {monthName}.
          </p>
        </div>
        
        {/* Month Calendar Picker */}
        <div className="relative">
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-semibold cursor-pointer shadow-sm focus:outline-none transition-all duration-200"
          >
            <Calendar className="h-4.5 w-4.5 text-brand-teal" />
            <span>{monthName}</span>
          </button>

          {pickerOpen && (
            <>
              {/* Overlay Backdrop to close picker */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setPickerOpen(false)}
              ></div>

              {/* Picker Popover Card */}
              <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-64 z-50 transition-all duration-200">
                
                {/* Header: Year Selector */}
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev - 1)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 font-extrabold transition-all text-xs"
                    title="Previous Year"
                  >
                    &lt;
                  </button>
                  <span className="font-extrabold text-sm text-brand-primary tracking-wide">
                    {pickerYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerYear(prev => prev + 1)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 font-extrabold transition-all text-xs"
                    title="Next Year"
                  >
                    &gt;
                  </button>
                </div>

                {/* Grid: 12 Month buttons */}
                <div className="grid grid-cols-3 gap-1.5">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mName, idx) => {
                    const mVal = String(idx + 1).padStart(2, '0');
                    const keyVal = `${pickerYear}-${mVal}`;
                    const isSelected = selectedMonth === keyVal;
                    
                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => {
                          setSelectedMonth(keyVal);
                          setPickerOpen(false);
                        }}
                        className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all duration-150 ${
                          isSelected
                            ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                        }`}
                      >
                        {mName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Empty Budget State */}
      {budget === 0 && !loading && (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-card">
          <div className="inline-flex p-4 bg-navy-50 rounded-full text-brand-primary mb-4">
            <IndianRupee className="h-8 w-8 text-brand-teal" />
          </div>
          <h3 className="text-xl font-bold text-brand-primary">No budget set for {monthName}</h3>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            Set your monthly spending limit to begin tracking expenses, analyzing categories, and getting automated budget notifications.
          </p>
          <button
            onClick={() => {
              setNewBudget('');
              setBudgetModalOpen(true);
            }}
            className="mt-5 px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98"
          >
            Set Budget
          </button>
        </div>
      )}

      {budget > 0 && (
        <>
          {/* Budget Warnings / Banners */}
          {percentageUsed >= 100 && (
            <div className="flex items-start gap-4 p-5 bg-red-50 text-red-800 rounded-2xl border border-red-100 shadow-sm">
              <div className="p-2.5 bg-red-500 text-white rounded-xl shadow-sm shrink-0">
                <AlertTriangle className="h-6 w-6 stroke-[2.5px]" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-base tracking-tight uppercase">⚠️ Budget Exceeded</h4>
                <p className="text-sm mt-1 leading-relaxed text-red-700 font-medium">
                  You have spent <span className="font-bold">{formatINR(totalSpent)}</span> out of your <span className="font-bold">{formatINR(budget)}</span> monthly budget. 
                  You are <span className="font-extrabold">{formatINR(totalSpent - budget)}</span> over your spending limit. Consider freezing unnecessary costs immediately.
                </p>
              </div>
            </div>
          )}

          {percentageUsed >= 85 && percentageUsed < 100 && (
            <div className="flex items-start gap-4 p-5 bg-orange-50 text-orange-800 rounded-2xl border border-orange-100 shadow-sm">
              <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-sm shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-base uppercase">🟠 Critical Budget Warning</h4>
                <p className="text-sm mt-1 leading-relaxed text-orange-700 font-medium">
                  You have used <span className="font-bold">{percentageUsed.toFixed(1)}%</span> of your monthly budget. 
                  You only have <span className="font-bold">{formatINR(remaining)}</span> remaining. Try to postpone non-essential shopping.
                </p>
              </div>
            </div>
          )}

          {percentageUsed >= 70 && percentageUsed < 85 && (
            <div className="flex items-start gap-4 p-5 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 shadow-sm">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm shrink-0">
                <Info className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-base uppercase">🟡 Budget Warning</h4>
                <p className="text-sm mt-1 leading-relaxed text-amber-700 font-medium">
                  You have used <span className="font-bold">{percentageUsed.toFixed(1)}%</span> of your monthly budget. Ensure you track your final expenses carefully.
                </p>
              </div>
            </div>
          )}

          {/* Top Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Budget */}
            <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Budget</span>
                <button 
                  onClick={() => {
                    setNewBudget(budget.toString());
                    setBudgetModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-brand-teal rounded-lg hover:bg-slate-50 transition-all"
                  title="Edit Budget"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3">
                <h3 className="text-lg sm:text-2xl font-black text-brand-primary">{formatINR(budget)}</h3>
                <span className="text-xs text-brand-teal font-semibold mt-1 inline-flex items-center gap-1">
                  Active Limit
                </span>
              </div>
            </div>

            {/* Card 2: Spent */}
            <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Spent</span>
              <div className="mt-3">
                <h3 className="text-lg sm:text-2xl font-black text-brand-primary">{formatINR(totalSpent)}</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 inline-flex items-center gap-1">
                  Across all categories
                </span>
              </div>
            </div>

            {/* Card 3: Remaining */}
            <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining</span>
              <div className="mt-3">
                <h3 className={`text-lg sm:text-2xl font-black ${remaining >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                  {remaining < 0 ? `-${formatINR(Math.abs(remaining))}` : formatINR(remaining)}
                </h3>
                <span className="text-xs text-slate-500 font-medium mt-1">
                  {remaining >= 0 ? 'Available limit' : 'Over limit'}
                </span>
              </div>
            </div>

            {/* Card 4: Used % */}
            <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Budget Used</span>
              <div className="mt-3 flex items-baseline gap-2">
                <h3 className={`text-lg sm:text-2xl font-black ${textThemeColor}`}>
                  {percentageUsed.toFixed(1)}%
                </h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ({budgetStatus})
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar Component */}
          <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              <span>Budget Usage Progress</span>
              <span className={textThemeColor}>{percentageUsed.toFixed(1)}% used</span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
              <div 
                className={`h-full ${progressColor} transition-all duration-500`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Charts & Recommended Spend Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Donut & Bar Charts (takes 2/3 cols) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Category Spending Breakdown Chart card */}
              <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
                <h3 className="text-lg font-bold text-brand-primary mb-5 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-teal" />
                  Category Spending Breakdown
                </h3>
                
                {chartData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    
                    {/* Donut Chart container */}
                    <div className="h-64 flex justify-center items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatINR(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart Custom Legend Grid */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {categoryBreakdown
                        .filter(cat => cat.amount > 0)
                        .map((cat) => (
                          <div 
                            key={cat.category}
                            onClick={() => setCurrentTab('analysis')}
                            className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3.5 h-3.5 rounded-full inline-block shrink-0" 
                                style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#94a3b8' }}
                              ></span>
                              <span className="text-sm font-semibold text-slate-700">{cat.category}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-brand-primary">{formatINR(cat.amount)}</p>
                              <p className="text-[10px] font-bold text-slate-400">{cat.percentage}%</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <p className="text-sm font-medium">No spending data to display chart.</p>
                  </div>
                )}
              </div>

              {/* Bar Chart comparison */}
              {chartData.length > 0 && (
                <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
                  <h3 className="text-lg font-bold text-brand-primary mb-5 flex items-center gap-2">
                    <BarChart3Icon className="h-5 w-5 text-brand-teal" />
                    Category Spending Comparison (₹)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                        <Tooltip formatter={(value) => formatINR(value)} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column details (takes 1/3 col) */}
            <div className="space-y-6">
              
              {/* Recommended Daily Spending Limit card */}
              <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Daily Spending</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <h3 className="text-2xl font-black text-brand-primary">
                    {recommendedDailyLimit > 0 ? `${formatINR(recommendedDailyLimit)}` : '₹0'}
                  </h3>
                  <span className="text-xs font-bold text-slate-400">/day</span>
                </div>
                
                {/* Dynamic alert indicator based on today's spending */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-slate-500">Spent Today:</span>
                    <span className="text-slate-800 font-bold">{formatINR(todaySpent)}</span>
                  </div>
                  
                  {isTodayExceeded ? (
                    <div className="mt-2.5 flex items-start gap-2 p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs font-medium leading-relaxed">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 stroke-[2.5px]" />
                      <span>⚠️ You spent more than your recommended daily limit today. Keep an eye on secondary costs.</span>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-start gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-medium leading-relaxed">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>You are within your recommended daily budget today. Keep it up!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Smart Spending Insights card */}
              <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
                <h3 className="text-base font-bold text-brand-primary mb-4 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-brand-yellow fill-brand-yellow/10" />
                  Smart Insights
                </h3>
                
                <div className="space-y-3">
                  {insights.length > 0 ? (
                    insights.map((insight, idx) => (
                      <div key={idx} className="flex gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 leading-relaxed transition-all hover:bg-slate-100/50">
                        <Info className="h-4 w-4 shrink-0 text-brand-teal" />
                        <span>{insight}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                      No insights available. Record more transactions to unlock insights.
                    </div>
                  )}
                </div>
              </div>

              {/* Largest Individual Expense card */}
              {largestExpense && (
                <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Largest Expense This Month
                  </span>
                  <div className="flex justify-between items-start mt-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 truncate max-w-44" title={largestExpense.description}>
                        {largestExpense.description}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        Category: {largestExpense.category} | {new Date(largestExpense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-brand-primary">{formatINR(largestExpense.amount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick links to Recent Transactions */}
              <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-extrabold text-brand-primary">Recent Transactions</h3>
                  <button 
                    onClick={() => setCurrentTab('transactions')}
                    className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-0.5"
                  >
                    View All
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                {data.expenses && data.expenses.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {data.expenses.slice(0, 4).map((exp) => (
                      <div key={exp.id} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                        <div className="overflow-hidden pr-2">
                          <p className="text-xs font-bold text-slate-700 truncate">{exp.description}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            {exp.category} • {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <span className="text-xs font-black text-brand-primary shrink-0">{formatINR(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    No transactions recorded.
                    <button 
                      onClick={onAddExpenseClick}
                      className="text-brand-teal font-bold hover:underline block mx-auto mt-2"
                    >
                      Add First Expense
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </>
      )}

      {/* Set Budget Modal */}
      {budgetModalOpen && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-brand-primary mb-2">Set Budget for {monthName}</h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Please enter your spending budget limit in Rupees.
            </p>
            <form onSubmit={handleSetBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Budget Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="8000"
                    className="block w-full pl-8 pr-3 py-3 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-brand-teal text-sm bg-slate-50"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={budgetSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-55"
                >
                  {budgetSubmitting ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline fallback icon for comparison bar chart
function BarChart3Icon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
