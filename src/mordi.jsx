// Mordi, as its Mac menu-bar panel: the small sheet that drops from the menu bar in the real app, working, inside a
// window. The week's pace at the top, a Log button for each goal, the to-do list with a timer on each, and the
// three buttons along the bottom. The wording, the pace arithmetic and the colours (Mordi's Sage theme) follow the
// real one, but it talks to no server: it opens on made-up sample data, and a visitor's changes are kept in their
// browser only. Fetched the first time it's opened, so it brings its own styles with it.
import { useEffect, useState } from "react";
import { store, stored } from "./storage";

const KEY = "stage-mordi-bar";
const LIVE = "https://mordi.latesailor.dev";
const MOODS = ["great", "good", "neutral", "bad", "terrible"];
const two = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
const addDays = (d, n) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};
// The week runs Monday to Sunday, Mordi's default. dayIndex is 0 on Monday.
const dayIndexOf = (d) => (d.getDay() + 6) % 7;
const clockOf = (seconds) => `${Math.floor(seconds / 60)}:${two(seconds % 60)}`;
let serial = 0;
const newId = () => `${Date.now().toString(36)}${(serial++).toString(36)}`;

// What a first-time visitor sees: two goals logged on most of the days of this week so far, and a short list.
function sample(now) {
  const today = dayIndexOf(now);
  // every day of the week before today, bar one, so the week reads as a little behind
  const logged = Array.from({ length: today }, (_, i) => i).filter((i) => !(today >= 3 && i === 1));
  const goals = [
    { id: "enrich", title: "Software Enrichment", target: 7 },
    { id: "dev", title: "Software Development", target: 7 },
  ];
  return {
    goals,
    entries: goals.flatMap((g) => logged.map((i) => ({ id: `${g.id}${i}`, goalId: g.id, date: iso(addDays(now, i - today)), note: "", mood: "good" }))),
    todos: [
      { id: "t1", text: "Design your own logo", done: false },
      { id: "t2", text: "Read chapter 4", done: false },
      { id: "t3", text: "Return library books", done: false },
      { id: "t6", text: "Reply to the study group", done: false },
      { id: "t7", text: "Sketch the next app icon", done: false },
      { id: "t4", text: "Publish gitube", done: true },
      { id: "t5", text: "Portfolio website refine", done: true },
    ],
  };
}

// A goal's ring: this week's count against its target, around Mordi's four-pointed mark.
function Ring({ done, target }) {
  const r = 12;
  const around = 2 * Math.PI * r;
  const part = Math.min(1, done / target);
  return (
    <svg className="mm__ring" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r={r} />
      {part > 0 && <circle className="mm__arc" cx="15" cy="15" r={r} strokeDasharray={`${part * around} ${around}`} />}
      <path d="M15 9.500c.5 3 2 4.500 5 5-3 .5-4.500 2-5 5-.5-3-2-4.500-5-5 3-.5 4.500-2 5-5z" />
    </svg>
  );
}

export default function Mordi({ onQuit }) {
  const [now] = useState(() => new Date());
  const [data, setData] = useState(() => {
    try {
      const kept = JSON.parse(stored(KEY) ?? "null");
      if (kept?.goals && kept.entries && kept.todos) return kept;
    } catch {
      /* unreadable: fall through to the sample */
    }
    return sample(now);
  });
  // The line under the goals: what was just done.
  const [message, setMessage] = useState("");
  const [todo, setTodo] = useState("");
  // "Log with a note…": the entry being written, while its form is open.
  const [draft, setDraft] = useState(null);
  // The to-do being timed, and when its timer started.
  const [timing, setTiming] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!timing) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - timing.since) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [timing]);

  // Nothing is kept until the visitor changes something; until then the sample follows today's date.
  const save = (next) => {
    setData(next);
    store(KEY, JSON.stringify(next));
  };

  const { goals, entries, todos } = data;
  const todayKey = iso(now);
  const today = dayIndexOf(now);
  const weekKeys = Array.from({ length: 7 }, (_, i) => iso(addDays(now, i - today)));
  const doneFor = (g) => Math.min(g.target, entries.filter((e) => e.goalId === g.id && weekKeys.includes(e.date)).length);
  // The pace, worked out as the real app does: by today each goal should have its share of the week's target.
  const planned = goals.reduce((sum, g) => sum + g.target, 0);
  const achieved = goals.reduce((sum, g) => sum + doneFor(g), 0);
  const expected = goals.reduce((sum, g) => sum + Math.round((g.target * (today + 1)) / 7), 0);
  const delta = achieved - expected;
  const pace = !planned ? "No targets set" : achieved >= planned ? "Week done" : delta > 0 ? `Ahead by ${delta}` : delta < 0 ? `Log ${-delta} to be on pace` : "On pace";
  const open = todos.filter((t) => !t.done).length;
  // Open to-dos first, finished ones after, each in the order they were added.
  const shown = [...todos.filter((t) => !t.done), ...todos.filter((t) => t.done)];

  const log = (goal, note = "", mood = "good") => {
    save({ ...data, entries: [...entries, { id: newId(), goalId: goal.id, date: todayKey, note, mood }] });
    setMessage(`Logged ${goal.title} for today.`);
  };
  const toggleTimer = (t) => {
    if (timing?.id === t.id) {
      setMessage(`Timed ${t.text} for ${clockOf(elapsed)}.`);
      setTiming(null);
    } else {
      setElapsed(0);
      setTiming({ id: t.id, since: Date.now() });
    }
  };

  return (
    <div className="mm">
      <style>{MORDI_CSS}</style>
      {/* the panel itself scrolls when the window is too short for it; the note sheet sits over it and doesn't */}
      <div className="mm__in">
      <header className="mm__head">
        <p>
          <span>This week</span>
          <b>{pace}</b>
        </p>
        <strong>{planned ? Math.round((achieved / planned) * 100) : 0}%</strong>
      </header>

      <ul className="mm__goals">
        {goals.map((g) => (
          <li key={g.id}>
            <Ring done={doneFor(g)} target={g.target} />
            <p>
              <b>{g.title}</b>
              <span>
                {doneFor(g)} of {g.target}
              </span>
            </p>
            <button type="button" className="mm__btn" onClick={() => log(g)} aria-label={`Log ${g.title} for today`}>
              Log
            </button>
          </li>
        ))}
      </ul>
      <p className="mm__msg" role="status">
        {timing ? `Timing ${todos.find((t) => t.id === timing.id)?.text ?? "a to-do"} · ${clockOf(elapsed)}` : message || "Sample data, kept in this browser."}
      </p>

      <section className="mm__todo">
        <h3>
          To do <span>{open === 0 ? "All clear" : `${open} open`}</span>
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!todo.trim()) return;
            save({ ...data, todos: [{ id: newId(), text: todo.trim(), done: false }, ...todos] });
            setTodo("");
          }}
        >
          <input value={todo} onChange={(e) => setTodo(e.target.value)} placeholder="Add a to-do" aria-label="Add a to-do" maxLength={200} />
        </form>
        <ul>
          {shown.map((t) => (
            <li key={t.id}>
              <label>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => {
                    if (timing?.id === t.id) setTiming(null);
                    save({ ...data, todos: todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) });
                  }}
                />
                <span>{t.text}</span>
              </label>
              {!t.done && (
                <button type="button" className="mm__play" aria-pressed={timing?.id === t.id} onClick={() => toggleTimer(t)} aria-label={timing?.id === t.id ? `Stop timing ${t.text}` : `Time ${t.text}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9.500" />
                    {timing?.id === t.id ? <path className="mm__solid" d="M9 9h6v6H9z" /> : <path className="mm__solid" d="M10 8.300v7.400l6-3.700z" />}
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
        {todos.some((t) => t.done) && (
          <button type="button" className="mm__text" onClick={() => save({ ...data, todos: todos.filter((t) => !t.done) })}>
            Clear done
          </button>
        )}
      </section>

      <footer className="mm__foot">
        <a className="mm__btn" href={LIVE} target="_blank" rel="noreferrer" data-umami-event="mordi-live">
          Open Mordi
        </a>
        <button type="button" className="mm__text" onClick={() => setDraft({ goalId: goals[0]?.id ?? "", note: "", mood: "good" })} disabled={!goals.length}>
          Log with a note…
        </button>
        <button type="button" className="mm__text" onClick={onQuit}>
          Quit
        </button>
      </footer>
      </div>

      {draft && (
        <form
          className="mm__sheet"
          onSubmit={(e) => {
            e.preventDefault();
            const goal = goals.find((g) => g.id === draft.goalId);
            if (goal) log(goal, draft.note.trim(), draft.mood);
            setDraft(null);
          }}
        >
          <h3>Log with a note</h3>
          <select value={draft.goalId} onChange={(e) => setDraft({ ...draft, goalId: e.target.value })} aria-label="Goal">
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          <input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="How did it go?" aria-label="Note" maxLength={120} />
          <p className="mm__moods">
            {MOODS.map((m) => (
              <button key={m} type="button" aria-pressed={draft.mood === m} onClick={() => setDraft({ ...draft, mood: m })}>
                {m}
              </button>
            ))}
          </p>
          <p className="mm__save">
            <button type="button" className="mm__text" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="submit" className="mm__btn">
              Log for today
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

const MORDI_CSS = `
/* Mordi's menu-bar panel keeps its own colours (Sage) and its own type in every theme, and stays matte: no
   gradients, gloss or see-through, the way the real one is drawn. */
.mm{
  --mm-bg:#f2f8ed;--mm-surface:#e3edda;--mm-text:#1b2215;--mm-accent:#617a3f;--mm-accent-2:#546d32;--mm-line:rgba(27,34,21,.16);--mm-soft:rgba(27,34,21,.62);
  --mm-serif:ui-serif,'New York','Source Serif 4',Georgia,'Times New Roman',serif;
  position:relative;height:100%;background:var(--mm-bg);color:var(--mm-text);
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',Roboto,sans-serif;font-size:13.5px;line-height:1.3;
}
.mm__in{display:flex;flex-direction:column;height:100%;padding:14px 16px 12px;overflow-y:auto;scrollbar-width:thin;}
.stage .mm :is(button,input,select,a){font:inherit;color:inherit;}
.stage .mm ul{list-style:none;margin:0;padding:0;}
.mm__head{flex:none;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.mm__head p{margin:0;display:flex;flex-direction:column;gap:2px;font-family:var(--mm-serif);}
.mm__head span{font-size:12.5px;font-weight:600;color:var(--mm-soft);}
.mm__head b{font-size:16px;font-weight:700;letter-spacing:-.005em;}
.mm__head strong{font-family:var(--mm-serif);font-size:27px;font-weight:700;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums;}
.mm__goals{flex:none;display:grid;gap:7px;margin-top:12px !important;}
.mm__goals li{display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:10px;}
.mm__ring{width:30px;height:30px;}
.mm__ring circle{fill:none;stroke:var(--mm-surface);stroke-width:3.4;}
.mm__ring .mm__arc{stroke:var(--mm-accent);stroke-linecap:butt;transform:rotate(-90deg);transform-origin:15px 15px;}
.mm__ring path{fill:var(--mm-text);}
.mm__goals p{margin:0;display:flex;flex-direction:column;min-width:0;}
.mm__goals b{font-weight:500;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mm__goals span{font-size:11px;color:var(--mm-soft);font-variant-numeric:tabular-nums;}
.mm__btn{display:inline-block;padding:6px 13px;border:1px solid var(--mm-line);border-radius:9px;background:var(--mm-surface);cursor:pointer;font-weight:600 !important;font-size:13px !important;text-decoration:none;white-space:nowrap;}
.mm__btn:hover{border-color:var(--mm-accent);}
.mm__btn:active{background:#d6e3ca;}
.mm__text{padding:0;border:none;background:none;cursor:pointer;font-weight:600 !important;font-size:13px !important;color:var(--mm-accent-2) !important;white-space:nowrap;}
.mm__text:hover:not(:disabled){text-decoration:underline;text-underline-offset:3px;}
.mm__text:disabled{opacity:.45;cursor:default;}
.mm__msg{flex:none;margin:9px 0 0;min-height:1.3em;font-size:11.5px;color:var(--mm-soft);font-variant-numeric:tabular-nums;}
.mm__todo{flex:1 0 auto;display:flex;flex-direction:column;gap:7px;margin-top:11px;padding-top:11px;border-top:1px solid var(--mm-line);}
.mm :is(h3){margin:0;display:flex;align-items:baseline;justify-content:space-between;font-family:var(--mm-serif);font-size:12.5px;font-weight:600;color:var(--mm-soft);}
.mm h3 span{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;font-weight:400;font-size:11px;font-variant-numeric:tabular-nums;}
.mm :is(input:not([type="checkbox"]),select){width:100%;padding:7px 10px;border:1px solid var(--mm-line);border-radius:8px;outline:none;background:var(--mm-surface);}
.mm :is(input,select):focus-visible{border-color:var(--mm-accent);}
.mm input::placeholder{color:rgba(27,34,21,.42);}
.mm__todo ul{flex:1 1 0;min-height:80px;overflow-y:auto;scrollbar-width:thin;display:grid;align-content:start;gap:1px;}
.mm__todo li{display:flex;align-items:center;gap:8px;min-height:25px;}
.mm__todo label{flex:1;min-width:0;display:flex;align-items:center;gap:9px;cursor:pointer;}
.mm__todo label input{flex:none;width:14px;height:14px;margin:0;accent-color:var(--mm-accent);}
.mm__todo label span{min-width:0;overflow-wrap:anywhere;}
.mm__todo input:checked + span{text-decoration:line-through;color:var(--mm-soft);}
.mm__play{flex:none;display:grid;place-items:center;width:20px;height:20px;padding:0;border:none;background:none;cursor:pointer;color:var(--mm-soft) !important;}
.mm__play svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.5;}
.mm__play .mm__solid{fill:currentColor;stroke:none;}
.mm__play:hover,.mm__play[aria-pressed="true"]{color:var(--mm-accent-2) !important;}
.mm__todo > .mm__text{align-self:flex-start;}
.mm__foot{flex:none;display:flex;align-items:center;gap:14px;margin-top:11px;padding-top:11px;border-top:1px solid var(--mm-line);}
.mm__foot .mm__text:last-child{margin-left:auto;}
/* "Log with a note…": a small sheet over the panel */
.mm__sheet{position:absolute;inset:auto 12px 12px;z-index:2;display:grid;gap:8px;padding:14px;border:1px solid var(--mm-line);border-radius:12px;background:var(--mm-bg);box-shadow:0 0 0 100vmax rgba(27,34,21,.3);}
.mm__sheet h3{font-size:15px;color:var(--mm-text);}
.mm__sheet p{margin:0;display:flex;flex-wrap:wrap;gap:5px;}
.mm__moods button{padding:4px 9px;border:1px solid var(--mm-line);border-radius:999px;background:var(--mm-bg);cursor:pointer;font-size:11.5px !important;text-transform:capitalize;}
.mm__moods [aria-pressed="true"]{background:var(--mm-accent);border-color:var(--mm-accent);color:#fff !important;}
.mm__save{justify-content:flex-end;align-items:center;gap:14px !important;margin-top:2px !important;}
.stage .mm :is(button,a,select):focus-visible{outline:2px solid var(--mm-accent);outline-offset:2px;border-radius:8px;}
@media (max-width:760px){
  .mm{font-size:15px;}
  .mm__in{padding:18px var(--pad) 16px;}
  .mm :is(input:not([type="checkbox"]),select){font-size:16px;}
  .mm__todo li{min-height:34px;}
}
`;
