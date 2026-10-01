const keys = new Set();

export function initInput() {
  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  let touchStart = null;
  window.addEventListener(
    'pointerdown',
    (e) => {
      touchStart = { x: e.clientX, y: e.clientY, t: performance.now() };
    },
    { passive: true },
  );
  window.addEventListener(
    'pointerup',
    (e) => {
      if (!touchStart) return;
      const dx = e.clientX - touchStart.x;
      const dy = e.clientY - touchStart.y;
      const dt = performance.now() - touchStart.t;
      touchStart = null;
      if (dt > 500) return;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
        queueAction('jump');
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        queueAction(dx > 0 ? 'right' : 'left');
      } else if (dy > 30) {
        queueAction('slide');
      } else if (dy < -30) {
        queueAction('jump');
      }
    },
    { passive: true },
  );

  window.addEventListener('gamepadconnected', () => {});
}

const queue = [];

function queueAction(a) {
  queue.push(a);
}

export function consumeActions() {
  const out = [...queue];
  queue.length = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) out.push('left');
  if (keys.has('ArrowRight') || keys.has('KeyD')) out.push('right');
  if (keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW')) out.push('jump');
  if (keys.has('ArrowDown') || keys.has('KeyS')) out.push('slide');
  if (keys.has('KeyP') || keys.has('Escape')) out.push('pause');
  return out;
}
