'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Edit3,
  Trash2,
  Copy,
  Check,
  Calendar,
  Clock,
} from 'lucide-react';
import { formatVideoNumber, formatDate, isValidUrl } from '@/lib/utils';
import { useToast } from './Toast';

export default function ProjectCard({ project, onEdit, onDelete }) {
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
    <div
      onClick={handleOpenVideo}
      role="article"
      className="group relative flex flex-col justify-between bg-white border border-[#DEDAD2] rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-card hover:border-[#C4BFB5] cursor-pointer"
    >
      <div>
        {/* Top Header: Video Number Badge & Quick Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F7EBE6] border border-[#F1D7CE] text-[#C96442] font-semibold text-xs tracking-wide">
            <span>{formatVideoNumber(project.video_number)}</span>
          </div>

          <div
            className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCopyLink}
              title="Copy video link"
              className="p-1.5 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
              aria-label="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-[#C96442]" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onEdit(project)}
              title="Edit project"
              className="p-1.5 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
              aria-label="Edit project"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(project)}
              title="Delete project"
              className="p-1.5 text-[#77746D] hover:text-[#B85535] hover:bg-[#FDF6F5] rounded-lg transition-colors"
              aria-label="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project Title */}
        <h3 className="font-semibold text-lg text-[#292825] group-hover:text-[#C96442] transition-colors leading-snug line-clamp-3 mb-4">
          {project.title}
        </h3>
      </div>

      {/* Footer Details */}
      <div className="pt-4 border-t border-[#ECEAE4] flex items-center justify-between text-xs text-[#77746D]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" title="Created date">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(project.created_at)}
          </span>
          {project.updated_at && project.updated_at !== project.created_at && (
            <span className="hidden sm:flex items-center gap-1" title="Last updated">
              <Clock className="w-3.5 h-3.5" />
              Updated {formatDate(project.updated_at)}
            </span>
          )}
        </div>

        <button
          onClick={handleOpenVideo}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C96442] hover:text-[#B85535] group/btn transition-colors"
        >
          <span>Open Video</span>
          <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}
