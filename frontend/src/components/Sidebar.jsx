import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  CalendarDays,
  Settings,
  LogOut,
  Plus,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, onAddExpenseClick }) {
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: Receipt },
    { id: 'analysis', name: 'Analysis', icon: BarChart3 },
    { id: 'history', name: 'Monthly History', icon: CalendarDays },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-primary text-white min-h-screen border-r border-navy-800 shrink-0">
        
        {/* Logo / Header */}
        <div className="p-6 border-b border-navy-800 flex items-center gap-3">
          <div className="p-2 bg-navy-800 rounded-lg text-brand-teal">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-sans">PaisaTrack</h1>
            <span className="text-[10px] text-brand-teal font-bold uppercase tracking-wider">Hostel Budgeting</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-4 py-6">
          <button
            onClick={onAddExpenseClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-teal hover:bg-sky-400 text-brand-primary text-sm font-extrabold rounded-xl transition-all shadow-md active:scale-98"
          >
            <Plus className="h-5 w-5 stroke-[3px]" />
            Add Expense
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-teal/15 text-brand-teal border-l-4 border-brand-teal pl-3'
                    : 'text-slate-400 hover:bg-navy-800/50 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-brand-teal' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User Info / Logout */}
        {user && (
          <div className="p-4 border-t border-navy-800 bg-navy-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-brand-teal/20 text-brand-teal font-extrabold rounded-full flex items-center justify-center text-sm border border-brand-teal/30">
                {(user.name || user.email || 'User').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-100">{user.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user.email || ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-navy-800 hover:bg-red-500/10 hover:text-red-400 border border-navy-700/50 text-slate-300 text-xs font-bold rounded-lg transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation & Top Bar */}
      <div className="md:hidden flex flex-col shrink-0">
        
        {/* Mobile Top Bar */}
        <header className="bg-brand-primary text-white px-4 py-3 flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-teal" />
            <h1 className="text-lg font-bold">PaisaTrack</h1>
          </div>
          
          <button
            onClick={onAddExpenseClick}
            className="p-2 bg-brand-teal text-brand-primary rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all"
            aria-label="Add Expense"
          >
            <Plus className="h-5 w-5 stroke-[3px]" />
          </button>
        </header>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-brand-primary text-white border-t border-navy-800 z-50 flex justify-around py-1 shadow-2xl">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 text-[10px] font-bold transition-all duration-150 ${
                  isActive ? 'text-brand-teal' : 'text-slate-400'
                }`}
              >
                <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'scale-110 text-brand-teal' : ''}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
