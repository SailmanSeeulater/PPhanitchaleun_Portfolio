import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  PROJECTS,
  EXPERIENCE,
  TECH,
  SKILL_SOURCES,
  GITHUB,
  SC_PROFILE,
  DEVICON,
  RESUME,
  BASE_CSS,
  rich,
  useAnalytics,
  ArrowIcon,
  DownloadIcon,
  ProjectNotes,
  SoundDock,
  VisitorCount,
} from "./App.jsx";

/* The Showcase site: one screen, no page scroll. The nav picks a view. Projects are browsed one at a time
   (a screenshot window beside its write-up); experience, tech stack and contact each show in full. */

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

const VIEWS = [
  { id: "projects", label: "projects" },
  { id: "experience", label: "experience" },
  { id: "stack", label: "tech stack" },
  { id: "about", label: "about" },
  { id: "contact", label: "contact" },
];

// Every view and project has its own address (#/experience, #/projects/zwans), so links can point at one thing
// and the browser's back button works.
const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const PROJECT_SLUGS = PROJECTS.map((p) => slugOf(p.name));

function readRoute() {
  const [view, item] = window.location.hash.replace(/^#\/?/, "").split("/");
  if (!VIEWS.some((v) => v.id === view)) return { view: "projects", index: null };
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

/* Two windows: the screenshot in a laptop-style bezel, and the write-up beside it. */
function ProjectFrame({ project, index }) {
  // A deployed project's screen is a link to the live app; the rest are plain pictures.
  const Screen = project.live ? "a" : "div";
  const screenLink = project.live
    ? { href: project.live, target: "_blank", rel: "noreferrer", "aria-label": `Open ${project.name} live`, "data-umami-event": "project-live", "data-umami-event-project": project.name }
    : {};
  return (
    <div className="stage__pair">
      <figure className="stage__mac">
        <div className="stage__lid">
          <Screen className="stage__screen" style={{ "--pan": `${Math.max(4, project.demo.height / 240).toFixed(1)}s` }} {...screenLink}>
            <img key={project.name} src={project.demo.image} alt={`${project.name} screenshot`} />
            <figcaption className="stage__tag">
              {project.live ? "Open " : ""}
              {project.demo.domain}
              {project.live && <ArrowIcon />}
            </figcaption>
          </Screen>
        </div>
        <span className="stage__deck" aria-hidden="true" />
      </figure>
      <article className="stage__panel stage__about" key={project.name} aria-labelledby="stage-project">
        <p className="stage__meta">
          {project.kind} · {index + 1} of {PROJECTS.length}
        </p>
        <h2 id="stage-project" className="stage__title">
          {project.name}
        </h2>
        {project.stat && (
          <p className="stage__stat">
            <b>{project.stat[0]}</b>
            <span>{project.stat[1]}</span>
          </p>
        )}
        <ProjectNotes project={project} />
      </article>
    </div>
  );
}

function ExperienceFrame() {
  return (
    <div className="stage__cols">
      {EXPERIENCE.map((job) => (
        <article className="stage__panel" key={job.role}>
          <p className="stage__meta">{job.meta.join(" · ")}</p>
          <h2 className="stage__title">{job.role}</h2>
          <p className="stage__lead">
            <strong>{job.org}</strong> · {job.about}
          </p>
          <ul className="bullets stage__bullets">
            {job.bullets.map((b, i) => (
              <li key={i}>{rich(b)}</li>
            ))}
          </ul>
          <ul className="project__stack" aria-label={`${job.role} tech stack`}>
            {job.stack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function StackFrame({ goToProject }) {
  const [skill, setSkill] = useState(null);
  const sources = skill ? SKILL_SOURCES.filter((s) => s.skills.includes(skill)) : [];
  return (
    <div className="stage__panel stage__stack">
      <div className="stage__groups">
        {TECH.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h2 className="stage__group">{group.label}</h2>
            <ul className="stage__chips">
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
      <div className="stage__used" aria-live="polite">
        {!skill && <p className="stage__meta">Press a tool to see which projects use it</p>}
        {skill &&
          (sources.length ? (
            <>
              <p className="stage__meta">{skill} was used in</p>
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
                        <button type="button" onClick={() => goToProject(i)}>
                          {s.name}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="stage__meta">{skill}: learned outside the projects shown here</p>
          ))}
      </div>
    </div>
  );
}

const ABOUT_FACTS = [
  ["Based in", "San Diego, California"],
  ["From", "Laos"],
  ["Studying", "B.S. Computer Science, San Diego State University, expected June 2027"],
  ["Working", "Founding engineer, stealth startup"],
  ["Off the clock", "Making music, dreaming about pottery"],
];

function AboutFrame() {
  return (
    <div className="stage__panel stage__letter">
      <div>
        <p className="stage__meta">About</p>
        <h2 className="stage__title stage__title--lg">I&rsquo;m Perfect, a software engineer in San Diego, originally from Laos.</h2>
        <p className="stage__lead">
          I like to build things and dream about pottery. Lately the things are coding agents: the loop that runs them, the sandbox that holds them, and the evals that prove a change helped.
        </p>
        <p className="stage__lead">
          I study computer science at San Diego State, graduating June 2027, and work as a founding engineer at a stealth startup.
        </p>
        <p className="stage__sign">Perfect</p>
      </div>
      <dl className="stage__facts">
        {ABOUT_FACTS.map(([label, value]) => (
          <div key={label}>
            <dt className="stage__meta">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ContactFrame() {
  return (
    <div className="stage__panel stage__contact">
      <p className="stage__meta">San Diego based and originally from Laos</p>
      <h2 className="stage__title stage__title--xl">Let&rsquo;s chat and grab some coffee</h2>
      <ul className="stage__links">
        {CONTACTS.map((c) => (
          <li key={c.name}>
            <span className="stage__meta">{c.name}</span>
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

export default function Stage() {
  const [theme, setTheme] = useStageTheme();
  const [viewId, setViewId] = useState(() => readRoute().view);
  const [index, setIndex] = useState(() => readRoute().index ?? 0);
  const lastView = useRef(null);
  const listRef = useRef(null);
  const stageRef = useRef(null);
  useAnalytics();

  // First-visit intro: a closed laptop opens in the middle of the page, lights up on the first project,
  // then slides into its frame while everything else arrives. Any click or key skips it. Add ?intro to replay.
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
    if (!mac || readRoute().view !== "projects" || (seen && !replay) || window.innerWidth <= 760 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
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
        const scale = Math.min(1.25, (window.innerWidth * 0.6) / r.width, (window.innerHeight * 0.62) / r.height);
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

  const count = PROJECTS.length;
  const step = (d) => setIndex((i) => (i + d + count) % count);
  const goToProject = (i) => {
    setIndex(i);
    setViewId("projects");
  };

  // Keep the address in step with what is on screen. Changing view adds a history entry; flipping through
  // projects replaces it, so "back" leaves the view instead of rewinding one project at a time.
  useEffect(() => {
    const target = viewId === "projects" ? `#/projects/${PROJECT_SLUGS[index]}` : `#/${viewId}`;
    const first = lastView.current === null;
    const untouched = !window.location.hash && viewId === "projects" && index === 0;
    if (!untouched && window.location.hash !== target) {
      const write = first || lastView.current === viewId ? "replaceState" : "pushState";
      window.history[write](null, "", target);
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

  // Arrow keys step through the projects from anywhere on the page, except while typing or inside the music panel.
  useEffect(() => {
    if (viewId !== "projects") return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input,textarea,select,.dock")) return;
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

  return (
    <div className="site stage" ref={stageRef}>
      <style>{BASE_CSS + STAGE_CSS}</style>

      <div className="stage__top">
        <header className="stage__head">
          <h1 className="stage__mark">
            Perfect
            <br />
            Phanitchaleun.
          </h1>
          <p className="stage__role">
            Software Engineer
            <br />
            A student, looking for SWE new grad roles
          </p>
        </header>

        <div className="stage__nav">
          <nav aria-label="Primary">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" aria-current={v.id === viewId ? "page" : undefined} onClick={() => setViewId(v.id)} data-umami-event={`view-${v.id}`}>
                {v.label}
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
            <SoundDock />
          </div>
        </div>
      </div>

      <aside className="stage__side">
        {viewId === "projects" && (
          <>
            <ol className="stage__list" aria-label="Projects" ref={listRef}>
              {PROJECTS.map((p, i) => (
                <li key={p.name}>
                  <button type="button" aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)} data-umami-event="project-preview" data-umami-event-project={p.name}>
                    {p.name}
                  </button>
                </li>
              ))}
            </ol>
            <div className="stage__ctl">
              <button type="button" onClick={() => step(-1)} aria-label="Previous project">
                <ArrowIcon />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next project">
                <ArrowIcon />
              </button>
              <span className="stage__hint">or use the arrow keys</span>
            </div>
          </>
        )}
        <a className="stage__resume" {...RESUME} data-umami-event-location="stage">
          Résumé
          <DownloadIcon />
        </a>
        <p className="stage__foot">
          <span>© {new Date().getFullYear()} Perfect Phanitchaleun</span>
          <VisitorCount />
        </p>
      </aside>

      <main id="top" className="stage__main">
        {viewId === "projects" && <ProjectFrame project={PROJECTS[index]} index={index} />}
        {viewId === "experience" && <ExperienceFrame />}
        {viewId === "stack" && <StackFrame goToProject={goToProject} />}
        {viewId === "about" && <AboutFrame />}
        {viewId === "contact" && <ContactFrame />}
      </main>
    </div>
  );
}

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
  display:grid;grid-template-columns:clamp(170px,17vw,244px) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);
  font-family:var(--font-display);background:var(--bg);
}
.stage ::selection{background:var(--text);color:var(--bg);}

/* ---- top row: wordmark on the left, nav and tools on the right. Both are in flow, so nothing can overlap the frame. ---- */
.stage__top{
  grid-column:1/-1;grid-row:1;display:flex;justify-content:space-between;align-items:flex-start;gap:20px;
  padding:26px var(--pad) 22px;min-width:0;
}
.stage__head{display:flex;align-items:flex-end;flex-wrap:wrap;gap:10px clamp(18px,3vw,40px);min-width:0;}
.stage__mark{margin:0;font-size:clamp(32px,3.75vw,54px);font-weight:400;letter-spacing:-.015em;line-height:.98;}
.stage__role{margin:0 0 4px;font-family:var(--font-body);font-size:14px;line-height:1.4;color:var(--muted);}
.stage__nav{display:flex;align-items:flex-start;gap:16px;flex:none;}
.stage__nav nav{display:flex;flex-direction:column;align-items:flex-end;}
.stage__nav nav :is(button,a){
  padding:0;border:none;background:none;cursor:pointer;white-space:nowrap;
  font:inherit;font-size:17px;line-height:1.3;font-weight:400;letter-spacing:-.005em;color:var(--muted);text-decoration:none;
}
.stage__nav nav :is(button,a):hover{color:var(--text);}
.stage__nav nav [aria-current]{color:var(--text);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;}
.stage__tools{display:flex;flex-direction:column;align-items:center;gap:14px;padding-top:3px;}
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
.stage__side{grid-column:1;grid-row:2;display:flex;flex-direction:column;justify-content:flex-end;padding:0 12px 26px var(--pad);min-height:0;min-width:0;}
.stage__list{list-style:none;margin:0;padding:0;}
.stage__list button{
  display:block;padding:1px 0;border:none;background:none;cursor:pointer;text-align:left;
  font:inherit;font-size:clamp(18px,1.9vw,27px);font-weight:400;letter-spacing:-.015em;line-height:1.16;
  color:color-mix(in srgb,var(--text) 30%,var(--bg));transition:color .25s var(--ease);
}
.stage__list:not([data-keys]) button:hover{color:color-mix(in srgb,var(--text) 62%,var(--bg));}
.stage__list button[aria-current]{color:var(--text);}
.stage__ctl{display:flex;align-items:center;gap:8px;margin-top:20px;}
.stage__hint{margin-left:4px;font-family:var(--mono);font-size:9px;letter-spacing:.03em;text-transform:uppercase;line-height:1.4;color:var(--muted);max-width:9em;}
@media (hover:none){.stage__hint{display:none;}}
.stage__ctl button{
  display:grid;place-items:center;width:40px;height:40px;padding:0;border-radius:50%;cursor:pointer;
  border:1px solid color-mix(in srgb,var(--text) 30%,transparent);background:var(--surface);color:var(--text);
  transition:background .2s var(--ease),color .2s var(--ease),transform .2s var(--ease);
}
.stage__ctl button:hover{background:var(--text);color:var(--bg);border-color:var(--text);}
.stage__ctl button:active{transform:scale(.94);}
.stage__ctl button:first-child svg{rotate:-135deg;}
.stage__ctl button:nth-child(2) svg{rotate:45deg;}
.stage__resume{
  align-self:flex-start;display:inline-flex;align-items:center;gap:8px;margin-top:24px;
  font-family:var(--font-body);font-size:14px;font-weight:500;
  text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;
}
.stage__foot{
  margin:12px 0 0;display:flex;flex-direction:column;gap:3px;
  font-family:var(--mono);font-size:9px;letter-spacing:.03em;text-transform:uppercase;color:var(--muted);
}
.stage__foot .footer__visits{display:inline-flex;align-items:center;gap:7px;}

/* ---- the frame ---- */
.stage__main{grid-column:2;grid-row:2;min-height:0;min-width:0;display:flex;padding:0 var(--pad) 26px 0;}
.stage__main > *{flex:1;min-height:0;min-width:0;}
@keyframes stageIn{from{opacity:0;transform:scale(1.03);}to{opacity:1;transform:none;}}
@keyframes stageUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
.stage__panel{
  background:var(--surface);border:1px solid var(--line);border-radius:var(--round);
  padding:clamp(20px,2.6vw,38px);font-family:var(--font-body);overflow-y:auto;scrollbar-width:thin;
  animation:stageUp .45s var(--ease);
}
.stage__meta{margin:0;font-family:var(--mono);font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);}
.stage__title{margin:12px 0 0;font-family:var(--font-display);font-size:clamp(32px,3.5vw,52px);font-weight:400;letter-spacing:-.015em;line-height:1;}
.stage__title--xl{font-size:clamp(40px,6vw,92px);max-width:11em;}
.stage__lead{margin:16px 0 0;font-size:clamp(16px,1.35vw,19px);line-height:1.4;}
.stage__bullets{margin-top:18px;}
.stage__bullets li,.stage__about .bullets li{font-size:clamp(14px,1.05vw,15.5px);line-height:1.55;}
.stage .project__stack li{border-radius:999px;}
.stage .hl{background:transparent;color:inherit;padding:0;margin:0;font-weight:700;box-shadow:inset 0 -.38em 0 color-mix(in srgb,var(--accent-fill) 24%,transparent);}

/* projects: a laptop-style screen beside the write-up */
.stage__pair{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:clamp(12px,1.4vw,20px);}
.stage__mac{position:relative;margin:0;min-height:0;min-width:0;transform-origin:50% 100%;}
.stage__lid{
  position:relative;height:100%;padding:11px;border-radius:var(--round);background:#161617;transform-origin:50% 100%;
  /* no light inner ring and no light screen backing: either one shows as pale pixels where the corners curve */
  box-shadow:0 26px 50px -30px color-mix(in srgb,var(--shadow) 70%,transparent);
  outline:1px solid color-mix(in srgb,var(--text) 18%,transparent);outline-offset:0;
}
.stage__lid::before{content:"";position:absolute;z-index:1;top:3.5px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:#3a3a3d;}
.stage__deck{display:none;}
.stage__screen{display:block;position:relative;height:100%;border-radius:8px;overflow:hidden;background:#161617;isolation:isolate;container-type:size;}
/* the screenshot keeps its full height and slides up while the pointer is on the screen, so the whole page gets seen */
.stage__screen img{
  display:block;width:100%;height:auto;min-height:100cqh;object-fit:cover;object-position:top;
  translate:0 0;transition:translate 1.2s var(--ease);animation:stageIn .6s var(--ease);
}
@media (hover:hover){
  .stage__screen:is(:hover,:focus-visible) img{translate:0 min(0px,calc(100cqh - 100%));transition:translate var(--pan,7s) cubic-bezier(.37,0,.63,1);}
}
@media (hover:none){
  .stage__screen img{animation:stageIn .6s var(--ease),panLoop calc(var(--pan,7s) * 2.4) cubic-bezier(.37,0,.63,1) 1.2s infinite alternate;}
}
@keyframes panLoop{0%,12%{translate:0 0;}88%,100%{translate:0 min(0px,calc(100cqh - 100%));}}
.stage__tag{
  display:inline-flex;align-items:center;gap:6px;
  position:absolute;right:12px;bottom:12px;padding:6px 10px;border-radius:999px;background:rgba(10,10,10,.82);color:#fff;
  font-family:var(--mono);font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;
}
.stage__stat{
  display:flex;align-items:baseline;gap:12px;margin:18px 0 0;padding:12px 0;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);
}
.stage__stat b{font-family:var(--font-display);font-weight:400;font-size:clamp(30px,3vw,44px);line-height:1;letter-spacing:-.015em;}
.stage__stat span{font-family:var(--mono);font-size:10.5px;letter-spacing:.03em;text-transform:uppercase;color:var(--muted);}
.stage__about .notes__summary{margin:16px 0 0;font-size:clamp(16px,1.3vw,18.5px);line-height:1.4;}
.stage__about .notes__credit{margin:10px 0 0;font-family:var(--mono);font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);}
.stage__about .bullets{margin-top:18px;}

/* about: a short letter with a facts column */
.stage__letter{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);padding:clamp(24px,3.4vw,48px);}
.stage__title--lg{font-size:clamp(34px,3.9vw,56px);line-height:1.04;max-width:13em;}
.stage__letter .stage__lead{max-width:34em;line-height:1.5;}
.stage__letter .stage__lead + .stage__lead{margin-top:12px;}
.stage__letter .stage__title + .stage__lead{margin-top:24px;}
.stage__sign{margin:clamp(20px,2.6vw,34px) 0 0;font-family:var(--font-display);font-size:clamp(24px,2.2vw,31px);letter-spacing:-.015em;}
.stage__facts{
  margin:0;padding-left:clamp(18px,2.6vw,36px);border-left:1px solid var(--line);
  display:flex;flex-direction:column;justify-content:flex-end;gap:clamp(12px,1.5vw,20px);
}
.stage__facts dd{margin:5px 0 0;font-size:clamp(15.5px,1.3vw,18px);line-height:1.35;}

/* ---- first-visit intro: the laptop opens in the middle of the page, then travels to its frame ---- */
.stage[data-intro-wait] :is(.stage__nav,.stage__side,.stage__role,.stage__pair){opacity:0;}
.stage[data-intro] .stage__mac{z-index:30;animation:macTravel 1.65s cubic-bezier(.7,0,.2,1) both;}
.stage[data-intro] .stage__lid{animation:lidOpen 1.65s cubic-bezier(.3,.9,.3,1) both;}
.stage[data-intro] .stage__screen img{animation:screenOn 1.65s linear both;}
.stage[data-intro] .stage__tag{animation:introIn .4s var(--ease) 1.3s both;}
.stage[data-intro] .stage__deck{
  display:block;position:absolute;left:-7%;right:-7%;top:100%;height:13px;border-radius:2px 2px 16px 16px;
  background:linear-gradient(#d2d2cf,#b3b3b0);animation:deckOut 1.65s linear both;
}
.stage[data-intro] :is(.stage__nav,.stage__side,.stage__role,.stage__about){animation:introIn .55s var(--ease) 1.1s both;}
@keyframes macTravel{0%,58%{transform:translate(var(--ix),var(--iy)) scale(var(--is));}100%{transform:none;}}
/* seen straight on, a lid swinging up on its hinge is simply growing in height: no perspective, so no lean */
@keyframes lidOpen{0%,8%{transform:scaleY(.012);}46%,100%{transform:scaleY(1);}}
@keyframes screenOn{0%,46%{opacity:0;}64%,100%{opacity:1;}}
@keyframes deckOut{0%,58%{opacity:1;}90%,100%{opacity:0;}}
@keyframes introIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}

/* experience: every role at once */
.stage__cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:clamp(12px,1.4vw,20px);overflow-y:auto;scrollbar-width:thin;}
.stage__cols .stage__panel{overflow:visible;}

/* tech stack: every group at once */
.stage__stack{display:flex;flex-direction:column;}
.stage__groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:clamp(20px,2.4vw,34px) clamp(20px,2.6vw,40px);}
.stage__group{margin:0;font-family:var(--font-display);font-size:clamp(22px,2vw,30px);font-weight:400;letter-spacing:-.015em;line-height:1;}
.stage__chips{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px;}
.stage__chips button{
  display:inline-flex;align-items:center;gap:8px;padding:7px 12px 7px 8px;border-radius:999px;cursor:pointer;
  border:1px solid var(--line);background:var(--bg);color:var(--text);font:inherit;font-size:14px;
}
.stage__chips button:hover{border-color:var(--text);}
.stage__chips button[aria-pressed="true"]{background:var(--text);color:var(--bg);border-color:var(--text);}
.stage__chips img{display:block;}
.stage__chips i{display:grid;place-items:center;width:16px;height:16px;border-radius:50%;font-style:normal;font-family:var(--mono);font-size:10px;border:1px solid currentColor;}
.stage__used{margin-top:auto;padding-top:26px;min-height:92px;}
.stage__used ul{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:4px 22px;}
.stage__used :is(button,a){
  display:inline-flex;align-items:center;gap:6px;padding:0;border:none;background:none;cursor:pointer;color:var(--text);
  font-family:var(--font-display);font-size:clamp(19px,1.9vw,27px);font-weight:400;letter-spacing:-.015em;
  text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;
}

/* contact: every link at once */
.stage__contact{display:flex;flex-direction:column;}
.stage__links{list-style:none;margin:auto 0 0;padding:clamp(24px,4vw,56px) 0 0;}
.stage__links li{
  display:grid;grid-template-columns:minmax(90px,150px) minmax(0,1fr);align-items:baseline;gap:12px;
  padding:clamp(10px,1.3vw,16px) 0;border-top:1px solid var(--line);
}
.stage__links a{
  display:inline-flex;align-items:center;gap:8px;justify-self:start;max-width:100%;overflow-wrap:anywhere;
  font-family:var(--font-display);font-size:clamp(18px,2.1vw,30px);font-weight:400;letter-spacing:-.015em;
}
.stage__links a:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:6px;}

/* short windows: tighten the header so the frame keeps its height */
@media (max-height:760px){
  .stage__top{padding-top:16px;padding-bottom:14px;}
  .stage__nav nav :is(button,a){font-size:15px;line-height:1.25;}
  .stage__list button{font-size:clamp(16px,1.6vw,21px);}
  .stage__side,.stage__main{padding-bottom:16px;}
}
/* mid widths: the two project windows stack instead of squeezing */
@media (max-width:1080px){
  .stage__pair{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,5fr) minmax(0,6fr);}
  .stage__role{flex-basis:100%;}
}
/* narrow windows: the page stacks and scrolls like any phone page */
@media (max-width:760px){
  .stage{height:auto;min-height:100svh;overflow:visible;display:flex;flex-direction:column;}
  .stage__side{order:3;}
  .stage__main{flex:none;}
  .stage__top{flex-direction:column-reverse;gap:18px;padding:14px var(--pad) 18px;}
  .stage__nav{align-self:stretch;justify-content:space-between;align-items:center;}
  .stage__nav nav{flex-direction:row;flex-wrap:wrap;gap:4px 14px;}
  .stage__nav nav :is(button,a){font-size:15px;}
  .stage__tools{flex-direction:row;gap:12px;padding:0;}
  .stage__themes{grid-template-columns:repeat(4,18px);}
  .stage .dock__tab{width:36px;height:36px;}
  .stage__main{padding:0 var(--pad) 22px;}
  .stage__pair{grid-template-rows:auto;}
  .stage__screen{height:auto;aspect-ratio:4/3;}
  .stage__panel,.stage__cols{overflow:visible;}
  .stage__links li{grid-template-columns:minmax(0,1fr);gap:2px;}
  .stage__letter{grid-template-columns:minmax(0,1fr);}
  .stage__facts{padding:20px 0 0;border-left:none;border-top:1px solid var(--line);}
  .stage__side{padding:0 var(--pad) 28px;}
}
@media (prefers-reduced-motion:reduce){
  .stage__screen img,.stage__panel,.stage .dock__tab{animation:none !important;}
  .stage__screen img{transition:none !important;translate:0 0 !important;}
}
`;
