// The music player and its styles, shared by both sites.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import WebAudioAnalyser from "web-audio-analyser";
import { TRACKS } from "./tracks";
import { prefersReducedMotion } from "./data";

const SC_PROFILE = "https://soundcloud.com/latersellyoulater";

let audioGraph = null;

function connectAnalyser(audio) {
  if (audioGraph) return audioGraph;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    const ctx = new Ctx();
    const analyser = WebAudioAnalyser(audio, ctx, { audible: false });
    analyser.analyser.fftSize = 512;
    analyser.analyser.smoothingTimeConstant = 0.72;
    const gain = ctx.createGain();
    analyser.output.connect(gain);
    gain.connect(ctx.destination);
    audioGraph = { ctx, analyser, gain };
  } catch {
    audioGraph = null;
  }
  return audioGraph;
}

const bandLevel = (bins, from, to) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += bins[i];
  return sum / ((to - from) * 255);
};

const clock = (sec) => {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// slot: an element to render the player into instead of the dropdown.
// ipod: draw it as an iPod (screen and click wheel) in the slot; the record then plays and pauses.
function SoundDock({ slot = null, ipod = false }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [live, setLive] = useState(false);
  const [volume, setVolume] = useState(() => {
    try {
      const v = Number(localStorage.getItem("volume"));
      return localStorage.getItem("volume") !== null && v >= 0 && v <= 100 ? v : 70;
    } catch {
      return 70;
    }
  });
  const lastVolumeRef = useRef(volume || 70);
  const wheelTurned = useRef(false);
  const audioRef = useRef(null);
  const tabRef = useRef(null);
  const panelRef = useRef(null);
  const eqRef = useRef(null);
  const track = TRACKS[index];

  useEffect(() => {
    const audio = audioRef.current;
    if (audioGraph) {
      audioGraph.gain.gain.value = volume / 100;
      audio.volume = 1;
    } else {
      audio.volume = volume / 100;
    }
    try {
      localStorage.setItem("volume", String(volume));
    } catch {
      /* storage unavailable */
    }
  }, [volume, live]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        tabRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!live || prefersReducedMotion()) return;
    const fx = document.documentElement;
    const eq = eqRef.current;
    const level = { beat: 0, b1: 0, b2: 0, b3: 0 };
    const avg = { bass: 0, b1: 0, b2: 0, b3: 0 };
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    let raf;

    const tick = () => {
      const bins = audioGraph.analyser.frequencies();
      const raw = { bass: bandLevel(bins, 1, 4), b1: bandLevel(bins, 1, 5), b2: bandLevel(bins, 5, 32), b3: bandLevel(bins, 32, 100) };
      // compare against a running average so kicks spike even in bass-heavy mixes
      for (const k in avg) avg[k] += (raw[k] - avg[k]) * 0.05;
      const target = playing
        ? {
            beat: clamp((raw.bass - avg.bass) * 10 + raw.bass * 0.12, 0, 1),
            b1: clamp(0.4 + (raw.b1 - avg.b1) * 10, 0.08, 1),
            b2: clamp(0.4 + (raw.b2 - avg.b2) * 13, 0.08, 1),
            b3: clamp(0.35 + (raw.b3 - avg.b3) * 16, 0.08, 1),
          }
        : { beat: 0, b1: 0, b2: 0, b3: 0 };
      let active = playing;
      for (const k in level) {
        level[k] += (target[k] - level[k]) * (target[k] > level[k] ? 0.55 : 0.16);
        if (level[k] > 0.004) active = true;
      }
      fx?.style.setProperty("--beat", level.beat.toFixed(3));
      eq?.style.setProperty("--b1", level.b1.toFixed(3));
      eq?.style.setProperty("--b2", level.b2.toFixed(3));
      eq?.style.setProperty("--b3", level.b3.toFixed(3));
      if (active) raf = requestAnimationFrame(tick);
      else fx?.style.setProperty("--beat", "0");
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, playing]);

  const play = (i = index) => {
    const audio = audioRef.current;
    const graph = connectAnalyser(audio);
    if (graph && !live) setLive(true);
    graph?.ctx.resume();
    if (i !== index) {
      setIndex(i);
      setProgress(0);
      audio.src = TRACKS[i].src;
    } else if (!audio.getAttribute("src")) {
      audio.src = TRACKS[i].src;
    }
    setFailed(false);
    audio.play().catch(() => {});
  };

  const toggle = () => {
    if (playing) audioRef.current.pause();
    else play();
  };

  const skip = (step) => {
    const audio = audioRef.current;
    if (step < 0 && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    play((index + step + TRACKS.length) % TRACKS.length);
  };

  const seek = (e) => {
    const audio = audioRef.current;
    const ratio = Number(e.target.value) / 1000;
    setProgress(ratio);
    const duration = audio.duration || track.duration;
    if (!audio.getAttribute("src")) audio.src = track.src;
    audio.currentTime = ratio * duration;
  };

  const toggleMute = () => {
    if (volume > 0) {
      lastVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(lastVolumeRef.current || 70);
    }
  };

  const portal = (node) => (slot ? createPortal(node, slot) : node);
  const audio = (
    <audio
      ref={audioRef}
      preload="none"
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => play((index + 1) % TRACKS.length)}
      onTimeUpdate={(e) => {
        const a = e.currentTarget;
        if (a.duration) setProgress(a.currentTime / a.duration);
      }}
      onError={() => {
        setPlaying(false);
        setFailed(true);
      }}
    />
  );
  // tracks.js carries each track's length, so the times show before anything has loaded.
  const duration = track.duration;

  // The speaker picture shared by both players: crossed out when muted, one wave when quiet, two when loud.
  const speaker = (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {volume === 0 ? (
        <path d="m16 9.5 5 5m0-5-5 5" />
      ) : (
        <>
          <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
          {volume > 50 && <path d="M18.3 6.5a8 8 0 0 1 0 11" />}
        </>
      )}
    </svg>
  );
  const nudgeVolume = (by) => setVolume((v) => Math.min(100, Math.max(0, v + by)));

  // Turning the iPod's click wheel changes the volume, as it does on a real one: press anywhere on the ring and
  // drag around it, one full turn for the whole range. A press that turned the wheel doesn't also count as a
  // click on the button under it.
  const turnWheel = (e) => {
    if (e.button !== 0 || e.target.closest(".ipod__center")) return;
    const box = e.currentTarget.getBoundingClientRect();
    const angleOf = (ev) => Math.atan2(ev.clientY - (box.top + box.height / 2), ev.clientX - (box.left + box.width / 2));
    let last = angleOf(e);
    let turned = 0;
    let owed = 0;
    const move = (ev) => {
      const now = angleOf(ev);
      let step = now - last;
      if (step > Math.PI) step -= Math.PI * 2;
      if (step < -Math.PI) step += Math.PI * 2;
      last = now;
      turned += step;
      // A few degrees of wobble while pressing a button isn't a turn.
      if (!wheelTurned.current && Math.abs(turned) < 0.14) return;
      wheelTurned.current = true;
      owed += (step / (Math.PI * 2)) * 100;
      const whole = Math.trunc(owed);
      if (!whole) return;
      owed -= whole;
      nudgeVolume(whole);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      // Cleared after the click that follows this release has been swallowed.
      setTimeout(() => {
        wheelTurned.current = false;
      }, 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const volumeRow = (
    <div className="ipod__vol">
      <button type="button" onClick={toggleMute} aria-label={volume > 0 ? "Mute" : "Unmute"}>
        {speaker}
      </button>
      <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" style={{ "--p": `${volume}%` }} />
    </div>
  );

  // The iPod: a screen showing what's playing (or, after MENU, the track list) above a click wheel.
  const ipodNode = (
    <div className="ipod" role="region" aria-label="Music player" onWheel={(e) => !e.target.closest(".ipod__list") && e.deltaY && nudgeVolume(e.deltaY < 0 ? 4 : -4)}>
      <div className="ipod__screen">
        <p className="ipod__head">
          <span>{menu ? "Music" : "Now Playing"}</span>
          <span className={`ipod__eq${playing ? " is-playing" : ""}`} aria-hidden="true">
            <i /><i /><i />
          </span>
        </p>
        {menu ? (
          <ol className="ipod__list" aria-label="Tracks">
            {TRACKS.map((t, i) => (
              <li key={t.src}>
                <button
                  type="button"
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => {
                    play(i);
                    setMenu(false);
                  }}
                >
                  {t.title}
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <>
            <div className="ipod__now">
              <img src={track.art} alt="" width="40" height="40" />
              <div>
                <a className="ipod__title" href={track.soundcloud} target="_blank" rel="noreferrer">
                  {track.title}
                </a>
                <a className="ipod__artist" href={SC_PROFILE} target="_blank" rel="noreferrer">
                  Later
                </a>
              </div>
            </div>
            {failed ? (
              <p className="ipod__status" role="status">
                Didn't load. <a href={track.soundcloud} target="_blank" rel="noreferrer">SoundCloud</a>
              </p>
            ) : (
              <div className="ipod__time">
                <span className="ipod__bar" style={{ "--p": `${progress * 100}%` }} />
                <span>{clock(progress * duration)}</span>
                <span>-{clock(duration - progress * duration)}</span>
              </div>
            )}
            {volumeRow}
          </>
        )}
      </div>
      <div
        className="ipod__wheel"
        title="Turn the wheel to change the volume"
        onPointerDown={turnWheel}
        onClickCapture={(e) => {
          if (!wheelTurned.current) return;
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <button type="button" className="ipod__menu" onClick={() => setMenu((m) => !m)} aria-pressed={menu}>
          Menu
        </button>
        <button type="button" className="ipod__prev" onClick={() => skip(-1)} aria-label="Previous track">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 5h2.5v14H5zM12 12l7-7v14zM6 12l7-7v14z" /></svg>
        </button>
        <button type="button" className="ipod__next" onClick={() => skip(1)} aria-label="Next track">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 5H19v14h-2.5zM12 12 5 5v14zM18 12l-7-7v14z" /></svg>
        </button>
        <button type="button" className="ipod__pp" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5l8 7-8 7zM13 5h3v14h-3zM18 5h3v14h-3z" /></svg>
        </button>
        <button type="button" className="ipod__center" onClick={toggle} aria-label={playing ? "Pause" : "Play"} />
      </div>
    </div>
  );

  if (ipod)
    return (
      <div className="dock">
        {slot && createPortal(ipodNode, slot)}
        <button type="button" className="dock__tab" aria-label={playing ? `Pause ${track.title}` : "Play my music"} title={playing ? track.title : "My music"} onClick={toggle}>
          <span ref={eqRef} className={`dock__eq${playing ? " is-playing" : ""}${live ? " is-live" : ""}`} aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="dock__tab-label">{playing ? track.title : "My music"}</span>
        </button>
        {audio}
      </div>
    );

  return (
    <div className={`dock ${open ? "is-open" : ""}`}>
      {portal(
      <div ref={panelRef} className="dock__panel" id="dock-panel" role="region" aria-label="Music player" tabIndex={-1} inert={!open && !slot}>
        <div className="dock__now">
          <img className="dock__art" src={track.art} alt="" width="56" height="56" />
          <div className="dock__meta">
            <a className="dock__title" href={track.soundcloud} target="_blank" rel="noreferrer">
              {track.title}
            </a>
            <a className="dock__artist" href={SC_PROFILE} target="_blank" rel="noreferrer">
              Later
            </a>
          </div>
        </div>

        {failed && (
          <p className="dock__status" role="status">
            This track didn't load. <a href={track.soundcloud} target="_blank" rel="noreferrer">Play it on SoundCloud</a>.
          </p>
        )}

        <input
          className="dock__range dock__seek"
          type="range"
          min="0"
          max="1000"
          value={Math.round(progress * 1000)}
          onChange={seek}
          aria-label="Seek"
          style={{ "--p": `${progress * 100}%` }}
        />

        <div className="dock__controls">
          <button type="button" onClick={() => skip(-1)} aria-label="Previous track">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
          </button>
          <button type="button" className="dock__play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button type="button" onClick={() => skip(1)} aria-label="Next track">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
          </button>
        </div>

        <div className="dock__volume">
          <button type="button" onClick={toggleMute} aria-label={volume > 0 ? "Mute" : "Unmute"}>
            {speaker}
          </button>
          <input
            className="dock__range"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            style={{ "--p": `${volume}%` }}
          />
        </div>

        <ol className="dock__list" aria-label="Tracks">
          {TRACKS.map((t, i) => (
            <li key={t.src}>
              <button
                type="button"
                className={i === index ? "is-current" : ""}
                aria-current={i === index ? "true" : undefined}
                onClick={() => play(i)}
              >
                {t.title}
              </button>
            </li>
          ))}
        </ol>

        <a className="dock__credit" href={SC_PROFILE} target="_blank" rel="noreferrer">
          Also on SoundCloud
        </a>
      </div>
      )}

      <button
        ref={tabRef}
        type="button"
        className="dock__tab"
        aria-expanded={open}
        aria-controls="dock-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span ref={eqRef} className={`dock__eq${playing ? " is-playing" : ""}${live ? " is-live" : ""}`} aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="dock__tab-label">{playing ? track.title : "My music"}</span>
      </button>

      {audio}
    </div>
  );
}

const DOCK_CSS = `
/* ---------- SOUND DOCK ---------- */
.dock{
  position:fixed;right:16px;bottom:16px;z-index:90;
  display:flex;flex-direction:column;align-items:flex-end;gap:10px;
  width:min(340px,calc(100vw - 32px));pointer-events:none;
}
.dock__tab,.dock__panel{pointer-events:auto;}
.dock__tab{
  display:inline-flex;align-items:center;gap:10px;max-width:100%;min-height:44px;
  padding:10px 18px;border-radius:999px;border:none;cursor:pointer;font:inherit;
  background:var(--accent-fill);color:var(--on-accent);font-size:14px;
  box-shadow:0 14px 30px -14px color-mix(in srgb,var(--shadow) 60%,transparent);
  transition:transform .25s var(--ease);
}
.dock__tab:hover{transform:translateY(-2px);}
.dock__tab-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dock__eq{display:inline-flex;align-items:flex-end;gap:2px;height:12px;flex:0 0 auto;}
.dock__eq i{width:3px;height:4px;border-radius:1px;background:currentColor;}
.dock__eq i:nth-child(2){height:9px;}
.dock__eq i:nth-child(3){height:6px;}
.dock__eq.is-playing i{animation:eq .9s ease-in-out infinite alternate;}
.dock__eq.is-playing i:nth-child(2){animation-delay:-.3s;}
.dock__eq.is-playing i:nth-child(3){animation-delay:-.6s;}
@keyframes eq{from{height:3px;}to{height:12px;}}
.dock__eq.is-live i{animation:none;height:calc(25% + var(--b1, 0) * 75%);}
.dock__eq.is-live i:nth-child(2){height:calc(25% + var(--b2, 0) * 75%);}
.dock__eq.is-live i:nth-child(3){height:calc(25% + var(--b3, 0) * 75%);}

.dock__panel{
  width:100%;padding:14px;border-radius:20px;
  background:color-mix(in srgb,var(--surface) 84%,transparent);
  backdrop-filter:saturate(160%) blur(18px);-webkit-backdrop-filter:saturate(160%) blur(18px);
  border:1px solid var(--line);
  box-shadow:0 30px 60px -24px color-mix(in srgb,var(--shadow) 40%,transparent);
  opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);transform-origin:bottom right;
  transition:opacity .25s var(--ease),transform .3s var(--ease),visibility 0s linear .3s;
}
.dock__panel:focus{outline:none;}
.dock.is-open .dock__panel{opacity:1;visibility:visible;transform:none;transition:opacity .25s var(--ease),transform .3s var(--ease);}
.dock__status{margin:10px 2px 0;font-size:13px;line-height:1.5;}
.dock__status a{text-decoration:underline;text-underline-offset:3px;}
.dock__now{display:flex;align-items:center;gap:12px;}
.dock__art{width:56px;height:56px;border-radius:12px;object-fit:cover;flex:0 0 auto;}
.dock__meta{min-width:0;display:flex;flex-direction:column;gap:2px;}
.dock__title{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dock__artist{font-size:12.5px;color:var(--muted);}
.dock__title:hover,.dock__artist:hover{text-decoration:underline;}

.dock__range{
  -webkit-appearance:none;appearance:none;width:100%;height:4px;margin:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(to right,var(--accent-fill) var(--p),var(--line) var(--p));
}
.dock__range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent-fill);border:none;}
.dock__range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--accent-fill);border:none;}
.dock__seek{margin:14px 0 6px;}
.dock__volume{display:flex;align-items:center;gap:8px;margin-top:6px;padding:0 4px;}
.dock__volume button{
  display:grid;place-items:center;width:36px;height:36px;flex:0 0 auto;border-radius:50%;
  border:none;background:transparent;color:var(--text);cursor:pointer;
}
.dock__volume button:hover{background:var(--line);}
.dock__controls{display:flex;justify-content:center;align-items:center;gap:14px;}
.dock__controls button{
  display:grid;place-items:center;width:40px;height:40px;border-radius:50%;
  border:none;background:transparent;color:var(--text);cursor:pointer;
}
.dock__controls button:hover{background:var(--line);}
.dock__controls .dock__play{width:46px;height:46px;background:var(--accent-fill);color:var(--on-accent);}
.dock__controls .dock__play:hover{background:var(--accent-fill);opacity:.9;}
.site .dock__list{
  list-style:none;padding-left:0;margin:12px 0 0;max-height:170px;overflow-y:auto;
  border-top:1px solid var(--line);padding-top:6px;
  scrollbar-width:thin;scrollbar-color:var(--line) transparent;
}
.dock__list button{
  display:block;width:100%;text-align:left;padding:8px 6px;border:none;border-radius:8px;
  background:transparent;color:var(--text);font:inherit;font-size:13px;cursor:pointer;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.dock__list button:hover{background:var(--line);}
.dock__list button.is-current{color:var(--accent-fill);text-decoration:underline;text-underline-offset:3px;}
.dock__credit{display:block;margin-top:10px;font-size:11.5px;color:var(--muted);text-align:right;}
.dock__credit:hover{color:var(--text);}
`;

// eslint-disable-next-line react/only-export-components
export { DOCK_CSS, SC_PROFILE, SoundDock };
