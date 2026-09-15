import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import mordiShot from "./assets/screenshots/mordi-full.webp";
import lonelyChessShot from "./assets/screenshots/lonely-chess-full.webp";
import pdfyierShot from "./assets/screenshots/pdfyier-full.webp";
import profilePhoto from "./assets/profile.webp";

/* =========================================================================
   Perfect Phanitchaleun: personal portfolio.
   Single-file React app with injected CSS. Respects prefers-reduced-motion.
   ========================================================================= */

const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.17.0/icons";
const GITHUB = "https://github.com/SailmanSeeulater";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const PROJECTS = [
  {
    name: "Mordi",
    summary: "A goal tracker with daily logs and weekly mood reports, self-hosted and shipped through CI.",
    bullets: [
      "Audited the API and found a JWT signing secret and database password committed in plaintext since the first commit. Rotated both, closed an account enumeration hole in login, and added Redis backed rate limiting.",
      "Set up a GitHub Actions CI pipeline (JUnit, Mockito, ESLint, Vitest, production build) that has caught 9 defects before deploy, including one that would have crashed the API on startup.",
      "Built the Spring Boot REST API with JWT auth for goal tracking, daily logging, and automatic weekly mood and completion reports. Every schema change ships through a reviewed Flyway migration instead of framework auto generation.",
    ],
    stack: ["Java", "Spring Boot", "Spring Security", "React", "PostgreSQL", "Redis", "Docker", "nginx", "GitHub Actions"],
    skills: ["JavaScript", "HTML5", "CSS3", "SQL", "JUnit", "Mockito", "ESLint", "Vitest", "Linux", "Git", "GitHub"],
    live: "https://mordi.latesailor.dev",
    repo: `${GITHUB}/Mordi`,
    demo: { domain: "mordi.latesailor.dev", image: mordiShot, height: 2177 },
  },
  {
    name: "Lonely Chess",
    summary: "A programming language where a legal game of chess is the source code.",
    credit: "Built with Nicolaus ReyasBautista · CS 420 final project",
    bullets: [
      "Co-designed an esoteric language where legal PGN chess notation executes as source code, then built the Python interpreter for it: a state machine parsing moves into integer and string declarations, loops, conditionals, modulo, and four function arithmetic.",
      "Implemented FizzBuzz (1 to 100) as a 2,669 move chess game, exercising nested conditionals, string concatenation, and implicit else branching.",
      "Ported the interpreter to TypeScript so programs run entirely in the browser, on a Next.js site with a live PGN runner, a playable board, and five unabridged sample programs.",
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
      "Runs through nginx and a FastAPI backend that shells out to ImageMagick and streams the finished PDF back in the same request. Uploads never touch persistent disk, temp storage is RAM backed on both host and container.",
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
          <span className={index < count ? "typed__ch is-on" : "typed__ch"}>{ch}</span>
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

/* ---- Circular tech badge with graceful fallback ---- */
function TechBadge({ name, slug, delay, onSelect }) {
  const [failed, setFailed] = useState(!slug);
  return (
    <div className="badge" style={{ transitionDelay: `${delay}ms` }}>
      <button
        type="button"
        className="badge__disc"
        aria-haspopup="dialog"
        aria-label={`${name}: see which projects use it`}
        onClick={(e) => onSelect(name, e.currentTarget)}
      >
        {failed ? (
          <span className="badge__fallback" aria-hidden="true">{name.charAt(0)}</span>
        ) : (
          <img
            src={`${DEVICON}/${slug}/${slug}-original.svg`}
            alt=""
            width="34"
            height="34"
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
      </button>
      <span className="badge__name" aria-hidden="true">{name}</span>
    </div>
  );
}

/* ---- Browser-window preview that scrolls through the live site ---- */
function ScrollPreview({ project }) {
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const onScreen = useOnScreen(frameRef, 0.6);
  const [pan, setPan] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) return;
    const measure = () => {
      if (!img.naturalWidth) return;
      const rendered = frame.clientWidth * (img.naturalHeight / img.naturalWidth);
      setPan(Math.max(0, Math.round(rendered - frame.clientHeight)));
    };
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

  return (
    <a className="project__demo" href={project.live} target="_blank" rel="noreferrer" tabIndex={-1} aria-hidden="true">
      <div className="window">
        <div className="window__bar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <div className="window__url">{project.demo.domain}</div>
        </div>
        <div
          ref={frameRef}
          className={`window__body${pan > 24 ? " can-pan" : ""}${onScreen ? " is-onscreen" : ""}`}
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
      </div>
    </a>
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
            <li key={i}>{b}</li>
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
      if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest(".badge__disc")) {
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
        if (!e.currentTarget.contains(e.relatedTarget) && e.relatedTarget && !e.relatedTarget.closest(".badge__disc")) {
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

const SC_USER_URL = "https://api.soundcloud.com/users/1096592947";
const SC_PROFILE = "https://soundcloud.com/latersellyoulater";
let scApiPromise;

function loadSoundCloudApi() {
  if (window.SC?.Widget) return Promise.resolve(window.SC);
  scApiPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    s.async = true;
    s.onload = () => resolve(window.SC);
    s.onerror = () => {
      scApiPromise = undefined;
      reject(new Error("SoundCloud widget API failed to load"));
    };
    document.head.appendChild(s);
  });
  return scApiPromise;
}

const artwork = (s) => (s?.artwork_url || s?.user?.avatar_url || "").replace("-large", "-t200x200");

function SoundDock() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [sounds, setSounds] = useState([]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const v = Number(localStorage.getItem("volume"));
      return localStorage.getItem("volume") !== null && v >= 0 && v <= 100 ? v : 70;
    } catch {
      return 70;
    }
  });
  const volumeRef = useRef(volume);
  const lastVolumeRef = useRef(volume || 70);
  const iframeRef = useRef(null);
  const widgetRef = useRef(null);
  const tabRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    volumeRef.current = volume;
    widgetRef.current?.setVolume(volume);
    try {
      localStorage.setItem("volume", String(volume));
    } catch {
      /* storage unavailable */
    }
  }, [volume]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    let isReady = false;
    const timeout = setTimeout(() => {
      if (!cancelled && !isReady) setFailed(true);
    }, 15000);

    loadSoundCloudApi()
      .then((SC) => {
        if (cancelled || !iframeRef.current) return;
        const w = SC.Widget(iframeRef.current);
        widgetRef.current = w;
        const E = SC.Widget.Events;
        const sync = () => {
          w.getCurrentSound((s) => s && setSound(s));
          w.getCurrentSoundIndex((i) => setIndex(i));
          w.getSounds((list) => setSounds(list || []));
        };
        w.bind(E.READY, () => {
          isReady = true;
          setReady(true);
          setFailed(false);
          w.setVolume(volumeRef.current);
          sync();
        });
        w.bind(E.PLAY, () => {
          setPlaying(true);
          w.setVolume(volumeRef.current);
          sync();
        });
        w.bind(E.PAUSE, () => setPlaying(false));
        w.bind(E.FINISH, () => setPlaying(false));
        w.bind(E.PLAY_PROGRESS, (e) => setProgress(e.relativePosition));
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [mounted]);

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

  const w = widgetRef.current;
  const seek = (e) => {
    const ratio = Number(e.target.value) / 1000;
    setProgress(ratio);
    w?.getDuration((d) => w.seekTo(ratio * d));
  };
  const toggleMute = () => {
    if (volume > 0) {
      lastVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(lastVolumeRef.current || 70);
    }
  };
  const loaded = sounds.map((s, i) => ({ s, i })).filter(({ s }) => s.title);

  return (
    <div className={`dock ${open ? "is-open" : ""}`}>
      <div ref={panelRef} className="dock__panel" id="dock-panel" role="region" aria-label="Music player" tabIndex={-1} inert={!open}>
        {failed && !ready ? (
          <p className="dock__status">
            SoundCloud didn't load, it may be blocked on this network.{" "}
            <a href={SC_PROFILE} target="_blank" rel="noreferrer">Listen on SoundCloud instead</a>.
          </p>
        ) : !ready ? (
          <p className="dock__status" role="status">Loading tracks from SoundCloud…</p>
        ) : (
          <>
            <div className="dock__now">
              {artwork(sound) && <img className="dock__art" src={artwork(sound)} alt="" width="56" height="56" />}
              <div className="dock__meta">
                <a className="dock__title" href={sound?.permalink_url} target="_blank" rel="noreferrer">
                  {sound?.title}
                </a>
                <a className="dock__artist" href={SC_PROFILE} target="_blank" rel="noreferrer">
                  {sound?.user?.username}
                </a>
              </div>
            </div>

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
              <button type="button" onClick={() => w?.prev()} aria-label="Previous track">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
              </button>
              <button type="button" className="dock__play" onClick={() => w?.toggle()} aria-label={playing ? "Pause" : "Play"}>
                {playing ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button type="button" onClick={() => w?.next()} aria-label="Next track">
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

            {loaded.length > 0 && (
              <ol className="dock__list" aria-label="Tracks">
                {loaded.map(({ s, i }) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={i === index ? "is-current" : ""}
                      aria-current={i === index ? "true" : undefined}
                      onClick={() => w?.skip(i)}
                    >
                      {s.title}
                    </button>
                  </li>
                ))}
              </ol>
            )}

            <a className="dock__credit" href={SC_PROFILE} target="_blank" rel="noreferrer">
              Streaming from SoundCloud
            </a>
          </>
        )}
      </div>

      <button
        ref={tabRef}
        type="button"
        className="dock__tab"
        aria-expanded={open}
        aria-controls="dock-panel"
        onClick={() => {
          setMounted(true);
          setOpen((o) => !o);
        }}
      >
        <span className={`dock__eq ${playing ? "is-playing" : ""}`} aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="dock__tab-label">{playing && sound ? sound.title : "My music"}</span>
      </button>

      {mounted && (
        <iframe
          ref={iframeRef}
          className="dock__iframe"
          title="SoundCloud player"
          allow="autoplay; encrypted-media"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(SC_USER_URL)}&auto_play=false&visual=false&show_artwork=false&buying=false&sharing=false&download=false`}
        />
      )}
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

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function App() {
  const [techRef, techInView] = useInView({ threshold: 0.1 });
  const [activeSkill, setActiveSkill] = useState(null);
  const skillTriggerRef = useRef(null);
  useAnalytics();

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
      <style>{CSS}</style>
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
          <p className="tech__hint">Click a badge to see which projects use it.</p>
          <div className="tech__rows">
            {TECH.map((row) => {
              const id = `tech-${row.label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
              return (
                <div className="tech__row" key={row.label} role="group" aria-labelledby={id}>
                  <span className="tech__label" id={id}>{row.label}</span>
                  <div className="tech__badges">
                    {row.items.map(([name, slug], i) => (
                      <TechBadge key={name} name={name} slug={slug} delay={i * 60} onSelect={handleSelectSkill} />
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
  --accent-fill:#800020;
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
  --accent-fill:#1d4ed8;--card-ink:#1d4ed8;--ink-on-light:#1d4ed8;--shadow:#1d4ed8;
  --text:#0a1f5c;--accent:#0a1f5c;
  --line:rgba(29,78,216,.2);--tagline:#5b6275;
}
:root[data-theme="forest"]{
  --bg:#ffffff;--surface:#eef6f0;--card:#eef6f0;--placeholder:#eef6f0;
  --accent-fill:#1b7a43;--card-ink:#1b7a43;--ink-on-light:#1b7a43;--shadow:#1b7a43;
  --text:#0c3b22;--accent:#0c3b22;
  --line:rgba(27,122,67,.2);--tagline:#5f6b63;
}
:root[data-theme="midnight"]{
  color-scheme:dark;
  --bg:#0f0f0f;--surface:#1a1a1a;--card:#1a1a1a;--placeholder:#1a1a1a;
  --accent-fill:#c6f432;--card-ink:#c6f432;--on-accent:#0f0f0f;--ink-on-light:#0f0f0f;--shadow:#000;
  --text:#f2f2ec;--accent:#c6f432;
  --line:rgba(198,244,50,.2);--tagline:#9a9a94;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="bubblegum"]{
  --bg:#ffd6e8;--surface:#ffe9f2;--card:#ffe9f2;--placeholder:#ffd6e8;
  --accent-fill:#141414;--card-ink:#141414;--on-accent:#ffd6e8;--ink-on-light:#141414;--shadow:#d6336c;
  --text:#1a0a12;--accent:#1a0a12;
  --line:rgba(20,20,20,.16);--tagline:#6b4a58;
}
:root[data-theme="lavender"]{
  --bg:#ece6ff;--surface:#f7f4ff;--card:#f7f4ff;--placeholder:#ece6ff;
  --accent-fill:#5b2bd1;--card-ink:#5b2bd1;--ink-on-light:#5b2bd1;--shadow:#5b2bd1;
  --text:#26104f;--accent:#26104f;
  --line:rgba(91,43,209,.2);--tagline:#6a6380;
}
:root[data-theme="harbor"]{
  color-scheme:dark;
  --bg:#0d1b2a;--surface:#15263a;--card:#15263a;--placeholder:#15263a;
  --accent-fill:#ff8a3d;--card-ink:#ff8a3d;--on-accent:#0d1b2a;--ink-on-light:#0d1b2a;--shadow:#000;
  --text:#f3efe6;--accent:#ff8a3d;
  --line:rgba(255,138,61,.22);--tagline:#9aa6b4;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="mint"]{
  --bg:#d9f2e4;--surface:#eefaf3;--card:#eefaf3;--placeholder:#d9f2e4;
  --accent-fill:#5a3825;--card-ink:#5a3825;--ink-on-light:#5a3825;--shadow:#5a3825;
  --text:#3b2416;--accent:#3b2416;
  --line:rgba(90,56,37,.18);--tagline:#6b6258;
}
:root[data-theme="tangerine"]{
  --bg:#fff1e0;--surface:#fff8ef;--card:#fff8ef;--placeholder:#fff1e0;
  --accent-fill:#c2410c;--card-ink:#c2410c;--ink-on-light:#c2410c;--shadow:#c2410c;
  --text:#431407;--accent:#431407;
  --line:rgba(194,65,12,.2);--tagline:#7a6150;
}
:root[data-theme="coral"]{
  --bg:#ffe1d6;--surface:#fff1eb;--card:#fff1eb;--placeholder:#ffe1d6;
  --accent-fill:#0d6b64;--card-ink:#0d6b64;--ink-on-light:#0d6b64;--shadow:#0d6b64;
  --text:#0b3b37;--accent:#0b3b37;
  --line:rgba(15,118,110,.2);--tagline:#6d5d57;
}
:root[data-theme="synthwave"]{
  color-scheme:dark;
  --bg:#1a0b2e;--surface:#26123f;--card:#26123f;--placeholder:#26123f;
  --accent-fill:#ff4fd8;--card-ink:#ff4fd8;--on-accent:#1a0b2e;--ink-on-light:#1a0b2e;--shadow:#000;
  --text:#f5e9ff;--accent:#ff4fd8;
  --line:rgba(255,79,216,.22);--tagline:#a792c0;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="sky"]{
  --bg:#dff1ff;--surface:#f2f9ff;--card:#f2f9ff;--placeholder:#dff1ff;
  --accent-fill:#0369a1;--card-ink:#0369a1;--ink-on-light:#0369a1;--shadow:#0369a1;
  --text:#062a45;--accent:#062a45;
  --line:rgba(3,105,161,.2);--tagline:#4f6475;
}
:root[data-theme="espresso"]{
  color-scheme:dark;
  --bg:#2b1d16;--surface:#3a2920;--card:#3a2920;--placeholder:#3a2920;
  --accent-fill:#e8b98a;--card-ink:#e8b98a;--on-accent:#2b1d16;--ink-on-light:#2b1d16;--shadow:#000;
  --text:#f5e8dc;--accent:#e8b98a;
  --line:rgba(232,185,138,.22);--tagline:#bda694;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="matcha"]{
  --bg:#eef0dc;--surface:#f8f9ee;--card:#f8f9ee;--placeholder:#eef0dc;
  --accent-fill:#4d6b1f;--card-ink:#4d6b1f;--ink-on-light:#4d6b1f;--shadow:#4d6b1f;
  --text:#2a3a10;--accent:#2a3a10;
  --line:rgba(77,107,31,.2);--tagline:#5f6650;
}
:root[data-theme="grape"]{
  color-scheme:dark;
  --bg:#2a1245;--surface:#37195a;--card:#37195a;--placeholder:#37195a;
  --accent-fill:#7af0c2;--card-ink:#7af0c2;--on-accent:#2a1245;--ink-on-light:#2a1245;--shadow:#000;
  --text:#f2eaff;--accent:#7af0c2;
  --line:rgba(122,240,194,.22);--tagline:#b5a4cc;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="inferno"]{
  color-scheme:dark;
  --bg:#111111;--surface:#1c1c1c;--card:#1c1c1c;--placeholder:#1c1c1c;
  --accent-fill:#ff3b3b;--card-ink:#ff5a5a;--on-accent:#111111;--ink-on-light:#111111;--shadow:#000;
  --text:#f5f5f5;--accent:#ff5a5a;
  --line:rgba(255,59,59,.24);--tagline:#a3a3a3;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="gameboy"]{
  --bg:#c4cfa1;--surface:#d6dfb5;--card:#d6dfb5;--placeholder:#c4cfa1;
  --accent-fill:#2f4d09;--card-ink:#2f4d09;--ink-on-light:#2f4d09;--shadow:#2f4d09;
  --text:#1f3a1f;--accent:#1f3a1f;
  --line:rgba(47,77,9,.24);--tagline:#3f4f30;
}
:root[data-theme="barbie"]{
  --bg:#ffe3f1;--surface:#fff0f7;--card:#fff0f7;--placeholder:#ffe3f1;
  --accent-fill:#b80f6b;--card-ink:#b80f6b;--ink-on-light:#b80f6b;--shadow:#b80f6b;
  --text:#4a0930;--accent:#4a0930;
  --line:rgba(184,15,107,.2);--tagline:#7a5468;
}
:root[data-theme="terminal"]{
  color-scheme:dark;
  --bg:#050805;--surface:#0c140c;--card:#0c140c;--placeholder:#0c140c;
  --accent-fill:#39ff6a;--card-ink:#39ff6a;--on-accent:#050805;--ink-on-light:#050805;--shadow:#000;
  --text:#c9ffd5;--accent:#39ff6a;
  --line:rgba(57,255,106,.22);--tagline:#7fae8a;
  --grain-opacity:.08;--grain-blend:screen;
}
:root[data-theme="slate"]{
  --bg:#eef2f6;--surface:#f8fafc;--card:#f8fafc;--placeholder:#eef2f6;
  --accent-fill:#334155;--card-ink:#334155;--ink-on-light:#334155;--shadow:#334155;
  --text:#0f172a;--accent:#0f172a;
  --line:rgba(51,65,85,.18);--tagline:#5b687a;
}
:root[data-theme="mustard"]{
  color-scheme:dark;
  --bg:#1f2124;--surface:#2a2d31;--card:#2a2d31;--placeholder:#2a2d31;
  --accent-fill:#f2c230;--card-ink:#f2c230;--on-accent:#1f2124;--ink-on-light:#1f2124;--shadow:#000;
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
  animation:dotsDrift 7s linear infinite;will-change:transform;
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
  font-size:clamp(30px,4.6vw,48px);line-height:1.1;
  letter-spacing:.01em;margin:0 0 clamp(36px,5vw,64px);
}
.section__title--tight{margin-bottom:12px;}

/* ---------- HERO ---------- */
.hero{
  max-width:var(--maxw);margin:0 auto;
  padding:clamp(40px,7vw,96px) var(--gutter) clamp(24px,4vw,48px);
  display:flex;align-items:center;gap:clamp(28px,5vw,72px);
  flex-wrap:wrap;
}
.hero__photo{
  flex:0 0 auto;width:clamp(160px,22vw,260px);aspect-ratio:1;border-radius:28px;
  overflow:hidden;
  border:1px solid var(--line);
  box-shadow:0 30px 70px -30px color-mix(in srgb,var(--shadow) 30%,transparent);
}
.hero__photo img{width:100%;height:100%;object-fit:cover;display:block;}
.hero__intro{flex:1 1 380px;min-width:0;}
.hero__name{
  font-family:var(--font-display);
  margin:0;font-size:clamp(40px,6.4vw,74px);
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
.hero__resume-date{margin:10px 0 0;font-size:12.5px;color:var(--muted);}

/* ---------- PROJECTS ---------- */
.projects{display:flex;flex-direction:column;gap:clamp(80px,11vw,136px);}
.project{
  display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);
  align-items:center;gap:clamp(28px,5vw,64px);
  opacity:0;transform:translateY(28px);
  transition:opacity .8s var(--ease),transform .8s var(--ease);
}
.project.is-visible{opacity:1;transform:none;}
.project__name{font-family:var(--font-display);margin:0;font-size:clamp(30px,3.8vw,42px);line-height:1.08;letter-spacing:.01em;}
.project__summary{margin:10px 0 0;font-size:clamp(16px,1.5vw,17.5px);line-height:1.5;max-width:50ch;}
.project__credit{margin:6px 0 0;font-size:13px;color:var(--muted);}
.site ul.bullets{display:flex;flex-direction:column;gap:12px;margin:20px 0 0;max-width:64ch;}
.bullets li{
  position:relative;padding-left:20px;
  color:var(--muted);font-size:15.5px;line-height:1.66;
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

.project__demo{display:block;}
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
.window__body{
  position:relative;background:var(--placeholder);
  aspect-ratio:16/10;overflow:hidden;
}
.window__screenshot{
  position:absolute;left:0;top:0;width:100%;height:auto;display:block;
  transform:translateY(0);
  transition:transform 1.2s cubic-bezier(.65,0,.35,1);
}
.window__body.can-pan::after{
  content:"";position:absolute;left:0;right:0;bottom:0;height:34px;pointer-events:none;
  background:linear-gradient(to top,color-mix(in srgb,var(--shadow) 16%,transparent),transparent);
  opacity:.8;transition:opacity .4s var(--ease);
}
@media (hover:hover){
  .project:hover .can-pan .window__screenshot,
  .project:focus-within .can-pan .window__screenshot{
    transform:translateY(calc(-1 * var(--pan)));
    transition:transform var(--pan-duration) cubic-bezier(.37,0,.63,1);
  }
  .project:hover .can-pan::after{opacity:0;}
}
@media (hover:none){
  .can-pan.is-onscreen .window__screenshot{
    animation:panLoop calc(var(--pan-duration) * 2 + 3s) cubic-bezier(.45,.05,.55,.95) infinite;
  }
}
@keyframes panLoop{
  0%,15%{transform:translateY(0);}
  50%,65%{transform:translateY(calc(-1 * var(--pan)));}
  100%{transform:translateY(0);}
}

/* ---------- TECH ---------- */
.tech__hint{margin:0 0 clamp(32px,4vw,52px);font-size:15px;color:var(--muted);}
.tech__rows{display:flex;flex-direction:column;gap:clamp(24px,3.4vw,38px);}
.tech__row{
  display:grid;grid-template-columns:140px 1fr;gap:clamp(16px,3vw,36px);
  align-items:center;padding-bottom:clamp(24px,3.4vw,38px);
  border-bottom:1px solid var(--line);
}
.tech__row:last-child{border-bottom:none;padding-bottom:0;}
.tech__label{font-size:14px;color:var(--muted);letter-spacing:.04em;}
.tech__badges{display:flex;flex-wrap:wrap;gap:clamp(14px,2.6vw,32px);}

.badge{
  display:flex;flex-direction:column;align-items:center;gap:10px;width:76px;
  opacity:0;transform:translateY(22px);
  transition:opacity .6s var(--ease),transform .6s var(--ease);
}
.tech.is-visible .badge{opacity:1;transform:none;}
.badge__disc{
  width:60px;height:60px;border-radius:50%;
  background:#fff;display:grid;place-items:center;
  box-shadow:0 10px 26px -12px rgba(47,43,34,.4);
  transition:transform .3s var(--ease),box-shadow .3s var(--ease);
  border:none;padding:0;font:inherit;cursor:pointer;
}
.badge:hover .badge__disc{transform:translateY(-5px) scale(1.05);box-shadow:0 16px 30px -12px rgba(47,43,34,.45);}
.badge__disc img{width:34px;height:34px;}
.badge__fallback{font-family:var(--font-display);font-size:24px;color:var(--ink-on-light);}
.badge__name{font-size:12.5px;color:var(--muted);text-align:center;line-height:1.25;}

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
.dock__status{margin:4px 2px;font-size:13px;line-height:1.5;}
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
.dock__iframe{position:absolute;width:1px;height:1px;border:0;opacity:0;pointer-events:none;}

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
  .project__demo{order:-1;}
}
@media (max-width:760px){
  .hero{flex-direction:column;align-items:flex-start;}
  .hero__intro{flex:none;width:100%;}
  .tech__row{grid-template-columns:1fr;gap:14px;}
  .tech__badges{gap:14px 10px;}
  .badge{width:72px;}
  .badge__disc{width:54px;height:54px;}
  .badge__disc img{width:30px;height:30px;}
  .footer{flex-direction:column;}
}
@media (max-width:420px){
  .nav__links{gap:14px;}
  .nav__links a{font-size:14px;}
}

/* ---------- REDUCED MOTION ---------- */
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto;}
  .project,.badge{opacity:1 !important;transform:none !important;transition:none !important;}
  .window,.social,.badge__disc,.nav__links a::after,.site .project__link,.theme-toggle,.btn-primary,.window__screenshot{transition:none !important;}
  .window__screenshot{transform:none !important;animation:none !important;}
  .window__body.can-pan::after{display:none;}
  .skill-bubble,.theme-menu,.bg-dots,.dock__eq i,.footer__pulse::after,.typed__caret::after{animation:none !important;}
  .typed__caret{display:none;}
  .dock__panel,.dock__tab{transition:none !important;}
}
`;
