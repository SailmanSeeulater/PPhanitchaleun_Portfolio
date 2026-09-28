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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { __AI_STATS__: JSON.stringify(AI_STATS) },
})
