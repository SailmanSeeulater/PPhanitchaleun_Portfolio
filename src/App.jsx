import React, { useEffect, useRef, useState } from "react";
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
    blurb:
      "A production accountability app — goal tracking, daily behavior logging, and automated weekly reports with mood and completion-rate analytics. Live on Oracle Cloud over HTTPS.",
    stack: ["Java", "Spring Boot", "React", "PostgreSQL", "Redis", "Docker"],
    link: { label: "mordi.latesailor.dev", href: "https://mordi.latesailor.dev" },
    demo: { domain: "mordi.latesailor.dev", tint: "#30d158", image: mordiShot },
  },
  {
    name: "Lonely Chess",
    blurb:
      "An esoteric programming language where standard PGN chess files are the source code — variables, control flow, and arithmetic encoded as piece movements. FizzBuzz runs as a 2,669-move game.",
    stack: ["Python", "PGN Notation", "Interpreter Design"],
    link: {
      label: "lonely-chess-cs-420.vercel.app",
      href: "https://lonely-chess-cs-420.vercel.app/",
    },
    demo: { domain: "lonely-chess-cs-420.vercel.app", tint: "#bf5af2", image: lonelyChessShot },
  },
  {
    name: "pdfyier",
    blurb:
      "Turn a batch of images into a single PDF, right in the browser — drag to reorder pages, name the file, download. Nothing uploaded is ever written to disk or kept after the download finishes.",
    stack: ["Python", "FastAPI", "ImageMagick", "nginx", "Docker"],
    link: { label: "pdfyier.latesailor.dev", href: "https://pdfyier.latesailor.dev" },
    demo: { domain: "pdfyier.latesailor.dev", tint: "#ff453a", image: pdfyierShot },
  },
];

const TECH = [
  {
    label: "Frontend",
    items: [
      ["React", "react"],
      ["JavaScript", "javascript"],
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
      ["Node.js", "nodejs"],
      ["PostgreSQL", "postgresql"],
      ["Redis", "redis"],
      ["MySQL", "mysql"],
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
function TechBadge({ name, slug, delay }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="badge" style={{ transitionDelay: `${delay}ms` }}>
      <div className="badge__disc" title={name}>
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
      </div>
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
        <p className="project__blurb">{project.blurb}</p>

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

export default function App() {
  const [techRef, techInView] = useInView({ threshold: 0.2 });

  return (
    <div className="site">
      <style>{CSS}</style>

      {/* ---------- NAV ---------- */}
      <header className="nav">
        <a className="nav__brand" href="#top">PP</a>
        <nav className="nav__links" aria-label="Primary">
          <a href="#projects">Projects</a>
          <a href="#tech">Tech Stack</a>
          <a href="#contact">Contact</a>
        </nav>
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
                    <TechBadge key={name} name={name} slug={slug} delay={i * 70} />
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
  --ease:cubic-bezier(.16,1,.3,1);
  --nav-h:60px;
  --maxw:1120px;
}

*{box-sizing:border-box;}
html{scroll-behavior:smooth;}

.site{
  margin:0;
  background:var(--bg);
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
  background:rgba(243,230,213,.75);
  backdrop-filter:saturate(160%) blur(18px);
  -webkit-backdrop-filter:saturate(160%) blur(18px);
  border-bottom:1px solid var(--line);
}
.nav__brand{font-family:var(--font-display);font-weight:400;letter-spacing:.02em;font-size:20px;}
.nav__links{display:flex;gap:clamp(18px,4vw,40px);}
.nav__links a{
  font-size:15px;color:var(--muted);position:relative;padding:4px 0;
  transition:color .25s var(--ease);
}
.nav__links a::after{
  content:"";position:absolute;left:0;bottom:-2px;height:1.5px;width:100%;
  background:var(--text);transform:scaleX(0);transform-origin:left;
  transition:transform .3s var(--ease);
}
.nav__links a:hover{color:var(--text);}
.nav__links a:hover::after{transform:scaleX(1);}

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
  box-shadow:0 30px 70px -30px rgba(128,0,32,.3);
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
  background:var(--accent-fill);color:#fff;
  font-size:15px;font-weight:600;
  transition:transform .25s var(--ease),opacity .25s var(--ease),box-shadow .25s var(--ease);
  box-shadow:0 12px 26px -12px rgba(128,0,32,.45);
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
.project__blurb{margin:14px 0 0;color:var(--muted);font-size:clamp(15px,1.8vw,18px);max-width:42ch;}
.project__stack{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px;}
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
  box-shadow:0 40px 90px -45px rgba(128,0,32,.28);
  transition:transform .4s var(--ease),box-shadow .4s var(--ease);
}
.project:hover .window{transform:translateY(-6px);box-shadow:0 55px 110px -45px rgba(128,0,32,.32);}
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
}
.badge:hover .badge__disc{transform:translateY(-5px) scale(1.05);}
.badge__disc img{width:34px;height:34px;}
.badge__fallback{font-size:24px;font-weight:700;color:var(--card-ink);}
.badge__name{font-size:12.5px;color:var(--muted);text-align:center;line-height:1.25;}

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
.social:hover{transform:translateY(-4px);background:var(--card-ink);color:#fff;}
.contact__tagline{margin:42px 0 0;font-size:18px;color:#6e6e73;font-weight:500;}

/* ---------- FOOTER ---------- */
.footer{
  max-width:var(--maxw);margin:0 auto;
  padding:38px clamp(20px,5vw,48px);
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
  .window,.social,.badge__disc,.nav__links a::after,.project__link{transition:none !important;}
}
`;
