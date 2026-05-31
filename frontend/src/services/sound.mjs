export class CasinoSound {
  constructor() {
    this.enabled = true;
    this.music = false;
    this.context = null;
    this.ambienceTimer = null;
    this.musicNodes = [];
  }

  ensureContext() {
    if (!this.context) this.context = new AudioContext();
    return this.context;
  }

  toggleSound(enabled) {
    this.enabled = enabled;
    if (!enabled) this.stopAmbience();
  }

  toggleMusic(enabled) {
    this.music = enabled;
    if (enabled) this.startAmbience();
    else this.stopAmbience();
  }

  dice() {
    this.noiseBurst(0.12, 420, 0.18);
    setTimeout(() => this.noiseBurst(0.08, 240, 0.14), 120);
  }

  chips() {
    this.tone(660, 0.05, "triangle", 0.06);
    setTimeout(() => this.tone(880, 0.04, "triangle", 0.04), 55);
  }

  win(big = false) {
    [523, 659, 784, big ? 1046 : 880].forEach((freq, index) => {
      setTimeout(() => this.tone(freq, 0.09, "sine", 0.075), index * 85);
    });
  }

  loss() {
    this.tone(180, 0.18, "sawtooth", 0.035);
  }

  startAmbience() {
    if (!this.enabled || this.ambienceTimer) return;
    this.startMusicBed();
    this.ambienceTimer = setInterval(() => {
      this.noiseBurst(0.45, 620 + Math.random() * 420, 0.018);
      if (Math.random() > 0.58) this.tone(220 + Math.random() * 120, 0.08, "triangle", 0.012);
      if (Math.random() > 0.78) this.tone(880 + Math.random() * 240, 0.045, "sine", 0.018);
    }, 900);
  }

  stopAmbience() {
    clearInterval(this.ambienceTimer);
    this.ambienceTimer = null;
    this.stopMusicBed();
  }

  startMusicBed() {
    const ctx = this.ensureContext();
    this.stopMusicBed();
    const master = ctx.createGain();
    master.gain.value = 0.025;
    master.connect(ctx.destination);
    [55, 82.41, 110].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      gain.gain.value = index === 0 ? 0.7 : 0.22;
      osc.connect(gain).connect(master);
      osc.start();
      this.musicNodes.push(osc, gain);
    });
    this.musicNodes.push(master);
  }

  stopMusicBed() {
    this.musicNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    });
    this.musicNodes = [];
  }

  tone(freq, duration, type = "sine", volume = 0.05) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  noiseBurst(duration, cutoff, volume) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }
}
