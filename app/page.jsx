'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Video,
  Hash,
  Clock,
  Sparkles,
  Download,
  RefreshCw,
  Zap,
  Film,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import SummaryCard from '@/components/SummaryCard';
import ProjectCard from '@/components/ProjectCard';
import ProjectTableRow from '@/components/ProjectTableRow';
import ProjectModal from '@/components/ProjectModal';
import UpcomingModal from '@/components/UpcomingModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import SearchBar from '@/components/SearchBar';
import SortAndFilter from '@/components/SortAndFilter';
import EmptyState from '@/components/EmptyState';
import CSVModal from '@/components/CSVModal';
import { getProjects, getDashboardStats } from '@/lib/api/projects';
import { useToast } from '@/components/Toast';
import { formatVideoNumber, formatDate, isValidUrl } from '@/lib/utils';

export default function DashboardPage() {
  const { error: toastError, info } = useToast();

  // State
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalShorts: 0,
    totalLong: 0,
    latestVideoNumber: 0,
    recentlyUpdatedCount: 0,
    validLinksCount: 0,
    recentlyAdded: [],
    recentlyUpdated: [],
  });

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [videoType, setVideoType] = useState('all'); // 'all' | 'shorts' | 'long'
  const [searchQuery, setSearchQuery] = useState('');
  const [exactNumber, setExactNumber] = useState(false);
  const [sortBy, setSortBy] = useState('video_number_asc'); // Default: Video Number: Low to High
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [statsResult, projectsResult] = await Promise.all([
        getDashboardStats(),
        getProjects({
          searchQuery,
          exactNumber,
          sortBy,
          videoType,
        }),
      ]);

      if (statsResult.error && !statsResult.allProjects) {
        console.warn('Supabase stats notice:', statsResult.error);
      } else {
        setStats(statsResult);
      }

      if (projectsResult.error) {
        console.warn('Projects fetch error:', projectsResult.error);
      } else {
        setProjects(projectsResult.data || []);
      }
    } catch (err) {
      toastError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, exactNumber, sortBy, videoType, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Enter on search input to open the first matching project
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && projects.length > 0) {
      const first = projects[0];
      if (first?.video_url && isValidUrl(first.video_url)) {
        info(`Opening Video ${first.video_number}: ${first.title}`);
        window.open(first.video_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setExactNumber(false);
    setSortBy('video_number_asc');
    setVideoType('all');
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenUpcomingModal={() => setIsUpcomingModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Main Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#DEDAD2]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292825]">
              Your Video Library
            </h1>
            <p className="text-sm text-[#77746D] mt-1 font-normal">
              Organize every YouTube project by Shorts and Long Videos.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCSVModalOpen(true)}
              className="p-2.5 rounded-xl border border-[#DEDAD2] bg-white text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] transition-colors shadow-subtle"
              title="CSV Backup & Import"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-[#DEDAD2] bg-white text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] transition-colors shadow-subtle disabled:opacity-50"
              title="Refresh projects"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C96442] hover:bg-[#B85535] text-white text-sm font-semibold transition-all shadow-subtle"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Dashboard Summary Cards */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Library Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <SummaryCard
              title="Total Projects"
              value={stats.totalProjects}
              subtitle="All registered video records"
              icon={Video}
            />
            <SummaryCard
              title="⚡ Shorts Section"
              value={stats.totalShorts}
              subtitle="Short-form vertical videos"
              icon={Zap}
              badge="Shorts"
              badgeColor="bg-[#FEF7EE] text-[#B45309]"
            />
            <SummaryCard
              title="🎬 Long Videos"
              value={stats.totalLong}
              subtitle="Standard horizontal videos"
              icon={Film}
              badge="Videos"
              badgeColor="bg-[#F0FDF4] text-[#15803D]"
            />
            <SummaryCard
              title="Latest Video Number"
              value={stats.latestVideoNumber ? `Video ${stats.latestVideoNumber}` : '—'}
              subtitle="Highest numbered project"
              icon={Hash}
              badge={stats.latestVideoNumber ? 'Latest' : null}
              badgeColor="bg-[#F7EBE6] text-[#C96442]"
            />
          </div>
        </section>

        {/* Upcoming Banner Shortcut */}
        <div className="bg-gradient-to-r from-[#FAF8F5] to-[#F7EBE6] border border-[#ECEAE4] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C96442] text-white flex items-center justify-center shadow-subtle">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#292825] text-sm sm:text-base">
                Upcoming Video Ideas & Planning
              </h3>
              <p className="text-xs text-[#77746D]">
                Draft prompts for voiceover and video editing before publishing to Projects.
              </p>
            </div>
          </div>
          <Link
            href="/upcoming"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#DEDAD2] text-[#292825] hover:text-[#C96442] hover:border-[#C96442] text-xs font-semibold transition-all self-start sm:self-auto"
          >
            <span>Open Upcoming Bar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Complete Projects Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#292825] tracking-tight">
                Project Archive
              </h2>
              <p className="text-xs text-[#77746D]">
                Sorted by video number in ascending order
              </p>
            </div>

            {/* Section Switcher Tabs */}
            <div className="inline-flex p-1 bg-[#ECEAE4] rounded-xl border border-[#DEDAD2] self-start sm:self-auto">
              <button
                onClick={() => setVideoType('all')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  videoType === 'all'
                    ? 'bg-white text-[#292825] shadow-sm'
                    : 'text-[#77746D] hover:text-[#292825]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All</span>
              </button>
              <button
                onClick={() => setVideoType('shorts')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  videoType === 'shorts'
                    ? 'bg-white text-[#292825] shadow-sm'
                    : 'text-[#77746D] hover:text-[#292825]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#B45309]" />
                <span>⚡ Shorts ({stats.totalShorts})</span>
              </button>
              <button
                onClick={() => setVideoType('long')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  videoType === 'long'
                    ? 'bg-white text-[#292825] shadow-sm'
                    : 'text-[#77746D] hover:text-[#292825]'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-[#15803D]" />
                <span>🎬 Long Videos ({stats.totalLong})</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            exactNumber={exactNumber}
            onExactNumberToggle={() => setExactNumber(!exactNumber)}
            onClear={() => setSearchQuery('')}
            onKeyDown={handleSearchKeyDown}
            totalResults={projects.length}
          />

          {/* Sort Bar */}
          <SortAndFilter
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Projects Display: Grid or List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-2xl bg-white border border-[#DEDAD2] p-6 animate-pulse space-y-4"
                >
                  <div className="h-5 w-20 bg-[#ECEAE4] rounded" />
                  <div className="h-6 w-3/4 bg-[#ECEAE4] rounded" />
                  <div className="h-14 w-full bg-[#ECEAE4] rounded" />
                  <div className="h-4 w-1/2 bg-[#ECEAE4] rounded" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              isSearch={Boolean(searchQuery)}
              searchQuery={searchQuery}
              onAddProject={() => setIsAddModalOpen(true)}
              onResetFilters={handleResetFilters}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={(p) => setEditingProject(p)}
                  onDelete={(p) => setDeletingProject(p)}
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
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4">Project Title</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <ProjectTableRow
                        key={project.id}
                        project={project}
                        onEdit={(p) => setEditingProject(p)}
                        onDelete={(p) => setDeletingProject(p)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Add Project Modal */}
      <ProjectModal
        isOpen={isAddModalOpen}
        defaultVideoType={videoType === 'long' ? 'long' : 'shorts'}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingProject)}
        project={deletingProject}
        onClose={() => setDeletingProject(null)}
        onDeleted={() => {
          loadData();
        }}
      />

      {/* CSV Backup & Import Modal */}
      <CSVModal
        isOpen={isCSVModalOpen}
        projects={projects}
        onClose={() => setIsCSVModalOpen(false)}
        onImportComplete={() => {
          loadData();
        }}
      />

      {/* Quick Create Upcoming Modal */}
      <UpcomingModal
        isOpen={isUpcomingModalOpen}
        defaultVideoType="shorts"
        onClose={() => setIsUpcomingModalOpen(false)}
      />
    </div>
  );
}
