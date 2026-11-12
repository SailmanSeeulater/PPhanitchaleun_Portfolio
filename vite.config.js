import { execFileSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Counts for the tech stack's AI row, read from git history so they never go stale.
// A shallow clone would undercount, so it reports 0 and the site falls back to wording without numbers.
function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}
const shallow = git('rev-parse', '--is-shallow-repository') !== 'false'
const count = (...args) => (shallow ? 0 : Number(git('rev-list', '--count', ...args, 'HEAD')) || 0)
const AI_STATS = {
  claudeCommits: count('-i', '--grep=Co-Authored-By: Claude'),
  nextixPRs: count('--merges', '--grep=/nextix/issue-'),
}

// Visitor total at build time, shown when a content blocker stops the browser asking GoatCounter itself.
// 0 when the request fails, and the footer then shows nothing until the live count arrives.
async function visitorCount() {
  try {
    const res = await fetch('https://latesailor.goatcounter.com/counter/TOTAL.json', { signal: AbortSignal.timeout(5000) })
    return res.ok ? Number(String((await res.json()).count).replace(/\D/g, '')) || 0 : 0
  } catch {
    return 0
  }
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  // Two pages: the Showcase site at / and the previous multi-layout site at /archive/.
  build: { rollupOptions: { input: { main: 'index.html', archive: 'archive/index.html' } } },
  define: { __AI_STATS__: JSON.stringify(AI_STATS), __VISITOR_COUNT__: JSON.stringify(await visitorCount()) },
}))
