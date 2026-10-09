// Sums the tokens Claude Code has used on this machine and writes src/ai-usage.json.
// Reads the local session transcripts (~/.claude/projects/**/*.jsonl), which the deploy
// runner does not have, so the result is committed and refreshed by hand:
//   npm run usage
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const home = process.env.USERPROFILE || process.env.HOME
const root = join(home, '.claude', 'projects')
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'ai-usage.json')

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return walk(p)
    return p.endsWith('.jsonl') ? [p] : []
  })

const totals = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 }
const seen = new Set() // a streamed reply is logged once per content block, all with the same ids
let projects = 0
let since = Infinity
let until = -Infinity

for (const project of readdirSync(root)) {
  const files = walk(join(root, project))
  if (files.length) projects++
  for (const file of files) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue
      let entry
      try { entry = JSON.parse(line) } catch { continue }
      const usage = entry?.message?.usage
      if (!usage) continue
      const key = `${entry.message.id ?? entry.uuid}:${entry.requestId ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      totals.input += usage.input_tokens || 0
      totals.output += usage.output_tokens || 0
      totals.cacheWrite += usage.cache_creation_input_tokens || 0
      totals.cacheRead += usage.cache_read_input_tokens || 0
      const ts = Date.parse(entry.timestamp)
      if (!Number.isNaN(ts)) { since = Math.min(since, ts); until = Math.max(until, ts) }
    }
  }
}

const day = (ms) => new Date(ms).toLocaleDateString('en-CA') // YYYY-MM-DD, local time
const result = {
  tokens: { ...totals, total: totals.input + totals.output + totals.cacheWrite + totals.cacheRead },
  replies: seen.size,
  projects,
  since: day(since),
  asOf: day(until),
}
writeFileSync(out, JSON.stringify(result, null, 2) + '\n')
console.log(result)
