// Discord, from the laptop's dock: my profile as Discord shows it, in a direct message window. The profile is
// saved in discord.json (npm run discord refreshes it). Whether I'm online, and what I'm playing or listening to,
// comes live from Lanyard, which only knows people who have joined its Discord server; until it knows me, the
// window shows the saved profile and leaves the status out. Nothing typed here leaves the page.
import { useEffect, useRef, useState } from "react";
import PROFILE from "./discord.json";
import { store, stored } from "./storage";

const PROFILE_URL = `https://discord.com/users/${PROFILE.id}`;
// A Discord ID is a snowflake: its top bits count milliseconds from the start of 2015, so it says when the
// account was made.
const CREATED = new Date(Number((BigInt(PROFILE.id) >> 22n) + 1420070400000n));
const SINCE = CREATED.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const STATUS = { online: "Online", idle: "Idle", dnd: "Do Not Disturb", offline: "Offline" };
const KIND = { 0: "Playing", 1: "Streaming", 2: "Listening", 3: "Watching", 5: "Competing" };
const VERB = { 0: "Playing", 1: "Streaming", 2: "Listening to", 3: "Watching", 5: "Competing in" };

// The badges Discord puts beside a name, read from the profile's public flags.
const BADGES = [
  { flag: 1 << 6, name: "HypeSquad Bravery", color: "#9c84ef", mark: "M5.6 7.4 9 10.8l3.4-3.4" },
  { flag: 1 << 7, name: "HypeSquad Brilliance", color: "#f47b67", mark: "M9 5.4 12.3 11.3H5.7z" },
  { flag: 1 << 8, name: "HypeSquad Balance", color: "#45ddc0", mark: "M9 6 12 9 9 12 6 9z" },
  { flag: 1 << 9, name: "Early Supporter", color: "#7289da", mark: "M9 5.8v6.4M5.8 9h6.4" },
  { flag: 1 << 22, name: "Active Developer", color: "#23a55a", mark: "M7.2 6.6 4.8 9l2.4 2.4M10.8 6.6 13.2 9l-2.4 2.4" },
];

const ICON = {
  friends: "M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.5-3.6 3-5.5 6-5.5s5.5 1.9 6 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.6c2 .7 3.3 2.6 3.6 5.4",
  id: "M9.5 4 7.5 20M16.5 4l-2 16M4.5 9h15.5M4 15h15.5",
  open: "M10 5H5.5v13.5H19V14M13.5 4.5H19.5V10.5M19 5l-8 8",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6",
  send: "M4 4.5 20.5 12 4 19.5l2.5-7.5zM6.5 12h6",
  message: "M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-8.5l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z",
  copy: "M8.5 8.5h10v11h-10zM15.5 8.5V4.5h-10v11h3",
  eye: "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  game: "M7 8.5h10a4 4 0 0 1 4 4.4l-.4 3.6a2.3 2.3 0 0 1-4 1.2L15 16H9l-1.6 1.7a2.3 2.3 0 0 1-4-1.2L3 12.9a4 4 0 0 1 4-4.4zM8 11.2v3M6.5 12.7h3M15.5 12h.01M17.5 13.6h.01",
};
const Icon = ({ d, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
// The game pad with a face, as on the dock icon.
const Mark = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M6.2 5.6C7.3 5 8.4 4.7 9.6 4.5l.5 1.1c1.3-.2 2.5-.2 3.8 0l.5-1.1c1.2.2 2.3.5 3.4 1.1 2 2.9 3.8 6.8 3.5 11.3-1.6 1.2-3.3 2-5 2.5l-1.1-1.6c.6-.2 1.2-.5 1.7-.8l-.4-.3c-3.2 1.5-6.7 1.5-9.9 0l-.4.3c.5.3 1.1.6 1.7.8L7.7 19.4c-1.7-.5-3.4-1.3-5-2.5-.3-4.5 1.5-8.4 3.5-11.3zM8.9 10.8c-.9 0-1.6.8-1.6 1.8s.7 1.8 1.6 1.8 1.6-.8 1.6-1.8-.7-1.8-1.6-1.8zm6.2 0c-.9 0-1.6.8-1.6 1.8s.7 1.8 1.6 1.8 1.6-.8 1.6-1.8-.7-1.8-1.6-1.8z"
    />
  </svg>
);

// Asks Lanyard about me over its socket, and keeps it open while the window is, so the status changes as mine
// does. (Its socket, not its web address: for someone it doesn't know, the address answers 404, which every
// visitor's console would show in red; the socket just answers with nothing.) Gives back null while asking,
// false when Lanyard doesn't know me or can't be reached, or the presence.
function useLanyard(id) {
  const [presence, setPresence] = useState(null);
  useEffect(() => {
    let socket = null;
    let beat = 0;
    let retry = 0;
    let wait = 2000;
    let over = false;
    const connect = () => {
      socket = new WebSocket("wss://api.lanyard.rest/socket");
      socket.onmessage = (e) => {
        let msg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        if (msg.op === 1) {
          socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: id } }));
          clearInterval(beat);
          beat = setInterval(() => socket.readyState === 1 && socket.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
        } else if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
          if (msg.d?.discord_status) {
            wait = 2000;
            setPresence(msg.d);
          } else if (msg.t === "INIT_STATE") {
            // Lanyard doesn't know me, so there's nothing to wait for.
            over = true;
            setPresence(false);
            socket.close();
          }
        }
      };
      // Dropped, or never reached: what was showing stays, and it tries again, waiting longer each time.
      socket.onclose = () => {
        clearInterval(beat);
        if (over) return;
        setPresence((p) => p ?? false);
        retry = setTimeout(connect, wait);
        wait = Math.min(wait * 2, 60000);
      };
    };
    connect();
    return () => {
      over = true;
      clearInterval(beat);
      clearTimeout(retry);
      socket?.close();
    };
  }, [id]);
  return presence;
}

// The clock, ticking each second only while something on screen counts time.
function useNow(on) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [on]);
  return now;
}

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const two = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${two(m)}:${two(s % 60)}` : `${m}:${two(s % 60)}`;
};

// An activity's picture, from wherever its key says it lives.
const asset = (app, key) => {
  if (!key) return null;
  if (key.startsWith("mp:external/")) return `https://media.discordapp.net/external/${key.slice(12)}`;
  if (key.startsWith("mp:")) return `https://media.discordapp.net/${key.slice(3)}`;
  if (key.startsWith("spotify:")) return `https://i.scdn.co/image/${key.slice(8)}`;
  return app ? `https://cdn.discordapp.com/app-assets/${app}/${key}.png` : null;
};

// Puts text on the clipboard. Where the browser won't allow the clipboard itself (some do only on a secure page,
// or with permission), the old way still works: a hidden box holding the text, selected and copied.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
    document.body.append(box);
    box.select();
    let done = false;
    try {
      done = document.execCommand("copy");
    } catch {
      /* not even that: the text is on screen */
    }
    box.remove();
    return done;
  }
}

// Who I am right now: the live presence when there is one, the saved profile under it.
function whoIs(p) {
  const user = p?.discord_user;
  const avatar = user?.avatar && user.avatar !== PROFILE.avatarHash ? `https://cdn.discordapp.com/avatars/${PROFILE.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "webp"}?size=256` : PROFILE.avatar;
  const spotify = p?.listening_to_spotify ? p.spotify : null;
  const custom = p?.activities?.find((a) => a.type === 4 && (a.state || a.emoji)) ?? null;
  const activities = (p?.activities ?? []).filter((a) => a.type !== 4 && !(spotify && a.type === 2 && a.name === "Spotify"));
  const status = p ? p.discord_status : null;
  const line = custom?.state || (spotify ? "Listening to Spotify" : activities[0] ? `${VERB[activities[0].type] ?? "Playing"} ${activities[0].name}` : status ? STATUS[status] : null);
  return {
    name: user?.global_name || user?.display_name || PROFILE.globalName,
    username: user?.username ?? PROFILE.username,
    avatar,
    badges: BADGES.filter((b) => (user?.public_flags ?? PROFILE.publicFlags) & b.flag),
    status,
    mobile: Boolean(p?.active_on_discord_mobile && !p.active_on_discord_desktop && !p.active_on_discord_web),
    custom,
    spotify,
    activities,
    line,
  };
}

// A face. One given no size takes it from the CSS around it (--s), so the big ones can shrink in a short window.
function Avatar({ src, size, status }) {
  return (
    <span className="dc-av" style={size ? { "--s": `${size}px` } : undefined}>
      <img src={src} alt="" width={size ?? 80} height={size ?? 80} />
      {status && <i className="dc-st" data-status={status} />}
    </span>
  );
}

function Emoji({ e }) {
  if (!e) return null;
  if (e.id) return <img className="dc-emoji" src={`https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? "gif" : "webp"}?size=44`} alt={`:${e.name}:`} />;
  return (
    <span className="dc-emoji" aria-hidden="true">
      {e.name}
    </span>
  );
}

function Badge({ b }) {
  return (
    <span className="dc-badge" title={b.name} role="img" aria-label={b.name}>
      <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
        <path d="M9 1.2c.5 0 1 .2 1.3.5l6 6c.7.7.7 1.9 0 2.6l-6 6c-.7.7-1.9.7-2.6 0l-6-6c-.7-.7-.7-1.9 0-2.6l6-6c.3-.3.8-.5 1.3-.5z" fill={b.color} />
        <path d={b.mark} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function SpotifyCard({ s, now }) {
  const total = s.timestamps.end - s.timestamps.start;
  const done = Math.min(total, Math.max(0, now - s.timestamps.start));
  return (
    <section className="dc-act">
      <h4>Listening to Spotify</h4>
      <div className="dc-act__row">
        <a className="dc-act__art" href={`https://open.spotify.com/track/${s.track_id}`} target="_blank" rel="noreferrer" aria-label={`${s.song} on Spotify`}>
          <img src={s.album_art_url} alt="" />
        </a>
        <p>
          <b>{s.song}</b>
          <span>by {s.artist.replaceAll("; ", ", ")}</span>
          <span>on {s.album}</span>
        </p>
      </div>
      <div className="dc-bar" role="progressbar" aria-label="Song played" aria-valuemin={0} aria-valuemax={Math.round(total / 1000)} aria-valuenow={Math.round(done / 1000)}>
        <i style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <p className="dc-bar__times">
        <span>{clock(done)}</span>
        <span>{clock(total)}</span>
      </p>
    </section>
  );
}

function ActivityCard({ a, now }) {
  const large = asset(a.application_id, a.assets?.large_image);
  const small = asset(a.application_id, a.assets?.small_image);
  const { start, end } = a.timestamps ?? {};
  return (
    <section className="dc-act">
      <h4>{KIND[a.type] ?? "Playing"}</h4>
      <div className="dc-act__row">
        <span className="dc-act__art">
          {large ? <img src={large} alt={a.assets?.large_text ?? ""} /> : <Icon d={ICON.game} size={34} />}
          {small && <img className="dc-act__small" src={small} alt={a.assets?.small_text ?? ""} />}
        </span>
        <p>
          <b>{a.name}</b>
          {a.details && <span>{a.details}</span>}
          {a.state && <span>{a.state}</span>}
          {start && !end && <span className="dc-act__time">{clock(now - start)} elapsed</span>}
          {end && <span className="dc-act__time">{clock(end - now)} left</span>}
        </p>
      </div>
    </section>
  );
}

function Message({ who, avatar, time, tag, only, children }) {
  return (
    <div className={only ? "dc-msg dc-msg--only" : "dc-msg"}>
      {avatar ? (
        <img className="dc-msg__face" src={avatar} alt="" width="40" height="40" />
      ) : (
        <span className="dc-msg__face dc-msg__face--you" aria-hidden="true">
          <Mark size={22} />
        </span>
      )}
      <div>
        <p className="dc-msg__who">
          <b>{who}</b>
          {tag && <span className="dc-tag">{tag}</span>}
          <time>Today at {time}</time>
        </p>
        {children}
      </div>
    </div>
  );
}

export default function DiscordApp() {
  const presence = useLanyard(PROFILE.id);
  const me = whoIs(presence);
  const known = Boolean(me.status);
  const now = useNow(Boolean(me.spotify || me.activities.some((a) => a.timestamps?.start || a.timestamps?.end)));
  const [view, setView] = useState("dm");
  const [tab, setTab] = useState("all");
  const [profileOpen, setProfileOpen] = useState(true);
  const [sent, setSent] = useState([]);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState("");
  const [note, setNote] = useState(() => stored("stage-discord-note") ?? "");
  const wrapRef = useRef(null);
  const feedRef = useRef(null);
  const writeRef = useRef(null);
  const copyTimer = useRef(0);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed && sent.length) feed.scrollTop = feed.scrollHeight;
  }, [sent]);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copy = async (text, what) => {
    const done = await copyText(text);
    setCopied(done ? `Copied ${what}` : `Couldn't copy the ${what}, it's on screen to copy by hand`);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(""), done ? 1600 : 3200);
  };
  // Back to the message box. On a narrow window the profile covers the chat, so it steps aside first.
  const message = () => {
    if (wrapRef.current?.offsetWidth <= 600) setProfileOpen(false);
    setView("dm");
    requestAnimationFrame(() => writeRef.current?.focus());
  };
  const send = (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSent((s) => [...s, { body, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }]);
    setDraft("");
  };
  const tabs = known ? ["online", "all", "add"] : ["all", "add"];
  const online = known && me.status !== "offline";

  const friend = (
    <div className="dc-friend">
      <Avatar src={me.avatar} size={32} status={me.status} />
      <p>
        <b>{me.name}</b>
        {me.line && <span className="dc-friend__user">{me.username}</span>}
        <small>{me.line ?? me.username}</small>
      </p>
      <span className="dc-friend__acts">
        <button type="button" className="dc-round" onClick={message} aria-label={`Message ${me.name}`} title="Message">
          <Icon d={ICON.message} />
        </button>
        <a className="dc-round" href={PROFILE_URL} target="_blank" rel="noreferrer" aria-label={`Open ${me.name} in Discord`} title="Open in Discord" data-umami-event="discord-open-friends">
          <Icon d={ICON.open} />
        </a>
      </span>
    </div>
  );

  return (
    <div className="dc-wrap" ref={wrapRef}>
      <style>{DISCORD_CSS}</style>
      <div className="dc" data-view={view} data-profile={profileOpen ? "" : undefined}>
        <aside className="dc-side" aria-label="Direct messages">
          <div className="dc-side__top">
            <button
              type="button"
              className="dc-find"
              onClick={() => {
                setView("friends");
                setTab("add");
              }}
            >
              Find or start a conversation
            </button>
          </div>
          <nav className="dc-side__nav">
            <button type="button" className="dc-nav" aria-current={view === "friends" ? "page" : undefined} onClick={() => setView("friends")}>
              <Icon d={ICON.friends} />
              Friends
            </button>
          </nav>
          <p className="dc-side__label">Direct Messages</p>
          <button type="button" className="dc-dm" aria-current={view === "dm" ? "page" : undefined} onClick={() => setView("dm")}>
            <Avatar src={me.avatar} size={32} status={me.status} />
            <span>
              <b>{me.name}</b>
              {me.line && <small>{me.line}</small>}
            </span>
          </button>
        </aside>

        {view === "friends" ? (
          <div className="dc-friends">
            <header className="dc-head">
              <Icon d={ICON.friends} />
              <h3>Friends</h3>
              <nav className="dc-tabs" aria-label="Friends">
                {tabs.map((t) => (
                  <button key={t} type="button" aria-current={tab === t ? "page" : undefined} className={t === "add" ? "dc-tab dc-tab--add" : "dc-tab"} onClick={() => setTab(t)}>
                    {t === "online" ? "Online" : t === "all" ? "All" : "Add Friend"}
                  </button>
                ))}
              </nav>
            </header>
            {tab === "add" ? (
              <section className="dc-add">
                <h3>Add Friend</h3>
                <p>You can add me with my Discord username.</p>
                <div className="dc-add__field">
                  <input readOnly value={me.username} aria-label="My Discord username" onFocus={(e) => e.target.select()} />
                  <button type="button" className="dc-btn" onClick={() => copy(me.username, "username")}>
                    Copy
                  </button>
                  <a className="dc-btn dc-btn--blurple" href={PROFILE_URL} target="_blank" rel="noreferrer" data-umami-event="discord-add-friend">
                    Open in Discord
                  </a>
                </div>
                <p className="dc-add__hint">In Discord, paste it under Friends, Add Friend. Or open my profile and send the request from there.</p>
              </section>
            ) : (
              <div className="dc-friends__list">
                <p className="dc-friends__count">{tab === "online" ? `Online — ${online ? 1 : 0}` : "All friends — 1"}</p>
                {tab === "all" || online ? friend : <p className="dc-empty">Nobody here is online right now.</p>}
              </div>
            )}
            <div className="dc-quiet" aria-hidden="true">
              <Mark size={64} />
            </div>
          </div>
        ) : (
          <div className="dc-chat">
            <header className="dc-head">
              <Avatar src={me.avatar} size={24} status={me.status} />
              <h3>{me.name}</h3>
              {me.custom?.state && (
                <span className="dc-head__custom">
                  <Emoji e={me.custom.emoji} />
                  <span>{me.custom.state}</span>
                </span>
              )}
              <div className="dc-head__tools">
                <button type="button" className="dc-tool" onClick={() => copy(PROFILE.id, "user ID")} aria-label="Copy user ID" title="Copy User ID">
                  <Icon d={ICON.id} />
                </button>
                <a className="dc-tool" href={PROFILE_URL} target="_blank" rel="noreferrer" aria-label="Open in Discord" title="Open in Discord" data-umami-event="discord-open-header">
                  <Icon d={ICON.open} />
                </a>
                <button type="button" className="dc-tool" aria-pressed={profileOpen} onClick={() => setProfileOpen((v) => !v)} aria-label="User profile" title={profileOpen ? "Hide User Profile" : "Show User Profile"}>
                  <Icon d={ICON.profile} />
                </button>
              </div>
            </header>
            <ol className="dc-feed" ref={feedRef} aria-label={`Messages with ${me.name}`}>
              <li className="dc-intro">
                <Avatar src={me.avatar} />
                <h2>{me.name}</h2>
                <p className="dc-intro__user">{me.username}</p>
                <p>
                  This is the beginning of your direct message history with <b>{me.name}</b>.
                </p>
                <div className="dc-intro__acts">
                  <a className="dc-btn dc-btn--blurple" href={PROFILE_URL} target="_blank" rel="noreferrer" data-umami-event="discord-add-friend">
                    Add Friend
                  </a>
                  <button type="button" className="dc-btn" onClick={() => copy(me.username, "username")}>
                    Copy Username
                  </button>
                </div>
              </li>
              {sent.length > 0 && (
                <li className="dc-day" aria-hidden="true">
                  <span>Today</span>
                </li>
              )}
              {sent.map((m, i) => (
                <li key={i}>
                  <Message who="You" time={m.time}>
                    <p>{m.body}</p>
                  </Message>
                  <Message who={me.name} avatar={me.avatar} time={m.time} tag="Auto" only>
                    <p>
                      Messages typed here don't reach me, this window only lives on my site.{" "}
                      <button type="button" className="dc-link" onClick={() => copy(m.body, "message")}>
                        Copy yours
                      </button>{" "}
                      and send it to <b>@{me.username}</b> on Discord.
                    </p>
                    <a className="dc-btn dc-btn--blurple dc-btn--small" href={PROFILE_URL} target="_blank" rel="noreferrer" data-umami-event="discord-open-reply">
                      Open Discord
                    </a>
                    <p className="dc-only">
                      <Icon d={ICON.eye} size={16} />
                      Only you can see this
                    </p>
                  </Message>
                </li>
              ))}
            </ol>
            <form className="dc-write" onSubmit={send}>
              <input ref={writeRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message @${me.name}`} aria-label={`Message @${me.name}`} maxLength={2000} />
              <button type="submit" className="dc-tool" disabled={!draft.trim()} aria-label="Send">
                <Icon d={ICON.send} />
              </button>
            </form>
          </div>
        )}

        {view === "dm" && profileOpen && (
          <aside className="dc-profile" aria-label={`${me.name}'s profile`}>
            <div className="dc-banner" style={{ background: PROFILE.bannerColor }} />
            <div className="dc-profile__face">
              <Avatar src={me.avatar} status={me.status} />
              {me.custom && (
                <p className="dc-bubble">
                  <Emoji e={me.custom.emoji} />
                  {me.custom.state}
                </p>
              )}
            </div>
            <div className="dc-profile__body">
              <div>
                <h2>{me.name}</h2>
                <p className="dc-profile__user">
                  <span>{me.username}</span>
                  {me.badges.length > 0 && (
                    <span className="dc-badges">
                      {me.badges.map((b) => (
                        <Badge key={b.flag} b={b} />
                      ))}
                    </span>
                  )}
                </p>
                {known && (
                  <p className="dc-profile__status">
                    {STATUS[me.status]}
                    {me.mobile && " on mobile"}
                  </p>
                )}
              </div>
              {me.spotify && <SpotifyCard s={me.spotify} now={now} />}
              {me.activities.map((a) => (
                <ActivityCard key={`${a.name}-${a.created_at ?? a.id}`} a={a} now={now} />
              ))}
              <section className="dc-card">
                <h4>Member Since</h4>
                <p className="dc-since">
                  <Mark />
                  <time dateTime={CREATED.toISOString().slice(0, 10)}>{SINCE}</time>
                </p>
                <h4>User ID</h4>
                <p className="dc-userid">
                  <span>{PROFILE.id}</span>
                  <button type="button" className="dc-tool dc-tool--small" onClick={() => copy(PROFILE.id, "user ID")} aria-label="Copy user ID" title="Copy">
                    <Icon d={ICON.copy} size={16} />
                  </button>
                </p>
                <h4>
                  <label htmlFor="dc-note">Note</label>
                </h4>
                <textarea
                  id="dc-note"
                  className="dc-note"
                  value={note}
                  maxLength={256}
                  rows={1}
                  placeholder="Click to add a note"
                  onChange={(e) => {
                    setNote(e.target.value);
                    store("stage-discord-note", e.target.value || null);
                  }}
                />
                <p className="dc-note__hint">Only you can see it, kept in this browser.</p>
              </section>
              <div className="dc-profile__acts">
                <button type="button" className="dc-btn dc-btn--blurple" onClick={message}>
                  <Icon d={ICON.message} size={16} />
                  Message
                </button>
                <a className="dc-btn" href={PROFILE_URL} target="_blank" rel="noreferrer" data-umami-event="discord-open-profile">
                  Open in Discord
                </a>
              </div>
            </div>
          </aside>
        )}

        <p className="dc-toast" role="status" data-failed={copied.startsWith("Couldn't") ? "" : undefined}>
          {copied}
        </p>
      </div>
    </div>
  );
}

const DISCORD_CSS = `
/* ---- Discord: its dark theme in every site theme, the way Ghostty and VSCodium keep theirs. A list of
   conversations, the chat, and the profile beside it; the list steps out on a narrower window, and on the
   narrowest the profile and the chat take turns. ---- */
.dc-wrap{container:dc / size;height:100%;min-height:0;}
.dc{
  --dc-deep:#111214;--dc-rail:#1e1f22;--dc-card:#232428;--dc-side:#2b2d31;--dc-chat:#313338;--dc-input:#383a40;
  --dc-hover:#35373c;--dc-sel:#404249;--dc-line:#3f4147;
  --dc-head:#f2f3f5;--dc-text:#dbdee1;--dc-muted:#b5bac1;--dc-faint:#949ba4;--dc-dim:#6d6f78;
  --dc-blurple:#5865f2;--dc-green:#23a55a;--dc-idle:#f0b232;--dc-dnd:#f23f43;--dc-off:#80848e;--dc-focus:#00a8fc;
  --side:224px;--panel:300px;
  position:relative;display:grid;grid-template-columns:var(--side) minmax(0,1fr) var(--panel);grid-template-areas:"side main panel";
  height:100%;overflow:hidden;background:var(--dc-chat);color:var(--dc-text);font-size:14px;line-height:1.375;
}
.dc:is(:not([data-profile]),[data-view="friends"]){--panel:0px;}
.dc :is(h2,h3,h4,p){margin:0;}
.dc :is(button,a,input,textarea):focus-visible{outline:2px solid var(--dc-focus);outline-offset:1px;}
.dc button{cursor:pointer;}
.dc :is(input,textarea){font-family:inherit;}
.dc b{font-weight:600;}

/* avatars, with the status dot cut into their corner in the colour of whatever is behind them */
.dc-av{--ring:var(--dc-chat);position:relative;display:block;flex:none;width:var(--s);height:var(--s);}
.dc-av img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;}
.dc-st{--d:calc(var(--s) * .2 + 4px);--b:calc(var(--s) * .06 + 1px);position:absolute;right:calc(var(--b) * -1);bottom:calc(var(--b) * -1);
  width:var(--d);height:var(--d);border:var(--b) solid var(--ring);border-radius:50%;background:var(--dc-green);}
.dc-st[data-status="idle"]{background:radial-gradient(circle at 24% 24%,var(--ring) 0 36%,transparent 37%) var(--dc-idle);}
.dc-st[data-status="dnd"]{background:linear-gradient(var(--ring),var(--ring)) center / 64% 26% no-repeat var(--dc-dnd);}
.dc-st[data-status="offline"]{background:radial-gradient(circle,var(--ring) 0 30%,var(--dc-off) 31%);}

/* the list of conversations */
.dc-side{grid-area:side;display:flex;flex-direction:column;min-width:0;min-height:0;overflow-y:auto;scrollbar-width:none;background:var(--dc-side);}
.dc-side__top{flex:none;display:flex;align-items:center;height:48px;padding:0 10px;box-shadow:0 1px 0 rgba(4,4,5,.2),0 1.5px 0 rgba(6,6,7,.05),0 2px 0 rgba(4,4,5,.05);}
.dc .dc-find{width:100%;height:28px;padding:0 8px;border:none;border-radius:4px;background:var(--dc-rail);color:var(--dc-faint);font-size:13px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dc-side__nav{padding:8px 8px 0;}
.dc .dc-nav{display:flex;align-items:center;gap:12px;width:100%;height:42px;padding:0 12px;border:none;border-radius:4px;background:none;color:var(--dc-faint);font-size:15px;font-weight:500;text-align:left;}
.dc .dc-nav:hover{background:var(--dc-hover);color:var(--dc-text);}
.dc .dc-nav[aria-current]{background:var(--dc-sel);color:#fff;}
.dc-side__label{padding:18px 8px 4px 18px;font-size:12px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--dc-faint);}
.dc .dc-dm{display:flex;align-items:center;gap:12px;margin:0 8px;height:44px;padding:0 8px;border:none;border-radius:4px;background:none;color:var(--dc-faint);text-align:left;}
.dc-dm .dc-av{--ring:var(--dc-side);}
.dc .dc-dm:hover{background:var(--dc-hover);color:var(--dc-text);}
.dc .dc-dm:hover .dc-av{--ring:var(--dc-hover);}
.dc .dc-dm[aria-current]{background:var(--dc-sel);color:#fff;}
.dc .dc-dm[aria-current] .dc-av{--ring:var(--dc-sel);}
.dc-dm > span:last-child{display:flex;flex-direction:column;min-width:0;line-height:1.25;}
.dc-dm b{font-size:15px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dc-dm small{font-size:12px;color:var(--dc-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

/* the bar across the top of the chat and of Friends */
.dc-chat,.dc-friends{grid-area:main;display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--dc-chat);}
.dc-head{position:relative;z-index:1;flex:none;display:flex;align-items:center;gap:10px;height:48px;padding:0 8px 0 16px;color:var(--dc-faint);
  box-shadow:0 1px 0 rgba(4,4,5,.2),0 1.5px 0 rgba(6,6,7,.05),0 2px 0 rgba(4,4,5,.05);}
.dc-head h3{font-size:16px;font-weight:600;line-height:20px;color:var(--dc-head);white-space:nowrap;}
.dc-head__custom{display:flex;align-items:center;gap:4px;min-width:0;padding-left:10px;border-left:1px solid var(--dc-line);font-size:13px;}
.dc-head__custom > span:last-child{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dc-head__tools{display:flex;gap:2px;margin-left:auto;}
.dc .dc-tool{display:grid;place-items:center;flex:none;width:34px;height:34px;padding:0;border:none;border-radius:4px;background:none;color:var(--dc-muted);}
.dc .dc-tool:hover:not(:disabled),.dc .dc-tool[aria-pressed="true"]{color:var(--dc-head);}
.dc .dc-tool:disabled{color:var(--dc-dim);cursor:default;}
.dc .dc-tool--small{width:26px;height:26px;}
.dc-emoji{flex:none;width:16px;height:16px;font-size:14px;line-height:16px;text-align:center;}

/* the chat */
.dc .dc-feed{flex:1;min-height:0;display:flex;flex-direction:column;margin:0;padding:0 0 22px;list-style:none;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dc-rail) transparent;}
.dc-intro{--s:80px;margin-top:auto;padding:16px 16px 4px;}
.dc-intro h2{margin-top:10px;font-size:30px;font-weight:700;line-height:1.2;color:var(--dc-head);overflow-wrap:anywhere;}
.dc-intro .dc-intro__user{margin:2px 0 14px;font-size:20px;font-weight:500;color:var(--dc-head);}
.dc-intro p{font-size:15px;color:var(--dc-muted);}
.dc-intro p b{color:var(--dc-head);}
.dc-intro__acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.dc .dc-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;padding:0 16px;border:none;border-radius:4px;background:#4e5058;color:#fff;font-size:14px;font-weight:500;line-height:1;text-decoration:none;white-space:nowrap;transition:background-color .17s;}
.dc .dc-btn:hover{background:#6d6f78;}
.dc .dc-btn--blurple{background:var(--dc-blurple);}
.dc .dc-btn--blurple:hover{background:#4752c4;}
.dc .dc-btn--small{height:28px;margin-top:8px;padding:0 12px;font-size:13px;}
.dc-day{display:flex;align-items:center;gap:8px;margin:22px 16px 2px;font-size:12px;font-weight:600;color:var(--dc-faint);}
.dc-day::before,.dc-day::after{content:"";flex:1;height:1px;background:var(--dc-line);}
.dc-msg{display:grid;grid-template-columns:40px minmax(0,1fr);gap:16px;margin-top:14px;padding:3px 16px;}
.dc-msg:hover{background:#2e3035;}
.dc-msg--only{margin-top:2px;background:rgba(88,101,242,.06);}
.dc-msg--only:hover{background:rgba(88,101,242,.1);}
.dc-msg__face{width:40px;height:40px;margin-top:2px;border-radius:50%;object-fit:cover;}
.dc-msg__face--you{display:grid;place-items:center;background:var(--dc-off);color:#fff;}
.dc-msg__who{display:flex;align-items:baseline;flex-wrap:wrap;gap:0 6px;}
.dc-msg__who b{font-size:15px;font-weight:500;color:var(--dc-head);}
.dc-msg__who time{font-size:12px;color:var(--dc-faint);}
.dc-msg p{font-size:15px;color:var(--dc-text);overflow-wrap:anywhere;}
.dc-tag{align-self:center;padding:0 4px;border-radius:3px;background:var(--dc-blurple);color:#fff;font-size:10px;font-weight:600;line-height:15px;text-transform:uppercase;}
.dc .dc-link{padding:0;border:none;background:none;color:#00a8fc;font-size:inherit;font-weight:500;}
.dc .dc-link:hover{text-decoration:underline;}
.dc .dc-only{display:flex;align-items:center;gap:4px;margin-top:6px;font-size:12px;color:var(--dc-faint);}
.dc-write{flex:none;display:flex;align-items:center;gap:6px;margin:0 16px 18px;padding:0 4px 0 16px;border-radius:8px;background:var(--dc-input);}
.dc .dc-write input{flex:1;min-width:0;height:44px;padding:0;border:none;background:none;color:var(--dc-text);font-size:15px;outline:none;}
.dc-write input::placeholder{color:var(--dc-dim);}
.dc-write:focus-within{box-shadow:0 0 0 1px rgba(0,168,252,.35);}

/* Friends */
.dc-tabs{display:flex;align-items:center;gap:6px;min-width:0;margin-left:6px;padding-left:16px;border-left:1px solid var(--dc-line);overflow-x:auto;scrollbar-width:none;}
.dc .dc-tab{flex:none;padding:2px 9px;border:none;border-radius:4px;background:none;color:var(--dc-muted);font-size:15px;font-weight:500;}
.dc .dc-tab:hover{background:var(--dc-hover);color:var(--dc-text);}
.dc .dc-tab[aria-current]{background:var(--dc-sel);color:#fff;}
.dc .dc-tab--add{background:#248046;color:#fff;}
.dc .dc-tab--add:hover{background:#1a6334;color:#fff;}
.dc .dc-tab--add[aria-current]{background:none;color:#2dc770;}
.dc-friends__list{flex:none;padding:16px 20px 0 28px;}
.dc-quiet{flex:1;min-height:0;display:grid;place-items:center;color:var(--dc-side);}
.dc-friends__count{margin-bottom:8px;font-size:12px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--dc-faint);}
.dc-friend{display:flex;align-items:center;gap:12px;margin:0 -10px;padding:10px;border-top:1px solid var(--dc-line);border-radius:8px;}
.dc-friend:hover{border-color:transparent;background:#393c41;}
.dc-friend:hover .dc-av{--ring:#393c41;}
.dc-friend p{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:6px;min-width:0;line-height:1.3;}
.dc-friend b{font-size:15px;color:var(--dc-head);}
.dc-friend__user{font-size:13px;color:var(--dc-faint);opacity:0;transition:opacity .15s;}
.dc-friend:hover .dc-friend__user,.dc-friend:focus-within .dc-friend__user{opacity:1;}
.dc-friend small{flex-basis:100%;font-size:13px;color:var(--dc-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dc-friend__acts{display:flex;gap:10px;margin-left:auto;}
.dc .dc-round{display:grid;place-items:center;width:36px;height:36px;padding:0;border:none;border-radius:50%;background:var(--dc-side);color:var(--dc-muted);}
.dc .dc-round:hover{color:var(--dc-head);background:var(--dc-rail);}
.dc-empty{padding:20px 0;font-size:14px;color:var(--dc-faint);}
.dc-add{padding:20px 28px;border-bottom:1px solid var(--dc-line);}
.dc-add h3{margin-bottom:8px;font-size:20px;font-weight:600;color:var(--dc-head);}
.dc-add p{font-size:14px;color:var(--dc-muted);}
.dc-add__field{display:flex;align-items:center;gap:8px;margin:16px 0 10px;padding-right:10px;border:1px solid var(--dc-rail);border-radius:8px;background:var(--dc-rail);}
.dc-add__field:focus-within{border-color:var(--dc-focus);}
.dc .dc-add__field input{flex:1;min-width:0;height:50px;padding:0 14px;border:none;background:none;color:var(--dc-head);font-size:16px;outline:none;}
.dc .dc-add__hint{font-size:13px;color:var(--dc-faint);}

/* the profile beside the chat */
.dc-profile{grid-area:panel;display:flex;flex-direction:column;min-width:0;min-height:0;overflow-y:auto;scrollbar-width:none;background:var(--dc-card);}
.dc-banner{flex:none;height:110px;}
.dc-profile__face{--s:80px;position:relative;flex:none;height:calc(var(--s) / 2 + 6px);padding:0 16px;}
.dc-profile__face > .dc-av{--ring:var(--dc-card);position:absolute;top:calc(var(--s) / -2 - 6px);left:16px;border:6px solid var(--dc-card);border-radius:50%;box-sizing:content-box;}
.dc-profile__face .dc-st{right:0;bottom:0;}
.dc-bubble{position:absolute;top:6px;left:calc(var(--s) + 38px);display:flex;align-items:center;gap:6px;width:max-content;max-width:calc(100% - var(--s) - 54px);padding:6px 10px;border-radius:12px;background:var(--dc-side);font-size:13px;color:var(--dc-text);}
.dc-bubble::before{content:"";position:absolute;left:-6px;top:10px;width:10px;height:10px;border-radius:50%;background:var(--dc-side);}
.dc-profile__body{display:flex;flex-direction:column;gap:12px;padding:12px 16px 16px;}
.dc-profile h2{font-size:20px;font-weight:700;line-height:24px;color:var(--dc-head);overflow-wrap:anywhere;}
.dc-profile__user{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:2px;font-size:14px;color:var(--dc-head);}
.dc-badges{display:inline-flex;gap:2px;padding:2px 4px;border:1px solid var(--dc-line);border-radius:6px;}
.dc-badge{display:grid;place-items:center;width:20px;height:20px;}
.dc-profile__status{margin-top:4px;font-size:13px;color:var(--dc-faint);}
.dc-card,.dc-act{padding:12px;border-radius:8px;background:var(--dc-deep);}
.dc-card h4,.dc-act h4{margin-bottom:6px;font-size:12px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:var(--dc-head);}
.dc-card > * + h4{margin-top:14px;}
.dc-since{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--dc-text);}
.dc-since svg{color:var(--dc-muted);}
.dc-userid{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:-4px;font-family:var(--mono);font-size:12px;color:var(--dc-text);}
.dc-userid span{min-width:0;overflow:hidden;text-overflow:ellipsis;}
.dc .dc-note{display:block;width:calc(100% + 8px);min-height:30px;margin:0 -4px;padding:6px 4px;border:none;border-radius:3px;background:none;color:var(--dc-text);font-size:13px;line-height:1.35;resize:none;field-sizing:content;outline:none;}
.dc .dc-note:focus{background:var(--dc-rail);}
.dc-note::placeholder{color:var(--dc-dim);}
.dc .dc-note__hint{margin-top:2px;font-size:11px;color:var(--dc-dim);}
.dc-profile__acts{display:flex;flex-wrap:wrap;gap:8px;}
.dc-profile__acts > *{flex:1 1 auto;}

/* what I'm doing, live: a game, a show, a song */
.dc-act__row{display:flex;align-items:center;gap:12px;}
.dc-act__art{position:relative;flex:none;display:grid;place-items:center;width:60px;height:60px;border-radius:8px;background:var(--dc-side);color:var(--dc-muted);}
.dc-act__art > img:first-child{width:100%;height:100%;border-radius:8px;object-fit:cover;}
.dc-act__small{position:absolute;right:-5px;bottom:-5px;width:22px;height:22px;border:3px solid var(--dc-deep);border-radius:50%;background:var(--dc-deep);}
.dc-act__row p{display:flex;flex-direction:column;min-width:0;font-size:12.5px;line-height:17px;color:var(--dc-text);}
.dc-act__row p > *{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dc-act__row b{font-size:14px;color:var(--dc-head);}
.dc-act__time{font-variant-numeric:tabular-nums;color:var(--dc-muted);}
.dc-bar{height:4px;margin-top:12px;border-radius:2px;background:#4e5058;overflow:hidden;}
.dc-bar i{display:block;height:100%;border-radius:2px;background:#fff;transition:width 1s linear;}
.dc-bar__times{display:flex;justify-content:space-between;margin-top:4px;font-size:12px;font-variant-numeric:tabular-nums;color:var(--dc-text);}

/* "Copied", the way Discord says it: a small green note that fades */
.dc-toast{position:absolute;left:50%;bottom:78px;z-index:3;padding:6px 12px;border-radius:6px;background:#248046;color:#fff;font-size:13px;font-weight:600;width:max-content;max-width:calc(100% - 32px);text-align:center;
  opacity:0;translate:-50% 6px;pointer-events:none;transition:opacity .15s,translate .15s;}
.dc-toast:not(:empty){opacity:1;translate:-50% 0;}
.dc-toast[data-failed]{background:#4e5058;}

/* a narrower window: the list and the profile get narrower, then the list steps out */
@container dc (max-width:1000px){
  .dc{--side:196px;--panel:256px;}
  .dc-side__label{padding-left:14px;}
}
@container dc (max-width:760px){
  .dc{--side:0px;}
  .dc-side{display:none;}
}
/* the narrowest, a phone: one thing at a time, the profile first, and Message goes over to the chat */
@container dc (max-width:600px){
  .dc{--panel:0px;}
  .dc[data-profile][data-view="dm"] .dc-chat{display:none;}
  .dc[data-profile][data-view="dm"] .dc-profile{grid-area:main;}
  .dc-profile__body{padding-bottom:0;}
  .dc-profile__acts{position:sticky;bottom:0;margin:0 -16px;padding:10px 16px 14px;background:var(--dc-card);box-shadow:0 -1px 0 var(--dc-line);}
  .dc-banner{height:96px;}
  .dc-intro h2{font-size:26px;}
  .dc .dc-write input{font-size:16px;}
  .dc-toast{bottom:20px;}
}
/* a short window (a small laptop screen): the banner and the big faces shrink, so the chat keeps its room */
@container dc (max-height:460px){
  .dc-banner{height:72px;}
  .dc-profile__face{--s:64px;}
  .dc-intro{--s:56px;padding-top:12px;}
  .dc-intro h2{margin-top:6px;font-size:24px;}
  .dc-intro .dc-intro__user{margin-bottom:8px;font-size:17px;}
  .dc-intro p{font-size:14px;}
  .dc-intro__acts{margin-top:12px;}
  .dc-write{margin-bottom:12px;}
}
@container dc (max-height:320px){
  .dc-banner{height:48px;}
  .dc-profile__face{--s:52px;}
  .dc-intro{--s:44px;}
  .dc-intro h2{font-size:20px;}
  .dc-intro .dc-intro__user{font-size:15px;}
  .dc-head{height:42px;}
  .dc-write{margin:0 10px 10px;}
  .dc .dc-write input{height:38px;}
  .dc-toast{bottom:12px;}
}
@media (prefers-reduced-motion:reduce){
  .dc-bar i,.dc-toast,.dc .dc-btn,.dc-friend__user{transition:none;}
}
`;
