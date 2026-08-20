import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Search, Filter, ArrowUpDown, Trash2, Edit3, 
  AlertTriangle, X 
} from 'lucide-react';

const CATEGORIES = [
  'Food', 'Transport', 'Study', 'Shopping', 'Entertainment',
  'Mobile/Recharge', 'Laundry', 'Health', 'Hostel', 'Other'
];

export default function Transactions({ 
  selectedMonth, 
  refreshTrigger, 
  triggerRefresh,
  onAddExpenseClick
}) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');
  
  // Delete confirmation modal states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit modal states
  const [editTarget, setEditTarget] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCat, setEditCat] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadExpenses() {
      setLoading(true);
      setError(null);
      try {
        let url = `/expenses?month=${selectedMonth}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
        
        const data = await api.get(url);
        if (isMounted) {
          setExpenses(data);
        }
      } catch (err) {
        console.error('Error fetching expenses:', err.message);
        if (isMounted) {
          setError('Could not load transaction history.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadExpenses();
    return () => {
      isMounted = false;
    };
  }, [selectedMonth, search, category, sortBy, sortOrder, refreshTrigger]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/expenses/${deleteTarget.id}`);
      setDeleteTarget(null);
      triggerRefresh(); // Refresh parent/dashboard values
    } catch (err) {
      alert(err.message || 'Failed to delete transaction.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    if (parseFloat(editAmount) <= 0 || !editDesc.trim() || !editCat || !editDate) {
      setEditError('Please fill in all mandatory fields with valid values.');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      await api.put(`/expenses/${editTarget.id}`, {
        amount: parseFloat(editAmount),
        description: editDesc,
        category: editCat,
        date: editDate,
        note: editNote
      });
      setEditTarget(null);
      triggerRefresh();
    } catch (err) {
      setEditError(err.message || 'Failed to update transaction.');
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (exp) => {
    setEditTarget(exp);
    setEditAmount(exp.amount.toString());
    setEditDesc(exp.description);
    setEditCat(exp.category);
    setEditDate(exp.date);
    setEditNote(exp.note || '');
    setEditError(null);
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Info */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">
          Transaction History
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Search, filter, and modify your logged expenses.
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-slate-100 space-y-4">
        
        {/* Search, Filter, Sort Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search food, rent..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:ring-2 focus:ring-brand-teal transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Filter className="h-4.5 w-4.5" />
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50/50 hover:border-slate-300 focus:outline-none transition-all cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Field */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <ArrowUpDown className="h-4.5 w-4.5" />
            </span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by);
                setSortOrder(order);
              }}
              className="block w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50/50 hover:border-slate-300 focus:outline-none transition-all cursor-pointer"
            >
              <option value="date-DESC">Date: Newest First</option>
              <option value="date-ASC">Date: Oldest First</option>
              <option value="amount-DESC">Amount: High to Low</option>
              <option value="amount-ASC">Amount: Low to High</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(search || category) && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
              }}
              className="px-4 py-2.5 text-sm font-semibold border border-dashed border-slate-200 hover:border-brand-teal hover:text-brand-teal text-slate-500 rounded-xl transition-all"
            >
              Clear Active Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-teal rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Searching transactions...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      ) : expenses.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center shadow-card max-w-xl mx-auto">
          <div className="inline-flex p-4 bg-slate-50 rounded-full text-slate-400 mb-4">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-brand-primary">No expenses recorded yet</h3>
          <p className="text-slate-500 mt-1.5 text-sm">
            {search || category 
              ? "We couldn't find any transactions matching your filters." 
              : "Start tracking your spending by adding your first expense."}
          </p>
          {(search || category) ? (
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
              }}
              className="mt-4 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={onAddExpenseClick}
              className="mt-4 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl text-xs transition-all"
            >
              + Add Expense
            </button>
          )}
        </div>
      ) : (
        /* Transaction list display */
        <div className="space-y-4">
          
          {/* Desktop Table view */}
          <div className="hidden md:block bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Expense</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-4 px-6 text-slate-400">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-4 px-6 text-brand-primary">
                      <div>
                        <p className="font-bold">{exp.description}</p>
                        {exp.note && (
                          <p className="text-xs text-slate-400 font-medium italic mt-0.5" title={exp.note}>
                            "{exp.note}"
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-navy-50 text-navy-600">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-brand-primary">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 text-slate-400 hover:text-brand-teal hover:bg-slate-100 rounded-lg transition-all"
                          title="Edit Expense"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          className="p-1.5 text-slate-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile responsive Cards view */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-3">
            {expenses.map((exp) => (
              <div key={exp.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between gap-3 hover:-translate-y-0.5 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <h4 className="text-sm font-bold text-slate-700 mt-1">{exp.description}</h4>
                    {exp.note && (
                      <p className="text-xs text-slate-400 italic mt-0.5">"{exp.note}"</p>
                    )}
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-navy-50 text-navy-600">
                    {exp.category}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <span className="text-base font-black text-brand-primary">{formatINR(exp.amount)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(exp)}
                      className="p-1.5 text-slate-400 hover:text-brand-teal rounded-lg hover:bg-slate-50 transition-all border border-slate-100"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(exp)}
                      className="p-1.5 text-slate-400 hover:text-brand-red rounded-lg hover:bg-red-50 transition-all border border-slate-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-brand-primary/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="inline-flex p-3.5 bg-red-50 text-brand-red rounded-full mb-3">
              <AlertTriangle className="h-6 w-6 stroke-[2.5px]" />
            </div>
            <h3 className="text-lg font-bold text-brand-primary">Delete Transaction?</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-brand-primary">"{deleteTarget.description}"</span> (₹{deleteTarget.amount})? 
              This action will recalculate all dashboard statistics.
            </p>
            <div className="flex gap-3 justify-center pt-5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-red hover:bg-red-600 rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-55"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-brand-primary">Edit Expense</h3>
              <button 
                onClick={() => setEditTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="block w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-brand-teal text-sm bg-slate-50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  What did you spend on? *
                </label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-brand-teal text-sm bg-slate-50"
                  placeholder="e.g. Dinner"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Category *
                </label>
                <select
                  required
                  value={editCat}
                  onChange={(e) => setEditCat(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 font-semibold focus:ring-2 focus:ring-brand-teal text-sm cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-brand-teal text-sm bg-slate-50 cursor-pointer"
                  />
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Optional Note
                </label>
                <textarea
                  rows="2"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-brand-teal text-sm bg-slate-50 resize-none"
                  placeholder="e.g. Didn't eat at mess today"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-55"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
