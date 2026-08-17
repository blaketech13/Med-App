// Indications & contraindications quiz — vanilla JS port of the Claude Design
// prototype (project/Indications & Contraindications Quiz.dc.html). Question
// generation and the distractor-safety logic below are ported line-for-line
// from that prototype's Component class; see chats/chat1.md for why each
// guard (clusters, paraphrase overlap, synonym expansion, token containment)
// exists before changing it.

import * as dd from './drug-data.js';

const OK = 'oklch(0.5 0.11 150)';
const OKBG = 'oklch(0.96 0.03 150)';

const app = document.getElementById('app');

const state = {
  stage: 'setup',
  len: 12,
  mode: 'BOTH',
  group: 'ALL',
  picked: {},
  drugQuery: '',
  drugs: null,
  qs: [], idx: 0, chosen: null, answers: []
};

function setState(patch) {
  Object.assign(state, patch);
  render();
}

// ---- ported helpers (identical behaviour to the .dc.html Component) -------

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; }
  return r;
}
function short(s, n) { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }
// the list spells the same clinical fact differently between drugs — "Known Parkinson's
// Disease" vs "Known Parkinsons Disease", "< 6 y.o" vs "< 6 years old". Comparing raw
// strings lets one drug's entry become a distractor for another drug it is equally true
// of, so every comparison here runs on the normalised form.
function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
// word-sequence tools: "ROSC" is a run inside "Post ROSC", so containment is tested on
// token runs rather than raw substrings (which would match fragments across words).
// Comparison operators are split off as their own token so "<16 y.o" and "< 16 y.o"
// tokenise identically — the list writes age thresholds both ways.
function tok(s) { return (s || '').toLowerCase().replace(/([<>≤≥])/g, ' $1 ').split(/[^a-z0-9%<>≤≥]+/).filter(Boolean); }
function seqIn(needle, hay) {
  if (!needle.length || needle.length > hay.length) return false;
  for (let i = 0; i <= hay.length - needle.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) { if (hay[i + j] !== needle[j]) { ok = false; break; } }
    if (ok) return true;
  }
  return false;
}

// indications worth quizzing: skip continuation rows with no indication text
function indsOf(d) {
  const out = [];
  d.rows.forEach(r => { if (r.i.length) out.push(r.i); });
  return out;
}
// contraindications worth quizzing: bare hypersensitivity/allergy lines are true of
// almost every drug, so they make useless stems and dangerous distractors
function cisOf(d) {
  return d.ci.filter(c => {
    const l = c.toLowerCase();
    return l !== 'nil' && l.indexOf('hypersensitiv') < 0 && l.indexOf('known allergy') < 0 && l.indexOf('allergy to') < 0;
  });
}

function buildPool() {
  const all = state.drugs || [];
  const scope = state.group;
  const mode = state.mode;
  // an explicit drug selection overrides the group filter
  const picks = Object.keys(state.picked).filter(k => state.picked[k]);
  const inScope = picks.length
    ? (d) => !!state.picked[d.n]
    : (d) => scope === 'ALL' || d.g === scope || d.also === scope;

  const allInd = [], allCi = [], allNames = [];
  // which drugs share a given indication line / contraindication, normalised — used to
  // keep a second equally-correct drug out of the "which drug?" answer sets
  const indOwners = {}, ciOwners = {};
  all.forEach(d => {
    allNames.push({ v: d.n, d: d.n, g: d.g });
    indsOf(d).forEach(lines => {
      allInd.push({ v: short(lines.join(' · '), 120), d: d.n, g: d.g, lines });
      lines.forEach(l => { const k = norm(l); (indOwners[k] = indOwners[k] || []).push(d.n); });
    });
    cisOf(d).forEach(c => {
      allCi.push({ v: c, d: d.n, g: d.g });
      const k = norm(c); (ciOwners[k] = ciOwners[k] || []).push(d.n);
    });
  });

  // ban: any string the target drug is ALSO true of (not just the one correct answer)
  const distract = (arr, correct, drug, n, rawBan, group) => {
    // the list words one finding three ways ("Pregnancy" / "known or suspected to be
    // pregnant" / "Foetus remaining in uterus"), so the ban list is grown to cover
    // every synonym of anything already in it before comparing
    const ban = dd.expandBan(rawBan);
    const bad = {}; bad[norm(correct)] = 1;
    ban.forEach(b => { bad[norm(b)] = 1; });
    // a short line sits INSIDE a drug's own longer one — "ROSC" within "Post ROSC",
    // bare "Cardiac Arrest" within "Cardiac Arrest with persistent VF…". Compared as
    // word sequences so short values are caught in both directions without the false
    // hits raw substring matching would produce.
    const banSeq = ban.concat([correct]).map(tok);
    const clash = (str) => { const t = tok(str); return banSeq.some(b => seqIn(b, t) || seqIn(t, b)); };
    const seen = {}; const out = [];
    shuffle(arr).forEach(o => {
      const k = norm(o.v);
      if (o.d === drug || bad[k] || seen[k] || clash(o.v)) return;
      if (o.lines && o.lines.some(l => bad[norm(l)] || clash(l))) return;
      seen[k] = 1;
      out.push(o);
    });
    // Difficulty: prefer near-misses — same clinical group first, then closest in
    // length — so no option can be eliminated on shape alone. Ranking only reorders
    // the already-safe candidate set; correct answers are never touched.
    const L = (correct || '').length;
    out.sort((a, b) => {
      const ga = a.g === group ? 0 : 1, gb = b.g === group ? 0 : 1;
      if (ga !== gb) return ga - gb;
      return Math.abs(a.v.length - L) - Math.abs(b.v.length - L);
    });
    return shuffle(out.slice(0, n + 3)).slice(0, n).map(o => o.v);
  };
  // every line each drug owns, by kind — needed to test a candidate against the stem
  const byName = {};
  all.forEach(d => {
    const ind = []; indsOf(d).forEach(l => ind.push.apply(ind, l));
    byName[d.n] = { ind, ci: cisOf(d) };
  });
  // indication TEXT distractors need the same clinical guards as the drug-name ones:
  // a cluster sibling's paraphrase of the same presentation is equally correct
  const indPool = (lines, drug, own) => {
    const rivals = dd.rivalDrugs(lines, drug);
    return allInd.filter(o => !rivals[o.d] && !dd.overlaps(own, o.lines));
  };
  // drug-name distractors for "which drug?" stems: drop every drug the stem is also
  // true of — by shared wording, by named clinical cluster, and by paraphrase overlap
  const otherDrugs = (lines, owners, drug, kind) => {
    const bad = { [drug]: 1 };
    lines.forEach(l => (owners[norm(l)] || []).forEach(nm => { bad[nm] = 1; }));
    Object.keys(dd.rivalDrugs(lines, drug)).forEach(nm => { bad[nm] = 1; });
    return allNames.filter(o => {
      if (bad[o.v]) return false;
      if (byName[o.v] && dd.overlaps(lines, byName[o.v][kind])) return false;
      return true;
    });
  };
  // five options where the data supports it, four where it doesn't
  const mk = (o) => {
    if (o.opts.length < 3) return null;
    const options = shuffle([o.correct].concat(o.opts.slice(0, 4)));
    return Object.assign({}, o, { options, a: options.indexOf(o.correct) });
  };

  const ind = [], ci = [];
  all.forEach(d => {
    if (!inScope(d)) return;
    const g = (dd.SHORT && dd.SHORT[d.g]) || d.g;
    const inds = indsOf(d);
    const cis = cisOf(d);
    // everything this drug is itself indicated for — never usable as a wrong answer
    const ownInd = [];
    inds.forEach(l => { ownInd.push(short(l.join(' · '), 120)); l.forEach(x => ownInd.push(x)); });

    if (mode !== 'CI') {
      // presentation → drug
      if (inds.length) {
        const lines = inds[0];
        const q = mk({
          kind: 'Indication', tone: 'neutral', group: g, drug: d.n,
          stem: 'A patient presents as below. Which of these drugs is indicated?',
          subLabel: 'Listed indication', subLines: lines,
          correct: d.n, opts: distract(otherDrugs(lines, indOwners, d.n, 'ind'), d.n, d.n, 4, [], d.g),
          explain: d.n + ' is listed for: ' + lines.join(' · ')
        });
        if (q) ind.push(q);
      }
      // drug → indication
      inds.forEach(lines => {
        const c = short(lines.join(' · '), 120);
        const q = mk({
          kind: 'Indication', tone: 'neutral', group: g, drug: d.n,
          stem: 'Which of these is a listed indication for ' + d.n + '?',
          subLabel: '', subLines: [],
          correct: c, opts: distract(indPool(lines, d.n, ownInd), c, d.n, 4, ownInd, d.g),
          explain: 'On the 2026 list, ' + d.n + ' is indicated for: ' + lines.join(' · ')
        });
        if (q) ind.push(q);
      });
    }

    if (mode !== 'IND') {
      // drug → contraindication
      cis.forEach(c => {
        const q = mk({
          kind: 'Contraindication', tone: 'signal', group: g, drug: d.n,
          stem: 'Which of these is a contraindication to ' + d.n + '?',
          subLabel: '', subLines: [],
          correct: c, opts: distract(allCi, c, d.n, 4, d.ci, d.g),
          explain: d.n + ' is contraindicated in: ' + cis.join(' · ') + (d.ci.length > cis.length ? ' (plus known hypersensitivity).' : '.')
        });
        if (q) ci.push(q);
      });
      // contraindication → drug, one question per contraindication rather than just
      // the first, so the drill covers the whole column instead of the headline bar
      cis.forEach(c => {
        const q = mk({
          kind: 'Withhold', tone: 'signal', group: g, drug: d.n,
          stem: 'This finding rules out which drug?',
          subLabel: 'Finding on assessment', subLines: [c],
          correct: d.n, opts: distract(otherDrugs([c], ciOwners, d.n, 'ci'), d.n, d.n, 4, [], d.g),
          explain: c + ' is a listed contraindication to ' + d.n + '.'
        });
        if (q) ci.push(q);
      });
    }
  });
  return { ind, ci };
}

function sample(pool, n) {
  const buckets = [shuffle(pool.ind), shuffle(pool.ci)].filter(b => b.length);
  const out = []; let i = 0;
  while (out.length < n) {
    let added = false;
    for (const b of buckets) { if (b[i]) { out.push(b[i]); added = true; if (out.length >= n) break; } }
    if (!added) break;
    i++;
  }
  return shuffle(out).slice(0, n);
}

function start() {
  const qs = sample(buildPool(), state.len);
  if (!qs.length) return;
  setState({ stage: 'run', qs, idx: 0, chosen: null, answers: [] });
}

function answer(i) {
  if (state.chosen !== null) return;
  const q = state.qs[state.idx];
  setState({ chosen: i, answers: state.answers.concat([{ q, chosen: i, ok: i === q.a }]) });
}

function next() {
  if (state.idx >= state.qs.length - 1) setState({ stage: 'done' });
  else setState({ idx: state.idx + 1, chosen: null });
}

function retryWrong() {
  const qs = shuffle(state.answers.filter(a => !a.ok).map(a => a.q));
  if (qs.length) setState({ stage: 'run', qs, idx: 0, chosen: null, answers: [] });
}

function toSetup() { setState({ stage: 'setup' }); }

// ---- DOM builders ----------------------------------------------------------

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  children.flat().forEach(c => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function btn({ variant = 'primary', size = 'md', label, onClick, disabled }) {
  return el('button', { class: `btn btn-${variant} btn-${size}`, onclick: onClick, disabled: disabled ? '' : null, type: 'button', text: label });
}

function badge(tone, label) {
  return el('span', { class: `badge badge-${tone}`, text: label });
}

function sectionHeader(number, kicker, title) {
  return el('div', { class: 'section-header' },
    el('div', { class: 'section-header-row' },
      el('span', { class: 'section-header-number', text: number }),
      el('div', { class: 'section-header-body' },
        kicker ? el('span', { class: 'section-header-kicker', text: kicker }) : null,
        el('h2', { class: 'section-header-title', text: title })
      )
    ),
    el('div', { class: 'section-header-rule' })
  );
}

function metric(label, value) {
  return el('div', { class: 'metric' },
    el('span', { class: 'metric-label', text: label }),
    el('span', { class: 'metric-value', text: value })
  );
}

// ---- screens ----------------------------------------------------------------

function renderSetup(container) {
  const pool = state.drugs ? buildPool() : { ind: [], ci: [] };
  const poolSize = pool.ind.length + pool.ci.length;
  const picks = Object.keys(state.picked).filter(k => state.picked[k]);
  const btnVariant = (active) => (active ? 'primary' : 'secondary');

  container.appendChild(sectionHeader('01', 'Recognition drill', 'Set up your run.'));

  container.appendChild(el('div', { class: 'lead', text:
    'Four question types, drawn only from the indication and contraindication columns of the 2026 list: matching a presentation to its drug, recalling what a drug is listed for, spotting a contraindication, and identifying which drug a contraindication belongs to.' }));

  container.appendChild(el('div', { class: 'field-label', text: 'Length' }));
  container.appendChild(el('div', { class: 'chip-row' },
    [8, 12, 20, 30].map(n => btn({
      variant: btnVariant(state.len === n), size: 'md', label: `${n} questions`,
      onClick: () => setState({ len: n })
    }))
  ));

  container.appendChild(el('div', { class: 'field-label', text: 'Focus' }));
  container.appendChild(el('div', { class: 'chip-row' },
    [['BOTH', 'Both'], ['IND', 'Indications only'], ['CI', 'Contraindications only']].map(([k, label]) => btn({
      variant: btnVariant(state.mode === k), size: 'md', label,
      onClick: () => setState({ mode: k })
    }))
  ));

  container.appendChild(el('div', { class: 'field-label', text: 'Clinical group' }));
  const groups = dd.GROUPS || [];
  container.appendChild(el('div', { class: 'chip-row tight' },
    [{ label: 'All groups', k: 'ALL' }].concat(groups.map(g => ({ label: (dd.SHORT && dd.SHORT[g]) || g, k: g })))
      .map(c => btn({
        variant: !picks.length && state.group === c.k ? 'primary' : 'secondary', size: 'sm', label: c.label,
        onClick: () => setState({ group: c.k, picked: {} })
      }))
  ));

  container.appendChild(el('div', { class: 'picker-heading-row' },
    el('span', { class: 'field-label', style: 'margin-bottom:0', text: 'Or pick individual drugs' }),
    el('span', {
      class: 'pick-line',
      style: `color:${picks.length ? '#B4551E' : '#83888F'}`,
      text: picks.length ? `${picks.length} drug${picks.length === 1 ? '' : 's'} selected · group filter ignored` : 'No individual drugs selected · using the group filter'
    })
  ));

  const dq = state.drugQuery.trim().toLowerCase();
  const drugPicks = (state.drugs || [])
    .filter(d => !dq || d.n.toLowerCase().indexOf(dq) >= 0 || (d.gShort || '').toLowerCase().indexOf(dq) >= 0);

  const queryInput = el('input', {
    type: 'text', placeholder: 'Filter drugs…', value: state.drugQuery,
    oninput: (e) => setState({ drugQuery: e.target.value })
  });

  const panel = el('div', { class: 'picker-panel' },
    el('div', { class: 'picker-controls' },
      el('div', { class: 'field-wrap' }, el('div', { class: 'input-shell' }, queryInput)),
      btn({
        variant: 'ghost', size: 'sm', label: 'Select shown', onClick: () => {
          const p = Object.assign({}, state.picked);
          drugPicks.forEach(d => { p[d.n] = true; });
          setState({ picked: p });
        }
      }),
      btn({ variant: 'ghost', size: 'sm', label: 'Clear', onClick: () => setState({ picked: {}, drugQuery: '' }) })
    ),
    el('div', { class: 'picker-list' },
      drugPicks.map(d => btn({
        variant: state.picked[d.n] ? 'primary' : 'secondary', size: 'sm', label: d.n,
        onClick: () => {
          const p = Object.assign({}, state.picked);
          if (p[d.n]) delete p[d.n]; else p[d.n] = true;
          setState({ picked: p });
        }
      }))
    )
  );
  container.appendChild(panel);

  const tooNarrow = !!state.drugs && poolSize > 0 && poolSize < state.len;
  container.appendChild(el('div', { class: 'start-row' },
    btn({
      variant: 'accent', size: 'lg', label: 'Start drill',
      disabled: !state.drugs || poolSize === 0,
      onClick: start
    }),
    el('span', { class: 'pool-line', text: state.drugs ? `${poolSize} questions available` : 'Loading the 2026 list…' })
  ));
  if (tooNarrow) {
    container.appendChild(el('div', { class: 'too-narrow', text:
      'That combination has very few questions — widen the focus or the clinical group for a longer run.' }));
  }
}

function renderRun(container) {
  const q = state.qs[state.idx];
  if (!q) return;
  const answered = state.chosen !== null;
  const score = state.answers.filter(a => a.ok).length;
  const total = state.qs.length || 1;
  const progress = Math.round(((state.idx + (answered ? 1 : 0)) / total) * 100) + '%';

  container.appendChild(el('div', { class: 'run-topline' },
    el('span', { text: `Question ${state.idx + 1} / ${state.qs.length}` }),
    el('span', { class: 'score', text: `Score ${score}` })
  ));
  container.appendChild(el('div', { class: 'progress-track' },
    el('div', { class: 'progress-fill', style: `width:${progress}` })
  ));

  container.appendChild(el('div', { class: 'kind-row' },
    badge(q.tone, q.kind),
    el('span', { class: 'group-label', text: q.group })
  ));

  container.appendChild(el('div', { class: 'stem', text: q.stem }));

  if (q.subLines && q.subLines.length) {
    container.appendChild(el('div', { class: 'sub-callout' },
      el('div', { class: 'sub-callout-label', text: q.subLabel }),
      el('div', { class: 'sub-callout-lines' }, q.subLines.map(ln => el('div', { text: ln })))
    ));
  }

  const optionsWrap = el('div', { class: 'options' });
  q.options.forEach((t, i) => {
    let cls = 'option';
    let mark = String.fromCharCode(65 + i);
    if (answered) {
      if (i === q.a) { cls += ' is-correct'; mark = '✓'; }
      else if (i === state.chosen) { cls += ' is-wrong'; mark = '✕'; }
      else { cls += ' is-muted'; }
    }
    optionsWrap.appendChild(el('button', { class: cls, type: 'button', disabled: answered ? '' : null, onclick: () => answer(i) },
      el('span', { class: 'option-mark', text: mark }),
      el('span', { class: 'option-text', text: t })
    ));
  });
  container.appendChild(optionsWrap);

  if (answered) {
    const isCorrect = state.chosen === q.a;
    container.appendChild(el('div', { class: 'answer-panel' },
      el('div', { class: 'answer-panel-inner' },
        el('div', { class: `verdict ${isCorrect ? 'correct' : 'incorrect'}`, text: isCorrect ? 'Correct' : 'Incorrect' }),
        el('div', { class: 'explain', text: q.explain })
      ),
      el('div', { class: 'next-row' },
        btn({ variant: 'primary', size: 'md', label: state.idx >= state.qs.length - 1 ? 'See debrief' : 'Next question', onClick: next })
      )
    ));
  }
}

function renderDone(container) {
  const score = state.answers.filter(a => a.ok).length;
  const total = state.qs.length || 1;
  const pct = Math.round((score / total) * 100);
  const indA = state.answers.filter(a => a.q.kind === 'Indication');
  const ciA = state.answers.filter(a => a.q.kind !== 'Indication');
  const tally = (arr) => (arr.length ? `${arr.filter(a => a.ok).length}/${arr.length}` : '—');
  const wrong = state.answers.filter(a => !a.ok).map(a => ({
    kind: a.q.kind, drug: a.q.drug,
    stem: a.q.subLines && a.q.subLines.length ? a.q.stem + ' — ' + short(a.q.subLines.join(' · '), 120) : a.q.stem,
    chosen: a.q.options[a.chosen], correct: a.q.correct
  }));
  const verdictTitle = pct >= 90 ? 'Sharp.' : pct >= 75 ? 'Solid, with gaps.' : pct >= 50 ? 'Keep drilling.' : 'Back to the list.';

  container.appendChild(sectionHeader('02', 'Debrief', verdictTitle));

  container.appendChild(el('div', { class: 'metric-row' },
    el('div', {}, metric('Score', `${score}/${state.qs.length}`)),
    el('div', {}, metric('Indications', tally(indA))),
    el('div', {}, metric('Contraindications', tally(ciA)))
  ));

  if (wrong.length) {
    container.appendChild(el('div', { class: 'review-heading', text: `Review · ${wrong.length} to revisit` }));
    container.appendChild(el('div', { class: 'review-list' },
      wrong.map(w => el('div', { class: 'review-card' },
        el('div', { class: 'review-kind', text: `${w.kind} · ${w.drug}` }),
        el('div', { class: 'review-stem', text: w.stem }),
        el('div', { class: 'review-answers' },
          el('div', { class: 'review-you' }, el('span', { class: 'tag', text: 'YOU · ' }), w.chosen),
          el('div', { class: 'review-correct' }, el('span', { class: 'tag', text: 'CORRECT · ' }), w.correct)
        )
      ))
    ));
  }

  container.appendChild(el('div', { class: 'done-actions' },
    btn({ variant: 'accent', size: 'md', label: 'New drill', onClick: start }),
    wrong.length ? btn({ variant: 'secondary', size: 'md', label: 'Retry missed', onClick: retryWrong }) : null,
    btn({ variant: 'ghost', size: 'md', label: 'Change focus', onClick: toSetup })
  ));
}

function render() {
  const focused = document.activeElement;
  const wasQueryFocused = focused && focused.tagName === 'INPUT' && focused.closest('.picker-panel');
  const selStart = wasQueryFocused ? focused.selectionStart : null;

  app.innerHTML = '';
  const container = el('div', {});
  if (state.stage === 'setup') renderSetup(container);
  else if (state.stage === 'run' && state.qs[state.idx]) renderRun(container);
  else if (state.stage === 'done') renderDone(container);
  app.appendChild(container);

  if (wasQueryFocused) {
    const input = app.querySelector('.picker-panel input');
    if (input) { input.focus(); input.setSelectionRange(selStart, selStart); }
  }
}

// ---- init -------------------------------------------------------------------

setState({ drugs: dd.getDrugs() });
