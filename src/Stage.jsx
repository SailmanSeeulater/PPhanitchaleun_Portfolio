import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AI_USAGE, DEVICON, GITHUB, EXPERIENCE, PROJECTS, SKILL_SOURCES, TECH, rich } from "./data";
import { ArrowIcon, DownloadIcon, ProjectNotes, RESUME, VisitorCount, useAnalytics } from "./shared";
import { DOCK_CSS, SC_PROFILE, SoundDock } from "./sound";
import SAILOR_TXT from "./sailor.txt?raw";

// Every picture placed in src/assets/boat shows up in the "boat" folder, in file-name order.
const BOAT_PHOTOS = Object.entries(import.meta.glob("./assets/boat/*.{jpg,jpeg,png,webp,avif,gif}", { eager: true, import: "default" }))
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, src]) => ({ src, name: path.split("/").pop() }));

/* The Showcase site: one screen, no page scroll, and one laptop that never leaves.
   Its screen is a desktop: drifting lights and a dock of five sections. Choosing one opens it
   like an app, zooming out of its dock icon to fill the screen; closing it zooms back in. */

const EMAIL = "perfectphanitchaleun@gmail.com";

const THEMES = [
  { id: "white", name: "White & Black", swatch: ["#ffffff", "#0a0a0a"] },
  { id: "black", name: "Black & White", swatch: ["#0a0a0a", "#f4f4f2"] },
  { id: "slate", name: "Ice & Slate", swatch: ["#eef2f6", "#334155"] },
  { id: "mustard", name: "Charcoal & Mustard", swatch: ["#1f2124", "#f2c230"] },
];

const CONTACTS = [
  { name: "Email", href: `mailto:${EMAIL}`, text: EMAIL, event: "email-click" },
  { name: "GitHub", href: GITHUB, text: "github.com/SailmanSeeulater", event: "social-github" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/perfect-phanitchaleun", text: "linkedin.com/in/perfect-phanitchaleun", event: "social-linkedin" },
  { name: "SoundCloud", href: SC_PROFILE, text: "soundcloud.com/latersellyoulater", event: "social-soundcloud" },
];

const APPS = [
  { id: "projects", name: "Projects" },
  { id: "experience", name: "Experience" },
  { id: "stack", name: "Tech stack" },
  { id: "about", name: "About" },
  { id: "contact", name: "Contact" },
  { id: "music", name: "Music" },
  { id: "resume", name: "Résumé" },
];
// The top-right nav lists the five sections; Music and Résumé are reached from the dock, the record and the résumé link.
const NAV = APPS.slice(0, 5);
// Things lying on the desktop itself, opened the same way as the dock's apps.
const FILES = [
  { id: "boat", name: "boat", kind: "folder" },
  { id: "sailor", name: "sailor.txt", kind: "text" },
];
const WINDOWS = [...APPS, ...FILES];

// Listed under the jobs on the Experience timeline.
const EDUCATION = {
  role: "B.S. Computer Science",
  org: "San Diego State University",
  about: "Operating Systems, Algorithms, Machine Learning, Artificial Intelligence, Programming Languages",
  meta: ["Aug 2025 to Jun 2027", "San Diego, CA", "Expected"],
  bullets: [],
  stack: [],
};

const APP_ICONS = {
  projects: <path d="M4 5.5h6.5V12H4zM13.5 5.5H20V12h-6.5zM4 15h6.5v4.5H4zM13.5 15H20v4.5h-6.5z" />,
  experience: <path d="M4 8.5h16V19H4zM9 8.5V6h6v2.5M4 13h16" />,
  stack: <path d="m12 4 8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4" />,
  about: <path d="M12 12.5A3.75 3.75 0 1 0 12 5a3.75 3.75 0 0 0 0 7.5zM5 20c.6-3.4 3.3-5 7-5s6.4 1.6 7 5" />,
  contact: <path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" />,
  music: <path d="M9.500 18V6l10-2v12M9.500 18a2.750 2.750 0 1 1-5.500 0 2.750 2.750 0 0 1 5.500 0zM19.500 16a2.750 2.750 0 1 1-5.500 0 2.750 2.750 0 0 1 5.500 0z" />,
  resume: <path d="M7 3.500h7l4 4V20.500H7zM13.500 3.500V8H18M10 12.500h5M10 16h5" />,
};
const AppIcon = ({ id }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {APP_ICONS[id]}
  </svg>
);

// Every app and project has its own address (#/experience, #/projects/zwans), so links can point at one thing
// and the browser's back button works. The bare address is the desktop.
const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const PROJECT_SLUGS = PROJECTS.map((p) => slugOf(p.name));

function readRoute() {
  const [view, item] = window.location.hash.replace(/^#\/?/, "").split("/");
  if (!WINDOWS.some((a) => a.id === view)) return { view: "home", index: null };
  const index = view === "projects" ? PROJECT_SLUGS.indexOf(item) : -1;
  return { view, index: index === -1 ? null : index };
}

function useStageTheme() {
  const [id, setId] = useState(() => {
    try {
      const saved = localStorage.getItem("stage-theme");
      return THEMES.some((t) => t.id === saved) ? saved : THEMES[0].id;
    } catch {
      return THEMES[0].id;
    }
  });
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = id;
    root.dataset.stage = "";
    try {
      localStorage.setItem("stage-theme", id);
    } catch {
      /* storage unavailable */
    }
  }, [id]);
  return [id, setId];
}

/* ---- Projects: names on the left, the screenshot in the middle, the write-up on the right ---- */
function ProjectsApp({ index, setIndex, listRef }) {
  const project = PROJECTS[index];
  const count = PROJECTS.length;
  // A deployed project's screenshot is a link to the live app; the rest are plain pictures.
  const Shot = project.live ? "a" : "div";
  const shotLink = project.live
    ? { href: project.live, target: "_blank", rel: "noreferrer", "aria-label": `Open ${project.name} live`, "data-umami-event": "project-live", "data-umami-event-project": project.name }
    : {};
  return (
    <div className="pj">
      <div className="pj__side">
        <ol className="pj__list" aria-label="Projects" ref={listRef}>
          {PROJECTS.map((p, i) => (
            <li key={p.name}>
              <button type="button" aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)} data-umami-event="project-preview" data-umami-event-project={p.name}>
                {p.name}
              </button>
            </li>
          ))}
        </ol>
        <div className="pj__ctl">
          <button type="button" onClick={() => setIndex((index - 1 + count) % count)} aria-label="Previous project">
            <ArrowIcon />
          </button>
          <button type="button" onClick={() => setIndex((index + 1) % count)} aria-label="Next project">
            <ArrowIcon />
          </button>
        </div>
      </div>
      <Shot className="pj__shot" style={{ "--pan": `${Math.max(4, project.demo.height / 240).toFixed(1)}s` }} {...shotLink}>
        <img key={project.name} src={project.demo.image} alt={`${project.name} screenshot`} />
        <span className="pj__tag">
          {project.live ? "Open " : ""}
          {project.demo.domain}
          {project.live && <ArrowIcon />}
        </span>
      </Shot>
      <article className="pj__notes" key={project.name} aria-labelledby="pj-title">
        <p className="app__meta">{project.kind}</p>
        <h2 id="pj-title" className="app__title">
          {project.name}
        </h2>
        <ProjectNotes project={project} />
      </article>
    </div>
  );
}

/* ---- Experience: one line down the page, newest at the top, a dot for each stop ---- */
function ExperienceApp() {
  const stops = [...EXPERIENCE, EDUCATION];
  return (
    <ol className="tl">
      {stops.map((job) => {
        const [when, ...where] = job.meta;
        return (
          <li key={job.role} className={/present/i.test(when) ? "is-now" : undefined}>
            <p className="tl__when">
              {when}
              <span>{where.join(" · ")}</span>
            </p>
            <span className="tl__dot" aria-hidden="true" />
            <article>
              <h2 className="app__title">{job.role}</h2>
              <p className="app__lead">
                <strong>{job.org}</strong> · {job.about}
              </p>
              {job.bullets.length > 0 && (
                <ul className="bullets app__bullets">
                  {job.bullets.map((b, k) => (
                    <li key={k}>{rich(b)}</li>
                  ))}
                </ul>
              )}
              {job.stack.length > 0 && (
                <ul className="project__stack" aria-label={`${job.role} tech stack`}>
                  {job.stack.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}

function StackApp({ openProject }) {
  const [skill, setSkill] = useState(null);
  const sources = skill ? SKILL_SOURCES.filter((s) => s.skills.includes(skill)) : [];
  return (
    <div className="sk">
      <div className="sk__groups">
        {TECH.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h2 className="sk__group">{group.label}</h2>
            <ul className="sk__chips">
              {group.items.map(([name, slug]) => (
                <li key={name}>
                  <button type="button" aria-pressed={name === skill} onClick={() => setSkill(name === skill ? null : name)}>
                    {slug ? <img src={slug.startsWith("/") ? slug : `${DEVICON}/${slug}.svg`} alt="" width="16" height="16" /> : <i aria-hidden="true">{name.charAt(0)}</i>}
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="sk__used" aria-live="polite">
        {!skill && <p className="app__meta">Press a tool to see which projects use it</p>}
        {skill &&
          (sources.length ? (
            <>
              <p className="app__meta">{skill} was used in</p>
              <ul>
                {sources.map((s) => {
                  const i = PROJECTS.findIndex((p) => p.name === s.name);
                  return (
                    <li key={s.name}>
                      {i === -1 ? (
                        <a href={s.href} target="_blank" rel="noreferrer">
                          {s.name}
                          <ArrowIcon />
                        </a>
                      ) : (
                        <button type="button" onClick={() => openProject(i)}>
                          {s.name}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="app__meta">{skill}: learned outside the projects shown here</p>
          ))}
      </div>
    </div>
  );
}

const monthOf = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const TOKENS_BURNT = `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(AI_USAGE.tokens.total)} Claude Code tokens, ${monthOf(AI_USAGE.since)} to ${monthOf(AI_USAGE.asOf)}`;

const ABOUT_FACTS = [
  ["Based in", "San Diego, California"],
  ["From", "Laos"],
  ["Studying", "B.S. Computer Science, San Diego State University, expected June 2027"],
  ["Working", "Founding engineer, stealth startup"],
  ["Off the clock", "Making music, dreaming about pottery"],
  ["Burnt so far", TOKENS_BURNT],
];

function AboutApp() {
  return (
    <div className="ab">
      <div>
        <h2 className="app__title app__title--xl">I like to build things and dream about pottery.</h2>
        <p className="app__lead">A software engineer in San Diego, originally from Laos.</p>
      </div>
      <dl className="ab__facts">
        {ABOUT_FACTS.map(([label, value]) => (
          <div key={label}>
            <dt className="app__meta">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ContactApp() {
  return (
    <div className="ct">
      <h2 className="app__title app__title--xl">Let&rsquo;s chat and grab some coffee.</h2>
      <ul className="ct__links">
        {CONTACTS.map((c) => (
          <li key={c.name}>
            <span className="app__meta">{c.name}</span>
            <a href={c.href} target={c.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" data-umami-event={c.event}>
              {c.text}
              <ArrowIcon />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Small wrappers so a browser with storage turned off does not break the page.
const stored = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const store = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
};

/* ---- Desktop icons, drawn to sit beside the dock's flat tiles: a blue folder and a sheet of text ---- */
const FolderArt = () => (
  <svg className="fi__art" viewBox="0 0 64 54" aria-hidden="true">
    <defs>
      <linearGradient id="fi-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5fc0ff" />
        <stop offset="1" stopColor="#2f9bf0" />
      </linearGradient>
      <linearGradient id="fi-front" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6fcbff" />
        <stop offset="1" stopColor="#1f86ea" />
      </linearGradient>
    </defs>
    <path d="M3 9a6 6 0 0 1 6-6h14.500a6 6 0 0 1 4.200 1.700l3.100 3.100a4 4 0 0 0 2.800 1.200H55a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z" fill="url(#fi-back)" />
    <path d="M3 20a5 5 0 0 1 5-5h48a5 5 0 0 1 5 5v25a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z" fill="url(#fi-front)" />
    <path d="M3.500 20a4.500 4.500 0 0 1 4.500-4.500h48a4.500 4.500 0 0 1 4.500 4.500" fill="none" stroke="#fff" strokeOpacity=".45" />
  </svg>
);
const TextArt = () => (
  <svg className="fi__art" viewBox="0 0 64 54" aria-hidden="true">
    <path d="M17 2h22l10 10v36a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" fill="#fff" stroke="#c9c9c6" />
    <path d="M39 2v7a3 3 0 0 0 3 3h7z" fill="#e9e9e6" stroke="#c9c9c6" strokeLinejoin="round" />
    <path d="M19 20h20M19 26h24M19 32h17M19 38h22" stroke="#b9b9b5" strokeWidth="1.600" strokeLinecap="round" />
  </svg>
);

/* ---- boat: a folder of photos. It fills itself from src/assets/boat ---- */
function BoatFolder() {
  if (!BOAT_PHOTOS.length)
    return (
      <div className="fo fo--empty">
        <FolderArt />
        <p>Nothing in here yet.</p>
      </div>
    );
  return (
    <div className="fo">
      <p className="app__meta">
        {BOAT_PHOTOS.length} {BOAT_PHOTOS.length === 1 ? "photo" : "photos"}
      </p>
      <ul className="fo__grid">
        {BOAT_PHOTOS.map((photo) => (
          <li key={photo.name}>
            <img src={photo.src} alt="" loading="lazy" />
            <span>{photo.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---- sailor.txt: a text file anyone can type in. It starts as src/sailor.txt; a visitor's edits are kept
   in their own browser only (there is no server to share them through), and Reset brings the original back. ---- */
const SAILOR_ORIGINAL = SAILOR_TXT.replace(/\s+$/, "");

function SailorText() {
  const [text, setText] = useState(() => stored("stage-sailor") ?? SAILOR_ORIGINAL);
  const edited = text !== SAILOR_ORIGINAL;
  const write = (value) => {
    setText(value);
    if (value === SAILOR_ORIGINAL) {
      try {
        localStorage.removeItem("stage-sailor");
      } catch {
        /* storage unavailable */
      }
    } else store("stage-sailor", value);
  };
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="tx">
      <textarea className="tx__page" value={text} onChange={(e) => write(e.target.value)} aria-label="sailor.txt" spellCheck="false" placeholder="Type something." />
      <p className="tx__foot">
        <span className="app__meta">
          {words} {words === 1 ? "word" : "words"}
          {edited ? " · edited, saved in this browser" : ""}
        </span>
        {edited && (
          <button type="button" onClick={() => write(SAILOR_ORIGINAL)}>
            Reset
          </button>
        )}
      </p>
    </div>
  );
}

/* ---- Résumé: the PDF on the laptop screen, with the download beside it ---- */
function ResumeApp() {
  return (
    <div className="rs">
      <iframe src="/resume.pdf#view=FitH&toolbar=0" title="Résumé of Perfect Phanitchaleun" />
      <a className="rs__get" {...RESUME} data-umami-event-location="resume-app">
        Download
        <DownloadIcon />
      </a>
    </div>
  );
}

// A soft tick when an app opens or closes. It only sounds while the visitor has music playing,
// so the site stays silent unless they chose to hear it.
let tickCtx = null;
function tick(up) {
  if (!document.querySelector(".dock__eq.is-playing")) return;
  try {
    tickCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = tickCtx.currentTime;
    const osc = tickCtx.createOscillator();
    const gain = tickCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(up ? 520 : 760, t);
    osc.frequency.exponentialRampToValueAtTime(up ? 880 : 420, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(gain).connect(tickCtx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  } catch {
    /* no audio available */
  }
}


export default function Stage() {
  const [theme, setTheme] = useStageTheme();
  const [viewId, setViewId] = useState(() => readRoute().view);
  // Projects reopens on the project that was last on screen, even on a later visit.
  const [index, setIndex] = useState(() => readRoute().index ?? Math.max(0, PROJECT_SLUGS.indexOf(stored("stage-project"))));
  // A first-time visitor gets one quiet line above the dock until they open something.
  const [nudge, setNudge] = useState(() => stored("stage-nudge") !== "1");
  const [musicSlot, setMusicSlot] = useState(null);
  const opened = useRef(false);
  // The app on screen. It trails viewId by the length of the closing zoom, so the app can animate away.
  const [appId, setAppId] = useState(() => (readRoute().view === "home" ? null : readRoute().view));
  const [phase, setPhase] = useState("in");
  const [origin, setOrigin] = useState({ x: "50%", y: "100%" });
  const [hint, setHint] = useState(null);
  const lastView = useRef(null);
  const listRef = useRef(null);
  const stageRef = useRef(null);
  const screenRef = useRef(null);
  const touch = useRef(null);
  useAnalytics();

  const openProject = (i) => {
    setIndex(i);
    setViewId("projects");
  };

  // Open and close like an app: the window grows out of its dock icon, and shrinks back into it.
  useEffect(() => {
    const screen = screenRef.current;
    const from = (id) => {
      const tile = screen?.querySelector(`[data-app="${id}"] :is(.dk__tile,.fi__art)`);
      if (!tile) return;
      const s = screen.getBoundingClientRect();
      const t = tile.getBoundingClientRect();
      setOrigin({ x: `${(((t.left + t.width / 2 - s.left) / s.width) * 100).toFixed(2)}%`, y: `${(((t.top + t.height / 2 - s.top) / s.height) * 100).toFixed(2)}%` });
    };
    if (viewId === "home") {
      if (!appId) return;
      from(appId);
      setPhase("out");
      const t = setTimeout(() => setAppId(null), 300);
      return () => clearTimeout(t);
    }
    from(viewId);
    setPhase("in");
    setAppId(viewId);
    setNudge(false);
    store("stage-nudge", "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewId]);

  // The tick is skipped for whatever is on screen when the page loads.
  useEffect(() => {
    if (opened.current) tick(viewId !== "home");
    opened.current = true;
  }, [viewId]);

  useEffect(() => {
    store("stage-project", PROJECT_SLUGS[index]);
  }, [index]);

  // First-visit intro: a closed laptop opens in the middle of the page, its screen lights up, then it settles
  // into place while everything else arrives. Any click or key skips it. Add ?intro to replay.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const mac = stage?.querySelector(".stage__mac");
    const replay = new URLSearchParams(window.location.search).has("intro");
    let seen = false;
    try {
      seen = localStorage.getItem("stage-intro") === "1";
    } catch {
      /* storage unavailable */
    }
    if (!mac || readRoute().view !== "home" || (seen && !replay) || window.innerWidth <= 760 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let frame = 0;
    const end = () => {
      stage.removeAttribute("data-intro");
      stage.removeAttribute("data-intro-wait");
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("pointerdown", end);
      window.removeEventListener("keydown", end);
      try {
        localStorage.setItem("stage-intro", "1");
      } catch {
        /* storage unavailable */
      }
    };
    // Hold everything but the name for one frame so the laptop is measured where it finally sits.
    stage.setAttribute("data-intro-wait", "");
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const r = mac.getBoundingClientRect();
        if (r.width < 40 || r.height < 40 || r.bottom > window.innerHeight + 4) return end();
        const scale = Math.min(1, (window.innerWidth * 0.6) / r.width, (window.innerHeight * 0.62) / r.height);
        stage.style.setProperty("--ix", `${window.innerWidth / 2 - (r.left + r.width / 2)}px`);
        stage.style.setProperty("--iy", `${window.innerHeight * 0.5 + (r.height * scale) / 2 - r.bottom}px`);
        stage.style.setProperty("--is", scale);
        stage.setAttribute("data-intro", "");
        stage.removeAttribute("data-intro-wait");
        timer = setTimeout(end, 1900);
      });
    });
    window.addEventListener("pointerdown", end);
    window.addEventListener("keydown", end);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("pointerdown", end);
      window.removeEventListener("keydown", end);
      stage.removeAttribute("data-intro");
      stage.removeAttribute("data-intro-wait");
    };
  }, []);

  // Keep the address in step with what is on screen. Changing app adds a history entry; flipping through
  // projects replaces it, so "back" leaves the app instead of rewinding one project at a time.
  useEffect(() => {
    const target = viewId === "home" ? "" : viewId === "projects" ? `#/projects/${PROJECT_SLUGS[index]}` : `#/${viewId}`;
    const first = lastView.current === null;
    if (window.location.hash !== target) {
      const write = first || lastView.current === viewId ? "replaceState" : "pushState";
      window.history[write](null, "", target || window.location.pathname + window.location.search);
    }
    lastView.current = viewId;
  }, [viewId, index]);

  useEffect(() => {
    const sync = () => {
      const route = readRoute();
      lastView.current = route.view;
      setViewId(route.view);
      if (route.index !== null) setIndex(route.index);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  // Escape closes the open app. In Projects, the arrow keys step through the projects.
  useEffect(() => {
    if (viewId === "home") return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input,textarea,select,.dock")) return;
      if (e.key === "Escape") return setViewId("home");
      if (viewId !== "projects") return;
      const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      // The pointer may still be resting on the name that was clicked: mute hover until it moves again,
      // so the only name that looks selected is the one on screen.
      listRef.current?.setAttribute("data-keys", "");
      setIndex((i) => (i + d + PROJECTS.length) % PROJECTS.length);
    };
    const onMove = () => listRef.current?.removeAttribute("data-keys");
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
    };
  }, [viewId]);

  // Keyboard focus follows the selection, so the focus ring never sits on a different name than the highlight.
  useEffect(() => {
    const list = listRef.current;
    if (list?.contains(document.activeElement)) list.querySelector("[aria-current]")?.focus({ preventScroll: true });
  }, [index]);

  // A sideways swipe in Projects flips to the next or previous one.
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    const from = touch.current;
    touch.current = null;
    if (!from || viewId !== "projects") return;
    const t = e.changedTouches[0];
    const dx = t.clientX - from.x;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(t.clientY - from.y) * 1.6) setIndex((i) => (i + (dx < 0 ? 1 : -1) + PROJECTS.length) % PROJECTS.length);
  };

  const app = WINDOWS.find((a) => a.id === appId);
  const hinting = { onPointerLeave: () => setHint(null), onBlur: () => setHint(null) };

  return (
    <div className="site stage" ref={stageRef} data-open={app ? "" : undefined}>
      <style>{BASE_CSS + DOCK_CSS + STAGE_CSS}</style>

      <div className="stage__top">
        <header className="stage__head">
          <h1 className="stage__mark">
            <button type="button" onClick={() => setViewId("home")} aria-label="Perfect Phanitchaleun, back to the desktop">
              Perfect <br className="stage__br" />
              Phanitchaleun.
            </button>
          </h1>
          <p className="stage__role">
            <span>Software Engineer</span>
            <span>A student, looking for SWE new grad roles</span>
          </p>
        </header>

      </div>

      {/* the left column: the nav and tools, then the résumé and footer under them */}
      <aside className="stage__side">
        <div className="stage__nav">
          <nav aria-label="Primary" className={hint ? "has-hint" : undefined}>
            {NAV.map((a) => (
              <button key={a.id} type="button" className={hint === a.id ? "is-hint" : undefined} aria-current={a.id === viewId ? "page" : undefined} onClick={() => setViewId(a.id)} data-umami-event={`view-${a.id}`}>
                {a.name.toLowerCase()}
              </button>
            ))}
            <a href="/archive/index.html" data-umami-event="view-archive">
              archive
            </a>
          </nav>
          <div className="stage__tools">
            <div className="stage__themes" role="group" aria-label="Color theme">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={t.id === theme}
                  aria-label={t.name}
                  title={t.name}
                  onClick={() => setTheme(t.id)}
                  style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)` }}
                />
              ))}
            </div>
            <SoundDock slot={appId === "music" ? musicSlot : null} onOpen={() => setViewId(viewId === "music" ? "home" : "music")} />
          </div>
        </div>
        <div className="stage__base">
          <a className="stage__resume" {...RESUME} data-umami-event-location="stage">
            Résumé
            <DownloadIcon />
          </a>
          <a className="stage__archive" href="/archive/index.html" data-umami-event="view-archive">
            Archive
          </a>
          <p className="stage__foot">
            <span>© {new Date().getFullYear()} Perfect Phanitchaleun</span>
            <VisitorCount />
          </p>
        </div>
      </aside>

      <main id="top" className="stage__main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="stage__mac">
          <div className="stage__lid">
            <div className="stage__screen" ref={screenRef} style={{ "--ox": origin.x, "--oy": origin.y }}>
              {/* the desktop: three slow lights and the dock */}
              <div className="desk" inert={app ? "" : undefined}>
                <div className="desk__lights" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <ul className="desk__files" aria-label="On the desktop">
                  {FILES.map((f) => (
                    <li key={f.id} data-app={f.id}>
                      <button type="button" onClick={() => setViewId(f.id)} data-umami-event={`desktop-${f.id}`}>
                        {f.kind === "folder" ? <FolderArt /> : <TextArt />}
                        <b>{f.name}</b>
                      </button>
                    </li>
                  ))}
                </ul>
                <nav className="dk" aria-label="Sections">
                  {nudge && <p className="dk__nudge">Pick one to open it</p>}
                  <ul className="dk__dock">
                    {APPS.map((a) => (
                      <li key={a.id} data-app={a.id}>
                        <button type="button" onClick={() => setViewId(a.id)} onPointerEnter={() => setHint(a.id)} onFocus={() => setHint(a.id)} {...hinting} data-umami-event={`home-${a.id}`}>
                          <span className="dk__tile">
                            <AppIcon id={a.id} />
                          </span>
                          <b>{a.name}</b>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {app && (
                <section className="app" key={app.id} data-phase={phase} aria-label={app.name}>
                  <header className="app__bar">
                    <button type="button" className="app__close" onClick={() => setViewId("home")} aria-label={`Close ${app.name}`} />
                    <p>{app.name}</p>
                  </header>
                  <div className="app__body">
                    {app.id === "projects" && <ProjectsApp index={index} setIndex={setIndex} listRef={listRef} />}
                    {app.id === "experience" && <ExperienceApp />}
                    {app.id === "stack" && <StackApp openProject={openProject} />}
                    {app.id === "about" && <AboutApp />}
                    {app.id === "contact" && <ContactApp />}
                    {app.id === "music" && <div className="mu" ref={setMusicSlot} />}
                    {app.id === "resume" && <ResumeApp />}
                    {app.id === "boat" && <BoatFolder />}
                    {app.id === "sailor" && <SailorText />}
                  </div>
                </section>
              )}
            </div>
          </div>
          <span className="stage__deck" aria-hidden="true" />
        </div>
      </main>
    </div>
  );
}

// The few base rules and the two borrowed color themes, so this site no longer loads the archive's stylesheet.
const BASE_CSS = `
*{box-sizing:border-box;}
:root[data-stage]{--ease:cubic-bezier(.16,1,.3,1);}
html{background:var(--bg);accent-color:var(--accent-fill);scrollbar-color:color-mix(in srgb,var(--text) 32%,transparent) var(--bg);}
:root[data-theme="slate"]{
  color-scheme:light;
  --bg:#eef2f6;--surface:#f8fafc;--card:#f8fafc;--placeholder:#eef2f6;
  --brand:#334155;--accent-fill:#334155;--accent:#0f172a;--card-ink:#334155;--on-accent:#fff;--ink-on-light:#334155;
  --text:#0f172a;--muted:color-mix(in srgb,#0f172a 78%,#eef2f6);--shadow:#334155;--line:rgba(51,65,85,.18);
}
:root[data-theme="mustard"]{
  color-scheme:dark;
  --bg:#1f2124;--surface:#2a2d31;--card:#2a2d31;--placeholder:#2a2d31;
  --brand:#f2c230;--accent-fill:#f2c230;--accent:#f2c230;--card-ink:#f2c230;--on-accent:#1f2124;--ink-on-light:#1f2124;
  --text:#f1efe8;--muted:color-mix(in srgb,#f1efe8 78%,#1f2124);--shadow:#000;--line:rgba(242,194,48,.22);
}
.site{margin:0;color:var(--text);font-family:var(--font-body);font-weight:400;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;line-height:1.55;}
.site a{color:inherit;text-decoration:none;}
.site ul{list-style:none;margin:0;padding:0;}
.site :focus-visible{outline:2px solid var(--accent-fill);outline-offset:3px;border-radius:6px;}
.bullets li{position:relative;padding-left:20px;color:var(--muted);font-size:15.5px;line-height:1.66;}
.bullets li::before{content:"";position:absolute;left:0;top:.72em;width:6px;height:6px;border-radius:50%;background:var(--accent-fill);}
.site .project__stack{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;}
.project__stack li{font-size:12.5px;padding:5px 12px;border-radius:999px;background:var(--surface);border:1px solid var(--line);}
.project__links{display:flex;flex-wrap:wrap;gap:2px 26px;margin-top:18px;}
.site .project__link{
  display:inline-flex;align-items:center;gap:6px;padding:10px 0;font-size:15px;
  text-decoration:underline;text-decoration-color:var(--accent-fill);text-decoration-thickness:1px;text-underline-offset:6px;
  transition:gap .25s var(--ease),color .25s var(--ease);
}
.site .project__link--quiet{color:var(--muted);text-decoration-color:var(--line);}
.site .project__link:hover{gap:10px;}
.footer__visits{display:inline-flex;align-items:center;gap:8px;}
.footer__pulse{position:relative;width:7px;height:7px;border-radius:50%;background:var(--accent-fill);}
.footer__pulse::after{content:"";position:absolute;inset:0;border-radius:50%;background:var(--accent-fill);animation:visitPulse 1.8s var(--ease) infinite;}
@keyframes visitPulse{from{transform:scale(1);opacity:.6;}to{transform:scale(2.8);opacity:0;}}
`;

const STAGE_CSS = `
/* ================= SHOWCASE SITE ================= */
:root[data-stage]{
  --font-display:'Gloock','Times New Roman',serif;
  --font-body:'Onest','Helvetica Neue',Arial,sans-serif;
  --mono:'Martian Mono',ui-monospace,Menlo,monospace;
  --grain-opacity:0;--pad:clamp(18px,2.5vw,36px);--round:18px;
}
:root[data-theme="white"]{
  color-scheme:light;
  --bg:#fff;--surface:#f3f3f1;--card:#f3f3f1;--placeholder:#f3f3f1;
  --brand:#0a0a0a;--accent-fill:#0a0a0a;--accent:#0a0a0a;--card-ink:#0a0a0a;--on-accent:#fff;--ink-on-light:#0a0a0a;
  --text:#0a0a0a;--muted:#5f5f5c;--dim:#5f5f5c;--tagline:#5f5f5c;--shadow:#0a0a0a;--line:rgba(10,10,10,.16);
}
:root[data-theme="black"]{
  color-scheme:dark;
  --bg:#0a0a0a;--surface:#171717;--card:#171717;--placeholder:#171717;
  --brand:#f4f4f2;--accent-fill:#f4f4f2;--accent:#f4f4f2;--card-ink:#f4f4f2;--on-accent:#0a0a0a;--ink-on-light:#0a0a0a;
  --text:#f4f4f2;--muted:#a6a6a2;--dim:#a6a6a2;--tagline:#a6a6a2;--shadow:#000;--line:rgba(244,244,242,.2);
}
.stage{
  font-synthesis:none;
  height:100svh;min-height:560px;overflow:hidden;
  /* a left column about a fifth of the window (name, nav, résumé) and the laptop filling the rest, top to bottom */
  --side:clamp(210px,21vw,420px);
  display:grid;grid-template-columns:var(--side) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);
  font-family:var(--font-display);background:var(--bg);
}
.stage ::selection{background:var(--text);color:var(--bg);}
.stage button{font:inherit;color:inherit;}

/* ---- top of the left column: the name on two lines, sized to the column, with the role under it ---- */
.stage__top{grid-column:1;grid-row:1;padding:26px 12px 0 var(--pad);min-width:0;}
.stage__head{display:flex;flex-direction:column;gap:12px;min-width:0;}
.stage__mark{margin:0;font-size:calc((var(--side) - var(--pad) - 12px) / 6.9);font-weight:400;letter-spacing:-.015em;line-height:.98;}
.stage__mark button{all:unset;cursor:pointer;display:block;}
.stage__mark button:focus-visible{outline:2px solid var(--text);outline-offset:6px;}
.stage__role{margin:0;font-family:var(--font-body);font-size:max(12.5px,calc((var(--side) - var(--pad) - 12px) / 20.5));line-height:1.4;color:var(--muted);}
.stage__role span{display:block;}
/* ---- the nav and tools: in the left column, above the résumé ---- */
.stage__nav{display:flex;flex-direction:column;align-items:flex-start;gap:16px;}
.stage__nav nav{display:flex;flex-direction:column;align-items:flex-start;}
.stage__nav nav :is(button,a){
  position:relative;padding:0;border:none;background:none;cursor:pointer;white-space:nowrap;
  font-size:17px;line-height:1.35;font-weight:400;letter-spacing:-.005em;color:var(--muted);text-decoration:none;
  transition:color .25s var(--ease),opacity .25s var(--ease),translate .3s var(--ease);
}
.stage__nav nav :is(button,a):hover{color:var(--text);}
.stage__nav nav [aria-current]{color:var(--text);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;}
/* pointing at a dock icon: its name in the nav steps forward behind a dot, and the other names fall back */
.stage__nav nav.has-hint > :not(.is-hint){opacity:.28;}
.stage__nav nav .is-hint{color:var(--text);translate:14px 0;}
.stage__nav nav button::after{
  content:"";position:absolute;right:calc(100% + 8px);top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;
  background:var(--text);scale:0;transition:scale .3s var(--ease);
}
.stage__nav nav .is-hint::after{scale:1;}
.stage__tools{display:flex;align-items:center;gap:14px;}
.stage__themes{display:grid;grid-template-columns:repeat(2,18px);gap:6px;}
.stage__themes button{
  width:18px;height:18px;padding:0;border-radius:50%;cursor:pointer;
  border:1px solid color-mix(in srgb,var(--text) 45%,transparent);
}
.stage__themes button[aria-pressed="true"]{outline:2px solid var(--text);outline-offset:2px;}

/* ---- the music player: a spinning record under the swatches; its panel drops down from it ---- */
.stage .dock{position:relative;right:auto;bottom:auto;width:auto;display:block;z-index:40;pointer-events:auto;}
.stage .dock__tab{
  position:relative;width:44px;height:44px;min-height:0;padding:0;border-radius:50%;overflow:hidden;
  border:1px solid color-mix(in srgb,var(--text) 35%,transparent);box-shadow:none;
  background:
    radial-gradient(circle,#0c0c0c 0 1.5px,#ece7da 2px 9px,transparent 9.5px),
    repeating-radial-gradient(circle,#0c0c0c 0 2px,#262626 2px 3px);
  animation:vinyl 6s linear infinite;
}
.stage .dock__tab::after{
  content:"";position:absolute;inset:0;border-radius:50%;
  background:conic-gradient(from 20deg,transparent 0 12%,rgba(255,255,255,.2) 16%,transparent 22% 62%,rgba(255,255,255,.14) 66%,transparent 72%);
}
.stage .dock__tab:hover{transform:none;border-color:var(--text);}
.stage .dock:has(.dock__eq.is-playing) .dock__tab{animation-duration:1.8s;}
.stage .dock__tab > *{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}
@keyframes vinyl{to{rotate:360deg;}}
.stage .dock__panel{
  position:absolute;top:calc(100% + 12px);right:0;width:min(340px,calc(100vw - 2 * var(--pad)));
  background:var(--surface);backdrop-filter:none;-webkit-backdrop-filter:none;transform-origin:top right;
}

/* ---- left column ---- */
.stage__side{grid-column:1;grid-row:2;display:flex;flex-direction:column;justify-content:flex-end;gap:clamp(18px,3vh,30px);padding:0 12px 26px var(--pad);min-height:0;min-width:0;}
.stage__base{display:flex;flex-direction:column;}
.stage__resume{
  align-self:flex-start;display:inline-flex;align-items:center;gap:8px;
  font-family:var(--font-body);font-size:14px;font-weight:500;
  text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;
}
.stage__foot{
  margin:10px 0 0;display:flex;flex-direction:column;gap:2px;
  font-family:var(--font-body);font-size:12.5px;line-height:1.4;color:var(--muted);
}
.stage__foot .footer__visits{display:inline-flex;align-items:center;gap:7px;}
.stage__archive{display:none;}

/* ---- the laptop: always on the page, in every section. It keeps a laptop's proportions (about 16:10) and
   is sized to fit the room it has, so a very wide window gets a bigger laptop, not a stretched one. ---- */
.stage__main{grid-column:2;grid-row:1/-1;min-height:0;min-width:0;display:grid;place-items:center;container-type:size;margin:26px var(--pad) 26px 0;}
.stage__mac{position:relative;width:min(100cqw,100cqh * 1.56);aspect-ratio:1.56;min-height:0;min-width:0;transform-origin:50% 100%;}
.stage__lid{
  position:relative;height:100%;padding:11px;border-radius:var(--round);background:#161617;transform-origin:50% 100%;
  /* no light inner ring and no light screen backing: either one shows as pale pixels where the corners curve */
  box-shadow:0 26px 50px -30px color-mix(in srgb,var(--shadow) 70%,transparent);
  outline:1px solid color-mix(in srgb,var(--text) 18%,transparent);outline-offset:0;
}
.stage__lid::before{content:"";position:absolute;z-index:1;top:3.5px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:#3a3a3d;}
.stage__deck{display:none;}
.stage__screen{position:relative;height:100%;border-radius:8px;overflow:hidden;background:var(--bg);isolation:isolate;font-family:var(--font-body);color:var(--text);}

/* ---- the desktop: three lights drifting like a lava lamp, and the dock ---- */
.desk{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:clamp(16px,2.6vw,38px);}
.desk__lights{position:absolute;inset:0;overflow:hidden;filter:blur(clamp(36px,5.5vw,84px)) saturate(125%);}
.desk__lights i{position:absolute;width:44%;aspect-ratio:1;border-radius:50%;will-change:translate,scale;}
.desk__lights i:nth-child(1){left:-6%;top:44%;background:color-mix(in oklab,#8fe8c0 78%,var(--bg));animation:lavaA 26s ease-in-out infinite alternate;}
.desk__lights i:nth-child(2){left:30%;top:-26%;background:color-mix(in oklab,#9ccbff 78%,var(--bg));animation:lavaB 33s ease-in-out infinite alternate;}
.desk__lights i:nth-child(3){left:62%;top:36%;background:color-mix(in oklab,#cbaeff 76%,var(--bg));animation:lavaC 29s ease-in-out infinite alternate;}
@keyframes lavaA{0%{translate:0 0;scale:1;}30%{translate:46% -52%;scale:1.2;}62%{translate:92% -8%;scale:.86;}100%{translate:28% -78%;scale:1.1;}}
@keyframes lavaB{0%{translate:0 0;scale:1;}28%{translate:-52% 62%;scale:.88;}60%{translate:38% 96%;scale:1.22;}100%{translate:66% 30%;scale:1;}}
@keyframes lavaC{0%{translate:0 0;scale:1;}34%{translate:-70% -58%;scale:1.16;}66%{translate:-118% 14%;scale:.9;}100%{translate:-34% -30%;scale:1.12;}}
/* things on the desktop: a column down the right edge, the way a Mac stacks them */
.stage .desk__files{
  position:absolute;z-index:1;top:clamp(14px,2.2vw,30px);right:clamp(14px,2.2vw,30px);
  list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:clamp(8px,1.2vw,16px);
}
.desk__files button{
  display:flex;flex-direction:column;align-items:center;gap:5px;width:clamp(78px,7vw,96px);padding:6px 4px 5px;
  border:none;border-radius:10px;background:none;cursor:pointer;transition:background .2s var(--ease);
}
.fi__art{width:clamp(48px,4.6vw,62px);height:auto;filter:drop-shadow(0 6px 8px color-mix(in srgb,var(--shadow) 22%,transparent));transition:scale .25s var(--ease);}
.desk__files b{
  max-width:100%;padding:1px 7px;border-radius:5px;font-weight:500;font-size:clamp(11.5px,1vw,13px);line-height:1.35;
  overflow-wrap:anywhere;text-align:center;transition:background .2s var(--ease),color .2s var(--ease);
}
.desk__files button:is(:hover,:focus-visible){background:color-mix(in srgb,var(--text) 8%,transparent);}
.desk__files button:is(:hover,:focus-visible) b{background:#1f86ea;color:#fff;}
.desk__files button:active .fi__art{scale:.93;}

/* boat */
.fo{display:flex;flex-direction:column;}
.fo--empty{align-items:center;justify-content:center;gap:14px;color:var(--muted);font-size:15px;}
.fo--empty .fi__art{width:92px;opacity:.5;filter:saturate(.6);}
.fo--empty p{margin:0;}
.stage .fo__grid{list-style:none;margin:16px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(120px,14vw,190px),1fr));gap:clamp(12px,1.6vw,22px);}
.fo__grid li{display:flex;flex-direction:column;gap:7px;min-width:0;}
.fo__grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;background:var(--surface);display:block;}
.fo__grid span{font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;}

/* sailor.txt */
.tx{display:flex;flex-direction:column;gap:12px;max-width:760px;margin:0 auto;width:100%;}
.tx__page{
  flex:1;min-height:180px;width:100%;margin:0;padding:0;border:none;outline:none;resize:none;background:none;color:var(--text);
  caret-color:var(--text);font-family:var(--mono);font-size:15px;line-height:1.7;
}
.tx__page::placeholder{color:color-mix(in srgb,var(--text) 35%,transparent);}
.tx__foot{margin:0;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:30px;}
.tx__foot button{padding:6px 14px;border:none;border-radius:999px;background:var(--surface);font-size:13px;cursor:pointer;transition:background .2s var(--ease),color .2s var(--ease);}
.tx__foot button:hover{background:var(--text);color:var(--bg);}

.dk{position:relative;z-index:1;margin-top:auto;display:flex;flex-direction:column;align-items:center;}
.stage .dk__dock{
  list-style:none;margin:0;padding:clamp(10px,1.1vw,14px);display:flex;gap:clamp(8px,1.2vw,16px);border-radius:clamp(22px,2.4vw,30px);
  background:color-mix(in srgb,var(--bg) 55%,transparent);backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--bg) 70%,transparent),0 18px 40px -24px color-mix(in srgb,var(--shadow) 55%,transparent);
}
.dk__dock button{
  display:flex;flex-direction:column;align-items:center;gap:8px;width:clamp(68px,7.6vw,104px);padding:0;border:none;background:none;cursor:pointer;
  transition:translate .3s var(--ease);
}
.dk__tile{
  display:grid;place-items:center;width:clamp(50px,5.4vw,72px);aspect-ratio:1;border-radius:26%;background:var(--bg);
  box-shadow:0 1px 0 color-mix(in srgb,var(--text) 10%,transparent),0 10px 20px -12px color-mix(in srgb,var(--shadow) 55%,transparent);
  transition:scale .3s var(--ease);
}
.dk__dock b{font-weight:500;font-size:clamp(11.5px,1vw,13.5px);white-space:nowrap;}
.dk__nudge{
  margin:0 0 14px;text-align:center;font-size:13.5px;font-weight:500;color:color-mix(in srgb,var(--text) 70%,transparent);
  animation:nudge 9s var(--ease) 1.6s both;
}
@keyframes nudge{0%{opacity:0;translate:0 6px;}8%,78%{opacity:1;translate:0 0;}100%{opacity:0;translate:0 0;}}
.dk__dock button:is(:hover,:focus-visible){translate:0 -8px;}
.dk__dock button:active .dk__tile{scale:.92;}

/* ---- an open app: it grows out of its dock icon to fill the screen, and shrinks back into it ---- */
.app{
  position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;background:var(--bg);overflow:hidden;
  transform-origin:var(--ox,50%) var(--oy,100%);animation:appIn .5s cubic-bezier(.2,.85,.2,1) both;
}
.app[data-phase="out"]{animation:appOut .3s cubic-bezier(.55,0,.85,.35) both;}
@keyframes appIn{from{opacity:0;transform:scale(.06);border-radius:26%;}40%{opacity:1;}to{opacity:1;transform:none;border-radius:0;}}
@keyframes appOut{from{opacity:1;transform:none;}to{opacity:0;transform:scale(.06);border-radius:26%;}}
.app__bar{position:relative;flex:none;display:flex;align-items:center;justify-content:center;height:44px;}
.app__bar p{margin:0;font-size:13px;font-weight:500;color:var(--muted);}
.app__close{
  position:absolute;left:16px;top:50%;width:13px;height:13px;margin-top:-6.5px;padding:0;border:none;border-radius:50%;cursor:pointer;
  background:color-mix(in srgb,var(--text) 26%,transparent);transition:background .2s var(--ease),scale .2s var(--ease);
}
.app__close::before{content:"";position:absolute;inset:-12px;}
.app__close:is(:hover,:focus-visible){background:var(--text);scale:1.25;}
.app__body{flex:1;min-height:0;overflow:auto;scrollbar-width:thin;padding:clamp(10px,1.6vw,22px) clamp(22px,4vw,60px) clamp(22px,3.4vw,48px);}
.app__body > *{min-height:100%;}
.app__meta{margin:0;font-family:var(--mono);font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);}
.app__title{margin:10px 0 0;font-family:var(--font-display);font-size:clamp(30px,3.3vw,48px);font-weight:400;letter-spacing:-.015em;line-height:1;}
.app__title--xl{margin:0;font-size:clamp(38px,5.4vw,82px);line-height:.98;max-width:11em;}
.app__lead{margin:16px 0 0;font-size:clamp(16px,1.4vw,20px);line-height:1.4;color:var(--muted);}
.app__lead strong{color:var(--text);font-weight:500;}
.app__bullets{margin-top:18px;}
.app__bullets li,.pj__notes .bullets li{font-size:clamp(14px,1.05vw,15.5px);line-height:1.55;}
.stage .project__stack li{border-radius:999px;}
.stage .hl{background:transparent;color:inherit;padding:0;margin:0;font-weight:700;box-shadow:none;}

/* Projects */
.pj{display:grid;grid-template-columns:clamp(130px,13vw,190px) minmax(0,1.2fr) minmax(0,1fr);gap:clamp(18px,2.6vw,40px);height:100%;}
.pj__side{display:flex;flex-direction:column;justify-content:space-between;min-width:0;}
.stage .pj__list{list-style:none;margin:0;padding:0;}
.pj__list button{
  display:block;padding:2px 0;border:none;background:none;cursor:pointer;text-align:left;
  font-family:var(--font-display);font-size:clamp(17px,1.6vw,23px);letter-spacing:-.015em;line-height:1.2;
  color:color-mix(in srgb,var(--text) 30%,var(--bg));transition:color .25s var(--ease);
}
.pj__list:not([data-keys]) button:hover{color:color-mix(in srgb,var(--text) 62%,var(--bg));}
.pj__list button[aria-current]{color:var(--text);}
.pj__ctl{display:flex;gap:8px;margin-top:18px;}
.pj__ctl button{
  display:grid;place-items:center;width:38px;height:38px;padding:0;border-radius:50%;cursor:pointer;
  border:none;background:var(--surface);transition:background .2s var(--ease),color .2s var(--ease),scale .2s var(--ease);
}
.pj__ctl button:hover{background:var(--text);color:var(--bg);}
.pj__ctl button:active{scale:.92;}
.pj__ctl button:first-child svg{rotate:-135deg;}
.pj__ctl button:nth-child(2) svg{rotate:45deg;}
/* the screenshot keeps its full height and slides up while the pointer is on it, so the whole page gets seen */
.pj__shot{display:block;position:relative;min-height:0;border-radius:14px;overflow:hidden;background:#161617;container-type:size;}
.pj__shot img{
  display:block;width:100%;height:auto;min-height:100cqh;object-fit:cover;object-position:top;
  translate:0 0;transition:translate 1.2s var(--ease);animation:shotIn .5s var(--ease);
}
@keyframes shotIn{from{opacity:0;transform:scale(1.03);}to{opacity:1;transform:none;}}
@media (hover:hover){
  .pj__shot:is(:hover,:focus-visible) img{translate:0 min(0px,calc(100cqh - 100%));transition:translate var(--pan,7s) cubic-bezier(.37,0,.63,1);}
}
@media (hover:none){
  .pj__shot img{animation:shotIn .5s var(--ease),panLoop calc(var(--pan,7s) * 2.4) cubic-bezier(.37,0,.63,1) 1.2s infinite alternate;}
}
@keyframes panLoop{0%,12%{translate:0 0;}88%,100%{translate:0 min(0px,calc(100cqh - 100%));}}
.pj__tag{
  display:inline-flex;align-items:center;gap:6px;position:absolute;right:12px;bottom:12px;padding:6px 10px;border-radius:999px;
  background:rgba(10,10,10,.82);color:#fff;font-family:var(--mono);font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;
}
.pj__notes{min-height:0;overflow-y:auto;scrollbar-width:thin;animation:rise .4s var(--ease);}
@keyframes rise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.pj__notes .notes__summary{margin:14px 0 0;font-size:clamp(16px,1.3vw,18.5px);line-height:1.4;}
.pj__notes .notes__credit{margin:10px 0 0;font-family:var(--mono);font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);}
.pj__notes .bullets{margin-top:16px;}

/* Experience: a timeline. Dates on the left, one line down the middle, a dot at each stop */
.stage .tl{
  position:relative;list-style:none;margin:0 auto;padding:0;max-width:980px;
  display:flex;flex-direction:column;justify-content:center;gap:clamp(16px,2vw,26px);
}
.tl::before{
  content:"";position:absolute;left:calc(clamp(110px,14vw,176px) + 20px);top:10px;bottom:10px;width:1px;
  background:linear-gradient(to bottom,var(--text) 0,color-mix(in srgb,var(--text) 22%,transparent) 30%,color-mix(in srgb,var(--text) 22%,transparent) 100%);
}
.tl > li{display:grid;grid-template-columns:clamp(110px,14vw,176px) 41px minmax(0,1fr);align-items:start;}
.tl__when{margin:9px 0 0;text-align:right;font-size:14px;font-weight:500;line-height:1.35;}
.tl__when span{display:block;font-weight:400;font-size:13px;color:var(--muted);}
.tl__dot{
  position:relative;justify-self:center;margin-top:11px;width:11px;height:11px;border-radius:50%;
  background:var(--bg);box-shadow:0 0 0 1.5px var(--text),0 0 0 6px var(--bg);
}
.tl .is-now .tl__dot{background:var(--text);}
.tl .is-now .tl__dot::after{content:"";position:absolute;inset:0;border-radius:50%;background:var(--text);animation:visitPulse 2.2s var(--ease) infinite;}
.tl .app__title{margin:0;font-size:clamp(24px,2.4vw,34px);}
.tl .app__lead{margin-top:8px;font-size:clamp(15px,1.25vw,17.5px);}
.tl .app__bullets{margin-top:10px;max-width:74ch;}
.tl .app__bullets li{font-size:14px;line-height:1.5;}
.tl .project__stack{margin-top:10px;}

/* Music: the player from the record, given the whole screen */
.mu{display:flex;height:100%;}
.stage .mu .dock__panel{
  position:static;flex:1;width:auto;padding:0;border:none;border-radius:0;background:none;box-shadow:none;
  opacity:1;visibility:visible;transform:none;transition:none;
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-auto-rows:min-content;align-content:center;
  column-gap:clamp(28px,5vw,80px);row-gap:clamp(12px,1.4vw,18px);
}
.mu .dock__panel > *{grid-column:1;}
.mu .dock__now{gap:clamp(14px,1.8vw,24px);}
.mu .dock__art{width:clamp(96px,11vw,150px);height:auto;aspect-ratio:1;border-radius:18px;}
.mu .dock__title{font-family:var(--font-display);font-size:clamp(28px,3.2vw,46px);line-height:1;letter-spacing:-.015em;white-space:normal;}
.mu .dock__artist{font-size:15px;}
.stage .mu .dock__list{grid-column:2;grid-row:1/span 8;align-self:center;max-height:min(100%,56svh);overflow-y:auto;scrollbar-width:thin;margin:0;}
.mu .dock__list button{font-family:var(--font-display);font-size:clamp(19px,1.9vw,27px);letter-spacing:-.015em;padding:5px 0;}

/* Résumé */
.rs{position:relative;display:flex;}
.rs iframe{flex:1;width:100%;min-height:320px;border:none;border-radius:12px;background:var(--surface);}
.rs__get{
  position:absolute;right:16px;bottom:16px;display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;
  background:var(--text);color:var(--bg) !important;font-size:14px;font-weight:500;box-shadow:0 12px 24px -14px color-mix(in srgb,var(--shadow) 80%,transparent);
}

/* Tech stack */
.sk{display:flex;flex-direction:column;}
.sk__groups{flex:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:clamp(20px,2.4vw,34px) clamp(20px,3vw,48px);}
.sk__group{margin:0;font-family:var(--font-display);font-size:clamp(20px,1.9vw,27px);font-weight:400;letter-spacing:-.015em;line-height:1;}
.stage .sk__chips{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px;}
.sk__chips button{
  display:inline-flex;align-items:center;gap:8px;padding:7px 12px 7px 8px;border-radius:999px;cursor:pointer;
  border:none;background:var(--surface);font-size:14px;transition:background .2s var(--ease),color .2s var(--ease);
}
.sk__chips button:hover{background:color-mix(in srgb,var(--text) 12%,var(--bg));}
.sk__chips button[aria-pressed="true"]{background:var(--text);color:var(--bg);}
.sk__chips img{display:block;}
.sk__chips i{display:grid;place-items:center;width:16px;height:16px;border-radius:50%;font-style:normal;font-family:var(--mono);font-size:10px;border:1px solid currentColor;}
.sk__used{flex:none;margin-top:auto;padding-top:26px;min-height:88px;}
.stage .sk__used ul{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:4px 22px;}
.sk__used :is(button,a){
  display:inline-flex;align-items:center;gap:6px;padding:0;border:none;background:none;cursor:pointer;
  font-family:var(--font-display);font-size:clamp(19px,1.9vw,27px);letter-spacing:-.015em;
  text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;
}

/* About */
.ab{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:clamp(28px,5vw,80px);align-items:center;}
.ab__facts{margin:0;display:flex;flex-direction:column;gap:clamp(12px,1.5vw,20px);}
.ab__facts dd{margin:5px 0 0;font-size:clamp(15.5px,1.3vw,18px);line-height:1.35;}

/* Contact */
.ct{display:flex;flex-direction:column;justify-content:center;}
.stage .ct__links{list-style:none;margin:clamp(30px,4.4vw,60px) 0 0;padding:0;display:flex;flex-direction:column;gap:clamp(8px,1vw,12px);}
.ct__links li{display:grid;grid-template-columns:minmax(80px,120px) minmax(0,1fr);align-items:baseline;gap:12px;}
.ct__links a{display:inline-flex;align-items:center;gap:7px;justify-self:start;max-width:100%;overflow-wrap:anywhere;font-size:clamp(16px,1.4vw,20px);}
.ct__links a:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;}

/* ---- first-visit intro: the laptop opens in the middle of the page, then settles into its place ---- */
.stage[data-intro-wait] :is(.stage__nav,.stage__side,.stage__role,.stage__mac){opacity:0;}
.stage[data-intro] .stage__mac{z-index:30;animation:macTravel 1.65s cubic-bezier(.7,0,.2,1) both;}
.stage[data-intro] .stage__lid{animation:lidOpen 1.65s cubic-bezier(.3,.9,.3,1) both;}
.stage[data-intro] .desk{animation:screenOn 1.65s linear both;}
.stage[data-intro] :is(.dk,.desk__files){animation:introIn .5s var(--ease) 1.15s both;}
.stage[data-intro] .stage__deck{
  display:block;position:absolute;left:-4%;right:-4%;top:100%;height:13px;border-radius:2px 2px 16px 16px;
  background:linear-gradient(#d2d2cf,#b3b3b0);animation:deckOut 1.65s linear both;
}
.stage[data-intro] :is(.stage__nav,.stage__side,.stage__role){animation:introIn .55s var(--ease) 1.1s both;}
@keyframes macTravel{0%,58%{transform:translate(var(--ix),var(--iy)) scale(var(--is));}100%{transform:none;}}
/* seen straight on, a lid swinging up on its hinge is simply growing in height: no perspective, so no lean */
@keyframes lidOpen{0%,8%{transform:scaleY(.012);}46%,100%{transform:scaleY(1);}}
@keyframes screenOn{0%,46%{opacity:0;}64%,100%{opacity:1;}}
@keyframes deckOut{0%,58%{opacity:1;}90%,100%{opacity:0;}}
@keyframes introIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}

/* a squeezed window: the desktop column would crowd the dock, so it steps out */
@media (max-height:560px),(max-width:900px){.stage .desk__files{display:none;}}
/* short windows: tighten the header so the laptop keeps its height */
@media (max-height:760px){
  .stage__top{padding-top:16px;}
  .stage__nav nav :is(button,a){font-size:15px;line-height:1.25;}
  .stage__side{padding-bottom:16px;}
  .stage__main{margin-top:16px;margin-bottom:16px;}
}
/* mid widths: the three project columns become two rows */
@media (max-width:1080px){
  .pj{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);}
  .pj__side{grid-column:1/-1;flex-direction:row;align-items:flex-end;gap:16px;}
  .stage .pj__list{display:flex;flex-wrap:wrap;gap:0 16px;}
  .pj__ctl{margin:0;}
  .stage__role{flex-basis:100%;}
  .ab{grid-template-columns:minmax(0,1fr);align-content:center;}
}
/* phones: no laptop. The screen is the phone itself: a home screen of icons, and apps that open full screen */
@media (max-width:760px){
  .stage{height:auto;min-height:100svh;overflow:visible;display:flex;flex-direction:column;}
  .stage{position:relative;}
  .stage__top{padding:16px var(--pad) 12px;}
  .stage__head{max-width:calc(100% - 150px);gap:8px;}
  .stage__role{font-size:14px;}
  .stage__mark{font-size:clamp(24px,7.2vw,30px);}
  /* the left column dissolves: the tools go to the top right corner, the résumé and footer to the bottom */
  .stage__side{display:contents;}
  .stage__nav{position:absolute;z-index:2;top:20px;right:var(--pad);}
  /* an open app takes the whole phone screen, so the page's own header and footer step aside */
  .stage[data-open] :is(.stage__top,.stage__nav,.stage__base){visibility:hidden;}
  .stage__nav nav{display:none;}
  .stage__tools{gap:12px;}
  .stage__themes{grid-template-columns:repeat(4,18px);}
  .stage .dock__tab{width:36px;height:36px;}
  .stage__role{flex-basis:100%;}
  .stage__main{order:2;flex:1;display:flex;margin:0;min-height:60svh;container-type:normal;}
  .stage__mac{display:flex;flex:1;width:auto;aspect-ratio:auto;}
  .stage__lid{flex:1;height:auto;padding:0;border-radius:0;background:none;box-shadow:none;outline:none;}
  .stage__lid::before{display:none;}
  .stage__screen{height:auto;min-height:60svh;border-radius:0;overflow:visible;background:none;}
  /* with no laptop to hold them, the lights leave the screen's rectangle and drift behind the whole page */
  .desk__lights{position:fixed;z-index:0;}
  .desk__lights i{width:86vw;}
  .stage__top,.stage__base{position:relative;z-index:1;}
  .desk{padding:26px var(--pad);justify-content:flex-start;}
  /* the folder and the text file belong to the laptop's desktop; a phone has no room for them */
  .stage .desk__files{display:none;}
  .dk{margin:0;align-self:stretch;align-items:stretch;}
  .stage .dk__dock{
    display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px 6px;padding:0;border-radius:0;
    background:none;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none;
  }
  .dk__dock button{width:100%;}
  .dk__tile{width:60px;}
  .dk__dock b{font-size:12px;}
  .dk__nudge{order:2;margin:26px 0 0;}
  .app{position:fixed;z-index:80;}
  .app__bar{height:52px;}
  .app__body{padding:8px var(--pad) 32px;}
  .pj{grid-template-columns:minmax(0,1fr);grid-template-rows:auto;height:auto;}
  .pj__side{grid-column:1;}
  .pj__shot{aspect-ratio:4/3;}
  .pj__notes{overflow:visible;}
  .tl::before{left:5px;}
  .tl > li{grid-template-columns:11px minmax(0,1fr);column-gap:18px;}
  .tl__when{grid-column:2;margin:0 0 6px;text-align:left;}
  .tl__when span{display:inline;margin-left:8px;}
  .tl__dot{grid-column:1;grid-row:1;margin-top:5px;}
  .tl > li > article{grid-column:2;}
  .stage .mu .dock__panel{grid-template-columns:minmax(0,1fr);}
  .stage .mu .dock__list{grid-column:1;grid-row:auto;}
  .ct__links li{grid-template-columns:minmax(0,1fr);gap:2px;}
  .stage__base{order:3;flex-direction:row;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:10px 18px;padding:18px var(--pad) 26px;}
  .stage__archive{display:inline;font-family:var(--font-body);font-size:14px;font-weight:500;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;}
  .stage__foot{flex-basis:100%;margin:0;}
}
@media (prefers-reduced-motion:reduce){
  .desk__lights i,.app,.pj__shot img,.pj__notes,.stage .dock__tab{animation:none !important;}
  .pj__shot img,.stage__nav nav :is(button,a),.dk__dock button{transition:none !important;}
  .pj__shot img{translate:0 0 !important;}
}
`;
