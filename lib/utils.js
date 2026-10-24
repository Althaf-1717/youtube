import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Parses user input into a valid positive integer video number.
 * Supports both pure numbers (e.g. 1, 10) and strings with prefix (e.g. "Video 1", "video 10", "#1").
 * @param {number|string} input
 * @returns {number|null}
 */
export function parseVideoNumber(input) {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input === 'number') {
    return Number.isInteger(input) && input > 0 ? input : null;
  }
  const str = String(input).trim();
  if (/^\d+$/.test(str)) {
    const val = parseInt(str, 10);
    return val > 0 ? val : null;
  }
  // Match first number occurrence like "Video 1", "video 10", "v10"
  const match = str.match(/\d+/);
  if (match) {
    const val = parseInt(match[0], 10);
    return val > 0 ? val : null;
  }
  return null;
}

/**
 * Format video number for display e.g. "Video 1", "Video 10"
 * @param {number|string} num
 * @returns {string}
 */
export function formatVideoNumber(num) {
  if (num === null || num === undefined || num === '') return 'Video —';
  const parsed = parseInt(num, 10);
  if (isNaN(parsed)) return `Video ${num}`;
  return `Video ${parsed}`;
}

/**
 * Validates a URL string ensuring valid format and https/http protocol
 * @param {string} urlString
 * @returns {boolean}
 */
export function isValidUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts YouTube video ID if URL is a valid YouTube link
 * @param {string} url
 * @returns {string|null}
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Format timestamp into clean, calm human-readable date
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Validates project input data before submission
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateProjectForm(data) {
  const errors = {};

  // Video Number Validation
  const parsedNum = parseVideoNumber(data.video_number);
  if (!data.video_number && data.video_number !== 0) {
    errors.video_number = 'Video number is required (e.g. 1 or Video 1).';
  } else if (!parsedNum || parsedNum <= 0) {
    errors.video_number = 'Please enter a valid video number (e.g. 1, 2, or Video 10).';
  }

  // Title Validation
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.title = 'Project title is required.';
  } else if (data.title.trim().length > 300) {
    errors.title = 'Project title must be under 300 characters.';
  }

  // URL Validation
  if (!data.video_url || typeof data.video_url !== 'string' || !data.video_url.trim()) {
    errors.video_url = 'Video or resource URL is required.';
  } else if (!isValidUrl(data.video_url.trim())) {
    errors.video_url = 'Please enter a valid HTTP or HTTPS URL.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
