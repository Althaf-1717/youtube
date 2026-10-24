'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { formatVideoNumber } from '@/lib/utils';
import { deleteProject } from '@/lib/api/projects';
import { useToast } from './Toast';

export default function DeleteConfirmModal({
  isOpen,
  project,
  onClose,
  onDeleted,
}) {
  const { success, error } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !project) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteProject(project.id);
      if (res.error) {
        error(res.error);
        setIsDeleting(false);
        return;
      }
      success(`Permanently deleted Video #${project.video_number}`);
      onDeleted?.(project.id);
      onClose();
    } catch (err) {
      error(err.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292825]/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-modal border border-[#DEDAD2] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#FDF6F5] text-[#C96442] shrink-0 border border-[#F8D8CF]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#292825] tracking-tight">
              Delete Project?
            </h3>
            <p className="text-sm text-[#77746D] mt-1 leading-relaxed">
              Are you sure you want to permanently delete this video project record from your library?
            </p>
          </div>
        </div>

        {/* Project to delete details */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#ECEAE4] space-y-1">
          <div className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[#F7EBE6] text-[#C96442]">
            {formatVideoNumber(project.video_number)}
          </div>
          <p className="font-semibold text-sm text-[#292825] line-clamp-2">
            {project.title}
          </p>
        </div>

        <p className="text-xs text-[#77746D]">
          This action cannot be undone. All recorded metadata for this video will be removed from Supabase.
        </p>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-[#DEDAD2] text-sm font-medium text-[#292825] hover:bg-[#ECEAE4] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-[#B85535] text-white text-sm font-semibold hover:bg-[#9E3E22] transition-colors shadow-subtle flex items-center gap-2 disabled:opacity-60"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Permanently Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
