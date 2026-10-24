'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './Toast';

export default function Sidebar({ onOpenAddModal }) {
  const pathname = usePathname();
  const router = useRouter();
  const { success, error } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch (err) {
      error(err.message || 'Error signing out');
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      label: 'All Projects',
      href: '/projects',
      icon: FolderKanban,
      active: pathname === '/projects' && !pathname.includes('recent'),
    },
    {
      label: 'Add New Project',
      action: () => {
        if (onOpenAddModal) {
          onOpenAddModal();
        } else {
          router.push('/projects/new');
        }
        setMobileOpen(false);
      },
      icon: PlusCircle,
      isButton: true,
      highlight: true,
    },
    {
      label: 'Recently Updated',
      href: '/projects?sort=recent_updated',
      icon: Clock,
      active: pathname === '/projects' && typeof window !== 'undefined' && window.location.search.includes('recent_updated'),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3.5 bg-[#FFFFFF] border-b border-[#DEDAD2]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C96442] flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-subtle">
            AS
          </div>
          <div>
            <span className="font-semibold text-base text-[#292825] tracking-tight">ArhaStudio</span>
            <span className="block text-[11px] text-[#77746D] leading-none">Video Library</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#292825]/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#FFFFFF] border-r border-[#DEDAD2] flex flex-col justify-between transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#DEDAD2]">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C96442] group-hover:bg-[#B85535] transition-colors flex items-center justify-center text-white font-semibold text-base shadow-subtle">
              AS
            </div>
            <div>
              <h1 className="font-semibold text-lg text-[#292825] tracking-tight group-hover:text-[#C96442] transition-colors">
                ArhaStudio
              </h1>
              <p className="text-xs text-[#77746D] font-normal">Video Project Library</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            if (item.isButton) {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#C96442] bg-[#F7EBE6] hover:bg-[#F2DFD7] transition-all duration-150 mb-3"
                >
                  <Icon className="w-4 h-4 text-[#C96442]" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={index}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  item.active
                    ? 'bg-[#ECEAE4] text-[#292825] font-semibold'
                    : 'text-[#77746D] hover:text-[#292825] hover:bg-[#F5F3EE]'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4',
                    item.active ? 'text-[#C96442]' : 'text-[#77746D]'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User & Logout Footer */}
        <div className="p-4 border-t border-[#DEDAD2] space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-[#ECEAE4] border border-[#DEDAD2] flex items-center justify-center text-xs font-semibold text-[#292825]">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#292825] truncate">Administrator</p>
              <p className="text-[11px] text-[#77746D] truncate">ArhaStudio Channel</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-[#77746D] hover:text-[#C96442] hover:bg-[#F7EBE6] transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
