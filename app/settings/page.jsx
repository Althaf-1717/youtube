'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Database,
  Shield,
  Download,
  Upload,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Youtube,
  User,
  Key,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import CSVModal from '@/components/CSVModal';
import { createClient } from '@/lib/supabase/client';
import { getProjects } from '@/lib/api/projects';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected' | 'unconfigured' | 'error'
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function checkState() {
      const supabase = createClient();
      if (!supabase) {
        setDbStatus('unconfigured');
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);

        const { data, error } = await getProjects();
        if (error) {
          setDbStatus('error');
        } else {
          setDbStatus('connected');
          setProjects(data || []);
        }
      } catch {
        setDbStatus('error');
      }
    }
    checkState();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      toastError(err.message || 'Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="pb-3 border-b border-[#DEDAD2]">
          <div className="flex items-center gap-2.5 mb-1">
            <Settings className="w-5 h-5 text-[#C96442]" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292825]">
              Library Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#77746D]">
            Manage channel configuration, database connectivity, and data backups.
          </p>
        </div>

        {/* Database Connection Card */}
        <div className="bg-white border border-[#DEDAD2] rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECEAE4]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#F7EBE6] text-[#C96442]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#292825]">
                  Supabase PostgreSQL Storage
                </h3>
                <p className="text-xs text-[#77746D]">
                  Permanent cloud database for project records and authentication
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
              {dbStatus === 'connected' && (
                <span className="flex items-center gap-1.5 text-[#2A7E3B] bg-[#EBF7EE] px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected ({projects.length} records)
                </span>
              )}
              {dbStatus === 'unconfigured' && (
                <span className="flex items-center gap-1.5 text-[#B85535] bg-[#FDF6F5] px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Credentials Missing
                </span>
              )}
              {dbStatus === 'checking' && (
                <span className="text-[#77746D] bg-[#ECEAE4] px-2.5 py-1 rounded-full">
                  Verifying...
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-[#77746D] space-y-2 leading-relaxed">
            <p>
              Your project database enforces an automatic numeric sort order, uniqueness checks on{' '}
              <code className="font-mono bg-[#FAF8F5] px-1 py-0.5 rounded border border-[#DEDAD2]">
                video_number
              </code>
              , and Row Level Security (RLS) guaranteeing that only authenticated admins can make changes.
            </p>
            <p className="font-mono text-[11px] bg-[#FAF8F5] p-3 rounded-xl border border-[#DEDAD2] text-[#292825]">
              Schema file located at: supabase/schema.sql
            </p>
          </div>
        </div>

        {/* Channel Information */}
        <div className="bg-white border border-[#DEDAD2] rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#ECEAE4]">
            <div className="p-2 rounded-xl bg-[#FDF6F5] text-[#C96442]">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#292825]">
                Channel Profile
              </h3>
              <p className="text-xs text-[#77746D]">
                Display branding for your YouTube creator hub
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#77746D] block mb-1">
                Channel Name
              </span>
              <p className="font-semibold text-[#292825]">ArhaStudio</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#77746D] block mb-1">
                Channel Handle
              </span>
              <p className="font-semibold text-[#292825]">@ArhaStudio</p>
            </div>
          </div>
        </div>

        {/* Data Backup & Migration */}
        <div className="bg-white border border-[#DEDAD2] rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECEAE4]">
            <div>
              <h3 className="text-base font-bold text-[#292825]">
                Data Portability & Backup
              </h3>
              <p className="text-xs text-[#77746D]">
                Export complete library or import projects via validated CSV
              </p>
            </div>
            <button
              onClick={() => setIsCSVModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7EBE6] text-[#C96442] hover:bg-[#F2DFD7] text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Open CSV Tools</span>
            </button>
          </div>
          <p className="text-xs text-[#77746D] leading-relaxed">
            You can download your entire video project catalog as a CSV at any time for offline preservation or import external spreadsheets without duplicate video numbers.
          </p>
        </div>

        {/* Administrator Account */}
        <div className="bg-white border border-[#DEDAD2] rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECEAE4]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#ECEAE4] text-[#292825]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#292825]">
                  Administrator Session
                </h3>
                <p className="text-xs text-[#77746D]">
                  Signed in as {currentUser?.email || 'Administrator'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#DEDAD2] hover:bg-[#FDF6F5] hover:text-[#C96442] hover:border-[#F8D8CF] text-xs font-medium text-[#77746D] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </main>

      <CSVModal
        isOpen={isCSVModalOpen}
        projects={projects}
        onClose={() => setIsCSVModalOpen(false)}
      />
    </div>
  );
}
