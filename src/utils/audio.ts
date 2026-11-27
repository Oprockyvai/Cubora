import { SettingsState, SoundPackId } from '../types/game';

const CHORDS = [
  [220, 261.6, 329.6],
  [174.6, 220, 261.6],
  [261.6, 329.6, 392],
  [196, 246.9, 293.7],
];

export type SoundEffectKind =
  | 'ui'
  | 'select'
  | 'place'
  | 'invalid'
  | 'crash'
  | 'combo'
  | 'hammer'
  | 'boom'
  | 'colorBlast'
  | 'refresh'
  | 'undo'
  | 'hint'
  | 'mission'
  | 'achievement'
  | 'levelup'
  | 'reward'
  | 'over';

const PACK_OSC: Record<SoundPackId, { lead: OscillatorType; music: OscillatorType; pitchScale: number }> = {
  default: { lead: 'triangle', music: 'triangle', pitchScale: 1 },
  crystal: { lead: 'sine', music: 'sine', pitchScale: 1.18 },
  arcade: { lead: 'square', music: 'square', pitchScale: 0.96 },
  zen: { lead: 'sine', music: 'sine', pitchScale: 0.84 },
};

class CuboraAudioEngine {
  private ctx: AudioContext | null = null;
  private mg: GainNode | null = null;
  private mus: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private paused = false;
  private soundPack: SoundPackId = 'default';
  private settings: SettingsState = {
    mus: 1,
    sfx: 1,
    mv: 0.6,
    sv: 0.85,
    hap: 1,
    rm: 0,
  };

  public applySettings(s: SettingsState, pack: SoundPackId = this.soundPack): void {
    this.settings = { ...s };
    this.soundPack = pack;
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

  public sfx(kind: SoundEffectKind, streak = 1, packOverride?: SoundPackId): void {
    this.init();
    if (!this.ctx || !this.settings.sfx) return;
    const t = this.ctx.currentTime;
    const pack = PACK_OSC[packOverride || this.soundPack] || PACK_OSC.default;
    const ps = pack.pitchScale;

    switch (kind) {
      case 'ui':
        this.tone(580 * ps, t, 0.045, pack.lead, 0.085);
        this.tone(880 * ps, t + 0.025, 0.045, 'sine', 0.05);
        return;
      case 'select':
        this.tone(440 * ps, t, 0.06, pack.lead, 0.11);
        this.tone(660 * ps, t + 0.03, 0.07, 'sine', 0.08);
        return;
      case 'place':
        this.tone(330 * ps, t, 0.11, pack.lead, 0.19);
        this.tone(165 * ps, t, 0.13, 'sine', 0.17);
        return;
      case 'invalid':
        this.tone(160, t, 0.07, 'triangle', 0.14);
        this.tone(125, t + 0.06, 0.09, 'sawtooth', 0.06);
        return;
      case 'hammer':
        this.tone(260, t, 0.06, 'square', 0.12);
        this.tone(112, t + 0.015, 0.16, 'triangle', 0.25);
        this.tone(720 * ps, t + 0.045, 0.09, 'sine', 0.09);
        return;
      case 'boom':
        this.tone(142, t, 0.26, 'sawtooth', 0.18);
        this.tone(68, t + 0.025, 0.34, 'sine', 0.28);
        this.boom(t);
        return;
      case 'colorBlast':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
          this.tone(f * ps, t + i * 0.032, 0.22, 'sine', 0.1);
        });
        this.tone(220 * ps, t, 0.22, 'triangle', 0.14);
        return;
      case 'refresh':
        [392, 523.25, 659.25].forEach((f, i) => {
          this.tone(f * ps, t + i * 0.045, 0.13, pack.lead, 0.1);
        });
        return;
      case 'undo':
        this.tone(540 * ps, t, 0.08, pack.lead, 0.11);
        this.tone(392 * ps, t + 0.055, 0.11, 'sine', 0.1);
        return;
      case 'hint':
        this.tone(740 * ps, t, 0.11, 'sine', 0.1);
        this.tone(987.77 * ps, t + 0.07, 0.16, 'sine', 0.09);
        return;
      case 'combo': {
        const base = 370 * ps * Math.pow(1.11, Math.min(streak, 7));
        [0, 4, 7, 11].forEach((s, i) => {
          this.tone(base * Math.pow(2, s / 12), t + i * 0.045, 0.26, pack.lead, 0.11);
        });
        return;
      }
      case 'crash': {
        const b = 330 * ps * Math.pow(1.1225, Math.min(streak, 6));
        [0, 4, 7, 12, 16].forEach((s, i) => {
          this.tone(b * Math.pow(2, s / 12), t + i * 0.05, 0.35, pack.lead, 0.11);
        });
        return;
      }
      case 'mission':
        [523.25, 659.25, 783.99].forEach((f, i) => {
          this.tone(f * ps, t + i * 0.06, 0.22, pack.lead, 0.11);
        });
        return;
      case 'achievement':
        [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
          this.tone(f * ps, t + i * 0.065, 0.32, pack.lead, 0.11);
        });
        return;
      case 'levelup':
        [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => {
          this.tone(f * ps, t + i * 0.07, 0.36, pack.lead, 0.12);
        });
        return;
      case 'reward':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this.tone(f * ps, t + i * 0.07, 0.28, pack.lead, 0.11);
        });
        return;
      case 'over':
        [392, 330, 262, 196].forEach((f, i) => {
          this.tone(f, t + i * 0.2, 0.45, 'sawtooth', 0.09);
        });
        return;
    }
  }

  public previewSoundPack(pack: SoundPackId): void {
    this.init();
    if (!this.ctx || !this.settings.sfx) return;
    const t = this.ctx.currentTime;
    const spec = PACK_OSC[pack];
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      this.tone(f * spec.pitchScale, t + i * 0.075, 0.22, spec.lead, 0.1);
    });
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
      const pack = PACK_OSC[this.soundPack] || PACK_OSC.default;
      const ch = CHORDS[Math.floor(this.step / 8) % 4];
      const k = this.step % 8;
      const pattern = [0, 1, 2, 1, 0, 1, 2, 1];
      const volLead = pack.music === 'square' ? 0.016 : 0.035;
      this.tone(ch[pattern[k]] * 2 * pack.pitchScale, t, 0.28, pack.music, volLead, this.mus);
      if (k % 4 === 0) {
        this.tone((ch[0] / 2) * pack.pitchScale, t, 0.6, 'sine', 0.06, this.mus);
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

interface NativeBridgeWindow extends Window {
  CuboraBridge?: { postMessage: (msg: string) => void };
}

export function vibratePattern(pattern: number | number[], settings: SettingsState): void {
  if (!settings.hap || settings.rm) return;
  try {
    const bridge = (window as NativeBridgeWindow).CuboraBridge;
    if (bridge && typeof bridge.postMessage === 'function') {
      const ms = Math.round(Array.isArray(pattern) ? (pattern[0] ?? 0) : pattern);
      bridge.postMessage(`h:${ms}`);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}

