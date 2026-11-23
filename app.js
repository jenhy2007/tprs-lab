const STATE = {
  branch: "branch1",
  track: "trackA",
  stageView: 1, // 1, 2, 3, or "all"
  manifest: [],
  currentLesson: null,
  toolbox: { hfChunks: [], grammarMechanics: [], dailyQuestions: [] },
  scaffoldingLevel: 1,
  pinnedChunks: JSON.parse(localStorage.getItem("tprs_pinned_chunks") || "[]")
};

async function init() {
  try {
    const [manifestRes, toolboxRes] = await Promise.all([
      fetch("data/manifest.json"),
      fetch("data/toolbox.json")
    ]);
    if (manifestRes.ok) STATE.manifest = await manifestRes.json();
    if (toolboxRes.ok) STATE.toolbox = await toolboxRes.json();

    // Try loading latest.json first if present; otherwise load newest manifest entry
    try {
      const latestRes = await fetch("data/lessons/latest.json");
      if (latestRes.ok) {
        STATE.currentLesson = await latestRes.json();
      }
    } catch (e) {
      // Fallback to manifest if latest.json is not present
    }

    if (!STATE.currentLesson && STATE.manifest.length > 0) {
      await loadLesson(STATE.manifest[0].file);
    }
    render();
  } catch (err) {
    document.getElementById("app").innerHTML = `
      <div class="card">
        <h2>⚠️ Local Preview Note</h2>
        <p>GitHub Pages loads your JSON lesson files automatically once pushed. If previewing locally, run a local HTTP server.</p>
      </div>`;
  }
}

async function loadLesson(filePath) {
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

function render() {
  const app = document.getElementById("app");
  app.innerHTML = STATE.branch === "branch1" ? renderBranch1() : renderBranch2();
}

function renderBranch1() {
  const lesson = STATE.currentLesson;
  if (!lesson) return `<div class="card">No lesson data found yet. Check that <code>data/lessons/2026-11-23.json</code> exists.</div>`;
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
      ` : `<span style="font-size:0.84rem;color:var(--muted);">📅 ${lesson.date || "Latest"}</span>`}
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
