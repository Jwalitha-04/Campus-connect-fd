"use client";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx && typeof window !== "undefined") {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx!;
}

export function isAudioEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("soundEnabled") === "true";
}

export function toggleAudio(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("soundEnabled", enabled ? "true" : "false");
}

export function playSprite(type: "thock" | "rustle" | "tear" | "stamp" | "chime" | "swell" | "bubble" | "shimmer" | "bloom") {
  if (!isAudioEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Handle print-shop mechanical sounds:
    if (type === "chime" || type === "thock") {
      // Staple Snap: Quick metallic click/clack (short decay, dual high oscillators)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(2000, now);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.05);
      osc2.stop(now + 0.05);
    } else if (type === "swell" || type === "rustle") {
      // Paper-tension creak: low squeaky friction sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "bubble" || type === "tear") {
      // Paper-perforation rip: sequence of rapid crackles
      const duration = 0.25;
      const crackles = 8;
      for (let i = 0; i < crackles; i++) {
        const time = now + (i * (duration / crackles));
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        // randomize frequency slightly to sound like uneven tears
        osc.frequency.setValueAtTime(600 + Math.random() * 800, time);
        
        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.03);
      }
    } else if (type === "shimmer" || type === "stamp") {
      // Rubber-stamp thud: deep, solid thud (low pitch, rapid decay)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === "bloom") {
      // Riso Drum paper-feed roll: soft rhythmic mechanical whir
      const beats = 4;
      for (let i = 0; i < beats; i++) {
        const time = now + i * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(150, time);
        gain.gain.setValueAtTime(0.03, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.06);
      }
    }
  } catch (e) {
    console.warn("Failed to play synthesized sound:", e);
  }
}
