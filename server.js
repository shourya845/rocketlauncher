import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = { '/': ['index.html', 'text/html'], '/style.css': ['style.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'], '/physics.js': ['physics.js', 'text/javascript'] };
Object.assign(files, {
  '/leaderboard.js': ['leaderboard.js', 'text/javascript'],
  '/scene3d.js': ['scene3d.js', 'text/javascript'],
  '/vendor/three.js': ['node_modules/three/build/three.module.js', 'text/javascript'],
  '/vendor/three.core.js': ['node_modules/three/build/three.core.js', 'text/javascript'],
  '/vendor/OrbitControls.js': ['node_modules/three/examples/jsm/controls/OrbitControls.js', 'text/javascript'],
});
http.createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try { res.setHeader('Content-Type', file[1]); res.end(await readFile(new URL(file[0], import.meta.url))); }
  catch { res.writeHead(500); res.end('Unable to load the simulator.'); }
}).listen(3000, '127.0.0.1', () => console.log('Rocket Launcher: http://localhost:3000'));
