'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Sparkles, Send, Trash2, Zap, Film, ExternalLink } from 'lucide-react';
import { parseVideoNumber, validateUpcomingForm, isValidUrl } from '@/lib/utils';
import {
  createUpcoming,
  updateUpcoming,
  deleteUpcoming,
  checkUpcomingNumberAvailable,
  checkConflictWithProjects,
  submitUpcomingToProjects,
} from '@/lib/api/upcoming';
import { useToast } from './Toast';

export default function UpcomingModal({
  isOpen,
  onClose,
  upcomingItem = null, // null for create, object for edit
  defaultVideoType = 'shorts',
  onSuccess,
}) {
  const isEdit = Boolean(upcomingItem?.id);
  const { success, error, info } = useToast();

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    video_number: '',
    video_type: defaultVideoType || 'shorts',
    title: '',
    target_date: getTodayDate(),
    description: '',
    audio_prompt: '',
    edit_prompt: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [projectConflictError, setProjectConflictError] = useState(null);

  // Submit to projects flow state
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitUrlError, setSubmitUrlError] = useState('');
  const [submittingToProjects, setSubmittingToProjects] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (upcomingItem) {
        setFormData({
          video_number: upcomingItem.video_number ? `Video ${upcomingItem.video_number}` : '',
          video_type: upcomingItem.video_type === 'long' ? 'long' : 'shorts',
          title: upcomingItem.title ?? '',
          target_date: upcomingItem.target_date || getTodayDate(),
          description: upcomingItem.description ?? '',
          audio_prompt: upcomingItem.audio_prompt ?? '',
          edit_prompt: upcomingItem.edit_prompt ?? '',
        });
      } else {
        setFormData({
          video_number: '',
          video_type: defaultVideoType === 'long' ? 'long' : 'shorts',
          title: '',
          target_date: getTodayDate(),
          description: '',
          audio_prompt: '',
          edit_prompt: '',
        });
      }
      setErrors({});
      setProjectConflictError(null);
      setShowSubmitPrompt(false);
      setSubmissionUrl('');
      setSubmitUrlError('');
    }
  }, [isOpen, upcomingItem, defaultVideoType]);

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

    if (name === 'video_number') {
      setProjectConflictError(null);
    }
  };

  const handleVideoNumberBlur = async () => {
    const parsedNum = parseVideoNumber(formData.video_number);
    if (!parsedNum) return;

    setCheckingNumber(true);
    try {
      // 1. Strict check against Projects table
      const projectCheck = await checkConflictWithProjects(parsedNum);
      if (projectCheck.conflict) {
        setProjectConflictError(
          `Video ${parsedNum} is already published in Projects ("${projectCheck.project.title}"). You cannot use this number!`
        );
        return;
      } else {
        setProjectConflictError(null);
      }

      // 2. Check against Upcoming table
      const availCheck = await checkUpcomingNumberAvailable(parsedNum, upcomingItem?.id || null);
      if (!availCheck.available) {
        setErrors((prev) => ({ ...prev, video_number: availCheck.error }));
      }
    } catch {
      // ignore check error
    } finally {
      setCheckingNumber(false);
    }
  };

  const validate = async () => {
    const { isValid, errors: validationErrors } = validateUpcomingForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return false;
    }

    const parsedNum = parseVideoNumber(formData.video_number);

    // Strict project conflict check
    const projectCheck = await checkConflictWithProjects(parsedNum);
    if (projectCheck.conflict) {
      setProjectConflictError(
        `Video ${parsedNum} is already published in Projects ("${projectCheck.project.title}"). You cannot save or submit with this number!`
      );
      return false;
    }

    // Upcoming uniqueness check
    const availCheck = await checkUpcomingNumberAvailable(parsedNum, upcomingItem?.id || null);
    if (!availCheck.available) {
      setErrors((prev) => ({ ...prev, video_number: availCheck.error }));
      return false;
    }

    return true;
  };

  // Regular Save (Create or Update Upcoming Idea)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const isValid = await validate();
    if (!isValid) return;

    setIsSubmitting(true);
    const parsedNum = parseVideoNumber(formData.video_number);
    const resolvedDate = formData.target_date?.trim() || getTodayDate();
    const resolvedType = formData.video_type === 'long' ? 'long' : 'shorts';

    try {
      if (isEdit) {
        const res = await updateUpcoming(upcomingItem.id, {
          video_number: parsedNum,
          video_type: resolvedType,
          title: formData.title,
          target_date: resolvedDate,
          description: formData.description,
          audio_prompt: formData.audio_prompt,
          edit_prompt: formData.edit_prompt,
        });

        if (res.error) {
          error(res.error);
          setIsSubmitting(false);
          return;
        }

        success(`Updated Upcoming Video ${parsedNum}`);
        onSuccess?.(res.data);
        onClose();
      } else {
        const res = await createUpcoming({
          video_number: parsedNum,
          video_type: resolvedType,
          title: formData.title,
          target_date: resolvedDate,
          description: formData.description,
          audio_prompt: formData.audio_prompt,
          edit_prompt: formData.edit_prompt,
        });

        if (res.error) {
          error(res.error);
          setIsSubmitting(false);
          return;
        }

        success(`Saved Video ${parsedNum} to Upcoming ${resolvedType === 'shorts' ? 'Shorts' : 'Long Videos'}!`);
        onSuccess?.(res.data);
        onClose();
      }
    } catch (err) {
      error(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit to Projects Flow
  const handleStartSubmitToProjects = async () => {
    // Validate first
    const isValid = await validate();
    if (!isValid) return;

    setShowSubmitPrompt(true);
  };

  const handleConfirmSubmitToProjects = async () => {
    if (!submissionUrl || !submissionUrl.trim()) {
      setSubmitUrlError('Video URL is required to publish to Projects.');
      return;
    }
    if (!isValidUrl(submissionUrl.trim())) {
      setSubmitUrlError('Please enter a valid HTTP or HTTPS video URL.');
      return;
    }

    setSubmittingToProjects(true);
    setSubmitUrlError('');

    try {
      const parsedNum = parseVideoNumber(formData.video_number);
      const res = await submitUpcomingToProjects(
        {
          id: upcomingItem.id,
          video_number: parsedNum,
          video_type: formData.video_type,
          title: formData.title,
          target_date: formData.target_date,
          description: formData.description,
        },
        submissionUrl.trim()
      );

      if (res.error) {
        error(res.error);
        setSubmittingToProjects(false);
        return;
      }

      success(
        `🎉 Successfully moved Video ${parsedNum} to ${
          formData.video_type === 'shorts' ? 'Shorts' : 'Long Videos'
        } Projects!`
      );
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      error(err.message || 'Error publishing project.');
    } finally {
      setSubmittingToProjects(false);
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ECEAE4] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C96442]/10 text-[#C96442] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#292825] tracking-tight">
                {isEdit ? `Edit Upcoming Video ${upcomingItem.video_number}` : 'Create Upcoming Video Idea'}
              </h2>
              <p className="text-xs text-[#77746D]">
                Plan video prompts, notes, and submit directly to Projects when ready.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Conflict Warning Banner */}
        {projectConflictError && (
          <div className="px-6 py-3.5 bg-[#FDF6F5] border-b border-[#F7D8D0] flex items-start gap-3 text-xs text-[#B85535]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C96442]" />
            <div>
              <p className="font-bold text-[#C96442]">Action Blocked: Duplicate Project Number</p>
              <p className="mt-0.5 leading-relaxed">{projectConflictError}</p>
            </div>
          </div>
        )}

        {/* Submit to Projects Sub-modal / Card */}
        {showSubmitPrompt ? (
          <div className="p-6 space-y-5 bg-[#FAF8F5]">
            <div className="p-4 bg-white border border-[#DEDAD2] rounded-xl space-y-3 shadow-subtle">
              <div className="flex items-center gap-2 text-sm font-bold text-[#292825]">
                <Send className="w-4 h-4 text-[#C96442]" />
                <span>Submit Video {formData.video_number} to Projects</span>
              </div>
              <p className="text-xs text-[#77746D] leading-relaxed">
                This will move your planned video into the{' '}
                <span className="font-semibold text-[#292825]">
                  {formData.video_type === 'shorts' ? '⚡ Shorts' : '🎬 Long Videos'}
                </span>{' '}
                section of your library and remove it from Upcoming. Please enter the final video URL below.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-1.5">
                  Final Video / YouTube URL <span className="text-[#C96442]">*</span>
                </label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => {
                    setSubmissionUrl(e.target.value);
                    setSubmitUrlError('');
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                    submitUrlError
                      ? 'border-[#C96442] bg-[#FDF6F5]'
                      : 'border-[#DEDAD2] bg-white hover:border-[#C4BFB5]'
                  }`}
                  autoFocus
                />
                {submitUrlError && (
                  <p className="text-xs text-[#C96442] mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{submitUrlError}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitPrompt(false)}
                disabled={submittingToProjects}
                className="px-4 py-2.5 rounded-xl border border-[#DEDAD2] text-sm font-medium text-[#292825] hover:bg-[#ECEAE4]"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitToProjects}
                disabled={submittingToProjects || Boolean(projectConflictError)}
                className="px-6 py-2.5 rounded-xl bg-[#C96442] hover:bg-[#B85535] text-white text-sm font-semibold shadow-subtle flex items-center gap-2 disabled:opacity-50"
              >
                {submittingToProjects ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Confirm & Publish</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Form */
          <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Section Selection: Shorts vs Long Videos */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-2">
                Format / Section <span className="text-[#C96442]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-[#FAF8F5] border border-[#DEDAD2] rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, video_type: 'shorts' }))}
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
                  onClick={() => setFormData((prev) => ({ ...prev, video_type: 'long' }))}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                    formData.video_type === 'long'
                      ? 'bg-[#C96442] text-white shadow-sm'
                      : 'text-[#77746D] hover:text-[#292825] hover:bg-[#ECEAE4]'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>🎬 Long Video</span>
                </button>
              </div>
            </div>

            {/* Video Number & Target Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="upcoming_video_number"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#292825]"
                  >
                    Video Number <span className="text-[#C96442]">*</span>
                  </label>
                  <span className="text-[11px] text-[#77746D]">e.g. 9 or Video 9</span>
                </div>
                <div className="relative">
                  <input
                    id="upcoming_video_number"
                    name="video_number"
                    type="text"
                    value={formData.video_number}
                    onChange={handleChange}
                    onBlur={handleVideoNumberBlur}
                    placeholder="e.g. 9 or Video 9"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      errors.video_number || projectConflictError
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
                  <p className="flex items-center gap-1 mt-1 text-xs text-[#C96442]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.video_number}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="upcoming_target_date"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#292825]"
                  >
                    Target Date
                  </label>
                  <span className="text-[11px] text-[#77746D]">Defaults to today</span>
                </div>
                <input
                  id="upcoming_target_date"
                  name="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DEDAD2] bg-white hover:border-[#C4BFB5] text-sm text-[#292825] transition-all"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="upcoming_title"
                className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-1.5"
              >
                Video Title / Topic <span className="text-[#C96442]">*</span>
              </label>
              <input
                id="upcoming_title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. 5 AI Tools That Feel Illegal to Know #Shorts"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                  errors.title
                    ? 'border-[#C96442] bg-[#FDF6F5]'
                    : 'border-[#DEDAD2] bg-white hover:border-[#C4BFB5]'
                }`}
                disabled={isSubmitting}
                required
              />
              {errors.title && (
                <p className="flex items-center gap-1 mt-1 text-xs text-[#C96442]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            {/* Audio Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="upcoming_audio_prompt"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#292825]"
                >
                  Audio Prompt (Voiceover / Music)
                </label>
                <span className="text-[11px] text-[#77746D]">Voice style, ElevenLabs, BGM cues</span>
              </div>
              <textarea
                id="upcoming_audio_prompt"
                name="audio_prompt"
                rows={2}
                value={formData.audio_prompt}
                onChange={handleChange}
                placeholder="e.g. High-energy enthusiastic male voice, fast pacing, upbeat tech background beat fading at punchline..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DEDAD2] bg-white hover:border-[#C4BFB5] text-sm text-[#292825] transition-all resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Edit Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="upcoming_edit_prompt"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#292825]"
                >
                  Edit Prompt (CapCut / Premiere / Visuals)
                </label>
                <span className="text-[11px] text-[#77746D]">Visual hook, captions, transitions</span>
              </div>
              <textarea
                id="upcoming_edit_prompt"
                name="edit_prompt"
                rows={2}
                value={formData.edit_prompt}
                onChange={handleChange}
                placeholder="e.g. 0-2s rapid zoom with yellow bold captions, screen recording overlays with blur-in transitions..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DEDAD2] bg-white hover:border-[#C4BFB5] text-sm text-[#292825] transition-all resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="upcoming_description"
                className="block text-xs font-semibold uppercase tracking-wider text-[#292825] mb-1.5"
              >
                Notes & Description (Optional)
              </label>
              <textarea
                id="upcoming_description"
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Outline, bullet points, references..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DEDAD2] bg-white hover:border-[#C4BFB5] text-sm text-[#292825] transition-all resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#ECEAE4]">
              <div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#DEDAD2] text-sm font-medium text-[#292825] hover:bg-[#ECEAE4] transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleStartSubmitToProjects}
                    disabled={isSubmitting || Boolean(projectConflictError)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#292825] hover:bg-[#1a1918] text-white text-sm font-semibold transition-all shadow-subtle flex items-center justify-center gap-1.5 disabled:opacity-40"
                    title="Move this idea into published Projects"
                  >
                    <Send className="w-4 h-4 text-[#F7EBE6]" />
                    <span>Submit to Projects</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || Boolean(projectConflictError)}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#C96442] hover:bg-[#B85535] text-white text-sm font-semibold transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isEdit ? 'Save Changes' : 'Save Upcoming'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
