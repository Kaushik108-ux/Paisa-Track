import React from 'react';
import { ShieldAlert, ExternalLink, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';

const REQUIRED_VARS = [
  { name: 'VITE_FIREBASE_API_KEY', desc: 'Firebase Web API Key' },
  { name: 'VITE_FIREBASE_AUTH_DOMAIN', desc: 'Firebase Auth Domain' },
  { name: 'VITE_FIREBASE_PROJECT_ID', desc: 'Firebase Project ID' },
  { name: 'VITE_FIREBASE_STORAGE_BUCKET', desc: 'Storage Bucket Domain' },
  { name: 'VITE_FIREBASE_MESSAGING_SENDER_ID', desc: 'Cloud Messaging Sender ID' },
  { name: 'VITE_FIREBASE_APP_ID', desc: 'Firebase Web App ID' },
];

export default function FirebaseSetupNotice() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10 space-y-6">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600 shrink-0">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">
              PaisaTrack Setup Required
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Your web app is deployed, but Firebase environment variables are not yet configured on GitHub Pages.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed font-medium space-y-1">
          <p className="font-bold text-slate-800">Why am I seeing this screen?</p>
          <p>
            For security, <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-800 font-mono">.env</code> files containing credentials are excluded from Git repository commits. When building for GitHub Pages, GitHub Actions requires these keys as Repository Secrets or Variables.
          </p>
        </div>

        {/* 3 Step Setup Guide */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
            Quick 3-Step Setup for GitHub Pages
          </h2>

          <div className="space-y-3">
            
            {/* Step 1 */}
            <div className="flex gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold shrink-0">
                1
              </span>
              <div className="text-xs space-y-1 text-slate-600">
                <p className="font-bold text-slate-800">Copy credentials from Firebase Console</p>
                <p>
                  Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-brand-teal font-bold hover:underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="h-3 w-3 inline" /></a> &gt; <strong>Project Settings</strong> &gt; <strong>Your apps</strong> &gt; Select your Web App.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold shrink-0">
                2
              </span>
              <div className="text-xs space-y-1 text-slate-600">
                <p className="font-bold text-slate-800">Add Variables to GitHub Repository</p>
                <p>
                  In your GitHub repository, go to <strong>Settings</strong> &gt; <strong>Secrets and variables</strong> &gt; <strong>Actions</strong> &gt; <strong>Variables</strong> tab (or Secrets tab) and add:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 font-mono text-[11px]">
                  {REQUIRED_VARS.map((v) => (
                    <div key={v.name} className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="h-3 w-3 text-brand-teal shrink-0" />
                      <span className="font-bold truncate">{v.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold shrink-0">
                3
              </span>
              <div className="text-xs space-y-1 text-slate-600">
                <p className="font-bold text-slate-800">Re-deploy GitHub Actions Workflow</p>
                <p>
                  Go to the <strong>Actions</strong> tab in your repository &gt; Select <strong>Deploy Vite site to Pages</strong> &gt; Click <strong>Run workflow</strong>.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium">
            Running locally? Place these in <code className="font-mono text-slate-600 font-bold">frontend/.env</code>.
          </span>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Check Again &amp; Reload
          </button>
        </div>

      </div>
    </div>
  );
}
