// Medication reference — vanilla JS port of the Claude Design prototype
// (project/ECU Drug Study.dc.html). Two views sharing one page: a
// searchable/filterable/expandable drug reference, and a broader quiz across
// dose, route, preparation, repeat, contraindication, presentation and
// indication questions. Question generation and distractor-safety logic are
// ported line-for-line from that prototype's Component class — see
// chats/chat1.md for why each guard exists before changing it.

import * as dd from './drug-data.js';

const OK = 'oklch(0.55 0.11 150)';
const OKBG = 'oklch(0.96 0.03 150)';
const BEST_KEY = 'ecu-drugs-quiz-best';

const app = document.getElementById('app');
const toggleBtns = document.querySelectorAll('#view-toggle button');

let best = null;
try { const b = localStorage.getItem(BEST_KEY); if (b) best = JSON.parse(b); } catch (e) {}

const state = {
  view: 'ref',
  query: '',
  group: 'ALL',
  open: {},
  picked: {},
  drugQuery: '',
  qStage: 'setup',
  qLen: 10,
  qs: [], qIdx: 0, chosen: null, answers: []
};

function setState(patch) {
  Object.assign(state, patch);
  render();
}

// ---- ported helpers ---------------------------------------------------

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; }
  return r;
}
function short(s, n) { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }
function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
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

function filtered() {
  const q = state.query.trim().toLowerCase();
  const g = state.group;
  return dd.getDrugs().filter(d => {
    if (g !== 'ALL' && d.g !== g && d.also !== g) return false;
    if (q && d.blob.indexOf(q) < 0) return false;
    return true;
  });
}

function buildPool(scope) {
  const all = dd.getDrugs();
  const pool = { dose: [], route: [], dilution: [], repeat: [], contra: [], pres: [], ind: [] };
  const allDoses = [], allRoutes = [], allDil = [], allRep = [], allPres = [], allCi = [], allNames = [];
  all.forEach(d => {
    allPres.push({ v: d.p, d: d.n, g: d.g });
    allNames.push({ v: d.n, d: d.n, g: d.g });
    d.ci.forEach(c => { if (c.toLowerCase().indexOf('hypersensitiv') < 0 && c.toLowerCase().indexOf('allerg') < 0 && c.toLowerCase() !== 'nil') allCi.push({ v: c, d: d.n, g: d.g }); });
    d.rows.forEach(r => {
      if (r.d.length) allDoses.push({ v: r.d.join(' / '), d: d.n, g: d.g });
      if (r.r.length) allRoutes.push({ v: r.r.join(' / '), d: d.n, g: d.g });
      if (r.x.length && r.x[0] !== 'N/A') allDil.push({ v: r.x.join(' '), d: d.n, g: d.g });
      if (r.rp.length) allRep.push({ v: r.rp.join(' '), d: d.n, g: d.g });
    });
  });
  // which drugs share a given indication line, normalised — keeps a second equally
  // correct drug out of the "which drug is indicated for this?" answer set
  const indOwners = {};
  all.forEach(d => d.rows.forEach(r => r.i.forEach(l => {
    const k = norm(l); (indOwners[k] = indOwners[k] || []).push(d.n);
  })));
  // distractors never come from the same drug — a sibling row's answer is often equally
  // correct for the same stem. `ban` additionally excludes anything the target drug is
  // ALSO true of, however differently another drug's row spells it.
  const distract = (arr, correct, drug, n, rawBan, group) => {
    const ban = dd.expandBan(rawBan);
    const bad = {}; bad[norm(correct)] = 1;
    ban.forEach(b => { bad[norm(b)] = 1; });
    const banSeq = ban.concat([correct]).map(tok);
    const clash = (str) => { const t = tok(str); return banSeq.some(b => seqIn(b, t) || seqIn(t, b)); };
    const seen = {}; const out = [];
    shuffle(arr).forEach(o => {
      const k = norm(o.v);
      if (o.d === drug || bad[k] || seen[k] || clash(o.v)) return;
      seen[k] = 1;
      out.push(o);
    });
    const L = (correct || '').length;
    out.sort((a, b) => {
      const ga = a.g === group ? 0 : 1, gb = b.g === group ? 0 : 1;
      if (ga !== gb) return ga - gb;
      return Math.abs(a.v.length - L) - Math.abs(b.v.length - L);
    });
    return shuffle(out.slice(0, n + 3)).slice(0, n).map(o => o.v);
  };
  // every indication line each drug owns — lets a candidate be tested against the stem
  const ownInd = {};
  all.forEach(d => {
    const lines = [];
    d.rows.forEach(r => lines.push.apply(lines, r.i));
    ownInd[d.n] = lines;
  });
  // route strings are too short for the containment guard, so compare them as token
  // sets: "IV" and "IV/IO" are both correct for a drug that gives IV and IO
  const routePool = (ownTokens) => allRoutes.filter(o =>
    !o.v.split('/').every(t => ownTokens[t.trim().toUpperCase()])
  );
  const otherNames = (lines, drug) => {
    const bad = { [drug]: 1 };
    lines.forEach(l => (indOwners[norm(l)] || []).forEach(nm => { bad[nm] = 1; }));
    Object.keys(dd.rivalDrugs(lines, drug)).forEach(nm => { bad[nm] = 1; });
    return allNames.filter(o => {
      if (bad[o.v]) return false;
      if (dd.overlaps(lines, ownInd[o.v])) return false;
      return true;
    });
  };
  // five options where the data supports it, four where it doesn't
  const mk = (kind, stem, sub, correct, opts, drug) => {
    if (opts.length < 3) return null;
    const options = shuffle([correct].concat(opts.slice(0, 4)));
    return { kind, stem, sub, correct, options, a: options.indexOf(correct), drug };
  };
  // an explicit drug selection overrides the group scope
  const picks = Object.keys(state.picked).filter(k => state.picked[k]);
  const inScope = picks.length
    ? (d) => !!state.picked[d.n]
    : (d) => scope === 'ALL' || d.g === scope || d.also === scope;
  all.forEach(d => {
    if (!inScope(d)) return;
    let ctx = '';
    const seenQ = {};
    const add = (bucket, q) => {
      if (!q) return;
      const k = q.kind + '|' + q.stem + '|' + q.sub;
      if (seenQ[k]) return;
      seenQ[k] = 1;
      bucket.push(q);
    };
    // continuation rows share the previous row's indication, so each question
    // carries a qualifier built from the row's OTHER columns to stay unambiguous
    const qual = (parts) => { const t = parts.filter(Boolean).join(' · '); return t ? ' · ' + short(t, 70) : ''; };
    // every value this drug uses in each column — none of them can be a wrong answer
    const own = { d: [], r: [], x: [], rp: [], rt: {} };
    d.rows.forEach(r => {
      if (r.d.length) own.d.push(r.d.join(' / '));
      if (r.r.length) own.r.push(r.r.join(' / '));
      r.r.forEach(x => x.split('/').forEach(t => { own.rt[t.trim().toUpperCase()] = 1; }));
      if (r.x.length) own.x.push(r.x.join(' '));
      if (r.rp.length) own.rp.push(r.rp.join(' '));
    });
    d.rows.forEach(r => {
      if (r.i.length) ctx = r.i[0];
      const label = short(ctx, 110);
      if (r.d.length) {
        const c = r.d.join(' / ');
        add(pool.dose, mk('Dose', d.n + ' — what is the dose?', label + qual([r.r.join('/'), r.v.join(' ')]), c, distract(allDoses, c, d.n, 4, own.d, d.g), d.n));
      }
      if (r.r.length && r.d.length) {
        const c = r.r.join(' / ');
        add(pool.route, mk('Route', 'By which route is ' + d.n + ' given here?', label + qual([r.d.join('; ')]), c, distract(routePool(own.rt), c, d.n, 4, own.r, d.g), d.n));
      }
      if (r.x.length && r.x[0] !== 'N/A') {
        const c = r.x.join(' ');
        add(pool.dilution, mk('Preparation', d.n + ' — what is the dilution / preparation note?', label + qual([r.r.join('/'), r.d.join('; ')]), c, distract(allDil, c, d.n, 4, own.x, d.g), d.n));
      }
      if (r.rp.length) {
        const c = r.rp.join(' ');
        add(pool.repeat, mk('Repeat', d.n + ' — what is the repeat regimen?', label + qual([r.r.join('/'), r.d.join('; ') || r.v.join(' ')]), c, distract(allRep, c, d.n, 4, own.rp, d.g), d.n));
      }
    });
    const spec = d.ci.filter(c => c.toLowerCase().indexOf('hypersensitiv') < 0 && c.toLowerCase() !== 'nil');
    if (spec.length) {
      const c = spec[Math.floor(Math.random() * spec.length)];
      const opts = distract(allCi, c, d.n, 4, d.ci, d.g);
      add(pool.contra, mk('Contraindication', 'Which of these is a contraindication to ' + d.n + '?', '', c, opts, d.n));
    }
    add(pool.pres, mk('Presentation', 'How is ' + d.n + ' presented?', '', d.p, distract(allPres, d.p, d.n, 4, [], d.g), d.n));
    const firstInd = d.rows.filter(r => r.i.length)[0];
    if (firstInd) {
      add(pool.ind, mk('Indication', 'Which drug is indicated for this?', short(firstInd.i.join(' · '), 150), d.n, distract(otherNames(firstInd.i, d.n), d.n, d.n, 4, [], d.g), d.n));
    }
  });
  return pool;
}

function sample(pool, n) {
  const buckets = Object.keys(pool).map(k => shuffle(pool[k]));
  const out = [];
  let i = 0;
  while (out.length < n) {
    let added = false;
    for (const b of buckets) { if (b[i]) { out.push(b[i]); added = true; if (out.length >= n) break; } }
    if (!added) break;
    i++;
  }
  return shuffle(out).slice(0, n);
}

function startQuiz() {
  const pool = buildPool(state.group);
  const qs = sample(pool, state.qLen);
  setState({ view: 'quiz', qStage: qs.length ? 'run' : 'setup', qs, qIdx: 0, chosen: null, answers: [] });
}

function answer(i) {
  if (state.chosen !== null) return;
  const q = state.qs[state.qIdx];
  setState({ chosen: i, answers: state.answers.concat([{ q, chosen: i, ok: i === q.a }]) });
}

function next() {
  const last = state.qIdx >= state.qs.length - 1;
  if (last) {
    const score = state.answers.filter(a => a.ok).length;
    const pct = Math.round((score / state.qs.length) * 100);
    if (!best || pct > best.pct) {
      best = { pct, n: state.qs.length };
      try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch (e) {}
    }
    setState({ qStage: 'done' });
  } else {
    setState({ qIdx: state.qIdx + 1, chosen: null });
  }
}

function retryWrong() {
  const qs = shuffle(state.answers.filter(a => !a.ok).map(a => a.q));
  if (qs.length) setState({ qStage: 'run', qs, qIdx: 0, chosen: null, answers: [] });
}

// ---- DOM builders -------------------------------------------------------

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
function badge(tone, label) { return el('span', { class: `badge badge-${tone}`, text: label }); }

// ---- reference view -------------------------------------------------------

function renderRefView(container) {
  const groups = dd.GROUPS || [];
  const picks = Object.keys(state.picked).filter(k => state.picked[k]);
  const items = filtered();

  const searchBar = el('div', { class: 'mref-search-bar' },
    el('div', { class: 'mref-search-inner' },
      el('div', { class: 'mref-search-row' },
        el('div', { class: 'field-wrap' },
          el('span', { class: 'field-label', style: 'margin-bottom:0', text: 'Search the 2026 list' }),
          el('div', { class: 'input-shell' },
            el('input', {
              type: 'text', placeholder: 'Drug, indication, route, dose, contraindication…', value: state.query,
              oninput: (e) => setState({ query: e.target.value })
            })
          )
        ),
        el('div', { class: 'field-none' }, btn({
          variant: 'secondary', size: 'md', label: anyOpen(items) ? 'Collapse all' : 'Expand all',
          onClick: () => {
            if (anyOpen(items)) setState({ open: {} });
            else { const o = {}; items.forEach(d => { o[d.n] = true; }); setState({ open: o }); }
          }
        }))
      ),
      el('div', { class: 'mref-chip-scroll' },
        [{ label: 'All drugs', key: 'ALL' }].concat(groups.map(g => ({ label: dd.SHORT[g] || g, key: g })))
          .map(c => btn({
            variant: state.group === c.key ? 'primary' : 'secondary', size: 'sm', label: c.label,
            onClick: () => setState({ group: c.key, picked: {} })
          }))
      ),
      el('div', { class: 'mref-count-line', text: `${items.length} of ${dd.getDrugs().length} drugs · press / to search` })
    )
  );
  container.appendChild(searchBar);

  const body = el('div', { class: 'mref-body' });
  let prevLetter = '';
  if (!items.length) {
    body.appendChild(el('div', { class: 'mref-empty' },
      el('div', { class: 'mref-empty-kicker', text: 'No match' }),
      el('div', { class: 'mref-empty-body', text: 'Nothing in the 2026 list matches that search.' })
    ));
  }
  items.forEach(d => {
    const letter = d.n.charAt(0).toUpperCase();
    const showLetter = letter !== prevLetter;
    prevLetter = letter;
    if (showLetter) body.appendChild(el('div', { class: 'mref-letter', text: letter }));

    const expanded = !!state.open[d.n];
    const toggle = () => {
      const open = Object.assign({}, state.open);
      open[d.n] = !open[d.n];
      setState({ open });
    };

    const card = el('div', { class: 'mref-card' },
      el('button', { class: 'mref-card-toggle', type: 'button', onclick: toggle },
        el('div', { style: 'flex:1;min-width:0' },
          el('div', { class: 'mref-card-name-row' },
            el('span', { class: 'mref-card-name', text: d.n }),
            el('span', { class: 'mref-card-pack', text: d.p })
          ),
          el('div', { class: 'mref-card-badges' },
            badge('neutral', d.gShort),
            ...d.routes.map(r => badge('outline', r))
          )
        ),
        el('span', { class: `mref-toggle-label ${expanded ? 'open' : 'closed'}`, text: expanded ? 'Close' : 'Detail' })
      )
    );

    if (expanded) {
      const detail = el('div', { class: 'mref-detail' });
      if (d.also) detail.appendChild(el('div', { class: 'mref-also', text: `Also listed under · ${d.also}` }));

      detail.appendChild(el('div', { class: 'mref-ci-box' },
        el('div', { class: 'mref-ci-box-label', text: 'Contraindications' }),
        el('div', { class: 'mref-ci-list' },
          d.ci.map(c => el('div', { class: 'mref-ci-item' },
            el('span', { class: 'mref-ci-dot' }),
            el('span', { class: 'mref-ci-text', text: c })
          ))
        )
      ));

      detail.appendChild(el('div', { class: 'field-label', text: 'Indications & dosing' }));
      const rows = el('div', { class: 'mref-rows' });
      d.rows.forEach(row => {
        if (row.hdr) { rows.appendChild(el('div', { class: 'mref-row-hdr', text: row.hdr })); return; }
        if (!row.body) return;
        const rowBody = el('div', { class: 'mref-row-body' });
        if (row.hasInd) {
          rowBody.appendChild(el('div', { class: 'mref-row-ind' },
            el('div', { class: 'mref-micro-label', text: 'Indication' }),
            ...row.i.map(line => el('div', { class: 'mref-row-ind-line', text: line }))
          ));
        }
        if (row.hasDose) {
          rowBody.appendChild(el('div', { class: 'mref-fields-grid' },
            row.fields.map(f => el('div', { class: 'mref-field-cell' },
              el('div', { class: 'mref-micro-label', text: f.label }),
              ...f.lines.map(ln => el('div', { class: 'mref-field-line', style: `font-size:${f.size};color:${f.color};font-weight:${f.weight}`, text: ln }))
            ))
          ));
        }
        rows.appendChild(rowBody);
      });
      detail.appendChild(rows);
      card.appendChild(detail);
    }

    body.appendChild(card);
  });
  container.appendChild(body);
}

function anyOpen(items) { return items.some(d => !!state.open[d.n]); }

// ---- reference-page quiz view ---------------------------------------------

function renderQuizSetup(container) {
  const groups = dd.GROUPS || [];
  const picks = Object.keys(state.picked).filter(k => state.picked[k]);

  container.appendChild(el('div', { class: 'mrefq-kicker', text: '01 · Set up' }));
  container.appendChild(el('div', { class: 'mrefq-h1', text: 'Test yourself.' }));
  container.appendChild(el('div', { class: 'mrefq-lead', text:
    'Questions are generated from the 2026 list — doses, routes, dilutions, repeat regimens, contraindications, presentations and indications. Every answer is marked immediately.' }));

  container.appendChild(el('div', { class: 'mrefq-label', text: 'Length' }));
  container.appendChild(el('div', { class: 'mrefq-row len' },
    [10, 20, 40].map(n => btn({
      variant: state.qLen === n ? 'primary' : 'secondary', size: 'md', label: `${n} questions`,
      onClick: () => setState({ qLen: n })
    }))
  ));

  container.appendChild(el('div', { class: 'mrefq-label', text: 'Scope' }));
  container.appendChild(el('div', { class: 'mrefq-row scope' },
    [{ label: 'All drugs', key: 'ALL' }].concat(groups.map(g => ({ label: dd.SHORT[g] || g, key: g })))
      .map(c => btn({
        variant: (!picks.length && state.group === c.key) ? 'primary' : 'secondary', size: 'sm', label: c.label,
        onClick: () => setState({ group: c.key, picked: {} })
      }))
  ));

  container.appendChild(el('div', { class: 'picker-heading-row' },
    el('span', { class: 'field-label', style: 'margin-bottom:0', text: 'Or pick individual drugs' }),
    el('span', {
      class: 'pick-line',
      style: `color:${picks.length ? '#B4551E' : '#83888F'}`,
      text: picks.length ? `${picks.length} drug${picks.length === 1 ? '' : 's'} selected · scope ignored` : 'No individual drugs selected · using scope'
    })
  ));

  const dq = state.drugQuery.trim().toLowerCase();
  const drugPicks = dd.getDrugs()
    .filter(d => !dq || d.n.toLowerCase().indexOf(dq) >= 0 || (d.gShort || '').toLowerCase().indexOf(dq) >= 0);

  container.appendChild(el('div', { class: 'picker-panel' },
    el('div', { class: 'picker-controls' },
      el('div', { class: 'field-wrap' }, el('div', { class: 'input-shell' },
        el('input', { type: 'text', placeholder: 'Filter drugs…', value: state.drugQuery, oninput: (e) => setState({ drugQuery: e.target.value }) })
      )),
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
  ));

  container.appendChild(el('div', { class: 'start-row' },
    btn({ variant: 'accent', size: 'lg', label: 'Start quiz', onClick: startQuiz }),
    el('span', { class: 'pool-line', text: best ? `Best · ${best.pct}%` : 'No attempts yet' })
  ));
}

function renderQuizRun(container) {
  const q = state.qs[state.qIdx];
  if (!q) return;
  const answered = state.chosen !== null;
  const score = state.answers.filter(a => a.ok).length;
  const total = state.qs.length || 1;
  const progress = state.qs.length ? Math.round(((state.qIdx + (answered ? 1 : 0)) / total) * 100) + '%' : '0%';

  container.appendChild(el('div', { class: 'mrefq-run-top' },
    el('span', { text: `Question ${state.qIdx + 1} / ${state.qs.length}` }),
    el('span', { class: 'score', text: `Score ${score}` })
  ));
  container.appendChild(el('div', { class: 'mrefq-progress-track' },
    el('div', { class: 'mrefq-progress-fill', style: `width:${progress}` })
  ));

  container.appendChild(el('div', { class: 'mrefq-kind', text: q.kind }));
  container.appendChild(el('div', { class: 'mrefq-stem', text: q.stem }));
  if (q.sub) container.appendChild(el('div', { class: 'mrefq-sub', text: q.sub }));

  const optionsWrap = el('div', { class: 'mrefq-options' });
  q.options.forEach((t, i) => {
    let cls = 'mrefq-option';
    let mark = String.fromCharCode(65 + i);
    if (answered) {
      if (i === q.a) { cls += ' is-correct'; mark = 'OK'; }
      else if (i === state.chosen) { cls += ' is-wrong'; mark = 'X'; }
      else { cls += ' is-muted'; }
    }
    optionsWrap.appendChild(el('button', { class: cls, type: 'button', disabled: answered ? '' : null, onclick: () => answer(i) },
      el('span', { class: 'mrefq-option-mark', text: mark }),
      el('span', { class: 'mrefq-option-text', text: t })
    ));
  });
  container.appendChild(optionsWrap);

  if (answered) {
    const isCorrect = state.chosen === q.a;
    container.appendChild(el('div', { class: 'mrefq-answered-row' },
      btn({ variant: 'primary', size: 'lg', label: state.qIdx >= state.qs.length - 1 ? 'See result' : 'Next question', onClick: next }),
      el('span', { class: 'mrefq-verdict', style: `color:${isCorrect ? OK : '#B4551E'}`, text: isCorrect ? 'Correct' : 'Incorrect' })
    ));
    container.appendChild(el('div', { class: 'mrefq-source', text: `Correct answer · ${q.correct}` }));
  }
}

function renderQuizDone(container) {
  const score = state.answers.filter(a => a.ok).length;
  const total = state.qs.length || 1;
  const pct = state.qs.length ? Math.round((score / total) * 100) : 0;
  const wrong = state.answers.filter(a => !a.ok).map(a => ({
    kind: a.q.kind, drug: a.q.drug, stem: a.q.stem, chosen: a.q.options[a.chosen], correct: a.q.correct
  }));
  const verdict = pct >= 90 ? 'Exam ready' : pct >= 75 ? 'Solid' : pct >= 50 ? 'Keep drilling' : 'Back to the list';

  container.appendChild(el('div', { class: 'mrefq-kicker', text: '02 · Result' }));
  container.appendChild(el('div', { class: 'mrefq-result-row' },
    el('span', { class: 'mrefq-result-score', text: `${score}/${state.qs.length}` }),
    el('span', { class: 'mrefq-result-line', text: `${pct}% · ${verdict}` })
  ));

  if (wrong.length) {
    container.appendChild(el('div', { class: 'mrefq-review-heading', text: `Review · ${wrong.length} to revisit` }));
    container.appendChild(el('div', { class: 'mrefq-review-list' },
      wrong.map(w => el('div', { class: 'mrefq-review-card' },
        el('div', { class: 'mrefq-review-kind', text: `${w.kind} · ${w.drug}` }),
        el('div', { class: 'mrefq-review-stem', text: w.stem }),
        el('div', { class: 'mrefq-review-answers' },
          el('div', { class: 'mrefq-review-you' }, el('span', { class: 'tag', text: 'YOU · ' }), w.chosen),
          el('div', { class: 'mrefq-review-correct' }, el('span', { class: 'tag', text: 'CORRECT · ' }), w.correct)
        )
      ))
    ));
  }

  container.appendChild(el('div', { class: 'mrefq-actions' },
    btn({ variant: 'accent', size: 'lg', label: 'New quiz', onClick: startQuiz }),
    wrong.length ? btn({ variant: 'secondary', size: 'lg', label: 'Retry missed', onClick: retryWrong }) : null,
    btn({ variant: 'ghost', size: 'lg', label: 'Back to reference', onClick: () => setState({ view: 'ref' }) })
  ));
}

function renderQuizView(container) {
  const body = el('div', { class: 'mrefq-body' });
  if (state.qStage === 'setup') renderQuizSetup(body);
  else if (state.qStage === 'run' && state.qs[state.qIdx]) renderQuizRun(body);
  else if (state.qStage === 'done') renderQuizDone(body);
  container.appendChild(body);
}

// ---- render ---------------------------------------------------------------

function render() {
  toggleBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.view === state.view);
  });

  const focused = document.activeElement;
  const isTracked = focused && focused.tagName === 'INPUT' && app.contains(focused);
  const selStart = isTracked ? focused.selectionStart : null;
  const focusedClass = isTracked ? focused.closest('.mref-search-row, .picker-panel') : null;
  const marker = focusedClass ? (focusedClass.classList.contains('picker-panel') ? '.picker-panel input' : '.mref-search-row input') : null;

  app.innerHTML = '';
  const container = el('div', {});
  if (state.view === 'ref') renderRefView(container);
  else renderQuizView(container);
  app.appendChild(container);

  if (marker) {
    const input = app.querySelector(marker);
    if (input) { input.focus(); input.setSelectionRange(selStart, selStart); }
  }
}

// ---- init -------------------------------------------------------------------

toggleBtns.forEach(b => {
  b.addEventListener('click', () => {
    const view = b.dataset.view;
    setState(view === 'quiz' ? { view: 'quiz', qStage: 'setup' } : { view: 'ref' });
  });
});

window.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    const i = document.querySelector('input');
    if (i) i.focus();
  }
});

render();
