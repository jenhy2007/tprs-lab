const STATE = {
  branch: "branch1",
  track: "trackA",
  manifest: [],
  currentLesson: null,
  toolbox: null,
  scaffoldingLevel: 1
};

async function init() {
  try {
    const [manifestRes, toolboxRes] = await Promise.all([
      fetch("data/manifest.json"),
      fetch("data/toolbox.json")
    ]);
    STATE.manifest = await manifestRes.json();
    STATE.toolbox = await toolboxRes.json();
    if (STATE.manifest.length > 0) {
      await loadLesson(STATE.manifest[0].file);
    }
    render();
  } catch (err) {
    document.getElementById("app").innerHTML = `
      <div class="card">
        <h2>⚠️ Local Preview Note</h2>
        <p>GitHub Pages loads JSON files automatically. If testing locally on your computer, open via a local server or push directly to GitHub Pages.</p>
      </div>`;
  }
}

async function loadLesson(filePath) {
  const res = await fetch(filePath);
  STATE.currentLesson = await res.json();
  STATE.scaffoldingLevel = 1;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "it-IT";
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
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

async function changeDate(filePath) {
  await loadLesson(filePath);
  render();
}

function render() {
  const app = document.getElementById("app");
  if (STATE.branch === "branch1") {
    app.innerHTML = renderBranch1();
  } else {
    app.innerHTML = renderBranch2();
  }
}

function renderBranch1() {
  const lesson = STATE.currentLesson;
  if (!lesson) return `<div class="card">Loading lesson...</div>`;
  const data = lesson[STATE.track];

  return `
    <div class="sub-bar">
      <div>
        <button class="pill-btn ${STATE.track === 'trackA' ? 'active' : ''}" onclick="setTrack('trackA')">Track A: DUO</button>
        <button class="pill-btn ${STATE.track === 'trackB' ? 'active' : ''}" onclick="setTrack('trackB')">Track B: Fun-Italian</button>
      </div>
      <select onchange="changeDate(this.value)">
        ${STATE.manifest.map(m => `<option value="${m.file}" ${m.date === lesson.date ? 'selected' : ''}>📅 ${m.date} — ${m.title}</option>`).join("")}
      </select>
    </div>

    <!-- STAGE 1: RAW INPUT STREAM -->
    <section class="card">
      <span class="stage-badge s1">Stage 1 · Raw Input Stream</span>
      <h2>${data.stage1_rawInput.title}</h2>
      ${data.stage1_rawInput.items.map(item => `
        <p style="margin:0.4rem 0;">
          <strong>${item.it}</strong>
          <button class="pill-btn" style="padding:0.15rem 0.55rem;margin-left:6px;" onclick="speak(\`${item.it.replace(/"/g, '&quot;')}\`)">🔊</button><br>
          <span style="color:var(--muted);font-size:0.9rem;">${item.en} · ${item.zh}</span>
        </p>
      `).join("")}
      <details>
        <summary>▸ Grammar Anchors & Source Notes</summary>
        <ul>${data.stage1_rawInput.anchors.map(a => `<li>${a}</li>`).join("")}</ul>
      </details>
    </section>

    <!-- STAGE 2: TPRS TRANSFORMATION ENGINE (STEPS 0–5) -->
    <section class="card">
      <span class="stage-badge s2">Stage 2 · TPRS Transformation Engine (0 → 5)</span>
      <h2>0. Umbrella Structure: “${data.stage2_tprs.step0_umbrella.frame}”</h2>
      <p style="color:var(--muted);font-size:0.9rem;">${data.stage2_tprs.step0_umbrella.cue}</p>

      <h3>1. HF-Vocab Extraction & Chunking</h3>
      <div>${data.stage2_tprs.step1_hfChunks.map(c => `<span class="slot-chip" onclick="speak('${c.it}')">🔊 ${c.it} (${c.en})</span>`).join("")}</div>

      <h3>2. S+V+O Single-Slot Replacement Drill</h3>
      <div class="level-box">
        <div>Locked Stem: <strong>${data.stage2_tprs.step2_singleSlot.stem}</strong> <span id="slot-preview" style="color:var(--amber);font-weight:700;">[ ___ ]</span></div>
        <div style="margin-top:0.4rem;">
          ${data.stage2_tprs.step2_singleSlot.variables.map(v => `
            <button class="slot-chip" onclick="document.getElementById('slot-preview').textContent='${v}'; speak('${data.stage2_tprs.step2_singleSlot.stem} ${v}')">${v}</button>
          `).join("")}
        </div>
      </div>

      <h3>3. Circling Q&A (Statement → Yes/No → Either/Or → Wh-)</h3>
      <details>
        <summary>▸ Open Circling Sequence (${data.stage2_tprs.step3_circling.length} steps)</summary>
        <ol>${data.stage2_tprs.step3_circling.map(q => `<li><strong>${q.type}:</strong> ${q.q} <em>(${q.a})</em></li>`).join("")}</ol>
      </details>

      <h3>4. Scaffolding Comprehension (3-Level Toggle)</h3>
      <div>
        <button class="pill-btn ${STATE.scaffoldingLevel === 1 ? 'active' : ''}" onclick="STATE.scaffoldingLevel=1;render()">Level 1: Skeleton</button>
        <button class="pill-btn ${STATE.scaffoldingLevel === 2 ? 'active' : ''}" onclick="STATE.scaffoldingLevel=2;render()">Level 2: Details</button>
        <button class="pill-btn ${STATE.scaffoldingLevel === 3 ? 'active' : ''}" onclick="STATE.scaffoldingLevel=3;render()">Level 3: Complex</button>
      </div>
      <div class="level-box">
        ${data.stage2_tprs.step4_scaffolding["level" + STATE.scaffoldingLevel]}
        <button class="pill-btn" style="margin-left:8px;" onclick="speak(\`${data.stage2_tprs.step4_scaffolding["level" + STATE.scaffoldingLevel].replace(/"/g, '&quot;')}\`)">🔊 Listen</button>
      </div>

      <h3>5. Write Output (Need-Based Prompt)</h3>
      <p style="font-size:0.9rem;color:var(--muted);margin:0;">${data.stage2_tprs.step5_writeOutput.prompt}</p>
      <input type="text" placeholder="Scrivi qui..." />
    </section>

    <!-- STAGE 3: OUTPUT & INTERACTIVE ACTIVITIES -->
    <section class="card">
      <span class="stage-badge s3">Stage 3 · Output & Gentle Cognitive Assessment</span>
      <h2>1. Alive Q&A & 2. Thought-Slice Feedback</h2>
      <p><strong>Prompt:</strong> ${data.stage3_output.aliveQA.question}</p>
      <input type="text" id="alive-input" placeholder="Rispondi in italiano..." />
      <div style="margin-top:0.5rem;">
        <button class="pill-btn" onclick="showThoughtSlice()">✨ Reflect & Compare</button>
      </div>
      <div class="thought-slice" id="thought-slice-box">
        <strong>🧠 Diagnostic Thought Slice (No Red Xs):</strong><br>
        ${data.stage3_output.gentleFeedback.thoughtSlice}<br>
        <em>Native Model:</em> “${data.stage3_output.gentleFeedback.modelAnswer}”
      </div>

      <h3>3. Personal Storytelling (1st-Person POV)</h3>
      <p style="font-size:0.88rem;color:var(--muted);margin:0;">${data.stage3_output.personalStory.prompt}</p>
      <textarea id="pov-story" placeholder="Io..."></textarea>
      <button class="pill-btn" style="margin-top:0.4rem;" onclick="speak(document.getElementById('pov-story').value)">🔊 Read My Story</button>
    </section>
  `;
}

function showThoughtSlice() {
  document.getElementById("thought-slice-box").style.display = "block";
}

function renderBranch2() {
  const tb = STATE.toolbox;
  if (!tb) return `<div class="card">Loading toolbox...</div>`;
  return `
    <section class="card">
      <span class="stage-badge s2">Branch 2 · Cumulative Reference</span>
      <h2>1. High-Frequency Chunks (2–4 Word Starters)</h2>
      <div>${tb.hfChunks.map(c => `<span class="slot-chip" onclick="speak('${c.it}')">🔊 <strong>${c.it}</strong> — ${c.en}</span>`).join("")}</div>
    </section>

    <section class="card">
      <span class="stage-badge s1">Branch 2 · Structural Backbone</span>
      <h2>2. Grammar Mechanics (Pro-Drop, Pronouns & Tenses)</h2>
      <ul>${tb.grammarMechanics.map(g => `<li><strong>${g.topic}:</strong> ${g.rule} <em>(${g.example})</em></li>`).join("")}</ul>
    </section>

    <section class="card">
      <span class="stage-badge s3">Branch 2 · Reflection Archive</span>
      <h2>3. Daily Questions & Thought Slices</h2>
      <ul>${tb.dailyQuestions.map(q => `<li><strong>${q.date}:</strong> ${q.question} → <span style="color:var(--green);">${q.insight}</span></li>`).join("")}</ul>
    </section>
  `;
}

init();