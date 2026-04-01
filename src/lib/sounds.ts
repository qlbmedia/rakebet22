// Procedural sound effects using Web Audio API — no external files needed
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function playGemReveal() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15);
  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.25);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.25);
}

export function playGemRevealChain(count: number) {
  const c = getCtx();
  const baseFreq = 500 + count * 80;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(baseFreq, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, c.currentTime + 0.12);
  gain.gain.setValueAtTime(0.3, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.2);

  // sparkle overtone
  const osc2 = c.createOscillator();
  const gain2 = c.createGain();
  osc2.connect(gain2);
  gain2.connect(c.destination);
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(baseFreq * 1.5, c.currentTime + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(baseFreq * 3, c.currentTime + 0.15);
  gain2.gain.setValueAtTime(0.15, c.currentTime + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2);
  osc2.start(c.currentTime + 0.05);
  osc2.stop(c.currentTime + 0.2);
}

export function playMineExplosion() {
  const c = getCtx();
  const bufferSize = c.sampleRate * 0.5;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = c.createGain();
  noise.connect(noiseGain);
  noiseGain.connect(c.destination);
  noiseGain.gain.setValueAtTime(0.5, c.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
  noise.start(c.currentTime);
  noise.stop(c.currentTime + 0.5);

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.3);
  gain.gain.setValueAtTime(0.6, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.4);
}

export function playCashout() {
  const c = getCtx();
  const notes = [800, 1000, 1200, 1600];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.08);
    gain.gain.setValueAtTime(0.2, c.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + i * 0.08 + 0.15);
    osc.start(c.currentTime + i * 0.08);
    osc.stop(c.currentTime + i * 0.08 + 0.15);
  });
}

export function playLimboTick() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(1000, c.currentTime);
  gain.gain.setValueAtTime(0.08, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.03);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.03);
}

export function playLimboWin() {
  const c = getCtx();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.25, c.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + i * 0.1 + 0.2);
    osc.start(c.currentTime + i * 0.1);
    osc.stop(c.currentTime + i * 0.1 + 0.2);
  });
}

export function playLimboLose() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(400, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.3);
  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.35);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.35);
}

export function playBetPlace() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, c.currentTime);
  osc.frequency.setValueAtTime(550, c.currentTime + 0.05);
  gain.gain.setValueAtTime(0.15, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.1);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.1);
}

/** Elegant marble-on-peg dink sound — short, bright, glassy */
export function playPlinkoDink(pitchVariation = 0) {
  const c = getCtx();
  const baseFreq = 2800 + pitchVariation * 400 + (Math.random() - 0.5) * 300;

  // Primary tone — bright sine hit
  const osc1 = c.createOscillator();
  const g1 = c.createGain();
  osc1.connect(g1);
  g1.connect(c.destination);
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(baseFreq, c.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, c.currentTime + 0.08);
  g1.gain.setValueAtTime(0.12, c.currentTime);
  g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
  osc1.start(c.currentTime);
  osc1.stop(c.currentTime + 0.06);

  // Harmonic overtone — glassy shimmer
  const osc2 = c.createOscillator();
  const g2 = c.createGain();
  osc2.connect(g2);
  g2.connect(c.destination);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(baseFreq * 2.5, c.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, c.currentTime + 0.04);
  g2.gain.setValueAtTime(0.06, c.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
  osc2.start(c.currentTime);
  osc2.stop(c.currentTime + 0.04);

  // Sub-resonance — gives weight/marble feel
  const osc3 = c.createOscillator();
  const g3 = c.createGain();
  osc3.connect(g3);
  g3.connect(c.destination);
  osc3.type = "triangle";
  osc3.frequency.setValueAtTime(baseFreq * 0.5, c.currentTime);
  g3.gain.setValueAtTime(0.04, c.currentTime);
  g3.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
  osc3.start(c.currentTime);
  osc3.stop(c.currentTime + 0.05);
}

/** Keno number select - soft click */
export function playKenoSelect() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.04);
  gain.gain.setValueAtTime(0.15, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.06);
}

/** Keno number deselect */
export function playKenoDeselect() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(500, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(350, c.currentTime + 0.04);
  gain.gain.setValueAtTime(0.12, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.05);
}

/** Keno hit reveal - bright happy ding */
export function playKenoHit() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(1200, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.08);
  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.15);

  // Sparkle
  const osc2 = c.createOscillator();
  const g2 = c.createGain();
  osc2.connect(g2);
  g2.connect(c.destination);
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(2400, c.currentTime + 0.03);
  g2.gain.setValueAtTime(0.1, c.currentTime + 0.03);
  g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  osc2.start(c.currentTime + 0.03);
  osc2.stop(c.currentTime + 0.1);
}

/** Keno miss reveal - dull thud */
export function playKenoMiss() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(200, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, c.currentTime + 0.08);
  gain.gain.setValueAtTime(0.1, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.1);
}

/** Case reel tick — short crisp click as items pass the marker */
export function playCaseTickSound() {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  const freq = 1800 + (Math.random() - 0.5) * 200;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, c.currentTime + 0.025);
  gain.gain.setValueAtTime(0.1, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.03);
}


/** Case win reveal — ascending fanfare, intensity based on rarity */
export function playCaseWinReveal(rarity: string) {
  const c = getCtx();
  const isRare = rarity === "legendary" || rarity === "epic";
  const notes = isRare
    ? [600, 800, 1000, 1200, 1600]
    : [500, 700, 900];

  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.07);
    gain.gain.setValueAtTime(isRare ? 0.25 : 0.18, c.currentTime + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + i * 0.07 + 0.2);
    osc.start(c.currentTime + i * 0.07);
    osc.stop(c.currentTime + i * 0.07 + 0.2);
  });

  if (isRare) {
    // Shimmer overtone for epic/legendary
    const osc2 = c.createOscillator();
    const g2 = c.createGain();
    osc2.connect(g2);
    g2.connect(c.destination);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(2400, c.currentTime + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(3200, c.currentTime + 0.5);
    g2.gain.setValueAtTime(0.12, c.currentTime + 0.2);
    g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
    osc2.start(c.currentTime + 0.2);
    osc2.stop(c.currentTime + 0.6);
  }
}
