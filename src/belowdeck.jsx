// Below Deck: a first-person game drawn in text, run from Ghostty by typing belowdeck. You are in a ship's hold,
// the rats have noticed you, and the way out is a green hatch somewhere in the dark. The picture is a raycaster:
// one ray per column of characters, walls shaded by how far away they are, rats drawn over the top.
// Loaded only when the command is first run.
import { useEffect, useRef, useState } from "react";
import { store, stored } from "./storage";

// # is a bulkhead, X the hatch out, P where you start, r a rat. Everything else is floor.
const MAP = [
  "################",
  "#P.....#.......#",
  "#.####.#.##.##.#",
  "#.#r...#..#..#.#",
  "#.#.####.##r.#.#",
  "#......#.....#.#",
  "####.#.#.#####.#",
  "#r...#...#...r.#",
  "#.##.#####.#.###",
  "#.#..r.....#...#",
  "#.#.######.###.#",
  "#...#....#...#r#",
  "###.#.##.#.#.#.#",
  "#r....#....#...X",
  "################",
];

const PLANE = 0.66; // how wide the view is: about 66 degrees
const SPEED = 2.6; // cells a second
const TURN = 2.4; // radians a second
const RAT_SPEED = 1.25;
const RADIUS = 0.22;
const HP = 5;
const RELOAD = 0.35;
const BEST_KEY = "stage-belowdeck";
// Near to far. None of these needs escaping in HTML.
const WALL = "@%#*+=-:.";
// A rat seen from the front, eight cells by seven. o is an eye; the last row is the legs, in two steps.
const RAT = ["##....##", "###..###", ".######.", "#o####o#", ".######.", "..####.."];
const LEGS = [".#.##.#.", "#..##..#"];

const cellAt = (x, y) => MAP[Math.floor(y)]?.[Math.floor(x)] ?? "#";
const solid = (c) => c === "#" || c === "X";
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function newWorld() {
  const rats = [];
  let player = null;
  MAP.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === "P") player = { x: x + 0.5, y: y + 0.5, dx: 1, dy: 0 };
      if (c === "r") rats.push({ x: x + 0.5, y: y + 0.5, dead: -1, bite: 0 });
    }),
  );
  return { player, rats, total: rats.length, kills: 0, hp: HP, time: 0, cool: 0, shot: -1, hurt: -1 };
}

// Moves something by (mx, my), one axis at a time so it slides along a wall instead of stopping dead.
// Says whether it bumped into the hatch.
function slide(o, mx, my) {
  let hatch = false;
  const across = cellAt(o.x + mx + Math.sign(mx) * RADIUS, o.y);
  if (!solid(across)) o.x += mx;
  else if (across === "X") hatch = true;
  const down = cellAt(o.x, o.y + my + Math.sign(my) * RADIUS);
  if (!solid(down)) o.y += my;
  else if (down === "X") hatch = true;
  return hatch;
}

function sees(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const n = Math.ceil(Math.hypot(dx, dy) / 0.1);
  for (let i = 1; i < n; i++) if (solid(cellAt(a.x + (dx * i) / n, a.y + (dy * i) / n))) return false;
  return true;
}

// Walks a ray from (px, py) across the grid until it meets a wall. dist is measured straight ahead, not along
// the ray, so walls don't bulge like a fish-eye.
function cast(px, py, rx, ry) {
  let mx = Math.floor(px);
  let my = Math.floor(py);
  const ddx = rx === 0 ? 1e30 : Math.abs(1 / rx);
  const ddy = ry === 0 ? 1e30 : Math.abs(1 / ry);
  const sx = rx < 0 ? -1 : 1;
  const sy = ry < 0 ? -1 : 1;
  let sdx = (rx < 0 ? px - mx : mx + 1 - px) * ddx;
  let sdy = (ry < 0 ? py - my : my + 1 - py) * ddy;
  for (let i = 0; i < 64; i++) {
    let side;
    if (sdx < sdy) {
      sdx += ddx;
      mx += sx;
      side = 0;
    } else {
      sdy += ddy;
      my += sy;
      side = 1;
    }
    const c = MAP[my]?.[mx] ?? "#";
    if (solid(c)) return { dist: side === 0 ? sdx - ddx : sdy - ddy, side, cell: c };
  }
  return { dist: 64, side: 0, cell: "#" };
}

// One step of the world. Returns "won" or "dead" when the game ends.
function step(w, dt, keys) {
  const p = w.player;
  w.time += dt;
  w.cool -= dt;

  const turn = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
  if (turn) {
    const a = turn * TURN * dt;
    const { dx, dy } = p;
    p.dx = dx * Math.cos(a) - dy * Math.sin(a);
    p.dy = dx * Math.sin(a) + dy * Math.cos(a);
  }
  const ahead = (keys.has("fwd") ? 1 : 0) - (keys.has("back") ? 1 : 0);
  const aside = (keys.has("strafeR") ? 1 : 0) - (keys.has("strafeL") ? 1 : 0);
  if (ahead || aside) {
    // To the right of the way you face is (-dy, dx), since y runs down the map.
    const scale = (SPEED * dt) / Math.hypot(ahead, aside);
    if (slide(p, (p.dx * ahead - p.dy * aside) * scale, (p.dy * ahead + p.dx * aside) * scale)) return "won";
  }

  if (keys.has("fire") && w.cool <= 0) {
    w.cool = RELOAD;
    w.shot = w.time;
    // The nearest rat close enough to the middle of the view, with nothing in the way.
    let target = null;
    let nearest = Infinity;
    for (const r of w.rats) {
      if (r.dead >= 0) continue;
      const vx = r.x - p.x;
      const vy = r.y - p.y;
      const forward = vx * p.dx + vy * p.dy;
      const across = Math.abs(vx * p.dy - vy * p.dx);
      if (forward > 0.2 && across < 0.3 && forward < nearest && sees(p, r)) {
        target = r;
        nearest = forward;
      }
    }
    if (target) {
      target.dead = w.time;
      w.kills++;
    }
  }

  for (const r of w.rats) {
    if (r.dead >= 0) continue;
    r.bite -= dt;
    const vx = p.x - r.x;
    const vy = p.y - r.y;
    const d = Math.hypot(vx, vy);
    if (d > 9 || !sees(r, p)) continue;
    // A rat stops at your feet rather than in your face.
    if (d > 0.75) slide(r, (vx / d) * RAT_SPEED * dt, (vy / d) * RAT_SPEED * dt);
    if (d < 0.9 && r.bite <= 0) {
      r.bite = 1;
      w.hp--;
      w.hurt = w.time;
      if (w.hp <= 0) return "dead";
    }
  }
  return null;
}

// The picture, as HTML: one line of text per row, with runs of the same colour in one span.
function draw(w, cols, rows, cw, lh) {
  const p = w.player;
  const planeX = -p.dy * PLANE;
  const planeY = p.dx * PLANE;
  const focal = (cols * cw) / 2 / PLANE;
  const horizon = rows / 2;
  const ch = new Array(cols * rows).fill(" ");
  const tone = new Array(cols * rows).fill("");
  const put = (x, y, c, t) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    ch[y * cols + x] = c;
    tone[y * cols + x] = t;
  };

  // The floor: the eye is half a cell up, so a row this far below the middle is looking at floor this far away.
  for (let y = Math.ceil(horizon); y < rows; y++) {
    const d = (focal * 0.5) / ((y + 0.5 - horizon) * lh);
    const c = d < 1.3 ? "=" : d < 2.6 ? "-" : d < 5 ? "." : " ";
    for (let x = 0; x < cols; x++) put(x, y, c, "fl");
  }

  const depth = new Float32Array(cols);
  for (let x = 0; x < cols; x++) {
    const cam = (2 * (x + 0.5)) / cols - 1;
    const hit = cast(p.x, p.y, p.dx + planeX * cam, p.dy + planeY * cam);
    depth[x] = hit.dist;
    const half = focal / Math.max(hit.dist, 0.05) / lh / 2;
    const near = Math.min(WALL.length - 1, Math.floor(hit.dist * 1.1) + hit.side);
    const shade = hit.cell === "X" ? "x" : `w${Math.min(3, Math.floor(hit.dist / 2.2) + hit.side)}`;
    const c = hit.cell === "X" ? (hit.dist < 4 ? "=" : "-") : WALL[near];
    for (let y = Math.max(0, Math.floor(horizon - half)); y < Math.min(rows, Math.ceil(horizon + half)); y++) {
      if (y + 0.5 >= horizon - half && y + 0.5 < horizon + half) put(x, y, c, shade);
    }
  }

  // Rats, far ones first so near ones cover them. A rat just shot shows as a burst for a moment.
  const invDet = 1 / (planeX * p.dy - p.dx * planeY);
  const seen = w.rats
    .filter((r) => r.dead < 0 || w.time - r.dead < 0.25)
    .map((r) => {
      const sx = r.x - p.x;
      const sy = r.y - p.y;
      return { r, tx: invDet * (p.dy * sx - p.dx * sy), ty: invDet * (-planeY * sx + planeX * sy) };
    })
    .filter((s) => s.ty > 0.15)
    .sort((a, b) => b.ty - a.ty);
  const legs = LEGS[Math.floor(w.time * 6) % 2];
  for (const { r, tx, ty } of seen) {
    const midX = (cols / 2) * (1 + tx / ty);
    // Half a cell wide and a little less tall: knee height, standing on the floor.
    const wide = (focal * 0.5) / ty / cw;
    const tall = (focal * 0.42) / ty / lh;
    const floor = horizon + focal / ty / lh / 2;
    const left = midX - wide / 2;
    const top = floor - tall;
    for (let x = Math.max(0, Math.floor(left)); x < Math.min(cols, Math.ceil(left + wide)); x++) {
      if (depth[x] < ty) continue;
      const u = Math.floor(((x + 0.5 - left) / wide) * 8);
      for (let y = Math.max(0, Math.floor(top)); y < Math.min(rows, Math.ceil(floor)); y++) {
        const v = Math.floor(((y + 0.5 - top) / tall) * 7);
        const m = (v === 6 ? legs : RAT[v])?.[u];
        if (!m || m === ".") continue;
        if (r.dead >= 0) put(x, y, "*", "h");
        else put(x, y, m === "o" ? "o" : "%", m === "o" ? "e" : ty < 2.5 ? "r0" : "r1");
      }
    }
  }

  // The sights, and a flare pistol that kicks when it fires.
  const cx = Math.floor(cols / 2);
  put(cx, Math.floor(horizon), "+", "c");
  const kick = w.time - w.shot < 0.12 ? 1 : 0;
  const gun = ["  ||  ", " [==] ", "/____\\"];
  gun.forEach((line, i) => [...line].forEach((c, j) => c !== " " && put(cx - 3 + j, rows - gun.length + i - kick, c, "g")));
  if (kick) ["\\|/", "-*-"].forEach((line, i) => [...line].forEach((c, j) => put(cx - 1 + j, rows - gun.length - 3 + i, c, "f")));

  let html = "";
  for (let y = 0; y < rows; y++) {
    let x = 0;
    while (x < cols) {
      const t = tone[y * cols + x];
      let run = "";
      while (x < cols && tone[y * cols + x] === t) run += ch[y * cols + x++];
      // Prefixed, since the other apps on the page have short class names of their own.
      html += t ? `<span class="bd-${t}">${run}</span>` : run;
    }
    if (y < rows - 1) html += "\n";
  }
  return html;
}

const KEYS = { ArrowUp: "fwd", w: "fwd", ArrowDown: "back", s: "back", ArrowLeft: "left", ArrowRight: "right", a: "strafeL", d: "strafeR", " ": "fire", f: "fire" };
const PAD = [
  ["left", "◀", "Turn left"],
  ["fwd", "▲", "Forward"],
  ["back", "▼", "Back"],
  ["right", "▶", "Turn right"],
  ["fire", "fire", "Fire"],
];

export default function BelowDeck({ onQuit }) {
  const rootRef = useRef(null);
  const screenRef = useRef(null);
  const world = useRef(null);
  const keys = useRef(new Set());
  const phase = useRef("ready");
  const shown = useRef({});
  const [hud, setHud] = useState({ phase: "ready", hp: HP, kills: 0, secs: 0, total: 0 });
  const [best, setBest] = useState(() => Number(stored(BEST_KEY)) || 0);
  const [touch] = useState(() => !!window.matchMedia?.("(pointer:coarse)").matches);

  const setPhase = (next) => {
    phase.current = next;
    setHud((h) => ({ ...h, phase: next }));
  };
  const restart = () => {
    world.current = newWorld();
    keys.current.clear();
    shown.current = {};
    setPhase("ready");
  };
  const quit = () => {
    const w = world.current;
    onQuit(phase.current === "won" ? `You climbed out in ${clock(w.time)}, with ${w.kills} of ${w.total} rats.` : `${w.kills} of ${w.total} rats, ${clock(w.time)} below deck.`);
  };
  const press = (act) => {
    keys.current.add(act);
    if (phase.current === "ready" || phase.current === "paused") setPhase("play");
  };

  useEffect(() => {
    world.current ??= newWorld();
    rootRef.current?.focus({ preventScroll: true });
    const pre = screenRef.current;
    // How many characters fit, measured in the screen's own type. Laid-out sizes, so a window still growing
    // out of its icon is measured at its real size.
    const size = { cols: 0, rows: 0, cw: 7, lh: 10 };
    const measure = () => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;width:100ch;";
      pre.append(probe);
      size.cw = probe.offsetWidth / 100 || 7;
      probe.remove();
      size.lh = parseFloat(getComputedStyle(pre).lineHeight) || 10;
      size.cols = Math.min(160, Math.floor(pre.clientWidth / size.cw));
      size.rows = Math.min(60, Math.floor(pre.clientHeight / size.lh));
    };
    const watch = new ResizeObserver(measure);
    watch.observe(pre);
    measure();

    let raf;
    let last = null;
    const frame = (now) => {
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = world.current;
      if (phase.current === "play" && !document.hidden) {
        const end = step(w, dt, keys.current);
        if (end === "won") {
          const prev = Number(stored(BEST_KEY)) || 0;
          if (!prev || w.time < prev) {
            store(BEST_KEY, String(w.time.toFixed(1)));
            setBest(w.time);
          }
        }
        if (end) setPhase(end);
      }
      const s = shown.current;
      const secs = Math.floor(w.time);
      if (s.hp !== w.hp || s.kills !== w.kills || s.secs !== secs) {
        shown.current = { hp: w.hp, kills: w.kills, secs };
        setHud((h) => ({ ...h, hp: w.hp, kills: w.kills, secs, total: w.total }));
      }
      if (size.cols > 0 && size.rows > 0) {
        pre.innerHTML = draw(w, size.cols, size.rows, size.cw, size.lh);
        pre.classList.toggle("is-hurt", w.time - w.hurt < 0.25);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // Looking away pauses it.
    const hide = () => document.hidden && phase.current === "play" && setPhase("paused");
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelAnimationFrame(raf);
      watch.disconnect();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  const over = hud.phase === "won" || hud.phase === "dead";
  const togglePause = () => {
    if (hud.phase === "play") setPhase("paused");
    else if (hud.phase === "paused") setPhase("play");
  };
  const onKeyDown = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const act = KEYS[key];
    if (act && !over) press(act);
    else if (key === "p") togglePause();
    else if (key === "r" || (key === "Enter" && over)) restart();
    else if (key === "q" || key === "Escape") quit();
    else if (!act) return;
    // The desktop behind listens for arrows and Escape too. These ones are the game's.
    e.preventDefault();
    e.stopPropagation();
  };
  const onKeyUp = (e) => {
    const act = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (act) keys.current.delete(act);
  };

  const status = {
    ready: touch ? "Find the green hatch. Press a button to start." : "Find the green hatch. Arrows move, space fires.",
    play: `Find the green hatch. ${clock(hud.secs)}`,
    paused: "Paused.",
    dead: "The rats got you.",
    won: `You climbed out in ${clock(hud.secs)}.`,
  }[hud.phase];

  return (
    <div className="bd" ref={rootRef} tabIndex={0} onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={() => keys.current.clear()} role="application" aria-label={`Below Deck. ${hud.hp} of ${HP} health. ${hud.kills} of ${hud.total} rats. ${status}`}>
      <p className="bd__top">
        belowdeck
        <span className="bd__hp" aria-hidden="true">
          {"♥".repeat(Math.max(0, hud.hp))}
          <span>{"·".repeat(HP - Math.max(0, hud.hp))}</span>
        </span>
        <span>
          rats {hud.kills}/{hud.total}
        </span>
        {best > 0 && <span>best {clock(best)}</span>}
        {over ? (
          <button type="button" onClick={restart}>[r] again</button>
        ) : (
          <button type="button" onClick={togglePause}>[p] {hud.phase === "paused" ? "resume" : "pause"}</button>
        )}
        <button type="button" onClick={quit}>[q] quit</button>
      </p>
      <pre className="bd__screen" ref={screenRef} aria-hidden="true" onPointerDown={() => rootRef.current?.focus({ preventScroll: true })} />
      <p className="bd__msg" aria-live="polite">
        {status}
      </p>
      {touch && !over && (
        <div className="bd__pad">
          {PAD.map(([act, label, name]) => (
            <button
              key={act}
              type="button"
              aria-label={name}
              onPointerDown={(e) => {
                e.preventDefault();
                press(act);
              }}
              onPointerUp={() => keys.current.delete(act)}
              onPointerCancel={() => keys.current.delete(act)}
              onPointerLeave={() => keys.current.delete(act)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <style>{BELOWDECK_CSS}</style>
    </div>
  );
}

const BELOWDECK_CSS = `
.bd{height:100%;display:flex;flex-direction:column;gap:4px;padding:8px 12px 10px;background:#101116;color:#e3e5ea;font-family:var(--mono);font-size:12px;line-height:1.5;outline:none;user-select:none;-webkit-user-select:none;}
.bd p{margin:0;}
.bd__top{display:flex;flex-wrap:wrap;justify-content:center;gap:0 1em;color:#7ee0a3;}
.bd__top > span{color:#c3c7d1;}
.bd__top .bd__hp{color:#ff7a70;letter-spacing:.1em;}
.bd__hp span{color:#4a4e5a;}
.bd__top button{padding:0;border:none;background:none;color:#7fb4ff;font:inherit;cursor:pointer;}
.bd__top button:hover{color:#fff;}
.bd__screen{flex:1 1 0;min-height:0;margin:0;overflow:hidden;font:inherit;font-size:10px;line-height:10px;white-space:pre;color:#5d6270;text-align:left;touch-action:none;cursor:crosshair;transition:background-color .15s;}
.bd__screen.is-hurt{background:rgba(255,90,80,.2);}
.bd__screen .bd-w0{color:#f0d2a8;}
.bd__screen .bd-w1{color:#c9a57a;}
.bd__screen .bd-w2{color:#94775a;}
.bd__screen .bd-w3{color:#5f4e3f;}
.bd__screen .bd-x{color:#7ee0a3;}
.bd__screen .bd-fl{color:#3f4554;}
.bd__screen .bd-r0{color:#ff7a70;}
.bd__screen .bd-r1{color:#c25a52;}
.bd__screen .bd-e{color:#ffe08a;}
.bd__screen .bd-h{color:#fff;}
.bd__screen .bd-c{color:#e3e5ea;}
.bd__screen .bd-g{color:#9aa0ad;}
.bd__screen .bd-f{color:#ffd27a;}
.bd__msg{text-align:center;color:#9aa0ad;}
.bd__pad{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;}
.bd__pad button{padding:12px 0;border:1px solid #2c2f3a;border-radius:8px;background:#1b1d25;color:#e3e5ea;font:inherit;touch-action:none;}
.bd__pad button:active{background:#2a2d38;}
`;
