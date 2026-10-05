import { SoundPackId, SoundPackConfig } from '../types/game';

export const SOUND_PACKS: SoundPackConfig[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    tagline: 'Futuristic Synth & Neon Transients',
    icon: '⚡',
    badge: 'CYBER',
    description: 'High-tech FM synthesis, digital phase-shifts, and punchy neon laser hits.',
    vibeGradient: 'from-cyan-500 to-blue-600',
    previewNote: 'FM modulated laser plucks',
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    tagline: '8-Bit Chiptune & 80s Coin-Op',
    icon: '👾',
    badge: '8-BIT',
    description: 'Authentic square-wave chirps, bouncy platformer jumps, and arcade fanfares.',
    vibeGradient: 'from-amber-500 to-rose-600',
    previewNote: 'Chiptune jumping & coin blips',
  },
  {
    id: 'zen-minimalist',
    name: 'Zen Minimalist',
    tagline: 'Tibetan Singing Bowls & Bamboo',
    icon: '🎋',
    badge: 'ORGANIC',
    description: 'Serene harmonic bells, warm wooden knocks, and calming acoustic overtones.',
    vibeGradient: 'from-emerald-500 to-teal-600',
    previewNote: 'Singing bowl & water drops',
  },
  {
    id: 'quantum-scifi',
    name: 'Quantum Sci-Fi',
    tagline: 'Deep Space Holographic & Plasma',
    icon: '🌌',
    badge: 'STELLAR',
    description: 'Spatial frequency modulations, crystalline beam sweeps, and cosmic shimmer.',
    vibeGradient: 'from-purple-500 to-indigo-600',
    previewNote: 'Plasma beams & warp sweeps',
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentPack: SoundPackId = 'cyberpunk';

  constructor() {
    // Lazily load mute state and sound pack preference
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('apex_ttt_muted');
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
        const savedPack = localStorage.getItem('apex_sound_pack') as SoundPackId;
        if (savedPack && SOUND_PACKS.some((p) => p.id === savedPack)) {
          this.currentPack = savedPack;
        }
      } catch {
        // ignore localStorage errors
      }
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('apex_ttt_muted', String(muted));
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getSoundPack(): SoundPackId {
    return this.currentPack;
  }

  public setSoundPack(pack: SoundPackId) {
    if (SOUND_PACKS.some((p) => p.id === pack)) {
      this.currentPack = pack;
      try {
        localStorage.setItem('apex_sound_pack', pack);
      } catch {
        // ignore
      }
    }
  }

  public previewSoundPack(pack: SoundPackId) {
    const prevPack = this.currentPack;
    this.currentPack = pack;
    this.playMove('X');
    setTimeout(() => {
      this.currentPack = prevPack;
    }, 200);
  }

  // ==========================================
  // PLAY MOVE (PLAYER X or O)
  // ==========================================
  public playMove(player: 'X' | 'O') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (this.currentPack) {
      case 'retro-arcade': {
        // Authentic 8-bit chiptune coin jump / laser
        if (player === 'X') {
          // Bouncy 8-bit coin jump
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(330, now);
          osc.frequency.setValueAtTime(494, now + 0.04);
          osc.frequency.setValueAtTime(659, now + 0.08);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.setValueAtTime(0.12, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.17);
        } else {
          // 8-bit laser dive
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

          gain.gain.setValueAtTime(0.11, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
        }
        break;
      }

      case 'zen-minimalist': {
        // Organic singing bowl / warm bamboo percussion
        if (player === 'X') {
          // Tibetan Singing Bowl Chime (528Hz Solfeggio Love frequency + 1056Hz harmonic)
          const fundamental = this.ctx.createOscillator();
          const harmonic = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          fundamental.type = 'sine';
          fundamental.frequency.setValueAtTime(528, now);

          harmonic.type = 'sine';
          harmonic.frequency.setValueAtTime(1056, now);

          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

          fundamental.connect(gain);
          harmonic.connect(gain);
          gain.connect(this.ctx.destination);

          fundamental.start(now);
          harmonic.start(now);
          fundamental.stop(now + 0.48);
          harmonic.stop(now + 0.48);
        } else {
          // Warm bamboo / wooden marimba strike (396Hz with natural acoustic transient)
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(330, now + 0.08);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.3);
        }
        break;
      }

      case 'quantum-scifi': {
        // Holographic plasma beam & crystal shimmer
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = player === 'X' ? 620 : 780;
        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(baseFreq, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.09);

        osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.0, now + 0.1);

        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.24);
        osc2.stop(now + 0.24);
        break;
      }

      case 'cyberpunk':
      default: {
        // Crisp FM cyber pluck
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = player === 'X' ? 'sine' : 'triangle';
        const freq = player === 'X' ? 520 : 680;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
    }
  }

  // ==========================================
  // PLAY DISAPPEAR (VANISHING PIECE)
  // ==========================================
  public playDisappear() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (this.currentPack) {
      case 'retro-arcade': {
        // 8-bit crumbling pixel fall
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.setValueAtTime(260, now + 0.05);
        osc.frequency.setValueAtTime(140, now + 0.1);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case 'zen-minimalist': {
        // Calming harmonic fade out
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(396, now);
        osc.frequency.exponentialRampToValueAtTime(264, now + 0.25);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
        break;
      }

      case 'quantum-scifi': {
        // De-materialization warp sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'cyberpunk':
      default: {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.16);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }
    }
  }

  // ==========================================
  // PLAY WIN (ROUND VICTORY)
  // ==========================================
  public playWin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (this.currentPack) {
      case 'retro-arcade': {
        // Authentic 8-bit Stage Clear Fanfare!
        const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]; // C5, E5, G5, C6, G5, C6
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const startTime = now + idx * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.24);
        });
        break;
      }

      case 'zen-minimalist': {
        // Serene Major 9th singing bowl chord
        const chord = [329.63, 415.3, 493.88, 622.25, 739.99]; // E4, G#4, B4, D#5, F#5
        chord.forEach((freq, idx) => {
          if (!this.ctx) return;
          const startTime = now + idx * 0.06;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.14, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.1);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 1.15);
        });
        break;
      }

      case 'quantum-scifi': {
        // Cosmic warp ascension chord
        const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const startTime = now + idx * 0.07;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.3);

          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.65);
        });
        break;
      }

      case 'cyberpunk':
      default: {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const startTime = now + idx * 0.09;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.15, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.5);
        });
        break;
      }
    }
  }

  // ==========================================
  // PLAY DRAW (TIE GAME)
  // ==========================================
  public playDraw() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (this.currentPack) {
      case 'retro-arcade': {
        const notes = [440, 370, 330];
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const t = now + idx * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.22);
        });
        break;
      }

      case 'zen-minimalist': {
        // Peaceful soft bell tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, now); // 432Hz harmonic
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.75);
        break;
      }

      case 'quantum-scifi':
      case 'cyberpunk':
      default: {
        const notes = [440, 392, 349.23]; // A4, G4, F4 descending
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const startTime = now + idx * 0.1;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.1, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.28);
        });
        break;
      }
    }
  }

  // ==========================================
  // PLAY DEFEAT
  // ==========================================
  public playDefeat() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (this.currentPack) {
      case 'retro-arcade': {
        // Classic 8-bit Game Over slide
        const notes = [440, 415.3, 392, 369.99, 311.13];
        notes.forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.1, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.22);
        });
        break;
      }

      case 'zen-minimalist': {
        // Soft meditative minor cadence
        const notes = [396, 352, 297];
        notes.forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.14);
          gain.gain.setValueAtTime(0.12, now + i * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.14);
          osc.stop(now + i * 0.14 + 0.5);
        });
        break;
      }

      case 'quantum-scifi':
      case 'cyberpunk':
      default: {
        const notes = [440, 392, 349.23, 293.66];
        notes.forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);

          gain.gain.setValueAtTime(0.08, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.26);
        });
        break;
      }
    }
  }

  // ==========================================
  // PLAY CLICK (UI BUTTONS)
  // ==========================================
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (this.currentPack) {
      case 'retro-arcade': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(587.33, now); // D5
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'zen-minimalist': {
        // Delicate water pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.03);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'quantum-scifi': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'cyberpunk':
      default: {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
    }
  }

  // ==========================================
  // PLAY TICK (TIMER / EMOTE)
  // ==========================================
  public playTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (this.currentPack === 'zen-minimalist') {
      // Woodblock tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    } else if (this.currentPack === 'retro-arcade') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    }

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // ==========================================
  // STREAK FANFARE & STAR IMPACT
  // ==========================================
  public playStreakFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub-bass impact boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45);
    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.52);

    // Heroic ascending fanfare chords
    const fanfareNotes = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0, 1174.66];
    fanfareNotes.forEach((freq, i) => {
      if (!this.ctx) return;
      const noteTime = now + i * 0.075;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = this.currentPack === 'retro-arcade' ? 'square' : i < 4 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.38);
    });

    // Final sparkling shimmer chord sustained
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      [880.0, 1108.73, 1318.51, 1760.0].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.65);
      });
    }, 450);
  }

  public playStreakStarImpact(index: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = index === 1 ? 440 : index === 2 ? 587.33 : 880;
    osc.type = this.currentPack === 'retro-arcade' ? 'square' : index === 3 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

    gain.gain.setValueAtTime(index === 3 ? 0.2 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }
}

export const sound = new SoundEngine();
