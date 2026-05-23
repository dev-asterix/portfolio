/**
 * Sound cue system for Asterix OS.
 *
 * Reads `useOSStore.getState().settings.soundProfile` and plays audio cues
 * using the Web Audio API for synthesized tones.
 *
 * Profiles:
 *   - silent: no-op
 *   - subtle: low-volume, short tones
 *   - arcade: louder, retro-style tones
 *
 * Requirements: 7.9, 7.10, 7.11
 */

import { useOSStore, SoundProfile } from "@/store/useOSStore";

export type SoundEvent = "boot" | "shutdown" | "notification" | "window-close";

// ── Audio context singleton (lazy-initialized) ─────────────────────────────────
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browsers require user gesture)
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ── Tone definitions per profile ────────────────────────────────────────────────

interface ToneConfig {
  frequencies: number[];   // Hz sequence
  durations: number[];     // seconds per tone
  type: OscillatorType;
  gain: number;            // 0–1
  ramp?: "linear" | "exponential";
}

const SUBTLE_CUES: Record<SoundEvent, ToneConfig> = {
  boot: {
    frequencies: [440, 554, 659],
    durations: [0.12, 0.12, 0.18],
    type: "sine",
    gain: 0.08,
  },
  shutdown: {
    frequencies: [659, 554, 440],
    durations: [0.12, 0.12, 0.2],
    type: "sine",
    gain: 0.06,
  },
  notification: {
    frequencies: [880, 1047],
    durations: [0.08, 0.12],
    type: "sine",
    gain: 0.07,
  },
  "window-close": {
    frequencies: [523],
    durations: [0.08],
    type: "sine",
    gain: 0.04,
  },
};

const ARCADE_CUES: Record<SoundEvent, ToneConfig> = {
  boot: {
    frequencies: [262, 330, 392, 523],
    durations: [0.1, 0.1, 0.1, 0.2],
    type: "square",
    gain: 0.15,
  },
  shutdown: {
    frequencies: [523, 392, 330, 262],
    durations: [0.1, 0.1, 0.1, 0.25],
    type: "square",
    gain: 0.12,
  },
  notification: {
    frequencies: [1047, 1319, 1568],
    durations: [0.06, 0.06, 0.1],
    type: "square",
    gain: 0.13,
  },
  "window-close": {
    frequencies: [440, 330],
    durations: [0.06, 0.08],
    type: "square",
    gain: 0.1,
  },
};

const PROFILE_CUES: Record<Exclude<SoundProfile, "silent">, Record<SoundEvent, ToneConfig>> = {
  subtle: SUBTLE_CUES,
  arcade: ARCADE_CUES,
};

// ── Playback ────────────────────────────────────────────────────────────────────

function playToneSequence(ctx: AudioContext, config: ToneConfig): void {
  let startTime = ctx.currentTime;

  for (let i = 0; i < config.frequencies.length; i++) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.frequencies[i], startTime);

    gainNode.gain.setValueAtTime(config.gain, startTime);
    // Fade out at the end of each tone to avoid clicks
    const endTime = startTime + config.durations[i];
    gainNode.gain.setValueAtTime(config.gain, endTime - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, endTime);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(endTime);

    startTime = endTime;
  }
}

/**
 * Play an audio cue for the given event, respecting the current sound profile.
 *
 * - If `soundProfile` is `"silent"`, returns immediately (no-op).
 * - If `soundProfile` is `"subtle"` or `"arcade"`, plays the appropriate tone.
 *
 * Safe to call in SSR (no-ops when `window` is unavailable).
 */
export function playCue(event: SoundEvent): void {
  if (typeof window === "undefined") return;

  const profile = useOSStore.getState().settings.soundProfile;

  // Silent profile: suppress all audio (Req 7.11)
  if (profile === "silent") return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const cues = PROFILE_CUES[profile];
  if (!cues) return;

  const config = cues[event];
  if (!config) return;

  playToneSequence(ctx, config);
}
