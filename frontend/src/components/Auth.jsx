import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, User, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Auth() {
  const { login, register, forgotPassword } = useContext(AuthContext);
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const toggleMode = (newMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const validateForm = () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (mode === 'forgot') {
      return true;
    }
    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('Please enter your name.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return false;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        await register(name, email, password);
      } else if (mode === 'forgot') {
        const response = await forgotPassword(email);
        setSuccessMsg(response.message || 'Password reset email sent! Check your inbox.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-card border border-slate-100 transition-all duration-300">
        
        {/* Title / Logo Area */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-brand-primary rounded-xl text-white mb-3">
            <ShieldCheck className="h-8 w-8 text-brand-teal" />
          </div>
          <h2 className="text-3xl font-extrabold text-brand-primary tracking-tight">
            PaisaTrack
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {mode === 'login' && 'Track. Analyze. Save. Manage hostel expenses.'}
            {mode === 'signup' && 'Create your free account and start tracking today.'}
            {mode === 'forgot' && 'Enter your email to receive a password reset link.'}
          </p>
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-medium">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Name field (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-brand-teal bg-slate-50/50 hover:bg-slate-50 transition-all text-sm font-medium"
                    placeholder="Rahul Sharma"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-brand-teal bg-slate-50/50 hover:bg-slate-50 transition-all text-sm font-medium"
                  placeholder="rahul@hostel.edu"
                />
              </div>
            </div>

            {/* Password Field (Login & Signup only) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => toggleMode('forgot')}
                      className="text-xs font-semibold text-brand-teal hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-brand-teal bg-slate-50/50 hover:bg-slate-50 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="mt-1 text-[11px] text-slate-500 font-medium">
                    Must be at least 6 characters.
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password Field (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-brand-teal bg-slate-50/50 hover:bg-slate-50 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-98"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Password Reset Link'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Mode Toggles */}
        <div className="text-center pt-2 border-t border-slate-100">
          {mode === 'login' && (
            <p className="text-sm text-slate-600 font-medium">
              Don't have an account?{' '}
              <button
                onClick={() => toggleMode('signup')}
                className="font-bold text-brand-teal hover:underline focus:outline-none"
              >
                Sign up
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p className="text-sm text-slate-600 font-medium">
              Already have an account?{' '}
              <button
                onClick={() => toggleMode('login')}
                className="font-bold text-brand-teal hover:underline focus:outline-none"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <p className="text-sm text-slate-600 font-medium">
              Remembered your password?{' '}
              <button
                onClick={() => toggleMode('login')}
                className="font-bold text-brand-teal hover:underline focus:outline-none"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>
        
      </div>
    </div>
  );
}
