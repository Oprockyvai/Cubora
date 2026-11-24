import { SettingsState } from '../types/game';

const CHORDS = [
  [220, 261.6, 329.6],
  [174.6, 220, 261.6],
  [261.6, 329.6, 392],
  [196, 246.9, 293.7],
];

class CuboraAudioEngine {
  private ctx: AudioContext | null = null;
  private mg: GainNode | null = null;
  private mus: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private paused = false;
  private settings: SettingsState = {
    mus: 1,
    sfx: 1,
    mv: 0.6,
    sv: 0.85,
    hap: 1,
    rm: 0,
  };

  public applySettings(s: SettingsState): void {
    this.settings = { ...s };
    if (this.mg) {
      this.mg.gain.value = s.sfx ? s.sv : 0;
    }
    if (this.mus) {
      this.mus.gain.value = s.mus ? s.mv : 0;
    }
  }

  public init(): void {
    try {
      if (this.ctx) {
        if (this.ctx.state === 'suspended' && !this.paused) {
          void this.ctx.resume();
        }
        return;
      }
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.mg = this.ctx.createGain();
      this.mg.gain.value = this.settings.sfx ? this.settings.sv : 0;
      this.mg.connect(this.ctx.destination);

      this.mus = this.ctx.createGain();
      this.mus.gain.value = this.settings.mus ? this.settings.mv : 0;
      this.mus.connect(this.ctx.destination);

      this.startMusic();
    } catch {
      // ignore WebAudio failures
    }
  }

  public get currentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  public get isReadyAndUnmuted(): boolean {
    return !!this.ctx && !!this.settings.sfx;
  }

  public tone(
    freq: number,
    t: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    dest?: GainNode | null
  ): void {
    if (!this.ctx || !this.mg) return;
    const o = this.ctx.createOscillator();
    const v = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    v.gain.setValueAtTime(0.0001, t);
    v.gain.linearRampToValueAtTime(vol, t + 0.01);
    v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v);
    v.connect(dest || this.mg);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  public boom(t?: number): void {
    if (!this.ctx || !this.mg || !this.settings.sfx) return;
    const time = t ?? this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.3);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const v = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(2200, time);
    filt.frequency.exponentialRampToValueAtTime(200, time + 0.3);
    v.gain.value = 0.45;
    src.connect(filt);
    filt.connect(v);
    v.connect(this.mg);
    src.start(time);
  }

  public sfx(
    kind: 'ui' | 'place' | 'crash' | 'over' | 'invalid' | 'reward',
    streak = 1
  ): void {
    if (!this.ctx || !this.settings.sfx) return;
    const t = this.ctx.currentTime;
    if (kind === 'ui') {
      this.tone(580, t, 0.045, 'triangle', 0.09);
      this.tone(880, t + 0.025, 0.045, 'sine', 0.05);
      return;
    }
    if (kind === 'place') {
      this.tone(330, t, 0.11, 'triangle', 0.21);
      this.tone(165, t, 0.13, 'sine', 0.19);
      return;
    }
    if (kind === 'invalid') {
      this.tone(160, t, 0.07, 'triangle', 0.14);
      this.tone(125, t + 0.06, 0.09, 'sawtooth', 0.06);
      return;
    }
    if (kind === 'reward') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        this.tone(f, t + i * 0.07, 0.28, 'triangle', 0.11);
      });
      return;
    }
    if (kind === 'crash') {
      const b = 330 * Math.pow(1.1225, Math.min(streak, 6));
      [0, 4, 7, 12, 16].forEach((s, i) => {
        this.tone(b * Math.pow(2, s / 12), t + i * 0.05, 0.35, 'triangle', 0.11);
      });
      return;
    }
    if (kind === 'over') {
      [392, 330, 262, 196].forEach((f, i) => {
        this.tone(f, t + i * 0.2, 0.45, 'sawtooth', 0.09);
      });
    }
  }

  public playBreakSequence(): void {
    if (!this.ctx || !this.settings.sfx) return;
    const t = this.ctx.currentTime;
    this.tone(70, t + 0.05, 0.15, 'sine', 0.25);
    this.tone(70, t + 0.3, 0.15, 'sine', 0.25);
    this.tone(2400, t + 0.5, 0.06, 'square', 0.05);
    this.tone(180, t + 0.8, 0.22, 'sawtooth', 0.14);
    this.tone(90, t + 0.85, 0.5, 'square', 0.1);
    this.boom(t + 0.85);
  }

  public startMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
    }
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.settings.mus || this.paused) return;
      const t = this.ctx.currentTime + 0.05;
      const ch = CHORDS[Math.floor(this.step / 8) % 4];
      const k = this.step % 8;
      const pattern = [0, 1, 2, 1, 0, 1, 2, 1];
      this.tone(ch[pattern[k]] * 2, t, 0.28, 'triangle', 0.035, this.mus);
      if (k % 4 === 0) {
        this.tone(ch[0] / 2, t, 0.6, 'sine', 0.06, this.mus);
      }
      this.step++;
    }, 300);
  }

  public pause(): void {
    this.paused = true;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    try {
      if (this.ctx && this.ctx.state === 'running') {
        void this.ctx.suspend();
      }
    } catch {
      // ignore
    }
  }

  public resume(): void {
    this.paused = false;
    try {
      if (this.ctx) {
        void this.ctx.resume();
        this.startMusic();
      }
    } catch {
      // ignore
    }
  }
}

export const audioEngine = new CuboraAudioEngine();

export function vibratePattern(pattern: number | number[], settings: SettingsState): void {
  if (!settings.hap || settings.rm) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}
