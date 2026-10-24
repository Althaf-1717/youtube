'use client';

import React, { useState } from 'react';
import { ExternalLink, Edit3, Trash2, Copy, Check } from 'lucide-react';
import { formatVideoNumber, formatDate, isValidUrl } from '@/lib/utils';
import { useToast } from './Toast';

export default function ProjectTableRow({ project, onEdit, onDelete }) {
  const { success, error } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    if (!project.video_url) {
      error('No URL available to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(project.video_url);
      setCopied(true);
      success(`Copied link for Video ${project.video_number}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      error('Failed to copy to clipboard.');
    }
  };

  const handleOpenVideo = (e) => {
    e.stopPropagation();
    if (!project.video_url || !isValidUrl(project.video_url)) {
      error('Invalid or missing URL for this project.');
      return;
    }
    window.open(project.video_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <tr
      onClick={handleOpenVideo}
      className="group hover:bg-[#FAF8F5] transition-colors border-b border-[#ECEAE4] cursor-pointer"
    >
      {/* Video Number */}
      <td className="py-4 px-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#F7EBE6] text-[#C96442] font-semibold text-xs border border-[#F1D7CE]">
          {formatVideoNumber(project.video_number)}
        </span>
      </td>

      {/* Title & Description */}
      <td className="py-4 px-4 max-w-sm sm:max-w-lg">
        <div className="font-semibold text-sm text-[#292825] group-hover:text-[#C96442] transition-colors line-clamp-1">
          {project.title}
        </div>
        {project.description && (
          <div className="text-xs text-[#77746D] line-clamp-1 mt-0.5">
            {project.description}
          </div>
        )}
      </td>

      {/* Tags */}
      <td className="py-4 px-4 hidden md:table-cell">
        <div className="flex flex-wrap gap-1 max-w-[240px]">
          {Array.isArray(project.tags) && project.tags.length > 0 ? (
            project.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full text-[11px] bg-[#F5F3EE] text-[#77746D] border border-[#DEDAD2]"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-[#77746D]/60">—</span>
          )}
        </div>
      </td>

      {/* Updated / Created Date */}
      <td className="py-4 px-4 whitespace-nowrap text-xs text-[#77746D] hidden lg:table-cell">
        <span>{formatDate(project.updated_at || project.created_at)}</span>
      </td>

      {/* Action Buttons */}
      <td className="py-4 px-4 whitespace-nowrap text-right text-sm">
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCopyLink}
            title="Copy URL"
            className="p-1.5 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
            aria-label="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-[#C96442]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleOpenVideo}
            title="Open Video URL"
            className="p-1.5 text-[#77746D] hover:text-[#C96442] hover:bg-[#F7EBE6] rounded-lg transition-colors"
            aria-label="Open Video"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(project)}
            title="Edit Project"
            className="p-1.5 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
            aria-label="Edit project"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(project)}
            title="Delete Project"
            className="p-1.5 text-[#77746D] hover:text-[#B85535] hover:bg-[#FDF6F5] rounded-lg transition-colors"
            aria-label="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
