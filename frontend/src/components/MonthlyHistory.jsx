import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { History, TrendingUp, TrendingDown, Info } from 'lucide-react';

export default function MonthlyHistory({ selectedMonth, refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSummary, setActiveSummary] = useState(null);

  // Fetch 6-month history and selected month comparison details
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const historyData = await api.get('/insights/history');
        setHistory(historyData);
        
        const summaryData = await api.get(`/insights/summary?month=${selectedMonth}`);
        setActiveSummary(summaryData);
      } catch (err) {
        console.error('Error fetching historical comparisons:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedMonth, refreshTrigger]);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-teal rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400">Loading historical data...</p>
      </div>
    );
  }

  const { comparison = {} } = activeSummary || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">
          Monthly Comparison
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Compare your spending habits and budget targets over the last six months.
        </p>
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Area - Comparison Trends Charts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Spending vs Budget Trend Card */}
            <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
              <h3 className="text-lg font-extrabold text-brand-primary mb-5 flex items-center gap-2">
                <History className="h-5 w-5 text-brand-teal" />
                Spending vs Budget Trends
              </h3>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={history}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="monthName" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <Tooltip formatter={(value) => formatINR(value)} />
                    <Legend verticalAlign="top" height={36} />
                    <Area name="Spent" type="monotone" dataKey="spent" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpent)" />
                    <Area name="Budget" type="monotone" dataKey="budget" stroke="#1d354c" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorBudget)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List of historical months */}
            <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
              <h3 className="text-sm font-extrabold text-brand-primary mb-4">Historical Summary Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Month</th>
                      <th className="pb-3 px-3 text-right">Budget</th>
                      <th className="pb-3 px-3 text-right">Spent</th>
                      <th className="pb-3 px-3 text-right">Remaining</th>
                      <th className="pb-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-slate-600 divide-y divide-slate-50">
                    {history.map((h) => {
                      const pct = h.budget > 0 ? (h.spent / h.budget) * 100 : 0;
                      let badge = 'text-brand-green bg-emerald-50 border border-emerald-100';
                      let statusText = 'Normal';
                      
                      if (pct >= 100) {
                        badge = 'text-brand-red bg-red-50 border border-red-100';
                        statusText = 'Exceeded';
                      } else if (pct >= 85) {
                        badge = 'text-brand-orange bg-orange-50 border border-orange-100';
                        statusText = 'Critical';
                      } else if (pct >= 70) {
                        badge = 'text-brand-yellow bg-amber-50 border border-amber-100';
                        statusText = 'Warning';
                      }

                      return (
                        <tr key={h.monthKey} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-3 font-bold text-slate-700">{h.monthName} {h.year}</td>
                          <td className="py-3.5 px-3 text-right">{h.budget > 0 ? formatINR(h.budget) : 'Not Set'}</td>
                          <td className="py-3.5 px-3 text-right font-bold text-slate-800">{formatINR(h.spent)}</td>
                          <td className="py-3.5 px-3 text-right font-bold">
                            {h.budget > 0 ? (
                              <span className={h.remaining >= 0 ? 'text-slate-700' : 'text-brand-red'}>
                                {formatINR(h.remaining)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {h.budget > 0 ? (
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold ${badge}`}>
                                {statusText}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold italic">No Budget</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column - Comparison Insights Card */}
          <div className="space-y-6">
            
            {/* Compare Metrics Widget */}
            <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 space-y-4">
              <h3 className="text-base font-extrabold text-brand-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-teal" />
                MoM Comparison Insights
              </h3>

              {comparison.comparisonText ? (
                <div className="space-y-4 pt-2">
                  
                  {/* Delta indicator */}
                  <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                    comparison.difference > 0 
                      ? 'bg-rose-50 border-rose-100 text-rose-800' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  }`}>
                    {comparison.difference > 0 ? (
                      <TrendingUp className="h-6 w-6 shrink-0 text-brand-red stroke-[2.5px]" />
                    ) : (
                      <TrendingDown className="h-6 w-6 shrink-0 text-brand-green stroke-[2.5px]" />
                    )}
                    <div>
                      <p className="text-xs font-bold leading-relaxed">{comparison.comparisonText}</p>
                    </div>
                  </div>

                  {/* Category Shift Text */}
                  {comparison.categoryComparisonText && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <Info className="h-5 w-5 text-brand-teal shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-extrabold text-brand-primary uppercase tracking-wider">Category Change Alert</h4>
                        <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
                          {comparison.categoryComparisonText}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Simple Help Text */}
                  <div className="text-[11px] text-slate-400 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                    Calculations compare totals between your currently selected month ({selectedMonth}) and the immediately preceding calendar month ({comparison.prevMonth}).
                  </div>

                </div>
              ) : (
                <p className="text-xs text-slate-400 font-semibold py-4 text-center">
                  Not enough historical data to generate comparison insights. Add expenses in consecutive months.
                </p>
              )}

            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-card text-center max-w-md mx-auto">
          <p className="text-slate-500 font-semibold text-sm">No historical data available. Start tracking to see comparisons.</p>
        </div>
      )}

    </div>
  );
}
