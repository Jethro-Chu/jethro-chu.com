/**
 * Procedural Web Audio synthesizer for "Wok This Slope"
 * Zero external audio files, 100% reliable, runs offline.
 */

export class SkiAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Master Gain
  private masterGain: GainNode | null = null;

  // Continuous loop nodes
  private skiNoiseNode: AudioBufferSourceNode | null = null;
  private skiGainNode: GainNode | null = null;
  private skiFilterNode: BiquadFilterNode | null = null;

  private sizzleNoiseNode: AudioBufferSourceNode | null = null;
  private sizzleGainNode: GainNode | null = null;
  private sizzleFilterNode: BiquadFilterNode | null = null;

  private burnDroneNode: OscillatorNode | null = null;
  private burnGainNode: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init(): void {
    if (this.isInitialized && this.ctx && this.ctx.state !== "closed") {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupContinuousLoops();
      this.isInitialized = true;
    } catch {
      // AudioContext unavailable
    }
  }

  private setupContinuousLoops(): void {
    if (!this.ctx || !this.masterGain) return;

    // 1. Ski Snow Gliding Noise (bandpass filtered white noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Ski loop
    this.skiNoiseNode = this.ctx.createBufferSource();
    this.skiNoiseNode.buffer = noiseBuffer;
    this.skiNoiseNode.loop = true;

    this.skiFilterNode = this.ctx.createBiquadFilter();
    this.skiFilterNode.type = "bandpass";
    this.skiFilterNode.frequency.setValueAtTime(650, this.ctx.currentTime);
    this.skiFilterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.skiGainNode = this.ctx.createGain();
    this.skiGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    this.skiNoiseNode.connect(this.skiFilterNode);
    this.skiFilterNode.connect(this.skiGainNode);
    this.skiGainNode.connect(this.masterGain);
    this.skiNoiseNode.start();

    // 2. Cooking Sizzle Noise (highpass crackle)
    const sizzleBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const sOutput = sizzleBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Crackle generator: occasional micro bursts
      const raw = Math.random() * 2 - 1;
      sOutput[i] = (Math.random() > 0.4 ? raw : 0) * (Math.random() > 0.85 ? 1.4 : 0.6);
    }

    this.sizzleNoiseNode = this.ctx.createBufferSource();
    this.sizzleNoiseNode.buffer = sizzleBuffer;
    this.sizzleNoiseNode.loop = true;

    this.sizzleFilterNode = this.ctx.createBiquadFilter();
    this.sizzleFilterNode.type = "highpass";
    this.sizzleFilterNode.frequency.setValueAtTime(2600, this.ctx.currentTime);

    this.sizzleGainNode = this.ctx.createGain();
    this.sizzleGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    this.sizzleNoiseNode.connect(this.sizzleFilterNode);
    this.sizzleFilterNode.connect(this.sizzleGainNode);
    this.sizzleGainNode.connect(this.masterGain);
    this.sizzleNoiseNode.start();

    // 3. Burn Warning Drone (dissonant low alarm)
    this.burnDroneNode = this.ctx.createOscillator();
    this.burnDroneNode.type = "sawtooth";
    this.burnDroneNode.frequency.setValueAtTime(110, this.ctx.currentTime);

    const burnFilter = this.ctx.createBiquadFilter();
    burnFilter.type = "lowpass";
    burnFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.burnGainNode = this.ctx.createGain();
    this.burnGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    this.burnDroneNode.connect(burnFilter);
    burnFilter.connect(this.burnGainNode);
    this.burnGainNode.connect(this.masterGain);
    this.burnDroneNode.start();
  }

  public updateSkiSound(speedFraction: number, isGrounded: boolean): void {
    if (!this.ctx || !this.skiGainNode || !this.skiFilterNode) return;
    const now = this.ctx.currentTime;
    if (!isGrounded || speedFraction <= 0.05) {
      this.skiGainNode.gain.setTargetAtTime(0, now, 0.1);
    } else {
      const targetGain = Math.min(0.65, 0.15 + speedFraction * 0.45);
      const targetFreq = 450 + speedFraction * 950;
      this.skiGainNode.gain.setTargetAtTime(targetGain, now, 0.08);
      this.skiFilterNode.frequency.setTargetAtTime(targetFreq, now, 0.08);
    }
  }

  public updateCookingSound(activeCookingCount: number, burnRiskFraction: number): void {
    if (!this.ctx || !this.sizzleGainNode || !this.sizzleFilterNode) return;
    const now = this.ctx.currentTime;

    if (activeCookingCount <= 0) {
      this.sizzleGainNode.gain.setTargetAtTime(0, now, 0.15);
      if (this.burnGainNode) this.burnGainNode.gain.setTargetAtTime(0, now, 0.1);
    } else {
      const intensity = Math.min(1.0, activeCookingCount / 120);
      const targetGain = 0.08 + intensity * 0.38 + burnRiskFraction * 0.25;
      this.sizzleGainNode.gain.setTargetAtTime(targetGain, now, 0.05);

      // Sizzle pitch gets harsher when burning
      const freq = 2600 + burnRiskFraction * 1800;
      this.sizzleFilterNode.frequency.setTargetAtTime(freq, now, 0.05);

      // Burn alarm drone if burning
      if (this.burnGainNode) {
        const droneGain = burnRiskFraction > 0.15 ? Math.min(0.28, (burnRiskFraction - 0.15) * 0.8) : 0;
        this.burnGainNode.gain.setTargetAtTime(droneGain, now, 0.08);
      }
    }
  }

  public playToss(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playImpact(intensity: number): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Low boom thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.32);

    const hitVol = Math.min(0.85, 0.3 + intensity * 0.5);
    gain.gain.setValueAtTime(hitVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playGrainSpill(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1800 + Math.random() * 800, now);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playPlateClink(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    // Ceramic ping frequency
    osc.frequency.setValueAtTime(2800 + Math.random() * 400, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playCountdown(num: number): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    if (num > 0) {
      osc.frequency.setValueAtTime(440, now); // A4
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      osc.frequency.setValueAtTime(880, now); // A5 (WOK!)
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.48);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
  }

  public playFanfare(isSuccess: boolean, isSRank = false): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (isSuccess) {
      // Triumphant alpine brass arpeggio: C4, E4, G4, C5
      const notes = isSRank
        ? [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 659.25, 783.99, 1046.5]
        : [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.35, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.48);
      });
    } else {
      // Sad sliding fail tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.7);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.85);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public stopAll(): void {
    if (this.skiGainNode && this.ctx) {
      this.skiGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.sizzleGainNode && this.ctx) {
      this.sizzleGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.burnGainNode && this.ctx) {
      this.burnGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public dispose(): void {
    this.stopAll();
    try {
      if (this.skiNoiseNode) {
        this.skiNoiseNode.stop();
        this.skiNoiseNode.disconnect();
      }
      if (this.sizzleNoiseNode) {
        this.sizzleNoiseNode.stop();
        this.sizzleNoiseNode.disconnect();
      }
      if (this.burnDroneNode) {
        this.burnDroneNode.stop();
        this.burnDroneNode.disconnect();
      }
      if (this.ctx && this.ctx.state !== "closed") {
        this.ctx.close();
      }
    } catch {
      // Ignored during cleanup
    }
    this.ctx = null;
    this.isInitialized = false;
  }
}
