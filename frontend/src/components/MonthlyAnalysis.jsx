import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Trophy, TrendingUp, DollarSign, Calendar, 
  ArrowRight, Landmark, ArrowUpRight, ChevronRight, X 
} from 'lucide-react';

export default function MonthlyAnalysis({ selectedMonth, refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category breakdown details state
  const [activeCategory, setActiveCategory] = useState(null);
  const [catDetailData, setCatDetailData] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  // Fetch summary data
  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/insights/summary?month=${selectedMonth}`);
        setData(res);
        
        // Clear active category detail when month changes
        setActiveCategory(null);
        setCatDetailData(null);
      } catch (err) {
        console.error('Error fetching analysis summary:', err.message);
        setError('Failed to retrieve monthly analysis.');
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [selectedMonth, refreshTrigger]);

  // Fetch category breakdown details
  const fetchCategoryDetails = async (catName) => {
    setActiveCategory(catName);
    setCatLoading(true);
    try {
      const res = await api.get(`/insights/category/${encodeURIComponent(catName)}?month=${selectedMonth}`);
      setCatDetailData(res);
    } catch (err) {
      console.error('Error fetching category details:', err.message);
      alert('Failed to load details for category: ' + catName);
    } finally {
      setCatLoading(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-teal rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400">Analyzing monthly spending...</p>
      </div>
    );
  }

  const {
    budget = 0,
    totalSpent = 0,
    remaining = 0,
    percentageUsed = 0,
    highestCategory = null,
    largestExpense = null,
    categoryBreakdown = []
  } = data || {};

  const activeCategories = categoryBreakdown.filter(c => c.amount > 0);

  const [currentYear, currentMonth] = (selectedMonth || '2026-08').split('-');
  const monthName = new Date(parseInt(currentYear) || 2026, (parseInt(currentMonth) || 8) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">
          Monthly Spending Analysis
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Detailed metrics and insights for {monthName}.
        </p>
      </div>

      {budget === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-card text-center max-w-md mx-auto">
          <p className="text-slate-500 font-semibold text-sm">Please set a budget in the Dashboard to begin analysis.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          
          {/* Quick Metrics Grid */}
          <div className="order-1 lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-5 rounded-2xl shadow-card border border-slate-100">
            <div className="text-center sm:text-left border-r border-slate-100 last:border-0 pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Budget</span>
              <span className="text-base sm:text-lg font-black text-brand-primary block mt-1">{formatINR(budget)}</span>
            </div>
            <div className="text-center sm:text-left border-r border-slate-100 last:border-0 px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
              <span className="text-base sm:text-lg font-black text-brand-primary block mt-1">{formatINR(totalSpent)}</span>
            </div>
            <div className="text-center sm:text-left border-r border-slate-100 last:border-0 px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
              <span className="text-base sm:text-lg font-black text-brand-primary block mt-1">{formatINR(remaining)}</span>
            </div>
            <div className="text-center sm:text-left last:border-0 pl-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Utilization</span>
              <span className="text-base sm:text-lg font-black text-brand-primary block mt-1">{percentageUsed.toFixed(1)}%</span>
            </div>
          </div>

          {/* Biggest Category & Largest Expense Column (Right panel) */}
          <div className="order-2 lg:col-span-1 lg:col-start-3 lg:row-start-2 lg:row-span-2 space-y-6">
            {/* Widget 1: Highest Spending Category */}
            {highestCategory && (
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary text-white p-5 rounded-2xl shadow-card border border-navy-800 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10 group-hover:scale-110 transition-all duration-300">
                  <Trophy className="h-28 w-28" />
                </div>
                <div className="flex items-center gap-2 text-brand-teal font-extrabold text-xs uppercase tracking-wider mb-2">
                  <Trophy className="h-4.5 w-4.5 fill-brand-teal/10" />
                  🏆 Biggest Spending Category
                </div>
                <h3 className="text-2xl font-black">{highestCategory.category}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold">{formatINR(highestCategory.amount)}</span>
                  <span className="text-xs text-slate-300">({highestCategory.percentage}% of total)</span>
                </div>
              </div>
            )}

            {/* Widget 2: Largest Expense */}
            {largestExpense && (
              <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
                <div className="flex items-center gap-2 text-brand-orange font-bold text-xs uppercase tracking-wider mb-3">
                  <TrendingUp className="h-4.5 w-4.5" />
                  Largest Individual Expense
                </div>
                
                <h3 className="text-xl font-black text-brand-primary">{formatINR(largestExpense.amount)}</h3>
                <p className="text-sm font-bold text-slate-700 mt-1.5 truncate" title={largestExpense.description}>
                  {largestExpense.description}
                </p>
                
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-300">Category</span>
                    <span className="text-slate-600 block mt-0.5">{largestExpense.category}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-300">Date</span>
                    <span className="text-slate-600 block mt-0.5">
                      {new Date(largestExpense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Slide-in Details for Active Category Selection */}
            {activeCategory && (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4 transition-all">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-brand-primary">Category Detail</h3>
                    <p className="text-lg font-black text-brand-primary mt-0.5">{activeCategory}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveCategory(null);
                      setCatDetailData(null);
                    }}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {catLoading ? (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-teal rounded-full animate-spin"></div>
                    <p className="text-[10px] font-semibold text-slate-400">Loading sub-breakdown...</p>
                  </div>
                ) : catDetailData ? (
                  <div className="space-y-4">
                    
                    {/* Sum detail */}
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Total Spent:</span>
                      <span className="text-sm font-black text-brand-primary">{formatINR(catDetailData.total)}</span>
                    </div>

                    {/* Sub-group list (e.g. Dinner, Lunch) */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Item Breakdown</h4>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {catDetailData.detailedBreakdown.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-xs font-semibold py-1">
                            <span className="text-slate-700 truncate max-w-44" title={item.name}>{item.name}</span>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-slate-800">{formatINR(item.amount)}</span>
                              <span className="text-[10px] text-slate-400 font-bold block">{item.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Transactions list matching Category */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transactions</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {catDetailData.expenses.map((exp) => (
                          <div key={exp.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                            <div className="overflow-hidden pr-2">
                              <p className="font-bold text-slate-700 truncate">{exp.description}</p>
                              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                                {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {exp.note && ` • "${exp.note}"`}
                              </p>
                            </div>
                            <span className="font-black text-brand-primary shrink-0">{formatINR(exp.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : null}

              </div>
            )}
          </div>

          {/* Category Listing Card (Where did your money go) */}
          <div className="order-3 lg:col-span-2 lg:col-start-1 lg:row-start-2 bg-white p-5 rounded-2xl shadow-card border border-slate-100">
            <h3 className="text-lg font-extrabold text-brand-primary mb-4">
              Where Did Your Money Go?
            </h3>
            
            {activeCategories.length > 0 ? (
              <div className="space-y-3">
                {activeCategories.map((cat, idx) => (
                  <div 
                    key={cat.category}
                    onClick={() => fetchCategoryDetails(cat.category)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      activeCategory === cat.category 
                        ? 'bg-slate-50 border-brand-teal ring-2 ring-brand-teal/15'
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-400 bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{cat.category}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{cat.percentage}% of total spending</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-brand-primary">{formatINR(cat.amount)}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-400 text-sm font-medium">No expenses logged this month.</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
