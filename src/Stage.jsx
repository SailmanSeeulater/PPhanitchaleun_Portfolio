import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AI_USAGE, GITHUB, EXPERIENCE, PROJECTS, rich } from "./data";
import { ArrowIcon, DownloadIcon, ProjectNotes, RESUME, VisitorCount, useAnalytics } from "./shared";
import { DOCK_CSS, SC_PROFILE, SoundDock } from "./sound";
import { AppIcon, FolderArt, TextArt } from "./art";
import { makeDrive } from "./drive";
import SAILOR_TXT from "./sailor.txt?raw";

// Every picture placed in src/assets/boat shows up in the "boat" folder, in file-name order.
const BOAT_PHOTOS = Object.entries(import.meta.glob("./assets/boat/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP,AVIF,GIF}", { eager: true, import: "default" }))
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, src]) => ({ src, name: path.split("/").pop() }));

// The dock's small apps are fetched the first time one is opened, or once the page has gone quiet, whichever
// comes first, so the first paint doesn't wait on them.
const loadMini = () => import("./apps");
const loadObsidian = () => import("./obsidian");
const MiniApp = lazy(loadMini);
const Obsidian = lazy(loadObsidian);

/* The Showcase site: one screen, no page scroll, and one laptop that never leaves.
   Its screen is a desktop: drifting lights and a dock of five sections. Choosing one opens it
   like an app, zooming out of its icon into a window above the dock; closing it zooms back in. */

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
  { id: "about", name: "About" },
  { id: "contact", name: "Contact" },
  { id: "resume", name: "Résumé" },
];
// The nav lists the sections; Résumé is reached from the dock and the résumé link. (The nav is hidden for now.)
const NAV = APPS.slice(0, 4);
// The live projects, each opening in a new tab, and GitHub. They live in the dock's Apps folder.
const liveOf = (name) => PROJECTS.find((p) => p.name === name).live;
const LINKS = [
  { id: "gitube", name: "gitube", href: liveOf("gitube"), icon: "/icons/apps/gitube.svg" },
  { id: "mordi", name: "Mordi", href: liveOf("Mordi"), icon: "/icons/dock/mordi.png" },
  { id: "pdfyier", name: "pdfyier", href: liveOf("pdfyier"), icon: "/icons/apps/pdfyier.svg" },
  { id: "lonelychess", name: "Lonely Chess", href: liveOf("Lonely Chess"), icon: "/icons/apps/lonelychess.svg" },
  { id: "github", name: "GitHub", href: GITHUB, icon: "/icons/apps/github.svg" },
];
// The apps on my own Mac's dock. Each does one small thing: "app" opens a little window of its own, "alert" pops
// up a note, and "href" leaves for a real site.
const DOCK_EXTRAS = [
  { id: "safari", name: "Safari", app: true },
  { id: "slack", name: "Slack", app: true },
  { id: "claude", name: "Claude", app: true },
  { id: "vscodium", name: "VSCodium", app: true },
  { id: "ghostty", name: "Ghostty", app: true },
  { id: "obsidian", name: "Obsidian", app: true },
  { id: "flstudio", name: "FL Studio", alert: "lol" },
  { id: "mordi", name: "Mordi", href: liveOf("Mordi") },
  { id: "tailscale", name: "Tailscale", alert: "lol" },
];
// The little windows the dock's apps open, Finder's included.
const MINI = [{ id: "finder", name: "Finder" }, ...DOCK_EXTRAS.filter((x) => x.app)];
// More favourites for Safari's start page, beside the live projects.
const SAFARI_MORE = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/perfect-phanitchaleun", color: "#0a66c2", event: "social-linkedin" },
  { name: "SoundCloud", href: SC_PROFILE, color: "#ff5500", event: "social-soundcloud" },
  { name: "Archive", href: "/archive/index.html", color: "#6b6f76", event: "view-archive" },
];
// Folders at the end of the dock. Each opens as a grid above its icon, the way a macOS dock folder does.
const STACKS = [
  { id: "apps", name: "Apps", items: LINKS },
  { id: "workflow", name: "Workflow", items: [] },
];
// Things lying on the desktop itself, opened the same way as the dock's apps.
const FILES = [
  { id: "boat", name: "boat", kind: "folder" },
  { id: "sailor", name: "sailor.txt", kind: "text" },
];
// The note that greets a first-time visitor. It opens from the boat in the menu bar, too.
const WELCOME = { id: "welcome", name: "Welcome" };
const WINDOWS = [...APPS, ...FILES, ...MINI, WELCOME];

// Listed under the jobs on the Experience timeline.
const EDUCATION = {
  role: "B.S. Computer Science",
  org: "San Diego State University",
  about: "Operating Systems, Algorithms, Machine Learning, Artificial Intelligence, Programming Languages",
  meta: ["Aug 2025 to Jun 2027", "San Diego, CA", "Expected"],
  bullets: [],
  stack: [],
};

// The Music app's icon: a little white iPod.
const MusicArt = () => (
  <svg viewBox="0 0 64 64" width="40" height="40" aria-hidden="true">
    <defs>
      <linearGradient id="mu-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#dcdcd8" />
      </linearGradient>
      <linearGradient id="mu-screen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7cb6ff" />
        <stop offset="1" stopColor="#2f76e0" />
      </linearGradient>
    </defs>
    <rect x="17" y="5" width="30" height="54" rx="6" fill="url(#mu-body)" stroke="#bdbdb8" />
    <rect x="21" y="9" width="22" height="17" rx="1.5" fill="url(#mu-screen)" />
    <circle cx="32" cy="42" r="10.5" fill="#e6e6e2" stroke="#d0d0cb" />
    <circle cx="32" cy="42" r="3.8" fill="#fff" stroke="#cfcfca" />
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

const monthOf = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const TOKENS_BURNT = `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(AI_USAGE.tokens.total)} Claude Code tokens, ${monthOf(AI_USAGE.since)} to ${monthOf(AI_USAGE.asOf)}`;

const ABOUT_FACTS = [
  ["Based in", "San Diego, California"],
  ["University", "B.S. Computer Science, San Diego State University, expected June 2027"],
  ["Work", "Founding engineer, stealth startup"],
  ["Off Work", "Badminton, Balatro, and Music"],
  ["Born in", "Laos"]
];

function AboutApp() {
  return (
    <div className="ab">
      <div>
        <h2 className="app__title app__title--xl">I like to build things and dream about pottery.</h2>
        <p className="app__lead">A software engineer, potter, and completionist++.</p>
      </div>
      <dl className="ab__facts">
        {ABOUT_FACTS.map(([label, value]) => (
          <div key={label}>
            <dt className="app__label">{label}</dt>
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
      <h2 className="app__title app__title--xl">Love to talk about anything.</h2>
      <ul className="ct__links">
        {CONTACTS.map((c) => (
          <li key={c.name}>
            <span className="app__label">{c.name}</span>
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

/* ---- Clock widget: an analog face of liquid glass showing the time in San Diego, ticking once a second ---- */
const SD_TIME = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" });
const SD_LABEL = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });

function ClockWidget() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer = 0;
    // Wake just after each whole second, so the second hand moves in step with the real clock.
    const step = () => {
      setNow(new Date());
      timer = setTimeout(step, 1000 - (Date.now() % 1000) + 5);
    };
    timer = setTimeout(step, 1000 - (Date.now() % 1000) + 5);
    return () => clearTimeout(timer);
  }, []);
  const t = Object.fromEntries(SD_TIME.formatToParts(now).map((p) => [p.type, Number(p.value)]));
  const hour = ((t.hour % 12) + t.minute / 60) * 30;
  const minute = (t.minute + t.second / 60) * 6;
  const second = t.second * 6;
  return (
    <div className="wg wg--clock" role="img" aria-label={`San Diego, ${SD_LABEL.format(now)}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
                {Array.from({ length: 60 }, (_, i) => (
          <line key={i} className={i % 5 ? "wg__tick" : "wg__tick wg__tick--hour"} x1="50" y1="6.5" x2="50" y2={i % 5 ? 9 : 10.5} transform={`rotate(${i * 6} 50 50)`} />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i + 1) * 30 * Math.PI) / 180;
          return (
            <text key={i} className="wg__num" x={50 + Math.sin(a) * 31} y={50 - Math.cos(a) * 31} textAnchor="middle" dominantBaseline="central">
              {i + 1}
            </text>
          );
        })}
        <line className="wg__hand" x1="50" y1="50" x2="50" y2="28" strokeWidth="3.4" transform={`rotate(${hour} 50 50)`} />
        <line className="wg__hand" x1="50" y1="50" x2="50" y2="14" strokeWidth="2.2" transform={`rotate(${minute} 50 50)`} />
        <circle className="wg__hand-dot" cx="50" cy="50" r="3.6" />
        <line className="wg__second" x1="50" y1="58" x2="50" y2="11" transform={`rotate(${second} 50 50)`} />
        <circle className="wg__second-dot" cx="50" cy="50" r="1.6" />
      </svg>
    </div>
  );
}

/* ---- The menu bar's clock: the day and time in San Diego, like the widgets. ---- */
const SD_MENU = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function MenuClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);
  return (
    <time className="mb__time" title="The time in San Diego">
      {SD_MENU.format(now).replace(/,/g, "")}
    </time>
  );
}

/* ---- Welcome: what a first-time visitor sees. Who this is, and the two things most people came for. ---- */
function WelcomeApp({ go }) {
  return (
    <div className="wl">
      <p className="app__meta">Welcome</p>
      <h2 className="app__title">Hi, I'm Perfect Phanitchaleun.</h2>
      <p className="app__lead">This is my portfolio website. Please feel free to interact with it like you would with your laptop.</p>
      <p className="wl__go">
        <button type="button" onClick={() => go("projects")} data-umami-event="welcome-projects">
          See the projects
        </button>
        <button type="button" onClick={() => go("resume")} data-umami-event="welcome-resume">
          Read the résumé
        </button>
      </p>
    </div>
  );
}

/* ---- Calendar widget: this month, with today marked. It keeps San Diego's date, like the clock beside it. ---- */
const SD_DATE = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "numeric", day: "numeric" });
const MONTH_NAME = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long" });
const sdToday = () => SD_DATE.format(new Date());

function CalendarWidget() {
  const [today, setToday] = useState(sdToday);
  // Looks once a minute, so the page turns to the next day at midnight without a reload.
  useEffect(() => {
    const timer = setInterval(() => setToday(sdToday()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [month, day, year] = today.split("/").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const name = MONTH_NAME.format(first);
  return (
    <div className="wg wg--cal" role="img" aria-label={`${name} ${day}, ${year}`}>
      <p>{name}</p>
      <ol aria-hidden="true">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <li key={`w${i}`} className="wg__dow">
            {d}
          </li>
        ))}
        {Array.from({ length: days }, (_, i) => (
          <li key={i} className={i + 1 === day ? "is-today" : undefined} style={i ? undefined : { gridColumnStart: first.getUTCDay() + 1 }}>
            {i + 1}
          </li>
        ))}
      </ol>
    </div>
  );
}

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

/* ---- Résumé: the pages on the laptop screen, with the download beside it. They're pictures made from the PDF
   (npm run resume) because the live server won't let the PDF itself be shown in a frame. ---- */
const RESUME_PAGES = 1;

function ResumeApp() {
  return (
    <div className="rs">
      <a className="rs__pages" href={RESUME.href} target="_blank" rel="noreferrer" aria-label="Résumé of Perfect Phanitchaleun, opens the PDF">
        {Array.from({ length: RESUME_PAGES }, (_, i) => (
          <img key={i} src={`/resume-${i + 1}.png`} alt="" width="1836" height="2376" />
        ))}
      </a>
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


/* ---- A window. It grows out of its icon when it opens and shrinks back into it when it closes or is minimised,
   comes to the front when it's clicked, and can be dragged by its title bar. Several can be open at once.
   Its three lights work: red closes, yellow minimises to the icon, green fills the screen (and gives it back). ---- */
const clamp = (n, low, high) => Math.min(Math.max(n, low), high);
const onPhone = () => window.matchMedia("(max-width:760px)").matches;

function AppWindow({ win, name, wide, flush, front, alone, originOf, screenRef, onFocus, onClose, onMin, onMax, onGone, children }) {
  const ref = useRef(null);
  const [phase, setPhase] = useState("in");
  const [origin, setOrigin] = useState({ x: "50%", y: "100%" });
  // How far it sits from its usual place. Each new window starts a step down and to the right of the last,
  // so one doesn't land exactly on top of another; dragging moves it from there.
  const [at, setAt] = useState({ x: win.slot * 26, y: win.slot * 14 });
  // Off the screen: on its way out for good, or tucked into its icon.
  const away = win.closing || win.min;

  // Where its icon is, measured as it opens and again as it leaves.
  useLayoutEffect(() => {
    const from = originOf(win.id);
    if (from) setOrigin(from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [away]);

  useEffect(() => {
    const el = ref.current;
    const zoom = el.getAnimations().find((a) => a.animationName === "appIn");
    const opening = zoom?.playState === "running";
    if (!away) {
      // Back on screen. If the opening zoom was played backwards to put it away, play it forwards again.
      if (zoom) {
        zoom.playbackRate = 1;
        if (!opening && zoom.currentTime === 0) zoom.play();
      }
      setPhase("in");
      return;
    }
    // Sent away before it finished opening: play the opening backwards from where it is, rather than
    // jumping to full size for a frame and then shrinking.
    if (opening) zoom.playbackRate = -2;
    else setPhase("out");
    // The keyboard goes back to the icon it came from when the last window leaves.
    if (alone && el.contains(document.activeElement)) screenRef.current?.querySelector(`[data-app="${win.id}"] :is(button,a)`)?.focus({ preventScroll: true });
    if (!win.closing) return;
    const t = setTimeout(() => onGone(win.id), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [away, win.closing]);

  // The keyboard follows the window in front: opening one, or bringing one forward, moves focus into it.
  useEffect(() => {
    const el = ref.current;
    if (front && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
  }, [front]);

  // Dragging by the title bar. The window may slide partly off the screen, but never so far that its bar
  // can't be reached, and never under the menu bar. A window that fills the screen, or the phone, stays put.
  const drag = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const b = screenRef.current.getBoundingClientRect();
    const top = b.top + (screenRef.current.querySelector(".mb")?.offsetHeight ?? 0);
    const start = { px: e.clientX, py: e.clientY, ...at };
    let next = at;
    const move = (ev) => {
      next = {
        x: start.x + clamp(ev.clientX - start.px, b.left - r.right + 120, b.right - r.left - 120),
        y: start.y + clamp(ev.clientY - start.py, top - r.top, b.bottom - r.top - 110),
      };
      el.style.setProperty("--dx", `${next.x}px`);
      el.style.setProperty("--dy", `${next.y}px`);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setAt(next);
    };
    e.preventDefault();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  // Any press brings the window forward. A press on its title bar (but not on a light) also starts a drag.
  // It's read from where the press landed, not from the bar itself, because a window behind another has its
  // insides switched off and the press arrives on the frame.
  const onPointerDown = (e) => {
    onFocus(win.id);
    if (e.button !== 0 || win.max || onPhone() || e.target.closest("button")) return;
    if (e.clientY <= ref.current.firstElementChild.getBoundingClientRect().bottom) drag(e);
  };

  return (
    <section
      className="app"
      ref={ref}
      tabIndex={-1}
      inert={away}
      data-id={win.id}
      data-wide={wide ? "" : undefined}
      data-front={front ? "" : undefined}
      data-max={win.max ? "" : undefined}
      data-phase={phase}
      aria-label={name}
      style={{ zIndex: win.z, "--ox": origin.x, "--oy": origin.y, "--dx": win.max ? "0px" : `${at.x}px`, "--dy": win.max ? "0px" : `${at.y}px` }}
      onPointerDown={onPointerDown}
    >
      {/* Only the window in front can be typed in, tabbed through or clicked; the rest wait to be brought forward. */}
      <header className="app__bar" inert={!front} onDoubleClick={(e) => !e.target.closest("button") && !onPhone() && onMax(win.id)}>
        <button type="button" className="app__close" onClick={() => onClose(win.id)} aria-label={`Close ${name}`} />
        <button type="button" className="app__min" onClick={() => onMin(win.id)} aria-label={`Minimise ${name}`} />
        <button type="button" className="app__max" onClick={() => onMax(win.id)} aria-label={win.max ? `Shrink ${name} back` : `Fill the screen with ${name}`} />
        <p>{name}</p>
      </header>
      <div className={flush ? "app__body app__body--flush" : "app__body"} inert={!front}>
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </section>
  );
}

export default function Stage() {
  const [theme, setTheme] = useStageTheme();
  // The open windows, in the order they were opened. "z" says which is in front, "slot" where a new one first
  // sits, "min" that it's tucked into its icon, "max" that it fills the screen, and a closing one stays in the
  // list until its zoom has finished.
  const [wins, setWins] = useState(() => {
    const view = readRoute().view;
    return view === "home" ? [] : [{ id: view, z: 1, slot: 0, closing: false, min: false, max: false }];
  });
  // The windows on screen: not on their way out, and not minimised.
  const live = wins.filter((w) => !w.closing && !w.min);
  const frontWin = live.reduce((top, w) => (top && top.z > w.z ? top : w), null);
  // The window in front, which is the one the address bar names and the keys act on; "home" when none is open.
  const viewId = frontWin?.id ?? "home";
  // A minimised app is still open: its dock icon keeps its dot, and clicking it brings the window back.
  const isOpen = (id) => wins.some((w) => w.id === id && !w.closing);
  const raised = (ws, id) => {
    const top = Math.max(0, ...ws.map((w) => w.z));
    return ws.map((w) => (w.id === id ? { ...w, z: w.z === top ? top : top + 1, closing: false, min: false } : w));
  };
  // Opening an app that is already open brings its window to the front (and back out of its icon). Opening
  // anything also puts away the first-visit hint and any menu or dock folder that was showing.
  const openWin = (id) => {
    setNudge(false);
    store("stage-nudge", "1");
    setStack(null);
    setMenu(null);
    if (MINI.some((m) => m.id === id)) (id === "obsidian" ? loadObsidian : loadMini)();
    setWins((ws) => {
      if (ws.some((w) => w.id === id)) return raised(ws, id);
      const used = ws.filter((w) => !w.closing).map((w) => w.slot);
      const slot = [0, 1, 2, 3].find((n) => !used.includes(n)) ?? ws.length % 4;
      return [...ws, { id, z: Math.max(0, ...ws.map((w) => w.z)) + 1, slot, closing: false, min: false, max: false }];
    });
  };
  const raiseWin = (id) => setWins((ws) => (ws.some((w) => w.id === id && !w.closing && !w.min && w.z < Math.max(...ws.map((x) => x.z))) ? raised(ws, id) : ws));
  const minWin = (id) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, min: true } : w)));
  const maxWin = (id) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, max: !w.max } : w)));
  const closeWin = (id) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, closing: true } : w)));
  const closeAll = () => setWins((ws) => ws.map((w) => ({ ...w, closing: true })));
  const dropWin = (id) => setWins((ws) => ws.filter((w) => !(w.id === id && w.closing)));
  // Projects reopens on the project that was last on screen, even on a later visit.
  const [index, setIndex] = useState(() => readRoute().index ?? Math.max(0, PROJECT_SLUGS.indexOf(stored("stage-project"))));
  // A first-time visitor gets one quiet line above the dock until they open something.
  const [nudge, setNudge] = useState(() => stored("stage-nudge") !== "1" && readRoute().view === "home");
  const [musicSlot, setMusicSlot] = useState(null);
  const openCount = useRef(null);
  const [hint, setHint] = useState(null);
  const lastView = useRef(null);
  const listRef = useRef(null);
  const stageRef = useRef(null);
  const screenRef = useRef(null);
  const touch = useRef(null);
  useAnalytics();

  // The iPod pops up over the desktop from the dock's Music app, and can be dragged anywhere on the screen.
  const [ipodOpen, setIpodOpen] = useState(false);
  const [ipodAt, setIpodAt] = useState({ x: 0, y: 0 });
  // The dock folder whose grid is open, if any, and the menu-bar menu that is.
  const [stack, setStack] = useState(null);
  const [menu, setMenu] = useState(null);
  const menuRef = useRef(null);
  // The note a dock app pops up ("lol"), if one is showing.
  const [alert, setAlert] = useState(null);
  // The folder Finder opens on. The terminal's "open" can send Finder somewhere else.
  const [finderAt, setFinderAt] = useState([]);
  const drive = useMemo(() => makeDrive({ sections: APPS, links: LINKS, photos: BOAT_PHOTOS }), []);
  const dockRef = useRef(null);
  const stackRef = useRef(null);
  const ipwRef = useRef(null);

  // Where a window's icon is, for it to zoom out of and back into. In pixels from the screen's corner (the page's,
  // on a phone, where a window fills the whole page), because a window doesn't fill the screen.
  const originOf = (id) => {
    const screen = screenRef.current;
    const tile = screen?.querySelector(`[data-app="${id}"] :is(.dk__tile,.da__tile,.fi__art,.mb__boat)`);
    if (!tile) return null;
    const s = window.matchMedia("(max-width:760px)").matches ? { left: 0, top: 0 } : screen.getBoundingClientRect();
    const t = tile.getBoundingClientRect();
    return { x: `${(t.left + t.width / 2 - s.left).toFixed(1)}px`, y: `${(t.top + t.height / 2 - s.top).toFixed(1)}px` };
  };

  // A tick as a window opens or closes, skipped for whatever is on screen when the page loads.
  useEffect(() => {
    if (openCount.current !== null && openCount.current !== live.length) tick(live.length > openCount.current);
    openCount.current = live.length;
  }, [live.length]);

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
    // A first-time visitor gets the Welcome note, once: straight away when there is no intro to wait for,
    // otherwise as the intro ends.
    const greet = () => {
      if (stored("stage-welcome") === "1" || readRoute().view !== "home") return;
      store("stage-welcome", "1");
      openWin("welcome");
    };
    if (!mac || readRoute().view !== "home" || (seen && !replay) || window.innerWidth <= 760 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const soon = setTimeout(greet, 500);
      return () => clearTimeout(soon);
    }
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
      greet();
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

  // Keep the address in step with the window in front. Opening the first window adds a history entry; everything
  // after that (another window, the next project) replaces it, so "back" returns to the bare desktop.
  useEffect(() => {
    const target = viewId === "home" ? "" : viewId === "projects" ? `#/projects/${PROJECT_SLUGS[index]}` : `#/${viewId}`;
    const first = lastView.current === null;
    if (window.location.hash !== target) {
      const write = !first && lastView.current === "home" ? "pushState" : "replaceState";
      window.history[write](null, "", target || window.location.pathname + window.location.search);
    }
    lastView.current = viewId;
  }, [viewId, index]);

  useEffect(() => {
    const sync = () => {
      const route = readRoute();
      lastView.current = route.view;
      if (route.view === "home") closeAll();
      else openWin(route.view);
      if (route.index !== null) setIndex(route.index);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  // Escape closes the window in front. When that is Projects, the arrow keys step through the projects.
  useEffect(() => {
    if (viewId === "home" || menu) return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input,textarea,select,.dock")) return;
      if (e.key === "Escape") return closeWin(viewId);
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
  }, [viewId, menu]);

  // A menu closes on a click anywhere else, or on Escape.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenu(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  // Fetch the dock's small apps once the page has gone quiet, so the first one opens without a wait.
  useEffect(() => {
    const warm = () => {
      loadMini();
      loadObsidian();
    };
    const idle = window.requestIdleCallback ? window.requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 2500);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : clearTimeout(idle));
  }, []);

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

  // A dock folder's grid sits above its icon, kept inside the screen; its little point stays on the icon.
  useLayoutEffect(() => {
    const pop = stackRef.current;
    const dock = dockRef.current;
    const icon = dock?.querySelector(`[data-stack="${stack}"] .dk__tile`);
    if (!pop || !icon) return;
    const d = dock.getBoundingClientRect();
    const s = screenRef.current.getBoundingClientRect();
    const i = icon.getBoundingClientRect();
    const middle = i.left + i.width / 2;
    const left = Math.min(Math.max(middle - pop.offsetWidth / 2, s.left + 10), s.right - 10 - pop.offsetWidth);
    pop.style.left = `${left - d.left}px`;
    pop.style.setProperty("--tip", `${middle - left}px`);
  }, [stack]);

  // It closes on a click anywhere else, on Escape, or when an app opens.
  useEffect(() => {
    if (!stack) return;
    const onDown = (e) => {
      if (!e.target.closest?.(".stk,[data-stack]")) setStack(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setStack(null);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [stack]);

  // The pop-up note closes on Escape, as well as on its button.
  useEffect(() => {
    if (!alert) return;
    const onKey = (e) => {
      if (e.key === "Escape") setAlert(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alert]);

  // Opening something from Finder, the terminal or the stand-in Claude: a folder goes to Finder, a project to
  // Projects, an app or file to its own window, and a web location to a new tab.
  const openNode = (node, path = []) => {
    if (node.kind === "folder") {
      setFinderAt(path);
      openWin("finder");
    } else if (node.kind === "project" || node.project !== undefined) {
      setIndex(node.index ?? node.project);
      openWin("projects");
    } else if (node.app) openWin(node.app);
    else if (node.href) window.open(node.href, "_blank", "noopener");
  };

  // Dragging the iPod by its body (not its buttons, links, track list, volume or click wheel). It can't leave the screen, or on a
  // phone the window. It moves by its style while dragged, and its place is kept when let go.
  // A plain DOM listener: the iPod's insides are drawn by the music player through a portal, so React would
  // hand their events to the music player in the left column, not to this window.
  const dragIpod = (e, el) => {
    if (e.button !== 0 || e.target.closest("button,a,input,.ipod__list,.ipod__wheel")) return;
    const r = el.getBoundingClientRect();
    const b = getComputedStyle(el).position === "fixed" ? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight } : screenRef.current.getBoundingClientRect();
    const start = { px: e.clientX, py: e.clientY, ...ipodAt };
    let at = ipodAt;
    const move = (ev) => {
      const dx = Math.min(Math.max(ev.clientX - start.px, b.left - r.left), b.right - r.right);
      const dy = Math.min(Math.max(ev.clientY - start.py, b.top - r.top), b.bottom - r.bottom);
      at = { x: start.x + dx, y: start.y + dy };
      el.style.translate = `${at.x}px ${at.y}px`;
    };
    // Followed on the window, so a quick drag that outruns the iPod still moves it.
    const up = () => {
      el.classList.remove("is-dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setIpodAt(at);
    };
    e.preventDefault();
    el.classList.add("is-dragging");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  useEffect(() => {
    const el = ipwRef.current;
    if (!el) return;
    const onDown = (e) => dragIpod(e, el);
    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  });

  // What goes inside each window.
  const bodyOf = (id) => {
    switch (id) {
      case "projects":
        return <ProjectsApp index={index} setIndex={setIndex} listRef={listRef} />;
      case "experience":
        return <ExperienceApp />;
      case "about":
        return <AboutApp />;
      case "contact":
        return <ContactApp />;
      case "resume":
        return <ResumeApp />;
      case "boat":
        return <BoatFolder />;
      case "sailor":
        return <SailorText />;
      case "welcome":
        return (
          <WelcomeApp
            go={(id) => {
              closeWin("welcome");
              openWin(id);
            }}
          />
        );
      case "obsidian":
        return <Obsidian email={EMAIL} />;
      default:
        // The rest are the dock's small apps, which arrive together in one file of their own.
        return <MiniApp id={id} drive={drive} finderAt={finderAt} email={EMAIL} links={LINKS} more={SAFARI_MORE} onOpen={openNode} onExit={() => closeWin("ghostty")} readText={() => stored("stage-sailor") ?? SAILOR_ORIGINAL} />;
    }
  };
  // The menu bar's menus. Each item says what it does; "on" ticks it and "off" greys it out.
  const menus = [
    {
      id: "file",
      name: "File",
      items: [
        { name: "Close Window", keys: "esc", off: !frontWin, run: () => closeWin(viewId) },
        { name: "Minimise", off: !frontWin, run: () => minWin(viewId) },
        { name: frontWin?.max ? "Shrink Back" : "Fill the Screen", off: !frontWin, run: () => maxWin(viewId) },
        { name: "Close All Windows", off: !wins.length, run: closeAll },
      ],
    },
    { id: "go", name: "Go", items: [...APPS, WELCOME].map((a) => ({ name: a.name, run: () => openWin(a.id) })) },
    { id: "view", name: "View", items: THEMES.map((t) => ({ name: t.name, on: t.id === theme, run: () => setTheme(t.id) })) },
    {
      id: "window",
      name: "Window",
      items: wins.some((w) => !w.closing)
        ? wins.filter((w) => !w.closing).map((w) => ({ name: WINDOWS.find((a) => a.id === w.id).name, on: w === frontWin, run: () => openWin(w.id) }))
        : [{ name: "No windows open", off: true }],
    },
  ];
  const openStack = STACKS.find((s) => s.id === stack);
  const hinting ={ onPointerLeave: () => setHint(null), onBlur: () => setHint(null) };

  return (
    <div className="site stage" ref={stageRef} data-open={wins.length ? "" : undefined}>
      <style>{BASE_CSS + DOCK_CSS + STAGE_CSS}</style>

      <div className="stage__top">
        <header className="stage__head">
          <h1 className="stage__mark">
            <button type="button" onClick={closeAll} aria-label="Perfect Phanitchaleun, back to the desktop">
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
              <button key={a.id} type="button" className={hint === a.id ? "is-hint" : undefined} aria-current={a.id === viewId ? "page" : undefined} onClick={() => openWin(a.id)} data-umami-event={`view-${a.id}`}>
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
            <SoundDock slot={musicSlot} ipod />
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
            <div className="stage__screen" ref={screenRef}>
              {/* the desktop: three slow lights, the clock, the files and the dock */}
              <div className="desk">
                <div className="desk__lights" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                {/* widgets in the top left corner: the clock and the calendar */}
                <div className="desk__widgets">
                  <ClockWidget />
                  <CalendarWidget />
                </div>
                <ul className="desk__files" aria-label="On the desktop">
                  {FILES.map((f) => (
                    <li key={f.id} data-app={f.id}>
                      <button type="button" onClick={() => openWin(f.id)} data-umami-event={`desktop-${f.id}`}>
                        {f.kind === "folder" ? <FolderArt /> : <TextArt />}
                        <b>{f.name}</b>
                      </button>
                    </li>
                  ))}
                </ul>
                {/* the sections, as apps in the middle of the desktop */}
                <ul className="desk__apps" aria-label="Sections">
                  {APPS.map((a) => (
                    <li key={a.id} data-app={a.id}>
                      <button type="button" onClick={() => openWin(a.id)} onPointerEnter={() => setHint(a.id)} onFocus={() => setHint(a.id)} {...hinting} data-umami-event={`home-${a.id}`}>
                        <span className="da__tile">
                          <AppIcon id={a.id} />
                        </span>
                        <b>{a.name}</b>
                      </button>
                    </li>
                  ))}
                </ul>
                {/* the dock, like a Mac's: Finder and Music, my own apps, then two folders */}
                <nav className="dk" aria-label="Dock" ref={dockRef}>
                  {nudge && <p className="dk__nudge">Pick one to open it</p>}
                  <ul className="dk__dock">
                    <li data-app="finder" className={isOpen("finder") ? "is-running" : undefined}>
                      <button type="button" onClick={() => openWin("finder")} data-umami-event="dock-finder">
                        <img className="dk__tile" src="/icons/dock/finder.png" alt="" width="96" height="96" />
                        <b>Finder</b>
                      </button>
                    </li>
                    <li data-app="music" className={ipodOpen ? "is-running" : undefined}>
                      <button type="button" aria-pressed={ipodOpen} onClick={() => setIpodOpen((o) => !o)} data-umami-event="home-music">
                        <span className="dk__tile">
                          <MusicArt />
                        </span>
                        <b>Music</b>
                      </button>
                    </li>
                    <li className="dk__sep" aria-hidden="true" />
                    {DOCK_EXTRAS.map((x) => {
                      const face = (
                        <>
                          <img className="dk__tile" src={`/icons/dock/${x.id}.png`} alt="" width="96" height="96" />
                          <b>{x.name}</b>
                        </>
                      );
                      return (
                        <li key={x.id} data-app={x.app ? x.id : undefined} className={isOpen(x.id) ? "is-running" : undefined}>
                          {x.href ? (
                            <a href={x.href} target="_blank" rel="noreferrer" data-umami-event={`dock-${x.id}`}>
                              {face}
                            </a>
                          ) : (
                            <button type="button" onClick={() => (x.app ? openWin(x.id) : setAlert(x))} data-umami-event={`dock-${x.id}`}>
                              {face}
                            </button>
                          )}
                        </li>
                      );
                    })}
                    <li className="dk__sep" aria-hidden="true" />
                    {STACKS.map((f) => (
                      <li key={f.id} data-stack={f.id}>
                        <button type="button" aria-expanded={stack === f.id} onClick={() => setStack((open) => (open === f.id ? null : f.id))} data-umami-event={`stack-${f.id}`}>
                          <span className="dk__tile dk__tile--folder">
                            <FolderArt />
                          </span>
                          <b>{f.name}</b>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {openStack && (
                    <div className="stk" ref={stackRef} role="dialog" aria-label={openStack.name}>
                      <p className="stk__title">{openStack.name}</p>
                      {openStack.items.length ? (
                        <ul className="stk__grid" style={{ "--n": openStack.items.length }}>
                          {openStack.items.map((l) => (
                            <li key={l.id}>
                              <a href={l.href} target="_blank" rel="noreferrer" data-umami-event={`stack-${l.id}`}>
                                <img src={l.icon} alt="" width="64" height="64" />
                                <b>{l.name}</b>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="stk__empty">Nothing in here yet.</p>
                      )}
                    </div>
                  )}
                </nav>
              </div>

              {/* the open windows; the one clicked last is in front */}
              <div className="wins">
                {wins.map((w) => {
                  const app = WINDOWS.find((a) => a.id === w.id);
                  return (
                    <AppWindow key={w.id} win={w} name={app.name} wide={APPS.includes(app)} flush={MINI.includes(app)} front={w === frontWin} alone={!frontWin} originOf={originOf} screenRef={screenRef} onFocus={raiseWin} onClose={closeWin} onMin={minWin} onMax={maxWin} onGone={dropWin}>
                      {bodyOf(w.id)}
                    </AppWindow>
                  );
                })}
              </div>

              {/* the menu bar: the boat opens Welcome, then the app in front, working menus, and San Diego's time */}
              <div className="mb" ref={menuRef}>
                <span data-app="welcome">
                  <button type="button" className="mb__logo" onClick={() => openWin("welcome")} aria-label="About this laptop">
                    <svg className="mb__boat" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M11.500 3v12.500H4.500zM13 6.500v9h5.500zM2.500 17.500h19l-2.800 3.500H5.300z" />
                    </svg>
                  </button>
                </span>
                <b className="mb__app">{frontWin ? WINDOWS.find((a) => a.id === viewId).name : "Desktop"}</b>
                {menus.map((m) => (
                  <div key={m.id} className="mb__menu">
                    <button type="button" aria-haspopup="menu" aria-expanded={menu === m.id} onClick={() => setMenu(menu === m.id ? null : m.id)} onPointerEnter={() => menu && setMenu(m.id)}>
                      {m.name}
                    </button>
                    {menu === m.id && (
                      <ul role="menu" aria-label={m.name}>
                        {m.items.map((item) => (
                          <li key={item.name} role="none">
                            <button
                              type="button"
                              role={item.on === undefined ? "menuitem" : "menuitemradio"}
                              aria-checked={item.on}
                              disabled={item.off}
                              onClick={() => {
                                setMenu(null);
                                item.run();
                              }}
                            >
                              <i aria-hidden="true">{item.on ? "✓" : ""}</i>
                              {item.name}
                              {item.keys && <kbd>{item.keys}</kbd>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <MenuClock />
              </div>

              {/* a note popped up by a dock app */}
              {alert && (
                <div className="al" role="alertdialog" aria-label={`${alert.name}: ${alert.alert}`}>
                  <img src={`/icons/dock/${alert.id}.png`} alt="" width="64" height="64" />
                  <p>{alert.alert}</p>
                  <span>{alert.name}</span>
                  <button type="button" autoFocus onClick={() => setAlert(null)}>
                    OK
                  </button>
                </div>
              )}

              {/* the iPod, popped up from the dock's Music app. Drag it by its body to move it. */}
              {ipodOpen && (
                <div className="ipw" ref={ipwRef} style={{ translate: `${ipodAt.x}px ${ipodAt.y}px` }}>
                  <button type="button" className="ipw__close" onClick={() => setIpodOpen(false)} aria-label="Close the music player" />
                  <div ref={setMusicSlot} />
                </div>
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
/* liquid glass: a thin tint, a strong blur and saturation behind it, and a bright rim where light catches the edge */
:root[data-stage]{--glass:rgba(255,255,255,.2);--rim:rgba(255,255,255,.85);--rim-soft:rgba(255,255,255,.35);--glass-edge:rgba(0,0,0,.1);}
:root[data-stage]:is([data-theme="black"],[data-theme="mustard"]){--glass:rgba(60,60,60,.22);--rim:rgba(255,255,255,.3);--rim-soft:rgba(255,255,255,.1);--glass-edge:rgba(0,0,0,.45);}
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
.stage__nav nav{display:none;flex-direction:column;align-items:flex-start;} /* hidden for now: display:flex brings it back */
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
.stage__archive{align-self:flex-start;margin-top:8px;font-family:var(--font-body);font-size:14px;font-weight:500;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;}

/* ---- the laptop: always on the page, in every section. It keeps a laptop's proportions (about 16:10) and
   is sized to fit the room it has, so a very wide window gets a bigger laptop, not a stretched one. ---- */
.stage__main{grid-column:2;grid-row:1/-1;min-height:0;min-width:0;display:grid;place-items:center;container-type:size;margin:26px var(--pad) 26px 0;}
.stage__mac{
  /* the screen's width, near enough, and the dock's icon size from it, so the whole dock always fits */
  --sw:min(100cqw,156cqh);--ic:clamp(26px,calc(var(--sw) * .046),60px);--desk-pad:clamp(16px,2.6vw,38px);--mb:clamp(22px,calc(var(--ic) * .52),28px);
  position:relative;width:min(100cqw,100cqh * 1.56);aspect-ratio:1.56;min-height:0;min-width:0;transform-origin:50% 100%;}
.stage__lid{
  position:relative;height:100%;padding:11px;border-radius:var(--round);background:#161617;transform-origin:50% 100%;
  /* no light inner ring and no light screen backing: either one shows as pale pixels where the corners curve */
  box-shadow:0 26px 50px -30px color-mix(in srgb,var(--shadow) 70%,transparent);
  outline:1px solid color-mix(in srgb,var(--text) 18%,transparent);outline-offset:0;
}
.stage__lid::before{content:"";position:absolute;z-index:1;top:3.5px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:#3a3a3d;}
.stage__deck{display:none;}
.stage__screen{position:relative;height:100%;border-radius:8px;overflow:hidden;background:var(--bg);isolation:isolate;font-family:var(--font-body);color:var(--text);}
/* Safari can drop the screen's own background for a few frames while an app zooms in or out (the blurred
   lights and the dock's backdrop blur are layers of their own), and the dark bezel shows through. The same
   colour painted again on a layer of its own stays put. */
.stage__screen::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--bg);transform:translateZ(0);pointer-events:none;}

/* ---- the desktop: three lights drifting like a lava lamp, and the dock ---- */
.desk{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:calc(var(--desk-pad) + var(--mb)) var(--desk-pad) var(--desk-pad);}
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
  position:absolute;z-index:1;top:calc(var(--mb) + clamp(14px,2.2vw,30px));right:clamp(14px,2.2vw,30px);
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

/* the sections, as apps in the middle of the desktop */
.stage .desk__apps{position:relative;z-index:1;list-style:none;margin:auto 0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(4px,1vw,16px);}
.desk__apps button{
  display:flex;flex-direction:column;align-items:center;gap:8px;width:calc(var(--ic) * 2.1);padding:10px 4px 7px;border:none;border-radius:14px;
  background:none;cursor:pointer;transition:background .2s var(--ease);
}
.da__tile{
  display:grid;place-items:center;width:calc(var(--ic) * 1.25);aspect-ratio:1;border-radius:23%;background:var(--bg);
  box-shadow:0 0 0 .5px color-mix(in srgb,var(--text) 14%,transparent),0 12px 22px -12px color-mix(in srgb,var(--shadow) 60%,transparent);
  transition:scale .25s var(--ease);
}
.da__tile svg{width:44%;height:auto;}
.desk__apps b{font-weight:500;font-size:clamp(11.5px,1vw,13.5px);line-height:1.35;white-space:nowrap;}
.desk__apps button:is(:hover,:focus-visible){background:color-mix(in srgb,var(--text) 7%,transparent);}
.desk__apps button:is(:hover,:focus-visible) .da__tile{scale:1.06;}
.desk__apps button:active .da__tile{scale:.94;}

/* widgets in the top left corner: the clock and the calendar, sized together from --wg */
.desk__widgets{--wg:clamp(100px,10vw,150px);position:relative;z-index:1;align-self:flex-start;display:flex;align-items:flex-start;gap:calc(var(--wg) * .12);}
.wg{flex:none;width:var(--wg);height:var(--wg);min-height:0;overflow:hidden;}
.wg--clock{
  position:relative;padding:calc(var(--wg) * .05);border-radius:23%;
  background:var(--glass);backdrop-filter:blur(10px) saturate(190%) brightness(1.05);-webkit-backdrop-filter:blur(10px) saturate(190%) brightness(1.05);
  box-shadow:inset 0 1.5px 0 var(--rim),inset 0 -1px 0 var(--rim-soft),inset 0 0 0 1px var(--rim-soft),inset 0 -10px 24px -14px rgba(255,255,255,.55),
    0 0 0 .5px var(--glass-edge),0 18px 36px -22px color-mix(in srgb,var(--shadow) 55%,transparent);
}
/* the light on the glass: a soft sheen across the top */
.wg--clock::before{
  content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(160deg,rgba(255,255,255,.5),rgba(255,255,255,0) 46%);opacity:.7;
}
.wg--clock svg{position:relative;display:block;width:100%;height:100%;overflow:visible;}
.wg__tick{stroke:color-mix(in srgb,var(--text) 30%,transparent);stroke-width:.6;stroke-linecap:round;}
.wg__tick--hour{stroke:var(--text);stroke-width:1.2;}
.wg__num{font-family:var(--font-body);font-size:9px;font-weight:500;fill:var(--text);}
.wg__hand{stroke:var(--text);stroke-linecap:round;}
.wg__hand-dot{fill:var(--text);stroke:var(--bg);stroke-width:.8;}
.wg__second{stroke:#ff9500;stroke-width:.9;stroke-linecap:round;}
.wg__second-dot{fill:#ff9500;}
/* the calendar: a nearly solid card exactly the size of the clock, the month over a grid of its days */
.wg--cal{
  display:flex;flex-direction:column;padding:calc(var(--wg) * .085) calc(var(--wg) * .08) calc(var(--wg) * .06);border-radius:23%;
  font-size:calc(var(--wg) * .068);line-height:1;
  background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px) saturate(170%);-webkit-backdrop-filter:blur(14px) saturate(170%);
  box-shadow:inset 0 1px 0 var(--rim-soft),0 0 0 .5px var(--glass-edge),0 18px 36px -22px color-mix(in srgb,var(--shadow) 55%,transparent);
}
.wg--cal p{flex:none;margin:0 0 .55em .35em;font-size:1.08em;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#ff3b30;}
.stage .wg--cal ol{flex:1;min-height:0;list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);place-items:center;font-weight:500;font-variant-numeric:tabular-nums;}
.wg--cal li{display:grid;place-items:center;width:1.55em;height:1.55em;border-radius:50%;}
.wg__dow{font-size:.86em;font-weight:600;color:var(--muted);}
.wg--cal .is-today{background:#ff3b30;color:#fff;font-weight:700;}

/* the iPod: white body, a small screen, a click wheel. It keeps its own colours in every theme, like a real one.
   It pops up in the middle of the screen from the dock's Music app, floats over everything, and drags anywhere. */
.ipw{
  --wg:clamp(170px,calc(var(--sw) * .21),280px);
  position:absolute;z-index:6;inset:0 0 calc(var(--ic) * 1.4) 0;margin:auto;width:calc(var(--wg) * .78);height:fit-content;
  animation:ipwIn .35s cubic-bezier(.2,.85,.2,1) both;
}
@keyframes ipwIn{from{opacity:0;scale:.8;}}
.ipw .ipod{cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;}
.ipw.is-dragging .ipod{cursor:grabbing;}
.ipw.is-dragging{filter:drop-shadow(0 18px 22px rgba(0,0,0,.18));}
/* the close button sits on the iPod's corner, the way it does on a widget being edited */
.ipw__close{
  position:absolute;z-index:1;top:-8px;left:-8px;width:22px;height:22px;padding:0;border:none;border-radius:50%;cursor:pointer;
  background:rgba(60,60,60,.82);box-shadow:0 0 0 1px rgba(255,255,255,.6);opacity:0;scale:.7;transition:opacity .2s var(--ease),scale .2s var(--ease);
}
.ipw__close::before,.ipw__close::after{content:"";position:absolute;left:6px;top:10.25px;width:10px;height:1.5px;border-radius:1px;background:#fff;rotate:45deg;}
.ipw__close::after{rotate:-45deg;}
.ipw:is(:hover,:focus-within) .ipw__close{opacity:1;scale:1;}
@media (hover:none){.ipw__close{opacity:1;scale:1;}}
.ipod{
  display:flex;flex-direction:column;align-items:center;gap:calc(var(--wg) * .065);padding:calc(var(--wg) * .065);
  border-radius:calc(var(--wg) * .13);font-family:var(--font-body);font-size:calc(var(--wg) * .068);line-height:1.25;color:#111;
  background:linear-gradient(160deg,#fdfdfc,#e2e2df);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.85),0 0 0 1px rgba(0,0,0,.09),0 18px 36px -22px color-mix(in srgb,var(--shadow) 65%,transparent);
}
.ipod__screen{display:flex;flex-direction:column;width:100%;aspect-ratio:1.2;overflow:hidden;border-radius:calc(var(--wg) * .025);background:#fff;box-shadow:inset 0 0 0 1px rgba(0,0,0,.2);}
.ipod__head{margin:0;flex:none;display:flex;justify-content:space-between;align-items:center;padding:.22em .5em;font-size:.8em;font-weight:600;background:linear-gradient(#fbfbfb,#d8dce2);border-bottom:1px solid rgba(0,0,0,.12);}
.ipod__eq{display:inline-flex;align-items:flex-end;gap:1px;height:.85em;}
.ipod__eq i{width:2px;height:30%;border-radius:1px;background:#2f76e0;}
.ipod__eq.is-playing i{animation:ipodEq .8s ease-in-out infinite alternate;}
.ipod__eq.is-playing i:nth-child(2){animation-delay:-.3s;}
.ipod__eq.is-playing i:nth-child(3){animation-delay:-.55s;}
@keyframes ipodEq{from{height:25%;}to{height:100%;}}
.ipod__now{display:flex;align-items:center;gap:.5em;min-width:0;padding:.55em .5em .2em;}
.ipod__now img{flex:none;width:2.8em;height:2.8em;border-radius:.2em;object-fit:cover;}
.ipod__now div{display:flex;flex-direction:column;min-width:0;}
.ipod__title{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#111;}
.ipod__artist{font-size:.86em;color:#6b6b68;}
.ipod__title:hover,.ipod__artist:hover{text-decoration:underline;}
.ipod__time{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:.25em 0;padding:0 .5em .35em;font-size:.7em;color:#555;font-variant-numeric:tabular-nums;}
.ipod__time span:last-child{text-align:right;}
.ipod__bar{grid-column:1/-1;height:.5em;border-radius:1em;background:linear-gradient(to right,#3b86ec var(--p),#e6e8eb var(--p));box-shadow:inset 0 0 0 1px rgba(0,0,0,.1);}
.ipod__status{margin:auto .5em .35em;font-size:.72em;color:#666;}
.ipod__status a{text-decoration:underline;}
/* the volume: a speaker that mutes, and a bar to drag. Turning the click wheel moves the same bar. */
.ipod__vol{flex:none;display:flex;align-items:center;gap:.45em;padding:0 .5em .5em;font-size:.8em;color:#666;}
.ipod__vol button{flex:none;display:grid;place-items:center;width:1.25em;height:1.25em;padding:0;border:none;background:none;cursor:pointer;color:inherit;}
.ipod__vol button:is(:hover,:focus-visible){color:#111;outline:none;}
.ipod__vol svg{width:1.25em;height:1.25em;}
.ipod__vol input{
  flex:1;min-width:0;height:.5em;margin:0;appearance:none;-webkit-appearance:none;border-radius:1em;cursor:pointer;outline:none;
  background:linear-gradient(to right,#8d929b var(--p),#e6e8eb var(--p));box-shadow:inset 0 0 0 1px rgba(0,0,0,.1);
}
.ipod__vol input::-webkit-slider-thumb{-webkit-appearance:none;width:.95em;height:.95em;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 1px 2px rgba(0,0,0,.25);}
.ipod__vol input::-moz-range-thumb{width:.95em;height:.95em;border:none;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 1px 2px rgba(0,0,0,.25);}
.ipod__vol input:focus-visible{box-shadow:inset 0 0 0 1px rgba(0,0,0,.1),0 0 0 2px #2f76e0;}
.stage .ipod__list{flex:1;list-style:none;margin:0;padding:0;overflow-y:auto;scrollbar-width:none;}
.ipod__list button{
  display:block;width:100%;padding:.24em .5em;border:none;background:none;cursor:pointer;text-align:left;
  font-size:.84em;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.ipod__list button:is(:hover,:focus-visible,[aria-current]){background:linear-gradient(#5ea3f6,#2f76e0);color:#fff;outline:none;}
.ipod__wheel{position:relative;width:80%;aspect-ratio:1;border-radius:50%;background:linear-gradient(#f2f2f0,#dededb);box-shadow:inset 0 1px 2px rgba(0,0,0,.12),0 0 0 1px rgba(0,0,0,.06);}
.ipod__wheel button{position:absolute;display:grid;place-items:center;padding:0;border:none;background:none;cursor:pointer;color:#9a9a96;transition:color .15s;}
.ipod__wheel button:is(:hover,:focus-visible){color:#2a2a2a;outline:none;}
.ipod__wheel svg{width:1em;height:1em;}
.stage .ipod__menu{top:2%;left:28%;width:44%;height:26%;font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
.ipod__menu[aria-pressed="true"]{color:#2a2a2a;}
.ipod__prev{left:2%;top:28%;width:26%;height:44%;}
.ipod__next{right:2%;top:28%;width:26%;height:44%;}
.ipod__pp{bottom:2%;left:28%;width:44%;height:26%;}
.ipod__wheel .ipod__center{
  left:32%;top:32%;width:36%;height:36%;border-radius:50%;background:linear-gradient(#fefefd,#eaeae7);
  box-shadow:0 0 0 1px rgba(0,0,0,.09),0 1px 2px rgba(0,0,0,.12);
}
.ipod__wheel .ipod__center:active{background:#e2e2df;}
.ipod__wheel .ipod__center:focus-visible{box-shadow:0 0 0 2px #2f76e0;}

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

/* ---- the dock: a bar of liquid glass, the icons with no names under them; a name shows above an icon while it's
   pointed at, a dot under an app that's open, and a line between Mac's own groups ---- */
.dk{position:relative;z-index:2;margin-top:auto;display:flex;flex-direction:column;align-items:center;}
.stage .dk__dock{
  position:relative;list-style:none;margin:0;display:flex;align-items:center;
  padding:calc(var(--ic) * .17);gap:calc(var(--ic) * .14);border-radius:calc(var(--ic) * .48);
  background:var(--glass);
  backdrop-filter:blur(8px) saturate(200%) brightness(1.06);-webkit-backdrop-filter:blur(8px) saturate(200%) brightness(1.06);
  box-shadow:
    inset 0 1.5px 0 var(--rim),inset 0 -1px 0 var(--rim-soft),inset 1px 0 0 var(--rim-soft),inset -1px 0 0 var(--rim-soft),
    inset 0 -14px 28px -18px rgba(255,255,255,.5),
    0 0 0 .5px var(--glass-edge),0 14px 34px -14px color-mix(in srgb,var(--shadow) 40%,transparent);
}
/* the sheen: light caught across the top of the glass */
.stage .dk__dock::before{
  content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.32),rgba(255,255,255,0) 52%);opacity:.8;
}
.dk__dock li{position:relative;display:flex;}
.dk__dock :is(button,a){position:relative;display:flex;flex-direction:column;align-items:center;padding:0;border:none;background:none;cursor:pointer;color:inherit;text-decoration:none;transition:translate .3s var(--ease);}
.dk__tile{
  display:grid;place-items:center;width:var(--ic);aspect-ratio:1;border-radius:23%;background:var(--bg);
  box-shadow:0 0 0 .5px color-mix(in srgb,var(--text) 14%,transparent),0 6px 12px -8px color-mix(in srgb,var(--shadow) 60%,transparent);
  transition:scale .3s var(--ease);
}
/* drawn tiles sit a little inside their slot, matching the margin real Mac icons have around them */
span.dk__tile{width:calc(var(--ic) * .82);margin:calc(var(--ic) * .09);}
.dk__tile svg{width:46%;height:auto;}
.dk__tile svg[viewBox="0 0 64 64"]{width:82%;}
/* pictures of real Mac icons carry their own shape and shadow */
img.dk__tile{display:block;height:auto;border-radius:0;background:none;box-shadow:none;}
span.dk__tile--folder{width:calc(var(--ic) * .9);margin:calc(var(--ic) * .05);background:none;box-shadow:none;}
.dk__tile--folder .fi__art{width:100%;filter:drop-shadow(0 4px 5px color-mix(in srgb,var(--shadow) 22%,transparent));}
.dk__sep{align-self:stretch;width:1px;margin:calc(var(--ic) * .06) calc(var(--ic) * .04);background:color-mix(in srgb,var(--text) 22%,transparent);}
/* the name: a small glass label above the icon */
.dk__dock b{
  position:absolute;bottom:calc(100% + var(--ic) * .3);left:50%;translate:-50% 4px;padding:4px 10px;border-radius:8px;
  font-weight:500;font-size:12.5px;line-height:1.3;white-space:nowrap;pointer-events:none;opacity:0;
  background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(12px) saturate(180%);-webkit-backdrop-filter:blur(12px) saturate(180%);
  box-shadow:inset 0 1px 0 var(--rim-soft),0 0 0 .5px var(--glass-edge),0 6px 16px -8px color-mix(in srgb,var(--shadow) 50%,transparent);
  transition:opacity .15s var(--ease),translate .2s var(--ease);
}
.dk__dock :is(button,a):is(:hover,:focus-visible):not([aria-expanded="true"]) b{opacity:1;translate:-50% 0;}
.dk__dock .is-running::after{
  content:"";position:absolute;left:50%;bottom:calc(var(--ic) * -.13);width:4px;height:4px;margin-left:-2px;border-radius:50%;
  background:color-mix(in srgb,var(--text) 75%,transparent);
}
.dk__nudge{
  margin:0 0 14px;text-align:center;font-size:13.5px;font-weight:500;color:color-mix(in srgb,var(--text) 70%,transparent);
  animation:nudge 9s var(--ease) 1.6s both;
}
@keyframes nudge{0%{opacity:0;translate:0 6px;}8%,78%{opacity:1;translate:0 0;}100%{opacity:0;translate:0 0;}}
.dk__dock :is(button,a):is(:hover,:focus-visible){translate:0 calc(var(--ic) * -.14);}
.dk__dock :is(button,a):active .dk__tile{scale:.92;}

/* ---- a dock folder, open: a grid of its apps on glass, above its icon, pointing down at it ---- */
.stk{
  position:absolute;bottom:calc(100% + var(--ic) * .28);left:0;width:max-content;max-width:calc(var(--sw) - 40px);
  padding:14px 14px 12px;border-radius:18px;transform-origin:var(--tip,50%) 100%;
  background:color-mix(in srgb,var(--bg) 62%,transparent);
  backdrop-filter:blur(22px) saturate(190%);-webkit-backdrop-filter:blur(22px) saturate(190%);
  box-shadow:inset 0 1px 0 var(--rim),inset 0 0 0 1px var(--rim-soft),0 0 0 .5px var(--glass-edge),0 24px 50px -20px color-mix(in srgb,var(--shadow) 55%,transparent);
  animation:stkIn .28s cubic-bezier(.2,.85,.2,1) both;
}
.stk::after{
  content:"";position:absolute;top:100%;left:var(--tip,50%);width:16px;height:9px;margin-left:-8px;
  clip-path:polygon(0 0,100% 0,50% 100%);background:color-mix(in srgb,var(--bg) 62%,transparent);
}
@keyframes stkIn{from{opacity:0;scale:.85;}}
.stk__title{margin:0 4px 10px;font-size:13px;font-weight:600;}
.stage .stk__grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(min(5,var(--n,5)),auto);gap:6px 4px;}
.stk__grid a{
  display:flex;flex-direction:column;align-items:center;gap:6px;width:clamp(76px,7vw,92px);padding:8px 4px 6px;border-radius:10px;
  color:var(--text);text-decoration:none;transition:background .2s var(--ease);
}
.stk__grid img{display:block;width:clamp(44px,4.4vw,56px);height:auto;aspect-ratio:1;border-radius:23%;transition:scale .25s var(--ease);}
.stk__grid img[src$=".png"]{border-radius:0;}
.stk__grid b{font-weight:500;font-size:12px;line-height:1.3;white-space:nowrap;}
.stk__grid a:is(:hover,:focus-visible){background:color-mix(in srgb,var(--text) 9%,transparent);}
.stk__grid a:active img{scale:.93;}
.stk__empty{margin:6px 4px 4px;min-width:170px;font-size:13px;color:var(--muted);}

/* ---- an open app: a window that grows out of its icon and shrinks back into it. It sits in the middle of the
   screen, under the dock, which stays in sight and in use. --win-t and --win-l are its gaps from the screen's
   top and sides, in lengths (not percentages), because the zoom's starting point is worked out from them. ---- */
/* the layer the windows live on: above the desktop's icons, below the dock. Each window's own z-index (set as
   it is opened or clicked) only orders it among the other windows. */
.wins{position:absolute;inset:0;z-index:1;pointer-events:none;}
.app{
  --win-t:calc(var(--mb) + clamp(8px,1.5vw,20px));--win-l:clamp(28px,9vw,170px);--win-r:12px;
  position:absolute;inset:var(--win-t) var(--win-l) calc(var(--desk-pad) + var(--ic) * 1.34 + 56px);pointer-events:auto;
  display:flex;flex-direction:column;background:var(--bg);overflow:hidden;
  box-shadow:0 0 0 .5px color-mix(in srgb,var(--text) 22%,transparent),0 20px 44px -22px color-mix(in srgb,var(--shadow) 45%,transparent);
  /* --dx and --dy are how far it has been dragged (or stepped aside as it opened) */
  translate:var(--dx,0px) var(--dy,0px);
  transform-origin:calc(var(--ox,50%) - var(--win-l) - var(--dx,0px)) calc(var(--oy,100%) - var(--win-t) - var(--dy,0px));
  animation:appIn .5s cubic-bezier(.2,.85,.2,1) both;transition:inset .28s var(--ease);outline:none;
}
/* the window in front casts the deeper shadow; the ones behind it grey their lights, like a Mac's */
.app[data-front]{box-shadow:0 0 0 .5px color-mix(in srgb,var(--text) 26%,transparent),0 34px 70px -22px color-mix(in srgb,var(--shadow) 65%,transparent);}
.app:not([data-front]) :is(.app__close,.app__min,.app__max){background:rgba(140,140,140,.5);}
/* the five sections hold more, so their window is wider and taller */
.app[data-wide]{--win-t:calc(var(--mb) + clamp(6px,.8vw,12px));--win-l:clamp(14px,3.2vw,60px);}
/* green: the window takes the whole screen between the menu bar and the dock */
.stage .app[data-max]{--win-t:var(--mb);--win-l:0px;--win-r:0px;inset:var(--mb) 0 calc(var(--desk-pad) + var(--ic) * 1.34 + 10px);}
.app[data-phase="out"]{animation:appOut .3s cubic-bezier(.55,0,.85,.35) both;}
@keyframes appIn{from{opacity:0;transform:scale(.06);border-radius:26%;}40%{opacity:1;}to{opacity:1;transform:none;border-radius:var(--win-r,0);}}
@keyframes appOut{from{opacity:1;transform:none;border-radius:var(--win-r,0);}to{opacity:0;transform:scale(.06);border-radius:26%;}}
/* the yellow and green lights, and the sign each light shows while the pointer is on the bar */
.app__min,.app__max{position:absolute;top:50%;width:12px;height:12px;margin-top:-6px;padding:0;border:none;border-radius:50%;cursor:pointer;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.18);transition:scale .2s var(--ease);}
.app__min{left:34px;background:#febc2e;}
.app__max{left:54px;background:#28c840;}
:is(.app__min,.app__max):is(:hover,:focus-visible){scale:1.2;}
:is(.app__close,.app__min,.app__max)::after{position:absolute;inset:0;display:grid;place-items:center;font:700 10px/1 var(--font-body);color:rgba(0,0,0,.6);opacity:0;transition:opacity .15s;}
.app__close::after{content:"×";}
.app__min::after{content:"−";}
.app__max::after{content:"+";}
.app[data-front] .app__bar:hover :is(.app__close,.app__min,.app__max)::after{opacity:1;}
/* the dock's small apps fill their window edge to edge; a few keep their own colours in every theme */
.app .app__body--flush{padding:0;overflow:hidden;}
.app .app__body--flush > *{height:100%;min-height:0;}
.app:is([data-id="ghostty"],[data-id="welcome"]){--win-l:clamp(28px,calc(var(--sw) * .2),260px);--win-t:calc(var(--mb) + clamp(14px,calc(var(--sw) * .06),80px));}
.app[data-id="ghostty"] .app__bar{background:#1d1e26;border-color:#0e0f13;}
.app[data-id="vscodium"] .app__bar{background:#181818;border-color:#2b2b2b;}
.app[data-id="obsidian"] .app__bar{background:#262626;border-color:#363636;}
.app[data-id="slack"] .app__bar{background:#350d36;border-color:#350d36;}
.app:is([data-id="ghostty"],[data-id="vscodium"],[data-id="obsidian"],[data-id="slack"]) .app__bar p{color:#d6d6d6;}
.app[data-id="claude"],.app[data-id="claude"] .app__bar{background:color-mix(in srgb,#d97757 5%,var(--bg));}
.app[data-id="claude"] .app__bar{border-bottom:none;}

/* ---- the menu bar: a strip of glass across the top of the screen. The boat, the app in front, menus that
   really work, and the time. Its menus drop down as small sheets of the same glass. ---- */
.mb{
  position:absolute;z-index:3;top:0;left:0;right:0;height:var(--mb);display:flex;align-items:stretch;padding:0 8px;
  font-size:clamp(11.5px,calc(var(--mb) * .5),13px);line-height:1;cursor:default;user-select:none;-webkit-user-select:none;
  background:color-mix(in srgb,var(--bg) 40%,transparent);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);
  box-shadow:inset 0 -.5px 0 var(--glass-edge);
}
.mb > span,.mb__menu{position:relative;display:flex;}
.mb__logo,.mb__menu > button{display:flex;align-items:center;padding:0 9px;border:none;border-radius:5px;background:none;cursor:default;}
.mb__logo svg{width:1.25em;height:1.25em;fill:currentColor;}
.mb__app{display:flex;align-items:center;padding:0 9px 0 3px;font-weight:700;white-space:nowrap;}
:is(.mb__logo,.mb__menu > button):is(:hover,:focus-visible,[aria-expanded="true"]){background:color-mix(in srgb,var(--text) 13%,transparent);outline:none;}
.mb__time{margin-left:auto;display:flex;align-items:center;padding:0 6px;font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap;}
.stage .mb ul{
  position:absolute;top:calc(100% + 5px);left:0;min-width:190px;list-style:none;margin:0;padding:5px;border-radius:10px;
  background:color-mix(in srgb,var(--bg) 76%,transparent);backdrop-filter:blur(24px) saturate(190%);-webkit-backdrop-filter:blur(24px) saturate(190%);
  box-shadow:inset 0 1px 0 var(--rim-soft),0 0 0 .5px var(--glass-edge),0 18px 40px -16px color-mix(in srgb,var(--shadow) 60%,transparent);
}
.mb li button{display:flex;align-items:center;gap:7px;width:100%;padding:5px 12px 5px 6px;border:none;border-radius:6px;background:none;cursor:default;text-align:left;white-space:nowrap;font-size:13px;}
.mb li button:is(:hover,:focus-visible):not(:disabled){background:#1f86ea;color:#fff;outline:none;}
.mb li button:disabled{opacity:.4;}
.mb li i{flex:none;width:12px;font-style:normal;font-size:11px;}
.mb kbd{margin-left:auto;padding-left:22px;font:inherit;opacity:.55;}

/* Welcome */
.wl{display:flex;flex-direction:column;justify-content:center;max-width:640px;margin:0 auto;}
.wl .app__title{margin-top:10px;}
.wl__go{margin:24px 0 0;display:flex;flex-wrap:wrap;gap:10px;}
.wl__go button{padding:11px 20px;border:1px solid var(--text);border-radius:999px;background:var(--text);color:var(--bg);font-size:15px;font-weight:500;cursor:pointer;transition:scale .2s var(--ease);}
.wl__go button + button{background:none;color:var(--text);}
.wl__go button:hover{scale:1.03;}
.wl__go button:active{scale:.97;}
.wl__tip{margin:22px 0 0;font-size:13.5px;line-height:1.5;color:var(--muted);}

/* a note popped up by a dock app: a small sheet of glass in the middle of the screen */
.al{
  position:absolute;z-index:7;inset:0 0 calc(var(--ic) * 1.4) 0;margin:auto;width:220px;height:fit-content;
  display:flex;flex-direction:column;align-items:center;padding:20px 16px 16px;border-radius:18px;text-align:center;
  background:color-mix(in srgb,var(--bg) 70%,transparent);backdrop-filter:blur(22px) saturate(190%);-webkit-backdrop-filter:blur(22px) saturate(190%);
  box-shadow:inset 0 1px 0 var(--rim),inset 0 0 0 1px var(--rim-soft),0 0 0 .5px var(--glass-edge),0 30px 60px -22px color-mix(in srgb,var(--shadow) 65%,transparent);
  animation:ipwIn .3s cubic-bezier(.2,.85,.2,1) both;
}
.al img{display:block;}
.al p{margin:8px 0 0;font-size:17px;font-weight:700;}
.al span{font-size:12px;color:var(--muted);}
.al button{align-self:stretch;margin-top:14px;padding:7px 0;border:none;border-radius:9px;background:#1f86ea;color:#fff;font-size:13.5px;font-weight:500;cursor:pointer;}
.al button:hover{background:#1976d2;}

/* a window's bar: three lights (the red one closes it) and the app's name, on a strip of its own */
.app__bar{
  position:relative;flex:none;display:flex;align-items:center;justify-content:center;height:38px;cursor:default;
  user-select:none;-webkit-user-select:none;touch-action:none;
  background:color-mix(in srgb,var(--surface) 70%,var(--bg));border-bottom:1px solid var(--line);
}
.app__bar p{margin:0;font-size:13px;font-weight:600;}
.app__close{
  position:absolute;left:14px;top:50%;width:12px;height:12px;margin-top:-6px;padding:0;border:none;border-radius:50%;cursor:pointer;
  background:#ff5f57;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.18);transition:scale .2s var(--ease);
}
.app__close::before{content:"";position:absolute;inset:-12px;}
.app__close:is(:hover,:focus-visible){scale:1.2;}
.app__body{flex:1;min-height:0;overflow:auto;scrollbar-width:thin;padding:clamp(10px,1.6vw,22px) clamp(22px,4vw,60px) clamp(22px,3.4vw,48px);}
.app__body > *{min-height:100%;}
.app__meta{margin:0;font-family:var(--mono);font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);}
.app__title{margin:10px 0 0;font-family:var(--font-display);font-size:clamp(30px,3.3vw,48px);font-weight:400;letter-spacing:-.015em;line-height:1;}
.app__title--xl{margin:0;font-size:clamp(38px,5.4vw,82px);line-height:.98;max-width:11em;}
/* a label beside a value (About's facts, Contact's links): plain type, like Experience's dates */
.app__label{margin:0;font-size:14px;font-weight:500;line-height:1.35;color:var(--muted);}
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

/* Résumé: the page as a picture, as wide as the column allows, scrolling with the window */
.rs{display:flex;flex-direction:column;align-items:center;}
.rs__pages{display:flex;flex-direction:column;gap:16px;width:min(100%,860px);cursor:zoom-in;}
.rs__pages img{display:block;width:100%;height:auto;border-radius:6px;background:#fff;box-shadow:0 0 0 1px var(--line),0 18px 40px -26px color-mix(in srgb,var(--shadow) 60%,transparent);}
/* the download stays in the bottom right corner while the page scrolls under it */
.rs__get{
  position:sticky;bottom:0;align-self:flex-end;margin-top:-30px;display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;
  background:var(--text);color:var(--bg) !important;font-size:14px;font-weight:500;box-shadow:0 12px 24px -14px color-mix(in srgb,var(--shadow) 80%,transparent);
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
.stage[data-intro] :is(.dk,.mb,.desk__files,.desk__widgets,.desk__apps){animation:introIn .5s var(--ease) 1.15s both;}
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

/* a squeezed window: the desktop column and the widgets would crowd the dock, so they step out */
@media (max-height:560px),(max-width:900px){.stage :is(.desk__files,.desk__widgets){display:none;}}
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
  .stage__screen::before{display:none;}
  /* with no laptop to hold them, the lights leave the screen's rectangle and drift behind the whole page */
  .desk__lights{position:fixed;z-index:0;}
  .desk__lights i{width:86vw;}
  .stage__top,.stage__base{position:relative;z-index:1;}
  .desk{position:relative;padding:26px var(--pad);justify-content:flex-start;}
  /* the folder and the text file belong to the laptop's desktop; a phone has no room for them */
  .stage .desk__files{display:none;}
  /* one home screen: the sections and the dock's apps flow together as a single grid of four across */
  .desk{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-content:start;align-items:start;gap:24px 6px;}
  .desk__widgets{grid-column:1/-1;}
  .stage .desk__apps,.dk,.stage .dk__dock{display:contents;}
  /* the lights are fixed behind the page here, and would paint over anything that isn't lifted above them */
  .desk__apps li,.dk__dock li{position:relative;z-index:1;}
  .desk__apps button{width:100%;padding:0;border-radius:0;}
  .desk__apps button:is(:hover,:focus-visible){background:none;}
  .da__tile{width:50px;margin:5px;}
  .desk__apps b{font-size:12px;}
  .stage .dk__dock{padding:0;border-radius:0;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none;}
  .stage .dk__dock::before,.dk__dock .dk__sep,.dk__dock .is-running::after{display:none;}
  .dk__dock li{justify-content:center;}
  .dk__dock :is(button,a){width:100%;gap:8px;}
  /* pointing at an icon grows it a little; nothing lifts, and the name under it stays put */
  .dk__dock :is(button,a):is(:hover,:focus-visible){translate:none;}
  .stage .dk__dock :is(button,a):is(:hover,:focus-visible):not([aria-expanded="true"]) b{translate:none;}
  .dk__dock :is(button,a):is(:hover,:focus-visible) .dk__tile{scale:1.06;}
  .dk__dock :is(button,a):active .dk__tile{scale:.94;}
  .dk__tile{width:60px;}
  span.dk__tile{width:50px;margin:5px;}
  span.dk__tile--folder{width:54px;margin:3px;}
  .dk__dock b{position:static;translate:none;opacity:1;padding:0;font-size:12px;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none;}
  /* a dock folder opens in the middle of the phone, the way a folder does on a phone's home screen */
  .stk{position:fixed;z-index:85;left:50% !important;top:50%;bottom:auto;translate:-50% -50%;max-width:calc(100vw - 32px);transform-origin:50% 50%;}
  .stk::after{display:none;}
  .stage .stk__grid{grid-template-columns:repeat(3,auto);}
  /* the iPod floats in the middle of the phone's window, and drags around it */
  .ipw{position:fixed;z-index:90;inset:0;--wg:min(64vw,280px);}
  /* on a phone there is no menu bar, and every window fills the screen, the newest on top, and stays where it
     is, so only the red light is needed */
  .stage__mac{--mb:0px;}
  .mb,.app__min,.app__max{display:none;}
  .wins{z-index:80;}
  .stage .app,.stage .app[data-max]{inset:0;--win-t:0px;--win-l:0px;--win-r:0;box-shadow:none;translate:none;transform-origin:var(--ox,50%) var(--oy,100%);}
  .app__bar{touch-action:auto;}
  .al{position:fixed;z-index:95;inset:0;}
  .dk__nudge{grid-column:1/-1;order:2;margin:0;}
  /* a phone's home screen: the two widgets side by side on top, then the sections, then the project apps */
  .stage .desk__widgets{display:flex;--wg:min(40vw,170px);margin-bottom:4px;}
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
  .ct__links li{grid-template-columns:minmax(0,1fr);gap:2px;}
  .stage__base{order:3;flex-direction:row;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:10px 18px;padding:18px var(--pad) 26px;}
  .stage__archive{display:inline;font-family:var(--font-body);font-size:14px;font-weight:500;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;}
  .stage__foot{flex-basis:100%;margin:0;}
}
@media (prefers-reduced-motion:reduce){
  .desk__lights i,.app,.pj__shot img,.pj__notes,.stage .dock__tab,.ipod__eq i,.ipw,.stk,.al{animation:none !important;}
  .pj__shot img,.stage__nav nav :is(button,a),.dk__dock :is(button,a){transition:none !important;}
  .pj__shot img{translate:0 0 !important;}
}
`;
