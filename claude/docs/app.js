const STORAGE_KEY = "ccaq.lastFilters.v1";

const els = {
  views: {
    filters: document.getElementById("view-filters"),
    quiz: document.getElementById("view-quiz"),
    summary: document.getElementById("view-summary"),
  },
  form: document.getElementById("filter-form"),
  domain: document.getElementById("domain"),
  topic: document.getElementById("topic"),
  count: document.getElementById("count"),
  filterInfo: document.getElementById("filter-info"),
  progress: document.getElementById("progress"),
  card: document.getElementById("card"),
  next: document.getElementById("next"),
  quit: document.getElementById("quit"),
  summaryScore: document.getElementById("summary-score"),
  summaryMisses: document.getElementById("summary-misses"),
  restart: document.getElementById("restart"),
};

let data = null;
let pools = null;
let session = null;

(async function init() {
  try {
    const res = await fetch("./notes.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    els.filterInfo.textContent = `Failed to load notes.json: ${err.message}`;
    els.filterInfo.classList.add("error");
    return;
  }
  pools = buildPools(data);
  populateDomain();
  populateTopic("all");
  restoreFilters();
  updateFilterInfo();
  wireEvents();
})();

function buildPools(data) {
  const antiPatterns = [];
  const thingsToKnow = [];
  const topics = [];
  for (const part of data.parts) {
    const meta = { part: part.part, domain: part.domain, topic: part.topic };
    topics.push(meta);
    for (const ap of part.anti_patterns) {
      antiPatterns.push({ ...meta, name: ap.name, explanation: ap.explanation });
    }
    for (const ttk of part.things_to_know) {
      thingsToKnow.push({ ...meta, text: ttk });
    }
  }
  return { antiPatterns, thingsToKnow, topics };
}

function populateDomain() {
  for (const d of data.domains) {
    const opt = document.createElement("option");
    opt.value = String(d.id);
    opt.textContent = `Domain ${d.id} — ${d.name}`;
    els.domain.append(opt);
  }
}

function populateTopic(domainValue) {
  const current = els.topic.value;
  els.topic.innerHTML = '<option value="all">All topics in domain</option>';
  const filtered = domainValue === "all"
    ? pools.topics
    : pools.topics.filter(t => String(t.domain) === domainValue);
  for (const t of filtered) {
    const opt = document.createElement("option");
    opt.value = `part-${t.part}`;
    opt.textContent = `Part ${t.part} — ${t.topic}`;
    els.topic.append(opt);
  }
  if ([...els.topic.options].some(o => o.value === current)) {
    els.topic.value = current;
  } else {
    els.topic.value = "all";
  }
}

function selectedModes() {
  return [...document.querySelectorAll('input[name="mode"]:checked')].map(i => i.value);
}

function readFilters() {
  return {
    domain: els.domain.value,
    topic: els.topic.value,
    modes: selectedModes(),
    count: els.count.value,
  };
}

function applyFilters(filters) {
  const inScope = (item) => {
    if (filters.domain !== "all" && String(item.domain) !== filters.domain) return false;
    if (filters.topic !== "all" && `part-${item.part}` !== filters.topic) return false;
    return true;
  };
  return {
    antiPatterns: pools.antiPatterns.filter(inScope),
    thingsToKnow: pools.thingsToKnow.filter(inScope),
    topics: pools.topics.filter(inScope),
  };
}

function updateFilterInfo() {
  const f = readFilters();
  const scoped = applyFilters(f);
  const apWithFix = scoped.antiPatterns.filter(a => a.explanation);
  const counts = [];
  if (f.modes.includes("apFix") || f.modes.includes("fixAp")) counts.push(`${apWithFix.length} anti-patterns with fixes`);
  if (f.modes.includes("ttkTopic")) counts.push(`${scoped.thingsToKnow.length} things-to-know`);
  if (f.modes.includes("flash")) counts.push(`${scoped.antiPatterns.length + scoped.thingsToKnow.length} flashcards`);
  els.filterInfo.classList.remove("error");
  els.filterInfo.textContent = counts.length
    ? `Available in scope: ${counts.join(" · ")}`
    : "Pick at least one mode.";
}

function wireEvents() {
  els.domain.addEventListener("change", () => {
    populateTopic(els.domain.value);
    updateFilterInfo();
  });
  els.topic.addEventListener("change", updateFilterInfo);
  els.count.addEventListener("change", updateFilterInfo);
  document.querySelectorAll('input[name="mode"]').forEach(i => i.addEventListener("change", updateFilterInfo));
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    startSession();
  });
  els.next.addEventListener("click", nextQuestion);
  els.quit.addEventListener("click", endSession);
  els.restart.addEventListener("click", () => showView("filters"));
}

function showView(name) {
  for (const [k, el] of Object.entries(els.views)) {
    el.classList.toggle("hidden", k !== name);
  }
}

function restoreFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return;
    if (saved.domain && [...els.domain.options].some(o => o.value === saved.domain)) {
      els.domain.value = saved.domain;
      populateTopic(saved.domain);
    }
    if (saved.topic && [...els.topic.options].some(o => o.value === saved.topic)) {
      els.topic.value = saved.topic;
    }
    if (saved.count) els.count.value = saved.count;
    if (Array.isArray(saved.modes)) {
      document.querySelectorAll('input[name="mode"]').forEach(i => {
        i.checked = saved.modes.includes(i.value);
      });
    }
  } catch { /* ignore */ }
}

function saveFilters(f) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); } catch { /* ignore */ }
}

function startSession() {
  const filters = readFilters();
  saveFilters(filters);
  if (filters.modes.length === 0) {
    els.filterInfo.textContent = "Pick at least one mode.";
    els.filterInfo.classList.add("error");
    return;
  }
  const scoped = applyFilters(filters);
  const questions = buildQuestions(filters, scoped);
  if (questions.length === 0) {
    els.filterInfo.textContent = "No questions available in this scope. Loosen filters or change modes.";
    els.filterInfo.classList.add("error");
    return;
  }
  session = { filters, questions, idx: 0, answers: [], modes: filters.modes };
  showView("quiz");
  renderQuestion();
}

function buildQuestions(filters, scoped) {
  const targetCount = filters.count === "all" ? Infinity : Number(filters.count);
  const available = [];
  for (const mode of filters.modes) {
    const generated = generateAll(mode, scoped);
    available.push(...generated);
  }
  shuffle(available);
  return targetCount === Infinity ? available : available.slice(0, targetCount);
}

function generateAll(mode, scoped) {
  const list = [];
  if (mode === "apFix" || mode === "fixAp") {
    const withFix = scoped.antiPatterns.filter(a => a.explanation);
    for (const ap of withFix) {
      const q = buildAntiPatternQuestion(mode, ap, scoped);
      if (q) list.push(q);
    }
  } else if (mode === "ttkTopic") {
    for (const ttk of scoped.thingsToKnow) {
      const q = buildTtkTopicQuestion(ttk, scoped);
      if (q) list.push(q);
    }
  } else if (mode === "flash") {
    for (const ap of scoped.antiPatterns) {
      if (ap.explanation) list.push({ mode: "flash", front: ap.name, back: ap.explanation, source: ap });
    }
    for (const ttk of scoped.thingsToKnow) {
      list.push({ mode: "flash", front: ttk.text, back: `Part ${ttk.part} — ${ttk.topic}`, source: ttk });
    }
  }
  return list;
}

function buildAntiPatternQuestion(mode, correct, scoped) {
  const sameDomainPool = pools.antiPatterns
    .filter(a => a.explanation && a !== correct && a.domain === correct.domain
                 && a.explanation !== correct.explanation && a.name !== correct.name);
  const globalPool = pools.antiPatterns
    .filter(a => a.explanation && a !== correct
                 && a.explanation !== correct.explanation && a.name !== correct.name);

  const distractorField = mode === "apFix" ? "explanation" : "name";
  const seen = new Set([correct[distractorField]]);
  const distractors = [];

  for (const candidate of shuffleClone(sameDomainPool)) {
    if (distractors.length === 3) break;
    if (seen.has(candidate[distractorField])) continue;
    seen.add(candidate[distractorField]);
    distractors.push(candidate);
  }
  for (const candidate of shuffleClone(globalPool)) {
    if (distractors.length === 3) break;
    if (seen.has(candidate[distractorField])) continue;
    seen.add(candidate[distractorField]);
    distractors.push(candidate);
  }
  if (distractors.length < 3) return null;

  const choices = [correct, ...distractors];
  shuffle(choices);
  return {
    mode,
    stem: mode === "apFix" ? correct.name : correct.explanation,
    stemLabel: mode === "apFix" ? "Which fix matches this anti-pattern?" : "Which anti-pattern matches this fix?",
    choices: choices.map(c => mode === "apFix" ? c.explanation : c.name),
    correctIdx: choices.indexOf(correct),
    source: correct,
  };
}

function buildTtkTopicQuestion(correct, scoped) {
  const otherTopics = pools.topics.filter(t => t.part !== correct.part);
  if (otherTopics.length < 3) return null;
  const sameDomainTopics = otherTopics.filter(t => t.domain === correct.domain);
  const seen = new Set([correct.part]);
  const distractors = [];
  for (const t of shuffleClone(sameDomainTopics)) {
    if (distractors.length === 3) break;
    if (seen.has(t.part)) continue;
    seen.add(t.part);
    distractors.push(t);
  }
  for (const t of shuffleClone(otherTopics)) {
    if (distractors.length === 3) break;
    if (seen.has(t.part)) continue;
    seen.add(t.part);
    distractors.push(t);
  }
  if (distractors.length < 3) return null;
  const choices = [{ part: correct.part, domain: correct.domain, topic: correct.topic }, ...distractors];
  shuffle(choices);
  return {
    mode: "ttkTopic",
    stem: correct.text,
    stemLabel: "Which topic does this statement belong to?",
    choices: choices.map(c => `Part ${c.part} — ${c.topic}`),
    correctIdx: choices.findIndex(c => c.part === correct.part),
    source: correct,
  };
}

function renderQuestion() {
  const q = session.questions[session.idx];
  els.progress.textContent = `Question ${session.idx + 1} of ${session.questions.length}`;
  els.next.disabled = true;
  els.next.textContent = session.idx === session.questions.length - 1 ? "Finish" : "Next";
  if (q.mode === "flash") {
    renderFlash(q);
  } else {
    renderMcq(q);
  }
}

function renderMcq(q) {
  els.card.innerHTML = "";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = q.stemLabel;
  const stem = document.createElement("p");
  stem.className = "stem";
  stem.textContent = q.stem;
  const ul = document.createElement("ul");
  ul.className = "choices";
  q.choices.forEach((text, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    btn.addEventListener("click", () => onAnswer(i, btn, ul));
    li.append(btn);
    ul.append(li);
  });
  const feedback = document.createElement("div");
  feedback.className = "feedback";
  feedback.id = "feedback";
  els.card.append(meta, stem, ul, feedback);
}

function onAnswer(pickedIdx, pickedBtn, list) {
  const q = session.questions[session.idx];
  const correct = pickedIdx === q.correctIdx;
  session.answers.push({ q, pickedIdx, correct });
  [...list.querySelectorAll("button")].forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correctIdx) btn.classList.add("correct");
    else if (i === pickedIdx) btn.classList.add("incorrect");
  });
  const feedback = document.getElementById("feedback");
  feedback.classList.add(correct ? "good" : "bad");
  const src = q.source;
  const src_label = `Part ${src.part} — ${src.topic}`;
  feedback.textContent = correct ? `Correct. (${src_label})` : `Not quite. Answer: ${q.choices[q.correctIdx]} — ${src_label}`;
  els.next.disabled = false;
}

function renderFlash(q) {
  els.card.innerHTML = "";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = "Flashcard";
  const stem = document.createElement("p");
  stem.className = "stem";
  stem.textContent = q.front;
  const flipBtn = document.createElement("button");
  flipBtn.type = "button";
  flipBtn.textContent = "Reveal";
  flipBtn.addEventListener("click", () => {
    flipBtn.remove();
    const back = document.createElement("div");
    back.className = "flash-back";
    const bm = document.createElement("div");
    bm.className = "meta";
    bm.textContent = q.front === q.source.text ? "Topic" : "Explanation";
    const bp = document.createElement("p");
    bp.className = "stem";
    bp.textContent = q.back;
    back.append(bm, bp);
    els.card.append(back);
    els.next.disabled = false;
  });
  els.card.append(meta, stem, flipBtn);
  // flashcards are not scored; mark as "answered" so summary count matches
  session.answers.push({ q, pickedIdx: null, correct: null });
}

function nextQuestion() {
  // for flash we already pushed an answer when rendering; for mcq we pushed on answer
  if (session.idx === session.questions.length - 1) {
    endSession();
    return;
  }
  session.idx += 1;
  renderQuestion();
}

function endSession() {
  // for flash mode, the answer push happens at render time, so trim if user quit mid-render
  const total = session.answers.length;
  const graded = session.answers.filter(a => a.correct !== null);
  const correctCount = graded.filter(a => a.correct).length;
  const misses = graded.filter(a => !a.correct);

  els.summaryScore.classList.remove("good", "bad");
  if (graded.length > 0) {
    const pct = Math.round(100 * correctCount / graded.length);
    els.summaryScore.textContent = `Score: ${correctCount}/${graded.length} (${pct}%)`;
    els.summaryScore.classList.add(pct >= 70 ? "good" : "bad");
  } else {
    els.summaryScore.textContent = `Flashcards reviewed: ${total}`;
  }

  els.summaryMisses.innerHTML = "";
  if (misses.length > 0) {
    const h = document.createElement("h3");
    h.textContent = "Missed questions";
    els.summaryMisses.append(h);
    for (const m of misses) {
      const wrap = document.createElement("div");
      wrap.className = "miss";
      const stem = document.createElement("div");
      stem.className = "miss-stem";
      stem.textContent = m.q.stem;
      const picked = document.createElement("div");
      picked.className = "miss-picked";
      picked.textContent = `Your answer: ${m.q.choices[m.pickedIdx]}`;
      const correct = document.createElement("div");
      correct.className = "miss-correct";
      correct.textContent = `Correct: ${m.q.choices[m.q.correctIdx]}`;
      const source = document.createElement("div");
      source.className = "miss-source";
      source.textContent = `Source: Part ${m.q.source.part} — ${m.q.source.topic}`;
      wrap.append(stem, picked, correct, source);
      els.summaryMisses.append(wrap);
    }
  }
  showView("summary");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleClone(arr) {
  return shuffle(arr.slice());
}
