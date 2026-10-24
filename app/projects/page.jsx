'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Download, RefreshCw, FolderKanban, Zap, Film, Layers } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ProjectCard from '@/components/ProjectCard';
import ProjectTableRow from '@/components/ProjectTableRow';
import ProjectModal from '@/components/ProjectModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import SearchBar from '@/components/SearchBar';
import SortAndFilter from '@/components/SortAndFilter';
import EmptyState from '@/components/EmptyState';
import CSVModal from '@/components/CSVModal';
import { getProjects } from '@/lib/api/projects';
import { useToast } from '@/components/Toast';
import { isValidUrl } from '@/lib/utils';

function ProjectsContent() {
  const searchParams = useSearchParams();
  const initialSort = searchParams.get('sort') || 'video_number_asc';
  const initialType = searchParams.get('type') || 'all';

  const { error: toastError, info } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Sorting
  const [videoType, setVideoType] = useState(initialType); // 'all' | 'shorts' | 'long'
  const [searchQuery, setSearchQuery] = useState('');
  const [exactNumber, setExactNumber] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await getProjects({
        searchQuery,
        exactNumber,
        sortBy,
        videoType,
      });

      if (res.error) {
        console.warn('Projects error:', res.error);
      } else {
        setProjects(res.data || []);
      }
    } catch (err) {
      toastError(err.message || 'Error loading projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, exactNumber, sortBy, videoType, toastError]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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
      <Sidebar onOpenAddModal={() => setIsAddModalOpen(true)} />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DEDAD2]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="w-5 h-5 text-[#C96442]" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292825]">
                Video Projects
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#77746D]">
              Organized by Shorts and Long Videos with exact numeric ordering and deep search.
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
              onClick={loadProjects}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-[#DEDAD2] bg-white text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] transition-colors shadow-subtle"
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

        {/* Section Tabs: Shorts vs Long Videos vs All */}
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
              <span>All Projects</span>
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
            </button>
          </div>

          <div className="text-xs text-[#77746D] font-medium self-end sm:self-auto">
            Showing <span className="font-semibold text-[#292825]">{projects.length}</span> videos
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

        {/* Projects View */}
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
      </main>

      <ProjectModal
        isOpen={isAddModalOpen}
        defaultVideoType={videoType === 'long' ? 'long' : 'shorts'}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadProjects()}
      />

      <ProjectModal
        isOpen={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSuccess={() => loadProjects()}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingProject)}
        project={deletingProject}
        onClose={() => setDeletingProject(null)}
        onDeleted={() => loadProjects()}
      />

      <CSVModal
        isOpen={isCSVModalOpen}
        projects={projects}
        onClose={() => setIsCSVModalOpen(false)}
        onImportComplete={() => loadProjects()}
      />
    </div>
  );
}

export default function AllProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center p-8">
          <div className="text-sm font-semibold text-[#77746D] animate-pulse">
            Loading project library...
          </div>
        </div>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}
