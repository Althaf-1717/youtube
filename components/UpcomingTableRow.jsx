'use client';

import React from 'react';
import { Edit3, Trash2, Send, Zap, Film } from 'lucide-react';
import { formatVideoNumber, formatDate } from '@/lib/utils';

export default function UpcomingTableRow({ item, onEdit, onDelete }) {
  const isShort = item.video_type !== 'long';

  return (
    <tr className="group hover:bg-[#FAF8F5] transition-colors border-b border-[#ECEAE4]">
      {/* Video Number */}
      <td className="py-4 px-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#292825] font-semibold text-xs border border-[#ECEAE4]">
          {formatVideoNumber(item.video_number)}
        </span>
      </td>

      {/* Format Badge */}
      <td className="py-4 px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
            isShort
              ? 'bg-[#FEF7EE] border-[#FBE5C8] text-[#B45309]'
              : 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
          }`}
        >
          {isShort ? <Zap className="w-3 h-3" /> : <Film className="w-3 h-3" />}
          <span>{isShort ? 'Shorts' : 'Long'}</span>
        </span>
      </td>

      {/* Title & Prompts */}
      <td className="py-4 px-4 max-w-md">
        <div className="font-semibold text-sm text-[#292825] line-clamp-1">
          {item.title}
        </div>
        {(item.audio_prompt || item.edit_prompt) && (
          <div className="text-xs text-[#77746D] line-clamp-1 mt-0.5">
            {item.audio_prompt ? `Audio: ${item.audio_prompt}` : `Edit: ${item.edit_prompt}`}
          </div>
        )}
      </td>

      {/* Target Date */}
      <td className="py-4 px-4 whitespace-nowrap text-xs text-[#77746D] hidden sm:table-cell">
        <span>{formatDate(item.target_date || item.created_at)}</span>
      </td>

      {/* Actions */}
      <td className="py-4 px-4 whitespace-nowrap text-right text-sm">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#DEDAD2] text-[#292825] hover:bg-[#C96442] hover:text-white hover:border-[#C96442] text-xs font-medium transition-all"
            title="Edit & Submit"
          >
            <Send className="w-3 h-3" />
            <span>Submit</span>
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 text-[#77746D] hover:text-[#B85535] hover:bg-[#FDF6F5] rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
