import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_RATE = 44100;

function pcmToWav(samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * blockAlign;
  const bufferSize = 44 + dataSize;

  const buf = new ArrayBuffer(bufferSize);
  const v = new DataView(buf);

  const ws = (offset, str) => {
    for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
  };

  ws(0, 'RIFF');
  v.setUint32(4, bufferSize - 8, true);
  ws(8, 'WAVE');
  ws(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numChannels, true);
  v.setUint32(24, SAMPLE_RATE, true);
  v.setUint32(28, byteRate, true);
  v.setUint16(32, blockAlign, true);
  v.setUint16(34, bitsPerSample, true);
  ws(36, 'data');
  v.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return Buffer.from(buf);
}

function sineSweep(startFreq, endFreq, duration, volume = 0.3) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / len;
    const freq = startFreq + (endFreq - startFreq) * progress;
    const envelope = Math.max(0, 1 - progress * progress);
    out[i] = Math.sin(2 * Math.PI * freq * t) * volume * envelope;
  }
  return out;
}

function sineTone(freq, duration, volume = 0.3) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.max(0, 1 - (i / len) * 1.5);
    out[i] = Math.sin(2 * Math.PI * freq * t) * volume * envelope;
  }
  return out;
}

function squareClick(duration, volume = 0.2) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const envelope = Math.max(0, 1 - i / len);
    out[i] = (Math.random() * 2 - 1) * volume * envelope;
  }
  return out;
}

function chord(freqs, duration, volume = 0.25) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.max(0, 1 - (i / len) * 1.2);
    let s = 0;
    for (const f of freqs) {
      s += Math.sin(2 * Math.PI * f * t);
    }
    out[i] = (s / freqs.length) * volume * envelope;
  }
  return out;
}

function noiseBurst(duration, volume = 0.2) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const envelope = Math.max(0, 1 - i / len);
    out[i] = (Math.random() * 2 - 1) * volume * envelope;
  }
  return out;
}

function arpeggio(notes, noteDuration, volume = 0.25) {
  const totalLen = Math.floor(SAMPLE_RATE * notes.length * noteDuration);
  const out = new Float32Array(totalLen);
  for (let n = 0; n < notes.length; n++) {
    const offset = Math.floor(SAMPLE_RATE * n * noteDuration);
    const noteLen = Math.floor(SAMPLE_RATE * noteDuration);
    for (let i = 0; i < noteLen && offset + i < totalLen; i++) {
      const t = (offset + i) / SAMPLE_RATE;
      const envelope = Math.max(0, 1 - i / noteLen);
      out[offset + i] = Math.sin(2 * Math.PI * notes[n] * t) * volume * envelope;
    }
  }
  return out;
}

const SOUNDS = {
  eat: {
    generate: () => sineSweep(440, 660, 0.1, 0.3),
  },
  specialGold: {
    generate: () => arpeggio([523, 659, 784], 0.05, 0.3),
  },
  specialSpeed: {
    generate: () => sineTone(880, 0.08, 0.25),
  },
  specialSlow: {
    generate: () => sineSweep(220, 110, 0.12, 0.25),
  },
  specialPoison: {
    generate: () => noiseBurst(0.12, 0.2),
  },
  specialGrow: {
    generate: () => sineSweep(330, 550, 0.1, 0.3),
  },
  combo2: {
    generate: () => sineTone(523, 0.06, 0.2),
  },
  combo3: {
    generate: () => sineTone(659, 0.06, 0.25),
  },
  combo5: {
    generate: () => sineTone(784, 0.08, 0.3),
  },
  combo8: {
    generate: () => arpeggio([784, 1047], 0.04, 0.3),
  },
  gameOver: {
    generate: () => sineSweep(400, 80, 0.5, 0.3),
  },
  click: {
    generate: () => squareClick(0.02, 0.15),
  },
  turn: {
    generate: () => sineTone(600, 0.03, 0.1),
  },
  achievement: {
    generate: () => chord([523, 659, 784], 0.4, 0.3),
  },
  start: {
    generate: () => arpeggio([440, 554, 659], 0.06, 0.25),
  },
};

const outPath = resolve(__dirname, '..', 'src', 'audioData.js');
let code = 'export const AUDIO_DATA = {\n';

for (const [name, sound] of Object.entries(SOUNDS)) {
  const samples = sound.generate();
  const wav = pcmToWav(samples);
  const base64 = wav.toString('base64');
  code += `  ${name}: '${base64}',\n`;
}

code += '};\n';

writeFileSync(outPath, code, 'utf-8');
console.log(`Generated audioData.js with ${Object.keys(SOUNDS).length} sounds`);
