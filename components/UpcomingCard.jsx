'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Edit3,
  Trash2,
  Send,
  Headphones,
  Film,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import { formatVideoNumber, formatDate } from '@/lib/utils';
import { useToast } from './Toast';

export default function UpcomingCard({ item, onEdit, onDelete }) {
  const { success, error } = useToast();
  const isShort = item.video_type !== 'long';

  const [copiedAudio, setCopiedAudio] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

  const handleCopyAudio = async (e) => {
    e.stopPropagation();
    if (!item.audio_prompt) {
      error('No audio prompt to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(item.audio_prompt);
      setCopiedAudio(true);
      success(`Copied Audio Prompt for Video ${item.video_number}`);
      setTimeout(() => setCopiedAudio(false), 2000);
    } catch {
      error('Failed to copy to clipboard.');
    }
  };

  const handleCopyEdit = async (e) => {
    e.stopPropagation();
    if (!item.edit_prompt) {
      error('No edit prompt to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(item.edit_prompt);
      setCopiedEdit(true);
      success(`Copied Edit Prompt for Video ${item.video_number}`);
      setTimeout(() => setCopiedEdit(false), 2000);
    } catch {
      error('Failed to copy to clipboard.');
    }
  };

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

        {/* Audio Prompt Box with Copy Button */}
        {item.audio_prompt && (
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECEAE4] text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#C96442] font-semibold text-[11px] uppercase tracking-wide">
                <Headphones className="w-3.5 h-3.5" />
                <span>Audio Prompt</span>
              </div>
              <button
                type="button"
                onClick={handleCopyAudio}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#77746D] hover:text-[#C96442] px-2 py-0.5 rounded bg-white border border-[#DEDAD2] hover:border-[#C96442] transition-colors"
                title="Copy Audio Prompt to clipboard"
              >
                {copiedAudio ? (
                  <>
                    <Check className="w-3 h-3 text-[#C96442]" />
                    <span className="text-[#C96442]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Audio</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[#4D4B46] line-clamp-3 leading-relaxed whitespace-pre-wrap">
              {item.audio_prompt}
            </p>
          </div>
        )}

        {/* Edit Prompt Box with Copy Button */}
        {item.edit_prompt && (
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECEAE4] text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#77746D] font-semibold text-[11px] uppercase tracking-wide">
                <Film className="w-3.5 h-3.5" />
                <span>Edit Prompt</span>
              </div>
              <button
                type="button"
                onClick={handleCopyEdit}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#77746D] hover:text-[#292825] px-2 py-0.5 rounded bg-white border border-[#DEDAD2] hover:border-[#292825] transition-colors"
                title="Copy Edit Prompt to clipboard"
              >
                {copiedEdit ? (
                  <>
                    <Check className="w-3 h-3 text-[#C96442]" />
                    <span className="text-[#C96442]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Edit</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[#4D4B46] line-clamp-3 leading-relaxed whitespace-pre-wrap">
              {item.edit_prompt}
            </p>
          </div>
        )}

        {/* Description / Notes snippet (if no prompts or short) */}
        {!item.audio_prompt && !item.edit_prompt && item.description && (
          <p className="text-xs text-[#77746D] line-clamp-3 leading-relaxed">
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#DEDAD2] text-[#292825] hover:bg-[#C96442] hover:text-white hover:border-[#C96442] font-semibold text-xs transition-all group/btn"
          title="Edit or submit to Projects"
        >
          <Send className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
          <span>Edit / Submit</span>
        </button>
      </div>
    </div>
  );
}
