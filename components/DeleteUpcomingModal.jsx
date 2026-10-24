'use client';

import React, { useState } from 'react';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { formatVideoNumber } from '@/lib/utils';
import { deleteUpcoming } from '@/lib/api/upcoming';
import { useToast } from './Toast';

export default function DeleteUpcomingModal({ isOpen, upcomingItem, onClose, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useToast();

  if (!isOpen || !upcomingItem) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteUpcoming(upcomingItem.id);
      if (res.error) {
        error(res.error);
        setIsDeleting(false);
        return;
      }
      success(`Removed upcoming idea ${formatVideoNumber(upcomingItem.video_number)}.`);
      onDeleted?.();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to delete upcoming idea.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292825]/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-modal border border-[#DEDAD2] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-[#FDF6F5] border border-[#F7D8D0] flex items-center justify-center text-[#C96442]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#292825] tracking-tight">
            Delete Upcoming Idea?
          </h3>
          <p className="text-sm text-[#77746D] mt-1.5 leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-[#292825]">
              {formatVideoNumber(upcomingItem.video_number)}: {upcomingItem.title}
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEAE4]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-[#DEDAD2] text-sm font-medium text-[#292825] hover:bg-[#ECEAE4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-[#C96442] hover:bg-[#B85535] text-white text-sm font-semibold shadow-subtle flex items-center gap-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Delete Idea</span>
          </button>
        </div>
      </div>
    </div>
  );
}
