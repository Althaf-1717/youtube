'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    // Check if Supabase keys are configured
    const hasKeys =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      );
    setIsConfigured(hasKeys);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please enter both your administrator email and password.');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setAuthError(
        'Supabase is not configured yet. Please configure your .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        toastError(error.message);
        return;
      }

      if (data?.user) {
        success('Welcome back, Admin!');
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setAuthError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Monogram */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-[#C96442] flex items-center justify-center text-white font-bold text-lg shadow-subtle mb-3">
          AS
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#292825]">
          ArhaStudio
        </h1>
        <p className="text-sm text-[#77746D] mt-0.5">
          Video Project Library — Admin Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-[#DEDAD2] rounded-2xl shadow-card p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#292825] tracking-tight">
            Administrator Sign In
          </h2>
          <p className="text-xs text-[#77746D] mt-1">
            Access your secure YouTube video project repository
          </p>
        </div>

        {!isConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-[#FDF6F5] border border-[#F8D8CF] text-xs text-[#9B3A22] space-y-2">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Supabase Keys Required</span>
            </div>
            <p className="leading-relaxed">
              Copy <code className="bg-white/80 px-1 py-0.5 rounded font-mono">.env.example</code> to{' '}
              <code className="bg-white/80 px-1 py-0.5 rounded font-mono">.env.local</code> and fill in your Supabase project URL and anon key to connect your live database.
            </p>
          </div>
        )}

        {authError && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#FDF6F5] border border-[#F8D8CF] text-xs text-[#9B3A22] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-1.5"
            >
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77746D]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@arhastudio.com"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DEDAD2] bg-white text-sm hover:border-[#C4BFB5] transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77746D]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DEDAD2] bg-white text-sm hover:border-[#C4BFB5] transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#C96442] hover:bg-[#B85535] text-white text-sm font-semibold transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security badge footer */}
        <div className="mt-8 pt-5 border-t border-[#ECEAE4] flex items-center justify-center gap-2 text-xs text-[#77746D]">
          <ShieldCheck className="w-4 h-4 text-[#C96442]" />
          <span>Protected by Supabase Auth & Row Level Security</span>
        </div>
      </div>

      {/* Helpful developer guide */}
      <div className="mt-8 text-center text-xs text-[#77746D] max-w-sm">
        <p>
          Need to create your initial administrator account? Run the Supabase SQL script or invite your admin email in the Supabase Auth dashboard.
        </p>
      </div>
    </div>
  );
}
