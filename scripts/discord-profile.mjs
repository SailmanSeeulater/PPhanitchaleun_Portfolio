// Refreshes my saved Discord profile (src/discord.json) and its avatar (public/icons/discord/) by hand:
//   npm run discord
// Discord only tells a bot who someone is, so this asks japi.rest, which looks public profiles up with one. The
// live status in the Discord window comes from Lanyard in the visitor's browser instead, and doesn't need this.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, 'src', 'discord.json')
const saved = JSON.parse(readFileSync(file, 'utf8'))

const res = await fetch(`https://japi.rest/discord/v1/user/${saved.id}`)
if (!res.ok) throw new Error(`japi.rest answered ${res.status}`)
const { data } = await res.json()
if (!data?.username) throw new Error('japi.rest gave back no profile')

// A new avatar replaces the saved picture; the file keeps its name, so the page needn't change.
if (data.avatar && data.avatar !== saved.avatarHash) {
  const img = await fetch(`https://cdn.discordapp.com/avatars/${saved.id}/${data.avatar}.webp?size=256`)
  if (!img.ok) throw new Error(`Discord's CDN answered ${img.status} for the avatar`)
  writeFileSync(join(root, 'public', saved.avatar), Buffer.from(await img.arrayBuffer()))
  console.log('saved the new avatar')
}

const next = {
  ...saved,
  username: data.username,
  globalName: data.global_name ?? data.username,
  avatarHash: data.avatar ?? saved.avatarHash,
  bannerColor: data.banner_color ?? saved.bannerColor,
  publicFlags: data.public_flags ?? 0,
  asOf: new Date().toLocaleDateString('en-CA'),
}
writeFileSync(file, JSON.stringify(next, null, 2) + '\n')
console.log(next)
