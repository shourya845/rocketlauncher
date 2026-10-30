import { copyFile, mkdir, readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output = new URL('./dist/', import.meta.url);
await mkdir(new URL('vendor/', output), { recursive: true });
const files = ['index.html', 'style.css', 'app.js', 'physics.js', 'leaderboard.js', 'scene3d.js'];
for (const file of files) await copyFile(new URL(file, import.meta.url), new URL(file, output));
for (const [source, destination] of [
  ['build/three.module.js', 'three.js'],
  ['build/three.core.js', 'three.core.js'],
  ['examples/jsm/controls/OrbitControls.js', 'OrbitControls.js'],
]) await copyFile(new URL(`node_modules/three/${source}`, import.meta.url), new URL(`vendor/${destination}`, output));

// Check that only public app assets ship and local module imports can resolve.
assert.deepEqual((await readdir(output)).sort(), [...files, 'vendor'].sort());
for (const file of [...files.filter(file => file.endsWith('.js')), 'vendor/three.js', 'vendor/three.core.js', 'vendor/OrbitControls.js']) {
  const text = await readFile(new URL(file, output), 'utf8');
  for (const [, dependency] of text.matchAll(/(?:from\s*|import\s*\()\s*['"]([./][^'"]+)['"]/g)) {
    await readFile(dependency.startsWith('/') ? new URL(`.${dependency}`, output) : new URL(dependency, new URL(file, output)));
  }
}
console.log('Static build ready in dist/; public files and module imports checked.');
