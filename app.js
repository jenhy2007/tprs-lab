if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const GITHUB_CONFIG = {
  owner: "jenhy2007",
  repo: "tprs-lab",
  branch: "main"
};

const DEFAULT_LESSON = {
  date: "2026-11-24",
  trackA: {
    stage1_rawInput: {
      title: "DUO Track (Paused — Focus on Track B)",
      items: [
        { it: "Oggi mi concentro sull'ascolto in italiano.", en: "Today I am focusing on Italian listening." }
      ],
      anchors: ["Switch to Track B: Fun-Italian to decode web links and transcripts."]
    },
    stage2_tprs: {
      step0_umbrella: { frame: "Mi concentro su [X]", cue: "Focus mode active." },
      step1_hfChunks: [{ it: "mi concentro su", en: "I focus on" }],
      step2_singleSlot: { stem: "Oggi mi concentro", variables: ["sull'ascolto", "sulla lettura"] },
      step3_circling: [{ type: "Statement", q: "Oggi ascolto italiano.", a: "Sì, ascolto italiano!" }],
      step4_scaffolding: {
        level1: "Ascolto italiano.",
        level2: "Oggi mi concentro sull'ascolto in italiano.",
        level3: "Oggi mi concentro sull'ascolto in italiano per capire meglio i video."
      },
      step5_writeOutput: { prompt: "Write 1 sentence in Italian." }
    },
    stage3_output: {
      aliveQA: { question: "Che cosa ascolti oggi?" },
      gentleFeedback: { thoughtSlice: "Keep going!", modelAnswer: "Oggi ascolto un video breve." },
      personalStory: { prompt: "Write 2 sentences." }
    }
  },
  trackB: {
    stage1_rawInput: {
      title: "Fun-Italian Reel: Pace per tutti",
      sourceUrl: "https://www.facebook.com/reel/4603424389930520",
      items: [
        { it: "Vediamo chi sta soffrendo.", en: "Let's see who is suffering." },
        { it: "Pregate con me per chi soffre.", en: "Pray with me for those who suffer." },
        { it: "Ciao amici miei.", en: "Hello, my friends." },
        { it: "Oggi desidero la pace per tutti.", en: "Today I wish for peace for everyone." },
        { it: "Per ogni persona in questo mondo.", en: "For every person in this world." },
        { it: "Siamo gentili con tutti.", en: "Let's be kind to everyone." },
        { it: "Consoliamo chi sta soffrendo?", en: "Shall we comfort those who are suffering?" }
      ],
      anchors: [
        "1st-person plural imperatives ('noi' commands without subject): 'Vediamo...' (Let's see...), 'Siamo gentili!' (Let's be kind!), and 'Consoliamo...' (Let's comfort...).",
        "2nd-person plural imperative ('voi' command): 'Pregate con me' (Pray with me).",
        "Relative pronoun 'chi' = 'those who / anyone who' ('chi sta soffrendo' = those who are suffering).",
        "Affectionate vocative word order: 'amici miei' (possessive placed after the noun for warmth)."
      ]
    },
    stage2_tprs: {
      step0_umbrella: {
        frame: "Siamo [aggettivo] con [chi...]",
        cue: "Listen at 0.75x first to catch the rhythm, then shadow at 0.95x."
      },
      step1_hfChunks: [
        { it: "Vediamo chi", en: "Let's see who" },
        { it: "chi sta soffrendo", en: "those who are suffering" },
        { it: "Pregate con me", en: "Pray with me" },
        { it: "Ciao amici miei", en: "Hello, my friends" },
        { it: "Siamo gentili con tutti", en: "Let's be kind to everyone" }
      ],
      step2_singleSlot: {
        stem: "Oggi desidero la pace",
        variables: ["per tutti", "per ogni persona", "per chi soffre", "in questo mondo"]
      },
      step3_circling: [
        { type: "Statement", q: "Oggi desidero la pace per ogni persona in questo mondo.", a: "Sì, desidero la pace per tutti!" },
        { type: "Yes/No", q: "Siamo gentili solo con i nostri amici?", a: "No, siamo gentili con tutti!" },
        { type: "Either/Or", q: "Dobbiamo ignorare o consolare chi sta soffrendo?", a: "Consoliamo chi sta soffrendo!" },
        { type: "Open Wh-", q: "Per chi pregate con me oggi?", a: "Preghiamo per chi soffre in questo mondo." }
      ],
      step4_scaffolding: {
        level1: "Ciao amici miei. Oggi desidero la pace per tutti.",
        level2: "Vediamo chi sta soffrendo, siamo gentili con tutti e preghiamo insieme.",
        level3: "Ciao amici miei! Oggi desidero la pace per ogni persona in questo mondo: siamo gentili con tutti, consoliamo chi sta soffrendo e pregate con me per chi soffre."
      },
      step5_writeOutput: {
        prompt: "Imperative Drill: Use 'Siamo...' or 'Vediamo...' to suggest a positive action with friends or neighbors."
      }
    },
    stage3_output: {
      aliveQA: {
        question: "Come possiamo essere gentili con gli altri ogni giorno?"
      },
      gentleFeedback: {
        thoughtSlice: "Notice how 'chi' replaces 'le persone che' (the people who), letting you express 'those who...' cleanly with a singular verb ('chi soffre').",
        modelAnswer: "Possiamo ascoltare chi ha bisogno di aiuto e dire una parola gentile a ogni persona che incontriamo."
      },
      personalStory: {
        prompt: "Write 2 sentences in 1st-person POV wishing something good for your family or friends ('Oggi desidero...')."
      }
    }
  }
};

const STATE = {
  branch: "branch1",
  track: "trackB",
  stageView: 1,
  manifest: [],
  localLessons: JSON.parse(localStorage.getItem("tprs_local_lessons") || "[]"),
  currentLesson: null,
  activeLessonId: "",
  toolbox: { hfChunks: [], grammarMechanics: [], dailyQuestions: [] },
  scaffoldingLevel: 1,
  pinnedChunks: JSON.parse(localStorage.getItem("tprs_pinned_chunks") || "[]"),
  geminiApiKey: (localStorage.getItem("tprs_gemini_api_key") || "").trim(),
  githubToken: (localStorage.getItem("tprs_github_token") || "").trim()
};

function saveToLocalLibrary(lessonObj) {
  const title = lessonObj.trackB?.stage1_rawInput?.title || "Fun-Italian Lesson";
  const date = lessonObj.date || new Date().toISOString().slice(0, 10);
  const id = `local_${date}`;
  const entry = { id, date, title, lesson: lessonObj };

  STATE.localLessons = [entry, ...STATE.localLessons.filter(item => item.id !== id)];
  localStorage.setItem("tprs_local_lessons", JSON.stringify(STATE.localLessons));
  localStorage.setItem("tprs_active_draft_lesson", JSON.stringify(lessonObj));
  STATE.activeLessonId = id;
}

async function init() {
  try {
    const [manifestRes, toolboxRes] = await Promise.all([
      fetch("data/manifest.json?t=" + Date.now()),
      fetch("data/toolbox.json?t=" + Date.now())
    ]);
    if (manifestRes.ok) STATE.manifest = await manifestRes.json();
    if (toolboxRes.ok) STATE.toolbox = await toolboxRes.json();

    const localDraft = localStorage.getItem("tprs_active_draft_lesson");
    if (localDraft) {
      STATE.currentLesson = JSON.parse(localDraft);
      if (STATE.localLessons.length > 0) STATE.activeLessonId = STATE.localLessons[0].id;
    } else if (STATE.manifest.length > 0) {
      await loadLesson(STATE.manifest[0].file);
    } else {
      STATE.currentLesson = DEFAULT_LESSON;
    }
    render();
  } catch (err) {
    STATE.currentLesson = DEFAULT_LESSON;
    render();
  }
}

async function loadLesson(selectionValue) {
  if (selectionValue.startsWith("local_")) {
    const found = STATE.localLessons.find(l => l.id === selectionValue);
    if (found) {
      STATE.currentLesson = found.lesson;
      STATE.activeLessonId = found.id;
      STATE.scaffoldingLevel = 1;
      localStorage.setItem("tprs_active_draft_lesson", JSON.stringify(found.lesson));
    }
    return;
  }

  localStorage.removeItem("tprs_active_draft_lesson");
  const res = await fetch(selectionValue + "?t=" + Date.now());
  if (res.ok) {
    STATE.currentLesson = await res.json();
    STATE.activeLessonId = selectionValue;
    STATE.scaffoldingLevel = 1;
  } else {
    STATE.currentLesson = DEFAULT_LESSON;
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

async function translateLineInline(idx) {
  const lesson = STATE.currentLesson || DEFAULT_LESSON;
  const item = lesson[STATE.track]?.stage1_rawInput?.items?.[idx];
  if (!item) return;

  const glossEl = document.getElementById(`gloss-${idx}`);
  if (glossEl) glossEl.textContent = "Translating...";

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(item.it)}&langpair=it|en`
    );
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated) {
      item.en = translated;
      if (glossEl) glossEl.textContent = translated;
      saveToLocalLibrary(lesson);
    } else if (glossEl) {
      glossEl.textContent = "Could not fetch translation—try again.";
    }
  } catch (e) {
    if (glossEl) glossEl.textContent = "Network error while translating.";
  }
}

function audioButtons(text, lineIdx = null) {
  const safe = escapeAttr(text);
  return `
    <span class="audio-group">
      <button class="audio-btn" title="Slow 0.75x" data-text="${safe}" onclick="speak(this.dataset.text, 0.75)">🐢</button>
      <button class="audio-btn" title="Normal 0.95x" data-text="${safe}" onclick="speak(this.dataset.text, 0.95)">🔊</button>
      ${lineIdx !== null ? `<button class="audio-btn" title="Refresh inline English gloss" onclick="translateLineInline(${lineIdx})">🌐 EN</button>` : ""}
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

function downloadCurrentLessonJSON() {
  const lesson = STATE.currentLesson || DEFAULT_LESSON;
  const date = lesson.date || new Date().toISOString().slice(0, 10);
  const filename = `${date}.json`;
  const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);

  const status = document.getElementById("lesson-export-status");
  if (status) status.textContent = `✓ Downloaded ${filename}`;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function githubUpsertFile(path, contentString, commitMessage) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${STATE.githubToken}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json"
  };

  let sha = null;
  let existingContent = null;
  const getRes = await fetch(apiUrl, { headers });
  if (getRes.ok) {
    const existing = await getRes.json();
    sha = existing.sha;
    if (existing.content) existingContent = base64ToUtf8(existing.content);
  }

  const finalString = typeof contentString === "function" ? contentString(existingContent) : contentString;

  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: commitMessage,
      content: utf8ToBase64(finalString),
      branch: GITHUB_CONFIG.branch,
      ...(sha ? { sha } : {})
    })
  });

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    throw new Error(errData.message || `GitHub API error (${putRes.status})`);
  }
  return finalString;
}

async function saveLessonToGitHub() {
  const status = document.getElementById("lesson-export-status");
  if (!STATE.githubToken) {
    alert("Add your GitHub Token once under '1. Add Input → GitHub Auto-Archive Token' (or use Download JSON).");
    return;
  }

  const lesson = STATE.currentLesson || DEFAULT_LESSON;
  const date = lesson.date || new Date().toISOString().slice(0, 10);
  const title = lesson.trackB?.stage1_rawInput?.title || lesson.trackA?.stage1_rawInput?.title || "Daily Lesson";
  const filePath = `data/lessons/${date}.json`;

  try {
    if (status) status.textContent = `⏳ Saving to ${filePath}...`;
    const savedJsonStr = await githubUpsertFile(
      filePath,
      (existingText) => {
        let merged = JSON.parse(JSON.stringify(lesson));
        if (existingText) {
          try {
            const prev = JSON.parse(existingText);
            merged = { ...prev, ...lesson, date };
          } catch (e) {}
        }
        return JSON.stringify(merged, null, 2);
      },
      `Save daily TPRS lesson: ${date}`
    );

    STATE.currentLesson = JSON.parse(savedJsonStr);

    if (status) status.textContent = "⏳ Updating data/manifest.json...";
    const updatedManifestStr = await githubUpsertFile(
      "data/manifest.json",
      (existingText) => {
        let list = [];
        try {
          if (existingText) list = JSON.parse(existingText);
        } catch (e) {
          list = [];
        }
        list = [{ date, title, file: filePath }, ...list.filter(item => item.file !== filePath)];
        return JSON.stringify(list, null, 2);
      },
      `Update manifest.json for ${date}`
    );

    STATE.manifest = JSON.parse(updatedManifestStr);
    STATE.activeLessonId = filePath;
    if (status) status.textContent = `✅ Saved to ${filePath} & added to dropdown!`;
  } catch (err) {
    if (status) status.textContent = `⚠️ GitHub Save Failed: ${err.message}`;
  }
}

function saveGeminiKey() {
  const val = document.getElementById("gemini-key-input").value.trim();
  STATE.geminiApiKey = val;
  if (val) {
    localStorage.setItem("tprs_gemini_api_key", val);
    alert("✓ Gemini API Key saved privately in your browser!");
  } else {
    localStorage.removeItem("tprs_gemini_api_key");
    alert("Gemini API Key cleared.");
  }
  render();
}

function saveGithubToken() {
  const val = document.getElementById("github-token-input").value.trim();
  STATE.githubToken = val;
  if (val) {
    localStorage.setItem("tprs_github_token", val);
    alert("✓ GitHub Token saved privately in your browser!");
  } else {
    localStorage.removeItem("tprs_github_token");
    alert("GitHub Token cleared.");
  }
  render();
}

function cleanAndDedupeTranscript(rawText) {
  const rawSentences = rawText
    .replace(/\s+/g, " ")
    .split(/(?<=[.?!])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  const seen = new Set();
  const uniqueSentences = [];
  for (const s of rawSentences) {
    const norm = s.toLowerCase().replace(/[.?!,;:]+$/g, "").trim();
    if (norm.length > 2 && !seen.has(norm)) {
      seen.add(norm);
      uniqueSentences.push(s);
    }
  }
  return uniqueSentences;
}

function detectNonEnglishPatterns(sentences, sourceUrl) {
  const joined = " " + sentences.join(" ") + " ";
  const notes = [];
  if (sourceUrl) notes.push(`Source Link: ${sourceUrl}`);

  if (/\bchi\b/i.test(joined) && !/\bchi\s+(è|sono|sei|ha|fa)\b.*\?/i.test(joined)) {
    notes.push("Relative 'chi' = 'those who / anyone who' (e.g., 'chi soffre' = those who suffer, rather than a question word 'who?').");
  }
  if (/\b(siamo|andiamo|facciamo|consoliamo|pregate|guardate|ascoltate|venite|vediamo)\b/i.test(joined)) {
    notes.push("Subject-dropped Imperative ('noi' / 'voi' command): e.g., 'Siamo...' = 'Let's be...', 'Vediamo...' = 'Let's see...', 'Pregate...' = 'Pray (you all)...'.");
  }
  if (/\b(mi|ti|gli|le|lo|la|ci|vi)\s+[a-zàèéìòù]{3,}/i.test(joined)) {
    notes.push("Pre-verb Object Pronouns (S + O + V): Short pronouns like 'mi / ti / gli / le / lo / la' sit directly BEFORE the conjugated verb.");
  }
  if (/\b(ne|ci)\b/i.test(joined)) {
    notes.push("Particles 'ci' (there / about it) or 'ne' (of it / some of them): Italian packs prepositional phrases into tiny pre-verb particles.");
  }
  if (/\b[a-z]+i\s+(miei|tuoi|suoi|nostri|vostri)\b/i.test(joined)) {
    notes.push("Possessive placed AFTER the noun (e.g., 'amici miei'): Used in direct greetings/vocatives for warmth and affection.");
  }
  if (/\bche\b/i.test(joined)) {
    notes.push("Connector 'che' ('that / which / who'): Unlike English, Italian NEVER drops 'that' between two clauses.");
  }

  if (notes.length <= (sourceUrl ? 1 : 0)) {
    notes.push("Tip: Notice how Italian drops subject pronouns (io, tu, noi) because the verb ending already tells you who is acting.");
  }
  return notes;
}

async function fetchAutoEnglishLines(cleanLines) {
  const results = [];
  for (const line of cleanLines) {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(line)}&langpair=it|en`
      );
      const data = await res.json();
      const en = data?.responseData?.translatedText || "Tap 🌐 EN to translate inline";
      results.push({ it: line, en });
    } catch (e) {
      results.push({ it: line, en: "Tap 🌐 EN to translate inline" });
    }
  }
  return results;
}

async function buildRuleBasedTrackB(title, rawText, sourceUrl) {
  const cleanLines = cleanAndDedupeTranscript(rawText);
  const anchors = detectNonEnglishPatterns(cleanLines, sourceUrl);
  const items = await fetchAutoEnglishLines(cleanLines);
  const firstLine = cleanLines[0] || "Ciao amici miei!";
  const words = firstLine.replace(/[.,!?]/g, "").split(/\s+/);
  const stem = words.slice(0, Math.max(2, words.length - 1)).join(" ");
  const lastWord = words[words.length - 1] || "tutti";

  return {
    stage1_rawInput: {
      title: title || "Fun-Italian Clip",
      sourceUrl: sourceUrl || "",
      items,
      anchors
    },
    stage2_tprs: {
      step0_umbrella: {
        frame: firstLine,
        cue: "Step 1: Read the Non-English Logic notes below. Step 2: Listen at 0.75x until every word separates clearly."
      },
      step1_hfChunks: cleanLines.slice(0, 5).map(l => ({
        it: l.split(/\s+/).slice(0, 3).join(" "),
        en: "key phrase"
      })),
      step2_singleSlot: {
        stem,
        variables: [lastWord, "oggi", "per tutti", "sempre"]
      },
      step3_circling: [
        { type: "Statement", q: firstLine, a: `Sì, ${firstLine.toLowerCase()}` },
        { type: "Open Wh-", q: "Che cosa dice questo passaggio?", a: firstLine }
      ],
      step4_scaffolding: {
        level1: cleanLines[0] || "",
        level2: cleanLines.slice(0, 2).join(" "),
        level3: cleanLines.join(" ")
      },
      step5_writeOutput: {
        prompt: `Shadow & adapt: Rewrite "${firstLine}" changing one detail for your own life.`
      }
    },
    stage3_output: {
      aliveQA: {
        question: "Qual è l'idea principale di questo brano secondo te?"
      },
      gentleFeedback: {
        thoughtSlice: "Focus on linking words smoothly in breath groups rather than pausing after every word.",
        modelAnswer: firstLine
      },
      personalStory: {
        prompt: "Write 2 sentences in 1st-person POV using one expression from today's clip."
      }
    }
  };
}

async function decodeWithGeminiAPI(title, rawText, sourceUrl) {
  const prompt = `You are an Italian TPRS coach for an English-speaking learner.
Analyze this Italian transcript from ${sourceUrl || "a web clip"}:
"""
${rawText}
"""
1. Deduplicate any repeated/looping captions into clean, natural Italian sentences.
2. Identify expressions/grammar that differ from English word-for-word logic (e.g., dropped subjects, imperatives, 'chi', pre-verb pronouns, idioms).
3. Provide accurate line-by-line English translations (NO Chinese).
4. Return ONLY valid JSON matching this exact structure (no markdown fences):
{
  "stage1_rawInput": {
    "title": "${title || "Fun-Italian Clip"}",
    "sourceUrl": "${sourceUrl || ""}",
    "items": [
      { "it": "Italian sentence", "en": "Natural English translation" }
    ],
    "anchors": [
      "Non-English expression/grammar explanation 1",
      "Non-English expression/grammar explanation 2"
    ]
  },
  "stage2_tprs": {
    "step0_umbrella": { "frame": "Key pattern frame", "cue": "Listening cue" },
    "step1_hfChunks": [{ "it": "chunk", "en": "meaning" }],
    "step2_singleSlot": { "stem": "Locked starter", "variables": ["opt1", "opt2", "opt3"] },
    "step3_circling": [
      { "type": "Statement", "q": "...", "a": "..." },
      { "type": "Yes/No", "q": "...", "a": "..." },
      { "type": "Open Wh-", "q": "...", "a": "..." }
    ],
    "step4_scaffolding": { "level1": "...", "level2": "...", "level3": "..." },
    "step5_writeOutput": { "prompt": "..." }
  },
  "stage3_output": {
    "aliveQA": { "question": "..." },
    "gentleFeedback": { "thoughtSlice": "...", "modelAnswer": "..." },
    "personalStory": { "prompt": "..." }
  }
}`;

  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  let lastErr = "Gemini API error";

  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(STATE.geminiApiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = rawJson.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(cleaned);
    } else {
      const errBody = await res.json().catch(() => ({}));
      lastErr = errBody?.error?.message || `HTTP ${res.status}`;
    }
  }
  throw new Error(lastErr);
}

async function processTrackBInput() {
  const url = document.getElementById("web-url-box").value.trim();
  const title = document.getElementById("web-title-box").value.trim() || (url ? "Fun-Italian Web Clip" : "Fun-Italian Transcript");
  const rawText = document.getElementById("web-raw-box").value.trim();
  const statusEl = document.getElementById("decode-status");

  if (!rawText) {
    alert("Please paste the transcript or lines from the video/link first.");
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const baseLesson = STATE.currentLesson
    ? JSON.parse(JSON.stringify(STATE.currentLesson))
    : JSON.parse(JSON.stringify(DEFAULT_LESSON));
  baseLesson.date = today;

  if (STATE.geminiApiKey) {
    statusEl.textContent = "✨ Decoding expressions & translating line-by-line with Gemini AI...";
    try {
      baseLesson.trackB = await decodeWithGeminiAPI(title, rawText, url);
    } catch (err) {
      statusEl.textContent = `⚠️ Gemini Key Note (${err.message}) — translating line-by-line automatically...`;
      baseLesson.trackB = await buildRuleBasedTrackB(title, rawText, url);
    }
  } else {
    statusEl.textContent = "⏳ Cleaning transcript & translating line-by-line...";
    baseLesson.trackB = await buildRuleBasedTrackB(title, rawText, url);
  }

  STATE.currentLesson = baseLesson;
  saveToLocalLibrary(baseLesson);
  STATE.track = "trackB";
  STATE.stageView = 1;
  setBranch("branch1");
}

function copyPromptForGemini() {
  const url = document.getElementById("web-url-box").value.trim();
  const rawText = document.getElementById("web-raw-box").value.trim();
  if (!rawText) return alert("Paste the transcript first!");

  const payload = `Decode this Track B Fun-Italian transcript (${url || "web clip"}) in two steps (English only, no Chinese):
1a. Explain any expressions or grammar that differ from English word-for-word logic.
1b. Deduplicate any loops and provide clean line-by-line Italian + English translations.
2. Output the complete Track B JSON for my TPRS Lab:

${rawText}`;

  navigator.clipboard.writeText(payload).then(() => {
    alert("✓ Copied structured prompt! Paste it into your Gemini chat.");
  });
}

function importFullLessonJSON() {
  try {
    const raw = document.getElementById("json-import-box").value.trim();
    const parsed = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);

    if (parsed.trackB) {
      STATE.currentLesson = parsed;
    } else if (parsed.stage1_rawInput) {
      const base = STATE.currentLesson ? JSON.parse(JSON.stringify(STATE.currentLesson)) : JSON.parse(JSON.stringify(DEFAULT_LESSON));
      base.date = today;
      base.trackB = parsed;
      STATE.currentLesson = base;
    } else {
      throw new Error("Unrecognized JSON shape");
    }

    saveToLocalLibrary(STATE.currentLesson);
    STATE.track = "trackB";
    STATE.stageView = 1;
    setBranch("branch1");
  } catch (e) {
    alert("⚠️ Invalid JSON format. Make sure you copied the entire JSON block.");
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
      <span class="stage-badge s2">Track B · Fun-Italian Link & Transcript Decoder</span>
      <h2>🎬 Paste Link & Transcript (Read → Comprehend → Listen)</h2>
      <p style="font-size:0.88rem;color:var(--muted);margin-top:-0.4rem;">
        Paste any Facebook Reel / YouTube link and its raw transcript below. Every decoded clip auto-translates inline and saves to your library.
      </p>
      <input type="url" id="web-url-box" placeholder="Link: https://www.facebook.com/reel/..." />
      <input type="text" id="web-title-box" placeholder="Clip Title (optional, e.g., Pace per tutti)" />
      <textarea id="web-raw-box" rows="5" placeholder="Paste raw Italian transcript here (even messy or repeating captions)..."></textarea>
      <div id="decode-status" style="font-size:0.85rem;color:var(--green);margin-top:0.4rem;"></div>
      <div style="margin-top:0.65rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <button class="pill-btn active" onclick="processTrackBInput()">
          ${STATE.geminiApiKey ? "✨ AI Decode & Load into Track B" : "▶ Decode & Load into Track B"}
        </button>
        <button class="pill-btn" onclick="copyPromptForGemini()">📋 Copy Prompt for Gemini Chat</button>
      </div>

      <details style="margin-top:1rem;">
        <summary>🔑 Optional: Gemini API Key for Deep Grammar & Idiom Notes (${STATE.geminiApiKey ? "Active ✓" : "Off"})</summary>
        <p style="font-size:0.84rem;color:var(--muted);margin:0.4rem 0;">
          Stored privately in your browser's <code>localStorage</code> only (never uploaded to GitHub).
        </p>
        <div style="display:flex;gap:0.4rem;align-items:center;">
          <input type="text" id="gemini-key-input" value="${escapeAttr(STATE.geminiApiKey)}" placeholder="AIzaSy..." style="margin-top:0;" />
          <button class="pill-btn" onclick="saveGeminiKey()">Save</button>
        </div>
      </details>

      <details style="margin-top:0.6rem;">
        <summary>☁️ Optional: GitHub Auto-Archive Token (${STATE.githubToken ? "Connected ✓" : "Not Set"})</summary>
        <p style="font-size:0.84rem;color:var(--muted);margin:0.4rem 0;">
          Stored privately in your browser's <code>localStorage</code> only. Saves daily lessons directly to <code>data/lessons/YYYY-MM-DD.json</code> in <code>${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}</code>.
        </p>
        <div style="display:flex;gap:0.4rem;align-items:center;">
          <input type="text" id="github-token-input" value="${escapeAttr(STATE.githubToken)}" placeholder="github_pat_..." style="margin-top:0;" />
          <button class="pill-btn" onclick="saveGithubToken()">Save</button>
        </div>
      </details>
    </section>

    <section class="card">
      <span class="stage-badge s3">Optional · Paste JSON from Gemini Chat</span>
      <h2>⚡ Quick-Load Gemini JSON</h2>
      <textarea id="json-import-box" rows="3" placeholder="Paste full JSON (or trackB JSON) from Gemini here..."></textarea>
      <div style="margin-top:0.6rem;">
        <button class="pill-btn" onclick="importFullLessonJSON()">✨ Load JSON into Lab</button>
      </div>
    </section>
  `;
}

function renderBranch1() {
  const lesson = STATE.currentLesson || DEFAULT_LESSON;
  const data = lesson[STATE.track];
  const v = STATE.stageView;
  const hasOptions = STATE.localLessons.length > 0 || STATE.manifest.length > 0;

  return `
    <div class="sub-bar">
      <div>
        <button class="pill-btn ${STATE.track === 'trackB' ? 'active' : ''}" onclick="setTrack('trackB')">Track B: Fun-Italian</button>
        <button class="pill-btn ${STATE.track === 'trackA' ? 'active' : ''}" onclick="setTrack('trackA')">Track A: DUO</button>
      </div>
      ${hasOptions ? `
        <select onchange="changeDate(this.value)">
          ${STATE.localLessons.length > 0 ? `
            <optgroup label="💻 Browser Saved Lessons">
              ${STATE.localLessons.map(l => `<option value="${l.id}" ${STATE.activeLessonId === l.id ? 'selected' : ''}>📌 ${l.date} — ${l.title}</option>`).join("")}
            </optgroup>
          ` : ""}
          ${STATE.manifest.length > 0 ? `
            <optgroup label="☁️ GitHub Archived Lessons">
              ${STATE.manifest.map(m => `<option value="${m.file}" ${STATE.activeLessonId === m.file ? 'selected' : ''}>📅 ${m.date} — ${m.title}</option>`).join("")}
            </optgroup>
          ` : ""}
        </select>
      ` : `<span style="font-size:0.84rem;color:var(--muted);">📅 ${lesson.date || "Today"}</span>`}
    </div>

    <div class="stage-bar">
      <button class="pill-btn ${v === 1 ? 'active' : ''}" onclick="setStageView(1)">1. Read & Listen</button>
      <button class="pill-btn ${v === 2 ? 'active' : ''}" onclick="setStageView(2)">2. TPRS Drills (0–5)</button>
      <button class="pill-btn ${v === 3 ? 'active' : ''}" onclick="setStageView(3)">3. Speak & Reflect</button>
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
  const sourceUrl = data.stage1_rawInput.sourceUrl;
  return `
    <section class="card">
      <span class="stage-badge s1">Step 1 · Comprehensible Reading & Listening</span>
      <h2>${data.stage1_rawInput.title}</h2>
      ${sourceUrl ? `<p style="margin:-0.5rem 0 0.8rem;font-size:0.84rem;">🔗 <a href="${escapeAttr(sourceUrl)}" target="_blank" rel="noopener" style="color:var(--blue);">${sourceUrl}</a></p>` : ""}

      <details open style="margin-bottom:0.9rem;background:#fefce8;border-color:#fde68a;">
        <summary style="color:#92400e;">💡 1a. Non-English Logic & Expressions (Read This First)</summary>
        <ul style="margin:0.4rem 0;padding-left:1.2rem;">
          ${data.stage1_rawInput.anchors.map(a => `<li style="margin-bottom:0.3rem;">${a}</li>`).join("")}
        </ul>
      </details>

      <h3 style="margin-top:0.5rem;">1b. Line-by-Line Comprehension & Ear Training (🐢 0.75x / 🔊 0.95x)</h3>
      ${data.stage1_rawInput.items.map((item, idx) => `
        <div class="line-item">
          <div class="line-top">
            <strong style="font-size:1.06rem;">${item.it}</strong>
            ${audioButtons(item.it, idx)}
          </div>
          <div id="gloss-${idx}" style="color:var(--muted);font-size:0.9rem;margin-top:0.2rem;">${item.en}</div>
        </div>
      `).join("")}

      <div style="margin-top:1rem;padding-top:0.8rem;border-top:1px solid var(--border);display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
        <button class="pill-btn active" onclick="saveLessonToGitHub()">☁️ Save to GitHub</button>
        <button class="pill-btn" onclick="downloadCurrentLessonJSON()">⬇️ Download JSON</button>
        <span id="lesson-export-status" style="font-size:0.84rem;color:var(--green);"></span>
      </div>
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
      <span class="stage-badge s2">Step 2 · TPRS Listening & Pattern Drills (0 → 5)</span>
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
      <span class="stage-badge s3">Step 3 · Output & Gentle Cognitive Assessment</span>
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
      <span class="stage-badge s3">Toolbox · Interactive Mini-Apps</span>
      <h2>🧭 Verb & Pronoun Matrix (Core 5 Tenses + Si)</h2>
      <p style="font-size:0.88rem;color:var(--muted);margin-top:-0.4rem;">
        Shift sentences across all <strong>7 Subject Pronouns</strong> (including implicit <em>esso/essa</em>) + <strong><code>si + verb</code></strong> across the Core 5 tenses with 🐢 0.75x / 🔊 0.95x Italian audio.
      </p>
      <div style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <a href="toolbox/verb-matrix.html" target="_blank" rel="noopener" class="pill-btn active" style="text-decoration:none;display:inline-flex;align-items:center;gap:0.35rem;">
          🚀 Open Verb & Pronoun Matrix →
        </a>
      </div>
    </section>

    <section class="card">
      <span class="stage-badge s2">Toolbox · Duolingo Pattern Decoder</span>
      <h2>⚖️ Quick Card: “si + verb” vs. “would + verb” (Condizionale)</h2>
      <p style="font-size:0.88rem;color:var(--muted);margin-top:-0.35rem;">
        <strong>Key Rule:</strong> Impersonal/Passive <code>si</code> only uses 2 forms (Singular vs. Plural), whereas <em>“would + verb”</em> changes across all 7 pronouns.
      </p>

      <h3>A. Impersonal &amp; Passive <code>si + verb</code> (Only 2 Forms!)</h3>
      <div style="display:grid;gap:0.45rem;font-size:0.88rem;">
        <div class="level-box" style="margin-top:0;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
          <div><strong>1. General / Singular Object (3rd sg.):</strong> <em>In Italia <strong>si beve</strong> molto caffè.</em> <span style="color:var(--muted);">(People drink / Coffee is drunk)</span></div>
          ${audioButtons("In Italia si beve molto caffè.")}
        </div>
        <div class="level-box" style="margin-top:0;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
          <div><strong>2. Plural Objects (3rd pl.):</strong> <em>Le medicine <strong>si prendono</strong> dopo cena.</em> <span style="color:var(--muted);">(Medicines are taken)</span></div>
          ${audioButtons("Le medicine si prendono dopo cena.")}
        </div>
        <div class="level-box" style="margin-top:0;background:#fefce8;border-color:#fde68a;">
          <strong>⚠️ Don't confuse with Reflexive:</strong> When the person changes (<em>io <strong>mi</strong> alzo, tu <strong>ti</strong> alzi, lui <strong>si</strong> alza, noi <strong>ci</strong> alziamo</em>), that's doing an action to oneself—not impersonal <code>si</code>.
        </div>
      </div>

      <h3 style="margin-top:1.1rem;">B. “Would + Verb” (Condizionale — 7 Pronouns)</h3>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.86rem;">
          <thead>
            <tr style="background:#f5f5f4;text-align:left;">
              <th style="padding:0.45rem;border-bottom:1px solid var(--border);">Pronoun</th>
              <th style="padding:0.45rem;border-bottom:1px solid var(--border);">Ending</th>
              <th style="padding:0.45rem;border-bottom:1px solid var(--border);">Example (<em>bere / essere</em>)</th>
              <th style="padding:0.45rem;border-bottom:1px solid var(--border);">Listen</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="padding:0.4rem;"><strong>io</strong></td><td>-rei</td><td><em><strong>Berrei</strong> una camomilla.</em> (I would drink...)</td><td>${audioButtons("Berrei una camomilla.")}</td></tr>
            <tr><td style="padding:0.4rem;"><strong>tu</strong></td><td>-resti</td><td><em><strong>Berresti</strong> un caffè?</em> (Would you drink...)</td><td>${audioButtons("Berresti un caffè?")}</td></tr>
            <tr><td style="padding:0.4rem;"><strong>lui / lei</strong></td><td>-rebbe</td><td><em><strong>Berrebbe</strong> volentieri.</em> (He/She would drink...)</td><td>${audioButtons("Berrebbe volentieri.")}</td></tr>
            <tr><td style="padding:0.4rem;"><strong>(esso) [it]</strong></td><td>-rebbe</td><td><em><strong>Sarebbe</strong> perfetto!</em> (It would be...)</td><td>${audioButtons("Sarebbe perfetto!")}</td></tr>
            <tr><td style="padding:0.4rem;"><strong>noi</strong></td><td>-remmo</td><td><em><strong>Berremmo</strong> un tè.</em> (We would drink...)</td><td>${audioButtons("Berremmo un tè.")}</td></tr>
            <tr><td style="padding:0.4rem;"><strong>voi</strong></td><td>-reste</td><td><em><strong>Berreste</strong> acqua?</em> (Would you all drink...)</td><td>${audioButtons("Berreste acqua?")}</td></tr>
            <tr><td style="padding:0.4rem;"><strong>loro</strong></td><td>-rebbero</td><td><em><strong>Berrebbero</strong> vino.</em> (They would drink...)</td><td>${audioButtons("Berrebbero vino.")}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

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
            ├── Interactive Mini-Apps (Verb & Pronoun Matrix)<br>
            ├── Duolingo Pattern Decoder (si + verb vs. Condizionale)<br>
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

init();
