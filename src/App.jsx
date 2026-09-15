import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import mordiShot from "./assets/screenshots/mordi.png";
import lonelyChessShot from "./assets/screenshots/lonely-chess.png";
import pdfyierShot from "./assets/screenshots/pdfyier.png";
import profilePhoto from "./assets/profile.jpg";

/* =========================================================================
   Perfect Phanitchaleun — Personal Portfolio
   Single-file React app. Plain CSS (injected). No external animation libs.
   Scroll reveals via IntersectionObserver. Respects prefers-reduced-motion.
   ========================================================================= */

const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

const PROJECTS = [
  {
    name: "Mordi",
    bullets: [
      "Built a Spring Boot REST API with JWT auth for goal tracking, daily logging, and automatic weekly mood and completion reports. Every schema change ships through a reviewed Flyway migration instead of framework auto generation.",
      "Audited the API and found a JWT signing secret and database password committed in plaintext since the first commit. Rotated both, closed an account enumeration hole in login, and added Redis backed rate limiting.",
      "Set up a GitHub Actions CI pipeline (JUnit, Mockito, ESLint, Vitest, production build) that has caught 9 defects before deploy, including one that would have crashed the API on startup.",
    ],
    stack: ["Java", "Spring Boot", "Spring Security", "React", "PostgreSQL", "Redis", "Docker", "nginx", "GitHub Actions"],
    link: { label: "mordi.latesailor.dev", href: "https://mordi.latesailor.dev" },
    demo: { domain: "mordi.latesailor.dev", tint: "#30d158", image: mordiShot },
  },
  {
    name: "Lonely Chess",
    bullets: [
      "Designed an esoteric language where legal PGN chess notation executes as source code, then built the Python interpreter for it: a state machine parsing moves into integer and string declarations, loops, conditionals, modulo, and four function arithmetic.",
      "Implemented FizzBuzz (1 to 100) as a 2,669 move chess game, exercising nested conditionals, string concatenation, and implicit else branching.",
    ],
    stack: ["Python", "PGN Notation", "Interpreter Design"],
    link: {
      label: "lonely-chess-cs-420.vercel.app",
      href: "https://lonely-chess-cs-420.vercel.app/",
    },
    demo: { domain: "lonely-chess-cs-420.vercel.app", tint: "#bf5af2", image: lonelyChessShot },
  },
  {
    name: "pdfyier",
    bullets: [
      "Drop or select a batch of images (JPG, PNG, WEBP, BMP, TIFF, GIF), drag to reorder pages, then name and download one merged PDF.",
      "Runs through nginx and a FastAPI backend that shells out to ImageMagick and streams the finished PDF back in the same request. Uploads never touch persistent disk, temp storage is RAM backed on both host and container.",
    ],
    stack: ["Python", "FastAPI", "ImageMagick", "nginx", "Docker", "Oracle Cloud"],
    link: { label: "pdfyier.latesailor.dev", href: "https://pdfyier.latesailor.dev" },
    demo: { domain: "pdfyier.latesailor.dev", tint: "#ff453a", image: pdfyierShot },
  },
];

const REPOS = [
  {
    name: "Mordi",
    href: "https://mordi.latesailor.dev",
    skills: ["Java", "Spring Boot", "Spring Security", "React", "PostgreSQL", "Redis", "Docker", "nginx", "GitHub Actions"],
  },
  {
    name: "pdfyier",
    href: "https://pdfyier.latesailor.dev",
    skills: ["Python", "FastAPI", "ImageMagick", "nginx", "Docker", "Oracle Cloud"],
  },
  {
    name: "Lonely Chess",
    href: "https://lonely-chess-cs-420.vercel.app/",
    skills: ["Python", "TypeScript", "PGN Notation", "Interpreter Design"],
  },
  {
    name: "SHMA",
    href: "https://github.com/SailmanSeeulater/Gibbi-Backend",
    skills: ["Kotlin", "Spring Boot", "Spring Security", "PostgreSQL", "Docker"],
  },
  {
    name: "Odins Kin",
    href: "https://github.com/SailmanSeeulater/odins_kin",
    skills: ["Python", "Flask", "SQLite", "HTML5"],
  },
  {
    name: "Fight Up The Hill",
    href: "https://github.com/SailmanSeeulater/CS-210-Final-Project",
    skills: ["C++"],
  },
];

const TECH = [
  {
    label: "Frontend",
    items: [
      ["React", "react"],
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
      ["PostgreSQL", "postgresql"],
      ["Redis", "redis"],
      ["MySQL", "mysql"],
      ["SQLite", "sqlite"],
    ],
  },
  {
    label: "Languages",
    items: [
      ["Java", "java"],
      ["Kotlin", "kotlin"],
      ["Python", "python"],
      ["C++", "cplusplus"],
      ["SQL", "sql"],
      ["Bash", "bash"],
    ],
  },
  {
    label: "Testing",
    items: [
      ["JUnit", "junit"],
      ["Mockito", "mockito"],
      ["Vitest", "vitest"],
      ["React Testing Library", "testinglibrary"],
      ["ESLint", "eslint"],
    ],
  },
  {
    label: "DevOps & Cloud",
    items: [
      ["Docker", "docker"],
      ["Kubernetes", "kubernetes"],
      ["nginx", "nginx"],
      ["ImageMagick", "imagemagick"],
      ["Git", "git"],
      ["GitHub", "github"],
      ["GitHub Actions", "githubactions"],
      ["Linux", "linux"],
      ["Oracle Cloud", "oracle"],
      ["Postman", "postman"],
    ],
  },
];

/* ---- IntersectionObserver hook ---- */
function useInView(options = { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(entry.target);
        }
      },
      options
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

/* ---- Circular tech badge with graceful fallback ---- */
function TechBadge({ name, slug, delay, onSelect }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="badge" style={{ transitionDelay: `${delay}ms` }}>
      <button
        type="button"
        className="badge__disc"
        title={name}
        aria-haspopup="dialog"
        aria-label={`${name}: see which project uses this`}
        onClick={(e) => onSelect(name, e.currentTarget.getBoundingClientRect())}
      >
        {failed ? (
          <span className="badge__fallback">{name.charAt(0)}</span>
        ) : (
          <img
            src={`${DEVICON}/${slug}/${slug}-original.svg`}
            alt={name}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
      </button>
      <span className="badge__name">{name}</span>
    </div>
  );
}

/* ---- A single project row ---- */
function ProjectRow({ project, index }) {
  const [ref, inView] = useInView();
  return (
    <article
      ref={ref}
      className={`project ${inView ? "is-visible" : ""}`}
      aria-labelledby={`proj-${index}`}
    >
      <div className="project__text">
        <span className="project__index">{String(index + 1).padStart(2, "0")}</span>
        <h3 id={`proj-${index}`} className="project__name">
          {project.name}
        </h3>
        <ul className="bullets project__bullets">
          {project.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        <ul className="project__stack" aria-label="Tech stack">
          {project.stack.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <a className="project__link" href={project.link.href} target="_blank" rel="noreferrer">
          {project.link.label}
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              d="M7 17 17 7M9 7h8v8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      <a
        className="project__demo"
        href={project.link.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open the live site for ${project.name}`}
      >
        <div className="window">
          <div className="window__bar">
            <span className="dot dot--red" />
            <span className="dot dot--amber" />
            <span className="dot dot--green" />
            <div className="window__url">{project.demo.domain}</div>
          </div>
          <div className="window__body">
            <span className="window__glow" style={{ background: project.demo.tint }} />
            {project.demo.image ? (
              <img className="window__screenshot" src={project.demo.image} alt="" loading="lazy" />
            ) : (
              <div className="window__placeholder">
                <span className="window__label">Live demo</span>
              </div>
            )}
          </div>
        </div>
      </a>
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

/* ---- Small text-message-style bubble showing which repo(s) use a clicked skill ---- */
function SkillBubble({ skill, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!skill) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest(".badge__disc")) {
        onClose();
      }
    };
    const onDismiss = () => onClose();

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    window.addEventListener("scroll", onDismiss, { passive: true });
    window.addEventListener("resize", onDismiss);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
      window.removeEventListener("scroll", onDismiss);
      window.removeEventListener("resize", onDismiss);
    };
  }, [skill, onClose]);

  if (!skill) return null;

  const matches = REPOS.filter((p) => p.skills.includes(skill.name));

  return (
    <div
      ref={panelRef}
      className="skill-bubble"
      role="dialog"
      aria-label={`Repos using ${skill.name}`}
      style={{ left: skill.x, top: skill.y }}
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
        <p className="skill-bubble__empty">Not used in a repo here yet.</p>
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
  { id: "coral", name: "Coral & Teal", swatch: ["#ffe1d6", "#0f766e"] },
  { id: "synthwave", name: "Purple & Hot Pink", swatch: ["#1a0b2e", "#ff4fd8"] },
];

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
          setReady(true);
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
    };
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
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
      <div className="dock__panel" id="dock-panel" role="region" aria-label="Music player" inert={!open}>
        {failed ? (
          <p className="dock__status">
            Couldn't reach SoundCloud. <a href={SC_PROFILE} target="_blank" rel="noreferrer">Listen there instead</a>.
          </p>
        ) : !ready ? (
          <p className="dock__status">Loading tracks…</p>
        ) : (
          <>
            <div className="dock__now">
              {artwork(sound) && <img className="dock__art" src={artwork(sound)} alt="" />}
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
              <ol className="dock__list">
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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) apply();
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
              <button
                type="button"
                aria-pressed={i === current}
                onClick={() => select(i)}
              >
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

export default function App() {
  const [techRef, techInView] = useInView({ threshold: 0.2 });
  const [activeSkill, setActiveSkill] = useState(null);

  const handleSelectSkill = (name, rect) => {
    setActiveSkill((prev) => {
      if (prev?.name === name) return null;
      const x = Math.min(Math.max(rect.left + rect.width / 2, 100), window.innerWidth - 100);
      return { name, x, y: rect.top };
    });
  };

  return (
    <div className="site">
      <style>{CSS}</style>
      <div className="bg-fx" aria-hidden="true">
        <div className="bg-dots" />
      </div>
      <div className="bg-grain" aria-hidden="true" />

      {/* ---------- NAV ---------- */}
      <header className="nav">
        <a className="nav__brand" href="#top">PP</a>
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
        <section className="hero" aria-label="Introduction">
          <div className="hero__photo">
            <img src={profilePhoto} alt="Perfect Phanitchaleun" />
          </div>
          <div className="hero__intro">
            <p className="hero__eyebrow">Hello, my name is</p>
            <h1 className="hero__name">Perfect Phanitchaleun</h1>
            <p className="hero__title">Software Engineer</p>
            <p className="hero__bio">A full-stack developer interested in DevOps.</p>
            <a className="hero__resume" href="/resume.pdf" download="Perfect_Phanitchaleun_Resume.pdf">
              Download Résumé
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <p className="hero__resume-date">Last updated September 7, 2026</p>
          </div>
        </section>

        {/* ---------- PROJECTS ---------- */}
        <section id="projects" className="section" aria-label="Personal projects">
          <h2 className="section__title">Personal Projects</h2>
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
          aria-label="Tech stack and skills"
        >
          <h2 className="section__title">Tech Stack &amp; Skills</h2>
          <div className="tech__rows">
            {TECH.map((row) => (
              <div className="tech__row" key={row.label}>
                <span className="tech__label">{row.label}</span>
                <div className="tech__badges">
                  {row.items.map(([name, slug], i) => (
                    <TechBadge
                      key={name}
                      name={name}
                      slug={slug}
                      delay={i * 70}
                      onSelect={handleSelectSkill}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- CONTACT ---------- */}
        <section id="contact" className="section" aria-label="Contact">
          <div className="contact">
            <h2 className="contact__heading">Let's build something.</h2>
            <a className="contact__email" href="mailto:perfectphanitchaleun@gmail.com">
              perfectphanitchaleun@gmail.com
            </a>

            <div className="contact__socials">
              <SocialButton kind="github" href="https://github.com/SailmanSeeulater" label="GitHub" />
              <SocialButton kind="linkedin" href="https://www.linkedin.com/in/perfect-phanitchaleun" label="LinkedIn" />
              <SocialButton kind="globe" href="https://latesailor.dev" label="Personal website" />
              <SocialButton kind="soundcloud" href="https://soundcloud.com/latersellyoulater" label="SoundCloud" />
            </div>

            <p className="contact__tagline">Let's grab some coffee</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Perfect Phanitchaleun</span>
        <span>San Diego based and originally from Laos</span>
      </footer>

      <SkillBubble skill={activeSkill} onClose={() => setActiveSkill(null)} />
      <SoundDock />
    </div>
  );
}

/* =========================================================================
   Styles (plain CSS, injected). Apple-inspired: near-black, white, spacious.
   ========================================================================= */
const CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=comico@400&display=swap');
@import url('https://api.fontshare.com/v2/css?f[]=rx-100@400&display=swap');

:root{
  --bg:#f3e6d5;
  --surface:#fff9f2;
  --accent-fill:#800020;
  --text:#4a0014;
  --muted:#4a0014;
  --dim:#4a0014;
  --accent:#4a0014;
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
  --maxw:1120px;
}
:root[data-theme="ocean"]{
  --bg:#fdf1b8;--surface:#fffbe3;--card:#fffbe3;--placeholder:#fdf1b8;
  --accent-fill:#1d4ed8;--card-ink:#1d4ed8;--ink-on-light:#1d4ed8;--shadow:#1d4ed8;
  --text:#0a1f5c;--muted:#0a1f5c;--dim:#0a1f5c;--accent:#0a1f5c;
  --line:rgba(29,78,216,.2);--tagline:#5b6275;
}
:root[data-theme="forest"]{
  --bg:#ffffff;--surface:#eef6f0;--card:#eef6f0;--placeholder:#eef6f0;
  --accent-fill:#1b7a43;--card-ink:#1b7a43;--ink-on-light:#1b7a43;--shadow:#1b7a43;
  --text:#0c3b22;--muted:#0c3b22;--dim:#0c3b22;--accent:#0c3b22;
  --line:rgba(27,122,67,.2);--tagline:#5f6b63;
}
:root[data-theme="midnight"]{
  color-scheme:dark;
  --bg:#0f0f0f;--surface:#1a1a1a;--card:#1a1a1a;--placeholder:#1a1a1a;
  --accent-fill:#c6f432;--card-ink:#c6f432;--on-accent:#0f0f0f;--ink-on-light:#0f0f0f;--shadow:#000;
  --text:#f2f2ec;--muted:#f2f2ec;--dim:#f2f2ec;--accent:#c6f432;
  --line:rgba(198,244,50,.2);--tagline:#9a9a94;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="bubblegum"]{
  --bg:#ffd6e8;--surface:#ffe9f2;--card:#ffe9f2;--placeholder:#ffd6e8;
  --accent-fill:#141414;--card-ink:#141414;--on-accent:#ffd6e8;--ink-on-light:#141414;--shadow:#d6336c;
  --text:#1a0a12;--muted:#1a0a12;--dim:#1a0a12;--accent:#1a0a12;
  --line:rgba(20,20,20,.16);--tagline:#6b4a58;
}
:root[data-theme="lavender"]{
  --bg:#ece6ff;--surface:#f7f4ff;--card:#f7f4ff;--placeholder:#ece6ff;
  --accent-fill:#5b2bd1;--card-ink:#5b2bd1;--ink-on-light:#5b2bd1;--shadow:#5b2bd1;
  --text:#26104f;--muted:#26104f;--dim:#26104f;--accent:#26104f;
  --line:rgba(91,43,209,.2);--tagline:#6a6380;
}
:root[data-theme="harbor"]{
  color-scheme:dark;
  --bg:#0d1b2a;--surface:#15263a;--card:#15263a;--placeholder:#15263a;
  --accent-fill:#ff8a3d;--card-ink:#ff8a3d;--on-accent:#0d1b2a;--ink-on-light:#0d1b2a;--shadow:#000;
  --text:#f3efe6;--muted:#f3efe6;--dim:#f3efe6;--accent:#ff8a3d;
  --line:rgba(255,138,61,.22);--tagline:#9aa6b4;
  --grain-opacity:.07;--grain-blend:screen;
}
:root[data-theme="mint"]{
  --bg:#d9f2e4;--surface:#eefaf3;--card:#eefaf3;--placeholder:#d9f2e4;
  --accent-fill:#5a3825;--card-ink:#5a3825;--ink-on-light:#5a3825;--shadow:#5a3825;
  --text:#3b2416;--muted:#3b2416;--dim:#3b2416;--accent:#3b2416;
  --line:rgba(90,56,37,.18);--tagline:#6b6258;
}
:root[data-theme="tangerine"]{
  --bg:#fff1e0;--surface:#fff8ef;--card:#fff8ef;--placeholder:#fff1e0;
  --accent-fill:#c2410c;--card-ink:#c2410c;--ink-on-light:#c2410c;--shadow:#c2410c;
  --text:#431407;--muted:#431407;--dim:#431407;--accent:#431407;
  --line:rgba(194,65,12,.2);--tagline:#7a6150;
}
:root[data-theme="coral"]{
  --bg:#ffe1d6;--surface:#fff1eb;--card:#fff1eb;--placeholder:#ffe1d6;
  --accent-fill:#0f766e;--card-ink:#0f766e;--ink-on-light:#0f766e;--shadow:#0f766e;
  --text:#0b3b37;--muted:#0b3b37;--dim:#0b3b37;--accent:#0b3b37;
  --line:rgba(15,118,110,.2);--tagline:#6d5d57;
}
:root[data-theme="synthwave"]{
  color-scheme:dark;
  --bg:#1a0b2e;--surface:#26123f;--card:#26123f;--placeholder:#26123f;
  --accent-fill:#ff4fd8;--card-ink:#ff4fd8;--on-accent:#1a0b2e;--ink-on-light:#1a0b2e;--shadow:#000;
  --text:#f5e9ff;--muted:#f5e9ff;--dim:#f5e9ff;--accent:#ff4fd8;
  --line:rgba(255,79,216,.22);--tagline:#a792c0;
  --grain-opacity:.07;--grain-blend:screen;
}

*{box-sizing:border-box;}
html{scroll-behavior:smooth;background:var(--bg);}

.site{
  margin:0;
  color:var(--text);
  font-family:var(--font-body);
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  line-height:1.5;
}
.site a{color:inherit;text-decoration:none;}
.site ul{list-style:none;margin:0;padding:0;}
.site :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px;}

/* ---------- NAV ---------- */
.nav{
  position:sticky;top:0;z-index:50;
  height:var(--nav-h);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 clamp(20px,5vw,48px);
  background:color-mix(in srgb,var(--bg) 75%,transparent);
  backdrop-filter:saturate(160%) blur(18px);
  -webkit-backdrop-filter:saturate(160%) blur(18px);
  border-bottom:1px solid var(--line);
}
.nav__brand{font-family:var(--font-display);font-weight:400;letter-spacing:.02em;font-size:20px;}
.nav__right{display:flex;align-items:center;gap:clamp(18px,4vw,40px);}
.nav__links{display:flex;gap:clamp(18px,4vw,40px);}
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
  animation:bubblePopDown .18s var(--ease);
}
@keyframes bubblePopDown{from{opacity:0;transform:translateY(-6px) scale(.97);}to{opacity:1;transform:none;}}
.theme-menu button{
  display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;
  border:none;border-radius:10px;background:transparent;color:var(--text);
  font:inherit;font-size:13.5px;text-align:left;cursor:pointer;
}
.theme-menu button:hover{background:var(--line);}
.theme-menu button[aria-pressed="true"]{background:var(--line);}
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
.nav__links a{
  font-size:15px;color:var(--muted);position:relative;padding:4px 0;
  transition:color .25s var(--ease);
}
.nav__links a::after{
  content:"";position:absolute;left:0;bottom:0;
  width:100%;height:1px;background:var(--accent);
  transform:scaleX(0);transform-origin:right;
  transition:transform .3s var(--ease);
}
.nav__links a:hover{color:var(--text);}
.nav__links a:hover::after{transform:scaleX(1);transform-origin:left;}

/* shared section frame */
.section{
  max-width:var(--maxw);
  margin:0 auto;
  padding:clamp(80px,12vw,150px) clamp(20px,5vw,48px);
  scroll-margin-top:var(--nav-h);
}
.section__title{
  font-family:var(--font-display);
  font-size:clamp(28px,4.5vw,46px);
  font-weight:400;letter-spacing:.01em;margin:0 0 clamp(40px,6vw,72px);
}

/* ---------- HERO ---------- */
.hero{
  max-width:var(--maxw);margin:0 auto;
  padding:clamp(70px,11vw,130px) clamp(20px,5vw,48px) clamp(40px,7vw,90px);
  display:flex;align-items:center;gap:clamp(32px,6vw,80px);
  flex-wrap:wrap;scroll-margin-top:var(--nav-h);
}
.hero__photo{
  flex:0 0 auto;width:280px;height:280px;border-radius:32px;
  overflow:hidden;
  border:1px solid var(--line);
  box-shadow:0 30px 70px -30px color-mix(in srgb,var(--shadow) 30%,transparent);
}
.hero__photo img{
  width:100%;height:100%;object-fit:cover;display:block;
}
.hero__intro{flex:1 1 320px;min-width:280px;}
.hero__eyebrow{margin:0 0 10px;color:var(--muted);font-size:17px;font-weight:500;}
.hero__name{
  font-family:var(--font-display);
  margin:0;font-size:clamp(36px,6.5vw,68px);font-weight:400;
  letter-spacing:.01em;line-height:1.1;
}
.hero__title{
  margin:14px 0 0;font-size:clamp(20px,3vw,28px);font-weight:600;
  color:var(--text);
}
.hero__bio{margin:18px 0 0;color:var(--muted);font-size:clamp(16px,2vw,19px);max-width:46ch;}
.hero .hero__resume{
  display:inline-flex;align-items:center;gap:9px;margin-top:30px;
  padding:13px 22px;border-radius:999px;
  background:var(--accent-fill);color:var(--on-accent);
  font-size:15px;font-weight:600;
  transition:transform .25s var(--ease),opacity .25s var(--ease),box-shadow .25s var(--ease);
  box-shadow:0 12px 26px -12px color-mix(in srgb,var(--shadow) 45%,transparent);
}
.hero .hero__resume:hover{transform:translateY(-2px);opacity:.9;}
.hero__resume-date{margin:12px 0 0;font-size:13px;color:var(--muted);}

/* ---------- PROJECTS ---------- */
.projects{display:flex;flex-direction:column;gap:clamp(72px,11vw,140px);}
.project{
  display:flex;align-items:center;gap:clamp(28px,5vw,64px);flex-wrap:wrap;
  opacity:0;transform:translateX(64px);
  transition:opacity .85s var(--ease),transform .85s var(--ease);
}
.project.is-visible{opacity:1;transform:none;}
.project__text{flex:1 1 320px;min-width:280px;}
.project__index{
  display:inline-block;font-size:13px;font-weight:600;letter-spacing:.18em;
  color:var(--dim);margin-bottom:14px;
}
.project__name{font-family:var(--font-display);margin:0;font-size:clamp(26px,3.6vw,38px);font-weight:400;letter-spacing:.01em;}
.bullets{display:flex;flex-direction:column;gap:10px;margin:14px 0 0;max-width:52ch;}
.bullets li{
  position:relative;padding-left:20px;
  color:var(--muted);font-size:clamp(14px,1.6vw,16px);line-height:1.55;
}
.bullets li::before{
  content:"";position:absolute;left:0;top:9px;
  width:6px;height:6px;border-radius:50%;background:var(--accent);
}
.project__bullets{max-width:46ch;}
.project__text .project__stack{display:flex;flex-wrap:wrap;gap:8px;margin-top:36px;}
.project__stack li{
  font-size:13px;color:var(--text);padding:6px 13px;border-radius:999px;
  background:var(--surface);border:1px solid var(--line);
}
.project__link{
  display:inline-flex;align-items:center;gap:7px;margin-top:26px;
  font-size:15px;font-weight:500;color:var(--accent);
  transition:gap .25s var(--ease),opacity .25s var(--ease);
}
.project__link:hover{gap:11px;opacity:.85;}

.project__demo{display:block;flex:1 1 460px;min-width:300px;}
.window{
  border-radius:20px;overflow:hidden;background:var(--card);
  border:1px solid rgba(0,0,0,.06);
  box-shadow:0 40px 90px -45px color-mix(in srgb,var(--shadow) 28%,transparent);
  transition:transform .4s var(--ease),box-shadow .4s var(--ease);
}
.project:hover .window{transform:translateY(-6px);box-shadow:0 55px 110px -45px color-mix(in srgb,var(--shadow) 32%,transparent);}
.window__bar{
  display:flex;align-items:center;gap:8px;padding:13px 16px;
  background:#ececec;border-bottom:1px solid rgba(0,0,0,.06);
}
.dot{width:12px;height:12px;border-radius:50%;display:inline-block;}
.dot--red{background:#ff5f57;}
.dot--amber{background:#febc2e;}
.dot--green{background:#28c840;}
.window__url{
  margin-left:10px;flex:1;font-size:12px;color:#86868b;
  background:#fff;border-radius:7px;padding:5px 12px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.window__body{
  position:relative;background:var(--placeholder);
  aspect-ratio:16/10;display:grid;place-items:center;overflow:hidden;
}
.window__glow{
  position:absolute;width:60%;height:120%;top:-10%;left:-10%;
  filter:blur(70px);opacity:.18;border-radius:50%;
}
.window__screenshot{
  position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;object-position:top center;
}
.window__placeholder{position:relative;z-index:1;text-align:center;}
.window__label{
  font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;
  color:#b9b9be;
}

/* ---------- TECH ---------- */
.tech__rows{display:flex;flex-direction:column;gap:clamp(28px,4vw,44px);}
.tech__row{
  display:grid;grid-template-columns:130px 1fr;gap:clamp(16px,3vw,36px);
  align-items:center;padding-bottom:clamp(28px,4vw,44px);
  border-bottom:1px solid var(--line);
}
.tech__row:last-child{border-bottom:none;padding-bottom:0;}
.tech__label{font-size:14px;font-weight:600;color:var(--muted);letter-spacing:.04em;}
.tech__badges{display:flex;flex-wrap:wrap;gap:clamp(20px,3vw,38px);}

.badge{
  display:flex;flex-direction:column;align-items:center;gap:11px;width:76px;
  opacity:0;transform:translateY(26px);
  transition:opacity .6s var(--ease),transform .6s var(--ease);
}
.tech.is-visible .badge{opacity:1;transform:none;}
.badge__disc{
  width:62px;height:62px;border-radius:50%;
  background:#fff;display:grid;place-items:center;
  box-shadow:0 10px 26px -12px rgba(47,43,34,.4);
  transition:transform .3s var(--ease);
  border:none;padding:0;font:inherit;cursor:pointer;
}
.badge:hover .badge__disc{transform:translateY(-5px) scale(1.05);}
.badge__disc img{width:34px;height:34px;}
.badge__fallback{font-size:24px;font-weight:700;color:var(--ink-on-light);}
.badge__name{font-size:12.5px;color:var(--muted);text-align:center;line-height:1.25;}
.tech__hint{margin:0 0 32px;font-size:14px;color:var(--dim);opacity:.75;}

/* ---------- SKILL BUBBLE ---------- */
.skill-bubble{
  position:fixed;z-index:100;transform:translate(-50%,calc(-100% - 14px));
  min-width:150px;max-width:220px;
  background:color-mix(in srgb,var(--surface) 55%,transparent);color:var(--text);
  backdrop-filter:saturate(160%) blur(14px);-webkit-backdrop-filter:saturate(160%) blur(14px);
  border:1px solid var(--line);
  border-radius:16px;padding:12px 14px;
  box-shadow:0 18px 40px -14px rgba(47,43,34,.35);
  animation:bubblePop .18s var(--ease);
}
.skill-bubble::after{
  content:"";position:absolute;left:50%;bottom:-6px;
  width:12px;height:12px;background:color-mix(in srgb,var(--surface) 55%,transparent);
  border-right:1px solid var(--line);border-bottom:1px solid var(--line);
  transform:translateX(-50%) rotate(45deg);border-radius:2px;
}
@keyframes bubblePop{from{opacity:0;transform:translate(-50%,calc(-100% - 6px)) scale(.9);}to{opacity:1;transform:translate(-50%,calc(-100% - 14px)) scale(1);}}
.skill-bubble__title{font-family:var(--font-display);font-weight:400;display:block;font-size:16px;margin-bottom:6px;}
.skill-bubble__empty{margin:0;font-size:12.5px;font-weight:400;opacity:.85;line-height:1.4;}
.skill-bubble__list{display:flex;flex-direction:column;gap:4px;}
.skill-bubble__list a{
  display:block;font-size:13px;font-weight:400;color:var(--text);
  padding:4px 0;border-bottom:1px solid var(--line);
}
.skill-bubble__list li:last-child a{border-bottom:none;}
.skill-bubble__list a:hover{opacity:.7;}

/* ---------- SOUND DOCK ---------- */
.dock{
  position:fixed;left:50%;bottom:16px;z-index:90;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:10px;
  width:min(340px,calc(100vw - 32px));pointer-events:none;
}
.dock__tab,.dock__panel{pointer-events:auto;}
.dock__tab{
  display:inline-flex;align-items:center;gap:10px;max-width:100%;
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
  background:color-mix(in srgb,var(--surface) 80%,transparent);
  backdrop-filter:saturate(160%) blur(18px);-webkit-backdrop-filter:saturate(160%) blur(18px);
  border:1px solid var(--line);
  box-shadow:0 30px 60px -24px color-mix(in srgb,var(--shadow) 40%,transparent);
  opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);transform-origin:bottom center;
  transition:opacity .25s var(--ease),transform .3s var(--ease),visibility 0s linear .3s;
}
.dock.is-open .dock__panel{opacity:1;visibility:visible;transform:none;transition:opacity .25s var(--ease),transform .3s var(--ease);}
.dock__status{margin:4px 2px;font-size:13px;}
.dock__status a{text-decoration:underline;}
.dock__now{display:flex;align-items:center;gap:12px;}
.dock__art{width:56px;height:56px;border-radius:12px;object-fit:cover;flex:0 0 auto;}
.dock__meta{min-width:0;display:flex;flex-direction:column;gap:2px;}
.dock__title{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dock__artist{font-size:12.5px;opacity:.7;}
.dock__title:hover,.dock__artist:hover{text-decoration:underline;}

.dock__range{
  -webkit-appearance:none;appearance:none;width:100%;height:4px;margin:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(to right,var(--accent-fill) var(--p),var(--line) var(--p));
}
.dock__range::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--accent-fill);border:none;}
.dock__range::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--accent-fill);border:none;}
.dock__seek{margin:14px 0 6px;}
.dock__volume{display:flex;align-items:center;gap:8px;margin-top:6px;padding:0 4px;}
.dock__volume button{
  display:grid;place-items:center;width:32px;height:32px;flex:0 0 auto;border-radius:50%;
  border:none;background:transparent;color:var(--text);cursor:pointer;
}
.dock__volume button:hover{background:var(--line);}

.dock__controls{display:flex;justify-content:center;align-items:center;gap:14px;}
.dock__controls button{
  display:grid;place-items:center;width:38px;height:38px;border-radius:50%;
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
  display:block;width:100%;text-align:left;padding:7px 6px;border:none;border-radius:8px;
  background:transparent;color:var(--text);font:inherit;font-size:13px;cursor:pointer;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.dock__list button:hover{background:var(--line);}
.dock__list button.is-current{color:var(--accent);text-decoration:underline;text-underline-offset:3px;}
.dock__credit{display:block;margin-top:10px;font-size:11.5px;opacity:.6;text-align:right;}
.dock__credit:hover{opacity:1;}
.dock__iframe{position:absolute;width:1px;height:1px;border:0;opacity:0;pointer-events:none;}

/* ---------- CONTACT ---------- */
.contact{
  background:var(--card);color:var(--card-ink);
  border-radius:34px;padding:clamp(48px,8vw,96px) clamp(28px,6vw,72px);
  text-align:center;
  box-shadow:0 50px 120px -50px rgba(47,43,34,.35);
}
.contact__heading{font-family:var(--font-display);margin:0;font-size:clamp(30px,5vw,54px);font-weight:400;letter-spacing:.01em;}
.contact__email{
  display:inline-block;margin-top:26px;font-size:clamp(18px,2.6vw,26px);
  font-weight:600;color:var(--accent);transition:opacity .25s var(--ease);
  word-break:break-word;
}
.contact__email:hover{opacity:.7;}
.contact__socials{display:flex;justify-content:center;gap:16px;margin-top:36px;}
.social{
  width:52px;height:52px;border-radius:50%;display:grid;place-items:center;
  background:var(--bg);color:var(--card-ink);
  transition:transform .25s var(--ease),background .25s var(--ease),color .25s var(--ease);
}
.social:hover{transform:translateY(-4px);background:var(--card-ink);color:var(--on-accent);}
.contact__tagline{margin:42px 0 0;font-size:18px;color:var(--tagline);font-weight:500;}

/* ---------- FOOTER ---------- */
.footer{
  max-width:var(--maxw);margin:0 auto;
  padding:38px clamp(20px,5vw,48px) 96px;
  display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;
  border-top:1px solid var(--line);
  color:var(--dim);font-size:13px;
}

/* ---------- RESPONSIVE ---------- */
@media (max-width:760px){
  .hero{flex-direction:column;align-items:flex-start;text-align:left;}
  .hero__photo{width:160px;height:160px;border-radius:24px;}
  .project{flex-direction:column;align-items:stretch;}
  .project__demo{order:-1;}
  .tech__row{grid-template-columns:1fr;gap:14px;}
  .footer{flex-direction:column;}
}

/* ---------- REDUCED MOTION ---------- */
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto;}
  .project,.badge{opacity:1 !important;transform:none !important;transition:none !important;}
  .window,.social,.badge__disc,.nav__links a::after,.project__link,.theme-toggle{transition:none !important;}
  .skill-bubble,.theme-menu,.bg-dots,.dock__eq i{animation:none !important;}
  .dock__panel,.dock__tab{transition:none !important;}
}
`;
