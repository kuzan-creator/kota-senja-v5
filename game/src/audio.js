// Kota Senja v5 — radio prosedural WebAudio: 3 stasiun, tanpa file audio.
import { RADIOS } from './config.js';

const BASE = 110; // A2
const SEMI = n => BASE * Math.pow(2, n / 12);

export class Radio {
  constructor() {
    this.ctx = null;
    this.station = 0;
    this.timer = null;
    this.step = 0;
    this.muted = false;
    this.started = false;
  }
  ensure() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      return true;
    } catch (e) { return false; }
  }
  start() {
    if (this.started || !this.ensure()) return;
    this.started = true;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    const st = RADIOS[this.station];
    const stepMs = 60000 / st.bpm / 2;
    this.timer = setInterval(() => this.tick(), stepMs);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.started = false;
  }
  setStation(i) {
    this.station = ((i % RADIOS.length) + RADIOS.length) % RADIOS.length;
    this.step = 0;
  }
  name() { return RADIOS[this.station].name + ' — ' + RADIOS[this.station].genre; }
  tick() {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') { this.step++; return; }
    const st = RADIOS[this.station];
    const s = this.step++;
    const scale = st.scale;
    try {
      // Bass tiap 4 langkah, melodi tiap 2 langkah, hat tiap langkah.
      if (s % 4 === 0) this.note(SEMI(scale[(s / 4 | 0) % scale.length] - 12), 0.22, 'triangle', 0.20);
      if (s % 2 === 0) this.note(SEMI(scale[(s / 2 | 0) % scale.length] + 12), 0.12, 'square', 0.05);
      if (s % 8 === 6) this.note(SEMI(scale[2] + 12), 0.3, 'sine', 0.08);
      this.note(SEMI(24), 0.03, 'sine', 0.03); // hat tiruan
    } catch (e) { /* audio opsional */ }
  }
  note(freq, dur, type, vol) {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
}
