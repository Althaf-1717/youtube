'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Plus,
  RefreshCw,
  Zap,
  Film,
  Layers,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import UpcomingCard from '@/components/UpcomingCard';
import UpcomingTableRow from '@/components/UpcomingTableRow';
import UpcomingModal from '@/components/UpcomingModal';
import DeleteUpcomingModal from '@/components/DeleteUpcomingModal';
import ProjectModal from '@/components/ProjectModal';
import { getUpcoming } from '@/lib/api/upcoming';
import { useToast } from '@/components/Toast';

function UpcomingContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const { error: toastError } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [videoType, setVideoType] = useState(initialType); // 'all' | 'shorts' | 'long'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Projects Modal (from Sidebar action)
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  const loadUpcoming = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await getUpcoming({
        videoType,
        searchQuery,
        sortBy: 'video_number_asc',
      });

      if (res.error) {
        console.warn('Upcoming fetch error:', res.error);
      } else {
        setItems(res.data || []);
      }
    } catch (err) {
      toastError(err.message || 'Error loading upcoming videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [videoType, searchQuery, toastError]);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  // Counts
  const shortsCount = items.filter((i) => i.video_type === 'shorts').length;
  const longCount = items.filter((i) => i.video_type === 'long').length;

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col lg:flex-row">
      <Sidebar onOpenAddModal={() => setIsAddProjectModalOpen(true)} />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DEDAD2]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-[#C96442]" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292825]">
                Upcoming Videos
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#77746D]">
              Plan and script your upcoming Shorts & Long videos. Submit directly to Projects when published.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadUpcoming}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-[#DEDAD2] bg-white text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] transition-colors shadow-subtle"
              title="Refresh upcoming"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C96442] hover:bg-[#B85535] text-white text-sm font-semibold transition-all shadow-subtle"
            >
              <Plus className="w-4 h-4" />
              <span>Create Upcoming</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs (Shorts, Long Videos, All) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex p-1 bg-[#ECEAE4] rounded-xl border border-[#DEDAD2]">
            <button
              onClick={() => setVideoType('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                videoType === 'all'
                  ? 'bg-white text-[#292825] shadow-sm'
                  : 'text-[#77746D] hover:text-[#292825]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Upcoming</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#FAF8F5] text-[#77746D]">
                {items.length}
              </span>
            </button>
            <button
              onClick={() => setVideoType('shorts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                videoType === 'shorts'
                  ? 'bg-white text-[#292825] shadow-sm'
                  : 'text-[#77746D] hover:text-[#292825]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#B45309]" />
              <span>⚡ Shorts</span>
              {videoType === 'all' && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#FAF8F5] text-[#77746D]">
                  {shortsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setVideoType('long')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                videoType === 'long'
                  ? 'bg-white text-[#292825] shadow-sm'
                  : 'text-[#77746D] hover:text-[#292825]'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#15803D]" />
              <span>🎬 Long Videos</span>
              {videoType === 'all' && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#FAF8F5] text-[#77746D]">
                  {longCount}
                </span>
              )}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-all ${
                viewMode === 'grid'
                  ? 'bg-white border-[#C96442] text-[#C96442] shadow-sm'
                  : 'border-[#DEDAD2] text-[#77746D] hover:bg-[#FAF8F5]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-all ${
                viewMode === 'list'
                  ? 'bg-white border-[#C96442] text-[#C96442] shadow-sm'
                  : 'border-[#DEDAD2] text-[#77746D] hover:bg-[#FAF8F5]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#77746D] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search upcoming ideas by number, title, audio prompt, or edit notes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DEDAD2] bg-white text-sm focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] transition-all"
          />
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-white border border-[#DEDAD2] p-6 animate-pulse space-y-4"
              >
                <div className="h-5 w-20 bg-[#ECEAE4] rounded" />
                <div className="h-6 w-3/4 bg-[#ECEAE4] rounded" />
                <div className="h-16 w-full bg-[#ECEAE4] rounded" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-[#DEDAD2] rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F7EBE6] text-[#C96442] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#292825]">No upcoming videos planned yet</h3>
              <p className="text-sm text-[#77746D] max-w-md mx-auto mt-1">
                {searchQuery
                  ? `No ideas matching "${searchQuery}". Try a different search.`
                  : 'Start drafting your next YouTube Shorts or Long video ideas with voiceover and edit prompts.'}
              </p>
            </div>
            <div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C96442] text-white text-sm font-semibold hover:bg-[#B85535] transition-all shadow-subtle"
              >
                <Plus className="w-4 h-4" />
                <span>Create Upcoming Idea</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <UpcomingCard
                key={item.id}
                item={item}
                onEdit={(i) => setEditingItem(i)}
                onDelete={(i) => setDeletingItem(i)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#DEDAD2] rounded-2xl overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#ECEAE4] text-[11px] font-bold uppercase tracking-wider text-[#77746D]">
                    <th className="py-3 px-4">Video</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Title & Prompts</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Target Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <UpcomingTableRow
                      key={item.id}
                      item={item}
                      onEdit={(i) => setEditingItem(i)}
                      onDelete={(i) => setDeletingItem(i)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create Upcoming Modal */}
      <UpcomingModal
        isOpen={isCreateModalOpen}
        defaultVideoType={videoType === 'long' ? 'long' : 'shorts'}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadUpcoming()}
      />

      {/* Edit / Submit Upcoming Modal */}
      <UpcomingModal
        isOpen={Boolean(editingItem)}
        upcomingItem={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={() => loadUpcoming()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteUpcomingModal
        isOpen={Boolean(deletingItem)}
        upcomingItem={deletingItem}
        onClose={() => setDeletingItem(null)}
        onDeleted={() => loadUpcoming()}
      />

      {/* Add Project Modal for Sidebar action */}
      <ProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
      />
    </div>
  );
}

export default function UpcomingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center p-8">
          <div className="text-sm font-semibold text-[#77746D] animate-pulse">
            Loading upcoming videos...
          </div>
        </div>
      }
    >
      <UpcomingContent />
    </Suspense>
  );
}
