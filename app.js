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
    } catch
