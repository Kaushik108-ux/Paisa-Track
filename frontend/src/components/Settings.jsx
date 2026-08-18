import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  User, Mail, Calendar, Coins, Tags, 
  Paintbrush, LogOut, ShieldCheck, Check, AlertCircle 
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Food', 'Transport', 'Study', 'Shopping', 'Entertainment',
  'Mobile/Recharge', 'Laundry', 'Health', 'Hostel', 'Other'
];

export default function Settings() {
  const { user, logout } = useContext(AuthContext);
  const [theme, setTheme] = useState('Light'); // Default light theme
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">
          Settings
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Manage your account profile, preferences, and default configuration.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-bold flex items-center gap-2">
          <Check className="h-4.5 w-4.5 text-emerald-500 stroke-[3px]" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
          <h3 className="text-base font-extrabold text-brand-primary mb-4 flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-brand-teal" />
            User Profile
          </h3>
          
          {user && (
            <div className="space-y-4">
              {/* Name */}
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-50 items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                <span className="col-span-2 text-sm font-bold text-slate-700">{user.name}</span>
              </div>
              
              {/* Email */}
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-50 items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                <span className="col-span-2 text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {user.email}
                </span>
              </div>

              {/* Joined */}
              <div className="grid grid-cols-3 gap-2 py-3 items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Member Since</span>
                <span className="col-span-2 text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(user.created_at)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Currency Card */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
          <h3 className="text-base font-extrabold text-brand-primary mb-3 flex items-center gap-2">
            <Coins className="h-4.5 w-4.5 text-brand-teal" />
            Currency Configuration
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-semibold">
            Adjust the currency display formatting options.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Active Currency
              </label>
              <select 
                disabled
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 bg-slate-50 font-semibold cursor-not-allowed"
              >
                <option value="INR">₹ INR (Indian Rupee)</option>
              </select>
              <p className="text-[10px] text-slate-400 font-bold mt-1.5 leading-relaxed">
                * Primary currency is locked to INR matching Indian formatting (e.g. ₹1,25,000).
              </p>
            </div>
          </div>
        </div>

        {/* Default Categories Card */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
          <h3 className="text-base font-extrabold text-brand-primary mb-2 flex items-center gap-2">
            <Tags className="h-4.5 w-4.5 text-brand-teal" />
            Default Spending Categories
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-semibold">
            All transaction forms are preconfigured with the following categories:
          </p>
          
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map((cat) => (
              <span 
                key={cat}
                className="px-3.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-100 text-slate-600 rounded-xl"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Theme Preferences Card */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100">
          <h3 className="text-base font-extrabold text-brand-primary mb-3 flex items-center gap-2">
            <Paintbrush className="h-4.5 w-4.5 text-brand-teal" />
            Theme Preferences
          </h3>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => setTheme('Light')}
              className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                theme === 'Light'
                  ? 'bg-slate-50 border-brand-teal text-brand-primary ring-2 ring-brand-teal/15'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Light Slate (Default)
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme('Dark');
                alert('Dark mode toggle was clicked. Dark mode is simulated in theme settings, light slate theme is retained for the sleek fintech feel.');
              }}
              className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                theme === 'Dark'
                  ? 'bg-slate-50 border-brand-teal text-brand-primary ring-2 ring-brand-teal/15'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Dark Mode (Simulated)
            </button>
          </div>
        </div>

        {/* Action Button & Logout */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-2 py-3 px-5 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-extrabold rounded-xl transition-all"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out Account
          </button>

          <button
            type="submit"
            className="py-3 px-6 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-extrabold rounded-xl transition-all shadow-md active:scale-98"
          >
            Save Preferences
          </button>
        </div>

      </form>
    </div>
  );
}
