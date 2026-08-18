import React, { useState, useEffect, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import MonthlyAnalysis from './components/MonthlyAnalysis';
import MonthlyHistory from './components/MonthlyHistory';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { api } from './utils/api';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';

const CATEGORIES = [
  'Food', 'Transport', 'Study', 'Shopping', 'Entertainment',
  'Mobile/Recharge', 'Laundry', 'Health', 'Hostel', 'Other'
];

function MainAppContent() {
  const { user, loading } = useContext(AuthContext);
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // Selected month state in YYYY-MM format
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // Refresh trigger to reload summaries/transactions immediately on change
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // Add Expense Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Default selected month on load (restoring from localStorage if exists)
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    const savedMonth = localStorage.getItem('paisatrack_selected_month');
    if (savedMonth && /^\d{4}-\d{2}$/.test(savedMonth)) {
      setSelectedMonth(savedMonth);
    } else {
      setSelectedMonth(`${yyyy}-${mm}`);
    }
    setDate(`${yyyy}-${mm}-${dd}`); // Default today's date in YYYY-MM-DD
  }, []);

  // Save selectedMonth to localStorage whenever it changes
  useEffect(() => {
    if (selectedMonth) {
      localStorage.setItem('paisatrack_selected_month', selectedMonth);
    }
  }, [selectedMonth]);

  const openAddModal = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    
    // Default date to match the selected month to prevent expenses from disappearing from current view
    const today = new Date();
    const [selYear, selMonth] = selectedMonth.split('-');
    const yearNum = parseInt(selYear);
    const monthNum = parseInt(selMonth);
    
    // Calculate days in the selected month
    const daysInSelMonth = new Date(yearNum, monthNum, 0).getDate();
    // Use today's day if it fits in selected month, otherwise cap it at the last day (e.g. 28/30/31)
    const targetDay = Math.min(today.getDate(), daysInSelMonth);
    const formattedDay = String(targetDay).padStart(2, '0');
    
    setDate(`${selYear}-${selMonth}-${formattedDay}`);
    setNote('');
    setModalError(null);
    setAddModalOpen(true);
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setModalError('Amount must be a number greater than 0.');
      return;
    }
    if (!description.trim()) {
      setModalError('Description ("What did you spend on?") is required.');
      return;
    }
    if (!category) {
      setModalError('Please select a category.');
      return;
    }
    if (!date) {
      setModalError('Please enter a valid date.');
      return;
    }

    setModalLoading(true);
    try {
      await api.post('/expenses', {
        amount: parsedAmount,
        description: description.trim(),
        category,
        date,
        note: note.trim() || null
      });

      // Close modal and refresh active view
      setAddModalOpen(false);
      triggerRefresh();
    } catch (err) {
      setModalError(err.message || 'Failed to record expense. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-teal rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Validating secure session...</p>
      </div>
    );
  }

  // Not logged in -> Render Authentication forms
  if (!user) {
    return <Auth />;
  }

  // Logged in -> Render Main Dashboard Frame
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onAddExpenseClick={openAddModal} 
      />

      {/* Main content display area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 md:overflow-y-auto md:max-h-screen mb-16 md:mb-0">
        {selectedMonth && (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard 
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                refreshTrigger={refreshTrigger}
                triggerRefresh={triggerRefresh}
                onAddExpenseClick={openAddModal}
                setCurrentTab={setCurrentTab}
              />
            )}
            
            {currentTab === 'transactions' && (
              <Transactions 
                selectedMonth={selectedMonth}
                refreshTrigger={refreshTrigger}
                triggerRefresh={triggerRefresh}
                onAddExpenseClick={openAddModal}
              />
            )}

            {currentTab === 'analysis' && (
              <MonthlyAnalysis 
                selectedMonth={selectedMonth}
                refreshTrigger={refreshTrigger}
              />
            )}

            {currentTab === 'history' && (
              <MonthlyHistory 
                selectedMonth={selectedMonth}
                refreshTrigger={refreshTrigger}
              />
            )}

            {currentTab === 'settings' && (
              <Settings />
            )}
          </>
        )}
      </main>

      {/* Add Expense Form Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-brand-primary">Add New Expense</h3>
              <button 
                onClick={() => setAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
              
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
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="120"
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-brand-teal text-sm bg-slate-50"
                  placeholder="e.g. Dinner at mess / Auto fare"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Category *
                </label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-brand-teal text-sm bg-slate-50 cursor-pointer"
                />
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Optional Note
                </label>
                <textarea
                  rows="2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-brand-teal text-sm bg-slate-50 resize-none"
                  placeholder="e.g. Didn't eat at mess today"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-55"
                >
                  {modalLoading ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
