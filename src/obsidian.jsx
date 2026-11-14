// Obsidian, in miniature: a vault of notes that link to each other with [[double brackets]]. Notes can be read,
// edited and added, links can be followed, and the graph draws how they connect. The starting notes are written
// from the site's own content; a visitor's edits are kept in their own browser only.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { EXPERIENCE, GITHUB, PROJECTS } from "./data";
import { store, stored } from "./storage";

const VAULT_KEY = "stage-vault";

function starterVault(email) {
  // Two projects are related when they share at least two tools; each note names its closest two.
  const related = (p) =>
    PROJECTS.filter((o) => o !== p)
      .map((o) => [o.name, o.stack.filter((t) => p.stack.includes(t)).length])
      .filter(([, shared]) => shared >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name]) => `[[${name}]]`);
  const notes = {
    Home: `# Home\n\nA small vault of notes about what's on this laptop. Notes link to each other with double square brackets, the way they do in Obsidian.\n\n- [[Projects]]\n- [[Experience]]\n- [[Contact]]\n\nOpen the graph to see how everything connects. Edit any note, or add your own: changes stay in this browser.`,
    Projects: `# Projects\n\n${PROJECTS.map((p) => `- [[${p.name}]]: ${p.kind.toLowerCase()}`).join("\n")}\n\nBack to [[Home]].`,
    Experience: `# Experience\n\n${EXPERIENCE.map((e) => `## ${e.role}, ${e.org}\n\n${e.meta.join(" · ")}\n\n${e.bullets.map((b) => `- ${b}`).join("\n")}`).join("\n\n")}\n\nSee also [[Projects]].`,
    Contact: `# Contact\n\n- Email: ${email}\n- GitHub: ${GITHUB}\n\nBack to [[Home]].`,
  };
  for (const p of PROJECTS) {
    const near = related(p);
    notes[p.name] = `# ${p.name}\n\n${p.kind}\n\n${p.summary}\n\n- Built with: ${p.stack.join(", ")}\n${p.live ? `- Live: ${p.live}\n` : ""}- Code: ${p.repo}\n\n${near.length ? `Related: ${near.join(", ")}. ` : ""}One of the [[Projects]].`;
  }
  return notes;
}

const linksIn = (text) => [...text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1].trim());

// One line of a note: bold, [[links]], web addresses and email addresses.
function Inline({ text, find, open }) {
  return text.split(/(\*\*.+?\*\*|\[\[[^\]]+\]\]|https?:\/\/[^\s,]+|[\w.+-]+@[\w-]+\.[\w.]+)/g).map((part, i) => {
    if (part.startsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("[[")) {
      const [target, alias] = part.slice(2, -2).split("|");
      const name = find(target.trim());
      return (
        <button key={i} type="button" className={name ? "ob__link" : "ob__link ob__link--new"} onClick={() => open(name ?? target.trim())} title={name ? undefined : "Not made yet. Click to make it."}>
          {alias ?? target}
        </button>
      );
    }
    if (/^https?:\/\//.test(part))
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer">
          {part.replace(/^https?:\/\//, "")}
        </a>
      );
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part))
      return (
        <a key={i} href={`mailto:${part}`}>
          {part}
        </a>
      );
    return part;
  });
}

// A note, read: headings, lists and paragraphs.
function Reading({ text, find, open }) {
  const blocks = [];
  for (const line of text.split("\n")) {
    const item = line.match(/^\s*[-*] (.*)$/);
    const last = blocks[blocks.length - 1];
    if (item) {
      if (last?.list) last.list.push(item[1]);
      else blocks.push({ list: [item[1]] });
    } else if (line.trim()) blocks.push({ line });
  }
  const inline = (t) => <Inline text={t} find={find} open={open} />;
  return blocks.map((b, i) => {
    if (b.list)
      return (
        <ul key={i}>
          {b.list.map((t, j) => (
            <li key={j}>{inline(t)}</li>
          ))}
        </ul>
      );
    if (b.line.startsWith("## ")) return <h3 key={i}>{inline(b.line.slice(3))}</h3>;
    if (b.line.startsWith("# ")) return <h2 key={i}>{inline(b.line.slice(2))}</h2>;
    return <p key={i}>{inline(b.line)}</p>;
  });
}

/* ---- The graph, the way Obsidian draws it: notes float in space. Every note pushes the others away, every link
   pulls its two notes together, and a faint pull keeps the whole thing near the middle, so linked notes settle
   into clusters. It never quite stops: each note keeps a slow drift of its own.
   Drag a note to throw the rest around, point at one to light up what it links to, drag the empty space to
   move the view, and scroll to zoom. The positions are worked out here, outside React, and written straight
   onto the SVG each frame. ---- */
const REST = 92; // how long a link wants to be, in pixels
const within = (n, low, high) => Math.min(Math.max(n, low), high);

function stepGraph(sim, now) {
  const nodes = [...sim.nodes.values()];
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = b.x - a.x || 0.01;
      const dy = b.y - a.y || 0.01;
      const d = Math.hypot(dx, dy);
      // Pushing apart, strongest up close and capped so two notes that start on top of each other don't fly off.
      const push = Math.min(2.4, 2600 / (d * d)) / d;
      a.vx -= dx * push;
      a.vy -= dy * push;
      b.vx += dx * push;
      b.vy += dy * push;
    }
  }
  for (const [from, to] of sim.edges) {
    const a = sim.nodes.get(from);
    const b = sim.nodes.get(to);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const pull = ((d - REST) / d) * 0.022;
    a.vx += dx * pull;
    a.vy += dy * pull;
    b.vx -= dx * pull;
    b.vy -= dy * pull;
  }
  nodes.forEach((n, i) => {
    // The pull to the middle, and the slow drift that keeps it all floating.
    n.vx += -n.x * 0.0035 + Math.sin(now / 2600 + i * 1.7) * 0.0045;
    n.vy += -n.y * 0.0045 + Math.cos(now / 3100 + i * 2.3) * 0.0045;
    n.vx *= 0.86;
    n.vy *= 0.86;
    if (n.held) return;
    n.x += n.vx;
    n.y += n.vy;
  });
}

function Graph({ names, edges, current, open }) {
  const svgRef = useRef(null);
  const sim = useRef({ nodes: new Map(), edges: [], view: { x: 0, y: 0, k: 1 } });
  const [hover, setHover] = useState(null);
  const degree = (n) => edges.filter((e) => e.includes(n)).length;
  // While a note is pointed at, it and the notes it links to stay lit and the rest fall back.
  const lit = hover && new Set([hover, ...edges.filter((e) => e.includes(hover)).flat()]);

  const draw = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const { nodes, view } = sim.current;
    const box = svg.getBoundingClientRect();
    svg.firstElementChild.setAttribute("transform", `translate(${box.width / 2 + view.x} ${box.height / 2 + view.y}) scale(${view.k})`);
    // Names fade out as the view zooms away, as they do in Obsidian.
    svg.style.setProperty("--names", within((view.k - 0.45) / 0.3, 0, 1));
    for (const el of svg.querySelectorAll("line")) {
      const a = nodes.get(el.dataset.a);
      const b = nodes.get(el.dataset.b);
      if (!a || !b) continue;
      el.setAttribute("x1", a.x);
      el.setAttribute("y1", a.y);
      el.setAttribute("x2", b.x);
      el.setAttribute("y2", b.y);
    }
    for (const el of svg.querySelectorAll("[data-node]")) {
      const n = nodes.get(el.dataset.node);
      if (n) el.setAttribute("transform", `translate(${n.x} ${n.y})`);
    }
  };

  // Keep the simulation's notes in step with the vault. New ones start near the middle and float outward.
  useLayoutEffect(() => {
    const { nodes } = sim.current;
    for (const name of [...nodes.keys()]) if (!names.includes(name)) nodes.delete(name);
    // Most linked first, so the busiest note starts in the middle and the layout untangles around it.
    const links = (n) => edges.filter((e) => e.includes(n)).length;
    [...names].sort((a, b) => links(b) - links(a)).forEach((name, i) => {
      if (nodes.has(name)) return;
      const angle = i * 2.4;
      const reach = 9 * Math.sqrt(i + 1);
      nodes.set(name, { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, vx: 0, vy: 0, held: false });
    });
    sim.current.edges = edges;
    draw();
  });

  useEffect(() => {
    const svg = svgRef.current;
    let frame = 0;
    // Start zoomed so the whole graph fits whatever room there is (a phone has much less than a laptop).
    const room = svg.getBoundingClientRect();
    sim.current.view.k = within(Math.min(room.width / 520, room.height / 400), 0.5, 1);
    // With motion turned down, the notes are settled at once and then left still.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      for (let i = 0; i < 400; i++) stepGraph(sim.current, 0);
      draw();
    } else {
      const tick = (now) => {
        stepGraph(sim.current, now);
        draw();
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }
    // Scrolling zooms toward the pointer. (Added by hand: React's own wheel listener can't stop the page scrolling.)
    const onWheel = (e) => {
      e.preventDefault();
      const { view } = sim.current;
      const box = svg.getBoundingClientRect();
      const px = e.clientX - box.left - box.width / 2;
      const py = e.clientY - box.top - box.height / 2;
      const k = within(view.k * Math.exp(-e.deltaY * 0.0016), 0.35, 3);
      view.x = px - ((px - view.x) * k) / view.k;
      view.y = py - ((py - view.y) * k) / view.k;
      view.k = k;
      draw();
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      svg.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One press does three jobs: on a note it drags the note (or, with no movement, opens it); on empty space it
  // moves the whole view.
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const svg = svgRef.current;
    const { nodes, view } = sim.current;
    const name = e.target.closest("[data-node]")?.dataset.node;
    const node = name && nodes.get(name);
    const start = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    let moved = false;
    const move = (ev) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (Math.hypot(dx, dy) > 4) moved = true;
      if (!node) {
        view.x = start.vx + dx;
        view.y = start.vy + dy;
        return;
      }
      const box = svg.getBoundingClientRect();
      node.x = (ev.clientX - box.left - box.width / 2 - view.x) / view.k;
      node.y = (ev.clientY - box.top - box.height / 2 - view.y) / view.k;
      node.vx = node.vy = 0;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      svg.classList.remove("is-dragging");
      if (node) node.held = false;
      if (node && !moved) open(name);
    };
    e.preventDefault();
    if (node) node.held = true;
    svg.classList.add("is-dragging");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <svg className={lit ? "ob__graph has-lit" : "ob__graph"} ref={svgRef} role="group" aria-label="Graph of the notes" onPointerDown={onPointerDown}>
      <g>
        {edges.map(([a, b]) => (
          <line key={`${a}|${b}`} data-a={a} data-b={b} className={lit ? (a === hover || b === hover ? "is-lit" : undefined) : a === current || b === current ? "is-near" : undefined} />
        ))}
        {names.map((n) => {
          const r = 4 + Math.sqrt(degree(n)) * 2;
          return (
            <g
              key={n}
              data-node={n}
              className={[n === current && "is-current", lit?.has(n) && "is-lit"].filter(Boolean).join(" ") || undefined}
              onPointerEnter={() => setHover(n)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              onKeyDown={(e) => e.key === "Enter" && open(n)}
              tabIndex={0}
              role="button"
              aria-label={n}
            >
              <circle r={r} />
              <text y={r + 13} textAnchor="middle">
                {n}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function ObsidianApp({ email }) {
  const starter = useMemo(() => starterVault(email), [email]);
  const [notes, setNotes] = useState(() => {
    try {
      return { ...starter, ...JSON.parse(stored(VAULT_KEY) ?? "{}") };
    } catch {
      return starter;
    }
  });
  const [name, setName] = useState("Home");
  const [mode, setMode] = useState("read");
  const [naming, setNaming] = useState(null);
  const names = Object.keys(notes);
  const find = (target) => names.find((n) => n.toLowerCase() === target.toLowerCase());
  const edited = names.some((n) => notes[n] !== starter[n]);

  // Only what differs from the starting notes is kept, so the starting notes can change with the site.
  const save = (next) => {
    setNotes(next);
    const diff = Object.fromEntries(Object.entries(next).filter(([n, t]) => t !== starter[n]));
    store(VAULT_KEY, Object.keys(diff).length ? JSON.stringify(diff) : null);
  };
  // Following a link to a note that isn't there yet makes it, the way Obsidian does.
  const open = (target) => {
    const found = find(target);
    if (!found) save({ ...notes, [target]: `# ${target}\n\n` });
    setName(found ?? target);
    setMode(found ? "read" : "edit");
  };
  const edges = useMemo(() => {
    const seen = new Map();
    for (const [from, text] of Object.entries(notes))
      for (const target of linksIn(text)) {
        const to = Object.keys(notes).find((n) => n.toLowerCase() === target.toLowerCase());
        if (to && to !== from) seen.set([from, to].sort().join("|"), [from, to]);
      }
    return [...seen.values()];
  }, [notes]);
  const backlinks = names.filter((n) => n !== name && linksIn(notes[n]).some((t) => t.toLowerCase() === name.toLowerCase()));

  return (
    <div className="ob">
      <aside className="ob__side" aria-label="Notes">
        <p>
          Perfect's vault
          <button type="button" onClick={() => setNaming("")} aria-label="New note" title="New note">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.500v13M5.500 12h13" /></svg>
          </button>
        </p>
        {naming !== null && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const wanted = naming.trim().replace(/[[\]|]/g, "");
              if (wanted) open(wanted);
              setNaming(null);
            }}
          >
            <input autoFocus value={naming} onChange={(e) => setNaming(e.target.value)} onBlur={() => !naming.trim() && setNaming(null)} placeholder="Name the note" aria-label="Name the note" />
          </form>
        )}
        <div className="ob__files">
          {names.map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === name && mode !== "graph" ? "true" : undefined}
              onClick={() => {
                setName(n);
                if (mode === "graph") setMode("read");
              }}
            >
              {n}
            </button>
          ))}
        </div>
        {edited && (
          <button
            type="button"
            className="ob__reset"
            onClick={() => {
              save(starter);
              if (!starter[name]) setName("Home");
              setMode("read");
            }}
          >
            Reset the vault
          </button>
        )}
      </aside>
      <div className="ob__main">
        <div className="ob__bar">
          <h2>{mode === "graph" ? "Graph view" : name}</h2>
          {mode !== "graph" && (
            <button type="button" aria-pressed={mode === "edit"} onClick={() => setMode(mode === "edit" ? "read" : "edit")}>
              {mode === "edit" ? "Done" : "Edit"}
            </button>
          )}
          <button type="button" aria-pressed={mode === "graph"} onClick={() => setMode(mode === "graph" ? "read" : "graph")}>
            Graph
          </button>
        </div>
        {mode === "graph" && (
          <Graph
            names={names}
            edges={edges}
            current={name}
            open={(n) => {
              setName(n);
              setMode("read");
            }}
          />
        )}
        {mode === "edit" && <textarea className="ob__edit" value={notes[name]} onChange={(e) => save({ ...notes, [name]: e.target.value })} spellCheck="false" aria-label={name} />}
        {mode === "read" && (
          <div className="ob__read">
            <Reading text={notes[name]} find={find} open={open} />
            {backlinks.length > 0 && (
              <p className="ob__back">
                Linked from{" "}
                {backlinks.map((n) => (
                  <button key={n} type="button" className="ob__link" onClick={() => open(n)}>
                    {n}
                  </button>
                ))}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const OBSIDIAN_CSS = `
/* ---- Obsidian: its own dark colours and purple in every theme ---- */
.ob{display:grid;grid-template-columns:clamp(150px,22%,210px) minmax(0,1fr);height:100%;background:#1e1e1e;color:#dadada;font-size:14px;}
.ob__side{display:flex;flex-direction:column;min-height:0;padding:10px 8px;background:#262626;border-right:1px solid #363636;}
.ob__side p{margin:0 6px 8px;display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;color:#999;}
.ob__side p button{display:grid;place-items:center;width:24px;height:24px;padding:0;border:none;border-radius:5px;background:none;cursor:pointer;}
.ob__side p button:hover{background:#363636;color:#fff;}
.ob__side svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;}
.ob__side input{width:100%;margin-bottom:6px;padding:4px 8px;border:1px solid #a882ff;border-radius:5px;outline:none;background:#1e1e1e;color:inherit;font:inherit;font-size:13px;}
.ob__files{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin;display:flex;flex-direction:column;gap:1px;}
.ob__files button{flex:none;padding:4px 8px;border:none;border-radius:5px;background:none;cursor:pointer;text-align:left;font-size:13px;color:#b3b3b3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ob__files button:hover{background:#303030;color:#fff;}
.ob__files button[aria-current]{background:#363636;color:#fff;}
.ob__reset{flex:none;margin-top:8px;padding:5px 8px;border:1px solid #363636;border-radius:5px;background:none;cursor:pointer;font-size:12px;color:#999;}
.ob__reset:hover{color:#fff;border-color:#555;}
.ob__main{display:flex;flex-direction:column;min-width:0;min-height:0;}
.ob__bar{flex:none;display:flex;align-items:center;gap:6px;padding:7px 10px 7px 18px;border-bottom:1px solid #363636;}
.ob__bar h2{flex:1;margin:0;font-size:13px;font-weight:500;color:#b3b3b3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ob__bar button{padding:3px 10px;border:1px solid #363636;border-radius:5px;background:none;cursor:pointer;font-size:12.5px;color:#b3b3b3;}
.ob__bar button:hover{color:#fff;border-color:#555;}
.ob__bar button[aria-pressed="true"]{background:#a882ff;border-color:#a882ff;color:#16121f;}
.ob__read,.ob__edit{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin;padding:clamp(14px,2.4vw,28px) clamp(18px,5%,56px);line-height:1.6;}
.ob__read > *{max-width:680px;margin:0 0 12px;overflow-wrap:anywhere;}
.ob__read h2{font-size:26px;font-weight:700;line-height:1.2;color:#fff;}
.ob__read h3{margin-top:22px;font-size:18px;font-weight:600;color:#fff;}
.stage .ob__read ul{padding-left:22px;list-style:disc;}
.ob__read li{margin:3px 0;}
.ob__read li::marker{color:#666;}
.ob__read strong{color:#fff;font-weight:600;}
.ob__read a,.stage .ob__link{padding:0;border:none;background:none;cursor:pointer;font:inherit;color:#a882ff;text-decoration:none;}
.ob__read a:hover,.ob__link:hover{text-decoration:underline;text-underline-offset:3px;}
.stage .ob__link--new{color:#7d6aa8;}
.ob__back{margin-top:26px !important;padding-top:12px;border-top:1px solid #363636;font-size:12.5px;color:#999;}
.ob__back button{margin-left:8px;}
.ob__edit{display:block;width:100%;margin:0;border:none;outline:none;resize:none;background:none;color:#dadada;font-family:var(--mono);font-size:13px;caret-color:#a882ff;}
.ob__graph{flex:1;min-height:0;width:100%;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;}
.ob__graph.is-dragging{cursor:grabbing;}
.ob__graph line{stroke:#4a4a4a;stroke-width:1;transition:stroke .2s,opacity .2s;}
.ob__graph line.is-near{stroke:#6b5a99;}
.ob__graph [data-node]{cursor:pointer;outline:none;transition:opacity .2s;}
.ob__graph circle{fill:#8f8f8f;transition:fill .2s;}
.ob__graph text{font-family:var(--font-body);font-size:11px;fill:#9a9a9a;opacity:var(--names,1);pointer-events:none;transition:fill .2s;}
.ob__graph .is-current circle{fill:#a882ff;}
.ob__graph .is-current text{fill:#dadada;}
/* pointing at a note: it and what it links to light up, and everything else falls back */
.ob__graph.has-lit [data-node]:not(.is-lit){opacity:.22;}
.ob__graph.has-lit line:not(.is-lit){opacity:.18;}
.ob__graph line.is-lit{stroke:#a882ff;stroke-width:1.4;}
.ob__graph .is-lit circle{fill:#a882ff;}
.ob__graph .is-lit text{fill:#fff;opacity:1;}
.ob__graph [data-node]:focus-visible circle{stroke:#fff;stroke-width:1.5;}
.stage .ob :is(input,textarea):focus-visible{outline:none;}
@media (max-width:760px){
  .ob{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);}
  .ob__side{border-right:none;border-bottom:1px solid #363636;}
  .ob__files{flex-direction:row;overflow-x:auto;overflow-y:hidden;}
  .ob__reset{align-self:flex-start;}
  .ob__side input,.ob__edit{font-size:16px;}
}
`;

// Fetched only when Obsidian is first opened, so it brings its own styles with it.
export default function Obsidian(props) {
  return (
    <>
      <style>{OBSIDIAN_CSS}</style>
      <ObsidianApp {...props} />
    </>
  );
}
