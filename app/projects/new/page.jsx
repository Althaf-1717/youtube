'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Zap, Film } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { validateProjectForm, parseVideoNumber } from '@/lib/utils';
import { createProject, checkVideoNumberAvailable } from '@/lib/api/projects';
import { useToast } from '@/components/Toast';

export default function NewProjectPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    video_number: '',
    title: '',
    video_url: '',
    video_type: 'shorts',
    project_date: getTodayDate(),
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingNumber, setCheckingNumber] = useState(false);

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
  };

  const validate = async () => {
    const { isValid, errors: validationErrors } = validateProjectForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return false;
    }

    const parsedNum = parseVideoNumber(formData.video_number);
    setCheckingNumber(true);
    const { available, error: uniqueErr } = await checkVideoNumberAvailable(parsedNum);
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
    e.preventDefault();
    if (isSubmitting) return;

    const isValid = await validate();
    if (!isValid) return;

    setIsSubmitting(true);
    const parsedNum = parseVideoNumber(formData.video_number);
    const resolvedDate = formData.project_date?.trim() || getTodayDate();
    const resolvedType = formData.video_type === 'long' ? 'long' : 'shorts';

    try {
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

      success(`Successfully added Video ${parsedNum} to ${resolvedType === 'shorts' ? 'Shorts' : 'Long Videos'}!`);

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
        router.push('/projects');
      }
    } catch (err) {
      error(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 pb-3 border-b border-[#DEDAD2]">
          <Link
            href="/projects"
            className="p-2 rounded-xl text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#292825]">
              Add New Project
            </h1>
            <p className="text-xs text-[#77746D]">
              Choose section, video number, title, date, and link for your YouTube library.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#DEDAD2] rounded-2xl p-6 sm:p-8 shadow-card">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Video Section Toggle */}
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
            </div>

            {/* Video Number */}
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
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    errors.video_number
                      ? 'border-[#C96442] bg-[#FDF6F5]'
                      : 'border-[#DEDAD2] bg-white hover:border-[#C4BFB5]'
                  }`}
                  disabled={isSubmitting}
                  required
                />
                {checkingNumber && (
                  <div className="absolute right-3 top-3">
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
              <input
                id="project_date"
                name="project_date"
                type="date"
                value={formData.project_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DEDAD2] bg-white hover:border-[#C4BFB5] text-sm text-[#292825] transition-all"
                disabled={isSubmitting}
              />
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
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
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

            {/* Video URL */}
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
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
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

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#ECEAE4]">
              <Link
                href="/projects"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#DEDAD2] text-sm font-medium text-[#292825] hover:bg-[#ECEAE4] transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#C96442] text-sm font-medium text-[#C96442] bg-[#F7EBE6] hover:bg-[#F2DFD7] transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save & Add Another</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C96442] text-white text-sm font-semibold hover:bg-[#B85535] transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Project</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
