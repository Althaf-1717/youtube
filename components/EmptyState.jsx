'use client';

import React from 'react';
import { Video, Search, PlusCircle, RotateCcw } from 'lucide-react';

export default function EmptyState({
  isSearch = false,
  searchQuery = '',
  onAddProject,
  onResetFilters,
}) {
  if (isSearch) {
    return (
      <div className="bg-white border border-[#DEDAD2] rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto shadow-subtle">
        <div className="w-12 h-12 rounded-2xl bg-[#F7EBE6] text-[#C96442] flex items-center justify-center mx-auto mb-4 border border-[#F1D7CE]">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#292825] tracking-tight mb-1">
          No matching projects found
        </h3>
        <p className="text-sm text-[#77746D] leading-relaxed mb-6">
          We couldn&apos;t find any video project matching &ldquo;
          <span className="font-semibold text-[#292825]">{searchQuery}</span>
          &rdquo;. Try searching with a different video number, title, or keyword.
        </p>
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#DEDAD2] text-sm font-medium text-[#292825] hover:bg-[#ECEAE4] transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-[#77746D]" />
          <span>Clear Search & Filters</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#DEDAD2] rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto shadow-subtle">
      <div className="w-14 h-14 rounded-2xl bg-[#F7EBE6] text-[#C96442] flex items-center justify-center mx-auto mb-4 border border-[#F1D7CE]">
        <Video className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-[#292825] tracking-tight mb-1.5">
        Your library is empty
      </h3>
      <p className="text-sm text-[#77746D] leading-relaxed mb-6">
        Start building your ArhaStudio archive by adding your first YouTube video project record.
      </p>
      <button
        onClick={onAddProject}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C96442] text-white text-sm font-semibold hover:bg-[#B85535] transition-all shadow-subtle"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Add Your First Project</span>
      </button>
    </div>
  );
}
