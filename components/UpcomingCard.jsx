'use client';

import React from 'react';
import {
  Calendar,
  Edit3,
  Trash2,
  Send,
  Headphones,
  Film,
  Zap,
  AlignLeft,
} from 'lucide-react';
import { formatVideoNumber, formatDate } from '@/lib/utils';

export default function UpcomingCard({ item, onEdit, onDelete, onSubmitToProjects }) {
  const isShort = item.video_type !== 'long';

  return (
    <div
      role="article"
      className="group relative flex flex-col justify-between bg-white border border-[#DEDAD2] rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-card hover:border-[#C4BFB5]"
    >
      <div className="space-y-3.5">
        {/* Header: Video Number, Format Badge & Action Icons */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF8F5] border border-[#ECEAE4] text-[#292825] font-semibold text-xs tracking-wide">
              {formatVideoNumber(item.video_number)}
            </span>

            {/* Type Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isShort
                  ? 'bg-[#FEF7EE] border-[#FBE5C8] text-[#B45309]'
                  : 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
              }`}
            >
              {isShort ? <Zap className="w-3 h-3" /> : <Film className="w-3 h-3" />}
              <span>{isShort ? 'Shorts' : 'Long Video'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              title="Edit upcoming idea"
              className="p-1.5 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item)}
              title="Delete upcoming idea"
              className="p-1.5 text-[#77746D] hover:text-[#B85535] hover:bg-[#FDF6F5] rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base sm:text-lg text-[#292825] leading-snug">
          {item.title}
        </h3>

        {/* Audio Prompt Snippet (if available) */}
        {item.audio_prompt && (
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECEAE4] text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#C96442] font-semibold text-[11px] uppercase tracking-wide">
              <Headphones className="w-3 h-3" />
              <span>Audio Prompt</span>
            </div>
            <p className="text-[#4D4B46] line-clamp-2 leading-relaxed">
              {item.audio_prompt}
            </p>
          </div>
        )}

        {/* Edit Prompt Snippet (if available) */}
        {item.edit_prompt && (
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECEAE4] text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#77746D] font-semibold text-[11px] uppercase tracking-wide">
              <Film className="w-3 h-3" />
              <span>Edit Prompt</span>
            </div>
            <p className="text-[#4D4B46] line-clamp-2 leading-relaxed">
              {item.edit_prompt}
            </p>
          </div>
        )}

        {/* Description / Notes snippet (if no prompts or short) */}
        {!item.audio_prompt && !item.edit_prompt && item.description && (
          <p className="text-xs text-[#77746D] line-clamp-3">
            {item.description}
          </p>
        )}
      </div>

      {/* Footer Details & Submit Action */}
      <div className="pt-4 mt-4 border-t border-[#ECEAE4] flex items-center justify-between text-xs text-[#77746D]">
        <span className="flex items-center gap-1" title="Target Date">
          <Calendar className="w-3.5 h-3.5" />
          <span>Target: {formatDate(item.target_date || item.created_at)}</span>
        </span>

        <button
          onClick={() => onEdit(item)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#DEDAD2] text-[#292825] hover:bg-[#C96442] hover:text-white hover:border-[#C96442] font-medium transition-all group/btn"
          title="Submit to Projects"
        >
          <Send className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
          <span>Submit</span>
        </button>
      </div>
    </div>
  );
}
