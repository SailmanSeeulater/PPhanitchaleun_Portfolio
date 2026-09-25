import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import mordiShot from "./assets/screenshots/mordi-full.webp";
import lonelyChessShot from "./assets/screenshots/lonely-chess-full.webp";
import pdfyierShot from "./assets/screenshots/pdfyier-full.webp";
import profilePhoto from "./assets/profile.webp";
import WebAudioAnalyser from "web-audio-analyser";
import { TRACKS } from "./tracks";
import { LAYOUTS, LAYOUT_CSS } from "./layouts";

/* =========================================================================
   Perfect Phanitchaleun: personal portfolio.
   Single-file React app with injected CSS. Respects prefers-reduced-motion.
   ========================================================================= */

const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.17.0/icons";
const GITHUB = "https://github.com/SailmanSeeulater";

const rich = (text) =>
  text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <mark key={i} className="hl">{part}</mark> : part));

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const PROJECTS = [
  {
    name: "Mordi",
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
    name: "pdfyier",
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
];

const OTHER_REPOS = [
  { name: "SHMA", href: `${GITHUB}/Gibbi-Backend`, skills: ["Kotlin", "Spring Boot", "Spring Security", "PostgreSQL", "SQL", "Docker", "Git", "GitHub"] },
  { name: "Odins Kin", href: `${GITHUB}/odins_kin`, skills: ["Python", "Flask", "SQLite", "SQL", "HTML5", "Git", "GitHub"] },
  { name: "Fight Up The Hill", href: `${GITHUB}/CS-210-Final-Project`, skills: ["C++", "Git", "GitHub"] },
];

const SKILL_SOURCES = [
  ...PROJECTS.map((p) => ({ name: p.name, href: p.live, skills: [...p.stack, ...p.skills] })),
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
];

/* ---- Visibility hooks ---- */
function useInView(options = { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        obs.unobserve(entry.target);
      }
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

function useOnScreen(ref, threshold) {
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return onScreen;
}

/* ---- Hero name typed on arrival ---- */
const FIRST_NAME = "Perfect";
const LAST_NAME = "Phanitchaleun";
const FULL_NAME = `${FIRST_NAME} ${LAST_NAME}`;
const NAME_LETTERS = FIRST_NAME.length + LAST_NAME.length;

function TypedName() {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? NAME_LETTERS : 0));
  const done = count >= NAME_LETTERS;

  useEffect(() => {
    if (done) return;
    const delay = count === 0 ? 450 : count === FIRST_NAME.length ? 260 : 55 + Math.random() * 45;
    const t = setTimeout(() => setCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [count, done]);

  const renderWord = (word, offset) =>
    [...word].map((ch, i) => {
      const index = offset + i;
      return (
        <Fragment key={index}>
          {index === 0 && count === 0 && <span className="typed__caret" />}
          <span className={index < count ? "typed__ch is-on" : "typed__ch"} style={{ "--i": index }}>{ch}</span>
          {index === count - 1 && <span className="typed__caret" />}
        </Fragment>
      );
    });

  return (
    <h1 id="hero-name" className={`hero__name ${done ? "is-typed" : ""}`} aria-label={FULL_NAME}>
      <span aria-hidden="true">
        <span className="typed__word">{renderWord(FIRST_NAME, 0)}</span>{" "}
        <span className="typed__word">{renderWord(LAST_NAME, FIRST_NAME.length)}</span>
      </span>
    </h1>
  );
}

/* ---- Tech chip: icon + name, opens the which-projects bubble ---- */
function TechBadge({ name, slug, delay, active, onSelect }) {
  const [failed, setFailed] = useState(!slug);
  return (
    <button
      type="button"
      className="chip"
      style={{ transitionDelay: `${delay}ms` }}
      aria-haspopup="dialog"
      aria-expanded={active}
      onClick={(e) => onSelect(name, e.currentTarget)}
    >
      <span className="chip__icon" aria-hidden="true">
        {failed ? (
          <span className="chip__fallback">{name.charAt(0)}</span>
        ) : (
          <img
            src={`${DEVICON}/${slug}/${slug}-original.svg`}
            alt=""
            width="16"
            height="16"
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
      </span>
      <span className="chip__name">{name}</span>
    </button>
  );
}

/* ---- Browser-window preview: pans on hover, or hand-scrolls when the visitor asks ---- */
function ScrollPreview({ project }) {
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const onScreen = useOnScreen(frameRef, 0.6);
  const [pan, setPan] = useState(0);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) return;
    const measure = () => setPan(Math.max(0, Math.round(frame.scrollHeight - frame.clientHeight)));
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    img.addEventListener("load", measure);
    if (img.complete) measure();
    return () => {
      ro.disconnect();
      img.removeEventListener("load", measure);
    };
  }, []);

  const duration = Math.min(Math.max(pan / 150, 4), 16);
  const canPan = pan > 24;

  const toggleManual = () => {
    setManual((m) => {
      if (m && frameRef.current) frameRef.current.scrollTop = 0;
      return !m;
    });
  };

  return (
    <div className="project__demo">
      <div className="window">
        <div className="window__bar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <div className="window__url">{project.demo.domain}</div>
          {canPan && (
            <button
              type="button"
              className="window__mode"
              aria-pressed={manual}
              onClick={toggleManual}
              title={manual ? "Back to automatic preview" : "Scroll this preview yourself"}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="8" y="3" width="8" height="18" rx="4" />
                <path d="M12 7v3" />
              </svg>
              {manual ? "Scrolling" : "Scroll it"}
            </button>
          )}
        </div>
        <a
          className="window__view"
          href={project.live}
          target="_blank"
          rel="noreferrer"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div
            ref={frameRef}
            className={`window__body${canPan ? " can-pan" : ""}${manual ? " is-manual" : ""}${onScreen ? " is-onscreen" : ""}`}
            style={{ "--pan": `${pan}px`, "--pan-duration": `${duration}s` }}
          >
            <img
              ref={imgRef}
              className="window__screenshot"
              src={project.demo.image}
              alt=""
              width="1000"
              height={project.demo.height}
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>
      </div>
    </div>
  );
}

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
    <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---- A single project row ---- */
function ProjectRow({ project, index }) {
  const [ref, inView] = useInView();
  return (
    <article ref={ref} className={`project ${inView ? "is-visible" : ""}`} aria-labelledby={`proj-${index}`}>
      <div className="project__text">
        <h3 id={`proj-${index}`} className="project__name">
          {project.name}
        </h3>
        <p className="project__summary">{project.summary}</p>
        {project.credit && <p className="project__credit">{project.credit}</p>}
        <ul className="bullets project__bullets">
          {project.bullets.map((b, i) => (
            <li key={i}>{rich(b)}</li>
          ))}
        </ul>

        <ul className="project__stack" aria-label={`${project.name} tech stack`}>
          {project.stack.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <div className="project__links">
          <a className="project__link" href={project.live} target="_blank" rel="noreferrer">
            Visit {project.demo.domain}
            <ArrowIcon />
          </a>
          <a className="project__link project__link--quiet" href={project.repo} target="_blank" rel="noreferrer">
            Source on GitHub
            <ArrowIcon />
          </a>
        </div>
      </div>

      <ScrollPreview project={project} />
    </article>
  );
}

/* ---- Social icons ---- */
const Icons = {
  github: (
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.48v-1.7c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.48A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  ),
  linkedin: (
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  ),
  globe: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8ZM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96ZM4.26 14a7.96 7.96 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26Zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A8.03 8.03 0 0 1 5.07 16Zm2.95-8H5.07a8.03 8.03 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.02 8ZM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82A14.4 14.4 0 0 1 12 19.96ZM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4Zm.27 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56ZM16.36 14a16.5 16.5 0 0 0 0-4h3.38a7.96 7.96 0 0 1 0 4h-3.38Z" />
  ),
  soundcloud: (
    <path d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z" />
  ),
};

function SocialButton({ kind, href, label }) {
  return (
    <a className="social" href={href} target="_blank" rel="noreferrer" aria-label={label}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        {Icons[kind]}
      </svg>
    </a>
  );
}

/* ---- Small bubble listing the projects that use a clicked skill ---- */
function SkillBubble({ skill, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!skill) return;
    panelRef.current?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === "Escape") onClose(true);
    };
    const onOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest(".chip")) {
        onClose(false);
      }
    };
    const onResize = () => onClose(false);

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
      window.removeEventListener("resize", onResize);
    };
  }, [skill, onClose]);

  if (!skill) return null;

  const matches = SKILL_SOURCES.filter((p) => p.skills.includes(skill.name));

  return (
    <div
      ref={panelRef}
      className={`skill-bubble${skill.below ? " is-below" : ""}`}
      role="dialog"
      aria-label={`Projects using ${skill.name}`}
      tabIndex={-1}
      style={{ left: skill.x, top: skill.y }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget) && e.relatedTarget && !e.relatedTarget.closest(".chip")) {
          onClose(false);
        }
      }}
    >
      <span className="skill-bubble__title">{skill.name}</span>
      {matches.length > 0 ? (
        <ul className="skill-bubble__list">
          {matches.map((p) => (
            <li key={p.name}>
              <a href={p.href} target="_blank" rel="noreferrer">
                {p.name}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="skill-bubble__empty">Not in a public repo yet.</p>
      )}
    </div>
  );
}

const THEMES = [
  { id: "maroon", name: "Maroon & Cream", swatch: ["#f3e6d5", "#800020"] },
  { id: "ocean", name: "Blue & Yellow", swatch: ["#fdf1b8", "#1d4ed8"] },
  { id: "forest", name: "Green & White", swatch: ["#ffffff", "#1b7a43"] },
  { id: "midnight", name: "Black & Lime", swatch: ["#0f0f0f", "#c6f432"] },
  { id: "bubblegum", name: "Pink & Black", swatch: ["#ffd6e8", "#141414"] },
  { id: "lavender", name: "Lavender & Violet", swatch: ["#ece6ff", "#5b2bd1"] },
  { id: "harbor", name: "Navy & Orange", swatch: ["#0d1b2a", "#ff8a3d"] },
  { id: "mint", name: "Mint & Chocolate", swatch: ["#d9f2e4", "#5a3825"] },
  { id: "tangerine", name: "Tangerine & Cream", swatch: ["#fff1e0", "#c2410c"] },
  { id: "coral", name: "Coral & Teal", swatch: ["#ffe1d6", "#0d6b64"] },
  { id: "synthwave", name: "Purple & Hot Pink", swatch: ["#1a0b2e", "#ff4fd8"] },
  { id: "sky", name: "Sky & Navy", swatch: ["#dff1ff", "#0369a1"] },
  { id: "espresso", name: "Espresso & Latte", swatch: ["#2b1d16", "#e8b98a"] },
  { id: "matcha", name: "Matcha & Oat", swatch: ["#eef0dc", "#4d6b1f"] },
  { id: "grape", name: "Grape & Mint", swatch: ["#2a1245", "#7af0c2"] },
  { id: "inferno", name: "Red & Black", swatch: ["#111111", "#ff3b3b"] },
  { id: "gameboy", name: "Game Boy", swatch: ["#c4cfa1", "#2f4d09"] },
  { id: "barbie", name: "Barbie Pink", swatch: ["#ffe3f1", "#b80f6b"] },
  { id: "terminal", name: "Terminal Green", swatch: ["#050805", "#39ff6a"] },
  { id: "slate", name: "Ice & Slate", swatch: ["#eef2f6", "#334155"] },
  { id: "mustard", name: "Charcoal & Mustard", swatch: ["#1f2124", "#f2c230"] },
];

// Your GoatCounter site code, e.g. "perfect" for https://perfect.goatcounter.com
const GOATCOUNTER_CODE = "latesailor";

function useAnalytics() {
  useEffect(() => {
    if (!GOATCOUNTER_CODE || document.querySelector("script[data-goatcounter]")) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    document.body.appendChild(s);
  }, []);
}

function VisitorCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!GOATCOUNTER_CODE) return;
    const ctrl = new AbortController();
    fetch(`https://${GOATCOUNTER_CODE}.goatcounter.com/counter/TOTAL.json`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setCount(Number(String(d.count).replace(/\D/g, ""))))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  if (!count) return null;
  return (
    <span className="footer__visits">
      <span className="footer__pulse" aria-hidden="true" />
      {count.toLocaleString("en-US")} {count === 1 ? "visitor" : "visitors"} so far
    </span>
  );
}

const SC_PROFILE = "https://soundcloud.com/latersellyoulater";

let audioGraph = null;

function connectAnalyser(audio) {
  if (audioGraph) return audioGraph;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    const ctx = new Ctx();
    const analyser = WebAudioAnalyser(audio, ctx, { audible: false });
    analyser.analyser.fftSize = 512;
    analyser.analyser.smoothingTimeConstant = 0.72;
    const gain = ctx.createGain();
    analyser.output.connect(gain);
    gain.connect(ctx.destination);
    audioGraph = { ctx, analyser, gain };
  } catch {
    audioGraph = null;
  }
  return audioGraph;
}

const bandLevel = (bins, from, to) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += bins[i];
  return sum / ((to - from) * 255);
};

function SoundDock() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [live, setLive] = useState(false);
  const [volume, setVolume] = useState(() => {
    try {
      const v = Number(localStorage.getItem("volume"));
      return localStorage.getItem("volume") !== null && v >= 0 && v <= 100 ? v : 70;
    } catch {
      return 70;
    }
  });
  const lastVolumeRef = useRef(volume || 70);
  const audioRef = useRef(null);
  const tabRef = useRef(null);
  const panelRef = useRef(null);
  const eqRef = useRef(null);
  const track = TRACKS[index];

  useEffect(() => {
    const audio = audioRef.current;
    if (audioGraph) {
      audioGraph.gain.gain.value = volume / 100;
      audio.volume = 1;
    } else {
      audio.volume = volume / 100;
    }
    try {
      localStorage.setItem("volume", String(volume));
    } catch {
      /* storage unavailable */
    }
  }, [volume, live]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        tabRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!live || prefersReducedMotion()) return;
    const fx = document.documentElement;
    const eq = eqRef.current;
    const level = { beat: 0, b1: 0, b2: 0, b3: 0 };
    const avg = { bass: 0, b1: 0, b2: 0, b3: 0 };
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    let raf;

    const tick = () => {
      const bins = audioGraph.analyser.frequencies();
      const raw = { bass: bandLevel(bins, 1, 4), b1: bandLevel(bins, 1, 5), b2: bandLevel(bins, 5, 32), b3: bandLevel(bins, 32, 100) };
      // compare against a running average so kicks spike even in bass-heavy mixes
      for (const k in avg) avg[k] += (raw[k] - avg[k]) * 0.05;
      const target = playing
        ? {
            beat: clamp((raw.bass - avg.bass) * 10 + raw.bass * 0.12, 0, 1),
            b1: clamp(0.4 + (raw.b1 - avg.b1) * 10, 0.08, 1),
            b2: clamp(0.4 + (raw.b2 - avg.b2) * 13, 0.08, 1),
            b3: clamp(0.35 + (raw.b3 - avg.b3) * 16, 0.08, 1),
          }
        : { beat: 0, b1: 0, b2: 0, b3: 0 };
      let active = playing;
      for (const k in level) {
        level[k] += (target[k] - level[k]) * (target[k] > level[k] ? 0.55 : 0.16);
        if (level[k] > 0.004) active = true;
      }
      fx?.style.setProperty("--beat", level.beat.toFixed(3));
      eq?.style.setProperty("--b1", level.b1.toFixed(3));
      eq?.style.setProperty("--b2", level.b2.toFixed(3));
      eq?.style.setProperty("--b3", level.b3.toFixed(3));
      if (active) raf = requestAnimationFrame(tick);
      else fx?.style.setProperty("--beat", "0");
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, playing]);

  const play = (i = index) => {
    const audio = audioRef.current;
    const graph = connectAnalyser(audio);
    if (graph && !live) setLive(true);
    graph?.ctx.resume();
    if (i !== index) {
      setIndex(i);
      setProgress(0);
      audio.src = TRACKS[i].src;
    } else if (!audio.getAttribute("src")) {
      audio.src = TRACKS[i].src;
    }
    setFailed(false);
    audio.play().catch(() => {});
  };

  const toggle = () => {
    if (playing) audioRef.current.pause();
    else play();
  };

  const skip = (step) => {
    const audio = audioRef.current;
    if (step < 0 && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    play((index + step + TRACKS.length) % TRACKS.length);
  };

  const seek = (e) => {
    const audio = audioRef.current;
    const ratio = Number(e.target.value) / 1000;
    setProgress(ratio);
    const duration = audio.duration || track.duration;
    if (!audio.getAttribute("src")) audio.src = track.src;
    audio.currentTime = ratio * duration;
  };

  const toggleMute = () => {
    if (volume > 0) {
      lastVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(lastVolumeRef.current || 70);
    }
  };

  return (
    <div className={`dock ${open ? "is-open" : ""}`}>
      <div ref={panelRef} className="dock__panel" id="dock-panel" role="region" aria-label="Music player" tabIndex={-1} inert={!open}>
        <div className="dock__now">
          <img className="dock__art" src={track.art} alt="" width="56" height="56" />
          <div className="dock__meta">
            <a className="dock__title" href={track.soundcloud} target="_blank" rel="noreferrer">
              {track.title}
            </a>
            <a className="dock__artist" href={SC_PROFILE} target="_blank" rel="noreferrer">
              Later
            </a>
          </div>
        </div>

        {failed && (
          <p className="dock__status" role="status">
            This track didn't load. <a href={track.soundcloud} target="_blank" rel="noreferrer">Play it on SoundCloud</a>.
          </p>
        )}

        <input
          className="dock__range dock__seek"
          type="range"
          min="0"
          max="1000"
          value={Math.round(progress * 1000)}
          onChange={seek}
          aria-label="Seek"
          style={{ "--p": `${progress * 100}%` }}
        />

        <div className="dock__controls">
          <button type="button" onClick={() => skip(-1)} aria-label="Previous track">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
          </button>
          <button type="button" className="dock__play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button type="button" onClick={() => skip(1)} aria-label="Next track">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
          </button>
        </div>

        <div className="dock__volume">
          <button type="button" onClick={toggleMute} aria-label={volume > 0 ? "Mute" : "Unmute"}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
              {volume === 0 ? (
                <path d="m16 9.5 5 5m0-5-5 5" />
              ) : (
                <>
                  <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
                  {volume > 50 && <path d="M18.3 6.5a8 8 0 0 1 0 11" />}
                </>
              )}
            </svg>
          </button>
          <input
            className="dock__range"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            style={{ "--p": `${volume}%` }}
          />
        </div>

        <ol className="dock__list" aria-label="Tracks">
          {TRACKS.map((t, i) => (
            <li key={t.src}>
              <button
                type="button"
                className={i === index ? "is-current" : ""}
                aria-current={i === index ? "true" : undefined}
                onClick={() => play(i)}
              >
                {t.title}
              </button>
            </li>
          ))}
        </ol>

        <a className="dock__credit" href={SC_PROFILE} target="_blank" rel="noreferrer">
          Also on SoundCloud
        </a>
      </div>

      <button
        ref={tabRef}
        type="button"
        className="dock__tab"
        aria-expanded={open}
        aria-controls="dock-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span ref={eqRef} className={`dock__eq${playing ? " is-playing" : ""}${live ? " is-live" : ""}`} aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="dock__tab-label">{playing ? track.title : "My music"}</span>
      </button>

      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => play((index + 1) % TRACKS.length)}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration) setProgress(a.currentTime / a.duration);
        }}
        onError={() => {
          setPlaying(false);
          setFailed(true);
        }}
      />
    </div>
  );
}

function useTheme() {
  const [index, setIndex] = useState(() => {
    try {
      const i = THEMES.findIndex((t) => t.id === localStorage.getItem("theme"));
      return i === -1 ? 0 : i;
    } catch {
      return 0;
    }
  });

  useLayoutEffect(() => {
    const id = THEMES[index].id;
    document.documentElement.dataset.theme = id;
    try {
      localStorage.setItem("theme", id);
    } catch {
      /* storage unavailable */
    }
  }, [index]);

  const select = (i) => {
    if (i === index) return;
    const apply = () => flushSync(() => setIndex(i));
    if (!document.startViewTransition || prefersReducedMotion()) apply();
    else document.startViewTransition(apply).ready.catch(() => {});
  };

  return [index, select];
}

function ThemePicker() {
  const [current, select] = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onOutside = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [open]);

  return (
    <div className="theme-picker" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="theme-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="theme-menu"
        aria-label={`Color scheme: ${THEMES[current].name}`}
        title="Change color scheme"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.2-9-7.2Z" />
          <circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="10" cy="7" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="7" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="17" cy="11" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <ul className="theme-menu" id="theme-menu" aria-label="Color schemes">
          {THEMES.map((t, i) => (
            <li key={t.id}>
              <button type="button" aria-pressed={i === current} onClick={() => select(i)}>
                <span className="theme-menu__swatch" style={{ "--a": t.swatch[0], "--b": t.swatch[1] }} aria-hidden="true" />
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function useLayout() {
  const [id, setId] = useState(() => {
    const valid = (v) => (LAYOUTS.some((l) => l.id === v) ? v : null);
    try {
      return valid(new URLSearchParams(window.location.search).get("layout")) || valid(localStorage.getItem("layout")) || "original";
    } catch {
      return "original";
    }
  });

  useLayoutEffect(() => {
    document.documentElement.dataset.layout = id;
    try {
      localStorage.setItem("layout", id);
    } catch {
      /* storage unavailable */
    }
  }, [id]);

  const select = (next) => {
    if (next === id) return;
    const apply = () => flushSync(() => setId(next));
    if (!document.startViewTransition || prefersReducedMotion()) apply();
    else document.startViewTransition(apply).ready.catch(() => {});
  };

  return [id, select];
}

/* ---- Chaos layout: every section re-rolls its fonts on its own 7 to 20 second timer ---- */
// [family, fallback, width scale for huge headings, readable enough for body text]
const CHAOS_FONTS = [
  ["Bangers", "Impact, sans-serif", 1.08, false],
  ["Bungee", "Impact, sans-serif", 0.82, false],
  ["Creepster", "fantasy", 1.02, false],
  ["Fredoka", "system-ui, sans-serif", 0.98, true],
  ["Monoton", "fantasy", 0.86, false],
  ["Pacifico", "cursive", 0.92, false],
  ["Patrick Hand", "cursive", 1.04, true],
  ["Permanent Marker", "cursive", 0.94, false],
  ["Press Start 2P", "monospace", 0.6, false],
  ["Rubik Mono One", "monospace", 0.74, false],
];
const CHAOS_BODY_FONTS = CHAOS_FONTS.filter((f) => f[3]).concat([["RX100", "monospace", 1, true], ["Inter", "sans-serif", 1, true]]);
const CHAOS_SECTIONS = [".nav", ".hero", "#projects", "#tech", "#contact", ".footer"];

function useFontRoulette(active) {
  useEffect(() => {
    if (!active || prefersReducedMotion()) return;
    const pick = (pool, current) => {
      let f;
      do f = pool[Math.floor(Math.random() * pool.length)]; while (pool.length > 1 && f[0] === current);
      return f;
    };
    const timers = [];
    const els = CHAOS_SECTIONS.map((sel) => document.querySelector(sel)).filter(Boolean);
    const roll = (el, state, first) => {
      const display = pick(CHAOS_FONTS, state.display);
      const body = pick(CHAOS_BODY_FONTS, state.body);
      state.display = display[0]; state.body = body[0];
      el.style.setProperty("--font-display", `'${display[0]}', ${display[1]}`);
      el.style.setProperty("--font-body", `'${body[0]}', ${body[1]}`);
      el.style.setProperty("--font-scale", String(display[2]));
      if (!first) {
        el.classList.remove("font-swap");
        void el.offsetWidth;
        el.classList.add("font-swap");
      }
      timers.push(setTimeout(() => roll(el, state, false), 7000 + Math.random() * 13000));
    };
    for (const el of els) roll(el, {}, true);
    return () => {
      timers.forEach(clearTimeout);
      for (const el of els) {
        el.style.removeProperty("--font-display");
        el.style.removeProperty("--font-body");
        el.style.removeProperty("--font-scale");
        el.classList.remove("font-swap");
      }
    };
  }, [active]);
}

/* ---- Chaos layout: the tech chips fall out of the page, pile up, and jump on the beat ---- */
function useFlyingChips(active) {
  useEffect(() => {
    if (!active || prefersReducedMotion() || window.matchMedia("(max-width: 760px)").matches) return;
    const chips = [...document.querySelectorAll(".tech .chip")];
    if (!chips.length) return;
    const rand = (a, b) => a + Math.random() * (b - a);
    const GRAVITY = 1500, FLOOR_BOUNCE = 0.42, WALL_BOUNCE = 0.55;
    for (const el of chips) el.classList.add("is-flying");
    const bodies = chips.map((el) => ({
      el, w: el.offsetWidth || 90, h: el.offsetHeight || 40,
      x: null, y: null, vx: 0, vy: 0, r: rand(-12, 12), vr: rand(-40, 40),
      hold: false, paused: false, moved: 0, px: 0, py: 0, pt: 0, tvx: 0, tvy: 0,
    }));
    const byEl = new Map(bodies.map((b) => [b.el, b]));
    const bodyOf = (e) => byEl.get(e.currentTarget);

    const onEnter = (e) => { bodyOf(e).paused = true; };
    const onLeave = (e) => { const b = bodyOf(e); if (!b.hold) b.paused = false; };
    const onFocus = (e) => { bodyOf(e).paused = true; };
    const onBlur = (e) => { const b = bodyOf(e); if (!b.el.matches(":hover")) b.paused = false; };
    const onDown = (e) => {
      const b = bodyOf(e);
      b.hold = true; b.moved = 0; b.px = e.clientX; b.py = e.clientY; b.pt = e.timeStamp; b.tvx = 0; b.tvy = 0;
      try { b.el.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    };
    const onMove = (e) => {
      const b = bodyOf(e);
      if (!b.hold) return;
      const dx = e.clientX - b.px, dy = e.clientY - b.py, dt = Math.max(1, e.timeStamp - b.pt) / 1000;
      b.x += dx; b.y += dy; b.moved += Math.hypot(dx, dy);
      b.tvx = dx / dt; b.tvy = dy / dt;
      b.px = e.clientX; b.py = e.clientY; b.pt = e.timeStamp;
    };
    const onUp = (e) => {
      const b = bodyOf(e);
      if (!b.hold) return;
      b.hold = false;
      const cap = 1100;
      b.vx = Math.max(-cap, Math.min(cap, b.tvx));
      b.vy = Math.max(-cap, Math.min(cap, b.tvy));
      b.vr = Math.max(-160, Math.min(160, b.vx * 0.12));
      b.paused = b.el.matches(":hover");
    };
    const onClickCapture = (e) => {
      // a throw ends with a click; swallow it so the bubble stays closed
      if (bodyOf(e).moved > 6) { e.stopPropagation(); e.preventDefault(); }
    };

    for (const b of bodies) {
      b.el.addEventListener("pointerenter", onEnter);
      b.el.addEventListener("pointerleave", onLeave);
      b.el.addEventListener("focus", onFocus);
      b.el.addEventListener("blur", onBlur);
      b.el.addEventListener("pointerdown", onDown);
      b.el.addEventListener("pointermove", onMove);
      b.el.addEventListener("pointerup", onUp);
      b.el.addEventListener("pointercancel", onUp);
      b.el.addEventListener("click", onClickCapture, true);
    }

    let last = performance.now(), raf, lastW = window.innerWidth, lastH = window.innerHeight, lastBeat = 0;
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const W = window.innerWidth, H = window.innerHeight;
      if (W !== lastW || H !== lastH) {
        for (const b of bodies) if (b.x !== null) { b.x *= W / lastW; b.y *= H / lastH; }
        lastW = W; lastH = H;
      }
      const beat = parseFloat(document.documentElement.style.getPropertyValue("--beat")) || 0;
      const kick = beat > 0.35 && lastBeat <= 0.35;
      lastBeat = beat;

      for (const b of bodies) {
        if (b.x === null) {
          // rain in from above on the first frame
          b.x = rand(0, Math.max(1, W - b.w)); b.y = rand(-H * 0.7, H * 0.25); b.vx = rand(-70, 70);
        }
        if (b.hold || b.paused) continue;
        const floor = H - b.h;
        if (kick) {
          const resting = b.y >= floor - 2;
          b.vy -= (resting ? 1 : 0.45) * (420 + beat * 640) * rand(0.6, 1.25);
          b.vx += rand(-170, 170) * beat;
          b.vr += rand(-140, 140) * beat;
        }
        b.vy += GRAVITY * dt;
        b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt;
        if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * WALL_BOUNCE; }
        if (b.x > W - b.w) { b.x = W - b.w; b.vx = -Math.abs(b.vx) * WALL_BOUNCE; }
        if (b.y > floor) {
          b.y = floor;
          b.vy = b.vy > 60 ? -b.vy * FLOOR_BOUNCE : 0;
          b.vx *= Math.pow(0.12, dt);
          b.vr *= Math.pow(0.08, dt);
          b.r += -b.r * Math.min(1, 5 * dt);
        }
        if (b.y < -H) { b.y = -H; b.vy = 0; }
      }

      // let chips pile instead of sharing a pixel: push overlapping boxes apart
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i];
          if (a.hold || a.paused) continue;
          for (let j = i + 1; j < bodies.length; j++) {
            const c = bodies[j];
            if (c.hold || c.paused) continue;
            const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
            const oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
            if (ox <= 0 || oy <= 0) continue;
            if (ox < oy) {
              const dir = a.x < c.x ? -1 : 1;
              a.x += dir * ox / 2; c.x -= dir * ox / 2;
              const t = a.vx; a.vx = c.vx * 0.5; c.vx = t * 0.5;
            } else {
              const upper = a.y < c.y ? a : c, lower = upper === a ? c : a;
              upper.y -= oy / 2; lower.y += oy / 2;
              if (upper.vy > 0) upper.vy = -upper.vy * 0.25;
              if (lower.vy < 0) lower.vy = 0;
            }
          }
        }
      }
      for (const b of bodies) {
        b.x = Math.max(0, Math.min(W - b.w, b.x));
        b.y = Math.min(H - b.h, b.y);
        b.el.style.transform = `translate(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px) rotate(${b.r.toFixed(1)}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      for (const b of bodies) {
        b.el.classList.remove("is-flying");
        b.el.style.transform = "";
        b.el.removeEventListener("pointerenter", onEnter);
        b.el.removeEventListener("pointerleave", onLeave);
        b.el.removeEventListener("focus", onFocus);
        b.el.removeEventListener("blur", onBlur);
        b.el.removeEventListener("pointerdown", onDown);
        b.el.removeEventListener("pointermove", onMove);
        b.el.removeEventListener("pointerup", onUp);
        b.el.removeEventListener("pointercancel", onUp);
        b.el.removeEventListener("click", onClickCapture, true);
      }
    };
  }, [active]);
}

function LayoutThumb({ id }) {
  const common = { width: 44, height: 30, viewBox: "0 0 44 30", "aria-hidden": true };
  if (id === "chaos")
    return (
      <svg {...common} fill="currentColor">
        <rect x="4" y="5" width="16" height="7" rx="3.5" transform="rotate(-14 12 8.5)" />
        <rect x="24" y="3" width="14" height="7" rx="3.5" transform="rotate(11 31 6.5)" opacity=".7" />
        <rect x="3" y="18" width="12" height="7" rx="3.5" transform="rotate(19 9 21.5)" opacity=".55" />
        <rect x="19" y="15" width="20" height="7" rx="3.5" transform="rotate(-7 29 18.5)" />
        <rect x="27" y="23" width="12" height="6" rx="3" transform="rotate(16 33 26)" opacity=".4" />
      </svg>
    );
  if (id === "brutalist")
    return (
      <svg {...common} fill="currentColor">
        <rect x="2" y="2" width="40" height="7" />
        <rect x="2" y="12" width="16" height="16" opacity=".85" />
        <rect x="21" y="12" width="21" height="3" />
        <rect x="21" y="18" width="21" height="3" opacity=".6" />
        <rect x="21" y="24" width="13" height="4" opacity=".35" />
      </svg>
    );
  if (id === "terminal")
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l5 4-5 4" />
        <path d="M14 18h8" />
        <path d="M6 24h24" opacity=".35" />
      </svg>
    );
  return (
    <svg {...common} fill="currentColor">
      <circle cx="10" cy="12" r="6" opacity=".55" />
      <rect x="20" y="6" width="20" height="5" rx="2" />
      <rect x="20" y="14" width="15" height="2" rx="1" opacity=".5" />
      <rect x="20" y="19" width="10" height="4" rx="2" opacity=".8" />
      <rect x="2" y="26" width="40" height="2" rx="1" opacity=".25" />
    </svg>
  );
}

function LayoutDock({ current, select }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const tabRef = useRef(null);
  const menuRef = useRef(null);
  const layout = LAYOUTS.find((l) => l.id === current);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        tabRef.current?.focus();
      }
    };
    const onOutside = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [open]);

  return (
    <div className="ldock" ref={rootRef}>
      {open && (
        <div className="ldock__menu" id="layout-menu" ref={menuRef} role="group" aria-label="Page layouts">
          <p className="ldock__hint">Same content, five ways to read it.</p>
          {LAYOUTS.map((l) => (
            <button key={l.id} type="button" className="ldock__opt" aria-pressed={l.id === current} onClick={() => select(l.id)}>
              <span className="ldock__thumb">
                <LayoutThumb id={l.id} />
              </span>
              <span>
                <span className="ldock__name">{l.name}</span>
                <span className="ldock__blurb">{l.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        ref={tabRef}
        type="button"
        className="ldock__tab"
        aria-expanded={open}
        aria-controls="layout-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="3.5" width="7" height="17" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
        <span className="ldock__label">
          Layout <span className="ldock__current">· {layout.name}</span>
        </span>
      </button>
    </div>
  );
}

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function App() {
  const [techRef, techInView] = useInView({ threshold: 0.1 });
  const [activeSkill, setActiveSkill] = useState(null);
  const skillTriggerRef = useRef(null);
  const [layoutId, selectLayout] = useLayout();
  useAnalytics();
  useFlyingChips(layoutId === "chaos");
  useFontRoulette(layoutId === "chaos");

  const handleSelectSkill = (name, trigger) => {
    skillTriggerRef.current = trigger;
    setActiveSkill((prev) => {
      if (prev?.name === name) return null;
      const rect = trigger.getBoundingClientRect();
      const below = rect.top < 240;
      const x = Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120) + window.scrollX;
      const y = (below ? rect.bottom : rect.top) + window.scrollY;
      return { name, x, y, below };
    });
  };

  const closeSkill = (restoreFocus) => {
    setActiveSkill(null);
    if (restoreFocus) skillTriggerRef.current?.focus();
  };

  return (
    <div className="site">
      <style>{CSS + LAYOUT_CSS}</style>
      <div className="bg-fx" aria-hidden="true">
        <div className="bg-dots" />
      </div>
      <div className="bg-grain" aria-hidden="true" />

      <a className="skip-link" href="#projects">Skip to projects</a>

      {/* ---------- NAV ---------- */}
      <header className="nav">
        <a className="nav__brand" href="#top" aria-label="Back to top">PP</a>
        <div className="nav__right">
          <nav className="nav__links" aria-label="Primary">
            <a href="#projects">Projects</a>
            <a href="#tech">Tech Stack</a>
            <a href="#contact">Contact</a>
          </nav>
          <ThemePicker />
        </div>
      </header>

      <main id="top">
        {/* ---------- HERO ---------- */}
        <section className="hero" aria-labelledby="hero-name">
          <div className="hero__photo">
            <img src={profilePhoto} alt="Perfect Phanitchaleun" width="560" height="560" fetchPriority="high" />
          </div>
          <div className="hero__intro">
            <TypedName />
            <p className="hero__role">Backend, DevOps &amp; full-stack engineer</p>
            <p className="hero__proof">
              I like to build websites and do pottery.
            </p>
            <p className="hero__status">Student, open to SWE internships and new grad roles</p>
            <div className="hero__actions">
              <a className="btn-primary" href="/resume.pdf" download="Perfect_Phanitchaleun_Resume.pdf">
                Download résumé
                <DownloadIcon />
              </a>
              <a className="hero__secondary" href="#projects">See the projects</a>
            </div>
            <p className="hero__resume-date">Résumé updated September 7, 2026</p>
          </div>
        </section>

        {/* ---------- PROJECTS ---------- */}
        <section id="projects" className="section section--projects" aria-labelledby="projects-title">
          <h2 id="projects-title" className="section__title">Projects</h2>
          <div className="projects">
            {PROJECTS.map((p, i) => (
              <ProjectRow key={p.name} project={p} index={i} />
            ))}
          </div>
        </section>

        {/* ---------- TECH STACK ---------- */}
        <section
          id="tech"
          ref={techRef}
          className={`section tech ${techInView ? "is-visible" : ""}`}
          aria-labelledby="tech-title"
        >
          <h2 id="tech-title" className="section__title section__title--tight">Tech Stack &amp; Skills</h2>
          <p className="tech__hint">Click a skill to see which projects use it.</p>
          <div className="tech__rows">
            {TECH.map((row) => {
              const id = `tech-${row.label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
              return (
                <div className="tech__row" key={row.label} role="group" aria-labelledby={id}>
                  <span className="tech__label" id={id}>{row.label}</span>
                  <div className="tech__badges">
                    {row.items.map(([name, slug], i) => (
                      <TechBadge key={name} name={name} slug={slug} delay={i * 40} active={activeSkill?.name === name} onSelect={handleSelectSkill} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- CONTACT ---------- */}
        <section id="contact" className="section" aria-labelledby="contact-title">
          <div className="contact">
            <h2 id="contact-title" className="contact__heading">Check out my Socials</h2>
            <a className="contact__email" href="mailto:perfectphanitchaleun@gmail.com">
              perfectphanitchaleun@gmail.com
            </a>

            <div className="contact__actions">
              <a className="btn-primary" href="/resume.pdf" download="Perfect_Phanitchaleun_Resume.pdf">
                Download résumé
                <DownloadIcon />
              </a>
              <div className="contact__socials">
                <SocialButton kind="github" href={GITHUB} label="GitHub" />
                <SocialButton kind="linkedin" href="https://www.linkedin.com/in/perfect-phanitchaleun" label="LinkedIn" />
                <SocialButton kind="globe" href="https://latesailor.dev" label="Personal website" />
                <SocialButton kind="soundcloud" href={SC_PROFILE} label="SoundCloud" />
              </div>
            </div>

            <p className="contact__tagline">Let's chat and grab some coffee</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Perfect Phanitchaleun</span>
        <VisitorCount />
        <span>San Diego based and originally from Laos</span>
      </footer>

      <SkillBubble skill={activeSkill} onClose={closeSkill} />
      <SoundDock />
      <LayoutDock current={layoutId} select={selectLayout} />
    </div>
  );
}

/* =========================================================================
   Styles (plain CSS, injected)
   ========================================================================= */
const CSS = `
:root{
  --bg:#f3e6d5;
  --surface:#fff9f2;
  --brand:#800020;
  --accent-fill:var(--brand);
  --text:#4a0014;
  --accent:#4a0014;
  --muted:color-mix(in srgb,var(--text) 78%,var(--bg));
  --dim:var(--muted);
  --font-display:'Comico','Comic Sans MS',cursive;
  --font-body:'RX100',ui-monospace,'SF Mono',Menlo,Consolas,monospace;
  --line:rgba(128,0,32,.18);
  --card:#fff9f2;
  --card-ink:#800020;
  --placeholder:#f3e6d5;
  --on-accent:#fff;
  --shadow:#800020;
  --tagline:#6e6e73;
  --ink-on-light:#800020;
  --grain-opacity:.16;
  --grain-blend:multiply;
  --ease:cubic-bezier(.16,1,.3,1);
  --nav-h:60px;
  --maxw:1160px;
  --gutter:clamp(20px,5vw,48px);
}
:root[data-theme="ocean"]{
  --bg:#fdf1b8;--surface:#fffbe3;--card:#fffbe3;--placeholder:#fdf1b8;
  --brand:#1d4ed8;--card-ink:#1d4ed8;--ink-on-light:#1d4ed8;--shadow:#1d4ed8;
  --text:#0a1f5c;--accent:#0a1f5c;
  --line:rgba(29,78,216,.2);--tagline:#5b6275;
}
:root[data-theme="forest"]{
  --bg:#ffffff;--surface:#eef6f0;--card:#eef6f0;--placeholder:#eef6f0;
  --brand:#1b7a43;--card-ink:#1b7a43;--ink-on-light:#1b7a43;--shadow:#1b7a43;
  --text:#0c3b22;--accent:#0c3b22;
  --line:rgba(27,122,67,.2);--tagline:#5f6b63;
}
:root[data-theme="midnight"]{
  color-scheme:dark;
  --bg:#0f0f0f;--surface:#1a1a1a;--card:#1a1a1a;--placeholder:#1a1a1a;
  --brand:#c6f432;--card-ink:#c6f432;--on-accent:#0f0f0f;--ink-on-light:#0f0f0f;--shadow:#000;
  --text:#f2f2ec;--accent:#c6f432;
  --line:rgba(198,244,50,.2);--tagline:#9a9a94;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="bubblegum"]{
  --bg:#ffd6e8;--surface:#ffe9f2;--card:#ffe9f2;--placeholder:#ffd6e8;
  --brand:#141414;--card-ink:#141414;--on-accent:#ffd6e8;--ink-on-light:#141414;--shadow:#d6336c;
  --text:#1a0a12;--accent:#1a0a12;
  --line:rgba(20,20,20,.16);--tagline:#6b4a58;
}
:root[data-theme="lavender"]{
  --bg:#ece6ff;--surface:#f7f4ff;--card:#f7f4ff;--placeholder:#ece6ff;
  --brand:#5b2bd1;--card-ink:#5b2bd1;--ink-on-light:#5b2bd1;--shadow:#5b2bd1;
  --text:#26104f;--accent:#26104f;
  --line:rgba(91,43,209,.2);--tagline:#6a6380;
}
:root[data-theme="harbor"]{
  color-scheme:dark;
  --bg:#0d1b2a;--surface:#15263a;--card:#15263a;--placeholder:#15263a;
  --brand:#ff8a3d;--card-ink:#ff8a3d;--on-accent:#0d1b2a;--ink-on-light:#0d1b2a;--shadow:#000;
  --text:#f3efe6;--accent:#ff8a3d;
  --line:rgba(255,138,61,.22);--tagline:#9aa6b4;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="mint"]{
  --bg:#d9f2e4;--surface:#eefaf3;--card:#eefaf3;--placeholder:#d9f2e4;
  --brand:#5a3825;--card-ink:#5a3825;--ink-on-light:#5a3825;--shadow:#5a3825;
  --text:#3b2416;--accent:#3b2416;
  --line:rgba(90,56,37,.18);--tagline:#6b6258;
}
:root[data-theme="tangerine"]{
  --bg:#fff1e0;--surface:#fff8ef;--card:#fff8ef;--placeholder:#fff1e0;
  --brand:#c2410c;--card-ink:#c2410c;--ink-on-light:#c2410c;--shadow:#c2410c;
  --text:#431407;--accent:#431407;
  --line:rgba(194,65,12,.2);--tagline:#7a6150;
}
:root[data-theme="coral"]{
  --bg:#ffe1d6;--surface:#fff1eb;--card:#fff1eb;--placeholder:#ffe1d6;
  --brand:#0d6b64;--card-ink:#0d6b64;--ink-on-light:#0d6b64;--shadow:#0d6b64;
  --text:#0b3b37;--accent:#0b3b37;
  --line:rgba(15,118,110,.2);--tagline:#6d5d57;
}
:root[data-theme="synthwave"]{
  color-scheme:dark;
  --bg:#1a0b2e;--surface:#26123f;--card:#26123f;--placeholder:#26123f;
  --brand:#ff4fd8;--card-ink:#ff4fd8;--on-accent:#1a0b2e;--ink-on-light:#1a0b2e;--shadow:#000;
  --text:#f5e9ff;--accent:#ff4fd8;
  --line:rgba(255,79,216,.22);--tagline:#a792c0;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="sky"]{
  --bg:#dff1ff;--surface:#f2f9ff;--card:#f2f9ff;--placeholder:#dff1ff;
  --brand:#0369a1;--card-ink:#0369a1;--ink-on-light:#0369a1;--shadow:#0369a1;
  --text:#062a45;--accent:#062a45;
  --line:rgba(3,105,161,.2);--tagline:#4f6475;
}
:root[data-theme="espresso"]{
  color-scheme:dark;
  --bg:#2b1d16;--surface:#3a2920;--card:#3a2920;--placeholder:#3a2920;
  --brand:#e8b98a;--card-ink:#e8b98a;--on-accent:#2b1d16;--ink-on-light:#2b1d16;--shadow:#000;
  --text:#f5e8dc;--accent:#e8b98a;
  --line:rgba(232,185,138,.22);--tagline:#bda694;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="matcha"]{
  --bg:#eef0dc;--surface:#f8f9ee;--card:#f8f9ee;--placeholder:#eef0dc;
  --brand:#4d6b1f;--card-ink:#4d6b1f;--ink-on-light:#4d6b1f;--shadow:#4d6b1f;
  --text:#2a3a10;--accent:#2a3a10;
  --line:rgba(77,107,31,.2);--tagline:#5f6650;
}
:root[data-theme="grape"]{
  color-scheme:dark;
  --bg:#2a1245;--surface:#37195a;--card:#37195a;--placeholder:#37195a;
  --brand:#7af0c2;--card-ink:#7af0c2;--on-accent:#2a1245;--ink-on-light:#2a1245;--shadow:#000;
  --text:#f2eaff;--accent:#7af0c2;
  --line:rgba(122,240,194,.22);--tagline:#b5a4cc;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="inferno"]{
  color-scheme:dark;
  --bg:#111111;--surface:#1c1c1c;--card:#1c1c1c;--placeholder:#1c1c1c;
  --brand:#ff3b3b;--card-ink:#ff5a5a;--on-accent:#111111;--ink-on-light:#111111;--shadow:#000;
  --text:#f5f5f5;--accent:#ff5a5a;
  --line:rgba(255,59,59,.24);--tagline:#a3a3a3;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="gameboy"]{
  --bg:#c4cfa1;--surface:#d6dfb5;--card:#d6dfb5;--placeholder:#c4cfa1;
  --brand:#2f4d09;--card-ink:#2f4d09;--ink-on-light:#2f4d09;--shadow:#2f4d09;
  --text:#1f3a1f;--accent:#1f3a1f;
  --line:rgba(47,77,9,.24);--tagline:#3f4f30;
}
:root[data-theme="barbie"]{
  --bg:#ffe3f1;--surface:#fff0f7;--card:#fff0f7;--placeholder:#ffe3f1;
  --brand:#b80f6b;--card-ink:#b80f6b;--ink-on-light:#b80f6b;--shadow:#b80f6b;
  --text:#4a0930;--accent:#4a0930;
  --line:rgba(184,15,107,.2);--tagline:#7a5468;
}
:root[data-theme="terminal"]{
  color-scheme:dark;
  --bg:#050805;--surface:#0c140c;--card:#0c140c;--placeholder:#0c140c;
  --brand:#39ff6a;--card-ink:#39ff6a;--on-accent:#050805;--ink-on-light:#050805;--shadow:#000;
  --text:#c9ffd5;--accent:#39ff6a;
  --line:rgba(57,255,106,.22);--tagline:#7fae8a;
  --grain-opacity:.08;--grain-blend:screen;
}
:root[data-theme="slate"]{
  --bg:#eef2f6;--surface:#f8fafc;--card:#f8fafc;--placeholder:#eef2f6;
  --brand:#334155;--card-ink:#334155;--ink-on-light:#334155;--shadow:#334155;
  --text:#0f172a;--accent:#0f172a;
  --line:rgba(51,65,85,.18);--tagline:#5b687a;
}
:root[data-theme="mustard"]{
  color-scheme:dark;
  --bg:#1f2124;--surface:#2a2d31;--card:#2a2d31;--placeholder:#2a2d31;
  --brand:#f2c230;--card-ink:#f2c230;--on-accent:#1f2124;--ink-on-light:#1f2124;--shadow:#000;
  --text:#f1efe8;--accent:#f2c230;
  --line:rgba(242,194,48,.22);--tagline:#a9a69d;
  --grain-opacity:.07;--grain-blend:screen;
}

*{box-sizing:border-box;}
html{
  scroll-behavior:smooth;background:var(--bg);
  accent-color:var(--accent-fill);
  scrollbar-color:color-mix(in srgb,var(--text) 32%,transparent) var(--bg);
}
::selection{background:var(--accent-fill);color:var(--on-accent);}

.site{
  margin:0;
  color:var(--text);
  font-family:var(--font-body);
  font-weight:400;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  line-height:1.55;
  caret-color:var(--accent-fill);
}
.site a{color:inherit;text-decoration:none;}
.site ul{list-style:none;margin:0;padding:0;}
.site :focus-visible{outline:2px solid var(--accent-fill);outline-offset:3px;border-radius:6px;}

.skip-link{
  position:fixed;left:12px;top:-60px;z-index:200;
  padding:10px 16px;border-radius:10px;
  background:var(--accent-fill);color:var(--on-accent);font-size:14px;
}
.site .skip-link:focus-visible{top:12px;}

.btn-primary{
  display:inline-flex;align-items:center;gap:9px;min-height:46px;
  padding:12px 22px;border-radius:999px;
  background:var(--accent-fill);color:var(--on-accent);
  font-size:15px;letter-spacing:.01em;
  box-shadow:0 12px 26px -12px color-mix(in srgb,var(--shadow) 45%,transparent);
  transition:transform .25s var(--ease),opacity .25s var(--ease);
}
.site .btn-primary{color:var(--on-accent);}
.btn-primary:hover{transform:translateY(-2px);opacity:.92;}

/* ---------- NAV ---------- */
.nav{
  position:sticky;top:0;z-index:50;
  height:var(--nav-h);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 var(--gutter);
  background:color-mix(in srgb,var(--bg) 78%,transparent);
  backdrop-filter:saturate(160%) blur(18px);
  -webkit-backdrop-filter:saturate(160%) blur(18px);
  border-bottom:1px solid var(--line);
}
.nav__brand{font-family:var(--font-display);letter-spacing:.02em;font-size:20px;padding:10px 0;}
.nav__right{display:flex;align-items:center;gap:clamp(16px,4vw,36px);}
.nav__links{display:flex;gap:clamp(14px,3.6vw,36px);}
.nav__links a{
  font-size:15px;color:var(--muted);position:relative;padding:12px 0;
  transition:color .25s var(--ease);
}
.nav__links a::after{
  content:"";position:absolute;left:0;bottom:8px;
  width:100%;height:1px;background:var(--accent-fill);
  transform:scaleX(0);transform-origin:right;
  transition:transform .3s var(--ease);
}
.nav__links a:hover{color:var(--text);}
.nav__links a:hover::after{transform:scaleX(1);transform-origin:left;}
.theme-toggle{
  position:relative;flex:0 0 auto;display:grid;place-items:center;
  width:32px;height:32px;border-radius:50%;padding:0;cursor:pointer;border:none;
  background:var(--accent-fill);color:var(--on-accent);
  transition:transform .25s var(--ease);
}
.theme-toggle::before{content:"";position:absolute;inset:-6px;}
.theme-toggle svg{transition:transform .45s var(--ease);}
.theme-toggle:hover svg{transform:rotate(-35deg);}
.theme-toggle:active{transform:scale(.9);}
.theme-picker{position:relative;display:flex;}
.site .theme-menu{
  position:absolute;top:calc(100% + 12px);right:0;z-index:60;
  width:220px;max-height:min(70vh,440px);overflow-y:auto;padding:6px;
  background:var(--surface);border:1px solid var(--line);border-radius:16px;
  box-shadow:0 24px 50px -20px color-mix(in srgb,var(--shadow) 45%,transparent);
  animation:menuIn .18s var(--ease);
}
@keyframes menuIn{from{opacity:0;transform:translateY(-6px) scale(.97);}to{opacity:1;transform:none;}}
.theme-menu button{
  display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;
  border:none;border-radius:10px;background:transparent;color:var(--text);
  font:inherit;font-size:13.5px;text-align:left;cursor:pointer;
}
.theme-menu button:hover,.theme-menu button[aria-pressed="true"]{background:var(--line);}
.theme-menu__swatch{
  flex:0 0 auto;width:22px;height:22px;border-radius:50%;
  background:radial-gradient(circle,var(--b) 0 38%,var(--a) 42%);
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.12);
}

/* ---------- BACKGROUND ---------- */
.bg-fx,.bg-grain{position:fixed;z-index:-1;pointer-events:none;}
.bg-fx{inset:0;overflow:hidden;}
.bg-dots{
  position:absolute;inset:-26px;
  background-image:radial-gradient(circle,color-mix(in srgb,var(--text) 9%,transparent) 2px,transparent 2.6px);
  background-size:26px 26px;
  scale:calc(1 + var(--beat, 0) * .012);
  animation:dotsDrift 7s linear infinite;will-change:transform;
}
.bg-dots::after{
  content:"";position:absolute;inset:0;
  background-image:radial-gradient(circle,color-mix(in srgb,var(--accent-fill) 22%,transparent) 2.2px,transparent 2.8px);
  background-size:26px 26px;
  opacity:calc(var(--beat, 0) * .45);
}
@keyframes dotsDrift{to{transform:translate(26px,-26px);}}
.bg-grain{
  inset:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:200px 200px;
  opacity:var(--grain-opacity);mix-blend-mode:var(--grain-blend);
}

/* ---------- SECTIONS ---------- */
.section{
  max-width:var(--maxw);
  margin:0 auto;
  padding:clamp(72px,10vw,128px) var(--gutter);
  scroll-margin-top:var(--nav-h);
}
.section--projects{padding-top:clamp(40px,6vw,72px);}
.section__title{
  font-family:var(--font-display);
  font-size:clamp(36px,5.6vw,64px);line-height:1.02;
  letter-spacing:.01em;margin:0 0 clamp(40px,6vw,72px);
}
.section__title--tight{margin-bottom:14px;}

/* ---------- HERO ---------- */
.hero{
  position:relative;
  max-width:var(--maxw);margin:0 auto;
  padding:clamp(40px,7vw,96px) var(--gutter) clamp(24px,4vw,48px);
  display:flex;align-items:center;gap:clamp(28px,5vw,64px);
  flex-wrap:wrap;
}
.hero::before{
  content:"";position:absolute;inset:-12% 0;z-index:-1;pointer-events:none;
  background:radial-gradient(52% 58% at 60% 46%,var(--bg) 38%,color-mix(in srgb,var(--bg) 0%,transparent) 100%);
}
.hero__photo{
  flex:0 0 auto;width:clamp(180px,27vw,340px);aspect-ratio:1;border-radius:32px;
  overflow:hidden;
  border:1px solid var(--line);
  box-shadow:0 30px 70px -30px color-mix(in srgb,var(--shadow) 30%,transparent);
}
.hero__photo img{width:100%;height:100%;object-fit:cover;display:block;}
.hero__intro{flex:1 1 380px;min-width:0;}
.hero__name{
  font-family:var(--font-display);
  margin:0;font-size:clamp(40px,5.7vw,68px);
  letter-spacing:.005em;line-height:1.04;
}
.typed__word{white-space:nowrap;}
.typed__ch{opacity:0;}
.typed__ch.is-on{opacity:1;}
.typed__caret{position:relative;display:inline-block;width:0;}
.typed__caret::after{
  content:"";position:absolute;left:.03em;top:-.78em;height:.86em;width:.075em;
  border-radius:1px;background:var(--accent-fill);
}
.is-typed .typed__caret::after{animation:caretBlink .9s steps(1) 3,caretOut .2s linear 2.7s forwards;}
@keyframes caretBlink{50%{opacity:0;}}
@keyframes caretOut{to{opacity:0;}}
.hero__role{margin:16px 0 0;font-size:clamp(18px,2.2vw,23px);letter-spacing:.01em;}
.hero__proof{margin:12px 0 0;font-size:clamp(16px,1.6vw,18px);line-height:1.62;color:var(--muted);max-width:56ch;}
.hero__status{
  display:inline-flex;align-items:flex-start;gap:12px;margin:18px 0 0;
  font-size:14px;line-height:1.55;letter-spacing:.01em;
}
.hero__status::before{
  content:"";width:8px;height:8px;border-radius:50%;flex:0 0 auto;margin-top:.45em;
  background:var(--accent-fill);
  box-shadow:0 0 0 4px color-mix(in srgb,var(--accent-fill) 18%,transparent);
}
.hero__actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px 22px;margin-top:26px;}
.site .hero__secondary{
  font-size:15px;padding:12px 0;
  text-decoration:underline;text-decoration-color:var(--accent-fill);
  text-decoration-thickness:2px;text-underline-offset:6px;
}
.site .hero__secondary:hover{color:var(--accent-fill);}
.hero__resume-date{margin:12px 0 0;font-size:13.5px;color:var(--muted);}

/* ---------- PROJECTS ---------- */
.projects{display:flex;flex-direction:column;gap:clamp(56px,8vw,96px);}
.project{
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);
  align-items:start;gap:clamp(28px,4.5vw,60px);
  padding-top:clamp(40px,6vw,64px);border-top:1px solid var(--line);
  opacity:0;transform:translateY(28px);
  transition:opacity .8s var(--ease),transform .8s var(--ease);
}
.project:first-child{padding-top:0;border-top:none;}
.project.is-visible{opacity:1;transform:none;}
.project__name{font-family:var(--font-display);margin:0;font-size:clamp(26px,2.8vw,32px);line-height:1.1;letter-spacing:.01em;}
.project__summary{margin:10px 0 0;font-size:clamp(16px,1.5vw,17.5px);line-height:1.5;max-width:50ch;}
.project__credit{margin:6px 0 0;font-size:13px;color:var(--muted);}
.site ul.bullets{display:flex;flex-direction:column;gap:12px;margin:20px 0 0;max-width:64ch;}
.bullets li{
  position:relative;padding-left:20px;
  color:var(--muted);font-size:15.5px;line-height:1.66;
}
.hl{
  color:color-mix(in srgb,var(--accent-fill) 75%,var(--text));
  background:color-mix(in srgb,var(--accent-fill) 11%,transparent);
  padding:.05em .3em;margin:0 -.1em;border-radius:5px;
  -webkit-box-decoration-break:clone;box-decoration-break:clone;
}
.bullets li::before{
  content:"";position:absolute;left:0;top:.72em;
  width:6px;height:6px;border-radius:50%;background:var(--accent-fill);
}
.site .project__stack{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;}
.project__stack li{
  font-size:12.5px;padding:5px 12px;border-radius:999px;
  background:var(--surface);border:1px solid var(--line);
}
.project__links{display:flex;flex-wrap:wrap;gap:2px 26px;margin-top:18px;}
.site .project__link{
  display:inline-flex;align-items:center;gap:6px;padding:10px 0;
  font-size:15px;
  text-decoration:underline;text-decoration-color:var(--accent-fill);
  text-decoration-thickness:2px;text-underline-offset:6px;
  transition:gap .25s var(--ease),color .25s var(--ease);
}
.site .project__link--quiet{color:var(--muted);text-decoration-color:var(--line);}
.site .project__link:hover{gap:10px;color:var(--accent-fill);}

.project__demo{display:block;position:sticky;top:calc(var(--nav-h) + 28px);}
.window{
  border-radius:18px;overflow:hidden;background:var(--card);
  border:1px solid var(--line);
  box-shadow:0 40px 90px -45px color-mix(in srgb,var(--shadow) 30%,transparent);
  transition:transform .45s var(--ease),box-shadow .45s var(--ease);
}
.project:hover .window{transform:translateY(-6px);box-shadow:0 55px 110px -45px color-mix(in srgb,var(--shadow) 36%,transparent);}
.window__bar{
  display:flex;align-items:center;gap:7px;padding:11px 14px;
  background:color-mix(in srgb,var(--surface) 90%,var(--text) 10%);
  border-bottom:1px solid var(--line);
}
.dot{width:10px;height:10px;border-radius:50%;flex:0 0 auto;background:color-mix(in srgb,var(--text) 24%,transparent);}
.window__url{
  margin-left:8px;flex:1;min-width:0;font-size:12px;color:var(--muted);
  background:var(--bg);border-radius:6px;padding:4px 10px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.window__mode{
  position:relative;flex:0 0 auto;
  display:inline-flex;align-items:center;gap:5px;min-height:26px;
  padding:4px 10px;border-radius:999px;
  border:1px solid var(--line);background:transparent;color:var(--muted);
  font:inherit;font-size:11.5px;line-height:1;cursor:pointer;
  transition:background .2s var(--ease),color .2s var(--ease);
}
.window__mode::before{content:"";position:absolute;inset:-9px -6px;}
.window__mode:hover{background:var(--line);color:var(--text);}
.window__mode[aria-pressed="true"]{background:var(--accent-fill);border-color:transparent;color:var(--on-accent);}
.window__view{display:block;}
.window__body{
  position:relative;background:var(--placeholder);
  aspect-ratio:16/10;overflow:hidden;
  overscroll-behavior:contain;scroll-behavior:auto;
}
.window__screenshot{
  display:block;width:100%;height:auto;
  transform:translateY(0);
  transition:transform 1.2s cubic-bezier(.65,0,.35,1);
}
@media (hover:hover){
  .project:hover .can-pan:not(.is-manual) .window__screenshot,
  .project:focus-within:not(:has(.window__mode:focus)) .can-pan:not(.is-manual) .window__screenshot{
    transform:translateY(calc(-1 * var(--pan)));
    transition:transform var(--pan-duration) cubic-bezier(.37,0,.63,1);
  }
}
@media (hover:none){
  .can-pan.is-onscreen:not(.is-manual) .window__screenshot{
    animation:panLoop calc(var(--pan-duration) * 2 + 3s) cubic-bezier(.37,0,.63,1) infinite;
  }
}
@keyframes panLoop{
  0%,15%{transform:translateY(0);}
  50%,65%{transform:translateY(calc(-1 * var(--pan)));}
  100%{transform:translateY(0);}
}
.window__body.is-manual{
  overflow-y:scroll;cursor:grab;
  scrollbar-width:thin;
  scrollbar-color:color-mix(in srgb,var(--text) 35%,transparent) transparent;
}
.window__body.is-manual:active{cursor:grabbing;}
.window__body.is-manual .window__screenshot{transform:none;transition:none;animation:none;}
.window__body.is-manual::-webkit-scrollbar{width:10px;}
.window__body.is-manual::-webkit-scrollbar-track{background:transparent;}
.window__body.is-manual::-webkit-scrollbar-thumb{
  background-color:color-mix(in srgb,var(--text) 35%,transparent);
  background-clip:padding-box;border:2px solid transparent;border-radius:999px;
}
.window__body.is-manual::-webkit-scrollbar-thumb:hover{
  background-color:color-mix(in srgb,var(--text) 55%,transparent);
}

/* ---------- TECH ---------- */
.tech__hint{margin:0 0 clamp(28px,4vw,44px);font-size:15px;color:var(--muted);}
.tech__rows{display:flex;flex-direction:column;}
.tech__row{
  display:grid;grid-template-columns:150px 1fr;gap:clamp(12px,3vw,32px);
  align-items:start;padding:18px 0;
  border-top:1px solid var(--line);
}
.tech__row:last-child{border-bottom:1px solid var(--line);}
.tech__label{padding-top:9px;font-size:14px;color:var(--muted);letter-spacing:.02em;}
.tech__badges{display:flex;flex-wrap:wrap;gap:8px 10px;}

.chip{
  display:inline-flex;align-items:center;gap:9px;min-height:40px;
  padding:6px 15px 6px 7px;border-radius:999px;
  background:var(--surface);border:1px solid var(--line);color:var(--text);
  font:inherit;font-size:13.5px;line-height:1.2;cursor:pointer;
  opacity:0;transform:translateY(12px);
  transition:opacity .5s var(--ease),transform .5s var(--ease),border-color .2s var(--ease),background .2s var(--ease);
}
.tech.is-visible .chip{opacity:1;transform:none;}
.tech.is-visible .chip:hover{transform:translateY(-2px);border-color:var(--accent-fill);}
.chip[aria-expanded="true"]{border-color:var(--accent-fill);background:color-mix(in srgb,var(--accent-fill) 10%,var(--surface));}
.chip__icon{
  flex:0 0 auto;width:26px;height:26px;border-radius:50%;
  display:grid;place-items:center;background:#fff;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.06);
}
.chip__icon img{width:16px;height:16px;display:block;}
.chip__fallback{font-family:var(--font-display);font-size:13px;line-height:1;color:#800020;}

/* ---------- SKILL BUBBLE ---------- */
.skill-bubble{
  position:absolute;z-index:100;transform:translate(-50%,calc(-100% - 14px));
  min-width:160px;max-width:230px;
  background:color-mix(in srgb,var(--surface) 72%,transparent);color:var(--text);
  backdrop-filter:saturate(160%) blur(14px);-webkit-backdrop-filter:saturate(160%) blur(14px);
  border:1px solid var(--line);
  border-radius:16px;padding:12px 14px;
  box-shadow:0 18px 40px -14px rgba(47,43,34,.35);
  transform-origin:50% 100%;
  animation:bubbleIn .18s var(--ease);
}
.skill-bubble.is-below{transform:translate(-50%,14px);transform-origin:50% 0;}
.skill-bubble:focus{outline:none;}
.skill-bubble::after{
  content:"";position:absolute;left:50%;bottom:-6px;
  width:12px;height:12px;background:inherit;
  border-right:1px solid var(--line);border-bottom:1px solid var(--line);
  transform:translateX(-50%) rotate(45deg);border-radius:2px;
  backdrop-filter:none;-webkit-backdrop-filter:none;
}
.skill-bubble.is-below::after{
  bottom:auto;top:-6px;border-right:none;border-bottom:none;
  border-left:1px solid var(--line);border-top:1px solid var(--line);
}
@keyframes bubbleIn{from{opacity:0;scale:.92;}to{opacity:1;scale:1;}}
.skill-bubble__title{font-family:var(--font-display);display:block;font-size:16px;margin-bottom:6px;}
.skill-bubble__empty{margin:0;font-size:12.5px;color:var(--muted);line-height:1.4;}
.skill-bubble__list{display:flex;flex-direction:column;}
.skill-bubble__list a{
  display:block;font-size:13px;color:var(--text);
  padding:6px 0;border-bottom:1px solid var(--line);
}
.skill-bubble__list li:last-child a{border-bottom:none;}
.skill-bubble__list a:hover{color:var(--accent-fill);}

/* ---------- SOUND DOCK ---------- */
.dock{
  position:fixed;right:16px;bottom:16px;z-index:90;
  display:flex;flex-direction:column;align-items:flex-end;gap:10px;
  width:min(340px,calc(100vw - 32px));pointer-events:none;
}
.dock__tab,.dock__panel{pointer-events:auto;}
.dock__tab{
  display:inline-flex;align-items:center;gap:10px;max-width:100%;min-height:44px;
  padding:10px 18px;border-radius:999px;border:none;cursor:pointer;font:inherit;
  background:var(--accent-fill);color:var(--on-accent);font-size:14px;
  box-shadow:0 14px 30px -14px color-mix(in srgb,var(--shadow) 60%,transparent);
  transition:transform .25s var(--ease);
}
.dock__tab:hover{transform:translateY(-2px);}
.dock__tab-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dock__eq{display:inline-flex;align-items:flex-end;gap:2px;height:12px;flex:0 0 auto;}
.dock__eq i{width:3px;height:4px;border-radius:1px;background:currentColor;}
.dock__eq i:nth-child(2){height:9px;}
.dock__eq i:nth-child(3){height:6px;}
.dock__eq.is-playing i{animation:eq .9s ease-in-out infinite alternate;}
.dock__eq.is-playing i:nth-child(2){animation-delay:-.3s;}
.dock__eq.is-playing i:nth-child(3){animation-delay:-.6s;}
@keyframes eq{from{height:3px;}to{height:12px;}}
.dock__eq.is-live i{animation:none;height:calc(25% + var(--b1, 0) * 75%);}
.dock__eq.is-live i:nth-child(2){height:calc(25% + var(--b2, 0) * 75%);}
.dock__eq.is-live i:nth-child(3){height:calc(25% + var(--b3, 0) * 75%);}

.dock__panel{
  width:100%;padding:14px;border-radius:20px;
  background:color-mix(in srgb,var(--surface) 84%,transparent);
  backdrop-filter:saturate(160%) blur(18px);-webkit-backdrop-filter:saturate(160%) blur(18px);
  border:1px solid var(--line);
  box-shadow:0 30px 60px -24px color-mix(in srgb,var(--shadow) 40%,transparent);
  opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);transform-origin:bottom right;
  transition:opacity .25s var(--ease),transform .3s var(--ease),visibility 0s linear .3s;
}
.dock__panel:focus{outline:none;}
.dock.is-open .dock__panel{opacity:1;visibility:visible;transform:none;transition:opacity .25s var(--ease),transform .3s var(--ease);}
.dock__status{margin:10px 2px 0;font-size:13px;line-height:1.5;}
.dock__status a{text-decoration:underline;text-underline-offset:3px;}
.dock__now{display:flex;align-items:center;gap:12px;}
.dock__art{width:56px;height:56px;border-radius:12px;object-fit:cover;flex:0 0 auto;}
.dock__meta{min-width:0;display:flex;flex-direction:column;gap:2px;}
.dock__title{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dock__artist{font-size:12.5px;color:var(--muted);}
.dock__title:hover,.dock__artist:hover{text-decoration:underline;}

.dock__range{
  -webkit-appearance:none;appearance:none;width:100%;height:4px;margin:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(to right,var(--accent-fill) var(--p),var(--line) var(--p));
}
.dock__range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent-fill);border:none;}
.dock__range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--accent-fill);border:none;}
.dock__seek{margin:14px 0 6px;}
.dock__volume{display:flex;align-items:center;gap:8px;margin-top:6px;padding:0 4px;}
.dock__volume button{
  display:grid;place-items:center;width:36px;height:36px;flex:0 0 auto;border-radius:50%;
  border:none;background:transparent;color:var(--text);cursor:pointer;
}
.dock__volume button:hover{background:var(--line);}
.dock__controls{display:flex;justify-content:center;align-items:center;gap:14px;}
.dock__controls button{
  display:grid;place-items:center;width:40px;height:40px;border-radius:50%;
  border:none;background:transparent;color:var(--text);cursor:pointer;
}
.dock__controls button:hover{background:var(--line);}
.dock__controls .dock__play{width:46px;height:46px;background:var(--accent-fill);color:var(--on-accent);}
.dock__controls .dock__play:hover{background:var(--accent-fill);opacity:.9;}
.site .dock__list{
  list-style:none;padding-left:0;margin:12px 0 0;max-height:170px;overflow-y:auto;
  border-top:1px solid var(--line);padding-top:6px;
  scrollbar-width:thin;scrollbar-color:var(--line) transparent;
}
.dock__list button{
  display:block;width:100%;text-align:left;padding:8px 6px;border:none;border-radius:8px;
  background:transparent;color:var(--text);font:inherit;font-size:13px;cursor:pointer;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.dock__list button:hover{background:var(--line);}
.dock__list button.is-current{color:var(--accent-fill);text-decoration:underline;text-underline-offset:3px;}
.dock__credit{display:block;margin-top:10px;font-size:11.5px;color:var(--muted);text-align:right;}
.dock__credit:hover{color:var(--text);}

/* ---------- CONTACT ---------- */
.contact{
  background:var(--card);color:var(--card-ink);
  border-radius:32px;padding:clamp(48px,8vw,96px) clamp(24px,6vw,72px);
  text-align:center;
  box-shadow:0 50px 120px -50px rgba(47,43,34,.35);
}
.contact__heading{font-family:var(--font-display);margin:0;font-size:clamp(30px,5vw,54px);line-height:1.1;letter-spacing:.01em;text-wrap:balance;}
.site .contact__email{
  display:inline-block;margin-top:22px;padding:6px 0;font-size:clamp(17px,2.6vw,26px);
  color:var(--text);word-break:break-word;
  text-decoration:underline;text-decoration-color:var(--accent-fill);
  text-decoration-thickness:2px;text-underline-offset:8px;
  transition:color .25s var(--ease);
}
.site .contact__email:hover{color:var(--accent-fill);}
.contact__actions{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:20px 28px;margin-top:34px;}
.contact__socials{display:flex;justify-content:center;gap:12px;}
.social{
  width:48px;height:48px;border-radius:50%;display:grid;place-items:center;
  background:var(--bg);color:var(--card-ink);
  transition:transform .25s var(--ease),background .25s var(--ease),color .25s var(--ease);
}
.social:hover{transform:translateY(-4px);background:var(--card-ink);color:var(--on-accent);}
.contact__tagline{margin:38px 0 0;font-size:17px;color:var(--tagline);}

/* ---------- FOOTER ---------- */
.footer{
  max-width:var(--maxw);margin:0 auto;
  padding:34px var(--gutter) 92px;
  display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;
  border-top:1px solid var(--line);
  color:var(--muted);font-size:13px;
}
.footer__visits{display:inline-flex;align-items:center;gap:8px;}
.footer__pulse{position:relative;width:7px;height:7px;border-radius:50%;background:var(--accent-fill);}
.footer__pulse::after{
  content:"";position:absolute;inset:0;border-radius:50%;background:var(--accent-fill);
  animation:visitPulse 1.8s var(--ease) infinite;
}
@keyframes visitPulse{from{transform:scale(1);opacity:.6;}to{transform:scale(2.8);opacity:0;}}

/* ---------- RESPONSIVE ---------- */
@media (max-width:860px){
  .project{grid-template-columns:minmax(0,1fr);gap:24px;}
  .project__demo{order:-1;position:static;}
}
@media (max-width:760px){
  .hero{flex-direction:column;align-items:flex-start;}
  .hero__intro{flex:none;width:100%;}
  .tech__row{grid-template-columns:1fr;gap:10px;padding:16px 0;}
  .tech__label{padding-top:0;}
  .chip{min-height:38px;font-size:13px;}
  .footer{flex-direction:column;}
  .dock{right:14px;bottom:14px;}
  .dock__tab{width:50px;height:50px;min-height:0;padding:0;justify-content:center;}
  .dock__tab-label{
    position:absolute;width:1px;height:1px;margin:-1px;padding:0;
    overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;
  }
  .dock__eq{height:16px;gap:3px;}
  .dock__eq i{width:4px;}
}
@media (max-width:420px){
  .nav__links{gap:14px;}
  .nav__links a{font-size:14px;}
}

/* ---------- REDUCED MOTION ---------- */
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto;}
  .project,.chip{opacity:1 !important;transform:none !important;transition:none !important;}
  .window,.social,.nav__links a::after,.site .project__link,.theme-toggle,.btn-primary,.window__mode{transition:none !important;}
  .window__screenshot{transform:none !important;transition:none !important;animation:none !important;}
  .skill-bubble,.theme-menu,.bg-dots,.dock__eq i,.footer__pulse::after,.typed__caret::after{animation:none !important;}
  .typed__caret{display:none;}
  .dock__panel,.dock__tab{transition:none !important;}
}
`;
