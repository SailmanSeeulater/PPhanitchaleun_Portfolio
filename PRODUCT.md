# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters screening students and new grads for software engineering internships and entry-level roles. They scan fast, often in under a minute, deciding whether to pass the candidate to an engineer or open the résumé.

Secondary (inferred from content, not confirmed as a priority): engineers who follow the links into live demos and GitHub repos to check depth.

## Product Purpose

A personal portfolio for Perfect Phanitchaleun, a student who is job hunting. It exists to land an internship or first full-time software role by proving, in the first screen and the project section, that Perfect ships real, deployed systems.

Success: a recruiter leaves able to say what kind of engineer Perfect is, names at least one concrete project result, and downloads the résumé or reaches out.

## Positioning

Perfect builds and runs their own production infrastructure, not just class assignments: the projects are live on their own domain (latesailor.dev) behind nginx and Docker (pdfyier confirmed on Oracle Cloud), with CI pipelines and security fixes they found themselves. Target fit: backend engineer, DevOps / platform engineer, full-stack engineer.

## Operating Context

- Visitors arrive from a résumé, LinkedIn, or a job application link, usually on a laptop, sometimes on a phone.
- The résumé PDF (`public/resume.pdf`) is a primary conversion action.
- Contact happens by email (perfectphanitchaleun@gmail.com), LinkedIn, or GitHub.
- The site is a single page: hero, projects, experience, tech stack, contact.

## Capabilities and Constraints

- Stack: React 19 + Vite single-file app (`src/App.jsx`), plain injected CSS, no UI library.
- Hosting: static build served by nginx from `/var/www/portfolio` on the Oracle VPS; every push to `main` deploys via `.github/workflows/deploy.yml` (needs the `VPS_SSH_KEY` repo secret).
- Features in place: five switchable page layouts (Original, Swiss, Sliding, Terminal, Chaos; `src/layouts.js`, persisted, `?layout=` URL override), 38 selectable color themes (persisted), clickable tech badges that list which repos use a skill, a music player for Perfect's own tracks (12 SoundCloud releases self-hosted as 128 kbps MP3 in `public/music/`, listed in `src/tracks.js`; a Web Audio analyser drives the background dots and the player's equalizer bars), GoatCounter analytics with a public visitor count (site code `latesailor`).
- Undecided: school name and graduation date are not provided and must not be displayed until confirmed.

## Brand Commitments

- Name: Perfect Phanitchaleun. Mark: "PP". Online handle: latesailor / "Later" (SoundCloud).
- Origin line: San Diego based, originally from Laos.
- Voice: casual and direct with personality ("Let's grab some coffee"). Project copy is concrete and results-first.
- Copy rule: no em dashes in written copy.
- Collaborative work must credit collaborators (Lonely Chess is built with Nicolaus ReyasBautista).

## Evidence on Hand

- Mordi (mordi.latesailor.dev): Spring Boot REST API with JWT auth; found and rotated a plaintext JWT secret and DB password; closed an account enumeration hole; Redis rate limiting; GitHub Actions CI that caught 9 defects before deploy.
- Lonely Chess (lonelychess.latesailor.dev): esoteric language where PGN chess games execute as code; Python interpreter plus TypeScript in-browser port; FizzBuzz as a 2,669 move game. CS 420 final project with Nicolaus ReyasBautista.
- pdfyier (pdfyier.latesailor.dev): image-to-PDF tool, FastAPI + ImageMagick behind nginx, RAM-backed temp storage.
- Odin's Kin (github.com/SailmanSeeulater/odins_kin, runs locally on Windows, not deployed): Tkinter + Pillow desktop tracker and a Flask dashboard styled after iOS Screen Time; fixed a bug that re-saved earlier sessions' events (about 3 hours double counted in real data) and a KeyError that lost sessions on stop; window titles dropped by default, YouTube links matched from browser history; closed an XSS hole where window titles rendered as HTML; save animation cut from ~30 ms to ~2 ms a frame (60 fps); 26 unit tests. Screenshots use synthetic demo data.
- H.E.R.S.365 (Web Developer Intern, Jul to Aug 2026, Oceanside, CA, remote; a moderated community platform for girls' flag football): fixed 2 pre-launch Stripe billing defects (a webhook path that charged without recording the transaction, a lookup that billed the wrong tier), each proven by reintroducing the bug and watching the new test fail; built a COPPA-compliant parent approval sign-in on the existing JWT layer; containerized production with Docker Compose and nginx; automated nightly PostgreSQL backups with compression, retention pruning, and integrity checks. Source: the backend résumé. Listed in the Experience section (`EXPERIENCE` in `src/App.jsx`).
- Other repos: SHMA / Gibbi-Backend (Kotlin, Spring Boot), Fight Up The Hill (C++).
- AI work to date is how this portfolio gets built, not a feature shipped inside a project: Claude Code writes changes here (co-authored commits since the layouts work), and nexTix turns a written issue into a branch, a lint and build run, and a pull request Perfect reviews and merges. The tech stack section lists this as "AI & Automation" with only the two tools that have a paper trail (Claude Code, nexTix), popups whose counts are read from git history at build time, and a strip showing the issue to deploy path. Nothing beyond that is claimed: no model APIs, RAG, or fine tuning until there is a repo behind it.
- The hero also carries a small box with the Claude Code tokens Perfect has used across every project on their machine, next to an estimated water figure. Tokens are summed from the local Claude Code transcripts by `scripts/ai-usage.mjs` into `src/ai-usage.json` (refreshed by hand with `npm run usage`, since the deploy runner has no transcripts). Water applies Mistral's published 45 mL per 400 token reply to freshly processed tokens only, and the box says so.
- Assets: headshot (`src/assets/profile.jpg`), project screenshots (`src/assets/screenshots/`), résumé PDF.
- Absent, must not be fabricated: testimonials, employers or internships beyond those in the Experience section, metrics beyond those above, school and graduation date.

## Product Principles

1. Recruiter first: the first viewport answers "who, what role, why this person" without scrolling.
2. Proof over adjectives: every claim is a shipped thing, a link, or a number already in evidence.
3. Live beats described: link to running software on Perfect's own infrastructure whenever possible.
4. Personality supports, never blocks: playful features must not slow the page or bury the résumé and projects.
5. Honest credit: collaborative work names its collaborators.

## Accessibility & Inclusion

No product-specific requirement stated; target WCAG 2.2 AA across every theme, respect reduced motion, and keep keyboard access to all interactive features.
