import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { runScan } from './dist/scan.js';
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png' };
const serve = (dir) => new Promise((res) => {
  const s = createServer(async (rq, rs) => {
    const p = (rq.url ?? '/').split('?')[0];
    const f = join(dir, p === '/' ? 'index.html' : p.slice(1));
    try { const b = await readFile(f); rs.writeHead(200, {'content-type': MIME[extname(f)] ?? 'text/plain'}); rs.end(b); }
    catch { rs.writeHead(404).end('x'); }
  });
  s.listen(0, '127.0.0.1', () => res([`http://127.0.0.1:${s.address().port}`, s]));
});
const fired = new Set();
for (const d of await readdir('test/fixtures', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const dir = join('test/fixtures', d.name);
  let pages = []; try { pages = (await readdir(dir)).filter((f) => f.endsWith('.html')); } catch {}
  const [url, server] = pages.length ? await serve(dir) : [null, null];
  for (const mode of [false, true]) {
    try {
      const r = await runScan({ root: dir, urls: url ? pages.map((p) => p === 'index.html' ? url : `${url}/${p}`) : [], viewports: [375, 1440], codeCategories: mode, ephemeral: true });
      for (const f of [...r.findings, ...r.advisory]) fired.add(f.ruleId);
    } catch {}
  }
  server?.close();
}
console.log([...fired].sort().join('\n'));
