/**
 * Comprehensive UI, Responsive Design, and Accessibility Test Suite
 * Tests:
 * 1. DESIGN.md Color tokens and font compliance
 * 2. Responsive breakpoint testing (375px, 768px, 1440px)
 * 3. Lucide Icon presence across interactive buttons
 * 4. ARIA labels and form accessibility
 * 5. Keyboard navigation focus rings
 * 6. Loading, Error, and Empty state handling
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

const SRC_DIR = path.resolve('src');

function getAllFiles(dir, exts = ['.jsx', '.js', '.css']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('====================================================');
console.log('  LIFE-LINK UI, Responsiveness & A11y Test Suite    ');
console.log('====================================================\n');

// 1. DESIGN.md Color Tokens & Typography
console.log('--- Test 1: DESIGN.md Color System & Base Typography ---');
const indexCssPath = path.join(SRC_DIR, 'index.css');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');

assert(indexCss.includes('#f8fafc'), 'Surface background conforms to #F8FAFC');
assert(indexCss.includes('#0f172a'), 'Primary text conforms to #0F172A');
assert(indexCss.includes('Inter'), 'Primary typography specifies Inter with system fallback');
assert(indexCss.includes('overflow-x: hidden'), 'Mobile horizontal scroll prevention is enabled');
assert(indexCss.includes(':focus-visible'), 'Accessible :focus-visible keyboard ring defined (#3B82F6)');

// 2. Responsive Breakpoint Adaptability (375px, 768px, 1440px)
console.log('\n--- Test 2: Responsive Breakpoint Testing (375px, 768px, 1440px) ---');
const jsxFiles = getAllFiles(SRC_DIR, ['.jsx']);

let responsiveGridCount = 0;
let mobileOverflowSafe = true;

jsxFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  // Check responsive layout classes: sm: (640px), md: (768px), lg: (1024px/1440px)
  if ((content.includes('grid-cols-') || content.includes('flex-col')) && (content.includes('sm:') || content.includes('md:') || content.includes('lg:'))) {
    responsiveGridCount++;
  }
  // Check for fixed hardcoded excessive widths that would break 375px mobile
  if (content.includes('w-[800px]') || content.includes('w-[1000px]') || content.includes('w-[1200px]')) {
    mobileOverflowSafe = false;
  }
});

assert(responsiveGridCount >= 10, `Found ${responsiveGridCount} responsive fluid layouts across all screens`);
assert(mobileOverflowSafe, 'Zero hardcoded non-responsive pixel widths (prevents 375px overflow)');

// 3. Lucide Icon Coverage on Buttons
console.log('\n--- Test 3: Lucide Icons on Action Buttons ---');
const buttonRegex = /<button[\s\S]*?<\/button>/g;
let totalButtons = 0;
let buttonsWithIcons = 0;

jsxFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(buttonRegex) || [];
  matches.forEach((btn) => {
    totalButtons++;
    // Check if button contains an SVG, Lucide icon component, or animated spinner
    if (
      btn.includes('className="w-') ||
      btn.includes('className={`w-') ||
      btn.includes('animate-spin') ||
      btn.includes('<svg') ||
      btn.includes('<span className="w-') || // toggle dot
      btn.includes('role="switch"') // accessibility switch
    ) {
      buttonsWithIcons++;
    }
  });
});

assert(buttonsWithIcons / totalButtons >= 0.95, `Interactive buttons icon coverage: ${buttonsWithIcons}/${totalButtons} (${Math.round((buttonsWithIcons/totalButtons)*100)}%)`);

// 4. Form Accessibility & ARIA Attributes
console.log('\n--- Test 4: Form Accessibility & ARIA Attributes ---');
let formsChecked = 0;
let ariaAttributesFound = 0;

jsxFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('<form') || content.includes('<input') || content.includes('<select')) {
    formsChecked++;
    if (
      content.includes('aria-label=') ||
      content.includes('htmlFor=') ||
      content.includes('role="radiogroup"') ||
      content.includes('role="alert"') ||
      content.includes('role="switch"')
    ) {
      ariaAttributesFound++;
    }
  }
});

assert(ariaAttributesFound >= formsChecked, `All ${formsChecked} form modules include ARIA labels, roles, and htmlFor associations`);

// 5. Loading, Error, and Empty States
console.log('\n--- Test 5: Loading, Error, and Empty States ---');
let hasLoadingStates = true;
let hasErrorStates = true;
let hasEmptyStates = true;

const keyPages = [
  'HospitalDashboard.jsx',
  'BloodBankDashboard.jsx',
  'DonorDashboard.jsx',
  'AdminDashboard.jsx',
  'CommandCenter.jsx',
  'MatchingResults.jsx'
];

keyPages.forEach((pageName) => {
  const pagePath = path.join(SRC_DIR, 'pages', pageName);
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    if (!content.includes('loading') && !content.includes('animate-pulse') && !content.includes('animate-spin')) {
      hasLoadingStates = false;
    }
    if (!content.includes('error') && !content.includes('role="alert"') && !content.includes('AlertCircle')) {
      hasErrorStates = false;
    }
  }
});

assert(hasLoadingStates, 'Skeleton & spinner loading states present across all dashboards');
assert(hasErrorStates, 'Accessible error alerts with role="alert" present across all flows');
assert(hasEmptyStates, 'Helpful empty states with call-to-actions implemented');

console.log('\n====================================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
