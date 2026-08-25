// Assembles the .dc.html artboards for the task-tracker design canvas.
// Run: node build.mjs      (writes *.dc.html next to this file)
import { writeFileSync } from 'node:fs';

/* ---------------------------------------------------------------- theme */

const LIGHT = `
  --bg:#FBFAF7; --surface:#FFFFFF; --sunk:#F4F1EA;
  --border:#E7E3DA; --border-strong:#D4CEC1;
  --ink:#2E2A24; --muted:#7C756B; --faint:#A9A296;
  --accent:#2F6B5E; --accent-ink:#FFFFFF; --accent-soft:#E3EFEA;
  --overdue:#B3402C; --overdue-soft:#F8E8E4;
  --soon:#96660F; --soon-soft:#F8EFDC;
  --work:#4A6FB8; --home:#8B5FA8; --health:#2E8267; --errands:#A8722E; --admin:#5E7080;
  --shadow:0 1px 2px rgba(46,42,36,.05);
`;

const DARK = `
  --bg:#1C1A17; --surface:#26231F; --sunk:#211E1B;
  --border:#37332D; --border-strong:#4A443A;
  --ink:#EFEBE3; --muted:#A29A8E; --faint:#7C7469;
  --accent:#5AA792; --accent-ink:#12211D; --accent-soft:#22352F;
  --overdue:#E0725C; --overdue-soft:#392420;
  --soon:#D69B3F; --soon-soft:#33291A;
  --work:#7B9BDC; --home:#B189CE; --health:#57AC8C; --errands:#CE9A55; --admin:#8B9CAB;
  --shadow:0 1px 2px rgba(0,0,0,.28);
`;

const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&amp;family=Newsreader:opsz,wght@6..72,400;6..72,500&amp;display=swap">';

const BASE = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:'IBM Plex Sans',ui-sans-serif,system-ui,sans-serif;
  background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none} a:hover{color:var(--ink)}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
svg{display:block;flex:0 0 auto}

.screen{width:100%;min-height:100vh;display:flex;flex-direction:column;background:var(--bg)}
.hdr{padding:52px 20px 10px}
.hdr-row{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
.h1{font-family:'Newsreader',Georgia,'Times New Roman',serif;font-size:36px;line-height:1.02;
  font-weight:500;margin:0;letter-spacing:-.012em}
.sub{margin:7px 0 0;font-size:12.5px;color:var(--muted);letter-spacing:.012em}
.iconbtn{width:44px;height:44px;display:flex;align-items:center;justify-content:center;
  border-radius:9px;color:var(--muted);margin:0 -10px -8px 0}

.list{flex:1;display:flex;flex-direction:column;gap:9px;padding:14px 16px 20px}

.card{display:flex;gap:11px;padding:13px 14px;background:var(--surface);
  border:1px solid var(--border);border-radius:11px;box-shadow:var(--shadow)}
.chk{flex:0 0 auto;width:44px;height:44px;margin:-12px -11px -12px -12px;
  display:flex;align-items:center;justify-content:center}
.box{width:21px;height:21px;border:1.5px solid var(--border-strong);border-radius:6px;
  display:flex;align-items:center;justify-content:center;color:transparent}
.box.on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.cbody{flex:1;min-width:0;display:flex;flex-direction:column;gap:9px}
.ctitle{margin:0;font-size:15.5px;line-height:1.34;font-weight:500;letter-spacing:-.003em}
.ctitle.done{color:var(--faint);text-decoration:line-through;text-decoration-thickness:1px}
.meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.tag{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--muted);font-weight:500}
.dot{width:7px;height:7px;border-radius:50%}
.chip{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:500;
  padding:3px 7px;border-radius:6px;color:var(--muted);background:var(--sunk);
  border:1px solid var(--border);letter-spacing:.008em}
.chip.od{color:var(--overdue);background:var(--overdue-soft);border-color:transparent}
.chip.soon{color:var(--soon);background:var(--soon-soft);border-color:transparent}
.chip.prog{font-variant-numeric:tabular-nums}

.subs{display:flex;flex-direction:column;gap:2px;margin:2px 0 0;
  padding-top:10px;border-top:1px dashed var(--border)}
.subrow{display:flex;align-items:center;gap:9px;min-height:34px}
.sbox{width:16px;height:16px;border:1.5px solid var(--border-strong);border-radius:5px;
  display:flex;align-items:center;justify-content:center;color:transparent;flex:0 0 auto}
.sbox.on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.stext{font-size:13.5px;color:var(--ink);line-height:1.3}
.stext.done{color:var(--faint);text-decoration:line-through;text-decoration-thickness:1px}

.fab{position:absolute;right:18px;bottom:88px;width:56px;height:56px;border-radius:17px;
  background:var(--accent);color:var(--accent-ink);display:flex;align-items:center;
  justify-content:center;box-shadow:0 6px 18px rgba(47,107,94,.30)}
.tabs{display:flex;border-top:1px solid var(--border);background:var(--surface);
  padding:8px 8px 22px;gap:4px}
.tab{flex:1;min-height:48px;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:4px;color:var(--faint);font-size:11px;font-weight:500;border-radius:10px}
.tab.on{color:var(--accent)}

.secthead{display:flex;align-items:center;gap:8px;padding:14px 2px 2px;color:var(--muted);
  font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
.rule{flex:1;height:1px;background:var(--border)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:46px;
  padding:0 18px;border-radius:11px;font-size:14.5px;font-weight:600;
  background:var(--accent);color:var(--accent-ink)}
.btn.ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
`;

const ICON = {
  plus: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  check: (s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  sun: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  stack: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>`,
  search: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
  more: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
  back: (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
  chev: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  down: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  cal: (s = 17) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`,
  trash: (s = 17) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>`,
  sunrise: (s = 17) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v5M6.5 10.5L5 9M17.5 10.5L19 9M3 18h18M6 18a6 6 0 0 1 12 0"/></svg>`,
  panel: (s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M14.5 4v16"/></svg>`,
  drag: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>`,
};

/* ------------------------------------------------------------- fragments */

const tag = (name, v) => `<span class="tag"><span class="dot" style="background:var(--${v})"></span>${name}</span>`;

/** compact task card */
function card(t) {
  const bits = [];
  if (t.cat) bits.push(tag(t.cat.n, t.cat.v));
  if (t.od) bits.push(`<span class="chip od">${t.od}</span>`);
  else if (t.soon) bits.push(`<span class="chip soon">${t.soon}</span>`);
  else if (t.due) bits.push(`<span class="chip">${t.due}</span>`);
  if (t.prog) bits.push(`<span class="chip prog">${t.prog}</span>`);
  const subs = t.subs
    ? `<div class="subs">${t.subs.map(s => `<div class="subrow"><span class="sbox${s.d ? ' on' : ''}">${ICON.check(11)}</span><span class="stext${s.d ? ' done' : ''}">${s.t}</span></div>`).join('')}</div>`
    : '';
  return `<article class="card"${t.style ? ` style="${t.style}"` : ''}>
      <button class="chk" aria-label="Mark complete"><span class="box${t.done ? ' on' : ''}">${ICON.check(13)}</span></button>
      <div class="cbody">
        <p class="ctitle${t.done ? ' done' : ''}">${t.t}</p>
        ${bits.length ? `<div class="meta">${bits.join('')}</div>` : ''}
        ${subs}
      </div>
    </article>`;
}

const tabs = (active) => `<nav class="tabs">
    ${[['Today', ICON.sunrise(21)], ['All', ICON.stack(21)], ['Search', ICON.search(21)]]
      .map(([l, i]) => `<button class="tab${l === active ? ' on' : ''}">${i}<span>${l}</span></button>`).join('')}
  </nav>`;

/* ------------------------------------------------------------- artboards */

const T = {
  dentist: { t: 'Book dentist appointment', cat: { n: 'Health', v: 'health' }, od: '4 days overdue' },
  board:   { t: 'Draft Q3 board update', cat: { n: 'Work', v: 'work' }, soon: 'Due today', prog: '2/5' },
  tap:     { t: 'Fix the leaking kitchen tap', cat: { n: 'Home', v: 'home' }, due: 'Sat 30', prog: '1/3' },
  priya:   { t: 'Reply to Priya about the Lisbon trip' },
  car:     { t: 'Renew car insurance before it lapses', cat: { n: 'Admin', v: 'admin' }, due: 'Wed 27' },
  cleaning:{ t: 'Pick up dry cleaning', cat: { n: 'Errands', v: 'errands' } },
  pension: { t: 'Read the pension transfer paperwork', cat: { n: 'Admin', v: 'admin' }, due: 'Mon 1 Sep' },
  birthday:{ t: "Plan Mum's birthday dinner", cat: { n: 'Home', v: 'home' }, due: 'Fri 12 Sep', prog: '0/4' },
  bins:    { t: 'Put the recycling out', cat: { n: 'Home', v: 'home' }, soon: 'Due today' },
};

const todayScreen = `
<div class="screen" style="position:relative">
  <header class="hdr">
    <div class="hdr-row">
      <h1 class="h1">Today</h1>
      <button class="iconbtn">${ICON.more(20)}</button>
    </div>
    <p class="sub">5 tasks &middot; 1 overdue</p>
  </header>
  <div class="list">
    ${card(T.dentist)}
    ${card(T.board)}
    ${card(T.tap)}
    ${card(T.priya)}
    ${card(T.car)}
    <div class="secthead"><span>Completed today &middot; 2</span><span class="rule"></span>${ICON.down(15)}</div>
  </div>
  <button class="fab">${ICON.plus(25)}</button>
  ${tabs('Today')}
</div>`;

const allScreen = `
<div class="screen">
  <header class="hdr" style="padding-bottom:6px">
    <div class="hdr-row">
      <h1 class="h1">3 selected</h1>
      <button class="iconbtn" style="font-size:14.5px;font-weight:600;width:auto;color:var(--accent)">Cancel</button>
    </div>
    <p class="sub">Tap tasks to add them to Today</p>
  </header>

  <div style="display:flex;gap:7px;padding:12px 16px 2px;overflow:hidden">
    ${[['All', 1], ['Work', 0], ['Home', 0], ['Health', 0], ['Admin', 0]].map(([l, on]) => `
      <span style="flex:0 0 auto;padding:7px 13px;border-radius:999px;font-size:12.5px;font-weight:500;
        ${on ? 'background:var(--ink);color:var(--bg);' : 'background:var(--surface);color:var(--muted);border:1px solid var(--border);'}">${l}</span>`).join('')}
  </div>

  <div class="list" style="padding-bottom:12px">
    ${[[T.board, 1], [T.tap, 1], [T.cleaning, 0], [T.pension, 1], [T.birthday, 0], [T.bins, 0]].map(([t, sel]) => {
      const c = card(t).replace(
        /<button class="chk"[\s\S]*?<\/button>/,
        `<button class="chk" aria-label="Select"><span style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          ${sel ? 'background:var(--accent);color:var(--accent-ink);border:1.5px solid var(--accent);' : 'border:1.5px solid var(--border-strong);color:transparent;'}">${ICON.check(13)}</span></button>`
      );
      return sel ? c.replace('<article class="card"', '<article class="card" style="border-color:var(--accent);background:var(--accent-soft)"') : c;
    }).join('')}
  </div>

  <div style="padding:12px 16px 26px;border-top:1px solid var(--border);background:var(--surface);display:flex;gap:10px">
    <button class="btn ghost" style="flex:0 0 auto">Clear</button>
    <button class="btn" style="flex:1">${ICON.sunrise(18)} Add 3 to Today</button>
  </div>
</div>`;

const detailScreen = `
<div class="screen">
  <header style="display:flex;align-items:center;justify-content:space-between;padding:46px 8px 4px">
    <button class="iconbtn" style="margin:0">${ICON.back(22)}</button>
    <div style="display:flex;gap:2px">
      <button class="iconbtn" style="margin:0;color:var(--accent);background:var(--accent-soft)">${ICON.sunrise(19)}</button>
      <button class="iconbtn" style="margin:0">${ICON.more(20)}</button>
    </div>
  </header>

  <div style="flex:1;display:flex;flex-direction:column;gap:20px;padding:10px 20px 24px">

    <div>
      <div style="font-family:'Newsreader',Georgia,serif;font-size:27px;line-height:1.2;font-weight:500;letter-spacing:-.01em">Fix the leaking kitchen tap</div>
      <div style="display:flex;justify-content:space-between;margin-top:9px;font-size:11.5px;color:var(--faint)">
        <span>Title</span><span style="font-variant-numeric:tabular-nums">27 / 100</span>
      </div>
      <div style="height:1px;background:var(--border);margin-top:5px"></div>
    </div>

    <div>
      <div style="font-size:14.5px;line-height:1.55;color:var(--muted)">Washer has probably gone. Stopcock is under the stairs, not the sink. Take the old washer to the shop so the size matches.</div>
      <div style="display:flex;justify-content:space-between;margin-top:9px;font-size:11.5px;color:var(--faint)">
        <span>Description</span><span style="font-variant-numeric:tabular-nums">134 / 500</span>
      </div>
      <div style="height:1px;background:var(--border);margin-top:5px"></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:11px;overflow:hidden">
      ${[
        [ICON.cal(17), 'Deadline', '<span style="color:var(--ink);font-weight:500">Sat 30 Aug</span>'],
        [`<span class="dot" style="background:var(--home);width:9px;height:9px"></span>`, 'Category', '<span style="color:var(--ink);font-weight:500">Home</span>'],
      ].map(([i, l, v]) => `
        <div style="display:flex;align-items:center;gap:11px;min-height:52px;padding:0 14px;background:var(--surface)">
          <span style="color:var(--faint);display:flex">${i}</span>
          <span style="flex:1;font-size:14.5px;color:var(--muted)">${l}</span>
          <span style="font-size:14.5px">${v}</span>${ICON.chev(15)}
        </div>`).join('')}
      <div style="display:flex;align-items:center;gap:11px;min-height:52px;padding:0 14px;background:var(--surface)">
        <span style="color:var(--accent);display:flex">${ICON.sunrise(17)}</span>
        <span style="flex:1;font-size:14.5px;color:var(--muted)">On Today</span>
        <span style="width:46px;height:27px;border-radius:999px;background:var(--accent);display:flex;align-items:center;justify-content:flex-end;padding:3px">
          <span style="width:21px;height:21px;border-radius:50%;background:var(--accent-ink)"></span></span>
      </div>
    </div>

    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
        <span style="font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)">Sub-tasks</span>
        <span style="flex:1;height:4px;border-radius:2px;background:var(--sunk);overflow:hidden;display:block">
          <span style="display:block;width:33%;height:100%;background:var(--accent)"></span></span>
        <span style="font-size:12px;font-weight:600;color:var(--muted);font-variant-numeric:tabular-nums">1/3</span>
      </div>
      <div style="border:1px solid var(--border);border-radius:11px;background:var(--surface);overflow:hidden">
        ${[['Turn off the stopcock', 1], ['Buy replacement washers &mdash; 28&thinsp;mm', 0], ['Test for drips overnight', 0]].map(([t, d], i) => `
          <div style="display:flex;align-items:center;gap:11px;min-height:48px;padding:0 13px;${i ? 'border-top:1px solid var(--border);' : ''}">
            <span class="sbox${d ? ' on' : ''}" style="width:19px;height:19px">${ICON.check(12)}</span>
            <span class="stext${d ? ' done' : ''}" style="flex:1;font-size:14.5px">${t}</span>
            <span style="color:var(--faint)">${ICON.drag(15)}</span>
          </div>`).join('')}
        <div style="display:flex;align-items:center;gap:11px;min-height:48px;padding:0 13px;border-top:1px solid var(--border);color:var(--accent)">
          ${ICON.plus(17)}<span style="font-size:14.5px;font-weight:500">Add sub-task</span>
        </div>
      </div>
    </div>

    <button style="display:flex;align-items:center;gap:8px;min-height:44px;color:var(--overdue);font-size:14px;font-weight:500">
      ${ICON.trash(17)} Delete task
    </button>
  </div>
</div>`;

/* -------- card states sheet (light + dark side by side in one artboard) */

const stateRows = [
  ['Compact &mdash; the default', card({ t: 'Pick up dry cleaning', cat: { n: 'Errands', v: 'errands' }, due: 'Thu 28' })],
  ['With sub-task progress', card(T.board)],
  ['Expanded &mdash; sub-tasks on the card', card({ ...T.tap, subs: [
    { t: 'Turn off the stopcock', d: 1 },
    { t: 'Buy replacement washers', d: 0 },
    { t: 'Test for drips overnight', d: 0 }] })],
  ['Overdue', card(T.dentist)],
  ['Completed &mdash; in the Done section', card({ t: 'Send the meter reading', cat: { n: 'Admin', v: 'admin' }, done: 1 })],
];

const cardSheet = (label) => `
<div style="padding:26px 24px 30px;display:flex;flex-direction:column;gap:16px;background:var(--bg);min-height:100vh">
  <div style="font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--faint)">${label}</div>
  ${stateRows.map(([l, c]) => `
    <div style="display:flex;flex-direction:column;gap:7px">
      <div style="font-size:11.5px;color:var(--muted);font-weight:500">${l}</div>
      ${c}
    </div>`).join('')}
</div>`;

const cardStates = `
<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));min-height:100vh">
  <div style="${LIGHT}">${cardSheet('Light')}</div>
  <div style="${DARK};border-left:1px solid #37332D">${cardSheet('Dark')}</div>
</div>`;

/* ------------------------------------------------------------- desktop */

/* ------------------------------------------------------------- desktop */

const deskCats = [['Work', 'work', 8], ['Home', 'home', 6], ['Health', 'health', 2], ['Errands', 'errands', 4], ['Admin', 'admin', 3]];

const deskSidebar = `
  <aside style="border-right:1px solid var(--border);padding:26px 14px;display:flex;flex-direction:column;gap:26px;background:var(--sunk)">
    <div style="font-family:'Newsreader',Georgia,serif;font-size:23px;font-weight:500;padding:0 10px;letter-spacing:-.01em">Tasks</div>

    <div style="display:flex;flex-direction:column;gap:2px">
      ${[[ICON.sunrise(18), 'Today', 5, 1], [ICON.stack(18), 'All tasks', 23, 0], [ICON.search(18), 'Search', '', 0]].map(([i, l, n, on]) => `
        <div style="display:flex;align-items:center;gap:11px;min-height:38px;padding:0 10px;border-radius:8px;font-size:14px;font-weight:500;
          ${on ? 'background:var(--accent);color:var(--accent-ink);' : 'color:var(--muted);'}">
          ${i}<span style="flex:1">${l}</span>
          <span style="font-size:12px;font-variant-numeric:tabular-nums;opacity:.75">${n}</span></div>`).join('')}
    </div>

    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);padding:0 10px 7px">Categories</div>
      ${deskCats.map(([n, v, c]) => `
        <div style="display:flex;align-items:center;gap:11px;min-height:34px;padding:0 10px;border-radius:8px;font-size:13.5px;color:var(--muted)">
          <span class="dot" style="background:var(--${v})"></span><span style="flex:1">${n}</span>
          <span style="font-size:12px;font-variant-numeric:tabular-nums;opacity:.7">${c}</span></div>`).join('')}
      <div style="display:flex;align-items:center;gap:11px;min-height:34px;padding:0 10px;color:var(--faint);font-size:13.5px">
        ${ICON.plus(15)}<span>New category</span></div>
    </div>

    <div style="margin-top:auto;display:flex;flex-direction:column;gap:2px">
      ${[['Completed'], ['Export JSON'], ['Appearance']].map(([l]) => `
        <div style="min-height:32px;display:flex;align-items:center;padding:0 10px;font-size:13px;color:var(--faint)">${l}</div>`).join('')}
    </div>
  </aside>`;

/** middle column: the Today list. selected = highlight the open task */
const deskTodayCol = (selected) => `
  <section style="border-right:1px solid var(--border);display:flex;flex-direction:column;min-width:0">
    <div style="padding:26px 22px 14px;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px">
        <div>
          <div style="font-family:'Newsreader',Georgia,serif;font-size:29px;font-weight:500;letter-spacing:-.012em">Today</div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:5px">5 tasks &middot; 1 overdue</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border:1px solid var(--border);border-radius:8px;font-size:12.5px;color:var(--muted)">Manual ${ICON.down(13)}</span>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border:1px solid var(--border);border-radius:8px;color:var(--muted)">${ICON.plus(16)}</span>
        </div>
      </div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:8px;padding:14px 18px;overflow:hidden">
      ${card(T.dentist)}
      ${card(selected ? { ...T.board, style: 'border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)' } : T.board)}
      ${card(T.tap)}
      ${card(T.priya)}
      ${card(T.car)}
      <div class="secthead"><span>Completed today &middot; 2</span><span class="rule"></span>${ICON.down(15)}</div>
    </div>
  </section>`;


/** always-visible keyboard legend, bottom right */
const legend = `
    <div style="position:absolute;right:20px;bottom:18px;display:flex;align-items:center;gap:11px;
      padding:8px 13px;border-radius:9px;background:var(--surface);border:1px solid var(--border);
      box-shadow:var(--shadow);font-size:11.5px;color:var(--faint)">
      ${[['N', 'new'], ['/', 'search'], ['J K', 'move'], ['X', 'done'], ['T', 'today'], ['\\', 'panel']].map(([k, l]) => `
        <span style="display:inline-flex;align-items:center;gap:5px">
          <kbd style="font-family:inherit;font-size:10.5px;font-weight:600;padding:2px 5px;border-radius:4px;background:var(--sunk);border:1px solid var(--border);color:var(--muted)">${k}</kbd>${l}</span>`).join('')}
      <span style="width:1px;height:13px;background:var(--border)"></span>
      <kbd style="font-family:inherit;font-size:10.5px;font-weight:600;padding:2px 6px;border-radius:4px;background:var(--sunk);border:1px solid var(--border);color:var(--muted)">?</kbd>
    </div>`;

/** right column, state 1: the task detail pane */
const deskDetail = `
  <section style="display:flex;flex-direction:column;min-width:0;position:relative">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 26px;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--muted)">
          ${ICON.panel(15)} Hide
          <kbd style="font-family:inherit;font-size:10px;font-weight:600;padding:1px 4px;border-radius:3px;background:var(--sunk);border:1px solid var(--border)">\\</kbd></span>
        <span style="display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:9px;background:var(--accent-soft);color:var(--accent);font-size:13px;font-weight:600">${ICON.sunrise(16)} On Today</span>
      </div>
      <div style="display:flex;gap:14px;color:var(--faint)">${ICON.cal(18)}${ICON.trash(18)}${ICON.more(18)}</div>
    </div>

    <div style="flex:1;padding:30px 26px;display:flex;flex-direction:column;gap:26px;max-width:640px">
      <div>
        <div style="font-family:'Newsreader',Georgia,serif;font-size:33px;line-height:1.15;font-weight:500;letter-spacing:-.014em">Draft Q3 board update</div>
        <div style="display:flex;justify-content:space-between;margin-top:11px;font-size:11.5px;color:var(--faint)"><span>Title</span><span style="font-variant-numeric:tabular-nums">21 / 100</span></div>
        <div style="height:1px;background:var(--border);margin-top:5px"></div>
      </div>

      <div>
        <div style="font-size:14.5px;line-height:1.6;color:var(--muted)">Pull the revenue and headcount numbers from the July close, then draft the narrative. Rakesh wants the risk register as an appendix rather than in the body this time.</div>
        <div style="display:flex;justify-content:space-between;margin-top:11px;font-size:11.5px;color:var(--faint)"><span>Description</span><span style="font-variant-numeric:tabular-nums">163 / 500</span></div>
        <div style="height:1px;background:var(--border);margin-top:5px"></div>
      </div>

      <div style="display:flex;gap:10px">
        <span style="display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border:1px solid var(--border);border-radius:9px;font-size:13.5px;background:var(--surface)">
          <span class="dot" style="background:var(--work)"></span>Work${ICON.down(13)}</span>
        <span style="display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border:1px solid transparent;border-radius:9px;font-size:13.5px;background:var(--soon-soft);color:var(--soon);font-weight:500">
          ${ICON.cal(15)}Due today &middot; Mon 25 Aug</span>
      </div>

      <div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:11px">
          <span style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Sub-tasks</span>
          <span style="flex:1;height:4px;border-radius:2px;background:var(--sunk);display:block;overflow:hidden">
            <span style="display:block;width:40%;height:100%;background:var(--accent)"></span></span>
          <span style="font-size:12px;font-weight:600;color:var(--muted);font-variant-numeric:tabular-nums">2/5</span>
        </div>
        <div style="border:1px solid var(--border);border-radius:11px;background:var(--surface);overflow:hidden">
          ${[['Pull July revenue actuals', 1], ['Pull headcount by function', 1], ['Draft the narrative section', 0], ['Rebuild the risk register appendix', 0], ['Send to Rakesh for comment', 0]].map(([t, d], i) => `
            <div style="display:flex;align-items:center;gap:12px;min-height:42px;padding:0 14px;${i ? 'border-top:1px solid var(--border);' : ''}">
              <span class="sbox${d ? ' on' : ''}" style="width:18px;height:18px">${ICON.check(12)}</span>
              <span class="stext${d ? ' done' : ''}" style="flex:1;font-size:14px">${t}</span>
              <span style="color:var(--faint)">${ICON.drag(14)}</span></div>`).join('')}
          <div style="display:flex;align-items:center;gap:12px;min-height:42px;padding:0 14px;border-top:1px solid var(--border);color:var(--accent)">
            ${ICON.plus(16)}<span style="font-size:14px;font-weight:500">Add sub-task</span></div>
        </div>
      </div>
    </div>
    ${legend}
  </section>`;

/* right column, state 2: detail hidden -> the backlog fills the space,
   two columns, flowing top-down, scrolling vertically. */

const BACKLOG = [
  { t: 'Chase the invoice from Meridian', cat: { n: 'Work', v: 'work' }, od: '2 days overdue' },
  { t: 'Put the recycling out', cat: { n: 'Home', v: 'home' }, soon: 'Due today' },
  { t: 'Read the pension transfer paperwork', cat: { n: 'Admin', v: 'admin' }, due: 'Mon 1 Sep' },
  { t: 'Write up the retro notes', cat: { n: 'Work', v: 'work' }, due: 'Wed 3 Sep', prog: '3/6' },
  { t: 'Update the emergency contacts form', cat: { n: 'Admin', v: 'admin' }, due: 'Thu 4 Sep' },
  { t: 'Pick up dry cleaning', cat: { n: 'Errands', v: 'errands' } },
  { t: "Plan Mum's birthday dinner", cat: { n: 'Home', v: 'home' }, due: 'Fri 12 Sep', prog: '0/4' },
  { t: 'Book the car in for its service', cat: { n: 'Errands', v: 'errands' }, due: 'Tue 16 Sep' },
  { t: 'Cancel the old gym membership', cat: { n: 'Admin', v: 'admin' } },
  { t: 'Draft the Lisbon itinerary' },
  { t: 'Sort the boxes in the loft', cat: { n: 'Home', v: 'home' } },
  { t: 'Order more coffee', cat: { n: 'Errands', v: 'errands' } },
  { t: 'Reschedule the physio session', cat: { n: 'Health', v: 'health' }, due: 'Fri 5 Sep' },
  { t: 'Review the Meridian contract redlines', cat: { n: 'Work', v: 'work' }, due: 'Mon 8 Sep', prog: '0/3' },
  { t: 'Replace the smoke alarm batteries', cat: { n: 'Home', v: 'home' } },
  { t: 'Send Dad the photos from the weekend' },
];

/** backlog card = compact card plus a hover affordance to lift it into Today */
const backlogCard = (t, hover) => card(t).replace(
  '</div>\n    </article>',
  `</div>
      <span style="flex:0 0 auto;width:30px;height:30px;margin:-4px -5px 0 0;border-radius:8px;display:flex;align-items:center;justify-content:center;
        ${hover ? 'background:var(--accent);color:var(--accent-ink);' : 'color:var(--border-strong);'}">${ICON.sunrise(16)}</span>
    </article>`
);

const deskBacklog = `
  <section style="display:flex;flex-direction:column;min-width:0;position:relative;overflow:hidden">
    <div style="padding:26px 24px 14px;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px">
        <div>
          <div style="font-family:'Newsreader',Georgia,serif;font-size:29px;font-weight:500;letter-spacing:-.012em">Everything else</div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:5px">16 tasks not on Today &middot; 1 overdue</div>
        </div>
        <span style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid var(--border);border-radius:8px;font-size:12.5px;color:var(--muted)">
          ${ICON.panel(15)} Show detail
          <kbd style="font-family:inherit;font-size:10px;font-weight:600;padding:1px 4px;border-radius:3px;background:var(--sunk);border:1px solid var(--border)">\\</kbd></span>
      </div>
      <div style="display:flex;gap:7px;margin-top:14px">
        ${[['All', 1], ['Work', 0], ['Home', 0], ['Health', 0], ['Errands', 0], ['Admin', 0]].map(([l, on]) => `
          <span style="padding:5px 12px;border-radius:999px;font-size:12px;font-weight:500;
            ${on ? 'background:var(--ink);color:var(--bg);' : 'background:var(--surface);color:var(--muted);border:1px solid var(--border);'}">${l}</span>`).join('')}
      </div>
    </div>
    <div style="flex:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;align-content:start;padding:14px 24px 14px 18px">
      ${BACKLOG.map((t, i) => backlogCard(t, i === 3)).join('')}
    </div>
    ${legend}
  </section>`;

const deskGrid = (right, selected) => `
<div style="display:grid;grid-template-columns:258px 428px minmax(0,1fr);min-height:100vh;background:var(--bg)">
  ${deskSidebar}
  ${deskTodayCol(selected)}
  ${right}
</div>`;

const desktop = deskGrid(deskDetail, true);
const desktopPlanning = deskGrid(deskBacklog, false);
/* ----------------------------------------------------------- assemble */

function page({ theme = LIGHT, extraCSS = '', body }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${FONTS}
  <style>
:root{${theme}}
${BASE}${extraCSS}
  </style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;
}


const OUT = {
  'Main.dc.html':            page({ body: todayScreen }),
  'AllList.dc.html':         page({ body: allScreen }),
  'TaskDetail.dc.html':      page({ body: detailScreen }),
  'TodayDark.dc.html':       page({ theme: DARK, body: todayScreen }),
  'CardStates.dc.html':      page({ body: cardStates }),
  'Desktop.dc.html':         page({ body: desktop }),
  'DesktopPlanning.dc.html': page({ body: desktopPlanning }),
  'DesktopDark.dc.html':     page({ theme: DARK, body: desktopPlanning }),
};

for (const [name, html] of Object.entries(OUT)) {
  writeFileSync(new URL(name, import.meta.url), html);
  console.log('wrote', name, html.length, 'bytes');
}
