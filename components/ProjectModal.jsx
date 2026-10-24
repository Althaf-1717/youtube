'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { validateProjectForm, parseVideoNumber } from '@/lib/utils';
import { createProject, updateProject, checkVideoNumberAvailable } from '@/lib/api/projects';
import { useToast } from './Toast';

export default function ProjectModal({
  isOpen,
  onClose,
  project = null, // null for Add, project object for Edit
  onSuccess,
}) {
  const isEdit = Boolean(project?.id);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    video_number: '',
    title: '',
    description: '',
    video_url: '',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingNumber, setCheckingNumber] = useState(false);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (project) {
        setFormData({
          video_number: project.video_number ? `Video ${project.video_number}` : '',
          title: project.title ?? '',
          description: project.description ?? '',
          video_url: project.video_url ?? '',
          tags: Array.isArray(project.tags) ? project.tags : [],
        });
      } else {
        setFormData({
          video_number: '',
          title: '',
          description: '',
          video_url: '',
          tags: [],
        });
      }
      setTagInput('');
      setErrors({});
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^#/, '');
      if (trimmed && !formData.tags.includes(trimmed)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, trimmed],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const validate = async () => {
    const { isValid, errors: validationErrors } = validateProjectForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      return false;
    }

    const parsedNum = parseVideoNumber(formData.video_number);
    setCheckingNumber(true);
    const { available, error: uniqueErr } = await checkVideoNumberAvailable(
      parsedNum,
      project?.id || null
    );
    setCheckingNumber(false);

    if (!available) {
      setErrors((prev) => ({
        ...prev,
        video_number:
          uniqueErr || `Video ${parsedNum} already exists. Please choose a unique video number.`,
      }));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e, addAnother = false) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const isValid = await validate();
    if (!isValid) return;

    setIsSubmitting(true);
    const parsedNum = parseVideoNumber(formData.video_number);

    try {
      if (isEdit) {
        const res = await updateProject(project.id, {
          ...formData,
          video_number: parsedNum,
        });
        if (res.error) {
          error(res.error);
          setIsSubmitting(false);
          return;
        }
        success(`Successfully updated Video ${parsedNum}`);
        onSuccess?.(res.data);
        onClose();
      } else {
        const res = await createProject({
          ...formData,
          video_number: parsedNum,
        });
        if (res.error) {
          error(res.error);
          setIsSubmitting(false);
          return;
        }
        success(`Saved Video ${parsedNum} to library!`);
        onSuccess?.(res.data);

        if (addAnother) {
          const nextNum = parsedNum + 1;
          setFormData({
            video_number: `Video ${nextNum}`,
            title: '',
            description: '',
            video_url: '',
            tags: [],
          });
          setTagInput('');
          setErrors({});
        } else {
          onClose();
        }
      }
    } catch (err) {
      error(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292825]/40 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-modal border border-[#DEDAD2] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ECEAE4] bg-[#FAF8F5]">
          <div>
            <h2 className="text-xl font-bold text-[#292825] tracking-tight">
              {isEdit ? `Edit Video ${project.video_number}` : 'Add New Video Project'}
            </h2>
            <p className="text-xs text-[#77746D] mt-0.5">
              {isEdit
                ? 'Update video details, resource link, or ordering'
                : 'Enter your YouTube video number, title, and link'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-5">
          {/* Video Number Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="video_number"
                className="block text-xs font-semibold uppercase tracking-wider text-[#292825]"
              >
                Video Number <span className="text-[#C96442]">*</span>
              </label>
              <span className="text-[11px] text-[#77746D]">
                e.g. 1, 10, or Video 1
              </span>
            </div>
            <div className="relative">
              <input
                id="video_number"
                name="video_number"
                type="text"
                value={formData.video_number}
                onChange={handleChange}
                placeholder="e.g. 1 or Video 1"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  errors.video_number
                    ? 'border-[#C96442] bg-[#FDF6F5]'
                    : 'border-[#DEDAD2] bg-white hover:border-[#C4BFB5]'
                }`}
                disabled={isSubmitting}
                required
              />
              {checkingNumber && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#77746D]" />
                </div>
              )}
            </div>
            {errors.video_number && (
              <p className="flex items-center gap-1 mt-1.5 text-xs text-[#C96442]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.video_number}</span>
              </p>
            )}
          </div>

          {/* Project Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-1.5"
            >
              Project Title <span className="text-[#C96442]">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Python Variables & Data Types Explained in Telugu"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                errors.title
                  ? 'border-[#C96442] bg-[#FDF6F5]'
                  : 'border-[#DEDAD2] bg-white hover:border-[#C4BFB5]'
              }`}
              disabled={isSubmitting}
              required
            />
            {errors.title && (
              <p className="flex items-center gap-1 mt-1.5 text-xs text-[#C96442]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Video / Resource URL */}
          <div>
            <label
              htmlFor="video_url"
              className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-1.5"
            >
              Video / Resource URL <span className="text-[#C96442]">*</span>
            </label>
            <input
              id="video_url"
              name="video_url"
              type="url"
              value={formData.video_url}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                errors.video_url
                  ? 'border-[#C96442] bg-[#FDF6F5]'
                  : 'border-[#DEDAD2] bg-white hover:border-[#C4BFB5]'
              }`}
              disabled={isSubmitting}
              required
            />
            {errors.video_url && (
              <p className="flex items-center gap-1 mt-1.5 text-xs text-[#C96442]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.video_url}</span>
              </p>
            )}
          </div>

          {/* Project Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-1.5"
            >
              Description <span className="text-[#77746D] font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Key concepts, timestamps, reference resources, or code notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DEDAD2] bg-white text-sm transition-all hover:border-[#C4BFB5]"
              disabled={isSubmitting}
            />
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-1.5"
            >
              Tags <span className="text-[#77746D] font-normal lowercase">(press Enter or comma)</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-[#DEDAD2] bg-white min-h-[44px]">
              {formData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#ECEAE4] text-[#292825]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-[#C96442]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={formData.tags.length === 0 ? 'e.g. Python, Variables, Beginners' : ''}
                className="flex-1 min-w-[120px] bg-transparent text-sm border-none focus:ring-0 focus:outline-none p-1 !shadow-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#ECEAE4]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#DEDAD2] text-sm font-medium text-[#292825] hover:bg-[#ECEAE4] transition-colors"
            >
              Cancel
            </button>

            {!isEdit && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#C96442] text-sm font-medium text-[#C96442] bg-[#F7EBE6] hover:bg-[#F2DFD7] transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save & Add Another</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C96442] text-white text-sm font-semibold hover:bg-[#B85535] transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Save Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
