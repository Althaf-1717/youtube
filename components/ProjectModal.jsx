'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Calendar, Film, Zap } from 'lucide-react';
import { validateProjectForm, parseVideoNumber } from '@/lib/utils';
import { createProject, updateProject, checkVideoNumberAvailable } from '@/lib/api/projects';
import { useToast } from './Toast';

export default function ProjectModal({
  isOpen,
  onClose,
  project = null, // null for Add, project object for Edit
  defaultVideoType = 'shorts',
  onSuccess,
}) {
  const isEdit = Boolean(project?.id);
  const { success, error } = useToast();

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    video_number: '',
    title: '',
    video_url: '',
    video_type: defaultVideoType || 'shorts',
    project_date: getTodayDate(),
  });

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
          video_url: project.video_url ?? '',
          video_type: project.video_type === 'long' ? 'long' : 'shorts',
          project_date:
            project.project_date ||
            (project.created_at ? project.created_at.split('T')[0] : getTodayDate()),
        });
      } else {
        setFormData({
          video_number: '',
          title: '',
          video_url: '',
          video_type: defaultVideoType === 'long' ? 'long' : 'shorts',
          project_date: getTodayDate(),
        });
      }
      setErrors({});
    }
  }, [isOpen, project, defaultVideoType]);

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

  const setVideoType = (type) => {
    setFormData((prev) => ({ ...prev, video_type: type }));
    if (errors.video_number) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.video_number;
        return next;
      });
    }
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
      formData.video_type,
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
    const resolvedDate = formData.project_date?.trim() || getTodayDate();
    const resolvedType = formData.video_type === 'long' ? 'long' : 'shorts';

    try {
      if (isEdit) {
        const res = await updateProject(project.id, {
          title: formData.title,
          video_url: formData.video_url,
          video_number: parsedNum,
          video_type: resolvedType,
          project_date: resolvedDate,
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
          title: formData.title,
          video_url: formData.video_url,
          video_number: parsedNum,
          video_type: resolvedType,
          project_date: resolvedDate,
        });
        if (res.error) {
          error(res.error);
          setIsSubmitting(false);
          return;
        }
        success(`Saved Video ${parsedNum} to ${resolvedType === 'shorts' ? 'Shorts' : 'Long Videos'}!`);
        onSuccess?.(res.data);

        if (addAnother) {
          const nextNum = parsedNum + 1;
          setFormData({
            video_number: `Video ${nextNum}`,
            title: '',
            video_url: '',
            video_type: resolvedType,
            project_date: getTodayDate(),
          });
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
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-modal border border-[#DEDAD2] overflow-hidden my-8"
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
                ? 'Update video section, number, title, date, or link'
                : 'Select video section, enter video number, title, date, and link'}
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
          {/* Section Selector: Shorts vs Long Videos */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-2">
              Video Section <span className="text-[#C96442]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-[#FAF8F5] border border-[#DEDAD2] rounded-xl">
              <button
                type="button"
                onClick={() => setVideoType('shorts')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  formData.video_type === 'shorts'
                    ? 'bg-[#C96442] text-white shadow-sm'
                    : 'text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4]'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>⚡ Shorts</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoType('long')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  formData.video_type === 'long'
                    ? 'bg-[#C96442] text-white shadow-sm'
                    : 'text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4]'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>🎬 Long Videos</span>
              </button>
            </div>
            <p className="text-[11px] text-[#77746D] mt-1.5">
              Video will automatically be saved into the {formData.video_type === 'shorts' ? 'Shorts' : 'Long Videos'} section.
            </p>
          </div>

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

          {/* Project Date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="project_date"
                className="block text-xs font-semibold uppercase tracking-wider text-[#292825]"
              >
                Project Date
              </label>
              <span className="text-[11px] text-[#77746D]">
                Defaults to today if empty
              </span>
            </div>
            <div className="relative">
              <input
                id="project_date"
                name="project_date"
                type="date"
                value={formData.project_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DEDAD2] bg-white hover:border-[#C4BFB5] text-sm text-[#292825] transition-all"
                disabled={isSubmitting}
              />
            </div>
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
              placeholder="e.g. Canva Tutorial for Beginners #Shorts"
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
              placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
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
