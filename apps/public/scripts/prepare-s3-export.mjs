import { readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Next.js `output: "export"` は /apply/teacher を apply/teacher.html として出す。
 * CloudFront + S3 REST は拡張子なしキーを探すため 403 AccessDenied になる。
 *
 * ローカルでは apply/teacher がディレクトリ（complete 配下）なのでファイルを置けない。
 * S3 はキーなので apply/teacher.html を apply/teacher としてもアップロードする。
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'out');
const SKIP = new Set(['index.html', '404.html']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else {
      files.push(path);
    }
  }
  return files;
}

const mappings = (await walk(outDir))
  .filter((path) => {
    const name = path.split('/').pop() ?? '';
    return name.endsWith('.html') && !SKIP.has(name);
  })
  .map((htmlPath) => {
    const relHtml = relative(outDir, htmlPath);
    return `${relHtml} ${relHtml.replace(/\.html$/, '')}`;
  })
  .sort();

await writeFile(join(root, '.s3-html-keys'), `${mappings.join('\n')}\n`);

console.log(
  `Prepared ${mappings.length} S3 HTML key mappings:\n${mappings.join('\n')}`,
);
