// Verification script for core logic: validation, CSV parsing, numeric sorting, section division
import {
  validateProjectForm,
  validateUpcomingForm,
  formatVideoNumber,
  parseVideoNumber,
  isValidUrl,
  formatDate,
} from '../lib/utils.js';
import { exportProjectsToCSV, parseCSVToProjects } from '../lib/csv.js';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failCount++;
  }
}

console.log('\n--- 1. Testing Video Number Parsing & Formatting ---');
assert(parseVideoNumber(1) === 1, 'Parse numeric 1');
assert(parseVideoNumber('10') === 10, 'Parse string "10"');
assert(parseVideoNumber('Video 1') === 1, 'Parse "Video 1" to 1');
assert(parseVideoNumber('video 25') === 25, 'Parse "video 25" to 25');
assert(parseVideoNumber('Video #100') === 100, 'Parse "Video #100" to 100');
assert(parseVideoNumber(-5) === null, 'Reject negative number');
assert(parseVideoNumber(0) === null, 'Reject 0');

assert(formatVideoNumber(1) === 'Video 1', 'Format 1 to "Video 1"');
assert(formatVideoNumber(10) === 'Video 10', 'Format 10 to "Video 10"');
assert(formatVideoNumber(105) === 'Video 105', 'Format 105 to "Video 105"');

console.log('\n--- 2. Testing URL Formatting ---');
assert(isValidUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'Valid HTTPS YouTube URL');
assert(isValidUrl('https://youtube.com/shorts/xyz123'), 'Valid Shorts YouTube URL');
assert(isValidUrl('http://example.com/res'), 'Valid HTTP URL');
assert(!isValidUrl('javascript:alert(1)'), 'Reject non-http URL');
assert(!isValidUrl('not-a-url'), 'Reject invalid string');

console.log('\n--- 3. Testing Form Validation (Projects & Upcoming) ---');
const validProject = validateProjectForm({
  video_number: 'Video 1',
  title: 'Canva Tutorial for Beginners',
  video_url: 'https://youtube.com/shorts/xyz123',
});
assert(validProject.isValid, 'Valid project passes validation');

const validUpcoming = validateUpcomingForm({
  video_number: '9',
  title: 'Next Big YouTube Short Idea',
});
assert(validUpcoming.isValid, 'Valid upcoming passes validation');

const invalidUpcoming = validateUpcomingForm({
  video_number: '',
  title: '',
});
assert(!invalidUpcoming.isValid, 'Upcoming requires video number and title');

console.log('\n--- 4. Testing Date Formatting ---');
assert(formatDate('2026-10-24') === 'Oct 24, 2026', 'Format standard YYYY-MM-DD date without TZ skew');
assert(formatDate(null) === '—', 'Format null date as "—"');

console.log('\n--- 5. Testing Numeric Ordering Across Sections ---');
const library = [
  { video_number: 8, title: 'Short 8', video_type: 'shorts' },
  { video_number: 1, title: 'Short 1', video_type: 'shorts' },
  { video_number: 5, title: 'Short 5', video_type: 'shorts' },
  { video_number: 2, title: 'Long 2', video_type: 'long' },
];

const sorted = [...library].sort((a, b) => a.video_number - b.video_number);
assert(sorted[0].video_number === 1 && sorted[3].video_number === 8, 'Ascending sort by integer value');

const shortsOnly = library.filter((p) => p.video_type === 'shorts');
assert(shortsOnly.length === 3, 'Shorts filtering extracts only shorts');

const longOnly = library.filter((p) => p.video_type === 'long');
assert(longOnly.length === 1 && longOnly[0].video_number === 2, 'Long video filtering extracts only long videos');

console.log('\n--- 6. Testing Section Scoped Numbering & Conflict Rules ---');
// In projects: Short Video 1 and Long Video 1 can both exist
const sampleProjects = [
  { id: '1', video_number: 1, video_type: 'shorts', title: 'Short 1' },
  { id: '2', video_number: 1, video_type: 'long', title: 'Long 1' },
];

// Conflict function simulating scoped check
function hasProjectConflict(videoNum, videoType, projects) {
  return projects.some(
    (p) => p.video_number === videoNum && (p.video_type || 'shorts') === videoType
  );
}

// 1. In Upcoming Shorts, Video 1 should conflict with Projects Shorts
assert(
  hasProjectConflict(1, 'shorts', sampleProjects) === true,
  'Upcoming Shorts Video 1 conflicts with Projects Shorts Video 1'
);

// 2. In Upcoming Shorts, Video 2 does NOT conflict (only 1 exists)
assert(
  hasProjectConflict(2, 'shorts', sampleProjects) === false,
  'Upcoming Shorts Video 2 does not conflict'
);

// 3. In Upcoming Long Videos, Video 1 conflicts with Projects Long Video 1
assert(
  hasProjectConflict(1, 'long', sampleProjects) === true,
  'Upcoming Long Video 1 conflicts with Projects Long Video 1'
);

// 4. In Upcoming Long Videos, Video 2 does NOT conflict
assert(
  hasProjectConflict(2, 'long', sampleProjects) === false,
  'Upcoming Long Video 2 does not conflict'
);

console.log('\n--- 7. Testing CSV with Video Types and Dates ---');
const sample = [
  {
    video_number: 1,
    video_type: 'shorts',
    title: 'Canva Short',
    video_url: 'https://youtube.com/shorts/s1',
    project_date: '2026-10-24',
    created_at: '2026-10-24T12:00:00Z',
  },
  {
    video_number: 2,
    video_type: 'long',
    title: 'Full Python Course',
    video_url: 'https://youtube.com/watch?v=l2',
    project_date: '2026-10-24',
    created_at: '2026-10-24T12:00:00Z',
  },
];
const exported = exportProjectsToCSV(sample);
assert(exported.includes('video_number,video_type,title,video_url,project_date,created_at'), 'CSV has new headers');
const parsed = parseCSVToProjects(exported);
assert(parsed.validProjects.length === 2, 'CSV parsed both projects');
assert(parsed.validProjects[0].video_type === 'shorts', 'Project 1 parsed as shorts');
assert(parsed.validProjects[1].video_type === 'long', 'Project 2 parsed as long');

console.log(`\n================================`);
console.log(`Results: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`================================\n`);
process.exit(failCount === 0 ? 0 : 1);
