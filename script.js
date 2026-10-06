/* ═══════════════════════════════════════════════════════
   R.A.D. ONLINE QUIZ 1 · script.js
   Base: Math Module 1 Review (login, read-aloud, timers,
   resume, teacher review) + A World Without Rules Test v2
   (written response screen, story panel, test lock).
   One unit quiz: 23 MC (scored) then 3 written R.A.D.
   answers (teacher-graded), with a story panel.
   Sheet game:  rad_quiz1  ·  Written tab: rad_quiz1_written
   Test rules: one attempt; retake needs Teacher PIN and
   gets a new session ID labeled "R.A.D. Online Quiz 1 — Retake".
   PIN: 9377 (Teacher override)
═══════════════════════════════════════════════════════ */

/* ── CONFIG ─────────────────────────────────────────── */
const QUIZ_OPEN     = false;   // false = students locked out; only Teacher Access works. Set true to open.
const INSTRUCT_SECS = 20;
const READ_SECS     = 12;
const MIN_WORDS     = 10;
const STORAGE_KEY   = 'radq1_session_v1';
const SCORES_KEY    = 'radq1_scores_v1';
const WRITTEN_KEY   = 'radq1_written_v1';
const DRAFT_KEY     = 'radq1_written_draft_v1';
const RETAKE_KEY    = 'radq1_retake_v1';

const QUIZ_LABEL   = 'R.A.D. Online Quiz 1';
const GAME         = 'rad_quiz1';
const WRITTEN_GAME = 'rad_quiz1_written';
function newSessionId() { return 'RADQ1-' + Math.random().toString(36).slice(2, 9).toUpperCase(); }

/* ── SHEET SUBMISSION ───────────────────────────────── */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzv8CWv1yyi8NeH04now9UxVL4IZm5yMqqsEGMcgGdrcAOWVB-aSp5siTvSSJXIUpzFMA/exec';

let tabSwitchCount = 0;

function formLabel() {
  return QUIZ_LABEL + (app.isRetake ? ' — Retake' : '');
}

function postScore(done) {
  const total = app.currentBank.length;
  const pct   = total ? Math.round((app.score / total) * 100) : 0;
  fetch(SHEET_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:    'submit',
      game:      GAME,
      sessionId: app.sessionId,
      name:      app.studentName || 'Unknown',
      form:      formLabel(),
      score:     app.score,
      total,
      percent:   pct,
      status:    done ? 'Complete' : `In Progress (Q${app.currentIndex + 1}/${total})`,
      done,
      elapsed:        app.timerSeconds,
      tabSwitches:    tabSwitchCount,
      minSecs:        150,
      wrongQuestions: (app.missedQuestions || []).map(missEntry).join(' | '),
      startedAt:      app.startedAt || '',
      finishedAt:     app.finishedAt || '',
      events:         JSON.stringify(app.events || []),
      timestamp:      new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    })
  }).catch(() => {});
}
/* One saved miss: "[ID] (Skill) question (picked: answer)" — the standard every
   review uses. Skill comes from data/skills.js by question id, so misses restored
   from an older saved attempt still get tagged. " | " separates entries, so it is
   swapped out of the pick just in case. */
function missEntry(m) {
  const skill  = m.skill || (window.SKILLS || {})[m.id] || 'Unsorted';
  const picked = m.yourAnswer == null || m.yourAnswer === '' ? '' :
    ` (picked: ${String(m.yourAnswer).replace(/\s*\|\s*/g, ' / ').replace(/\s+/g, ' ').trim()})`;
  return `[${m.id}] (${skill}) ${m.q}${picked}`;
}

function submitScorePartial() { postScore(false); }
function submitScoreFinal()   { postScore(true); }

function submitWrittenToSheet(w1, w2, w3, elapsedSeconds) {
  const elapsedStr = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`;
  fetch(SHEET_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:    'written',
      game:      WRITTEN_GAME,
      sessionId: app.sessionId + '-written',
      name:      app.studentName || 'Unknown',
      w1, w2, w3,
      elapsed:   elapsedStr,
      // no startedAt/finishedAt/events here: the written sheet is a fixed
      // 7-column shape and handleWritten ignores extra keys. The chronology
      // for this attempt rides on the quiz row, which shares app.events.
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    })
  }).catch(() => {});
}

/* ── ROSTER ─────────────────────────────────────────── */
const ROSTER = [
  { name: "Mr. O (Teacher)",           id: "9377" },
  { name: "Avery, Jo'Von",             id: "10053632" },
  { name: "Belasquez Bonilla, Eduin",  id: "10058674" },
  { name: "Castaneda, Kelvin",         id: "10053248" },
  { name: "Chicas-Santos, Allison",    id: "10066737" },
  { name: "Collado, Roniel",           id: "10060249" },
  { name: "Dejesus, Michael",          id: "10049434" },
  { name: "Dock, Fakeem",              id: "10059720" },
  { name: "Douglas, Iyana",            id: "10070980" },
  { name: "Dumphrey, Christopher",     id: "10060696" },
  { name: "Flores, Kiara",             id: "10052834" },
  { name: "Johnson, Destiny",          id: "10052926" },
  { name: "Jones, Tahji",              id: "10060315" },
  { name: "Lawrence, Eric",            id: "10057451" },
  { name: "Madero, Jovany",            id: "10076374" },
  { name: "Pettway, Lanaura",          id: "10060616" },
  { name: "Polanco Soriano, Thiara",   id: "10060503" },
  { name: "Roberts, Robyn",            id: "10060925" },
  { name: "Rojas, Alanie",             id: "10076388" },
  { name: "Sanchez Rodriguez, Johanelyz", id: "10076767" },
  { name: "Vega, Taishmara",           id: "10054043" },
  { name: "Watts, Autumn",             id: "10039032" },
  { name: "Zelaya-Osorto, Nazareth",   id: "10053626" }
];

const GUEST_SLOTS = {
  '937701': 'Guest 1', '937702': 'Guest 2', '937703': 'Guest 3',
  '937704': 'Guest 4', '937705': 'Guest 5', '937706': 'Guest 6',
  '937707': 'Guest 7', '937708': 'Guest 8', '937709': 'Guest 9',
  '937710': 'Guest 10'
};

/* ── BUILD DROPDOWN ─────────────────────────────────── */
(function buildRoster() {
  const sel = document.getElementById('name-select');
  ROSTER.forEach(s => {
    const o = document.createElement('option');
    o.value = s.name; o.textContent = s.name;
    sel.appendChild(o);
  });
  const div = document.createElement('option');
  div.disabled = true; div.textContent = '── Guest Slots ──';
  sel.appendChild(div);
  Object.entries(GUEST_SLOTS).forEach(([code, label]) => {
    const o = document.createElement('option');
    o.value = `GUEST:${code}`; o.textContent = `🙋 ${label}`;
    sel.appendChild(o);
  });
})();

/* ── STATE ──────────────────────────────────────────── */
let pinModalCallback = null;
let activeSpeakBtn   = null;
let reviewMode       = false;
let reviewAutoRun    = false;

/* ── STORAGE HELPERS ────────────────────────────────── */
function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch (e) { return fallback; }
}

function getMcRecord(name) {
  return readJSON(SCORES_KEY, []).find(s => s.name === name && s.done) || null;
}
function hasWritten(name) {
  return readJSON(WRITTEN_KEY, []).some(w => w.name === name);
}
function isRetake(name) {
  return readJSON(RETAKE_KEY, []).includes(name);
}
function quizStatus(name) {
  if (!getMcRecord(name)) return 'new';
  if (!hasWritten(name))  return 'written';
  return 'done';
}

function applyQuizLock(name) {
  const btn    = document.getElementById('btn-start-quiz');
  const sub    = btn.querySelector('.form-btn-sub');
  const status = quizStatus(name);
  btn.classList.toggle('done-lock', status === 'done');
  if (status === 'new')          sub.textContent = '23 questions + 3 written answers';
  else if (status === 'written') sub.textContent = '✍️ Written answers next';
  else {
    const rec = getMcRecord(name);
    sub.textContent = `✅ Complete · ${rec.score}/${rec.total} · 🔒 Teacher PIN to retake`;
  }
}

/* ── LETTER GRADE ───────────────────────────────────── */
function letterGrade(pct) {
  if (pct >= 97) return 'A+';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

/* ── HELPERS ────────────────────────────────────────── */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function getFirstName(name) {
  if (!name) return 'Student';
  if (name.includes(' - ')) return name.split(' - ').pop().trim();
  const parts = name.split(',');
  return parts.length > 1 ? parts[1].trim().split(' ')[0] : name.split(' ')[0];
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

let hlTimer = null;
function stopActiveSpeech() {
  clearTimeout(hlTimer);
  window.speechSynthesis.cancel();
  document.querySelectorAll('.wrd.hl').forEach(e => e.classList.remove('hl'));
  if (activeSpeakBtn) { activeSpeakBtn.textContent = '🔊'; activeSpeakBtn = null; }
}

/* ── HIGHLIGHT FALLBACK ─────────────────────────────
   Some voices never fire word-boundary events. If none
   arrives shortly after speaking starts, step through the
   words on a timer paced by word length and speech rate. */
function addHighlightFallback(u, spans) {
  let fired = false, i = 0;
  const prevB = u.onboundary, prevE = u.onend;
  u.onboundary = e => { if (e.name === 'word' && !fired) { fired = true; clearTimeout(hlTimer); } if (prevB) prevB(e); };
  u.onend = e => { clearTimeout(hlTimer); spans.forEach(s => s.classList.remove('hl')); if (prevE) prevE(e); };
  const step = () => {
    if (fired) return;
    spans.forEach(s => s.classList.remove('hl'));
    if (i >= spans.length) return;
    const w = spans[i++];
    w.classList.add('hl');
    const len = (w.textContent || '').replace(/[^A-Za-z0-9]/g, '').length;
    hlTimer = setTimeout(step, Math.max(280, len * 70 + 120) / (u.rate || 1));
  };
  clearTimeout(hlTimer);
  hlTimer = setTimeout(step, 500);
}

/* ── READ-ALOUD INTRO SPEAKS ITSELF ─────────────────
   Marcos 10/6: the "Read Aloud is Available!" screen announces itself
   the moment it opens — no reading, no button. The click on "Let's Get
   Started!" is the user gesture the browser needs. The icons are said
   as words, and each word lights up as it is read. Leaving the screen
   (app.show) cancels the speech. */
const INTRO_SAY = { '🔊': 'the speaker button', '⏹': 'the stop button', '—': ',' };
const INTRO_RATE = 0.82;   // Marcos 10/6: 0.92 ran ahead of the highlight
let introToken = 0, introTimer = null;
let introMsPerChar = null, introMsPerWord = null;   // learned from this device's voice
function speakReadAloudIntro() {
  stopActiveSpeech();
  clearTimeout(introTimer);
  const screen = document.getElementById('readaloud-screen');
  const els = Array.from(screen.querySelectorAll('.ra-read'));
  els.forEach(el => { if (!el.querySelector('.wrd')) el.innerHTML = wrapWords(el.innerHTML); });
  // One piece per SENTENCE (Marcos 10/6: the end of a long sentence lost its
  // highlight). Each piece = the words to say + the on-screen word each one lights.
  const pieces = [];
  els.forEach(el => {
    let words = [], wordSpan = [];
    const flush = () => { if (words.length) pieces.push({ words, wordSpan }); words = []; wordSpan = []; };
    el.querySelectorAll('.wrd').forEach(sp => {
      const t = sp.textContent.replace(/\uFE0F/g, '').trim();
      const key = t.replace(/[.!?,]+$/, ''), punct = t.slice(key.length);   // "🔊." → icon + "."
      let say = INTRO_SAY[key] != null ? INTRO_SAY[key] + punct : (/[A-Za-z0-9]/.test(t) ? t : '');
      if (!say) return;
      if (say === ',') { if (words.length) words[words.length - 1] += ','; return; }
      if (/^the /.test(say) && /^(every|each)$/i.test(words[words.length - 1] || '')) say = say.slice(4);
      // past-tense "read" ("is read aloud") must sound like "red", not "reed" (Marcos 10/6)
      if (/^read[.!?,]?$/i.test(say) && /^(is|was|are|were|be|been|being)$/i.test(words[words.length - 1] || '')) say = say.replace(/^read/i, 'red');
      say.split(' ').forEach(w => { words.push(w); wordSpan.push(sp); });
      if (/[.!?]$/.test(say)) flush();
    });
    if (words.length && !/[.!?,]$/.test(words[words.length - 1])) words[words.length - 1] += '.';
    flush();
  });
  const factor = (typeof READ_SPEEDS !== 'undefined' && typeof readSpeed !== 'undefined' && READ_SPEEDS[readSpeed]) ? READ_SPEEDS[readSpeed].factor : 1;
  const rate = INTRO_RATE * factor;
  const token = ++introToken;
  const live = () => token === introToken && !screen.classList.contains('hidden');
  const sayPiece = k => {
    if (!live() || k >= pieces.length) return;
    const p = pieces[k];
    const text = p.words.join(' ');
    const starts = []; let pos = 0;
    p.words.forEach(w => { starts.push(pos); pos += w.length + 1; });
    const lit = new Set(p.wordSpan);
    let idx = -1, lastHeard = 0, startedAt = 0, viaVoice = false;
    const mark = j => {
      j = Math.max(0, Math.min(j, p.words.length - 1));
      if (j === idx) return;
      idx = j;
      lit.forEach(sp => sp.classList.remove('hl'));
      p.wordSpan[j].classList.add('hl');
    };
    // Watchdog: when the voice goes quiet about word positions (some voices
    // never report them, Chrome sometimes stops partway), step on at a
    // speaking pace — never past the last word, which stays lit until the end.
    // Pace comes from how long this voice really took on the sentences before
    // (first sentence: a guess), so the highlight keeps up on any voice.
    // (a hair quick on purpose: the last word stays lit until the voice ends, so early is safe, late is not)
    const wordMs = w => introMsPerChar ? 0.92 * (w.length + 1) * introMsPerChar : (120 + w.replace(/[^A-Za-z0-9]/g, '').length * 55) / rate;
    const tick = () => {
      if (!live()) return;
      // while the voice is reporting words it leads; step in only once it has gone quiet
      const base = wordMs(p.words[idx] || ''), quiet = Date.now() - lastHeard;
      const avg = Math.max(base, introMsPerWord || 0);   // a normal pause between reported words is never "quiet"
      if (idx >= 0 && viaVoice && quiet > avg * 1.8) {
        const n = Math.max(1, Math.floor(quiet / avg));   // catch up the words said while it was quiet
        viaVoice = false; mark(idx + n); lastHeard += n * avg;
      } else if (idx >= 0 && !viaVoice && quiet > base) {
        mark(idx + 1); lastHeard = Math.min(Date.now(), lastHeard + base);   // keep exact time between steps
      }
      introTimer = setTimeout(tick, 60);
    };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = rate;
    u.onstart = () => { startedAt = lastHeard = Date.now(); mark(0); clearTimeout(introTimer); tick(); };
    u.onboundary = e => {
      if (e.name !== 'word') return;
      let j = 0;
      while (j + 1 < starts.length && starts[j + 1] <= e.charIndex) j++;
      mark(j); lastHeard = Date.now(); viaVoice = true;
    };
    u.onend = () => {
      clearTimeout(introTimer);
      const took = Date.now() - startedAt;
      if (startedAt && live() && took > 300) {   // learn the voice's real speed (skip cancelled/odd pieces)
        const perChar = took / (text.length + 1);
        introMsPerChar = introMsPerChar ? (introMsPerChar + perChar) / 2 : perChar;
        const perWord = took / p.words.length;
        introMsPerWord = introMsPerWord ? (introMsPerWord + perWord) / 2 : perWord;
      }
      lit.forEach(sp => sp.classList.remove('hl'));
      if (live()) introTimer = setTimeout(() => sayPiece(k + 1), 250);
    };
    window.speechSynthesis.speak(u);
  };
  sayPiece(0);
}

function wrapWords(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  let idx = 0;
  function walk(node) {
    if (node.nodeType === 3) {
      const text = node.textContent.replace(/—/g, ' — ').replace(/  +/g, ' ');
      const words = text.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach(part => {
        if (/\S/.test(part)) {
          const sp = document.createElement('span');
          sp.className = 'wrd'; sp.dataset.wi = idx++; sp.textContent = part;
          frag.appendChild(sp);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else {
      [...node.childNodes].forEach(walk);
    }
  }
  walk(tmp);
  return tmp.innerHTML;
}

/* Speak every .wrd span inside `root`, toggling `btn`. */
function speakSpans(btn, root, rate) {
  if (activeSpeakBtn === btn) { stopActiveSpeech(); return; }
  stopActiveSpeech();
  const spans = Array.from(root.querySelectorAll('.wrd'));
  if (!spans.length) return;
  activeSpeakBtn = btn;
  btn.textContent = '⏹';
  let hlIdx = 0;
  const u = new SpeechSynthesisUtterance(spans.map(s => s.textContent).join(' '));
  u.lang = 'en-US'; u.rate = rate || 0.92;
  u.onboundary = e => {
    if (e.name !== 'word') return;
    spans.forEach(el => el.classList.remove('hl'));
    if (spans[hlIdx]) spans[hlIdx].classList.add('hl');
    hlIdx++;
  };
  u.onend = () => {
    spans.forEach(el => el.classList.remove('hl'));
    if (activeSpeakBtn === btn) { btn.textContent = '🔊'; activeSpeakBtn = null; }
  };
  addHighlightFallback(u, spans);
  window.speechSynthesis.speak(u);
}

/* ── SPEAK DIRECTIONS ───────────────────────────────── */
function speakDir(btn) {
  const p = btn.closest('.dir-section').querySelector('.dir-text');
  if (!p) return;
  if (!p.querySelector('.wrd')) p.innerHTML = wrapWords(p.innerHTML);
  speakSpans(btn, p, 0.92);
}

function speakWrittenPrompt(btn, promptId) {
  const p = document.getElementById('prompt-text-' + promptId);
  if (!p) return;
  if (!p.querySelector('.wrd')) p.innerHTML = wrapWords(p.innerHTML);
  speakSpans(btn, p, 0.92);
}

function speakParagraph(btn) {
  speakSpans(btn, btn.closest('.story-para').querySelector('.para-text'), 0.9);
}

/* ── STORY PANEL ────────────────────────────────────── */
function renderStoryPanel(panelId) {
  const panel = document.getElementById(panelId);
  const passage = window.RAD_PASSAGE;
  if (!passage) { panel.innerHTML = ''; document.body.classList.remove('story-active'); return; }
  const paras = passage.paragraphs.map((t, i) =>
    `<p class="story-para"><button class="speak-btn para-speak-btn" onclick="speakParagraph(this)" title="Read paragraph ${i + 1} aloud">🔊</button><span class="para-num" aria-label="Paragraph ${i + 1}">${i + 1}</span><span class="para-text">${wrapWords(escapeHtml(t))}</span></p>`
  ).join('');
  panel.innerHTML = `
    <div class="story-panel-header">
      <span>📖 ${escapeHtml(passage.title)}</span>
    </div>
    <div class="story-scroll">${paras}</div>`;
}

/* ══════════════════════════════════════════════════════
   APP OBJECT
══════════════════════════════════════════════════════ */
/* ── SESSION EVENT LOG ───────────────────────────────
   start · leave · return · resume · close · finish, each with the
   on-task clock. elapsed is time ON TASK: the timer pauses while the
   page is hidden and counts ticks, so a slept device cannot inflate it. */
function logEvent(kind, extra) {
  if (!app.events) app.events = [];
  app.events.push(Object.assign({
    at: new Date().toISOString(),
    e:  kind,
    q:  (app.currentIndex || 0) + 1,
    on: app.timerSeconds || 0
  }, extra || {}));
  if (app.events.length > 200) app.events.splice(0, app.events.length - 200);
}

const app = {

  /* ── state ── */
  studentName:       '',
  isRetake:          false,
  sessionId:         '',
  currentBank:       [],
  currentIndex:      0,
  score:             0,
  missedQuestions:   [],
  selectedAnswer:    null,
  questionLocked:    false,
  timerSeconds:      0,
  timerInterval:     null,
  timerOn:           false,
  instructInterval:  null,
  readInterval:      null,
  writtenTimerSeconds:  0,
  writtenTimerInterval: null,
  _lastFinishedScore:   null,

  /* ── screens ── */
  show(id) {
    ['start-screen','readaloud-screen','directions-screen','quiz-screen','end-screen','written-screen']
      .forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0, 0);   // every new screen starts at the top
    if (id !== 'quiz-screen' && id !== 'written-screen') document.body.classList.remove('story-active');
    stopActiveSpeech();
  },

  init() {
    this.show('start-screen');
    document.getElementById('welcome-panel').classList.remove('hidden');
    document.getElementById('student-login-panel').classList.add('hidden');
  },

  /* ── READ ALOUD INTRO ── */
  showReadAloudIntro() {
    if (!QUIZ_OPEN) return;
    document.getElementById('welcome-panel').classList.add('hidden');
    this.show('readaloud-screen');
    setTimeout(speakReadAloudIntro, 150);   // announces itself (show() just cancelled any speech)
    const btn   = document.getElementById('readaloud-btn');
    const fill  = document.getElementById('readaloud-fill');
    const count = document.getElementById('readaloud-count');
    btn.disabled = true; btn.style.opacity = '0.45'; btn.style.cursor = 'not-allowed';
    count.textContent = 6;
    fill.style.transition = 'none';
    fill.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transition = 'width 6s linear';
      fill.style.width = '0%';
    }));
    let remaining = 6;
    const iv = setInterval(() => {
      remaining--;
      count.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(iv);
        btn.disabled = false; btn.style.opacity = '1';
        btn.style.cursor = 'pointer'; btn.textContent = "✅ Got It — Show Me the Directions!";
      }
    }, 1000);
  },

  showDirections() {
    this.show('directions-screen');
    this.startInstructionsTimer();
  },

  showLogin() {
    if (this.instructInterval) { clearInterval(this.instructInterval); this.instructInterval = null; }
    this.studentName = '';
    document.getElementById('resume-container').classList.add('hidden');
    document.getElementById('form-select-section').classList.add('hidden');
    document.getElementById('login-step-card').classList.remove('hidden');
    this.show('start-screen');
    document.getElementById('welcome-panel').classList.add('hidden');
    document.getElementById('student-login-panel').classList.remove('hidden');
  },

  /* ── NAME SELECT ── */
  onNameSelect() {
    const val = document.getElementById('name-select').value;
    const pinSec   = document.getElementById('pin-section');
    const guestSec = document.getElementById('guest-name-section');
    document.getElementById('login-error').textContent = '';
    if (!val) { pinSec.classList.add('hidden'); return; }
    pinSec.classList.remove('hidden');
    if (val.startsWith('GUEST:')) {
      guestSec.classList.remove('hidden');
      document.getElementById('pin-label').textContent = '🔒 Enter guest code:';
    } else {
      guestSec.classList.add('hidden');
      document.getElementById('pin-label').textContent = '🔒 Enter your student number:';
    }
    setTimeout(() => document.getElementById('student-pin').focus(), 80);
  },

  /* ── LOGIN ── */
  attemptLogin() {
    const selVal = document.getElementById('name-select').value;
    const pin    = document.getElementById('student-pin').value.trim();
    const errEl  = document.getElementById('login-error');
    errEl.textContent = '';

    if (!selVal) { errEl.textContent = '⚠️ Please select your name.'; return; }
    if (!pin)    { errEl.textContent = '⚠️ Please enter your student number.'; return; }

    let displayName = '';
    if (selVal.startsWith('GUEST:')) {
      if (pin !== selVal.replace('GUEST:', '')) { errEl.textContent = '❌ Incorrect guest code. Try again.'; return; }
      const firstName = (document.getElementById('guest-display-name').value || '').trim();
      if (!firstName) { errEl.textContent = '⚠️ Please enter your first name.'; return; }
      displayName = firstName + ' (Guest)';
    } else {
      const student = ROSTER.find(s => s.name === selVal);
      if (!student || student.id !== pin) { errEl.textContent = '❌ Incorrect student number. Try again.'; return; }
      displayName = selVal;
    }

    this.studentName = displayName;
    document.getElementById('student-pin').value = '';
    document.getElementById('login-step-card').classList.add('hidden');
    document.getElementById('form-select-section').classList.remove('hidden');
    applyQuizLock(displayName);
    this.checkResume();
  },

  /* ── START / CONTINUE / RETAKE ── */
  attemptStart() {
    if (!this.studentName) return;
    const status = quizStatus(this.studentName);
    if (status === 'new') {
      this.startSession(isRetake(this.studentName));
    } else if (status === 'written') {
      const rec = getMcRecord(this.studentName);
      this.sessionId = rec.sessionId;
      this.isRetake  = !!rec.retake;
      this._lastFinishedScore = { score: rec.score, total: rec.total, pct: rec.pct };
      this.showWrittenScreen();
    } else {
      this.showPinModal(
        '🔓 Retake R.A.D. Online Quiz 1',
        `${getFirstName(this.studentName)} already finished the quiz. Enter Teacher PIN to allow a retake. The first score stays saved.`,
        () => {
          const name = this.studentName;
          localStorage.setItem(SCORES_KEY,  JSON.stringify(readJSON(SCORES_KEY, []).filter(s => s.name !== name)));
          localStorage.setItem(WRITTEN_KEY, JSON.stringify(readJSON(WRITTEN_KEY, []).filter(w => w.name !== name)));
          const retakes = readJSON(RETAKE_KEY, []).filter(n => n !== name);
          retakes.push(name);
          localStorage.setItem(RETAKE_KEY, JSON.stringify(retakes));
          this.startSession(true);
        }
      );
    }
  },

  /* ── TEACHER REVIEW MODE ── */
  promptTeacherReview() {
    const pin = prompt('Enter Teacher PIN to access Review Mode:');
    if (pin !== '9377') { if (pin !== null) alert('Incorrect PIN.'); return; }
    this.studentName = 'Mr. O (Teacher)';
    reviewMode = true;
    localStorage.removeItem(STORAGE_KEY);
    this._showReviewPicker();
  },

  _showReviewPicker() {
    const mode = prompt('Choose review mode:\n1 — Manual (tap Next each question)\n2 — Auto-run (fully automatic)\n\nEnter 1 or 2:');
    if (mode !== '1' && mode !== '2') { alert('Invalid choice.'); reviewMode = false; return; }
    reviewAutoRun = (mode === '2');
    this.startSession(false);
  },

  exitReviewMode() {
    reviewMode    = false;
    reviewAutoRun = false;
    this.stopTimerEngine();
    document.getElementById('review-mode-banner').classList.add('hidden');
    this.restart();
  },

  _autoAnswer() {
    const q = this.currentBank[this.currentIndex];
    document.querySelectorAll('.answer-btn').forEach(btn => {
      if (btn.dataset.answer === q.answer) this._selectChoice(q.answer, btn);
    });
    setTimeout(() => this.confirmAnswer(), 600);
  },

  /* ── START SESSION ── */
  startSession(retake) {
    this.events = []; this.startedAt = new Date().toISOString();
    this.finishedAt = '';
    localStorage.removeItem(STORAGE_KEY);
    tabSwitchCount = 0;
    document.getElementById('tab-warning-banner').classList.add('hidden');
    this.isRetake        = !!retake;
    this.sessionId       = newSessionId();
    this.score           = 0;
    this.missedQuestions = [];
    this.currentIndex    = 0;
    this.timerSeconds    = 0;

    const withShuffledChoices = q => {
      const choices = [...q.choices];
      shuffle(choices);
      return { ...q, choices };
    };
    // Skills questions first, then story questions — each group shuffled —
    // so the story panel appears once instead of flickering in and out.
    const skills = window.RAD_MC.filter(q => !q.story).map(withShuffledChoices);
    const story  = window.RAD_MC.filter(q =>  q.story).map(withShuffledChoices);
    shuffle(skills);
    shuffle(story);
    this.currentBank = [...skills, ...story];

    const banner = document.getElementById('review-mode-banner');
    banner.classList.toggle('hidden', !reviewMode);
    banner.querySelector('span').textContent = reviewAutoRun
      ? '🔍 Teacher Review Mode — auto-run'
      : '🔍 Teacher Review Mode — tap Next to advance';

    this.show('quiz-screen');
    renderStoryPanel('quiz-story-panel');
    logEvent('start');
    this.startTimer();
    this.renderQuestion();
  },

  /* ── RESUME ── */
  checkResume() {
    const data = readJSON(STORAGE_KEY, null);
    const rc = document.getElementById('resume-container');
    const formSelect = document.getElementById('form-select-section');
    if (data && this.studentName && data.studentName === this.studentName) {
      rc.classList.remove('hidden');
      document.getElementById('resume-detail').textContent =
        `${QUIZ_LABEL} — Q${data.currentIndex + 1} of ${data.currentBank.length}`;
      formSelect.classList.add('hidden');
    } else {
      rc.classList.add('hidden');
      if (this.studentName) formSelect.classList.remove('hidden');
    }
  },

  resumeSession() {
    const saved = readJSON(STORAGE_KEY, null);
    if (!saved) return;
    this.studentName     = saved.studentName;
    this.isRetake        = !!saved.isRetake;
    this.sessionId       = saved.sessionId;
    this.currentBank     = saved.currentBank;
    this.currentIndex    = saved.currentIndex;
    this.score           = saved.score;
    this.missedQuestions = saved.missedQuestions || [];
    this.timerSeconds    = saved.timerSeconds || 0;
    this.events = saved.events || [];
    this.startedAt = saved.startedAt || new Date().toISOString();
    logEvent('resume');
    this.show('quiz-screen');
    renderStoryPanel('quiz-story-panel');
    this.startTimer();
    // Saved right after answering the last question → nothing left to ask
    if (this.currentIndex >= this.currentBank.length) { this._finishSession(); return; }
    this.renderQuestion();
  },

  saveProgress() {
    if (reviewMode) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      studentName:     this.studentName,
      isRetake:        this.isRetake,
      sessionId:       this.sessionId,
      currentBank:     this.currentBank,
      currentIndex:    this.questionLocked ? this.currentIndex + 1 : this.currentIndex, // answered → resume at the next one
      score:           this.score,
      missedQuestions: this.missedQuestions,
      timerSeconds:    this.timerSeconds,
      events: this.events,
      startedAt: this.startedAt
    }));
  },

  discardProgress() {
    this.showPinModal(
      '🗑️ Discard Progress',
      'Enter Teacher PIN to clear the unfinished quiz. The student will start fresh.',
      () => {
        localStorage.removeItem(STORAGE_KEY);
        applyQuizLock(this.studentName);
        this.checkResume();
      }
    );
  },

  /* ── OVERALL TIMER ── */
  startTimer() {
    this.stopTimerEngine();
    this.timerOn = true;
    this._tickTimer();
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this._tickTimer();
      if (this.timerSeconds % 30 === 0) this.saveProgress();
    }, 1000);
  },

  stopTimerEngine() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    this.timerOn = false;
  },

  _tickTimer() {
    const m = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
    const s = String(this.timerSeconds % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${m}:${s}`;
  },

  /* ── INSTRUCTIONS LOCK (20s) ── */
  startInstructionsTimer() {
    if (this.instructInterval) { clearInterval(this.instructInterval); this.instructInterval = null; }
    const btn   = document.getElementById('ready-btn');
    const fill  = document.getElementById('instruct-fill');
    const count = document.getElementById('instruct-count');
    btn.disabled = true;
    btn.style.opacity = '0.45';
    btn.style.cursor  = 'not-allowed';
    count.textContent = INSTRUCT_SECS;
    fill.style.transition = 'none';
    fill.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transition = `width ${INSTRUCT_SECS}s linear`;
      fill.style.width = '0%';
    }));
    let remaining = INSTRUCT_SECS;
    this.instructInterval = setInterval(() => {
      remaining--;
      count.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this.instructInterval);
        this.instructInterval = null;
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor  = 'pointer';
        btn.textContent   = "✅ Got It — Let's Begin!";
      }
    }, 1000);
  },

  /* ── READING LOCK TIMER (12s) ── */
  startReadTimer() {
    if (this.readInterval) { clearInterval(this.readInterval); this.readInterval = null; }
    const bar   = document.getElementById('reading-timer-bar');
    const fill  = document.getElementById('reading-fill');
    const count = document.getElementById('reading-count');

    if (reviewMode) {
      bar.classList.add('hidden');
      // Both review modes pick the correct answer; manual waits for Next, auto-run advances itself.
      setTimeout(() => this._autoAnswer(), 300);
      return;
    }

    bar.classList.remove('hidden');
    count.textContent = READ_SECS;
    fill.style.transition = 'none';
    fill.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transition = `width ${READ_SECS}s linear`;
      fill.style.width = '0%';
    }));

    document.querySelectorAll('.answer-btn').forEach(b => { b.classList.add('locked-choice'); b.disabled = true; });

    let remaining = READ_SECS;
    this.readInterval = setInterval(() => {
      remaining--;
      count.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this.readInterval);
        this.readInterval = null;
        bar.classList.add('hidden');
        document.querySelectorAll('.answer-btn').forEach(b => { b.classList.remove('locked-choice'); b.disabled = false; });
        document.getElementById('confirm-btn').classList.remove('hidden');
      }
    }, 1000);
  },

  /* ── RENDER QUESTION ── */
  renderQuestion() {
    const q     = this.currentBank[this.currentIndex];
    const total = this.currentBank.length;

    document.getElementById('progress-text').textContent = `Question ${this.currentIndex + 1} of ${total}`;
    document.getElementById('score-text').textContent    = `${getFirstName(this.studentName)} · ${QUIZ_LABEL}`;
    document.getElementById('progress-fill').style.width = `${(this.currentIndex / total) * 100}%`;
    document.getElementById('question-text').textContent = q.q;
    document.body.classList.toggle('story-active', !!q.story);

    document.getElementById('confirm-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');

    this.selectedAnswer = null;
    this.questionLocked = false;
    const wrap = document.getElementById('answers');
    wrap.innerHTML = '';

    q.choices.forEach((text, i) => {
      const row = document.createElement('div');
      row.className = 'answer-row';

      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.dataset.answer = text;
      btn.innerHTML = `<strong>${'ABCD'[i]}.</strong>&nbsp;${wrapWords(escapeHtml(text))}`;
      btn.onclick = () => this._selectChoice(text, btn);

      const speakBtn = document.createElement('button');
      speakBtn.className = 'choice-speak-btn';
      speakBtn.textContent = '🔊';
      speakBtn.title = 'Read this choice aloud';
      speakBtn.onclick = e => { e.stopPropagation(); speakSpans(speakBtn, btn, 0.9); };

      row.appendChild(speakBtn);
      row.appendChild(btn);
      wrap.appendChild(row);
    });

    if (this.currentIndex > 0 && this.currentIndex % 5 === 0) submitScorePartial();
    this.saveProgress();
    this.startReadTimer();
  },

  _selectChoice(text, btn) {
    if (this.questionLocked) return;
    document.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
    this.selectedAnswer = text;
    btn.classList.add('selected');
  },

  /* ── CONFIRM ANSWER (test: no right/wrong shown to students) ── */
  confirmAnswer() {
    if (!this.selectedAnswer) return;
    this.questionLocked = true;

    const q = this.currentBank[this.currentIndex];
    if (this.selectedAnswer === q.answer) {
      this.score++;
    } else {
      this.missedQuestions.push({ id: q.id, q: q.q, skill: (window.SKILLS || {})[q.id], yourAnswer: this.selectedAnswer, correct: q.answer, explanation: q.explanation || '' });
    }

    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.disabled = true;
      if (reviewMode && btn.dataset.answer === q.answer) btn.classList.add('correct');
      else if (reviewMode && btn.dataset.answer === this.selectedAnswer) btn.classList.add('incorrect');
    });

    document.getElementById('confirm-btn').classList.add('hidden');
    this.saveProgress();

    if (reviewMode && reviewAutoRun) setTimeout(() => this.nextQuestion(), 800);
    else document.getElementById('next-btn').classList.remove('hidden');
  },

  nextQuestion() {
    stopActiveSpeech();
    this.currentIndex++;
    if (this.currentIndex >= this.currentBank.length) this._finishSession();
    else this.renderQuestion();
  },

  /* ── FINISH MULTIPLE CHOICE ── */
  _finishSession() {
    this.finishedAt = new Date().toISOString(); logEvent('finish');
    this.stopTimerEngine();
    localStorage.removeItem(STORAGE_KEY);

    const total = this.currentBank.length;
    const pct   = Math.round((this.score / total) * 100);
    const date  = new Date();
    this._lastFinishedScore = { score: this.score, total, pct };

    if (!reviewMode) {
      const scores = readJSON(SCORES_KEY, []);
      scores.push({
        name: this.studentName, sessionId: this.sessionId, retake: this.isRetake,
        score: this.score, total, pct, elapsed: this.timerSeconds,
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        done: true
      });
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    }

    submitScoreFinal();

    let msg = "Keep practicing your R.A.D. answers! 📚";
    if (pct === 100)    msg = "⭐ PERFECT SCORE! ⭐";
    else if (pct >= 90) msg = "Outstanding Work! 🌟";
    else if (pct >= 80) msg = "Great Job! 👏";
    else if (pct >= 70) msg = "Good Effort! 💪";

    this.show('end-screen');
    document.getElementById('review-next-btn').classList.toggle('hidden', !reviewMode);
    document.getElementById('final-score-sub').textContent = `${formLabel()} · ${this.studentName}`;
    document.getElementById('final-msg').textContent = msg;

    const pctEl = document.getElementById('final-percent');
    pctEl.innerHTML = `${this.score}/${total}<br><small style="font-size:0.5em;color:${pct >= 70 ? 'var(--correct)' : 'var(--danger)'};">${pct}% · ${letterGrade(pct)}</small>`;
    setTimeout(() => pctEl.classList.add('revealed'), 50);

    const missedSec = document.getElementById('missed-section');
    if (this.missedQuestions.length) {
      missedSec.classList.remove('hidden');
      document.getElementById('missed-items').innerHTML = this.missedQuestions.map(m =>
        `<div class="missed-item">
          <div style="margin:3px 0;">${escapeHtml(m.q)}</div>
          <div>Your answer: <span style="color:var(--danger);">${escapeHtml(m.yourAnswer)}</span></div>
          <div>✅ Correct: <strong style="color:var(--correct);">${escapeHtml(m.correct)}</strong></div>
          ${m.explanation ? `<div style="margin-top:5px;font-size:0.85rem;color:#555;font-style:italic;">💡 ${escapeHtml(m.explanation)}</div>` : ''}
        </div>`
      ).join('');
    } else {
      missedSec.classList.add('hidden');
    }

    if (pct >= 70) startConfetti(pct);
  },

  /* ── WRITTEN R.A.D. ANSWERS ── */
  showWrittenScreen() {
    stopConfetti();
    this.show('written-screen');
    renderStoryPanel('written-story-panel');
    document.body.classList.add('story-active');

    const reminder = document.getElementById('mc-score-reminder');
    reminder.classList.remove('hidden');
    reminder.innerHTML = this._lastFinishedScore
      ? `📊 Your multiple-choice score: <strong>${this._lastFinishedScore.score}/${this._lastFinishedScore.total} (${this._lastFinishedScore.pct}%)</strong> — already saved. Now write an R.A.D. answer for each question below.`
      : 'Write an R.A.D. answer for each question below.';

    document.getElementById('written-body').classList.remove('hidden');
    const container = document.getElementById('written-prompts-container');
    container.innerHTML = '';
    container.classList.remove('hidden');

    window.RAD_WRITTEN.forEach(p => {
      const card = document.createElement('div');
      card.className = 'written-prompt-card';
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="speak-btn" onclick="speakWrittenPrompt(this,'${p.id}')">🔊</button>
          <div class="written-prompt-label">${p.id}</div>
        </div>
        <div class="written-prompt-type">${escapeHtml(p.type)}</div>
        <div class="written-prompt-text" id="prompt-text-${p.id}">${escapeHtml(p.prompt)}</div>
        <div class="written-guidance">💡 ${escapeHtml(p.guidance)}</div>
        <textarea class="written-textarea" id="textarea-${p.id}" spellcheck="false"
                  placeholder="Write your R.A.D. answer here…"
                  oninput="app._updateWordCount('${p.id}', this); app._autosaveDraft()"></textarea>
        <div class="word-count-row">Words: <span class="word-count-val" id="wc-${p.id}">0</span><span style="color:#aaa;font-size:0.8rem;">&nbsp;/ ${MIN_WORDS} minimum</span></div>`;
      container.appendChild(card);
    });

    const btn = document.getElementById('submit-written-btn');
    btn.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = '✅ Submit Written Answers';
    document.getElementById('written-submit-error').textContent = '';
    document.getElementById('written-success-panel').classList.add('hidden');
    this._restoreDraft();
    this._startWrittenTimer();
  },

  _updateWordCount(id, textarea) {
    const words = countWords(textarea.value);
    const el = document.getElementById(`wc-${id}`);
    if (el) { el.textContent = words; el.style.color = words >= MIN_WORDS ? '#27ae60' : 'var(--danger)'; }
  },

  _currentDraft() {
    const draft = {};
    window.RAD_WRITTEN.forEach(p => {
      const ta = document.getElementById(`textarea-${p.id}`);
      if (ta) draft[p.id] = ta.value;
    });
    return draft;
  },

  _autosaveDraft() {
    const draft = this._currentDraft();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: this.studentName, draft }));
    clearTimeout(this._autosaveDraftTimer);
    this._autosaveDraftTimer = setTimeout(() => this._saveDraftToServer(draft), 3000);
  },

  _saveDraftToServer(draft) {
    fetch(SHEET_URL, {
      method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'draft', game: WRITTEN_GAME,
        name: this.studentName, sessionId: this.sessionId + '-written',
        w1: draft.W1 || '', w2: draft.W2 || '', w3: draft.W3 || ''
      })
    }).catch(() => {});
  },

  _restoreDraft() {
    const saved = readJSON(DRAFT_KEY, null);
    if (!saved || saved.name !== this.studentName) return;
    window.RAD_WRITTEN.forEach(p => {
      const ta = document.getElementById(`textarea-${p.id}`);
      if (ta && saved.draft[p.id]) {
        ta.value = saved.draft[p.id];
        this._updateWordCount(p.id, ta);
      }
    });
  },

  _startWrittenTimer() {
    this._stopWrittenTimer();
    this.writtenTimerSeconds = 0;
    this._tickWrittenTimer();
    this.writtenTimerInterval = setInterval(() => {
      this.writtenTimerSeconds++;
      this._tickWrittenTimer();
    }, 1000);
  },

  _tickWrittenTimer() {
    const m = String(Math.floor(this.writtenTimerSeconds / 60)).padStart(2, '0');
    const s = String(this.writtenTimerSeconds % 60).padStart(2, '0');
    document.getElementById('written-timer-display').textContent = `${m}:${s}`;
  },

  _stopWrittenTimer() {
    if (this.writtenTimerInterval) { clearInterval(this.writtenTimerInterval); this.writtenTimerInterval = null; }
  },

  submitWrittenResponses() {
    const prompts   = window.RAD_WRITTEN;
    const responses = {};
    prompts.forEach(p => {
      const ta = document.getElementById(`textarea-${p.id}`);
      responses[p.id] = ta ? ta.value.trim() : '';
    });

    const errors = prompts
      .map(p => ({ id: p.id, count: countWords(responses[p.id] || '') }))
      .filter(r => r.count < MIN_WORDS)
      .map(r => `${r.id} needs at least ${MIN_WORDS} words (you have ${r.count}).`);
    if (errors.length) {
      document.getElementById('written-submit-error').textContent = '⚠️ ' + errors.join('  ');
      return;
    }

    const btn = document.getElementById('submit-written-btn');
    btn.disabled = true; btn.textContent = '⏳ Submitting…';
    document.getElementById('written-submit-error').textContent = '';

    this._stopWrittenTimer();
    clearTimeout(this._autosaveDraftTimer);
    submitWrittenToSheet(responses.W1 || '', responses.W2 || '', responses.W3 || '', this.writtenTimerSeconds);

    if (!reviewMode) {
      const written = readJSON(WRITTEN_KEY, []);
      written.push({ name: this.studentName, timestamp: new Date().toISOString() });
      localStorage.setItem(WRITTEN_KEY, JSON.stringify(written));
    }
    localStorage.removeItem(DRAFT_KEY);

    stopActiveSpeech();
    document.body.classList.remove('story-active');
    document.getElementById('written-body').classList.add('hidden');
    document.getElementById('mc-score-reminder').classList.add('hidden');
    document.getElementById('written-success-panel').classList.remove('hidden');
    startConfetti(90);
    setTimeout(stopConfetti, 4000);
  },

  /* ── SPEAK QUESTION ── */
  speakQuestion() {
    const qBtn = document.getElementById('speak-q-btn');
    const qtEl = document.getElementById('question-text');
    if (!qtEl.querySelector('.wrd')) qtEl.innerHTML = wrapWords(escapeHtml(qtEl.textContent));
    speakSpans(qBtn, qtEl, 0.92);
  },

  /* ── HOME ── */
  restart() {
    stopConfetti();
    this.stopTimerEngine();
    this._stopWrittenTimer();
    this.timerSeconds = 0;
    this.studentName  = '';
    this._lastFinishedScore = null;
    reviewMode = false;
    reviewAutoRun = false;
    document.getElementById('name-select').value = '';
    document.getElementById('student-pin').value = '';
    document.getElementById('pin-section').classList.add('hidden');
    document.getElementById('form-select-section').classList.add('hidden');
    document.getElementById('resume-container').classList.add('hidden');
    document.getElementById('login-error').textContent = '';
    document.getElementById('login-step-card').classList.remove('hidden');
    this.show('start-screen');
    document.getElementById('welcome-panel').classList.remove('hidden');
    document.getElementById('student-login-panel').classList.add('hidden');
  },

  /* ── GLOBAL PIN MODAL ── */
  showPinModal(title, msg, onSuccess) {
    pinModalCallback = onSuccess;
    document.getElementById('pin-modal-title').textContent = title;
    document.getElementById('pin-modal-msg').textContent   = msg;
    document.getElementById('pin-modal-input').value       = '';
    document.getElementById('pin-modal-error').textContent = '';
    document.getElementById('pin-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('pin-modal-input').focus(), 80);
  },

  confirmPinModal() {
    const pin = document.getElementById('pin-modal-input').value.trim();
    if (pin === '9377') {
      document.getElementById('pin-modal').classList.add('hidden');
      const cb = pinModalCallback;
      pinModalCallback = null;
      if (cb) cb();
    } else {
      document.getElementById('pin-modal-error').textContent = '❌ Incorrect PIN. Try again.';
      document.getElementById('pin-modal-input').value = '';
      document.getElementById('pin-modal-input').focus();
    }
  },

  cancelPinModal() {
    document.getElementById('pin-modal').classList.add('hidden');
    pinModalCallback = null;
  }
};

/* ── VISIBILITY / UNLOAD ─────────────────────────────── */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!app.timerOn) return;
    tabSwitchCount++;
    logEvent('leave');
    app.stopTimerEngine();
    app.saveProgress();
    app._wasTimerRunning = true;
  } else {
    if (!app._wasTimerRunning) return;
    app._wasTimerRunning = false;
    logEvent('return');
    document.getElementById('tab-warning-banner').classList.remove('hidden');
    app.startTimer();
  }
});

window.addEventListener('beforeunload', () => {
  if (app.timerOn) logEvent('close');
  if (app.timerOn) app.saveProgress();
});

/* ── CONFETTI ────────────────────────────────────────── */
const canvas = document.getElementById('confetti-canvas');
const ctx    = canvas.getContext('2d');
let particles = [], animId = null;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

function startConfetti(pct) {
  stopConfetti();
  particles = [];
  const count = pct === 100 ? 300 : pct >= 90 ? 220 : pct >= 80 ? 160 : 80;
  const cols  = pct === 100
    ? ['#FFD700','#FFA500','#FFFACD','#f39c12','#ffffff']
    : ['#2e5aac','#3aa6b9','#2ecc71','#f39c12','#9b59b6','#e74c3c'];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      c: cols[~~(Math.random() * cols.length)],
      s: Math.random() * 5 + 3,
      d: Math.random() * 5 + 2,
      r: Math.random() * Math.PI * 2
    });
  }
  animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r += 0.05);
    ctx.fillStyle = p.c; ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s);
    ctx.restore();
    p.y += p.d; p.x += Math.sin(p.r) * 1.5;
    if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
  });
  animId = requestAnimationFrame(animateConfetti);
}

function stopConfetti() {
  if (animId) cancelAnimationFrame(animId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  animId = null;
}

/* ── BOOT ────────────────────────────────────────────── */
app.init();

/* ── CLOSED-TO-STUDENTS LOCK ────────────────────────── */
(function applyQuizLock() {
  if (QUIZ_OPEN) return;
  const btn = document.querySelector('.lgs-btn');
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('locked');
  btn.textContent = '🔒 Not Open Yet';
  const note = document.createElement('p');
  note.className = 'locked-note';
  note.textContent = "Mr. O will let you know when this quiz is ready!";
  btn.insertAdjacentElement('afterend', note);
})();
