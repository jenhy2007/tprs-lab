if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const STATE = {
  branch: "branch1", // "branch1", "input", or "branch2"
  track: "trackA",
  stageView: 1,
  manifest: [],
  currentLesson: null,
  toolbox: { hfChunks: [], grammarMechanics: [], dailyQuestions: [] },
  scaffoldingLevel: 1,
  pinnedChunks: JSON.parse(localStorage.getItem("tprs_pinned_chunks") || "[]"),
  extractedPdfLines: []
};

async function init() {
  try {
    const [manifestRes, toolboxRes] = await Promise.all([
      fetch("data/manifest.json"),
      fetch("data/toolbox.json")
    ]);
    if (manifestRes.ok) STATE.manifest = await manifestRes.json();
    if (toolboxRes.ok) STATE.toolbox = await toolboxRes.json();

    // Check if user saved a custom draft lesson in browser storage first
    const localDraft = localStorage.getItem("tprs_active_draft_lesson");
    if (localDraft) {
      STATE.currentLesson = JSON.parse(localDraft);
    } else if (STATE.manifest.length > 0) {
      await loadLesson(STATE.manifest[0].file);
    }
    render();
  } catch (err) {
    document.getElementById("app").innerHTML = `
      <div class="card">
        <h2>⚠️ Loading Note</h2>
        <p>Could not load initial files. Please check your GitHub Pages connection.</p>
      </div>`;
  }
}

async function loadLesson(filePath) {
  localStorage.removeItem("tprs_active_draft_lesson");
  const res = await fetch(filePath);
  if (res.ok) {
    STATE.currentLesson = await res.json();
    STATE.scaffoldingLevel = 1;
  }
}

function speak(text, rate = 0.95) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "it-IT";
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
}

function audioButtons(text) {
  const safe = escapeAttr(text);
  return `
    <span class="audio-group">
      <button class="audio-btn" title="Slow 0.75x" data-text="${safe}" onclick="speak(this.dataset.text, 0.75)">🐢</button>
      <button class="audio-btn" title="Normal 0.95x" data-text="${safe}" onclick="speak(this.dataset.text, 0.95)">🔊</button>
    </span>`;
}

function setBranch(branch) {
  STATE.branch = branch;
  document.getElementById("nav-branch1").classList.toggle("active", branch === "branch1");
  document.getElementById("nav-input").classList.toggle("active", branch === "input");
  document.getElementById("nav-branch2").classList.toggle("active", branch === "branch2");
  render();
}

function setTrack(track) {
  STATE.track = track;
  STATE.scaffoldingLevel = 1;
  render();
}

function setStageView(view) {
  STATE.stageView = view;
  render();
}

async function changeDate(filePath) {
  await loadLesson(filePath);
  render();
}

function togglePinChunk(it, en) {
  const exists = STATE.pinnedChunks.findIndex(c => c.it === it);
  if (exists >= 0) {
    STATE.pinnedChunks.splice(exists, 1);
  } else {
    STATE.pinnedChunks.push({ it, en });
  }
  localStorage.setItem("tprs_pinned_chunks", JSON.stringify(STATE.pinnedChunks));
  render();
}

function isPinned(it) {
  return STATE.pinnedChunks.some(c => c.it === it);
}

function exportPinnedJSON() {
  const jsonStr = JSON.stringify(STATE.pinnedChunks, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    const status = document.getElementById("export-status");
    if (status) status.textContent = "✓ Copied pinned JSON to clipboard!";
  });
}

// --- PDF Extraction Handler ---
async function handlePdfUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.getElementById("pdf-status");
  status.textContent = "⏳ Reading PDF...";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(" ") + "\n";
    }

    // Split into clean Italian sentences/lines
    const lines = fullText
      .split(/(?<=[.?!])\s+|\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 6 && !/^Unit\s+\d+/i.test(s));

    STATE.extractedPdfLines = lines;
    document.getElementById("duo-raw-box").value = lines.join("\n");
    if (!document.getElementById("duo-title-box").value) {
      document.getElementById("duo-title-box").value = file.name.replace(/\.pdf$/i, "");
    }
    status.textContent = `✓ Extracted ${lines.length} lines from ${file.name}! Review below and click "Load into Track A".`;
  } catch (err) {
    status.textContent = "⚠️ Could not read PDF text. You can copy-paste lines manually below.";
  }
}

function buildQuickTrackData(title, lines, sourceUrl = "") {
  const cleanLines = lines.filter(Boolean);
  const firstLine = cleanLines[0] || "Ciao! Come stai?";
  const words = firstLine.replace(/[.,!?]/g, "").split(/\s+/);
  const stem = words.slice(0, Math.max(2, words.length - 1)).join(" ");
  const lastWord = words[words.length - 1] || "bene";

  return {
    stage1_rawInput: {
      title: title || "Custom Input Lesson",
      items: cleanLines.map(line => ({
        it: line,
        en: "Click 🐢 / 🔊 to listen & decode",
        zh: "点击右侧喇叭跟读"
      })),
      anchors: sourceUrl
        ? [`Source Link: ${sourceUrl}`, "Use 'Copy for Gemini' in + Add Input to generate full grammar notes."]
        : ["Imported from DUO PDF.", "Use 'Copy for Gemini' in + Add Input to generate full grammar notes."]
    },
    stage2_tprs: {
      step0_umbrella: {
        frame: firstLine,
        cue: "Listen slowly at 0.75x first, then shadow at 0.95x."
      },
      step1_hfChunks: cleanLines.slice(0, 4).map(l => ({
        it: l.split(/\s+/).slice(0, 3).join(" "),
        en: "HF starter"
      })),
      step2_singleSlot: {
        stem: stem,
        variables: [lastWord, "oggi", "adesso", "sempre"]
      },
      step3_circling: [
        { type: "Statement", q: firstLine, a: `Sì, ${firstLine.toLowerCase()}` },
        { type: "Open Wh-", q: "Che cosa succede qui?", a: firstLine }
      ],
      step4_scaffolding: {
        level1: cleanLines[0] || "",
        level2: cleanLines.slice(0, 2).join(" "),
        level3: cleanLines.join(" ")
      },
      step5_writeOutput: {
        prompt: `Rewrite or adapt the key pattern from: "${firstLine}"`
      }
    },
    stage3_output: {
      aliveQA: {
        question: `Come usi "${words.slice(0, 2).join(" ")}" nella tua giornata?`
      },
      gentleFeedback: {
        thoughtSlice: "Focus on smooth rhythm and verb ending agreement rather than word-for-word translation.",
        modelAnswer: firstLine
      },
      personalStory: {
        prompt: "Write 2–3 sentences in 1st-person POV using today's new expressions."
      }
    }
  };
}

function loadCustomIntoLab(targetTrack) {
  const today = new Date().toISOString().slice(0, 10);
  const baseLesson = STATE.currentLesson
    ? JSON.parse(JSON.stringify(STATE.currentLesson))
    : { date: today, trackA: buildQuickTrackData("DUO Lesson", ["Oggi studio italiano."]), trackB: buildQuickTrackData("Fun-Italian", ["Che bella giornata!"]) };

  baseLesson.date = today;

  if (targetTrack === "trackA") {
    const title = document.getElementById("duo-title-box").value.trim() || "DUO Listening PDF";
    const lines = document.getElementById("duo-raw-box").value.split("\n").map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) return alert("Please upload a PDF or enter at least one Italian line first.");
    baseLesson.trackA = buildQuickTrackData(title, lines);
  } else {
    const url = document.getElementById("web-url-box").value.trim();
    const title = document.getElementById("web-title-box").value.trim() || (url ? `Web / Reel (${url})` : "Fun-Italian Clip");
    const lines = document.getElementById("web-raw-box").value.split("\n").map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) return alert("Please paste at least 1–2 Italian lines or captions from the link.");
    baseLesson.trackB = buildQuickTrackData(title, lines, url);
  }

  STATE.currentLesson = baseLesson;
  localStorage.setItem("tprs_active_draft_lesson", JSON.stringify(baseLesson));
  STATE.track = targetTrack;
  STATE.stageView = 1;
  setBranch("branch1");
}

function copyPromptForGemini(targetTrack) {
  let payload = "";
  if (targetTrack === "trackA") {
    const title = document.getElementById("duo-title-box").value.trim();
    const lines = document.getElementById("duo-raw-box").value.trim();
    payload = `Generate today's TPRS Lab JSON for Track A (DUO: ${title}):\n\n${lines}`;
  } else {
    const url = document.getElementById("web-url-box").value.trim();
    const lines = document.getElementById("web-raw-box").value.trim();
    payload = `Generate today's TPRS Lab JSON for Track B (Fun-Italian link: ${url}):\n\n${lines}`;
  }
  navigator.clipboard.writeText(payload).then(() => {
    alert("✓ Copied! Paste this straight into your Gemini chat to get the full AI-enriched JSON.");
  });
}

function importFullLessonJSON() {
  try {
    const raw = document.getElementById("json-import-box").value.trim();
    const parsed = JSON.parse(raw);
    if (!parsed.trackA || !parsed.trackB) throw new Error("Missing trackA or trackB");
    STATE.currentLesson = parsed;
    localStorage.setItem("tprs_active_draft_lesson", JSON.stringify(parsed));
    setBranch("branch1");
  } catch (e) {
    alert("⚠️ Invalid JSON format. Make sure you copied the entire JSON block from Gemini.");
  }
}

function render() {
  const app = document.getElementById("app");
  if (STATE.branch === "branch1") app.innerHTML = renderBranch1();
  else if (STATE.branch === "input") app.innerHTML = renderInputCard();
  else app.innerHTML = renderBranch2();
}

function renderInputCard() {
  return `
    <section class="card">
      <span class="stage-badge s1">Input 1 · Track A (DUO Listening PDF)</span>
      <h2>📄 Upload DUO Listening PDF</h2>
      <p style="font-size:0.88rem;color:var(--muted);margin-top:-0.4rem;">
        Select your Duolingo listening PDF—the Lab extracts the Italian lines automatically so you can listen at 0.75x/0.95x right away.
      </p>
      <input type="file" accept=".pdf" onchange="handlePdfUpload(event)" style="margin:0.4rem 0;" />
      <div id="pdf-status" style="font-size:0.84rem;color:var(--green);margin-bottom:0.4rem;"></div>
      <input type="text" id="duo-title-box" placeholder="Lesson Title (e.g., Unit 41: Order at a Café)" />
      <textarea id="duo-raw-box" rows="4" placeholder="Extracted Italian sentences appear here (or paste directly)..."></textarea>
      <div style="margin-top:0.65rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <button class="pill-btn active" onclick="loadCustomIntoLab('trackA')">▶ Load into Track A Now</button>
        <button class="pill-btn" onclick="copyPromptForGemini('trackA')">📋 Copy for Gemini (Full TPRS)</button>
      </div>
    </section>

    <section class="card">
      <span class="stage-badge s2">Input 2 · Track B (Web Link / Facebook Reel)</span>
      <h2>🎬 Add Web Material or Reel Link</h2>
      <p style="font-size:0.88rem;color:var(--muted);margin-top:-0.4rem;">
        Paste the Facebook Reel or article link plus 2–3 Italian lines or captions you want to practice.
      </p>
      <input type="url" id="web-url-box" placeholder="https://www.facebook.com/reel/..." />
      <input type="text" id="web-title-box" placeholder="Clip Title (optional)" />
      <textarea id="web-raw-box" rows="3" placeholder="Paste Italian captions or lines from the video/article..."></textarea>
      <div style="margin-top:0.65rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <button class="pill-btn active" onclick="loadCustomIntoLab('trackB')">▶ Load into Track B Now</button>
        <button class="pill-btn" onclick="copyPromptForGemini('trackB')">📋 Copy for Gemini (Full TPRS)</button>
      </div>
    </section>

    <section class="card">
      <span class="stage-badge s3">Optional · Paste Full Gemini Lesson JSON</span>
      <h2>⚡ Quick-Load Full AI Lesson JSON</h2>
      <textarea id="json-import-box" rows="3" placeholder='Paste full JSON from Gemini here to preview immediately before pushing to GitHub...'></textarea>
      <div style="margin-top:0.6rem;">
        <button class="pill-btn" onclick="importFullLessonJSON()">✨ Load Full JSON into Lab</button>
      </div>
    </section>
  `;
}

function renderBranch1() {
  const lesson = STATE.currentLesson;
  if (!lesson) return `<div class="card">No lesson data found yet. Click <strong>+ Add Input</strong> above to upload a DUO PDF or paste a link!</div>`;
  const data = lesson[STATE.track];
  const v = STATE.stageView;

  return `
    <div class="sub-bar">
      <div>
        <button class="pill-btn ${STATE.track === 'trackA' ? 'active' : ''}" onclick="setTrack('trackA')">Track A: DUO</button>
        <button class="pill-btn ${STATE.track === 'trackB' ? 'active' : ''}" onclick="setTrack('trackB')">Track B: Fun-Italian</button>
      </div>
      ${STATE.manifest.length > 0 ? `
        <select onchange="changeDate(this.value)">
          ${STATE.manifest.map(m => `<option value="${m.file}" ${m.date === lesson.date ? 'selected' : ''}>📅 ${m.date} — ${m.title}</option>`).join("")}
        </select>
      ` : `<span style="font-size:0.84rem;color:var(--muted);">📅 ${lesson.date || "Today"}</span>`}
    </div>

    <div class="stage-bar">
      <button class="pill-btn ${v === 1 ? 'active' : ''}" onclick="setStageView(1)">Stage 1 · Input</button>
      <button class="pill-btn ${v === 2 ? 'active' : ''}" onclick="setStageView(2)">Stage 2 · Transform (0–5)</button>
      <button class="pill-btn ${v === 3 ? 'active' : ''}" onclick="setStageView(3)">Stage 3 · Output</button>
      <button class="pill-btn ${v === 'all' ? 'active' : ''}" onclick="setStageView('all')">All 3 Stages</button>
    </div>

    ${(v === 1 || v === "all") ? renderStage1(data) : ""}
    ${(v === 2 || v === "all") ? renderStage2(data) : ""}
    ${(v === 3 || v === "all") ? renderStage3(data) : ""}

    ${v !== "all" ? `
      <div class="pager">
        <button class="pill-btn" onclick="setStageView(${v - 1})" ${v === 1 ? "disabled" : ""}>← Prev Stage</button>
        <span>Stage ${v} of 3</span>
        <button class="pill-btn" onclick="setStageView(${v + 1})" ${v === 3 ? "disabled" : ""}>Next Stage →</button>
      </div>
    ` : ""}
  `;
}

function renderStage1(data) {
  return `
    <section class="card">
      <span class="stage-badge s1">Stage 1 · Raw Input Stream</span>
      <h2>${data.stage1_rawInput.title}</h2>
      ${data.stage1_rawInput.items.map(item => `
        <div class="line-item">
          <div class="line-top">
            <strong style="font-size:1.06rem;">${item.it}</strong>
            ${audioButtons(item.it)}
          </div>
          <div style="color:var(--muted);font-size:0.88rem;margin-top:0.2rem;">${item.en} · ${item.zh}</div>
        </div>
      `).join("")}
      <details>
        <summary>▸ Grammar Anchors & Source Notes</summary>
        <ul style="margin:0.4rem 0;padding-left:1.2rem;">
          ${data.stage1_rawInput.anchors.map(a => `<li>${a}</li>`).join("")}
        </ul>
      </details>
    </section>
  `;
}

function renderStage2(data) {
  const t = data.stage2_tprs;
  const levelKey = "level" + STATE.scaffoldingLevel;
  const activeText = t.step4_scaffolding[levelKey];
  const safeStem = escapeAttr(t.step2_singleSlot.stem);

  return `
    <section class="card">
      <span class="stage-badge s2">Stage 2 · TPRS Transformation Engine (0 → 5)</span>
      <h2>0. Umbrella Frame: “${t.step0_umbrella.frame}”</h2>
      <p style="color:var(--muted);font-size:0.88rem;margin-top:-0.4rem;">${t.step0_umbrella.cue}</p>

      <h3>1. HF-Vocab Extraction & Chunking (Tap ☆ to Pin to Toolbox)</h3>
      <div>
        ${t.step1_hfChunks.map(c => {
          const safeIt = escapeAttr(c.it);
          const safeEn = escapeAttr(c.en);
          return `
            <span class="chunk-chip">
              <span style="cursor:pointer;" data-it="${safeIt}" onclick="speak(this.dataset.it)">🔊 <strong>${c.it}</strong> (${c.en})</span>
              <button class="pin-btn" title="Pin to Toolbox" data-it="${safeIt}" data-en="${safeEn}" onclick="togglePinChunk(this.dataset.it, this.dataset.en)">
                ${isPinned(c.it) ? "★" : "☆"}
              </button>
            </span>`;
        }).join("")}
      </div>

      <h3>2. S+V+O Single-Slot Replacement Drill</h3>
      <div class="level-box">
        <div>Locked Stem: <strong>${t.step2_singleSlot.stem}</strong> <span id="slot-preview" style="color:var(--amber);font-weight:700;">[ ___ ]</span></div>
        <div style="margin-top:0.45rem;">
          ${t.step2_singleSlot.variables.map(v => {
            const safeVar = escapeAttr(v);
            return `
              <button class="pill-btn" style="margin:0.15rem;" data-stem="${safeStem}" data-var="${safeVar}"
                onclick="document.getElementById('slot-preview').textContent=this.dataset.var; speak(this.dataset.stem + ' ' + this.dataset.var)">
                ${v}
              </button>`;
          }).join("")}
        </div>
      </div>

      <h3>3. Circling Q&A (Statement → Yes/No → Either/Or → Wh-)</h3>
      <details>
        <summary>▸ Open Circling Sequence (${t.step3_circling.length} steps)</summary>
        <ol style="margin:0.4rem 0;padding-left:1.2rem;">
          ${t.step3_circling.map(q => `<li style="margin-bottom:0.35rem;"><strong>${q.type}:</strong> ${q.q} <em style="color:var(--muted);">(${q.a})</em></li>`).join("")}
        </ol>
      </details>

      <h3>4. Scaffolding Comprehension (3-Level Toggle)</h3>
      <div>
        <button class="pill-btn ${STATE.scaffoldingLevel === 1 ? 'active' : ''}" onclick="STATE.scaffoldingLevel=1;render()">Level 1: Skeleton</button>
        <button class="pill-btn ${STATE.scaffoldingLevel === 2 ? 'active' : ''}" onclick="STATE.scaffoldingLevel=2;render()">Level 2: Details</button>
        <button class="pill-btn ${STATE.scaffoldingLevel === 3 ? 'active' : ''}" onclick="STATE.scaffoldingLevel=3;render()">Level 3: Complex</button>
      </div>
      <div class="level-box" style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.6rem;">
        <span>${activeText}</span>
        ${audioButtons(activeText)}
      </div>

      <h3>5. Write Output (Need-Based Prompt)</h3>
      <p style="font-size:0.88rem;color:var(--muted);margin:0;">${t.step5_writeOutput.prompt}</p>
      <input type="text" placeholder="Scrivi qui..." />
    </section>
  `;
}

function renderStage3(data) {
  const o = data.stage3_output;
  return `
    <section class="card">
      <span class="stage-badge s3">Stage 3 · Output & Gentle Cognitive Assessment</span>
      <h2>1. Alive Q&A & 2. Thought-Slice Feedback</h2>
      <p style="margin-bottom:0.3rem;"><strong>Prompt:</strong> ${o.aliveQA.question}</p>
      <input type="text" id="alive-input" placeholder="Rispondi in italiano..." />
      <div style="margin-top:0.55rem;">
        <button class="pill-btn" onclick="document.getElementById('thought-slice-box').style.display='block'">✨ Reflect & Compare</button>
      </div>
      <div class="thought-slice" id="thought-slice-box">
        <strong>🧠 Diagnostic Thought Slice (No Red Xs):</strong><br>
        ${o.gentleFeedback.thoughtSlice}<br><br>
        <em>Native Model:</em> “${o.gentleFeedback.modelAnswer}” ${audioButtons(o.gentleFeedback.modelAnswer)}
      </div>

      <h3>3. Personal Storytelling (1st-Person POV)</h3>
      <p style="font-size:0.88rem;color:var(--muted);margin:0;">${o.personalStory.prompt}</p>
      <textarea id="pov-story" rows="3" placeholder="Io..."></textarea>
      <div style="margin-top:0.45rem;display:flex;gap:0.5rem;align-items:center;">
        <button class="pill-btn" onclick="speak(document.getElementById('pov-story').value, 0.75)">🐢 Read Slowly</button>
        <button class="pill-btn" onclick="speak(document.getElementById('pov-story').value, 0.95)">🔊 Read Story</button>
        <button class="pill-btn" onclick="localStorage.setItem('tprs_pov_draft', document.getElementById('pov-story').value)">💾 Save Draft</button>
      </div>
    </section>
  `;
}

function renderBranch2() {
  const tb = STATE.toolbox;
  const allChunks = [...(tb.hfChunks || []), ...STATE.pinnedChunks];
  return `
    <section class="card">
      <span class="stage-badge s2">Branch 2 · Cumulative Reference</span>
      <h2>1. High-Frequency Chunks (Core + ★ Pinned)</h2>
      <div>
        ${allChunks.map(c => {
          const safeIt = escapeAttr(c.it);
          const safeEn = escapeAttr(c.en);
          return `
            <span class="chunk-chip">
              <span style="cursor:pointer;" data-it="${safeIt}" onclick="speak(this.dataset.it)">🔊 <strong>${c.it}</strong> — ${c.en}</span>
              ${isPinned(c.it) ? `<button class="pin-btn" title="Unpin" data-it="${safeIt}" data-en="${safeEn}" onclick="togglePinChunk(this.dataset.it, this.dataset.en)">★</button>` : ""}
            </span>`;
        }).join("")}
      </div>
      ${STATE.pinnedChunks.length > 0 ? `
        <div style="margin-top:0.85rem;padding-top:0.75rem;border-top:1px solid var(--border);display:flex;gap:0.5rem;align-items:center;">
          <button class="pill-btn" onclick="exportPinnedJSON()">📋 Copy Pinned JSON (for toolbox.json)</button>
          <span id="export-status" style="font-size:0.84rem;color:var(--green);"></span>
        </div>
      ` : ""}
    </section>

    <section class="card">
      <span class="stage-badge s1">Branch 2 · Structural Backbone</span>
      <h2>2. Grammar Mechanics (Pro-Drop, Pronouns & Tenses)</h2>
      <ul style="padding-left:1.2rem;margin:0.4rem 0;">
        ${(tb.grammarMechanics || []).map(g => `<li style="margin-bottom:0.45rem;"><strong>${g.topic}:</strong> ${g.rule} <em style="color:var(--muted);">(${g.example})</em></li>`).join("")}
      </ul>
    </section>

    <section class="card">
      <span class="stage-badge s3">Branch 2 · Reflection Archive</span>
      <h2>3. Daily Questions & Thought Slices</h2>
      <ul style="padding-left:1.2rem;margin:0.4rem 0;">
        ${(tb.dailyQuestions || []).map(q => `<li style="margin-bottom:0.45rem;"><strong>${q.date}:</strong> ${q.question} → <span style="color:var(--green);">${q.insight}</span></li>`).join("")}
      </ul>
    </section>
  `;
}

init();
