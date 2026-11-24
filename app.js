function renderBranch2() {
  const tb = STATE.toolbox;
  const allChunks = [...(tb.hfChunks || []), ...STATE.pinnedChunks];
  return `
    <section class="card">
      <span class="stage-badge s1">Toolbox · Architecture & Methodology</span>
      <h2>🗺️ TPRS Lab Mind Map (Acquisition Flow)</h2>
      <div style="background:#fafaf9;border:1px solid var(--border);border-radius:12px;padding:1rem;font-size:0.88rem;line-height:1.7;">
        <div style="font-weight:700;color:var(--text);margin-bottom:0.35rem;">🇮🇹 Italian with DUO · 不甘退休的TPRS 实验室</div>
        <div style="padding-left:0.9rem;border-left:2px solid #d6d3d1;">
          <div><strong>├── 1. Add Input (输入语料)</strong></div>
          <div style="padding-left:1.1rem;color:var(--muted);">
            ├── Track B: Fun-Italian (Web links, Reels & transcripts)<br>
            └── Track A: DUO (Unit stories & listening PDFs)
          </div>
          <div style="margin-top:0.35rem;"><strong>├── 2. Learning Lab (习得实验室)</strong></div>
          <div style="padding-left:1.1rem;color:var(--muted);">
            ├── <strong>Stage 1 · Comprehensible Reading & Listening:</strong> Non-English logic notes + IT/EN line glosses + 🐢 0.75x / 🔊 0.95x ear training<br>
            ├── <strong>Stage 2 · TPRS Engine (0 → 5):</strong> Umbrella Frame → HF Chunks → Single-Slot → Circling → 3-Level Scaffolding → Cloze Output<br>
            └── <strong>Stage 3 · Output & Reflection:</strong> Alive Q&A → Diagnostic Thought Slice (no red Xs) → 1st-Person POV Story
          </div>
          <div style="margin-top:0.35rem;"><strong>└── 3. Toolbox (语言工具箱)</strong></div>
          <div style="padding-left:1.1rem;color:var(--muted);">
            ├── Mind Map & TPRS Transformation Methods<br>
            ├── High-Frequency Chunks (Core + ★ Pinned)<br>
            ├── Grammar Mechanics (Non-English Logic)<br>
            └── Daily Reflection Archive
          </div>
        </div>
      </div>

      <h3 style="margin-top:1.25rem;">⚙️ TPRS Transformation Methods (Steps 0 → 5)</h3>
      <div style="display:grid;gap:0.55rem;font-size:0.88rem;">
        <div class="level-box" style="margin-top:0;">
          <strong>Step 0 · Umbrella Frame (保护伞句型):</strong> Isolate one high-utility sentence skeleton (e.g., <em>"Siamo [adj] con [chi...]"</em>) with a vivid mental image so grammar feels like a single visual scene.
        </div>
        <div class="level-box" style="margin-top:0;">
          <strong>Step 1 · HF-Vocab Chunking (高频语块提取):</strong> Extract 3–5 reusable multi-word chunks (not isolated dictionary words) and tap <strong>☆</strong> to pin favorites into your Toolbox.
        </div>
        <div class="level-box" style="margin-top:0;">
          <strong>Step 2 · S+V+O Single-Slot Replacement (单槽替换操练):</strong> Lock the subject + verb stem and swap only one final slot at a time while listening aloud to build automatic muscle memory.
        </div>
        <div class="level-box" style="margin-top:0;">
          <strong>Step 3 · Circling Q&A (环绕式问答):</strong> Loop around one fact from four angles—<em>Statement → Yes/No → Either/Or → Open Wh-</em>—to get 4x comprehensible repetitions without boredom.
        </div>
        <div class="level-box" style="margin-top:0;">
          <strong>Step 4 · 3-Level Scaffolding (三阶脚手架阅读):</strong> Read and listen across <em>Level 1 (Skeleton) → Level 2 (Details) → Level 3 (Complex/Native)</em> so complex clauses unlock gradually.
        </div>
        <div class="level-box" style="margin-top:0;">
          <strong>Step 5 · Need-Based Output & Thought Slices (需求驱动输出):</strong> Answer a personal prompt in 1st-person POV and compare with a native model using gentle diagnostic notes instead of red-pen corrections.
        </div>
      </div>
    </section>

    <section class="card">
      <span class="stage-badge s2">Toolbox · Cumulative Reference</span>
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
      <span class="stage-badge s1">Toolbox · Structural Backbone</span>
      <h2>2. Grammar Mechanics (Non-English Logic)</h2>
      <ul style="padding-left:1.2rem;margin:0.4rem 0;">
        ${(tb.grammarMechanics || []).map(g => `<li style="margin-bottom:0.45rem;"><strong>${g.topic}:</strong> ${g.rule} <em style="color:var(--muted);">(${g.example})</em></li>`).join("")}
      </ul>
    </section>

    <section class="card">
      <span class="stage-badge s3">Toolbox · Reflection Archive</span>
      <h2>3. Daily Questions & Thought Slices</h2>
      <ul style="padding-left:1.2rem;margin:0.4rem 0;">
        ${(tb.dailyQuestions || []).map(q => `<li style="margin-bottom:0.45rem;"><strong>${q.date}:</strong> ${q.question} → <span style="color:var(--green);">${q.insight}</span></li>`).join("")}
      </ul>
    </section>
  `;
}
