// === BIAS LANDSCAPE SYSTEM (ported verbatim from app.js) ===
export const BIAS_GAMES = [
  {
    id: "bias_right",
    title: "The Dominant Hand",
    instruction: "Write a prompt without assuming handedness.",
    bias: "Default Assumption Bias",
    mappedTaskId: 1,
    filterType: "right_hand",
    target_image: "/images/targets/task_01.png",
    explanation: "Bias appears as missing information: the system loses parts of the scene instead of seeing the full input.",
  },
  {
    id: "bias_gender",
    title: "The Glass Ceiling",
    instruction: "Write a prompt without assuming gender roles.",
    bias: "Misrepresentation Bias",
    mappedTaskId: 8,
    filterType: "gender",
    target_image: "/images/targets/task_08.png",
    explanation: "Bias appears as projection: the system stamps an assumption onto the scene before judging it.",
  },
  {
    id: "bias_language",
    title: "The Aesthetic Override",
    instruction: "Write a prompt without assuming language or culture.",
    bias: "Cultural Misalignment Bias",
    mappedTaskId: 4,
    filterType: "language",
    target_image: "/images/targets/task_04.png",
    explanation: "Bias appears as misalignment: duplicated signals make the input harder to read cleanly.",
  },
  {
    id: "bias_architecture",
    title: "The Default Couple",
    instruction: "Write a prompt that preserves local architectural detail.",
    bias: "Detail Loss Bias",
    mappedTaskId: 5,
    filterType: "architecture",
    target_image: "/images/targets/task_05.png",
    explanation: "Bias appears as lost texture: repeated copying collapses detail into a flatter image.",
  },
  {
    id: "bias_authority",
    title: "The Expiry Date",
    instruction: "Write a prompt that does not over-focus on authority.",
    bias: "Focus Collapse Bias",
    mappedTaskId: 7,
    filterType: "authority",
    target_image: "/images/targets/task_07.png",
    explanation: "Bias appears as narrowed attention: most information is suppressed around one over-important center.",
  },
  {
    id: "bias_friction",
    title: "Coming Soon",
    instruction: "Write a prompt that keeps complexity, friction, and context.",
    bias: "Flattening Bias",
    mappedTaskId: 10,
    filterType: "friction",
    target_image: "/images/targets/task_10.png",
    explanation: "Bias appears as flattening: color and nuance are stripped away until the scene feels simplified.",
  },
];

export const BIAS_PREVIEW_IMAGES = [
  "/images/new_test_target/bias_1.jpeg",
  "/images/new_test_target/bias_2.AVIF",
  "/images/new_test_target/bias_1.jpeg",
  "/images/new_test_target/bias_4.png",
  "/images/new_test_target/bias_1.jpeg",
  "/images/new_test_target/bias_1.jpeg",
];

// === BIAS TARGET IMAGE RESOLVER ===
export function getBiasTargetImage(game, index) {
  const fileName = `bias_${index + 1}.png`;
  return `/images/new_test_target/${fileName}`;
}

export function getBiasTargetImageCandidates(game, index) {
  const baseName = `bias_${index + 1}`;
  return [
    `/images/new_test_target/${baseName}.png`,
    `/images/new_test_target/${baseName}.jpeg`,
    `/images/new_test_target/${baseName}.jpg`,
    `/images/new_test_target/${baseName}.AVIF`,
    `/images/new_test_target/${baseName}.avif`,
    `/images/new_test_target/${baseName}.webp`,
  ];
}

// === BIAS CAPTION RESOLVER ===
let biasCaptionCache = null;

async function getBiasCaptions() {
  if (biasCaptionCache) return biasCaptionCache;

  try {
    const res = await fetch("/backend/captions.md");
    const text = await res.text();
    biasCaptionCache = {};

    text.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^(bias_\d+)\s*=\s*(.*)$/);
      if (!match) return;
      biasCaptionCache[match[1]] = match[2].trim();
    });
  } catch {
    biasCaptionCache = {};
  }

  return biasCaptionCache;
}

export async function getBiasCaption(game, index) {
  const captions = await getBiasCaptions();
  return captions[`bias_${index + 1}`] || "Try to recreate the target image.";
}
