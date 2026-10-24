'use client';

import React from 'react';
import { LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SORT_OPTIONS = [
  { value: 'video_number_asc', label: 'Video Number: Low to High (Default)' },
  { value: 'video_number_desc', label: 'Video Number: High to Low' },
  { value: 'recent_added', label: 'Recently Added' },
  { value: 'recent_updated', label: 'Recently Updated' },
  { value: 'title_asc', label: 'Title: A–Z' },
];

export default function SortAndFilter({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <div className="text-xs text-[#77746D] font-medium hidden sm:block">
        Order by numeric video sequence or timeline
      </div>

      {/* Sort Dropdown & View Mode Switcher */}
      <div className="flex items-center gap-2.5 ml-auto">
        <div className="relative inline-flex items-center">
          <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 text-[#77746D] pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="pl-8 pr-7 py-2 bg-white border border-[#DEDAD2] rounded-xl text-xs font-medium text-[#292825] hover:border-[#C4BFB5] transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle: Grid vs List */}
        <div className="inline-flex items-center bg-white border border-[#DEDAD2] rounded-xl p-1 shadow-subtle">
          <button
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-[#ECEAE4] text-[#292825]'
                : 'text-[#77746D] hover:text-[#292825]'
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            title="List View"
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              viewMode === 'list'
                ? 'bg-[#ECEAE4] text-[#292825]'
                : 'text-[#77746D] hover:text-[#292825]'
            )}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
