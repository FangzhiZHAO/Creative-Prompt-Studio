const fieldConfig = [
  { key: "subject", label: "Subject", scope: "all" },
  { key: "scene", label: "Scene", scope: "all" },
  { key: "style", label: "Style", scope: "all" },
  { key: "composition", label: "Composition", scope: "all" },
  { key: "lighting", label: "Lighting", scope: "all" },
  { key: "motion", label: "Movement", scope: "video" },
  { key: "camera", label: "Camera", scope: "video" },
  { key: "transitions", label: "Transitions", scope: "video" },
  { key: "reference", label: "Reference", scope: "video" },
  { key: "negative", label: "Negative Prompt", scope: "all" },
];

const tipSets = {
  image: [
    "Lead with the subject, then place scene, style, and composition where they clarify the image instead of competing with it.",
    "Name a specific photographer, painter, or art movement — it anchors style far faster than stacking adjectives.",
    "Lighting sets the emotional tone before the model processes anything else. Place it early.",
    "If the prompt feels muddy, remove duplicate adjectives before adding more detail.",
    "Keep negative prompts practical and specific to visible artifacts you actually want to avoid.",
    "A short color palette reference paired with a mood word shapes the image without overspecifying.",
    "Composition terms like 'rule of thirds' or 'leading lines' outperform vague spatial descriptions.",
    "Describe what fills the background — the model needs positive direction, not just what to omit.",
    "Film grain, lens halation, or analog texture makes renders feel grounded and less synthetic.",
    "If two style references conflict, the model splits its attention. Commit to one direction.",
    "Faces improve when you describe the expression explicitly rather than relying on scene context.",
    "Test composition at a square or small crop before committing to a final aspect ratio and resolution.",
  ],
  video: [
    "Describe motion as a sequence of beats so the model understands how the scene evolves over time.",
    "Camera moves work best when they serve the emotion — not when they fill empty prompt space.",
    "Anchor the scene first. Describe where it starts before you describe where it goes.",
    "Slow motion needs both the subject's movement and the camera's position to read clearly.",
    "Name transition types explicitly — 'smash cut', 'dissolve', and 'match cut' produce very different results.",
    "For looping video, describe the end state mirroring the start to help the model close the loop.",
    "Handheld camera with fast motion creates unintended blur. Add 'steady' when clarity matters.",
    "Reference a director or film to communicate the full visual grammar you are aiming for.",
    "Atmospheric motion — smoke, fabric, water — is more reliable than complex character choreography.",
    "Start with a static frame description to establish scene context before introducing movement.",
    "Use 'hold on' or 'linger on' to tell the model when to pause on a specific detail.",
    "Treat reference consistency like a hard constraint — state it precisely rather than hoping the model infers it.",
  ],
};

const layerDescriptions = {
  subject:     "The main character, object, or visual focus — the first thing the eye should land on.",
  scene:       "The world around your subject: location, time of day, weather, and ambient atmosphere.",
  style:       "The visual language — editorial, cinematic, painterly, or a specific artist's signature.",
  composition: "How the frame is arranged: shot type, angle, depth of field, and foreground-background balance.",
  lighting:    "The quality and direction of light, which sets the emotional temperature of the whole image.",
  motion:      "How things move through the frame — pace, direction, energy, and rhythm of action.",
  camera:      "The lens behavior and camera move: dolly, pan, tilt, handheld, or rack focus.",
  transitions: "How scenes connect: cut to, dissolve, match cut, whip pan, or fade.",
  reference:   "What must stay consistent across frames: a face, product shape, color palette, or setting.",
  negative:    "What to exclude — specific artifacts like extra fingers, jitter, text, or motion blur.",
};

const fieldSuggestions = {
  subject: "Focus on the main character, object, material, or defining trait.",
  scene: "Try location, time of day, weather, architecture, or atmosphere.",
  style: "Think editorial, cinematic, photoreal, anime, painterly, grainy, glossy.",
  composition: "Useful terms: close-up, wide shot, low angle, overhead, shallow depth of field.",
  lighting: "Useful terms: soft light, rim light, backlit, golden hour, neon glow, overcast.",
  motion: "Useful terms: drifting, gliding, turning, sprinting, slow motion, unfolding.",
  camera: "Useful terms: dolly-in, tracking shot, handheld, crane-up, pan, tilt, rack focus.",
  transitions: "Useful terms: cut to, reveal, dissolve, whip pan, match cut, fade in.",
  reference: "Note what must stay consistent: face, wardrobe, product shape, palette, setting.",
  negative: "Call out artifacts to avoid: extra fingers, warped anatomy, jitter, text, blur.",
};

const fallbackRules = {
  negative: ["no ", "without ", "avoid ", "exclude ", "do not", "don't"],
  transitions: ["transition", "cut to", "reveal", "open on", "end on", "dissolve", "fade"],
  camera: ["camera", "tracking shot", "dolly", "push in", "pull back", "crane", "pan", "tilt", "zoom", "lens", "handheld", "steadicam", "rack focus"],
  motion: ["walking", "running", "moving", "turning", "spinning", "drifting", "gliding", "jump", "leap", "motion", "action"],
  composition: ["close-up", "medium shot", "wide shot", "portrait", "framing", "depth of field", "foreground", "background", "angle", "centered"],
  lighting: ["lit by", "lighting", "backlit", "rim light", "glow", "sunlight", "neon", "shadow", "soft light", "overcast"],
  style: ["cinematic", "editorial", "realism", "photography", "film", "anime", "3d", "render", "illustration", "moody", "luxury"],
  scene: ["inside", "street", "city", "forest", "room", "studio", "market", "beach", "desert", "night", "sunset", "rain", "snow"],
  reference: ["keep", "consistent", "same ", "preserve", "reference", "based on"],
};

const modeButtons = document.querySelectorAll(".mode-button");
const viewButtons = document.querySelectorAll(".view-button");
const tipCard = document.querySelector("#tip-card");
const tipText = document.querySelector("#tip-text");
const analyzeButton = document.querySelector("#analyze-button");
const startBuildButton = document.querySelector("#start-build-button");
const resetTextButton = document.querySelector("#reset-text-button");
const analysisStatus = document.querySelector("#analysis-status");
const analyzerInput = document.querySelector("#analyzer-input");
const plainPreview = document.querySelector("#plain-preview");
const plainCopyBuffer = document.querySelector("#plain-copy-buffer");
const copyPlainButton = document.querySelector("#copy-plain");
const analysisProgress = document.querySelector("#analysis-progress");
const textCanvas = document.querySelector("#text-canvas");
const visualCanvas = document.querySelector("#visual-canvas");
const visualEditor = document.querySelector("#visual-editor");
const canvasCaption = document.querySelector("#canvas-caption");
const apiEndpointInput = document.querySelector("#api-endpoint");
const apiModelInput = document.querySelector("#api-model");
const apiKeyInput = document.querySelector("#api-key");
const editorCardTemplate = document.querySelector("#editor-card-template");

let currentMode = "image";
let currentView = "text";
let segmentState = createEmptyState();
const UNSPECIFIED = "NOT SPECIFIED";

const storageKeys = {
  endpoint: "prompt-studio-endpoint",
  model: "prompt-studio-model",
  key: "prompt-studio-key",
};

function createEmptyState() {
  return Object.fromEntries(fieldConfig.map((field) => [field.key, ""]));
}

function filteredFields() {
  return fieldConfig.filter((field) => field.scope === "all" || field.scope === currentMode);
}

let tipIndex = 0;
let tipTimer = null;

const tipAccents = [
  "subject", "scene", "style", "composition", "lighting",
  "motion", "camera", "transitions", "reference", "negative",
  "subject", "scene",
];

function applyTipContent(index) {
  const tips = tipSets[currentMode];
  const accent = tipAccents[index % tipAccents.length];
  tipText.textContent = tips[index];
  tipCard.dataset.accent = accent;
}

function renderTipCard(index, animate) {
  if (animate) {
    tipCard.classList.add("is-exiting");
    window.setTimeout(() => {
      applyTipContent(index);
      tipCard.classList.remove("is-exiting");
      tipCard.classList.add("is-entering");
      window.setTimeout(() => tipCard.classList.remove("is-entering"), 400);
    }, 280);
  } else {
    applyTipContent(index);
  }
}

function renderTips() {
  tipIndex = 0;
  applyTipContent(tipIndex);
  resetTipTimer();
}

function resetTipTimer() {
  if (tipTimer) window.clearInterval(tipTimer);
  tipTimer = window.setInterval(() => {
    tipIndex = (tipIndex + 1) % tipSets[currentMode].length;
    renderTipCard(tipIndex, true);
  }, 5000);
}

function updateModeUI() {
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === currentMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  renderTips();
  renderVisualEditor();
  renderPlainPrompt();
}

function updateViewUI() {
  viewButtons.forEach((button) => {
    const isActive = button.dataset.view === currentView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  textCanvas.classList.toggle("is-hidden", currentView !== "text");
  visualCanvas.classList.toggle("is-hidden", currentView !== "visual");

  if (currentView === "text") {
    canvasCaption.textContent = "Paste a prompt to begin.";
  } else {
    canvasCaption.textContent = "Edit each prompt element directly.";
  }
}

function loadSettings() {
  apiEndpointInput.value = localStorage.getItem(storageKeys.endpoint) || apiEndpointInput.value;
  apiModelInput.value = localStorage.getItem(storageKeys.model) || apiModelInput.value;
  apiKeyInput.value = localStorage.getItem(storageKeys.key) || "";
}

function persistSettings() {
  localStorage.setItem(storageKeys.endpoint, apiEndpointInput.value.trim());
  localStorage.setItem(storageKeys.model, apiModelInput.value.trim());
  localStorage.setItem(storageKeys.key, apiKeyInput.value);
}

function renderVisualEditor() {
  visualEditor.innerHTML = "";

  filteredFields().forEach((field) => {
    const card = editorCardTemplate.content.firstElementChild.cloneNode(true);
    const input = card.querySelector(".editor-input");
    const label = card.querySelector(".token-label");
    const suggestion = card.querySelector(".token-suggestion");

    card.classList.add(field.key);
    label.textContent = field.label;
    suggestion.textContent = fieldSuggestions[field.key] || "";
    input.value = segmentState[field.key] || UNSPECIFIED;
    input.placeholder = `Add ${field.label.toLowerCase()} details`;
    input.dataset.fieldKey = field.key;
    input.addEventListener("input", handleEditorInput);

    visualEditor.appendChild(card);
    autoSizeEditorInput(input);
  });
}

function composePlainPrompt() {
  return filteredFields()
    .map((field) => ({
      label: field.label,
      text: (segmentState[field.key] || "").trim() || UNSPECIFIED,
    }))
    .map((segment) => `[${segment.label}: ${segment.text}]`)
    .join("\n");
}

function renderPlainPrompt() {
  const segments = filteredFields().map((field) => ({
    key: field.key,
    label: field.label,
    text: (segmentState[field.key] || "").trim() || UNSPECIFIED,
  }));

  plainPreview.innerHTML = "";
  segments.forEach((segment) => {
    const token = document.createElement("span");
    token.className = `plain-segment ${segment.key}`;
    token.textContent = `[${segment.label}: ${segment.text}]`;
    plainPreview.appendChild(token);
  });

  plainCopyBuffer.value = composePlainPrompt();
}

function handleEditorInput(event) {
  const key = event.target.dataset.fieldKey;
  segmentState[key] = event.target.value.trim() || UNSPECIFIED;
  autoSizeEditorInput(event.target);
  renderPlainPrompt();
}

function autoSizeEditorInput(input) {
  input.style.height = "0px";
  input.style.height = `${input.scrollHeight}px`;
}

function normalizePrompt(prompt) {
  return prompt
    .replace(/\s+/g, " ")
    .replace(/\s*([,.;:])\s*/g, "$1 ")
    .trim();
}

function splitPromptIntoClauses(prompt) {
  return normalizePrompt(prompt)
    .split(/[\n]|,(?!\d)|\.(?=\s)|;|(?=\s(?:and then|then|while|with)\s)/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function classifyFallbackClause(clause, index) {
  const value = clause.toLowerCase();

  for (const [key, keywords] of Object.entries(fallbackRules)) {
    if (keywords.some((keyword) => value.includes(keyword))) {
      return key;
    }
  }

  if (index === 0) {
    return "subject";
  }

  return currentMode === "video" ? "scene" : "style";
}

function parsePromptFallback(prompt) {
  const nextState = createEmptyState();

  splitPromptIntoClauses(prompt).forEach((clause, index) => {
    const key = classifyFallbackClause(clause, index);
    const resolvedKey = key === "reference" && currentMode !== "video" ? "style" : key;
    const existing = nextState[resolvedKey];
    nextState[resolvedKey] = existing ? `${existing}, ${clause}` : clause;
  });

  filteredFields().forEach((field) => {
    nextState[field.key] = nextState[field.key] || UNSPECIFIED;
  });

  return nextState;
}

function sanitizeSegments(raw) {
  const nextState = createEmptyState();

  filteredFields().forEach((field) => {
    const value = typeof raw?.[field.key] === "string" ? raw[field.key].trim() : "";
    nextState[field.key] = value || UNSPECIFIED;
  });

  return nextState;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in the model response.");
  }

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

function buildClassifierPrompt(prompt) {
  const fieldNames = filteredFields().map((field) => field.key).join(", ");

  return [
    "Classify the following generation prompt into structured fields.",
    `Return JSON only with these keys: ${fieldNames}.`,
    "Rules:",
    "- Keep the wording close to the original prompt.",
    "- Put each phrase in the single best matching field.",
    "- Use empty strings for missing fields.",
    "- Do not add markdown, notes, or extra keys.",
    `- The prompt type is ${currentMode}.`,
    "",
    `Prompt: ${prompt}`,
  ].join("\n");
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function setAnalysisLoading(isLoading) {
  analysisProgress.classList.toggle("is-visible", isLoading);
  analysisProgress.setAttribute("aria-hidden", String(!isLoading));
}

async function classifyWithLLM(prompt) {
  const endpoint = apiEndpointInput.value.trim();
  const model = apiModelInput.value.trim();
  const apiKey = apiKeyInput.value;

  if (!endpoint || !model || !apiKey) {
    throw new Error("Endpoint, model, and API key are required.");
  }

  persistSettings();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You classify text-to-image and text/image-to-video prompts into prompt fields. Output valid JSON only.",
        },
        {
          role: "user",
          content: buildClassifierPrompt(prompt),
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`API request failed: ${response.status} ${details}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("The API response did not include message content.");
  }

  return sanitizeSegments(extractJson(content));
}

async function analyzePrompt() {
  const prompt = analyzerInput.value.trim();

  if (!prompt) {
    analysisStatus.textContent = "Paste a prompt first.";
    return;
  }

  analyzeButton.disabled = true;
  analysisStatus.textContent = "Analyzing with the LLM classifier...";
  setAnalysisLoading(true);
  const minimumDelay = delay(2000);

  try {
    const result = await classifyWithLLM(prompt);
    await minimumDelay;
    segmentState = result;
    analysisStatus.textContent = "Analysis complete. You can now edit each prompt element.";
  } catch (error) {
    await minimumDelay;
    segmentState = parsePromptFallback(prompt);
    analysisStatus.textContent = `LLM request failed, showing local fallback classification instead. ${error.message}`;
  } finally {
    analyzeButton.disabled = false;
    setAnalysisLoading(false);
    currentView = "visual";
    updateViewUI();
    renderVisualEditor();
    renderPlainPrompt();
  }
}

function startBlankVisualEdit() {
  segmentState = sanitizeSegments({});
  currentView = "visual";
  analysisStatus.textContent = "Blank visual editor ready. Add prompt parts directly.";
  updateViewUI();
  renderVisualEditor();
  renderPlainPrompt();
}

function resetToTextMode() {
  currentView = "text";
  analysisStatus.textContent = "Paste a prompt, then analyze it.";
  updateViewUI();
}

async function copyPlainPrompt() {
  if (!plainCopyBuffer.value) {
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plainCopyBuffer.value);
  } else {
    plainCopyBuffer.focus();
    plainCopyBuffer.select();
    document.execCommand("copy");
  }

  const originalText = copyPlainButton.textContent;
  copyPlainButton.textContent = "Copied";
  window.setTimeout(() => {
    copyPlainButton.textContent = originalText;
  }, 1500);
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentMode = button.dataset.mode;
    updateModeUI();
  });
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    updateViewUI();
  });
});

function updateActivePreset() {
  document.querySelectorAll(".preset-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.endpoint === apiEndpointInput.value.trim());
  });
}

document.querySelectorAll(".preset-button").forEach((button) => {
  button.addEventListener("click", () => {
    apiEndpointInput.value = button.dataset.endpoint;
    apiModelInput.value = button.dataset.model;
    persistSettings();
    updateActivePreset();
    apiKeyInput.focus();
  });
});

const legendHint = document.querySelector("#legend-hint");
const legendItems = document.querySelectorAll(".legend li");
let pinnedKey = null;

legendItems.forEach((item) => {
  const key = item.dataset.key;

  item.addEventListener("mouseenter", () => {
    if (!pinnedKey) {
      legendHint.textContent = layerDescriptions[key] || "";
      legendHint.dataset.accent = key;
      legendHint.classList.add("is-visible");
    }
  });

  item.addEventListener("mouseleave", () => {
    if (!pinnedKey) legendHint.classList.remove("is-visible");
  });

  item.addEventListener("click", () => {
    if (pinnedKey === key) {
      pinnedKey = null;
      legendHint.classList.remove("is-visible");
    } else {
      pinnedKey = key;
      legendHint.textContent = layerDescriptions[key] || "";
      legendHint.dataset.accent = key;
      legendHint.classList.add("is-visible");
    }
    legendItems.forEach((i) => i.classList.toggle("is-pinned", i.dataset.key === pinnedKey));
  });
});

analyzeButton.addEventListener("click", analyzePrompt);
startBuildButton.addEventListener("click", startBlankVisualEdit);
resetTextButton.addEventListener("click", resetToTextMode);
copyPlainButton.addEventListener("click", copyPlainPrompt);

[apiEndpointInput, apiModelInput, apiKeyInput].forEach((input) => {
  input.addEventListener("change", persistSettings);
});

loadSettings();
updateActivePreset();
renderTips();

// Seed segmentState from the default textarea before first render
if (analyzerInput.value.trim()) {
  segmentState = parsePromptFallback(analyzerInput.value.trim());
}

updateModeUI();
updateViewUI();

// ── Intro splash ──────────────────────────────────────────
(function runIntro() {
  const introScreen = document.getElementById("intro-screen");
  const canvas = document.getElementById("intro-canvas");
  const introTextEl = document.getElementById("intro-text");
  if (!introScreen || !canvas) return;

  const palette = [
    [255, 138, 101],
    [57, 208, 178],
    [192, 132, 252],
    [255, 190, 59],
    [255, 95, 138],
    [77, 185, 255],
    [94, 140, 255],
    [143, 209, 79],
  ];

  function explode() {
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fontSize = Math.min(52, window.innerWidth / 13);

    ctx.font = `700 ${fontSize}px "Avenir Next","Helvetica Neue","Segoe UI",sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText("Creative Prompt Studio", cx, cy);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const particles = [];
    const step = 3;

    for (let y = Math.floor(cy - fontSize); y < Math.floor(cy + fontSize); y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const idx = (y * canvas.width + x) * 4;
        if (imageData.data[idx + 3] > 100) {
          const color = palette[Math.floor(Math.random() * palette.length)];
          particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.75) * 7,
            color,
            alpha: 1,
            size: step * 0.95,
          });
        }
      }
    }

    introTextEl.style.animation = "none";
    introTextEl.style.opacity = "0";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let startTime = null;
    const duration = 1400;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const progress = (ts - startTime) / duration;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.alpha = Math.max(0, 1 - progress * 1.5);
        if (p.alpha > 0) {
          alive = true;
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      ctx.globalAlpha = 1;
      if (alive) {
        requestAnimationFrame(animate);
      } else {
        dismissIntro();
      }
    }

    requestAnimationFrame(animate);
  }

  function dismissIntro() {
    introScreen.style.transition = "opacity 0.5s ease";
    introScreen.style.opacity = "0";
    window.setTimeout(() => { if (introScreen.parentNode) introScreen.remove(); }, 550);
  }

  // Text fades in for ~1.5s, then explodes
  window.setTimeout(() => {
    try {
      explode();
    } catch (e) {
      dismissIntro();
    }
  }, 1500);
})();
