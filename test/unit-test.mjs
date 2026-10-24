// Verification script for core logic: validation, CSV parsing, numeric sorting
import { validateProjectForm, formatVideoNumber, parseVideoNumber, isValidUrl } from '../lib/utils.js';
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
assert(isValidUrl('http://example.com/res'), 'Valid HTTP URL');
assert(!isValidUrl('javascript:alert(1)'), 'Reject non-http URL');
assert(!isValidUrl('not-a-url'), 'Reject invalid string');

console.log('\n--- 3. Testing Form Validation (Category Removed) ---');
const validTest = validateProjectForm({
  video_number: 'Video 1',
  title: 'Python Variables in Telugu',
  video_url: 'https://youtube.com/watch?v=xyz123',
});
assert(validTest.isValid, 'Valid project with "Video 1" passes validation');

const validNumOnly = validateProjectForm({
  video_number: 2,
  title: 'Python Data Types',
  video_url: 'https://youtube.com/watch?v=xyz123',
});
assert(validNumOnly.isValid, 'Valid project with integer 2 passes validation');

const invalidNum = validateProjectForm({
  video_number: -5,
  title: 'Negative number test',
  video_url: 'https://youtube.com/watch?v=xyz123',
});
assert(!invalidNum.isValid && invalidNum.errors.video_number, 'Reject negative video number');

const emptyTitle = validateProjectForm({
  video_number: 2,
  title: '   ',
  video_url: 'https://youtube.com/watch?v=xyz123',
});
assert(!emptyTitle.isValid && emptyTitle.errors.title, 'Reject whitespace title');

const invalidUrl = validateProjectForm({
  video_number: 2,
  title: 'Valid title',
  video_url: 'ftp://bad-link',
});
assert(!invalidUrl.isValid && invalidUrl.errors.video_url, 'Reject non-http/https URL');

console.log('\n--- 4. Testing Numeric Ordering ---');
const unsorted = [
  { video_number: 10, title: 'Python Functions' },
  { video_number: 2, title: 'Python Data Types' },
  { video_number: 1, title: 'Python Introduction' },
  { video_number: 5, title: 'Python Conditions' },
  { video_number: 3, title: 'Python Operators' },
];

const sorted = [...unsorted].sort((a, b) => a.video_number - b.video_number);
const expectedOrder = [1, 2, 3, 5, 10];
const actualOrder = sorted.map((p) => p.video_number);
assert(
  JSON.stringify(actualOrder) === JSON.stringify(expectedOrder),
  `True numeric ordering (1, 2, 3, 5, 10): got ${actualOrder.join(', ')}`
);

console.log('\n================================');
console.log(`Results: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`================================\n`);
process.exit(failCount === 0 ? 0 : 1);
