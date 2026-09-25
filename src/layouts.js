// Page layouts. Each is a CSS layer keyed on <html data-layout="…"> that restyles the same markup,
// so every layout works with every color theme.

export const LAYOUTS = [
  { id: "original", name: "Original", blurb: "Cream paper, comic type. The classic." },
  { id: "brutalist", name: "Swiss", blurb: "Quiet grid, hairlines, big type." },
  { id: "terminal", name: "Terminal", blurb: "A CRT that knows your name." },
  { id: "chaos", name: "Chaos", blurb: "Stickers, tilt, and the skills got loose." },
];

const X = ':root[data-layout="brutalist"]';
const T = ':root[data-layout="terminal"]';
const C = ':root[data-layout="chaos"]';

export const LAYOUT_CSS = `
/* ================= SHARED ================= */
/* layout switcher dock (bottom left, mirrors the music dock) */
.ldock{
  position:fixed;left:16px;bottom:16px;z-index:90;
  display:flex;flex-direction:column;align-items:flex-start;gap:10px;
  pointer-events:none;
}
.ldock__tab,.ldock__menu{pointer-events:auto;}
.ldock__tab{
  display:inline-flex;align-items:center;gap:9px;min-height:44px;
  padding:9px 16px 9px 12px;border-radius:999px;cursor:pointer;
  border:1px solid var(--line);background:var(--surface);color:var(--text);
  font:inherit;font-size:14px;
  box-shadow:0 14px 30px -16px color-mix(in srgb,var(--shadow) 55%,transparent);
  transition:transform .25s var(--ease);
}
.ldock__tab:hover{transform:translateY(-2px);}
.ldock__tab svg{flex:0 0 auto;}
.ldock__current{color:var(--muted);}
.site .ldock__menu{
  width:min(300px,calc(100vw - 32px));max-height:min(72vh,480px);overflow-y:auto;padding:6px;
  background:var(--surface);border:1px solid var(--line);border-radius:18px;
  box-shadow:0 30px 60px -24px color-mix(in srgb,var(--shadow) 45%,transparent);
  animation:menuUp .2s var(--ease);
}
@keyframes menuUp{from{opacity:0;transform:translateY(8px) scale(.97);}to{opacity:1;transform:none;}}
.ldock__opt{
  display:grid;grid-template-columns:56px minmax(0,1fr);gap:12px;align-items:center;
  width:100%;padding:8px;border:none;border-radius:12px;
  background:transparent;color:var(--text);font:inherit;text-align:left;cursor:pointer;
}
.ldock__opt:hover,.ldock__opt[aria-pressed="true"]{background:var(--line);}
.ldock__thumb{
  display:grid;place-items:center;width:56px;height:40px;border-radius:7px;
  background:var(--bg);border:1px solid var(--line);color:var(--text);
}
.ldock__name{display:block;font-size:14px;line-height:1.25;}
.ldock__blurb{display:block;margin-top:2px;font-size:12px;line-height:1.35;color:var(--muted);}
.ldock__hint{margin:6px 8px 4px;font-size:11.5px;color:var(--muted);}
@media (max-width:760px){
  .ldock{left:14px;bottom:14px;}
  .ldock__tab{width:50px;height:50px;min-height:0;padding:0;justify-content:center;}
  .ldock__label{
    position:absolute;width:1px;height:1px;margin:-1px;padding:0;
    overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;
  }
}

/* ================= SWISS (quiet grid, hairlines, big type) ================= */
${X}{
  --font-display:'Inter',-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif;
  --font-body:'Inter',-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif;
  --rule:color-mix(in srgb,var(--text) 18%,transparent);
  --grain-opacity:.05;
}
${X} .site{letter-spacing:-.005em;}
${X} .hero::before{display:none;}
${X} .bg-dots{display:none;}
${X} :is(.hero__name,.section__title,.project__name,.contact__heading){font-weight:600;letter-spacing:-.035em;}
${X} .nav{
  background:color-mix(in srgb,var(--bg) 84%,transparent);
  border-bottom:1px solid var(--rule);
}
${X} .nav__brand{font-weight:600;font-size:17px;letter-spacing:-.02em;}
${X} .nav__links a{font-size:13.5px;font-weight:500;}
${X} .nav__links a::after{background:var(--text);}
${X} .hero{
  display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);
  column-gap:clamp(28px,5vw,72px);row-gap:0;align-items:start;
  padding-top:clamp(44px,7vw,96px);
}
${X} .hero__intro{display:contents;}
${X} .hero__name{
  grid-column:1/-1;grid-row:1;margin:0 0 clamp(24px,3.4vw,44px);
  font-size:clamp(40px,7.6vw,108px);line-height:.94;
}
${X} .hero__photo{
  grid-column:2;grid-row:2/span 5;width:auto;aspect-ratio:4/5;
  border:none;border-radius:8px;box-shadow:none;
}
${X} :is(.hero__role,.hero__proof,.hero__status,.hero__actions,.hero__resume-date){grid-column:1;margin:0;}
${X} .hero__role{
  grid-row:2;padding-bottom:16px;border-bottom:1px solid var(--rule);
  font-size:12px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);
}
${X} .hero__proof{
  grid-row:3;margin-top:24px;max-width:22ch;
  font-size:clamp(24px,2.9vw,38px);font-weight:500;letter-spacing:-.025em;line-height:1.15;color:var(--text);
}
${X} .hero__status{grid-row:4;margin-top:26px;font-size:14.5px;color:var(--muted);}
${X} .hero__status::before{background:var(--text);box-shadow:none;}
${X} .hero__actions{grid-row:5;margin-top:28px;}
${X} .hero__resume-date{grid-row:6;margin-top:12px;font-size:12.5px;}
${X} .btn-primary{
  background:var(--text);color:var(--bg);box-shadow:none;font-weight:500;letter-spacing:0;
  transition:opacity .2s var(--ease);
}
${X} .btn-primary:hover{transform:none;opacity:.8;}
${X} .hero__secondary{font-weight:500;text-decoration-thickness:1px;text-decoration-color:var(--rule);}
${X} .hero__secondary:hover{color:var(--text);text-decoration-color:var(--text);}
${X} .section__title{
  font-size:clamp(34px,5.2vw,68px);line-height:1;
  padding-top:20px;border-top:1px solid var(--rule);
}
${X} .projects{gap:clamp(40px,6vw,80px);}
${X} .project{padding-top:clamp(28px,4vw,48px);border-top:1px solid var(--rule);}
${X} .project:first-child{padding-top:0;border-top:none;}
${X} .project__name{font-size:clamp(28px,3.2vw,42px);}
${X} .project__summary{font-size:clamp(17px,1.6vw,20px);font-weight:500;letter-spacing:-.015em;line-height:1.35;}
${X} .project__credit{font-size:13px;}
${X} .bullets li{font-size:15.5px;line-height:1.6;letter-spacing:-.005em;}
${X} .bullets li::before{background:var(--muted);width:5px;height:5px;top:.7em;}
${X} .hl{padding:0;margin:0;background:none;color:var(--text);font-weight:600;}
${X} .project__stack li{background:transparent;border:1px solid var(--rule);font-size:12px;font-weight:500;}
${X} .project__link{font-weight:500;text-decoration-thickness:1px;text-decoration-color:var(--rule);}
${X} .project__link:hover{color:var(--text);text-decoration-color:var(--text);}
${X} .window{border:1px solid var(--rule);border-radius:12px;box-shadow:0 24px 50px -36px color-mix(in srgb,var(--shadow) 45%,transparent);}
${X} .project:hover .window{transform:none;box-shadow:0 24px 50px -36px color-mix(in srgb,var(--shadow) 45%,transparent);}
${X} .window__bar{background:color-mix(in srgb,var(--surface) 92%,var(--text) 8%);border-bottom:1px solid var(--rule);}
${X} .window__url{font-size:11.5px;font-weight:500;}
${X} .window__mode{font-weight:500;}
${X} .tech__hint{font-size:14px;}
${X} .tech__rows{border-top:1px solid var(--rule);}
${X} .tech__row{border-top:1px solid var(--rule);padding:20px 0;}
${X} .tech__row:first-child{border-top:none;}
${X} .tech__row:last-child{border-bottom:1px solid var(--rule);}
${X} .tech__label{padding-top:10px;font-size:11.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;}
${X} .chip{background:transparent;border:1px solid var(--rule);font-size:13px;font-weight:500;}
${X} .tech.is-visible .chip:hover{transform:none;border-color:var(--text);}
${X} .chip[aria-expanded="true"]{background:var(--text);color:var(--bg);border-color:var(--text);}
${X} .contact{
  background:transparent;color:var(--text);text-align:left;
  padding:clamp(40px,6vw,72px) 0 0;border:none;border-top:1px solid var(--rule);border-radius:0;box-shadow:none;
}
${X} .contact__heading{font-size:clamp(34px,5.2vw,68px);line-height:1;}
${X} .contact__email{font-weight:500;text-decoration-color:var(--rule);text-decoration-thickness:1px;}
${X} .contact__email:hover{color:var(--text);text-decoration-color:var(--text);}
${X} .contact__actions{justify-content:flex-start;}
${X} .social{background:transparent;border:1px solid var(--rule);color:var(--text);}
${X} .social:hover{background:var(--text);color:var(--bg);border-color:var(--text);transform:none;}
${X} .contact__tagline{color:var(--muted);font-size:15px;}
${X} .footer{border-top:1px solid var(--rule);font-size:12.5px;}
${X} :is(.dock__tab,.ldock__tab,.theme-toggle){box-shadow:none;}
${X} :is(.dock__panel,.ldock__menu,.theme-menu,.skill-bubble){
  border-color:var(--rule);box-shadow:0 24px 60px -30px color-mix(in srgb,var(--shadow) 50%,transparent);
}
@media (max-width:760px){
  ${X} .hero{grid-template-columns:minmax(0,1fr);}
  ${X} .hero__photo{grid-column:1;grid-row:2;aspect-ratio:4/3;margin-bottom:22px;}
  ${X} :is(.hero__role,.hero__proof,.hero__status,.hero__actions,.hero__resume-date){grid-row:auto;}
}

/* ================= TERMINAL (CRT telemetry) ================= */
${T}{
  color-scheme:dark;
  --term:color-mix(in oklab,var(--brand) 50%,#fff);
  --bg:#0a0c0a;--surface:#101310;--card:#101310;--placeholder:#0d100d;
  --text:#e4e6de;--tagline:#a3a79d;
  --accent-fill:var(--term);--accent:var(--term);--card-ink:var(--term);
  --on-accent:#0a0c0a;--ink-on-light:#0a0c0a;--shadow:#000;
  --line:color-mix(in srgb,var(--term) 28%,transparent);
  --font-display:'VT323',ui-monospace,monospace;
}
${T} :is(.hero__name,.section__title,.project__name,.contact__heading){font-weight:400;}
${T} .hero::before{display:none;}
${T} .bg-dots{animation:none;background-image:none;}
${T} .bg-dots::after{
  content:"";position:absolute;inset:0;
  background:radial-gradient(60% 50% at 50% 45%,color-mix(in srgb,var(--term) 12%,transparent),transparent 70%);
  opacity:calc(var(--beat,0) * .5);
}
/* The CRT: scanlines, RGB phosphor stripes, a vignette, a slow roll bar, and a faint flicker, all on top of everything. */
${T} .bg-grain{
  z-index:80;opacity:1;mix-blend-mode:normal;background-size:auto;overflow:hidden;
  background-image:
    radial-gradient(125% 95% at 50% 50%,transparent 58%,rgba(0,0,0,.55) 100%),
    repeating-linear-gradient(0deg,rgba(0,0,0,calc(.24 - var(--beat,0) * .06)) 0 1px,transparent 1px 3px),
    repeating-linear-gradient(90deg,rgba(255,60,60,.045) 0 1px,rgba(60,255,60,.035) 1px 2px,rgba(60,60,255,.045) 2px 3px);
  transform:translateX(calc(var(--beat,0) * .8px));
  animation:crtFlicker 6s steps(1) infinite;
}
/* phosphor flare on the beat */
${T} .bg-grain::after{
  content:"";position:absolute;inset:0;background:var(--term);mix-blend-mode:screen;
  opacity:calc(var(--beat,0) * .035);
}
${T} .bg-grain::before{
  content:"";position:absolute;left:0;right:0;height:22vh;top:-25vh;
  background:linear-gradient(to bottom,transparent,rgba(255,255,255,.05) 50%,transparent);
  animation:crtRoll 11s linear infinite;
}
@keyframes crtRoll{to{top:125vh;}}
@keyframes crtFlicker{0%,100%{opacity:1;}47%{opacity:.985;}48%{opacity:1;}91%{opacity:.975;}92%{opacity:1;}}
${T} .site{text-shadow:0 0 1px color-mix(in srgb,var(--text) 40%,transparent);}
${T} :is(.hero__name,.section__title,.project__name,.contact__heading){
  color:var(--term);text-shadow:0 0 calc(12px + var(--beat,0) * 10px) color-mix(in srgb,var(--term) calc(45% + var(--beat,0) * 15%),transparent);
}
${T} .nav{background:color-mix(in srgb,var(--bg) 90%,transparent);border-bottom:1px solid var(--line);}
${T} .nav__brand{font-size:0;letter-spacing:0;}
${T} .nav__brand::before{content:"perfect@latesailor:~$";font-family:var(--font-body);font-size:14px;color:var(--term);}
${T} .nav__links a{text-transform:lowercase;font-size:14px;}
${T} .nav__links a::before{content:"./";color:var(--muted);}
${T} .theme-toggle,${T} .dock__tab,${T} .ldock__tab{border-radius:4px;}
${T} .hero{align-items:flex-start;}
${T} .hero__intro::before{content:"$ whoami";display:block;margin-bottom:12px;font-size:14px;color:var(--muted);}
${T} .hero__name{font-size:clamp(54px,8vw,112px);line-height:.9;letter-spacing:0;}
${T} .hero__photo{border:1px solid var(--line);border-radius:4px;box-shadow:0 0 44px -12px color-mix(in srgb,var(--term) 45%,transparent);}
${T} :is(.hero__role,.hero__proof,.hero__status){
  display:grid;grid-template-columns:8ch minmax(0,1fr);gap:0 1ch;align-items:start;
  margin:8px 0 0;max-width:none;font-size:15px;line-height:1.6;color:var(--text);
}
${T} .hero__role{margin-top:22px;}
${T} .hero__role::before{content:"role";color:var(--muted);}
${T} .hero__proof::before{content:"about";color:var(--muted);}
${T} .hero__status{color:var(--term);}
${T} .hero__status::before{content:"status";width:auto;height:auto;margin:0;background:none;box-shadow:none;border-radius:0;color:var(--muted);}
${T} .btn-primary{background:transparent;color:var(--term);border:1px solid var(--term);border-radius:3px;box-shadow:none;}
${T} .btn-primary::before{content:"[";}
${T} .btn-primary::after{content:"]";}
${T} .btn-primary:hover{background:var(--term);color:var(--on-accent);transform:none;opacity:1;}
${T} .section__title{font-size:clamp(42px,6vw,78px);text-transform:lowercase;}
${T} .section__title::before{content:"~/";color:var(--muted);text-shadow:none;}
${T} .project{border-top:1px dashed var(--line);}
${T} .project:first-child{border-top:none;}
${T} .project__name{font-size:clamp(38px,4vw,54px);line-height:1;}
${T} .project__name::before{content:"> ";color:var(--muted);text-shadow:none;}
${T} .bullets li::before{content:"*";width:auto;height:auto;top:0;background:none;color:var(--term);}
${T} .hl{color:var(--term);background:color-mix(in srgb,var(--term) 14%,transparent);}
${T} .project__stack li{background:transparent;border:1px solid var(--line);border-radius:3px;}
${T} .window{border-radius:6px;border:1px solid var(--line);box-shadow:0 0 60px -24px color-mix(in srgb,var(--term) 40%,transparent);}
${T} .window__bar{background:#0f120f;}
${T} .dot{background:var(--line);}
${T} .window__url{background:#070907;color:var(--muted);}
${T} .window__url::before{content:"$ curl ";color:var(--term);}
${T} .tech__row{border-top:1px dashed var(--line);}
${T} .tech__row:last-child{border-bottom:1px dashed var(--line);}
${T} .tech__label{color:var(--term);}
${T} .tech__label::before{content:"# ";color:var(--muted);}
${T} .chip{background:transparent;border:1px solid var(--line);border-radius:3px;}
${T} .chip__icon{background:#e9e9e2;border-radius:2px;}
${T} .tech.is-visible .chip:hover{border-color:var(--term);color:var(--term);}
${T} .chip[aria-expanded="true"]{background:color-mix(in srgb,var(--term) 16%,transparent);border-color:var(--term);}
${T} .contact{background:var(--surface);border:1px solid var(--line);border-radius:6px;box-shadow:none;text-align:left;}
${T} .contact__heading{font-size:clamp(42px,6vw,74px);}
${T} .contact__heading::before{content:"$ ";color:var(--muted);text-shadow:none;}
${T} .contact__actions{justify-content:flex-start;}
${T} .social{background:transparent;border:1px solid var(--line);border-radius:4px;color:var(--term);}
${T} .social:hover{background:var(--term);color:var(--on-accent);}
${T} .footer{border-top:1px dashed var(--line);}
${T} :is(.dock__panel,.ldock__menu,.theme-menu,.skill-bubble){border-radius:6px;}
@media (max-width:760px){
  ${T} .nav__brand::before{content:"~$";}
}

/* ================= CHAOS (stickers, tilt, and the skills got loose) ================= */
${C}{
  --ink:var(--text);--sticker:var(--surface);
  --edge:color-mix(in srgb,var(--text) 42%,transparent);
  --pop:color-mix(in srgb,var(--text) 18%,transparent);
  --pop-accent:color-mix(in srgb,var(--accent-fill) 55%,transparent);
  --r:14px;
}
${C} .site{overflow-x:clip;}
${C} :is(.nav,.hero,#projects,#tech,#contact,.footer){font-family:var(--font-body);}
${C} .font-swap{animation:fontSwap .45s var(--ease);}
@keyframes fontSwap{0%{scale:1;}35%{scale:1.012;rotate:.4deg;}100%{scale:1;}}
${C} .hero::before{display:none;}
/* stripes drift by exactly one period (62px along a -32deg axis), so the loop never snaps */
${C} .bg-dots{
  inset:-140px;animation:stripes 9s linear infinite;
  background-image:repeating-linear-gradient(-32deg,color-mix(in srgb,var(--accent-fill) 7%,transparent) 0 26px,transparent 26px 62px);
  background-size:auto;
}
@keyframes stripes{to{transform:translate(-32.85px,-52.58px);}}
${C} .bg-dots::after{display:none;}
${C} .nav{background:color-mix(in srgb,var(--bg) 86%,transparent);border-bottom:1.5px solid var(--edge);}
${C} .nav__brand{
  display:inline-block;padding:4px 10px;border-radius:8px;background:var(--accent-fill);color:var(--on-accent);
  rotate:-4deg;font-size:20px;
}
${C} .nav__links a{font-family:var(--font-display);font-size:16px;rotate:1.5deg;}
${C} .nav__links a:nth-child(2){rotate:-1.5deg;}
${C} .nav__links a::after{height:2px;background:var(--accent-fill);}
${C} .hero{
  position:relative;display:block;min-height:min(86vh,820px);
  padding-top:clamp(28px,6vw,72px);
}
${C} .hero__photo{
  position:absolute;right:clamp(8px,6vw,80px);top:clamp(24px,8vh,90px);
  width:clamp(150px,24vw,330px);aspect-ratio:1;
  border:8px solid var(--sticker);border-bottom-width:30px;border-radius:4px;
  box-shadow:0 14px 34px -14px color-mix(in srgb,var(--shadow) 45%,transparent),6px 8px 0 var(--pop);
  rotate:5deg;animation:sway 7s ease-in-out infinite alternate;
}
@keyframes sway{from{rotate:4deg;translate:0 0;}to{rotate:6.5deg;translate:0 -8px;}}
${C} .hero__intro{position:relative;}
${C} .hero__name{
  font-size:calc(clamp(44px,8.6vw,140px) * var(--font-scale,1));line-height:.95;letter-spacing:-.02em;
  margin:0 0 clamp(20px,3vw,40px) -.02em;
}
${C} .typed__ch{display:inline-block;animation:jitter 2s ease-in-out infinite alternate;animation-delay:calc(var(--i,0) * -.23s);}
${C} .typed__ch:nth-child(3n){color:var(--accent-fill);}
${C} .typed__ch:nth-child(2n){--dir:-1;}
@keyframes jitter{from{transform:translateY(0) rotate(calc(var(--dir,1) * -2.5deg));}to{transform:translateY(-4px) rotate(calc(var(--dir,1) * 3deg));}}
${C} :is(.hero__role,.hero__proof,.hero__status,.hero__resume-date){
  display:inline-block;margin:0;padding:9px 15px;background:var(--sticker);
  border:1.5px solid var(--edge);box-shadow:4px 4px 0 var(--pop);border-radius:var(--r);
}
${C} .hero__role{rotate:-2deg;font-family:var(--font-display);font-size:clamp(18px,2.4vw,28px);background:var(--accent-fill);color:var(--on-accent);border-color:transparent;box-shadow:4px 4px 0 var(--pop-accent);}
${C} .hero__proof{display:block;width:fit-content;max-width:22ch;margin-top:22px;rotate:1deg;font-family:var(--font-display);font-size:clamp(20px,2.6vw,32px);line-height:1.15;color:var(--ink);}
${C} .hero__status{display:inline-flex;align-items:center;gap:10px;margin-top:22px;rotate:-1deg;border-radius:999px;font-size:14px;}
${C} .hero__status::before{margin-top:0;}
${C} .hero__actions{margin-top:30px;rotate:-1deg;}
${C} .btn-primary{border:none;box-shadow:5px 5px 0 var(--pop-accent);transition:translate .15s var(--ease),box-shadow .15s var(--ease);}
${C} .btn-primary:hover{translate:2px 2px;box-shadow:3px 3px 0 var(--pop-accent);transform:none;opacity:1;}
${C} .hero__secondary{font-family:var(--font-display);font-size:18px;text-decoration-thickness:2px;}
${C} .hero__resume-date{margin-top:16px;rotate:1.5deg;font-size:12.5px;box-shadow:3px 3px 0 var(--pop);}
${C} .section__title{
  width:fit-content;font-size:calc(clamp(46px,8.5vw,120px) * var(--font-scale,1));line-height:.95;
  rotate:-2deg;transform-origin:left bottom;margin-left:.02em;
}
${C} .section__title::after{content:"!";color:var(--accent-fill);}
${C} .projects{gap:clamp(44px,6vw,68px);}
${C} .project,${C} .project:first-child{
  padding:clamp(18px,2.6vw,32px);border:1.5px solid var(--edge);border-radius:var(--r);background:var(--sticker);
  box-shadow:0 26px 50px -30px color-mix(in srgb,var(--shadow) 40%,transparent),8px 8px 0 var(--pop-accent);
  rotate:var(--tilt,0deg);
  transition:rotate .35s var(--ease),opacity .8s var(--ease),transform .8s var(--ease);
}
${C} .project:nth-child(1){--tilt:-1deg;}
${C} .project:nth-child(2){--tilt:.8deg;}
${C} .project:nth-child(3){--tilt:-.6deg;}
${C} .project:hover{rotate:0deg;}
${C} .project__name{font-size:calc(clamp(34px,4vw,54px) * var(--font-scale,1));line-height:1.05;}
${C} .project__summary{font-family:var(--font-display);font-size:19px;}
${C} .hl{background:var(--accent-fill);color:var(--on-accent);padding:.05em .35em;border-radius:5px;transform:skew(-6deg);display:inline-block;}
${C} .project__stack li{border:1.5px solid var(--edge);background:var(--bg);}
${C} .project__stack li:nth-child(odd){rotate:-1deg;}
${C} .project__stack li:nth-child(3n){rotate:1.2deg;}
${C} .project__demo{position:static;}
${C} .window{border:1.5px solid var(--edge);border-radius:12px;box-shadow:6px 6px 0 var(--pop);rotate:1.2deg;transition:rotate .35s var(--ease);}
${C} .project:hover .window{rotate:-.6deg;transform:none;box-shadow:6px 6px 0 var(--pop);}
${C} .window__bar{background:var(--accent-fill);border-bottom:1.5px solid var(--edge);}
${C} .dot{background:color-mix(in srgb,var(--on-accent) 70%,transparent);}
${C} .window__url{background:color-mix(in srgb,var(--on-accent) 22%,transparent);color:var(--on-accent);}
${C} .window__mode{border:1.5px solid color-mix(in srgb,var(--on-accent) 70%,transparent);color:var(--on-accent);}
${C} .window__mode:hover{background:color-mix(in srgb,var(--on-accent) 20%,transparent);color:var(--on-accent);}
${C} .window__mode[aria-pressed="true"]{background:var(--on-accent);border-color:var(--on-accent);color:var(--accent-fill);}
/* icon-only chips: the name stays for screen readers and the click bubble */
${C} .chip{
  width:48px;height:48px;min-height:0;padding:0;gap:0;justify-content:center;border-radius:50%;
}
${C} .chip__icon{width:30px;height:30px;background:transparent;box-shadow:none;}
${C} .chip__icon img{width:26px;height:26px;}
${C} .chip__fallback{font-size:19px;}
${C} .chip__name{
  position:absolute;width:1px;height:1px;margin:-1px;padding:0;
  overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;
}
/* the tech section is where the chips escaped from */
${C} .tech{min-height:40vh;}
${C} .tech__hint{font-family:var(--font-display);font-size:clamp(18px,2.4vw,26px);color:var(--ink);rotate:-1deg;width:fit-content;}
${C} .tech__hint::before{content:"The skills fell off the page. Throw one, or play a track and watch them jump. ";}
${C} .tech__rows{display:flex;flex-direction:row;flex-wrap:wrap;align-items:flex-start;gap:10px;}
${C} .tech__row,${C} .tech__row:last-child{display:contents;}
${C} .tech__label{display:none;}
${C} .tech__badges{display:contents;}
${C} .chip.is-flying{
  position:fixed;left:0;top:0;z-index:45;margin:0;
  opacity:1 !important;transition:none;cursor:grab;touch-action:none;user-select:none;
  border:1.5px solid var(--edge);background:var(--sticker);
  box-shadow:0 10px 24px -12px color-mix(in srgb,var(--shadow) 45%,transparent),3px 3px 0 var(--pop);
  will-change:transform;
}
${C} .chip.is-flying:active{cursor:grabbing;}
${C} .chip.is-flying:hover{box-shadow:0 10px 24px -12px color-mix(in srgb,var(--shadow) 45%,transparent),4px 4px 0 var(--pop-accent);border-color:var(--accent-fill);}
${C} .chip[aria-expanded="true"]{background:var(--accent-fill);color:var(--on-accent);border-color:transparent;}
${C} .contact{
  border:1.5px solid var(--edge);border-radius:var(--r);
  box-shadow:0 30px 60px -36px color-mix(in srgb,var(--shadow) 45%,transparent),10px 10px 0 var(--pop-accent);
  rotate:.6deg;background:var(--sticker);color:var(--ink);
}
${C} .contact__heading{rotate:-1.2deg;font-size:calc(clamp(36px,6vw,72px) * var(--font-scale,1));line-height:1.05;}
${C} .contact__email{font-family:var(--font-display);}
${C} .social{border:1.5px solid var(--edge);box-shadow:3px 3px 0 var(--pop);}
${C} .social:nth-child(odd){rotate:-4deg;}
${C} .social:nth-child(even){rotate:3deg;}
${C} .social:hover{rotate:0deg;transform:translateY(-4px);}
${C} .footer{border-top:1.5px solid var(--edge);}
${C} :is(.dock__tab,.ldock__tab,.theme-toggle){box-shadow:3px 3px 0 var(--pop);}
${C} :is(.dock__panel,.ldock__menu,.theme-menu,.skill-bubble){
  border:1.5px solid var(--edge);box-shadow:6px 6px 0 var(--pop);backdrop-filter:none;-webkit-backdrop-filter:none;background:var(--sticker);
}
${C} .skill-bubble::after{border-right:1.5px solid var(--edge);border-bottom:1.5px solid var(--edge);background:var(--sticker);}
@media (max-width:760px){
  ${C} .nav__links a{font-size:13px;rotate:0deg;white-space:nowrap;}
  ${C} .hero__photo{position:static;width:min(60%,260px);margin:0 0 26px 6px;}
  /* phones: no pile (it would bury the screen); the chips stay put and hop on the beat */
  ${C} .tech{min-height:0;}
  ${C} .tech__hint::before{content:"Play a track and watch the skills bounce. ";}
  ${C} .tech.is-visible .chip{
    border:1.5px solid var(--edge);box-shadow:3px 3px 0 var(--pop);
    transform:translateY(calc(var(--beat,0) * -9px)) rotate(calc(var(--beat,0) * 4deg));
    transition:transform .09s ease-out;
  }
  ${C} .tech.is-visible .chip:nth-child(2n){transform:translateY(calc(var(--beat,0) * -6px)) rotate(calc(var(--beat,0) * -3deg));}
  ${C} .hero__name{font-size:calc(clamp(40px,11.5vw,90px) * var(--font-scale,1));}
  ${C} .section__title{rotate:-1.5deg;}
  ${C} .project,${C} .project:first-child{box-shadow:6px 6px 0 var(--pop-accent);}
}
@media (prefers-reduced-motion:reduce){
  ${C} .bg-dots,${C} .hero__photo,${C} .typed__ch{animation:none !important;}
  ${C} .chip{position:static;}
}

@media (prefers-reduced-motion:reduce){
  .ldock__menu{animation:none !important;}
  .ldock__tab{transition:none !important;}
  ${T} .bg-grain,${T} .bg-grain::before{animation:none !important;}
}
`;
