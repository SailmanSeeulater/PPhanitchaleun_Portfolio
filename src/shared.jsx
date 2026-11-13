// Small pieces both sites use: icons, a project's write-up, the visitor count, the analytics hook.
import { useEffect, useState } from "react";
import { rich } from "./data";

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
    <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---- One project's full write-up, shared by the Device layout and the Showcase site (Stage.jsx) ---- */
function ProjectNotes({ project }) {
  return (
    <>
      <p className="notes__summary">{project.summary}</p>
      {project.credit && <p className="notes__credit">{project.credit}</p>}
      <ul className="bullets notes__bullets">
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
        {project.live && (
          <a className="project__link" href={project.live} target="_blank" rel="noreferrer" data-umami-event="project-live" data-umami-event-project={project.name}>
            Visit {project.demo.domain}
            <ArrowIcon />
          </a>
        )}
        <a className="project__link project__link--quiet" href={project.repo} target="_blank" rel="noreferrer" data-umami-event="project-source" data-umami-event-project={project.name}>
          Source on GitHub
          <ArrowIcon />
        </a>
      </div>
    </>
  );
}

const RESUME = { href: "/resume.pdf", download: "Perfect_Phanitchaleun_Resume.pdf", "data-umami-event": "resume-download" };


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
  // Starts from the total read at build time: content blockers stop the live request to GoatCounter.
  const [count, setCount] = useState(__VISITOR_COUNT__ || null);

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

// eslint-disable-next-line react/only-export-components
export { ArrowIcon, DownloadIcon, ProjectNotes, RESUME, VisitorCount, useAnalytics };
