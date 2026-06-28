(function () {
  "use strict";

  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    window.CyberSounds = {
      click() {},
      tick() {},
      pop() {},
      win() {},
      correct() {},
      wrong() {}
    };
    return;
  }

  let context;
  let master;
  let lastTick = 0;

  function getContext() {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.22;
      master.connect(context.destination);
    }

    if (context.state === "suspended") {
      context.resume();
    }

    return context;
  }

  function now() {
    return getContext().currentTime;
  }

  function tone(options) {
    const ctx = getContext();
    const start = options.start ?? ctx.currentTime;
    const duration = options.duration ?? 0.12;
    const type = options.type || "square";
    const gainValue = options.gain ?? 0.16;
    const frequency = options.frequency ?? 440;
    const endFrequency = options.endFrequency ?? frequency;
    const attack = Math.min(options.attack ?? 0.006, duration * 0.4);
    const release = Math.min(options.release ?? 0.05, duration * 0.75);

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + release + 0.02);
  }

  function noiseBurst(options) {
    const ctx = getContext();
    const start = options.start ?? ctx.currentTime;
    const duration = options.duration ?? 0.08;
    const gainValue = options.gain ?? 0.1;
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < sampleCount; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = options.filterType || "bandpass";
    filter.frequency.value = options.frequency || 1600;
    filter.Q.value = options.q || 5;

    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  function arpeggio(notes, options) {
    const base = now();
    const step = options.step ?? 0.07;
    notes.forEach((frequency, index) => {
      tone({
        frequency,
        endFrequency: frequency * (options.lift ?? 1.01),
        start: base + index * step,
        duration: options.duration ?? 0.08,
        gain: options.gain ?? 0.12,
        type: options.type || "triangle",
        release: options.release ?? 0.06
      });
    });
  }

  function click() {
    const t = now();
    tone({ frequency: 180, endFrequency: 95, start: t, duration: 0.045, gain: 0.18, type: "square", release: 0.025 });
    noiseBurst({ start: t, duration: 0.035, gain: 0.05, frequency: 700, q: 8 });
  }

  function tick() {
    const t = now();

    if (t - lastTick < 0.055) return;
    lastTick = t;

    tone({ frequency: 920, endFrequency: 620, start: t, duration: 0.035, gain: 0.045, type: "square", release: 0.018 });
  }

  function pop() {
    const t = now();
    tone({ frequency: 340, endFrequency: 880, start: t, duration: 0.09, gain: 0.15, type: "triangle", release: 0.04 });
    tone({ frequency: 680, endFrequency: 1120, start: t + 0.025, duration: 0.08, gain: 0.09, type: "sine", release: 0.04 });
  }

  function correct() {
    arpeggio([392, 523.25, 659.25, 783.99], {
      step: 0.065,
      duration: 0.09,
      gain: 0.13,
      type: "triangle",
      lift: 1.015
    });
  }

  function wrong() {
    const t = now();
    tone({ frequency: 180, endFrequency: 125, start: t, duration: 0.18, gain: 0.16, type: "sawtooth", release: 0.09 });
    tone({ frequency: 123, endFrequency: 82, start: t + 0.075, duration: 0.2, gain: 0.12, type: "square", release: 0.1 });
  }

  function win() {
    const t = now();
    arpeggio([523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98], {
      step: 0.055,
      duration: 0.11,
      gain: 0.12,
      type: "triangle",
      lift: 1.02
    });

    window.setTimeout(() => {
      const sparkleStart = now();
      [1760, 2093, 2637].forEach((frequency, index) => {
        tone({
          frequency,
          endFrequency: frequency * 1.08,
          start: sparkleStart + index * 0.045,
          duration: 0.09,
          gain: 0.08,
          type: "sine",
          release: 0.08
        });
      });
    }, 330);

    noiseBurst({ start: t + 0.02, duration: 0.12, gain: 0.035, frequency: 3600, q: 2 });
  }

  window.CyberSounds = {
    click,
    tick,
    pop,
    win,
    correct,
    wrong
  };
}());
