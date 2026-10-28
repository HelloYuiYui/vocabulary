// ---------- storage (per viewer, optional) ----------
const STORE = "cahier-vocab-v1";
function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
function save(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) {} }
let saved = load();
saved.review = saved.review || [];
saved.scores = saved.scores || {};
saved.mode = saved.mode || "cards";

// ---------- answers and gender ----------
function parseAns(a) { const i = a.lastIndexOf(":"); return /:[mf]$/.test(a) ? { text: a.slice(0, i), g: a.slice(i + 1) } : { text: a, g: null }; }
const norm = s => s.toLowerCase().replace(/[’`ʼ]/g, "'").replace(/[-‑–]/g, " ")
  .replace(/[.,!?;:«»"()]/g, " ").replace(/\s+/g, " ").trim();
const bare = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const ART = /^(l'|le |la |les |un |une |des |du |de la |de l')/;
const noArt = s => s.replace(ART, "").trim();
const hidesGender = input => /^(l'|les )/.test(norm(input));

// Returns { kind, ans } where ans is the matched or main answer.
function grade(input, gender, list) {
  const answers = list.map(parseAns);
  const n = norm(input);
  if (!n) return { kind: "empty", ans: answers[0] };
  const withGender = (a, base) => {
    if (!a.g || !hidesGender(input)) return { kind: base, ans: a };
    if (!gender) return { kind: "gender-missing", ans: a };
    if (gender !== a.g) return { kind: "gender", ans: a };
    return { kind: base, ans: a };
  };
  for (const a of answers) if (norm(a.text) === n) return withGender(a, "ok");
  for (const a of answers) if (bare(norm(a.text)) === bare(n)) return withGender(a, "accent");
  // "un escalier" for "l'escalier": the indefinite article shows the gender
  const ind = bare(n).match(/^(un|une) (.+)$/);
  if (ind) for (const a of answers) if (a.g && noArt(bare(norm(a.text))) === ind[2])
    return { kind: (ind[1] === "un" ? "m" : "f") === a.g ? "elision" : "gender", ans: a };
  const nb = noArt(bare(n));
  for (const a of answers) if (noArt(bare(norm(a.text))) === nb) return { kind: "article", ans: a };
  return { kind: "bad", ans: answers[0] };
}
const OK_KINDS = ["ok", "accent", "elision"];
const VERDICT = {
  ok: ["ok", "Juste !"],
  accent: ["ok", "Juste, mais attention aux accents."],
  elision: ["ok", "Juste, et le genre est bon. Avec l'article défini, on écrit :"],
  "gender-missing": ["near", "Presque : l'article ne montre pas le genre, choisis masculin ou féminin."],
  gender: ["near", "Presque : le mot est bon, mais pas le genre."],
  article: ["near", "Presque : vérifie l'article ou le genre."],
  bad: ["bad", "Pas tout à fait."],
  dunno: ["bad", "Voici la réponse."],
  empty: ["bad", "Pas de réponse."]
};

// ---------- DOM helpers ----------
const $ = id => document.getElementById(id);
const show = (id, on) => { $(id).hidden = !on; };
function esc(s) { return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
const gChip = g => g ? `<span class="g ${g}" title="${g === "m" ? "masculin" : "féminin"}">${g === "m" ? "masc." : "fém."}</span>` : "";
const frHTML = a => { const p = typeof a === "string" ? parseAns(a) : a; return esc(p.text) + gChip(p.g); };
const frPlain = a => { const p = parseAns(a); return p.text + (p.g ? ` (${p.g}.)` : ""); };
const keyOf = (t, it) => t.id + "|" + it.en;
function findItem(key) {
  const cut = key.indexOf("|"), t = THEMES.find(x => x.id === key.slice(0, cut)); if (!t) return null;
  const it = t.items.find(x => x.en === key.slice(cut + 1)); return it ? { theme: t, item: it } : null;
}
function verdictHTML(res, item, withOverride) {
  const [cls, label] = VERDICT[res.kind];
  const ok = OK_KINDS.includes(res.kind);
  const others = item.fr.map(parseAns).filter(a => a.text !== res.ans.text);
  return `<div class="verdict ${cls}">
    <span class="tag">${label}</span>
    ${res.kind === "ok" ? "" : `<span class="correction">${frHTML(res.ans)}</span>`}
    ${res.kind === "ok" && res.ans.g ? `<span class="alts">${frHTML(res.ans)}</span>` : ""}
    ${others.length ? `<span class="alts">Aussi accepté : ${others.map(frHTML).join(" · ")}</span>` : ""}
    ${item.note ? `<span class="note">${esc(item.note)}</span>` : ""}
    ${withOverride && !ok && res.kind !== "dunno" && res.kind !== "empty" ? `<span class="actions"><button class="ghost override">En fait, ma réponse était juste</button></span>` : ""}
  </div>`;
}
function gpickHTML(id) {
  return `<span class="gpick" id="gp-${id}" hidden>
    <label><input type="radio" name="g-${id}" value="m" id="g-${id}-m">masc.</label>
    <label><input type="radio" name="g-${id}" value="f" id="g-${id}-f">fém.</label></span>`;
}
const pickedGender = id => (document.querySelector(`input[name="g-${id}"]:checked`) || {}).value || null;
function wireGender(input, id) {
  const sync = () => { $("gp-" + id).hidden = !hidesGender(input.value); };
  input.addEventListener("input", sync); sync();
}

// ---------- home ----------
const selected = new Set();
function setMode(m) {
  saved.mode = m; save(saved);
  $("modeCards").setAttribute("aria-pressed", String(m === "cards"));
  $("modeList").setAttribute("aria-pressed", String(m === "list"));
}
$("modeCards").addEventListener("click", () => setMode("cards"));
$("modeList").addEventListener("click", () => setMode("list"));

function renderHome() {
  setMode(saved.mode);
  const grid = $("grid"); grid.innerHTML = "";
  THEMES.forEach(t => {
    const card = document.createElement("article");
    card.className = "theme" + (selected.has(t.id) ? " selected" : "");
    const last = saved.scores[t.id];
    card.innerHTML = `
      <div class="theme-top">
        <input type="checkbox" id="t-${t.id}" ${selected.has(t.id) ? "checked" : ""}>
        <label for="t-${t.id}"><h3>${esc(t.name)}</h3><p class="desc">${esc(t.desc)}</p></label>
        <span class="level">${t.level}</span>
      </div>
      <div class="meta">
        <span>${t.items.length} mots et phrases${last ? " · dernier score " + last : ""}</span>
        <button class="ghost" id="list-${t.id}" aria-expanded="false">Voir les mots</button>
      </div>
      <ul class="wordlist" id="wl-${t.id}" hidden>
        ${t.items.map(it => `<li><span>${esc(it.en)}</span><span class="fr">${frHTML(it.fr[0])}</span></li>`).join("")}
      </ul>`;
    grid.appendChild(card);
    card.querySelector("input").addEventListener("change", e => {
      e.target.checked ? selected.add(t.id) : selected.delete(t.id);
      card.classList.toggle("selected", e.target.checked); updateSel();
    });
    const lb = card.querySelector(`#list-${t.id}`);
    lb.addEventListener("click", () => {
      const wl = $("wl-" + t.id); wl.hidden = !wl.hidden;
      lb.textContent = wl.hidden ? "Voir les mots" : "Cacher les mots";
      lb.setAttribute("aria-expanded", String(!wl.hidden));
    });
  });
  updateSel();
  const rc = saved.review.filter(findItem).length;
  $("reviewCount").textContent = rc; show("reviewBand", rc > 0);
}
function updateSel() {
  const n = selected.size;
  const total = THEMES.filter(t => selected.has(t.id)).reduce((s, t) => s + t.items.length, 0);
  $("selCount").textContent = n ? `${n} thème${n > 1 ? "s" : ""} · ${total} questions` : "Aucun thème choisi";
  $("startBtn").disabled = n === 0;
}

// ---------- session ----------
let deck = [], results = [], label = "", runMode = "cards";
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function start(entries, name) {
  runMode = saved.mode; label = name; results = [];
  show("home", false); show("results", false);
  if (runMode === "list") startList(entries); else startCards(entries);
}

// ---------- one at a time ----------
let idx = 0, current = null;
function startCards(entries) {
  deck = shuffle(entries.slice()); idx = 0;
  show("list", false); show("quiz", true);
  ask();
}
wireGender($("answer"), "q");
function ask() {
  current = deck[idx];
  $("quizTheme").textContent = label === "mix" ? current.theme.name : label;
  $("progress").textContent = `${idx + 1} / ${deck.length}`;
  $("barFill").style.width = (idx / deck.length * 100) + "%";
  $("prompt").textContent = current.item.en;
  $("answerHint").textContent = /^(the|a|an) /i.test(current.item.en) ? "Ta réponse, avec l'article" : "Ta réponse";
  const a = $("answer"); a.value = ""; a.disabled = false;
  ["g-q-m", "g-q-f"].forEach(id => { $(id).checked = false; $(id).disabled = false; });
  $("gp-q").hidden = true;
  show("askActions", true); show("verdict", false); show("nextActions", false);
  a.focus();
}
function revealCard(res) {
  results.push({ ...current, kind: res.kind, ok: OK_KINDS.includes(res.kind), ans: res.ans,
    given: res.kind === "dunno" ? "" : $("answer").value.trim(), givenG: res.kind === "dunno" ? null : pickedGender("q") });
  const v = $("verdict"); v.innerHTML = verdictHTML(res, current.item, false); v.hidden = false;
  $("answer").disabled = true; ["g-q-m", "g-q-f"].forEach(id => $(id).disabled = true);
  show("askActions", false); show("nextActions", true);
  show("overrideBtn", !OK_KINDS.includes(res.kind) && res.kind !== "dunno");
  $("nextBtn").focus();
}
function next() { idx++; if (idx >= deck.length) finish(); else ask(); }
$("answerForm").addEventListener("submit", e => {
  e.preventDefault();
  if ($("askActions").hidden) return;
  if (!norm($("answer").value)) { $("answer").focus(); return; }
  revealCard(grade($("answer").value, pickedGender("q"), current.item.fr));
});
$("dunnoBtn").addEventListener("click", () => revealCard({ kind: "dunno", ans: parseAns(current.item.fr[0]) }));
$("nextBtn").addEventListener("click", next);
$("overrideBtn").addEventListener("click", () => { const r = results[results.length - 1]; r.ok = true; r.kind = "ok"; next(); });
$("quitBtn").addEventListener("click", finish);
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && !$("quiz").hidden && !$("nextActions").hidden && document.activeElement !== $("overrideBtn")) {
    e.preventDefault(); next();
  }
});

// ---------- list ----------
let rows = [];
function startList(entries) {
  show("quiz", false); show("list", true);
  rows = entries.map((e, i) => ({ ...e, i, res: null, ok: false }));
  const groups = [];
  rows.forEach(r => { let g = groups.find(x => x.theme === r.theme); if (!g) groups.push(g = { theme: r.theme, rows: [] }); g.rows.push(r); });
  let n = 0;
  $("listBody").innerHTML = groups.map(g => `
    ${groups.length > 1 || label === "mix" ? `<p class="group-title">${esc(g.theme.name)}</p>` : `<p class="group-title">${esc(label)}</p>`}
    <ol class="rows">${g.rows.map(r => `
      <li class="row" id="row-${r.i}">
        <span class="num">${++n}.</span>
        <div class="row-main">
          <label class="row-en" for="in-${r.i}">${esc(r.item.en)}</label>
          <div class="field">
            <input type="text" id="in-${r.i}" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="…">
            ${gpickHTML(r.i)}
          </div>
          <div class="row-verdict" id="rv-${r.i}" hidden></div>
        </div>
      </li>`).join("")}</ol>`).join("");
  rows.forEach(r => {
    const input = $("in-" + r.i);
    wireGender(input, r.i);
    $("row-" + r.i).addEventListener("keydown", e => {
      if (e.key !== "Enter" || r.res) return;
      e.preventDefault(); checkRow(r);
      const nextRow = rows.find(x => x.i > r.i && !x.res); if (nextRow) $("in-" + nextRow.i).focus();
    });
  });
  updateListProgress();
  $("checkAll").disabled = false;
  $("in-0") && $("in-0").focus();
}
function checkRow(r) {
  const input = $("in-" + r.i);
  r.res = grade(input.value, pickedGender(r.i), r.item.fr);
  r.ok = OK_KINDS.includes(r.res.kind);
  input.disabled = true;
  document.querySelectorAll(`input[name="g-${r.i}"]`).forEach(x => x.disabled = true);
  const rv = $("rv-" + r.i); rv.innerHTML = verdictHTML(r.res, r.item, true); rv.hidden = false;
  const ob = rv.querySelector(".override");
  if (ob) ob.addEventListener("click", () => {
    r.ok = true; r.res = { kind: "ok", ans: r.res.ans };
    rv.innerHTML = verdictHTML(r.res, r.item, false);
    if (!$("results").hidden) finish();
  });
  updateListProgress();
}
function updateListProgress() {
  const done = rows.filter(r => r.res).length, right = rows.filter(r => r.ok).length;
  $("listProgress").textContent = `${done} / ${rows.length} corrigées · ${right} justes`;
  if (done === rows.length && rows.length) { $("checkAll").disabled = true; finish(); }
}
$("checkAll").addEventListener("click", () => { rows.filter(r => !r.res).forEach(checkRow); });
$("listBack").addEventListener("click", goHome);

// ---------- results ----------
let missedList = [];
function finish() {
  if (runMode === "list") {
    results = rows.filter(r => r.res).map(r => ({ theme: r.theme, item: r.item, kind: r.res.kind, ok: r.ok, ans: r.res.ans,
      given: $("in-" + r.i).value.trim(), givenG: pickedGender(r.i) }));
  } else {
    show("quiz", false);
  }
  show("results", true);
  const done = results.length, right = results.filter(r => r.ok).length;
  $("score").innerHTML = `${right}<small> / ${done}</small>`;
  $("scoreLine").textContent = done === 0 ? "Aucune réponse cette fois."
    : right === done ? "Sans faute. Ce thème est acquis, passe au suivant."
    : right / done >= 0.7 ? "Bonne base. Garde les mots ci-dessous dans ta liste."
    : "Ce thème mérite une session de plus. Commence par les mots ci-dessous.";

  const rev = new Set(saved.review);
  results.forEach(r => { const k = keyOf(r.theme, r.item); r.ok ? rev.delete(k) : rev.add(k); });
  saved.review = [...rev];
  const total = runMode === "list" ? rows.length : deck.length;
  if (label !== "mix" && done === total && done) saved.scores[results[0].theme.id] = `${right}/${done}`;
  save(saved);

  missedList = results.filter(r => !r.ok);
  $("missed").innerHTML = results.map(r => {
    const correct = r.ans || parseAns(r.item.fr[0]);
    const given = r.ok || !r.given ? "" :
      `<span class="given">${esc(r.given)}${r.givenG && hidesGender(r.given) ? " " + (r.givenG === "m" ? "masc." : "fém.") : ""}</span>`;
    return `<li><span>${esc(r.item.en)}</span><span class="fr ${r.ok ? "right" : ""}">${frHTML(correct)}${given}</span></li>`;
  }).join("");
  show("missedWrap", results.length > 0);
  show("againBtn", missedList.length > 0);
  show("copyBtn", missedList.length > 0);
  show("copied", false); show("copybox", false);
  if (runMode === "list") $("results").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
function goHome() { ["quiz", "list", "results"].forEach(id => show(id, false)); show("home", true); renderHome(); }
$("againBtn").addEventListener("click", () => start(missedList.map(r => ({ theme: r.theme, item: r.item })), "mix"));
$("homeBtn").addEventListener("click", goHome);
$("copyBtn").addEventListener("click", () => {
  const text = missedList.map(r => `${r.item.en}\t${frPlain(r.item.fr[0])}`).join("\n");
  const fallback = () => { const b = $("copybox"); b.value = text; show("copybox", true); b.focus(); b.select(); };
  try { navigator.clipboard.writeText(text).then(() => show("copied", true), fallback); } catch (e) { fallback(); }
});

$("startBtn").addEventListener("click", () => {
  const ts = THEMES.filter(t => selected.has(t.id));
  start(ts.flatMap(t => t.items.map(item => ({ theme: t, item }))), ts.length === 1 ? ts[0].name : "mix");
});
$("reviewStart").addEventListener("click", () => start(saved.review.map(findItem).filter(Boolean), "mix"));
$("reviewClear").addEventListener("click", () => { saved.review = []; save(saved); renderHome(); });

renderHome();
