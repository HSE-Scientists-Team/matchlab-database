import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

// Mermaid uses DOMPurify even during parsing. Provide a local DOM, no browser or network.
const { window } = new JSDOM('');
globalThis.window = window;
globalThis.document = window.document;
const { default: mermaid } = await import('mermaid');
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
const files = execFileSync('git', ['ls-files', '-z', '*.md'], { encoding: 'utf8' }).split('\0').filter(Boolean);
let count = 0;
for (const file of files) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)) {
    try {
      await mermaid.parse(match[1]);
    } catch (error) {
      throw new Error(`Invalid Mermaid diagram in ${file}`, { cause: error });
    }
    count++;
  }
}
if (count === 0) throw new Error('No Mermaid diagrams found');
console.log(`Mermaid parsed successfully: ${count} diagrams`);
window.close();
