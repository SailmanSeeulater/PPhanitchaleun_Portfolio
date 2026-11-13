// Everything the two sites say about the work: projects, experience, tech stack. Shared by the Showcase
// site (Stage.jsx) and the archived site (App.jsx).
import AI_USAGE from "./ai-usage.json";
import mordiShot from "./assets/screenshots/mordi-full.webp";
import lonelyChessShot from "./assets/screenshots/lonely-chess-full.webp";
import pdfyierShot from "./assets/screenshots/pdfyier-full.webp";
import odinsKinShot from "./assets/screenshots/odins-kin-full.webp";
import nextixShot from "./assets/screenshots/nextix-full.webp";
import zwansShot from "./assets/screenshots/zwans-full.webp";
import gitubeShot from "./assets/screenshots/gitube-full.webp";
import metroNodesShot from "./assets/screenshots/metro-nodes-full.webp";
import matchaManagerShot from "./assets/screenshots/matcha-manager-full.webp";

// Devicon SVGs (MIT), copied into public/ so no third-party request stands between the visitor and the icons.
const DEVICON = "/icons/dev";
const GITHUB = "https://github.com/SailmanSeeulater";

const rich = (text) =>
  text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <mark key={i} className="hl">{part}</mark> : part));

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const EXPERIENCE = [
  {
    role: "Founding Engineer",
    org: "Stealth Startup",
    about: "Coming soon...",
    meta: ["Sep 2026 to Present", "San Diego, CA"],
    bullets: [
      "**67 to the flow state**"
    ],
    stack: ["67"],
  },
  {
    role: "Web Developer Intern",
    org: "H.E.R.S.365",
    about: "a moderated community platform for girls' flag football",
    meta: ["Jul to Aug 2026", "Oceanside, CA", "Remote"],
    bullets: [
      "Audited the Stripe integration before launch and fixed **2 billing defects**, a webhook path that could charge without recording the transaction and a price lookup that billed the wrong tier, each proven by a regression test.",
      "Built a **COPPA parent-approval sign-in flow** on the existing JWT layer, sharing token rules with password sign-in.",
      "Automated **nightly PostgreSQL backups** with integrity checks and containerized the app behind nginx.",
    ],
    stack: ["Stripe", "JWT", "PostgreSQL", "Docker", "nginx"],
  },
];

const PROJECTS = [
  {
    name: "Zwans",
    kind: "Agent harness",
    summary: "A coding agent built from scratch: the model loop, the tools, the permission policy, the sandbox, and the evals that measure every change.",
    bullets: [
      "Wrote the agent end to end over the Claude Messages API: the tool loop, file and shell tools, session resume, context compaction, prompt caching, subagents, an MCP client, hooks, and skills. A permission policy splits every Bash command into the simple commands it runs before deciding to run it, ask first, or refuse.",
      "Built an eval platform of 48 tasks across starter, hard, and prompt injection suites, each checked by hidden tests, with runs compared by 95% confidence intervals from a paired bootstrap. It showed prompt caching **cuts cost by 57%**, and that Zwans passes the same starter suite as Claude Code while costing 12% less per attempt.",
      "Wrote a Linux sandbox in Rust (namespaces, seccomp, Landlock) that starts a command in **4 ms against 38 ms for docker exec** at the same pass rate, and a FastAPI and Next.js web UI where several browser tabs and terminals share one live session.",
    ],
    stack: ["Python", "Claude API", "FastAPI", "WebSockets", "Rust", "Docker", "Next.js", "TypeScript", "MCP"],
    skills: ["Claude Code", "React", "Bash", "Linux", "Git", "GitHub"],
    repo: `${GITHUB}/zwans`,
    // Runs on the local machine only, so there's no live site: the preview is the eval dashboard from `zwans serve`
    demo: { domain: "127.0.0.1:8765/evals", image: zwansShot, height: 1538 },
  },
  {
    name: "nexTix",
    kind: "Agent platform",
    summary: "A ticket board for coding agents: describe a change in one sentence, and a Claude agent works it in an isolated Docker sandbox and opens a pull request.",
    bullets: [
      "Built the pipeline end to end: Claude triages a one line request into a GitHub issue, a Celery worker runs Claude Code in a locked down Docker container, and the board streams the agent's work live over SSE until the pull request opens. Review comments on the PR start a follow up run on the same branch.",
      "Kept write access out of the sandbox: the agent clones with a **read-only, repo-scoped token**, secrets arrive as a file deleted on first read, outbound traffic goes through an allowlist proxy, and the worker scans every outgoing commit for leaked credentials before it pushes.",
      "Backed it with **about 1,000 automated tests** across the FastAPI backend, the sandbox runner, the CLI, and the Next.js board, including race tests against real Postgres and a WCAG contrast gate over all 36 color themes.",
    ],
    stack: ["Python", "FastAPI", "Celery", "PostgreSQL", "Redis", "Docker", "Next.js", "TypeScript", "Claude Agent SDK", "GitHub Actions"],
    skills: ["Claude Code", "React", "SQL", "CSS3", "Vitest", "ESLint", "Linux", "Git", "GitHub"],
    repo: `${GITHUB}/nextix`,
    // Runs locally against a GitHub App, so there's no live site: the preview is the board with demo data
    demo: { domain: "localhost:3000", image: nextixShot, height: 625 },
  },
  {
    name: "gitube",
    kind: "Data visualisation",
    summary: "A tube map of any GitHub repo, and of anyone's life on GitHub. It runs entirely in the browser: no clone, no server, no sign-up.",
    bullets: [
      "Paste owner/repo and every branch becomes a line that forks and merges like a metro map, in three layouts (Metro, Organic, Coral). Paste a login instead and their repos become lines through the years, in seven views from a constellation to an htop style monitor.",
      "Fit a whole repo inside GitHub's **60 requests an hour** limit for visitors without a token: about one compare call per branch, a history walk that stops once every fork point connects, and one GraphQL query per 40 branches when a token is present.",
      "Covered the graph building, the layouts, and all 26 color themes with **2,802 Vitest tests**, and shipped it as a static site with share links, replay, and PNG export.",
    ],
    stack: ["TypeScript", "React", "Vite", "Tailwind CSS", "Canvas", "d3-force", "Octokit", "TanStack Query", "Zustand", "Vitest"],
    skills: ["JavaScript", "HTML5", "CSS3", "Git", "GitHub"],
    live: "https://gitube.latesailor.dev",
    repo: `${GITHUB}/gitube`,
    demo: { domain: "gitube.latesailor.dev", image: gitubeShot, height: 2103 },
  },
  {
    name: "Mordi",
    kind: "Web app",
    summary: "A goal tracker with daily logs and weekly mood reports, self-hosted and shipped through CI.",
    bullets: [
      "Audited the API and found a JWT signing secret and database password committed **in plaintext since the first commit**. Rotated both, closed an account enumeration hole in login, and added Redis backed rate limiting.",
      "Set up a GitHub Actions CI pipeline (JUnit, Mockito, ESLint, Vitest, production build) that has **caught 9 defects before deploy**, including one that would have crashed the API on startup.",
      "Built the Spring Boot REST API with JWT auth for goal tracking, daily logging, and automatic weekly mood and completion reports. Every schema change ships through a reviewed Flyway migration instead of framework auto generation.",
    ],
    stack: ["Java", "Spring Boot", "Spring Security", "React", "PostgreSQL", "Redis", "Docker", "nginx", "GitHub Actions"],
    skills: ["JavaScript", "HTML5", "CSS3", "SQL", "JUnit", "Mockito", "ESLint", "Vitest", "Linux", "Git", "GitHub"],
    live: "https://mordi.latesailor.dev",
    repo: `${GITHUB}/Mordi`,
    demo: { domain: "mordi.latesailor.dev", image: mordiShot, height: 1315 },
  },
  {
    name: "Lonely Chess",
    kind: "Language",
    summary: "A programming language where a legal game of chess is the source code.",
    credit: "Built with Nicolaus ReyasBautista · CS 420 final project",
    bullets: [
      "Co-designed an esoteric language where legal PGN chess notation executes as source code, then built the Python interpreter for it: a state machine parsing moves into integer and string declarations, loops, conditionals, modulo, and four function arithmetic.",
      "Implemented FizzBuzz (1 to 100) as a **2,669 move chess game**, exercising nested conditionals, string concatenation, and implicit else branching.",
      "Ported the interpreter to TypeScript so programs run **entirely in the browser**, on a Next.js site with a live PGN runner, a playable board, and five unabridged sample programs.",
    ],
    stack: ["Python", "TypeScript", "Next.js", "PGN Notation", "Interpreter Design"],
    skills: ["React", "CSS3", "nginx", "Linux", "Git", "GitHub"],
    live: "https://lonelychess.latesailor.dev/",
    repo: `${GITHUB}/Lonely-Chess-CS-420`,
    demo: { domain: "lonelychess.latesailor.dev", image: lonelyChessShot, height: 4884 },
  },
  {
    name: "Metro Nodes",
    kind: "Obsidian plugin",
    summary: "An Obsidian plugin that draws your vault as a metro map: notes are stations, links are colored lines, and notes where lines meet are interchanges.",
    bullets: [
      "Wrote the layout as pure functions that turn notes into stations, lines, lanes, and octilinear routes, with four ways to build the lines: by links, tags, folders, or a frontmatter property.",
      "Kept the layout, the SVG renderer, and the UI **free of Obsidian's API**, so the same map runs in a plain browser page and I can iterate without reloading the plugin.",
    ],
    stack: ["TypeScript", "Obsidian API", "SVG", "esbuild"],
    skills: ["JavaScript", "CSS3", "Git", "GitHub"],
    repo: `${GITHUB}/Metro-Nodes`,
    // An Obsidian plugin, so there's no live site: the preview is the bundled demo vault in the browser harness
    demo: { domain: "localhost:5178/harness", image: metroNodesShot, height: 625 },
  },
  {
    name: "Matcha Manager",
    kind: "Game",
    summary: "A pixel art café game in Unity: customers order, you build each drink from an ingredient tree, and you serve it before their patience runs out.",
    credit: "CS 583 class project",
    bullets: [
      "Designed **24 drink recipes** around a drink tree that works like a file browser, with order changes, mumbled orders, hot snacks that burn, and pay tied to how long each customer waited.",
      "Generated the whole scene from code: an editor script rebuilds it from the art, recipes, and settings, and the drink tree is imported from an Obsidian vault, so a new recipe reaches the game and its recipe book with no hand editing.",
    ],
    stack: ["C#", "Unity 6", "Editor Tooling"],
    skills: ["Git", "GitHub"],
    repo: `${GITHUB}/MatchaManager`,
    // A desktop game, so there's no live site: the preview is gameplay, then the 24 finished drinks
    demo: { domain: "Unity 6 · desktop build", image: matchaManagerShot, height: 1243 },
  },
  {
    name: "pdfyier",
    kind: "Tool",
    summary: "Turn a batch of images into one PDF without your files ever touching a disk.",
    bullets: [
      "Drop or select a batch of images (JPG, PNG, WEBP, BMP, TIFF, GIF), drag to reorder pages, then name and download one merged PDF.",
      "Runs through nginx and a FastAPI backend that shells out to ImageMagick and streams the finished PDF back in the same request. **Uploads never touch persistent disk**, temp storage is RAM backed on both host and container.",
    ],
    stack: ["Python", "FastAPI", "ImageMagick", "nginx", "Docker", "Oracle Cloud"],
    skills: ["HTML5", "Linux", "Git", "GitHub"],
    live: "https://pdfyier.latesailor.dev",
    repo: `${GITHUB}/pdfyier`,
    demo: { domain: "pdfyier.latesailor.dev", image: pdfyierShot, height: 625 },
  },
  {
    name: "Odin's Kin",
    kind: "Desktop app",
    summary: "A Windows screen time tracker: a desktop app that records which app has focus, and a local dashboard that shows where the day went.",
    bullets: [
      "Tracked down why my history looked inflated: every stop re-saved all earlier events, **double counting about 3 hours** of real sessions, and a KeyError on stop lost sessions outright. Fixed both, wrote a repair script, and added 26 unit tests.",

    ],
    stack: ["Python", "Tkinter", "Pillow", "Flask", "SQLite", "pywin32", "JavaScript"],
    skills: ["HTML5", "CSS3", "SQL", "PostgreSQL", "Git", "GitHub"],
    repo: `${GITHUB}/odins_kin`,
    // Runs locally, so there's no live site: the preview shows the dashboard on localhost
    demo: { domain: "127.0.0.1:5000", image: odinsKinShot, height: 1472 },
  },
];

const OTHER_REPOS = [
  { name: "SHMA", href: `${GITHUB}/Gibbi-Backend`, skills: ["Kotlin", "Spring Boot", "Spring Security", "PostgreSQL", "SQL", "Docker", "Git", "GitHub"] },
  { name: "Fight Up The Hill", href: `${GITHUB}/CS-210-Final-Project`, skills: ["C++", "Git", "GitHub"] },
  // This site: the AI work so far is how it gets built, not a feature inside a project
  { name: "This portfolio", href: `${GITHUB}/PPhanitchaleun_Portfolio`, skills: ["Claude Code", "nexTix"] },
];

const SKILL_SOURCES = [
  ...PROJECTS.map((p) => ({ name: p.name, href: p.live || p.repo, skills: [...p.stack, ...p.skills] })),
  ...OTHER_REPOS,
];

const TECH = [
  {
    label: "Frontend",
    items: [
      ["React", "react"],
      ["Next.js", "nextjs"],
      ["JavaScript", "javascript"],
      ["TypeScript", "typescript"],
      ["HTML5", "html5"],
      ["CSS3", "css3"],
      ["Jetpack Compose", "jetpackcompose"],
    ],
  },
  {
    label: "Backend",
    items: [
      ["Spring Boot", "spring"],
      ["Spring Security", "spring"],
      ["FastAPI", "fastapi"],
      ["Flask", "flask"],
      ["Node.js", "nodejs"],
      ["ImageMagick", null],
    ],
  },
  {
    label: "Data",
    items: [
      ["PostgreSQL", "postgresql"],
      ["Redis", "redis"],
      ["MySQL", "mysql"],
      ["SQLite", "sqlite"],
      ["SQL", null],
    ],
  },
  {
    label: "Languages",
    items: [
      ["Java", "java"],
      ["Kotlin", "kotlin"],
      ["Python", "python"],
      ["C++", "cplusplus"],
      ["Rust", "rust"],
      ["C#", "csharp"],
      ["Bash", "bash"],
    ],
  },
  {
    label: "Testing",
    items: [
      ["JUnit", "junit"],
      ["Mockito", null],
      ["Vitest", "vitest"],
      ["React Testing Library", null],
      ["ESLint", "eslint"],
      ["Postman", "postman"],
    ],
  },
  {
    label: "DevOps & Cloud",
    items: [
      ["Docker", "docker"],
      ["Kubernetes", "kubernetes"],
      ["nginx", "nginx"],
      ["GitHub Actions", "githubactions"],
      ["Linux", "linux"],
      ["Oracle Cloud", "oracle"],
      ["Git", "git"],
      ["GitHub", "github"],
    ],
  },
  {
    label: "AI & Automation",
    items: [
      ["Claude Code", "/icons/claude.svg"],
      ["nexTix", "/icons/nextix.svg"],
    ],
    // how a change to this site actually ships, start to finish
    flow: ["Issue", "nexTix branch", "Lint + build", "I review", "Merge", "Auto deploy"],
  },
];


// eslint-disable-next-line react/only-export-components
export { AI_USAGE, DEVICON, GITHUB, EXPERIENCE, PROJECTS, SKILL_SOURCES, TECH, prefersReducedMotion, rich };
