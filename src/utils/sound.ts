/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A high-craft synthesis engine for realistic mechanical typewriter sounds.
// Uses purely Web Audio API, so it requires no external audio assets.
class TypewriterSound {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public toggle(state: boolean) {
    this.enabled = state;
    if (state) {
      this.init();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public playKey() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Fast click sound synthesized with bandpass noise & low-pass sine click
    const now = this.ctx.currentTime;
    
    // Low mechanical thud
    const osc = this.ctx.createOscillator();
    const gainOsc = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
    
    gainOsc.gain.setValueAtTime(0.12, now);
    gainOsc.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gainOsc);
    gainOsc.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.06);

    // High frequency metal tap
    const tapOsc = this.ctx.createOscillator();
    const gainTap = this.ctx.createGain();
    
    tapOsc.type = 'sine';
    tapOsc.frequency.setValueAtTime(1200, now);
    tapOsc.frequency.exponentialRampToValueAtTime(800, now + 0.02);
    
    gainTap.gain.setValueAtTime(0.06, now);
    gainTap.gain.exponentialRampToValueAtTime(0.005, now + 0.02);
    
    tapOsc.connect(gainTap);
    gainTap.connect(this.ctx.destination);
    
    tapOsc.start(now);
    tapOsc.stop(now + 0.03);
  }

  public playSpace() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Deeper wooden thud for spacebar
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gainOsc = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
    
    gainOsc.gain.setValueAtTime(0.18, now);
    gainOsc.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(gainOsc);
    gainOsc.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playReturn() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Combined bell ding and sliding return sweep
    const now = this.ctx.currentTime;
    
    // The Bell "Ding!"
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1800, now);
    bell.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
    bellGain.gain.setValueAtTime(0.15, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    bell.connect(bellGain);
    bellGain.connect(this.ctx.destination);
    
    bell.start(now);
    bell.stop(now + 0.2);

    // Mechanical sweep / slide
    const slide = this.ctx.createOscillator();
    const slideGain = this.ctx.createGain();
    slide.type = 'triangle';
    slide.frequency.setValueAtTime(250, now);
    slide.frequency.linearRampToValueAtTime(120, now + 0.25);
    
    slideGain.gain.setValueAtTime(0.04, now);
    slideGain.gain.linearRampToValueAtTime(0.001, now + 0.25);
    
    slide.connect(slideGain);
    slideGain.connect(this.ctx.destination);
    
    slide.start(now);
    slide.stop(now + 0.3);
  }
}

export const typewriterSound = new TypewriterSound();
