import { isValidUrl } from './utils.js';

/**
 * Convert projects array to CSV string
 * @param {Array} projects
 * @returns {string}
 */
export function exportProjectsToCSV(projects = []) {
  const headers = [
    'video_number',
    'title',
    'video_url',
    'created_at',
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const stringified = String(str).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  const rows = projects.map((p) => [
    p.video_number,
    escapeCSV(p.title),
    escapeCSV(p.video_url),
    escapeCSV(p.created_at || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Parse CSV text into validated project objects
 * @param {string} csvText
 * @returns {{ validProjects: Array, errors: Array }}
 */
export function parseCSVToProjects(csvText) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { validProjects: [], errors: ['CSV file is empty or missing data rows.'] };
  }

  // Parse CSV line handling quoted commas
  const parseCSVLine = (text) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur);
    return result.map((col) => col.trim());
  };

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const vNumIdx = headers.indexOf('video_number');
  const titleIdx = headers.indexOf('title');
  const urlIdx = headers.indexOf('video_url');

  if (vNumIdx === -1 || titleIdx === -1 || urlIdx === -1) {
    return {
      validProjects: [],
      errors: [
        'Missing required headers: CSV must include "video_number", "title", and "video_url".',
      ],
    };
  }

  const validProjects = [];
  const errors = [];
  const seenVideoNumbers = new Set();

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 3) continue;

    const rawNum = cols[vNumIdx];
    const rawTitle = cols[titleIdx];
    const rawUrl = cols[urlIdx];

    const num = parseInt(rawNum, 10);
    if (isNaN(num) || num <= 0) {
      errors.push(`Row ${lineNum}: Invalid video number "${rawNum}". Must be a positive integer.`);
      continue;
    }

    if (seenVideoNumbers.has(num)) {
      errors.push(`Row ${lineNum}: Duplicate video number #${num} found within CSV.`);
      continue;
    }
    seenVideoNumbers.add(num);

    if (!rawTitle) {
      errors.push(`Row ${lineNum}: Project title is missing.`);
      continue;
    }

    if (!rawUrl || !isValidUrl(rawUrl)) {
      errors.push(`Row ${lineNum}: Invalid URL "${rawUrl}". Must be a valid HTTP/HTTPS link.`);
      continue;
    }

    validProjects.push({
      video_number: num,
      title: rawTitle,
      video_url: rawUrl,
    });
  }

  return { validProjects, errors };
}
