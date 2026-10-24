'use client';

import React from 'react';
import { Search, X, Check, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchBar({
  searchQuery,
  onSearchChange,
  exactNumber,
  onExactNumberToggle,
  onClear,
  onKeyDown,
  totalResults = null,
  placeholder = 'Search by video number (e.g. 1, 10), title, or keywords...',
}) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77746D]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#DEDAD2] rounded-xl text-sm text-[#292825] placeholder-[#77746D] hover:border-[#C4BFB5] transition-all shadow-subtle"
        />
        {searchQuery && (
          <button
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#77746D] hover:text-[#292825] transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Exact video number search toggle */}
      <button
        type="button"
        onClick={onExactNumberToggle}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all select-none whitespace-nowrap',
          exactNumber
            ? 'bg-[#F7EBE6] border-[#F1D7CE] text-[#C96442]'
            : 'bg-white border-[#DEDAD2] text-[#77746D] hover:border-[#C4BFB5] hover:text-[#292825]'
        )}
        title="When active, numeric searches will only match exact video numbers (e.g., '1' matches only Video 1, not Video 10)"
      >
        <span className={cn('w-2 h-2 rounded-full', exactNumber ? 'bg-[#C96442]' : 'bg-[#DEDAD2]')} />
        <span>Exact Number</span>
      </button>
    </div>
  );
}
