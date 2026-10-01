import { zzfx, ZZFX } from 'zzfx';

export const SFX = {
  jump: [, , 520, 0.01, 0.04, 0.12, 1, 1.4, , , , , , , , , 0.04],
  slide: [, , 180, 0.01, 0.06, 0.08, 3, 0.8, , , , , , , , , 0.05],
  lane: [, , 900, 0.01, 0.02, 0.05, 1, 1.2, , , 400, 0.04],
  collect: [, , 1400, 0.01, 0.03, 0.1, 1, 2, , , 800, 0.05],
  hit: [, , 220, 0.01, 0.02, 0.25, 4, 1.8, , , , , , , , 0.2],
  ui: [, , 600, 0.01, 0.01, 0.04, 1, 1.1],
  lose: [, , 280, 0.02, 0.35, 0.5, 2, 1.2, -6, , , , , , , 0.25],
};

let muted = false;

export function unlockAudio() {
  if (ZZFX.audioContext?.state === 'suspended') ZZFX.audioContext.resume();
}

document.addEventListener('visibilitychange', () => {
  if (!ZZFX.audioContext) return;
  if (document.hidden) ZZFX.audioContext.suspend();
  else if (!muted) ZZFX.audioContext.resume();
});

export function setMuted(m) {
  muted = m;
  ZZFX.volume = m ? 0 : 0.35;
}

export function play(name) {
  if (muted || !SFX[name]) return;
  zzfx(...SFX[name]);
}

export function isMuted() {
  return muted;
}
