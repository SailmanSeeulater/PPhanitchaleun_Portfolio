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
- The site is a single page: hero, projects, tech stack, contact.

## Capabilities and Constraints

- Stack: React 19 + Vite single-file app (`src/App.jsx`), plain injected CSS, no UI library.
- Hosting: static build served by nginx from `/var/www/portfolio` on the Oracle VPS; every push to `main` deploys via `.github/workflows/deploy.yml` (needs the `VPS_SSH_KEY` repo secret).
- Features in place: 11 selectable color themes (persisted), clickable tech badges that list which repos use a skill, a music player for Perfect's own tracks (12 SoundCloud releases self-hosted as 128 kbps MP3 in `public/music/`, listed in `src/tracks.js`; a Web Audio analyser drives the background dots and the player's equalizer bars), GoatCounter analytics with a public visitor count (site code `latesailor`).
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
- Other repos: SHMA / Gibbi-Backend (Kotlin, Spring Boot), Odins Kin (Python, Flask, SQLite), Fight Up The Hill (C++).
- Assets: headshot (`src/assets/profile.jpg`), project screenshots (`src/assets/screenshots/`), résumé PDF.
- Absent, must not be fabricated: testimonials, employer names, internship history, metrics beyond those above, school and graduation date.

## Product Principles

1. Recruiter first: the first viewport answers "who, what role, why this person" without scrolling.
2. Proof over adjectives: every claim is a shipped thing, a link, or a number already in evidence.
3. Live beats described: link to running software on Perfect's own infrastructure whenever possible.
4. Personality supports, never blocks: playful features must not slow the page or bury the résumé and projects.
5. Honest credit: collaborative work names its collaborators.

## Accessibility & Inclusion

No product-specific requirement stated; target WCAG 2.2 AA across every theme, respect reduced motion, and keep keyboard access to all interactive features.
