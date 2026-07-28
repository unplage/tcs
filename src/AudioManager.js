import { AUDIO_DATA } from './audioData.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.muted = false;
    this.volume = 0.5;
    this.initialized = false;
    this.pending = [];
  }

  async init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      await this._decodeAll();
      this.initialized = true;
    } catch (e) {
      console.warn('Audio init failed:', e);
    }
  }

  async _ensureResumed() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async _decodeAll() {
    const entries = Object.entries(AUDIO_DATA);
    for (const [name, base64] of entries) {
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const audioBuffer = await this.ctx.decodeAudioData(bytes.buffer);
        this.buffers[name] = audioBuffer;
      } catch (e) {
        console.warn(`Failed to decode ${name}:`, e);
      }
    }
  }

  play(name) {
    if (this.muted || !this.initialized || !this.buffers[name]) return;

    this._ensureResumed();

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[name];

      const gain = this.ctx.createGain();
      gain.gain.value = this.volume;
      source.connect(gain);
      gain.connect(this.ctx.destination);

      source.start(0);
    } catch (e) {
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }
}
