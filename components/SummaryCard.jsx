'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-white border border-[#DEDAD2] rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-subtle hover:shadow-card hover:border-[#C4BFB5]',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#77746D]">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-xl bg-[#ECEAE4] text-[#292825] group-hover:bg-[#F7EBE6] group-hover:text-[#C96442] transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#292825]">
          {value}
        </span>
        {badge && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              badgeColor || 'bg-[#ECEAE4] text-[#292825]'
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-[#77746D] font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
