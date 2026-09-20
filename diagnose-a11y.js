import fs from 'fs';
import path from 'path';

const SRC = path.resolve('src');
function getFiles(d) {
  let f = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) f = f.concat(getFiles(p));
    else if (p.endsWith('.jsx')) f.push(p);
  }
  return f;
}

const files = getFiles(SRC);
console.log('--- Checking buttons without icons ---');
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const btns = content.match(/<button[\s\S]*?<\/button>/g) || [];
  btns.forEach((b, idx) => {
    const hasIcon = b.includes('className="w-') || b.includes('className={`w-') || b.includes('animate-spin') || b.includes('<svg') || b.includes('<span className="w-') || b.includes('role="switch"');
    if (!hasIcon) {
      console.log(path.relative(SRC, f), 'button #', idx + 1, ':', b.slice(0, 100).replace(/\n/g, ' '));
    }
  });
}

console.log('\n--- Checking role=alert in key pages ---');
const keyPages = ['HospitalDashboard.jsx', 'BloodBankDashboard.jsx', 'DonorDashboard.jsx', 'AdminDashboard.jsx', 'CommandCenter.jsx', 'MatchingResults.jsx'];
for (const p of keyPages) {
  const full = path.join(SRC, 'pages', p);
  if (fs.existsSync(full)) {
    const c = fs.readFileSync(full, 'utf8');
    const hasAlert = c.includes('role="alert"');
    console.log(p, 'has role=alert:', hasAlert);
  }
}

console.log('\n--- Checking form modules without ARIA ---');
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('<form') || c.includes('<input') || c.includes('<select')) {
    const hasAria = c.includes('aria-label=') || c.includes('htmlFor=') || c.includes('role="radiogroup"') || c.includes('role="alert"') || c.includes('role="switch"');
    if (!hasAria) {
      console.log('Form file without ARIA:', path.relative(SRC, f));
    }
  }
}

