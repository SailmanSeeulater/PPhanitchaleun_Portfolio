// Lately: short posts about what I've been up to. The posts live on the site's own small server (server/ in
// this repo) and anyone can read them. Signing in, from the bottom of the list, adds a way to write, edit,
// publish and delete; that is only for me. Posts are written in Markdown and drawn here as ordinary elements,
// never as raw HTML, so nothing in a post can run as code.
// Fetched the first time it's opened, so it brings its own styles with it.
import { useEffect, useRef, useState } from "react";
import api from "./api";

const dayOf = (iso) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const onPhone = () => window.matchMedia("(max-width:760px)").matches;

/* ---- Markdown, the small part of it a post needs: headings, paragraphs, lists, quotes, code, and bold,
   italics, `code` and links within a line. ---- */
const SAFE_LINK = /^(https?:\/\/|mailto:)/i;
function inline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\((?:[^()\s]|\([^()\s]*\))+\)|https?:\/\/[^\s<>)]*[^\s<>).,;:!?])/g).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("`") && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.length > 4) return <strong key={i}>{inline(part.slice(2, -2))}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{inline(part.slice(1, -1))}</em>;
    const link = part.match(/^\[([^\]]+)\]\((.+)\)$/);
    // A link goes to the web or to an email address; anything else is shown as its words alone.
    if (link)
      return SAFE_LINK.test(link[2]) ? (
        <a key={i} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      ) : (
        link[1]
      );
    if (/^https?:\/\//.test(part))
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer">
          {part.replace(/^https?:\/\//, "")}
        </a>
      );
    return part;
  });
}

function blocksOf(text) {
  const blocks = [];
  let fence = null;
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (fence) {
      if (line.trim().startsWith("```")) fence = null;
      else fence.lines.push(raw);
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (line.trim().startsWith("```")) {
      fence = { kind: "code", lines: [] };
      blocks.push(fence);
      continue;
    }
    // an empty line ends whatever came before it
    if (!line.trim()) {
      blocks.push({ kind: "gap" });
      continue;
    }
    const head = line.match(/^(#{1,3}) (.+)$/);
    const item = line.match(/^\s*(?:[-*]|(\d+)[.)]) (.+)$/);
    const quote = line.match(/^> ?(.*)$/);
    if (head) blocks.push({ kind: "head", level: head[1].length, text: head[2] });
    else if (item) {
      const kind = item[1] ? "ol" : "ul";
      if (last?.kind === kind) last.lines.push(item[2]);
      else blocks.push({ kind, lines: [item[2]] });
    } else if (quote) {
      if (last?.kind === "quote") last.lines.push(quote[1]);
      else blocks.push({ kind: "quote", lines: [quote[1]] });
    } else if (last?.kind === "p") last.lines.push(line.trim());
    else blocks.push({ kind: "p", lines: [line.trim()] });
  }
  return blocks.filter((b) => b.kind !== "gap");
}

function Markdown({ text }) {
  return blocksOf(text).map((b, i) => {
    // The post's own title is the heading above this, so a post's "#" starts one level down.
    if (b.kind === "head") return b.level === 1 ? <h3 key={i}>{inline(b.text)}</h3> : <h4 key={i}>{inline(b.text)}</h4>;
    if (b.kind === "code") return <pre key={i}>{b.lines.join("\n")}</pre>;
    if (b.kind === "quote") return <blockquote key={i}>{inline(b.lines.join(" "))}</blockquote>;
    if (b.kind === "p") return <p key={i}>{inline(b.lines.join(" "))}</p>;
    const List = b.kind;
    return (
      <List key={i}>
        {b.lines.map((t, j) => (
          <li key={j}>{inline(t)}</li>
        ))}
      </List>
    );
  });
}

export default function Lately() {
  // The list of posts: null while it is on its way.
  const [posts, setPosts] = useState(null);
  // No server answered. Visitors see an empty Lately, not an error.
  const [offline, setOffline] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  // The open post: its address, then the whole post once it has arrived.
  const [slug, setSlug] = useState(null);
  const [post, setPost] = useState(null);
  // What the right-hand side is showing: a post ("read"), the editor ("edit" or "new"), or the sign-in form.
  const [mode, setMode] = useState("read");
  const [draft, setDraft] = useState(null);
  const [preview, setPreview] = useState(false);
  const [password, setPassword] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Only the latest post asked for is shown, however the answers arrive.
  const asked = useRef(0);

  const open = async (next) => {
    const turn = ++asked.current;
    setSlug(next);
    setPost(null);
    setMode("read");
    setAsking(false);
    setError("");
    if (!next) return;
    try {
      const got = await api.post(next);
      if (turn === asked.current) setPost(got);
    } catch (err) {
      if (turn === asked.current) {
        setSlug(null);
        setError(err.status === 404 ? "That post is gone." : err.message);
      }
    }
  };

  useEffect(() => {
    let gone = false;
    Promise.all([api.posts(), api.me()])
      .then(([list, me]) => {
        if (gone) return;
        setPosts(list);
        setSignedIn(me);
        // With room for both sides, the newest post is already open. A phone starts on the list.
        if (list.length && !onPhone()) {
          const turn = ++asked.current;
          setSlug(list[0].slug);
          api.post(list[0].slug).then(
            (got) => !gone && turn === asked.current && setPost(got),
            () => !gone && turn === asked.current && setSlug(null),
          );
        }
      })
      .catch(() => {
        if (gone) return;
        setPosts([]);
        setOffline(true);
      });
    return () => {
      gone = true;
    };
  }, []);

  // Runs one change against the server. A refused change says why; being signed out by the server shows.
  const attempt = async (work) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (err) {
      setError(err.message);
      if (err.status === 401 && mode !== "signin") setSignedIn(false);
    } finally {
      setBusy(false);
    }
  };

  const startNew = () => {
    asked.current++;
    setSlug(null);
    setPost(null);
    setDraft({ title: "", body: "", published: false });
    setPreview(false);
    setError("");
    setMode("new");
  };
  const startEdit = () => {
    setDraft({ title: post.title, body: post.body, published: post.published });
    setPreview(false);
    setError("");
    setMode("edit");
  };
  const save = (e) => {
    e.preventDefault();
    attempt(async () => {
      const saved = mode === "new" ? await api.create(draft) : await api.update(slug, draft);
      setPost(saved);
      setSlug(saved.slug);
      setMode("read");
      setPosts(await api.posts());
    });
  };
  const remove = () =>
    attempt(async () => {
      await api.remove(slug);
      const list = await api.posts();
      setPosts(list);
      await open(!onPhone() && list.length ? list[0].slug : null);
    });
  const signIn = (e) => {
    e.preventDefault();
    attempt(async () => {
      await api.signIn(password);
      setPassword("");
      setSignedIn(true);
      setMode("read");
      // signed in, the list has the drafts in it too
      setPosts(await api.posts());
    });
  };
  const signOut = () =>
    attempt(async () => {
      await api.signOut();
      setSignedIn(false);
      setPosts(await api.posts());
      // a draft that was open isn't a visitor's to see
      if (mode !== "read" || (post && !post.published)) await open(null);
    });

  const showing = mode !== "read" || slug ? "post" : "list";
  const back = () => (mode === "edit" ? setMode("read") : open(null));

  return (
    <div className="lt" data-pane={showing}>
      <style>{LATELY_CSS}</style>
      <aside className="lt__side">
        <header>
          <h2>Lately</h2>
          {signedIn && (
            <button type="button" className="lt__btn" onClick={startNew}>
              New post
            </button>
          )}
        </header>
        {posts === null ? (
          <p className="lt__note">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="lt__note">{signedIn ? "No posts yet. Write the first one." : "Nothing posted yet. Check back soon."}</p>
        ) : (
          <ul className="lt__list">
            {posts.map((p) => (
              <li key={p.slug}>
                <button type="button" aria-current={p.slug === slug ? "true" : undefined} onClick={() => open(p.slug)}>
                  <b>{p.title}</b>
                  <small>
                    {dayOf(p.publishedAt ?? p.updatedAt)}
                    {!p.published && <i>Draft</i>}
                  </small>
                  {p.excerpt && <span>{p.excerpt}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!offline && posts !== null && (
          <footer>
            {signedIn ? (
              <button type="button" className="lt__quiet" onClick={signOut} disabled={busy}>
                Sign out
              </button>
            ) : (
              <button
                type="button"
                className="lt__quiet"
                onClick={() => {
                  setError("");
                  setMode("signin");
                }}
              >
                Sign in
              </button>
            )}
          </footer>
        )}
      </aside>

      <section className="lt__main" aria-live="polite">
        <button type="button" className="lt__back" onClick={back}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m14.500 6-6 6 6 6" />
          </svg>
          {mode === "edit" ? "Back" : "Lately"}
        </button>

        {mode === "signin" ? (
          <form className="lt__form lt__form--narrow" onSubmit={signIn}>
            <h2>Sign in</h2>
            <p className="lt__hint">Writing here is for Perfect. Reading needs no password.</p>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" autoComplete="current-password" maxLength={72} autoFocus />
            {error && (
              <p className="lt__error" role="alert">
                {error}
              </p>
            )}
            <p className="lt__row">
              <button type="button" className="lt__quiet" onClick={() => open(slug)}>
                Cancel
              </button>
              <button type="submit" className="lt__btn lt__btn--main" disabled={busy || !password}>
                Sign in
              </button>
            </p>
          </form>
        ) : mode === "edit" || mode === "new" ? (
          <form className="lt__form" onSubmit={save}>
            <input className="lt__title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" aria-label="Title" maxLength={140} autoFocus={mode === "new"} />
            {preview ? (
              <div className="lt__prose lt__preview">{draft.body.trim() ? <Markdown text={draft.body} /> : <p className="lt__hint">Nothing to preview yet.</p>}</div>
            ) : (
              <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder={"Write in Markdown.\n\n# Heading\n**bold**, *italic*, `code`\n- a list\n[a link](https://…)"} aria-label="Post" spellCheck="true" />
            )}
            {error && (
              <p className="lt__error" role="alert">
                {error}
              </p>
            )}
            <p className="lt__row">
              <label className="lt__check">
                <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
                Published
              </label>
              <button type="button" className="lt__quiet" onClick={() => setPreview(!preview)}>
                {preview ? "Keep writing" : "Preview"}
              </button>
              <button type="button" className="lt__quiet" onClick={() => (mode === "new" ? open(null) : setMode("read"))}>
                Cancel
              </button>
              <button type="submit" className="lt__btn lt__btn--main" disabled={busy || !draft.title.trim()}>
                {draft.published ? (mode === "edit" && post.published ? "Save" : "Publish") : "Save draft"}
              </button>
            </p>
          </form>
        ) : post ? (
          <article className="lt__post">
            <header>
              <small>
                {dayOf(post.publishedAt ?? post.updatedAt)}
                {!post.published && <i>Draft</i>}
              </small>
              <h2>{post.title}</h2>
            </header>
            <div className="lt__prose">
              <Markdown text={post.body} />
            </div>
            {signedIn && (
              <footer className="lt__row">
                {error && (
                  <span className="lt__error" role="alert">
                    {error}
                  </span>
                )}
                {asking ? (
                  <>
                    <span>Delete this post for good?</span>
                    <button type="button" className="lt__quiet" onClick={() => setAsking(false)}>
                      Keep it
                    </button>
                    <button type="button" className="lt__btn lt__btn--danger" onClick={remove} disabled={busy}>
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="lt__quiet" onClick={() => setAsking(true)}>
                      Delete
                    </button>
                    <button type="button" className="lt__btn" onClick={startEdit}>
                      Edit
                    </button>
                  </>
                )}
              </footer>
            )}
          </article>
        ) : (
          <p className="lt__note lt__note--mid">{error || (slug ? "Loading…" : posts?.length ? "Pick a post to read it." : "")}</p>
        )}
      </section>
    </div>
  );
}

const LATELY_CSS = `
/* Lately follows the site's theme: its colours and type are the page's own. A list of posts down the left,
   the open one on the right. */
.lt{display:grid;grid-template-columns:minmax(200px,30%) minmax(0,1fr);height:100%;color:var(--text);font-size:14.5px;line-height:1.5;}
.stage .lt :is(button,input,textarea){font:inherit;color:inherit;}
.stage .lt ul:not(.lt__prose ul){list-style:none;margin:0;padding:0;}
.lt :is(h2,h3,h4,p){margin:0;}
.lt__side{display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--line);background:color-mix(in srgb,var(--text) 3%,transparent);}
.lt__side header{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 16px 12px;}
.lt__side h2{font-family:var(--font-display);font-weight:400;font-size:24px;line-height:1;letter-spacing:-.01em;}
.lt__list{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin;padding:0 8px 8px !important;display:grid;align-content:start;gap:2px;}
.lt__list button{display:grid;gap:3px;width:100%;padding:10px 10px;border:none;border-radius:10px;background:none;text-align:left;cursor:pointer;}
.lt__list button:hover{background:color-mix(in srgb,var(--text) 6%,transparent);}
.lt__list button[aria-current]{background:color-mix(in srgb,var(--text) 10%,transparent);}
.lt__list b{font-weight:600;font-size:14.5px;line-height:1.3;overflow-wrap:anywhere;}
.lt :is(small){display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums;}
.lt small i{font-style:normal;font-weight:600;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;padding:1px 6px;border:1px solid var(--line);border-radius:999px;}
.lt__list span{font-size:12.5px;line-height:1.4;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.lt__side footer{flex:none;padding:8px 16px 12px;border-top:1px solid var(--line);}
.lt__note{padding:6px 16px;font-size:13px;color:var(--muted);}
.lt__note--mid{margin:auto !important;padding:24px;text-align:center;}
.lt__main{display:flex;flex-direction:column;min-width:0;min-height:0;overflow-y:auto;scrollbar-width:thin;}
.lt__back{display:none;}
.lt__btn{padding:6px 13px;border:1px solid var(--line);border-radius:9px;background:var(--surface);cursor:pointer;font-weight:600 !important;font-size:13px !important;white-space:nowrap;}
.lt__btn:hover:not(:disabled){border-color:var(--text);}
.lt__btn--main{background:var(--text);border-color:var(--text);color:var(--bg) !important;}
.lt__btn--danger{background:#c8372d;border-color:#c8372d;color:#fff !important;}
.lt__btn:disabled{opacity:.45;cursor:default;}
.lt__quiet{padding:0;border:none;background:none;cursor:pointer;font-size:13px !important;color:var(--muted) !important;white-space:nowrap;}
.lt__quiet:hover:not(:disabled){color:var(--text) !important;text-decoration:underline;text-underline-offset:3px;}
.lt__row{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:10px 16px;}
.lt__error{font-size:13px;color:#c8372d;}
[data-theme="black"] .lt__error,[data-theme="mustard"] .lt__error{color:#ff8a7f;}
.lt__hint{font-size:13px;color:var(--muted);}
/* the open post */
.lt__post{display:flex;flex-direction:column;flex:1;width:100%;max-width:680px;margin:0 auto;padding:clamp(20px,3.2vw,44px) clamp(20px,3.4vw,48px) 20px;}
.lt__post header{display:grid;gap:8px;margin-bottom:18px;}
.lt__post h2{font-family:var(--font-display);font-weight:400;font-size:clamp(26px,3vw,40px);line-height:1.08;letter-spacing:-.015em;overflow-wrap:anywhere;}
.lt__post footer{margin-top:auto;padding-top:22px;font-size:13px;color:var(--muted);}
.lt__prose{font-size:15.5px;line-height:1.65;overflow-wrap:anywhere;}
.lt .lt__prose > *{margin-top:0;margin-bottom:0;}
.lt .lt__prose > * + *{margin-top:.85em;}
.lt .lt__prose h3:not(:first-child){margin-top:1.5em;}
.lt__prose h3{font-family:var(--font-display);font-weight:400;font-size:1.45em;line-height:1.15;}
.lt .lt__prose h4:not(:first-child){margin-top:1.4em;}
.lt__prose h4{font-weight:600;font-size:1.05em;}
.stage .lt__prose :is(ul,ol){padding-left:1.3em;list-style:disc;}
.stage .lt__prose ol{list-style:decimal;}
.lt__prose li + li{margin-top:.3em;}
.lt__prose a{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;}
.lt__prose blockquote{margin-left:0;margin-right:0;padding-left:14px;border-left:2px solid var(--line);color:var(--muted);}
.lt__prose :is(code,pre){font-family:'Martian Mono',ui-monospace,Menlo,monospace;font-size:.82em;}
.lt__prose code{padding:1px 5px;border-radius:5px;background:color-mix(in srgb,var(--text) 8%,transparent);}
.lt__prose pre{padding:12px 14px;border-radius:10px;background:color-mix(in srgb,var(--text) 6%,transparent);overflow-x:auto;line-height:1.55;white-space:pre;}
/* signing in and writing */
.lt__form{display:flex;flex-direction:column;gap:12px;flex:1;min-height:0;width:100%;max-width:720px;margin:0 auto;padding:clamp(18px,2.6vw,32px) clamp(20px,3.4vw,48px) 18px;}
.lt__form--narrow{flex:none;max-width:340px;margin:auto;}
.lt__form h2{font-family:var(--font-display);font-weight:400;font-size:26px;line-height:1.1;}
.lt__form :is(input:not([type="checkbox"]),textarea){width:100%;padding:9px 12px;border:1px solid var(--line);border-radius:10px;outline:none;background:var(--surface);}
.lt__form :is(input,textarea):focus-visible{border-color:var(--text);}
.lt__form :is(input,textarea)::placeholder{color:var(--muted);opacity:.7;}
.lt__form input.lt__title{font-family:var(--font-display);font-size:24px;line-height:1.15;padding:8px 12px;}
.lt__form textarea,.lt__preview{flex:1;min-height:140px;}
.lt__form textarea{resize:none;font-family:'Martian Mono',ui-monospace,Menlo,monospace;font-size:12.5px;line-height:1.7;}
.lt__preview{padding:10px 14px;border:1px dashed var(--line);border-radius:10px;overflow-y:auto;}
.lt__check{display:flex;align-items:center;gap:7px;margin-right:auto;font-size:13px;cursor:pointer;}
.lt__check input{width:15px;height:15px;margin:0;accent-color:var(--text);}
.stage .lt :is(button):focus-visible{outline:2px solid var(--text);outline-offset:2px;}
/* a phone shows one side at a time: the list, then the post over it with a way back */
@media (max-width:760px){
  .lt{grid-template-columns:minmax(0,1fr);font-size:15.5px;}
  .lt[data-pane="post"] .lt__side,.lt[data-pane="list"] .lt__main{display:none;}
  .lt__side{border-right:none;background:none;}
  .lt__side header{padding:18px var(--pad) 12px;}
  .lt__list{padding:0 calc(var(--pad) - 10px) 12px !important;}
  .lt__side footer,.lt__note{padding-left:var(--pad);padding-right:var(--pad);}
  .lt__back{display:inline-flex;align-items:center;gap:2px;align-self:flex-start;margin:10px 0 0 calc(var(--pad) - 8px);padding:6px 8px;border:none;background:none;cursor:pointer;font-size:15px !important;color:var(--muted) !important;}
  .lt__back svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.800;stroke-linecap:round;stroke-linejoin:round;}
  .lt__post,.lt__form{padding:10px var(--pad) 24px;}
  .lt__form :is(input,textarea){font-size:16px;}
  .lt__form input.lt__title{font-size:22px;}
}
`;
