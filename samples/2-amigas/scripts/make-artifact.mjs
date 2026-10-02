/**
 * Turns dist-artifact/ into a claude.ai Artifact bundle in artifact/:
 * - strips the document skeleton (the Artifact host adds its own),
 * - adds an import map pointing three / gsap at jsDelivr (pinned to the
 *   versions installed in node_modules),
 * - copies the hashed assets alongside.
 */
import fs from 'fs';
import path from 'path';

const src = 'dist-artifact';
const out = 'artifact';
const version = (pkg) => JSON.parse(fs.readFileSync(`node_modules/${pkg}/package.json`, 'utf8')).version;
const three = version('three');
const gsap = version('gsap');

let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
const rest = head
  .replace(title, '')
  .replace(/<meta charset[^>]*>/, '')
  .replace(/<meta name="viewport"[^>]*>/, '');
const importMap = `<script type="importmap">${JSON.stringify({
  imports: {
    three: `https://cdn.jsdelivr.net/npm/three@${three}/build/three.module.js`,
    'three/examples/jsm/': `https://cdn.jsdelivr.net/npm/three@${three}/examples/jsm/`,
    gsap: `https://cdn.jsdelivr.net/npm/gsap@${gsap}/index.js`,
    'gsap/': `https://cdn.jsdelivr.net/npm/gsap@${gsap}/`,
  },
})}</script>`;
// gsap/ScrollTrigger is imported without ".js"; map it explicitly.
const fixedMap = importMap.replace('"gsap/":', `"gsap/ScrollTrigger":"https://cdn.jsdelivr.net/npm/gsap@${gsap}/ScrollTrigger.js","gsap/":`);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), `${title}\n${fixedMap}\n${rest.trim()}\n${body.trim()}\n`);
fs.cpSync(path.join(src, 'assets'), path.join(out, 'assets'), { recursive: true });
for (const f of fs.readdirSync(src)) if (f.endsWith('.svg')) fs.copyFileSync(path.join(src, f), path.join(out, f));
console.log('artifact/ ready:', fs.readdirSync(path.join(out, 'assets')).join(', '));
