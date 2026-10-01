import { TEXT } from './config.js';
import { hex, PALETTE } from './palette.js';
import { isMuted, play, setMuted } from './audio.js';

let root;
let onStart;
let onRetry;
let onPauseToggle;

export function initUI(callbacks) {
  onStart = callbacks.onStart;
  onRetry = callbacks.onRetry;
  onPauseToggle = callbacks.onPauseToggle;
  root = document.getElementById('ui-root');
  root.innerHTML = `
    <div id="screen-start" class="screen">
      <h1>${TEXT.title}</h1>
      <p class="sub">${TEXT.subtitle}</p>
      <p class="hint">${TEXT.startHint}</p>
      <p class="controls">${TEXT.controlsDesktop}</p>
      <p class="controls mobile-only">${TEXT.controlsTouch}</p>
      <p class="credit">${TEXT.builtWith}</p>
    </div>
    <div id="screen-hud" class="screen hidden">
      <div class="hud-top">
        <span id="hud-score">${TEXT.score}: 0</span>
        <span id="hud-combo">×1</span>
        <button type="button" id="btn-pause" aria-label="Pause">⏸</button>
      </div>
      <button type="button" id="btn-mute" aria-label="${TEXT.mute}">🔊</button>
    </div>
    <div id="screen-pause" class="screen overlay hidden">
      <h2>${TEXT.pause}</h2>
      <button type="button" id="btn-resume">${TEXT.resume}</button>
    </div>
    <div id="screen-end" class="screen overlay hidden">
      <h2>${TEXT.gameOver}</h2>
      <p id="final-score"></p>
      <button type="button" id="btn-retry">${TEXT.retry}</button>
    </div>
  `;

  const start = () => {
    play('ui');
    onStart?.();
  };
  document.getElementById('screen-start').addEventListener('click', start);
  document.getElementById('screen-start').addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') start();
  });

  document.getElementById('btn-retry').addEventListener('click', () => {
    play('ui');
    onRetry?.();
  });
  document.getElementById('btn-pause').addEventListener('click', () => {
    play('ui');
    onPauseToggle?.();
  });
  document.getElementById('btn-resume').addEventListener('click', () => {
    play('ui');
    onPauseToggle?.();
  });
  document.getElementById('btn-mute').addEventListener('click', () => {
    setMuted(!isMuted());
    document.getElementById('btn-mute').textContent = isMuted() ? '🔇' : '🔊';
    play('ui');
  });

  root.style.setProperty('--c-bg', hex(PALETTE.bgFar));
  root.style.setProperty('--c-accent', hex(PALETTE.highlight));
  root.style.setProperty('--c-text', hex(PALETTE.light));
}

export function showScreen(name) {
  ['start', 'hud', 'pause', 'end'].forEach((s) => {
    const el = document.getElementById(`screen-${s}`);
    if (!el) return;
    if (s === name || (name === 'playing' && s === 'hud')) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
  if (name === 'playing') {
    document.getElementById('screen-pause').classList.add('hidden');
    document.getElementById('screen-end').classList.add('hidden');
  }
  if (name === 'paused') {
    document.getElementById('screen-hud').classList.remove('hidden');
    document.getElementById('screen-pause').classList.remove('hidden');
  }
  if (name === 'ended') {
    document.getElementById('screen-hud').classList.remove('hidden');
    document.getElementById('screen-end').classList.remove('hidden');
  }
}

export function updateHUD({ score, combo, distance }) {
  const s = document.getElementById('hud-score');
  const c = document.getElementById('hud-combo');
  if (s) s.textContent = `${TEXT.score}: ${Math.floor(score)} · ${Math.floor(distance)}${TEXT.distance}`;
  if (c) c.textContent = `×${combo}`;
}

export function showFinalScore(score, distance) {
  const el = document.getElementById('final-score');
  if (el) el.textContent = `${Math.floor(score)} pts · ${Math.floor(distance)} m crossed`;
}
