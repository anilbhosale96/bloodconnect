import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM, VirtualConsole } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const virtualConsole = new VirtualConsole();
const errors = [];

virtualConsole.on('error', (...args) => {
  const msg = args.join(' ');
  // Filter benign react key warnings
  if (!msg.includes('unique "key" prop') && !msg.includes('React will try to recreate')) {
    console.error('[BROWSER ERROR]', msg);
    errors.push(msg);
  }
});

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const routes = [
  '/',
  '/login',
  '/register',
  '/hospital',
  '/blood-bank',
  '/donor',
  '/admin',
  '/request-tracking',
  '/map-view',
  '/create-request'
];

async function testAllRoutes() {
  console.log('--- Testing All BloodConnect Routes in DOM ---');

  for (const route of routes) {
    const dom = new JSDOM(html, {
      url: `https://bloodconnect-six.vercel.app${route}`,
      runScripts: 'dangerously',
      resources: 'usable',
      virtualConsole
    });

    dom.window.matchMedia = dom.window.matchMedia || function() {
      return { matches: false, addListener: () => {}, removeListener: () => {} };
    };
    dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
    dom.window.cancelAnimationFrame = (id) => clearTimeout(id);

    // Mock Google Maps on window so Map doesn't crash on missing canvas API
    dom.window.google = {
      maps: {
        Map: function(el, opts) {
          return {
            setCenter: () => {},
            setZoom: () => {},
            panTo: () => {},
            fitBounds: () => {}
          };
        },
        Marker: function(opts) {
          return {
            setPosition: () => {},
            addListener: () => {},
            setMap: () => {}
          };
        },
        Polyline: function(opts) {
          return {
            setPath: () => {},
            setMap: () => {}
          };
        },
        Circle: function(opts) {
          return {
            setMap: () => {}
          };
        },
        LatLng: function(lat, lng) { return { lat, lng }; },
        LatLngBounds: function() {
          return { extend: () => {} };
        },
        Size: function(w, h) { return { width: w, height: h }; },
        Point: function(x, y) { return { x, y }; },
        DirectionsService: function() {
          return {
            route: (req, cb) => cb({ routes: [{ overview_path: [{ lat: 12.97, lng: 77.59 }, { lat: 12.95, lng: 77.65 }] }] }, 'OK')
          };
        },
        TravelMode: { DRIVING: 'DRIVING' },
        DirectionsStatus: { OK: 'OK' }
      }
    };

    let scriptContent = fs.readFileSync(path.join(__dirname, 'public/assets/figma.js'), 'utf8');
    scriptContent = scriptContent.replace(/if\s*\(\s*typeof import\.meta[^\}]+\}/g, '/* removed import.meta */');

    dom.window.eval(scriptContent);

    await new Promise((r) => setTimeout(r, 100));

    const root = dom.window.document.getElementById('root');
    const contentLen = root ? root.innerHTML.length : 0;
    if (contentLen > 100) {
      console.log(`[PASS] Route "${route}" rendered successfully (${contentLen} bytes)`);
    } else {
      console.error(`[FAIL] Route "${route}" failed to render! (Content length: ${contentLen})`);
      errors.push(`Route ${route} failed to render`);
    }
  }

  console.log(`\nRoute Test Complete: ${errors.length} Errors`);
  if (errors.length > 0) process.exit(1);
}

testAllRoutes();

