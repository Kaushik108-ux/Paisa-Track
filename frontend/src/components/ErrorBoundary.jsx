import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PaisaTrack Uncaught UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-4">
            <div className="inline-flex p-3.5 bg-red-50 text-red-600 rounded-2xl border border-red-100">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {this.state.error?.message || 'An unexpected error occurred while loading PaisaTrack.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
