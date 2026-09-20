import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM, VirtualConsole } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const virtualConsole = new VirtualConsole();
virtualConsole.on('error', (...args) => console.error('[BROWSER ERROR]', ...args));
virtualConsole.on('warn', (...args) => console.warn('[BROWSER WARN]', ...args));
virtualConsole.on('log', (...args) => console.log('[BROWSER LOG]', ...args));

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const dom = new JSDOM(html, {
  url: 'https://bloodconnect-six.vercel.app/request-tracking',
  runScripts: 'dangerously',
  resources: 'usable',
  virtualConsole
});

dom.window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
dom.window.cancelAnimationFrame = (id) => clearTimeout(id);

// Pre-set authenticated session in localStorage so it doesn't redirect to login
dom.window.localStorage.setItem('bloodconnect_session', JSON.stringify({
  user: { id: 'test-user', email: 'hospital@lifelink.org', role: 'HOSPITAL', full_name: 'Dr. Rao' },
  access_token: 'fake-token',
  expires_at: Math.floor(Date.now() / 1000) + 86400
}));

let scriptContent = fs.readFileSync(path.join(__dirname, 'public/assets/figma.js'), 'utf8');
scriptContent = scriptContent.replace(/if\s*\(\s*typeof import\.meta[^\}]+\}/g, '/* removed import.meta */');

try {
  dom.window.eval(scriptContent);
  setTimeout(() => {
    console.log('\n--- Checking Rendered DOM ---');
    const root = dom.window.document.getElementById('root');
    console.log('Root HTML length:', root ? root.innerHTML.length : 0);
    console.log('Snippet:', root ? root.innerHTML.slice(0, 400) : 'empty');
  }, 400);
} catch (e) {
  console.error('Fatal eval error:', e.message, e.stack);
}

