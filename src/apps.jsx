// The small apps on the laptop's dock (Finder, Safari, Slack, Claude, VSCodium, Ghostty) and their styles. Each
// one is a toy that does one real thing; none of them talks to a server. This file is only fetched when one of
// them is first opened (or once the page has gone quiet), so it brings its own styles with it.
import { useEffect, useRef, useState } from "react";
import { AppIcon, DriveArt, FolderArt, TextArt } from "./art";
import { EXPERIENCE, GITHUB, PROJECTS } from "./data";
import { nodeAt } from "./drive";
import { store, stored } from "./storage";

const KINDS = { folder: "Folder", app: "Application", link: "Web location", text: "Plain text", project: "Markdown", image: "Image", pdf: "PDF document" };

function NodeIcon({ node }) {
  if (node.kind === "folder") return <FolderArt />;
  if (node.kind === "image") return <img className="fd__thumb" src={node.src} alt="" loading="lazy" />;
  if (node.kind === "pdf") return <img className="fd__thumb fd__thumb--page" src="/resume-1.png" alt="" loading="lazy" />;
  if (node.kind === "link") return <img className="fd__thumb fd__thumb--app" src={node.icon} alt="" />;
  if (node.kind === "app")
    return (
      <span className="fd__tile">
        <AppIcon id={node.app} />
      </span>
    );
  return <TextArt />;
}

/* ---- Finder: a sidebar, a toolbar with back and forward, icons or a list, a path bar. A click picks,
   a double click (or a tap, or Enter) opens. Folders open here; everything else opens its app. ---- */
const FAVOURITES = ["Applications", "Desktop", "Projects"];

function FinderApp({ drive, start, onOpen }) {
  const [nav, setNav] = useState({ stack: [start], at: 0 });
  const [picked, setPicked] = useState(null);
  const [view, setView] = useState("icons");
  const [look, setLook] = useState(null);
  const touch = useRef(false);
  const path = nav.stack[nav.at];
  const here = nodeAt(drive, path);
  const items = here.children;

  const go = (next) => {
    setNav((n) => ({ stack: [...n.stack.slice(0, n.at + 1), next], at: n.at + 1 }));
    setPicked(null);
  };
  const step = (d) => {
    setNav((n) => ({ ...n, at: n.at + d }));
    setPicked(null);
  };
  const open = (node) => {
    if (node.kind === "folder") go([...path, node.name]);
    else if (node.kind === "image") setLook(node);
    else onOpen(node);
  };
  const itemProps = (node) => ({
    type: "button",
    "aria-pressed": picked === node.name,
    onPointerDown: (e) => {
      touch.current = e.pointerType !== "mouse";
    },
    // A tap or the keyboard opens straight away; a mouse click picks, and a double click opens.
    onClick: (e) => (touch.current || e.detail === 0 ? open(node) : setPicked(node.name)),
    onDoubleClick: () => open(node),
  });

  return (
    <div className="fd">
      <aside className="fd__side" aria-label="Sidebar">
        <p>Favourites</p>
        {FAVOURITES.map((name) => (
          <button key={name} type="button" aria-current={path.length === 1 && path[0] === name ? "true" : undefined} onClick={() => go([name])}>
            <FolderArt />
            {name}
          </button>
        ))}
        <p>Locations</p>
        <button type="button" aria-current={path.length === 0 ? "true" : undefined} onClick={() => go([])}>
          <DriveArt />
          {drive.name}
        </button>
      </aside>
      <div className="fd__main">
        <div className="fd__bar">
          <button type="button" onClick={() => step(-1)} disabled={nav.at === 0} aria-label="Back">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.500 6-6 6 6 6" /></svg>
          </button>
          <button type="button" onClick={() => step(1)} disabled={nav.at === nav.stack.length - 1} aria-label="Forward">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.500 6 6 6-6 6" /></svg>
          </button>
          <h2>{here.name}</h2>
          <div className="fd__views" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "icons"} onClick={() => setView("icons")} aria-label="As icons">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h5.500v5.500H5zM13.500 5H19v5.500h-5.500zM5 13.500h5.500V19H5zM13.500 13.500H19V19h-5.500z" /></svg>
            </button>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} aria-label="As a list">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
            </button>
          </div>
        </div>
        <div className="fd__files" onClick={(e) => e.target === e.currentTarget && setPicked(null)}>
          {!items.length && <p className="fd__empty">Nothing in here yet.</p>}
          {view === "icons" ? (
            <ul className="fd__grid">
              {items.map((node) => (
                <li key={node.name}>
                  <button {...itemProps(node)}>
                    <NodeIcon node={node} />
                    <b>{node.name}</b>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="fd__list">
              <li className="fd__head" aria-hidden="true">
                <span>Name</span>
                <span>Kind</span>
              </li>
              {items.map((node) => (
                <li key={node.name}>
                  <button {...itemProps(node)}>
                    <NodeIcon node={node} />
                    <b>{node.name}</b>
                    <span>{KINDS[node.kind]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="fd__path">
          <span>
            {[drive.name, ...path].map((name, i) => (
              <button key={i} type="button" onClick={() => go(path.slice(0, i))}>
                {name}
              </button>
            ))}
          </span>
          <span>
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </p>
      </div>
      {look && (
        <button type="button" className="fd__look" onClick={() => setLook(null)} aria-label={`Close ${look.name}`}>
          <img src={look.src} alt="" />
          <b>{look.name}</b>
        </button>
      )}
    </div>
  );
}

/* ---- Ghostty: a terminal over the same drive. A handful of commands that really do what they say. ---- */
const HELP = `Things that work here:
  ls [folder]     list what's in a folder
  cd <folder>     go into a folder (cd .. goes back up, cd alone goes home)
  pwd             where you are
  cat <file>      read a file
  open <thing>    open a file, folder or app on the laptop
  whoami          who you are
  neofetch        about this machine
  echo, date, clear, exit`;

function TerminalApp({ drive, onOpen, onExit, readText }) {
  const [lines, setLines] = useState([{ out: "Last login: just now, on a laptop inside a website.\nType help to see what works." }]);
  const [cwd, setCwd] = useState([]);
  const [input, setInput] = useState("");
  const past = useRef({ list: [], at: 0 });
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const label = (path) => (path.length ? path[path.length - 1] : "~");

  useEffect(() => {
    // On a phone, focusing would throw the keyboard up over the window the moment it opens.
    if (window.matchMedia?.("(pointer:fine)").matches) inputRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    boxRef.current?.scrollTo(0, boxRef.current.scrollHeight);
  }, [lines]);

  // Follows a typed path from where you are. Names match without regard to capitals.
  const resolve = (arg) => {
    const parts = /^[/~]/.test(arg) ? [] : [...cwd];
    for (const seg of arg.replace(/^~/, "").split("/")) {
      if (!seg || seg === ".") continue;
      if (seg === "..") {
        parts.pop();
        continue;
      }
      const next = nodeAt(drive, parts)?.children?.find((c) => c.name.toLowerCase() === seg.toLowerCase());
      if (!next) return null;
      parts.push(next.name);
    }
    return { path: parts, node: nodeAt(drive, parts) };
  };

  const read = (node) => {
    if (node.kind === "text") return readText();
    if (node.kind === "project") {
      const p = PROJECTS[node.index];
      return `# ${p.name}\n${p.kind}\n\n${p.summary}\n\nBuilt with: ${p.stack.join(", ")}\n${p.live ? `Live: ${p.live}\n` : ""}Code: ${p.repo}`;
    }
    return null;
  };

  const run = (line) => {
    const [cmd, ...rest] = line.trim().split(/\s+/);
    const arg = rest.join(" ").replace(/^["']|["']$/g, "");
    switch (cmd) {
      case "":
        return "";
      case "help":
        return HELP;
      case "pwd":
        return `/${cwd.join("/")}`;
      case "whoami":
        return "visitor";
      case "date":
        return new Date().toString();
      case "echo":
        return arg;
      case "clear":
        return null;
      case "exit":
        onExit();
        return "";
      case "sudo":
        return "visitor is not in the sudoers file. This incident will be reported.";
      case "neofetch":
        return `visitor@latesailor\n------------------\nOS: latesailor.dev, React on Vite\nHost: a laptop drawn in CSS\nShell: about twelve commands\nDisk: ${drive.name}, ${PROJECTS.length} projects\nUptime: since you opened the tab\nCode: ${GITHUB}`;
      case "ls": {
        const hit = resolve(arg || ".");
        if (!hit) return `ls: ${arg}: No such file or directory`;
        if (hit.node.kind !== "folder") return hit.node.name;
        return hit.node.children.map((c) => (c.kind === "folder" ? `${c.name}/` : c.name)).join("\n") || "";
      }
      case "cd": {
        const hit = resolve(arg || "~");
        if (!hit) return `cd: no such file or directory: ${arg}`;
        if (hit.node.kind !== "folder") return `cd: not a directory: ${arg}`;
        setCwd(hit.path);
        return "";
      }
      case "cat": {
        if (!arg) return "usage: cat <file>";
        const hit = resolve(arg);
        if (!hit) return `cat: ${arg}: No such file or directory`;
        if (hit.node.kind === "folder") return `cat: ${arg}: Is a directory`;
        return read(hit.node) ?? `cat: ${hit.node.name}: not text. Try: open ${hit.node.name}`;
      }
      case "open": {
        if (!arg) return "usage: open <file, folder or app>";
        // A bare app name works too: open projects, open mordi.
        const hit = resolve(arg) ?? resolve(`/Applications/${arg}.app`) ?? resolve(`/Applications/${arg}.webloc`);
        if (!hit) return `open: ${arg}: nothing by that name`;
        onOpen(hit.node, hit.path);
        return "";
      }
      default:
        return `zsh: command not found: ${cmd}`;
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const out = run(input);
    if (input.trim()) past.current.list.push(input);
    past.current.at = past.current.list.length;
    setLines((l) => (out === null ? [] : [...l, { cwd: label(cwd), cmd: input }, ...(out ? [{ out }] : [])]));
    setInput("");
  };
  const onKeyDown = (e) => {
    const h = past.current;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      h.at = Math.min(h.list.length, Math.max(0, h.at + (e.key === "ArrowUp" ? -1 : 1)));
      setInput(h.list[h.at] ?? "");
    } else if (e.key === "Tab") {
      // Finish the name being typed, if only one thing here starts with it.
      e.preventDefault();
      const at = input.lastIndexOf(" ") + 1;
      const word = input.slice(at).toLowerCase();
      const hits = word ? nodeAt(drive, cwd).children.filter((c) => c.name.toLowerCase().startsWith(word)) : [];
      if (hits.length === 1) setInput(input.slice(0, at) + hits[0].name + (hits[0].kind === "folder" ? "/" : ""));
    }
  };

  return (
    <div className="tm" ref={boxRef} onClick={() => !window.getSelection()?.toString() && inputRef.current?.focus({ preventScroll: true })}>
      {lines.map((l, i) =>
        l.out === undefined ? (
          <p key={i}>
            <span className="tm__who">visitor@latesailor</span> <span className="tm__cwd">{l.cwd}</span> % {l.cmd}
          </p>
        ) : (
          <pre key={i}>{l.out}</pre>
        ),
      )}
      <form onSubmit={submit}>
        <label htmlFor="tm-in">
          <span className="tm__who">visitor@latesailor</span> <span className="tm__cwd">{label(cwd)}</span> %
        </label>
        <input id="tm-in" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck="false" aria-label="Command" />
      </form>
    </div>
  );
}

/* ---- VSCodium: a small text editor. Two files, line numbers, a status bar. What's typed is kept in this browser. ---- */
const CODE_FILES = [
  {
    name: "README.md",
    text: "# A small text editor\n\nIt lives inside a laptop, inside a website.\n\n- Type anywhere. Tab indents by two spaces.\n- Each file is saved in this browser only.\n- Reset puts a file back the way it started.\n",
  },
  { name: "notes.txt", text: "Leave yourself a note.\n" },
];

function EditorApp() {
  const [name, setName] = useState(CODE_FILES[0].name);
  const [texts, setTexts] = useState(() => Object.fromEntries(CODE_FILES.map((f) => [f.name, stored(`stage-code:${f.name}`) ?? f.text])));
  const [caret, setCaret] = useState({ line: 1, col: 1 });
  const gutter = useRef(null);
  const original = CODE_FILES.find((f) => f.name === name).text;
  const text = texts[name];
  const count = text.split("\n").length;

  const write = (value) => {
    setTexts((t) => ({ ...t, [name]: value }));
    store(`stage-code:${name}`, value === original ? null : value);
  };
  const track = (e) => {
    const before = e.target.value.slice(0, e.target.selectionStart).split("\n");
    setCaret({ line: before.length, col: before[before.length - 1].length + 1 });
  };
  const onKeyDown = (e) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const el = e.target;
    el.setRangeText("  ", el.selectionStart, el.selectionEnd, "end");
    write(el.value);
  };

  return (
    <div className="vs">
      <aside className="vs__side" aria-label="Explorer">
        <p>Explorer</p>
        {CODE_FILES.map((f) => (
          <button key={f.name} type="button" aria-current={f.name === name ? "true" : undefined} onClick={() => setName(f.name)}>
            {f.name}
          </button>
        ))}
      </aside>
      <div className="vs__main">
        <div className="vs__tabs" role="tablist">
          {CODE_FILES.map((f) => (
            <button key={f.name} type="button" role="tab" aria-selected={f.name === name} onClick={() => setName(f.name)}>
              {f.name}
              {texts[f.name] !== f.text && <i aria-label="edited" />}
            </button>
          ))}
        </div>
        <div className="vs__edit">
          <pre className="vs__nums" ref={gutter} aria-hidden="true">
            {Array.from({ length: count }, (_, i) => i + 1).join("\n")}
          </pre>
          <textarea
            key={name}
            value={text}
            wrap="off"
            spellCheck="false"
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={name}
            onChange={(e) => {
              write(e.target.value);
              track(e);
            }}
            onKeyDown={onKeyDown}
            onKeyUp={track}
            onClick={track}
            onScroll={(e) => {
              gutter.current.scrollTop = e.target.scrollTop;
            }}
          />
        </div>
        <p className="vs__status">
          <span>
            Ln {caret.line}, Col {caret.col}
          </span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>{name.endsWith(".md") ? "Markdown" : "Plain Text"}</span>
          {text !== original && (
            <button type="button" onClick={() => write(original)}>
              Reset
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

/* ---- Slack: one small workspace that says one thing, how to reach me. Messages typed here go nowhere, so the
   reply says so and offers to turn them into an email. ---- */
const SLACK_CHANNELS = ["contact", "general"];

const SlackMessage = ({ me, time, children }) => (
  <li>
    <span className={me ? "sl__face" : "sl__face sl__face--pp"} aria-hidden="true">
      {me ? "You" : "PP"}
    </span>
    <div>
      <p className="sl__who">
        <b>{me ? "You" : "Perfect Phanitchaleun"}</b> <span>{time}</span>
      </p>
      {children}
    </div>
  </li>
);

function SlackApp({ email }) {
  const [channel, setChannel] = useState("contact");
  const [sent, setSent] = useState([]);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [time] = useState(() => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [sent, channel]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: the address is on screen to copy by hand */
    }
  };
  const send = (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSent((s) => [...s, { channel, body }]);
    setDraft("");
  };
  return (
    <div className="sl">
      <aside className="sl__side">
        <p className="sl__team">latesailor</p>
        <p>Channels</p>
        {SLACK_CHANNELS.map((c) => (
          <button key={c} type="button" aria-current={c === channel ? "true" : undefined} onClick={() => setChannel(c)}>
            <i aria-hidden="true">#</i>
            {c}
          </button>
        ))}
        <p>Direct messages</p>
        <button type="button" onClick={() => setChannel("contact")}>
          <i className="sl__dot" aria-hidden="true" />
          Perfect Phanitchaleun
        </button>
      </aside>
      <div className="sl__main">
        <h2>
          <i aria-hidden="true">#</i> {channel}
        </h2>
        <ol className="sl__feed">
          {channel === "contact" ? (
            <SlackMessage time={time}>
              <p>Hey, thanks for stopping by. The best way to reach me is email:</p>
              <p className="sl__mail">
                <a href={`mailto:${email}`} data-umami-event="email-click" data-umami-event-location="slack">
                  {email}
                </a>
                <button type="button" onClick={copy}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </p>
            </SlackMessage>
          ) : (
            <SlackMessage time={time}>
              <p>
                Welcome to the smallest Slack there is. It only exists on this laptop screen. My email is in{" "}
                <button type="button" className="sl__link" onClick={() => setChannel("contact")}>
                  #contact
                </button>
                .
              </p>
            </SlackMessage>
          )}
          {sent
            .filter((m) => m.channel === channel)
            .map((m, i) => (
              <li key={i} className="sl__pair">
                <ol>
                  <SlackMessage me time={time}>
                    <p>{m.body}</p>
                  </SlackMessage>
                  <SlackMessage time={time}>
                    <p>
                      Messages typed here don't reach me, there's nobody on the other end.{" "}
                      <a href={`mailto:${email}?body=${encodeURIComponent(m.body)}`} data-umami-event="email-click" data-umami-event-location="slack-reply">
                        Send that as an email
                      </a>{" "}
                      and it will.
                    </p>
                  </SlackMessage>
                </ol>
              </li>
            ))}
          <li ref={endRef} aria-hidden="true" />
        </ol>
        <form className="sl__write" onSubmit={send}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message #${channel}`} aria-label={`Message #${channel}`} />
          <button type="submit" disabled={!draft.trim()} aria-label="Send">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.500 20.500 12 4 19.500l2.500-7.500z" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---- Claude: a scripted stand-in. It answers a few questions about me from the site's own content, word by
   word, and says plainly that it isn't the real thing. Nothing typed leaves the page. ---- */
const TOPICS = [
  {
    ask: "What has Perfect built?",
    keys: ["project", "built", "build", "made", "making", "portfolio", "code"],
    answer: () => `${PROJECTS.length} projects are on this laptop:\n\n${PROJECTS.map((p) => `• ${p.name}: ${p.kind.toLowerCase()}`).join("\n")}\n\nAsk about any of them by name.`,
    act: { label: "Open Projects", app: "projects" },
  },
  {
    ask: "Where has Perfect worked?",
    keys: ["work", "job", "experience", "intern", "startup", "career", "employ"],
    answer: () => EXPERIENCE.map((e) => `• ${e.role}, ${e.org} (${e.meta[0]})`).join("\n"),
    act: { label: "Open Experience", app: "experience" },
  },
  {
    ask: "How do I get in touch?",
    keys: ["contact", "email", "reach", "touch", "hire", "talk", "linkedin", "github", "message"],
    answer: ({ email }) => `Email is best: ${email}\n\nGitHub, LinkedIn and SoundCloud are in the Contact app.`,
    act: { label: "Open Contact", app: "contact" },
  },
  {
    ask: "Can I see the résumé?",
    keys: ["resume", "résumé", "cv"],
    answer: () => "Yes. It's one page, and it opens right here on the laptop. There's a download button in the corner.",
    act: { label: "Open Résumé", app: "resume" },
  },
];

function replyTo(text, ctx) {
  const said = text.toLowerCase();
  const index = PROJECTS.findIndex((p) => said.includes(p.name.toLowerCase()));
  if (index !== -1) {
    const p = PROJECTS[index];
    return { text: `${p.name} (${p.kind.toLowerCase()})\n\n${p.summary}\n\nBuilt with ${p.stack.slice(0, 6).join(", ")}.`, act: { label: `Open ${p.name}`, project: index } };
  }
  const topic = TOPICS.find((t) => t.keys.some((k) => said.includes(k)));
  if (topic) return { text: topic.answer(ctx), act: topic.act };
  return { text: "I'm a small scripted stand-in, so I only know what's on this site: the projects, the experience, the résumé and how to get in touch. Try one of the questions below." };
}

function ClaudeApp({ email, onOpen }) {
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState("");
  // The answer being written out: how many of its words are showing so far.
  const [shown, setShown] = useState(0);
  const endRef = useRef(null);
  const last = chat[chat.length - 1];
  const words = last?.from === "claude" ? last.text.split(/(?<=\s)/) : [];
  const writing = shown < words.length;

  useEffect(() => {
    if (!writing) return;
    const t = setTimeout(() => setShown((n) => n + 1), 28);
    return () => clearTimeout(t);
  }, [writing, shown]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [chat, shown]);

  const ask = (text) => {
    const said = text.trim();
    if (!said || writing) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const reply = replyTo(said, { email });
    setChat((c) => [...c, { from: "you", text: said }, { from: "claude", ...reply }]);
    setShown(still ? reply.text.split(/(?<=\s)/).length : 0);
    setDraft("");
  };

  return (
    <div className="cl">
      <div className="cl__talk">
        {!chat.length && (
          <div className="cl__hello">
            <img src="/icons/dock/claude.png" alt="" width="56" height="56" />
            <h2>What would you like to know about Perfect?</h2>
          </div>
        )}
        {chat.map((m, i) => {
          const live = i === chat.length - 1 && m.from === "claude";
          return (
            <div key={i} className={`cl__msg cl__msg--${m.from}`}>
              <p>{live ? words.slice(0, shown).join("") : m.text}</p>
              {m.act && (!live || !writing) && (
                <button type="button" onClick={() => onOpen(m.act)}>
                  {m.act.label}
                </button>
              )}
            </div>
          );
        })}
        <span ref={endRef} />
      </div>
      <div className="cl__foot">
        {!writing && (
          <ul className="cl__ideas">
            {TOPICS.map((t) => (
              <li key={t.ask}>
                <button type="button" onClick={() => ask(t.ask)}>
                  {t.ask}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about a project, the résumé, getting in touch" aria-label="Ask a question" />
          <button type="submit" disabled={!draft.trim() || writing} aria-label="Send">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5.500M6 11.500l6-6 6 6" /></svg>
          </button>
        </form>
        <p className="cl__note">A scripted stand-in made for this site, not the real Claude. Nothing you type is sent anywhere.</p>
      </div>
    </div>
  );
}

/* ---- Safari: a start page. Favourites, and the projects that are live on the web, each opening in a real tab.
   The address bar works too: a web address opens, anything else is searched for. ---- */
function SafariApp({ links, more }) {
  const [address, setAddress] = useState("");
  const live = PROJECTS.filter((p) => p.live);
  const go = (e) => {
    e.preventDefault();
    const typed = address.trim();
    if (!typed) return;
    const url = /^https?:\/\//i.test(typed) ? typed : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(typed) ? `https://${typed}` : `https://duckduckgo.com/?q=${encodeURIComponent(typed)}`;
    window.open(url, "_blank", "noopener");
  };
  return (
    <div className="sf">
      <form className="sf__bar" onSubmit={go}>
        <span className="sf__nav" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m14.500 6-6 6 6 6" /></svg>
          <svg viewBox="0 0 24 24"><path d="m9.500 6 6 6-6 6" /></svg>
        </span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Search or enter website name" aria-label="Search or enter website name" autoCapitalize="off" autoCorrect="off" spellCheck="false" />
      </form>
      <div className="sf__page">
        <h2>Favourites</h2>
        <ul className="sf__favs">
          {links.map((l) => (
            <li key={l.id}>
              <a href={l.href} target="_blank" rel="noreferrer" data-umami-event={`safari-${l.id}`}>
                <img src={l.icon} alt="" width="56" height="56" />
                <b>{l.name}</b>
              </a>
            </li>
          ))}
          {more.map((l) => (
            <li key={l.name}>
              <a href={l.href} target={l.href.startsWith("/") ? undefined : "_blank"} rel="noreferrer" data-umami-event={l.event}>
                <span className="sf__letter" style={{ background: l.color }} aria-hidden="true">
                  {l.name.charAt(0)}
                </span>
                <b>{l.name}</b>
              </a>
            </li>
          ))}
        </ul>
        <h2>Live on the web</h2>
        <ul className="sf__cards">
          {live.map((p) => (
            <li key={p.name}>
              <a href={p.live} target="_blank" rel="noreferrer" data-umami-event={`safari-card-${p.name.toLowerCase().replace(/\s+/g, "")}`}>
                <img src={p.demo.image} alt="" loading="lazy" />
                <b>{p.name}</b>
                <span>{p.demo.domain}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const APPS_CSS = `
/* ================= THE DOCK'S SMALL APPS ================= */

/* typing fields show where the caret is by their own frame, not the page's focus ring */
.stage :is(.tm,.sl__write,.cl,.sf__bar,.vs__edit) :is(input,textarea):focus-visible{outline:none;}

/* ---- Finder ---- */
.fd{position:relative;display:grid;grid-template-columns:clamp(176px,23%,214px) minmax(0,1fr);height:100%;font-size:13px;}
.fd__side{display:flex;flex-direction:column;gap:1px;padding:8px;overflow-y:auto;background:color-mix(in srgb,var(--surface) 70%,var(--bg));border-right:1px solid var(--line);}
.fd__side p{margin:10px 8px 4px;font-size:11px;font-weight:600;color:var(--muted);}
.fd__side button{display:flex;align-items:center;gap:8px;padding:5px 8px;border:none;border-radius:6px;background:none;cursor:pointer;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fd__side button:hover{background:color-mix(in srgb,var(--text) 6%,transparent);}
.fd__side button[aria-current]{background:color-mix(in srgb,var(--text) 11%,transparent);}
.fd__side .fi__art{flex:none;width:18px;filter:none;}
.fd__main{display:flex;flex-direction:column;min-width:0;min-height:0;}
.fd__bar{flex:none;display:flex;align-items:center;gap:4px;padding:8px 12px;border-bottom:1px solid var(--line);}
.fd__bar h2{flex:1;margin:0 8px;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fd__bar button{display:grid;place-items:center;width:28px;height:26px;padding:0;border:none;border-radius:6px;background:none;cursor:pointer;}
.fd__bar button:hover:not(:disabled){background:color-mix(in srgb,var(--text) 8%,transparent);}
.fd__bar button:disabled{opacity:.3;cursor:default;}
.fd__bar button[aria-pressed="true"]{background:color-mix(in srgb,var(--text) 12%,transparent);}
.fd__bar svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
.fd__views{display:flex;gap:2px;}
.fd__files{flex:1;min-height:0;overflow:auto;scrollbar-width:thin;padding:14px;}
.fd__empty{margin:30px 0;text-align:center;color:var(--muted);}
.stage .fd__grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:8px 4px;}
.fd__grid button{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;padding:8px 4px 6px;border:none;border-radius:8px;background:none;cursor:pointer;}
.fd__grid .fi__art{width:56px;}
.fd__grid b{max-width:100%;padding:1px 5px;border-radius:5px;font-weight:500;font-size:12px;line-height:1.35;overflow-wrap:anywhere;text-align:center;}
.fd__grid button[aria-pressed="true"]{background:color-mix(in srgb,var(--text) 8%,transparent);}
.fd__grid button[aria-pressed="true"] b{background:#1f86ea;color:#fff;}
.fd__thumb{display:block;width:56px;height:47px;object-fit:cover;border-radius:5px;box-shadow:0 0 0 1px var(--line),0 4px 8px -5px color-mix(in srgb,var(--shadow) 60%,transparent);}
.fd__thumb--page{width:37px;object-position:top;border-radius:2px;background:#fff;}
.fd__thumb--app{width:47px;border-radius:23%;box-shadow:none;}
.fd__thumb--app[src$=".png"]{border-radius:0;scale:1.18;}
.fd__tile{display:grid;place-items:center;width:47px;height:47px;border-radius:23%;background:var(--bg);box-shadow:0 0 0 .5px color-mix(in srgb,var(--text) 18%,transparent),0 5px 10px -7px color-mix(in srgb,var(--shadow) 60%,transparent);}
.stage .fd__list{list-style:none;margin:0;padding:0;}
.fd__list :is(button,.fd__head){display:grid;grid-template-columns:22px minmax(0,1fr) 130px;align-items:center;gap:8px;width:100%;padding:4px 8px;border:none;border-radius:6px;background:none;text-align:left;}
.fd__list button{cursor:pointer;}
.fd__head{font-size:11px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--line);border-radius:0 !important;margin-bottom:4px;}
.fd__head span:first-child{grid-column:1/3;}
.fd__list li:nth-child(odd) button{background:color-mix(in srgb,var(--text) 3.5%,transparent);}
.fd__list :is(.fi__art,.fd__thumb,.fd__tile){width:20px;height:auto;aspect-ratio:auto;filter:none;box-shadow:none;scale:none;}
.fd__list .fd__thumb{height:18px;}
.fd__list .fd__tile{height:20px;}
.fd__list .fd__tile svg{width:13px;height:13px;}
.fd__list b{font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fd__list span{color:var(--muted);white-space:nowrap;}
.fd__list li button[aria-pressed="true"]{background:#1f86ea;color:#fff;}
.fd__list li button[aria-pressed="true"] span{color:#fff;}
.fd__path{flex:none;margin:0;display:flex;justify-content:space-between;gap:12px;padding:5px 12px;border-top:1px solid var(--line);font-size:11.5px;color:var(--muted);}
.fd__path button{padding:0;border:none;background:none;cursor:pointer;}
.fd__path button:hover{color:var(--text);}
.fd__path button + button::before{content:"›";margin:0 6px;color:var(--muted);}
.fd__path span:last-child{flex:none;}
/* a picture, looked at: it covers the window until it's clicked away */
.fd__look{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;border:none;cursor:zoom-out;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}
.fd__look img{min-height:0;max-width:100%;max-height:calc(100% - 30px);border-radius:8px;box-shadow:0 20px 50px -20px color-mix(in srgb,var(--shadow) 70%,transparent);}
.fd__look b{font-weight:500;font-size:12.5px;}

/* ---- Ghostty: dark in every theme, like the real thing ---- */
.tm{height:100%;overflow-y:auto;scrollbar-width:thin;padding:10px 14px 16px;background:#16171d;color:#e3e5ea;font-family:var(--mono);font-size:12.5px;line-height:1.6;cursor:text;}
.tm p,.tm pre{margin:0;font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;}
.tm pre{color:#c3c7d1;}
.tm__who{color:#7ee0a3;}
.tm__cwd{color:#7fb4ff;}
.tm form{display:flex;gap:.6em;}
.tm label{flex:none;}
.tm input{flex:1;min-width:0;padding:0;border:none;outline:none;background:none;color:inherit;font:inherit;caret-color:#e3e5ea;}

/* ---- VSCodium: its own dark colours in every theme ---- */
.vs{display:grid;grid-template-columns:clamp(130px,18%,190px) minmax(0,1fr);height:100%;background:#1f1f1f;color:#ccc;font-size:13px;}
.vs__side{display:flex;flex-direction:column;padding:8px 0;background:#181818;border-right:1px solid #2b2b2b;}
.vs__side p{margin:2px 14px 8px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9a9a9a;}
.vs__side button{padding:4px 14px;border:none;background:none;cursor:pointer;text-align:left;}
.vs__side button:hover{background:#2a2d2e;}
.vs__side button[aria-current]{background:#37373d;color:#fff;}
.vs__main{display:flex;flex-direction:column;min-width:0;min-height:0;}
.vs__tabs{flex:none;display:flex;background:#181818;border-bottom:1px solid #2b2b2b;}
.vs__tabs button{display:flex;align-items:center;gap:8px;padding:8px 14px;border:none;border-right:1px solid #2b2b2b;border-top:1px solid transparent;background:none;cursor:pointer;color:#9d9d9d;}
.vs__tabs button[aria-selected="true"]{background:#1f1f1f;color:#fff;border-top-color:#0078d4;}
.vs__tabs i{width:7px;height:7px;border-radius:50%;background:#ccc;}
.vs__edit{flex:1;min-height:0;display:flex;font-family:var(--mono);font-size:12.5px;line-height:1.65;}
.vs__nums{flex:none;margin:0;padding:10px 12px 10px 16px;overflow:hidden;text-align:right;color:#6e7681;font:inherit;user-select:none;-webkit-user-select:none;}
.vs__edit textarea{flex:1;min-width:0;margin:0;padding:10px 12px 10px 4px;border:none;outline:none;resize:none;background:none;color:#d4d4d4;font:inherit;white-space:pre;overflow:auto;scrollbar-width:thin;caret-color:#aeafad;tab-size:2;}
.vs__status{flex:none;margin:0;display:flex;align-items:center;justify-content:flex-end;gap:16px;padding:3px 12px;background:#181818;border-top:1px solid #2b2b2b;font-size:11.5px;color:#9d9d9d;}
.vs__status span:first-child{margin-right:auto;}
.vs__status button{padding:1px 8px;border:1px solid #3c3c3c;border-radius:4px;background:none;cursor:pointer;}
.vs__status button:hover{background:#2a2d2e;color:#fff;}

/* ---- Slack: the aubergine sidebar it's known for; the conversation follows the site's theme ---- */
.sl{display:grid;grid-template-columns:clamp(150px,22%,220px) minmax(0,1fr);height:100%;font-size:14px;}
.sl__side{display:flex;flex-direction:column;gap:1px;padding:10px 8px;overflow-y:auto;background:#3f0e40;color:#d9c7da;}
.sl__side p{margin:14px 8px 4px;font-size:12.5px;color:#b9a2ba;}
.sl__side .sl__team{margin:2px 8px 4px;font-size:16px;font-weight:700;color:#fff;}
.sl__side button{display:flex;align-items:center;gap:8px;padding:4px 8px;border:none;border-radius:6px;background:none;cursor:pointer;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sl__side button:hover{background:rgba(255,255,255,.08);}
.sl__side button[aria-current]{background:#1164a3;color:#fff;}
.sl__side i{flex:none;width:14px;text-align:center;font-style:normal;opacity:.8;}
.sl__side .sl__dot{width:9px;height:9px;margin:0 2.5px;border-radius:50%;background:#2bac76;opacity:1;}
.sl__main{display:flex;flex-direction:column;min-width:0;min-height:0;}
.sl__main h2{flex:none;margin:0;padding:11px 18px;border-bottom:1px solid var(--line);font-size:15px;font-weight:700;}
.sl__main h2 i{font-style:normal;color:var(--muted);}
.stage .sl__feed{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin;list-style:none;margin:0;padding:14px 18px;display:flex;flex-direction:column;gap:14px;}
.stage .sl__feed ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px;}
.sl__feed li:not(.sl__pair):not([aria-hidden]){display:grid;grid-template-columns:36px minmax(0,1fr);gap:10px;}
.sl__face{display:grid;place-items:center;width:36px;height:36px;border-radius:8px;background:color-mix(in srgb,var(--text) 12%,transparent);font-size:11px;font-weight:700;}
.sl__face--pp{background:#e8912d;color:#fff;font-size:13px;}
.sl__feed p{margin:0;line-height:1.45;overflow-wrap:anywhere;}
.sl__who span{margin-left:4px;font-size:12px;color:var(--muted);}
.sl__feed a,.sl__link{color:#1264a3;text-decoration:underline;text-underline-offset:3px;}
:root:is([data-theme="black"],[data-theme="mustard"]) :is(.sl__feed a,.sl__link){color:#4aa3e8;}
.stage .sl__link{padding:0;border:none;background:none;cursor:pointer;color:#1264a3;}
.sl__mail{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin-top:6px !important;font-size:16px;font-weight:600;}
.sl__mail button{padding:3px 10px;border:1px solid var(--line);border-radius:6px;background:none;cursor:pointer;font-size:12.5px;font-weight:500;}
.sl__mail button:hover{background:color-mix(in srgb,var(--text) 7%,transparent);}
.sl__write{flex:none;display:flex;gap:6px;margin:0 18px 16px;padding:5px 5px 5px 12px;border:1px solid color-mix(in srgb,var(--text) 30%,transparent);border-radius:10px;}
.sl__write:focus-within{border-color:var(--text);}
.sl__write input{flex:1;min-width:0;border:none;outline:none;background:none;color:inherit;font:inherit;}
.sl__write button{display:grid;place-items:center;width:32px;height:30px;padding:0;border:none;border-radius:7px;background:#007a5a;cursor:pointer;}
.sl__write button:disabled{background:none;cursor:default;opacity:.35;}
.sl__write svg{width:17px;height:17px;fill:#fff;}
.sl__write button:disabled svg{fill:currentColor;}

/* ---- Claude ---- */
.cl{display:flex;flex-direction:column;height:100%;max-width:760px;margin:0 auto;padding:0 clamp(14px,3vw,28px);font-size:15px;}
.cl__talk{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin;display:flex;flex-direction:column;gap:14px;padding:18px 0;}
.cl__hello{margin:auto 0;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;}
.cl__hello h2{margin:0;font-family:var(--font-display);font-size:clamp(22px,2.4vw,32px);font-weight:400;letter-spacing:-.01em;line-height:1.1;max-width:16em;}
.cl__msg p{margin:0;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;}
.cl__msg--you{align-self:flex-end;max-width:80%;padding:8px 14px;border-radius:14px;background:var(--surface);}
.cl__msg--claude{align-self:flex-start;max-width:100%;}
.cl__msg button{margin-top:10px;padding:6px 14px;border:1px solid color-mix(in srgb,var(--text) 28%,transparent);border-radius:999px;background:none;cursor:pointer;font-size:13.5px;transition:background .2s var(--ease),color .2s var(--ease);}
.cl__msg button:hover{background:var(--text);color:var(--bg);}
.cl__foot{flex:none;padding-bottom:12px;}
.stage .cl__ideas{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-wrap:wrap;gap:6px;}
.cl__ideas button{padding:5px 12px;border:1px solid var(--line);border-radius:999px;background:none;cursor:pointer;font-size:13px;color:var(--muted);transition:color .2s var(--ease),border-color .2s var(--ease);}
.cl__ideas button:hover{color:var(--text);border-color:var(--text);}
.cl form{display:flex;gap:8px;padding:6px 6px 6px 16px;border:1px solid color-mix(in srgb,var(--text) 22%,transparent);border-radius:16px;background:var(--bg);box-shadow:0 10px 26px -18px color-mix(in srgb,var(--shadow) 55%,transparent);}
.cl form:focus-within{border-color:color-mix(in srgb,var(--text) 55%,transparent);}
.cl input{flex:1;min-width:0;border:none;outline:none;background:none;color:inherit;font:inherit;}
.cl form button{display:grid;place-items:center;width:34px;height:34px;padding:0;border:none;border-radius:10px;background:#d97757;cursor:pointer;}
.cl form button:disabled{opacity:.4;cursor:default;}
.cl form svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.cl__note{margin:8px 0 0;text-align:center;font-size:11.5px;color:var(--muted);}

/* ---- Safari ---- */
.sf{display:flex;flex-direction:column;height:100%;font-size:13px;}
.sf__bar{flex:none;display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--line);}
.sf__nav{display:flex;gap:2px;opacity:.3;}
.sf__nav svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
.sf__bar input{flex:1;min-width:0;max-width:520px;margin:0 auto;padding:6px 12px;border:none;outline:none;border-radius:9px;background:color-mix(in srgb,var(--text) 7%,transparent);color:inherit;font:inherit;text-align:center;}
.sf__bar input:focus{text-align:left;box-shadow:0 0 0 2px color-mix(in srgb,#1f86ea 60%,transparent);}
.sf__page{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin;padding:clamp(14px,2.4vw,28px) clamp(16px,5%,64px);}
.sf__page h2{margin:0 0 10px;font-size:17px;font-weight:700;}
.sf__page ul + h2{margin-top:26px;}
.stage .sf__favs{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:10px 4px;}
.sf__favs a{display:flex;flex-direction:column;align-items:center;gap:7px;padding:6px 2px;border-radius:10px;color:var(--text);text-decoration:none;}
.sf__favs :is(img,.sf__letter){display:grid;place-items:center;width:56px;height:56px;border-radius:23%;transition:scale .25s var(--ease);}
.sf__favs img[src$=".png"]{border-radius:0;scale:1.16;}
.sf__letter{color:#fff;font-size:26px;font-weight:600;}
.sf__favs b{font-weight:500;font-size:12px;white-space:nowrap;}
.sf__favs a:hover :is(img,.sf__letter){scale:1.06;}
.sf__favs a:hover img[src$=".png"]{scale:1.22;}
.stage .sf__cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px;}
.sf__cards a{display:flex;flex-direction:column;color:var(--text);text-decoration:none;}
.sf__cards img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;border-radius:10px;background:var(--surface);box-shadow:0 0 0 1px var(--line);transition:translate .25s var(--ease),box-shadow .25s var(--ease);}
.sf__cards a:hover img{translate:0 -3px;box-shadow:0 0 0 1px var(--line),0 14px 26px -16px color-mix(in srgb,var(--shadow) 70%,transparent);}
.sf__cards b{margin-top:8px;font-weight:600;}
.sf__cards span{color:var(--muted);font-size:12px;}

/* phones: one column each, the sidebars step out */
@media (max-width:760px){
  .fd,.vs,.sl{grid-template-columns:minmax(0,1fr);}
  .fd__side,.vs__side,.sl__side{display:none;}
  .fd__list :is(button,.fd__head){grid-template-columns:22px minmax(0,1fr) 96px;}
  .tm,.vs__edit{font-size:13px;}
  .tm input,.vs__edit textarea,.sl__write input,.cl input,.sf__bar input{font-size:16px;}
}
`;

// The one thing this file hands out: whichever small app a window asks for, with the styles they all share.
export default function MiniApp({ id, drive, finderAt, email, links, more, onOpen, onExit, readText }) {
  return (
    <>
      <style>{APPS_CSS}</style>
      {id === "finder" && <FinderApp key={finderAt.join("/")} drive={drive} start={finderAt} onOpen={onOpen} />}
      {id === "safari" && <SafariApp links={links} more={more} />}
      {id === "slack" && <SlackApp email={email} />}
      {id === "claude" && <ClaudeApp email={email} onOpen={onOpen} />}
      {id === "vscodium" && <EditorApp />}
      {id === "ghostty" && <TerminalApp drive={drive} onOpen={onOpen} onExit={onExit} readText={readText} />}
    </>
  );
}
