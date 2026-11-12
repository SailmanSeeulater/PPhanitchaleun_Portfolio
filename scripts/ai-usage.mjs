// Sums the tokens Claude Code has used on this machine and writes src/ai-usage.json.
// Reads the local session transcripts (~/.claude/projects/**/*.jsonl), which the deploy
// runner does not have, so the result is committed and refreshed by hand:
//   npm run usage
// Claude Code deletes old transcripts, so a fresh count would lose history. Each run therefore
// adds only what happened after the last counted reply ("through") to the totals already saved.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
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

const saved = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null
// Older files have no "through": everything up to the end of their asOf day is already counted.
const cutoff = saved ? Date.parse(saved.through ?? `${saved.asOf}T23:59:59.999`) : -Infinity
const totals = saved
  ? { input: saved.tokens.input, output: saved.tokens.output, cacheWrite: saved.tokens.cacheWrite, cacheRead: saved.tokens.cacheRead }
  : { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 }
const seen = new Set() // a streamed reply is logged once per content block, all with the same ids
let projects = 0
let since = saved ? Date.parse(`${saved.since}T00:00:00`) : Infinity
let until = saved ? cutoff : -Infinity
let added = 0

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
      const ts = Date.parse(entry.timestamp)
      if (saved && !(ts > cutoff)) continue // already in the saved totals, or undated
      const key = `${entry.message.id ?? entry.uuid}:${entry.requestId ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      added += (usage.input_tokens || 0) + (usage.output_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0)
      totals.input += usage.input_tokens || 0
      totals.output += usage.output_tokens || 0
      totals.cacheWrite += usage.cache_creation_input_tokens || 0
      totals.cacheRead += usage.cache_read_input_tokens || 0
      if (!Number.isNaN(ts)) { since = Math.min(since, ts); until = Math.max(until, ts) }
    }
  }
}

const day = (ms) => new Date(ms).toLocaleDateString('en-CA') // YYYY-MM-DD, local time
const result = {
  tokens: { ...totals, total: totals.input + totals.output + totals.cacheWrite + totals.cacheRead },
  replies: (saved?.replies ?? 0) + seen.size,
  projects: Math.max(saved?.projects ?? 0, projects),
  since: day(since),
  asOf: day(until),
  through: new Date(until).toISOString(),
}
writeFileSync(out, JSON.stringify(result, null, 2) + '\n')
console.log(result)
if (saved) console.log(`added ${added.toLocaleString('en-US')} tokens from ${seen.size} replies since ${new Date(cutoff).toISOString()}`)
