import * as THREE from 'three';
import { CONFIG, TEXT } from './config.js';
import { PALETTE } from './palette.js';
import { loadMage } from './assets.js';
import { initInput, consumeActions } from './input.js';
import { unlockAudio, play } from './audio.js';
import { initUI, showScreen, updateHUD, showFinalScore } from './ui.js';
import { Player } from './player.js';
import { World, buildSky, buildCitySilhouette } from './world.js';

const STEP = 1 / 60;
const params = new URLSearchParams(location.search);
const STRESS = params.get('stress') === '1';

let state = 'loading';
let paused = false;
let score = 0;
let combo = 1;
let comboTimer = 0;
let scrollTimer = 0;
let renderer;
let scene;
let camera;
let player;
let world;
let cityGroup;

async function boot() {
  initInput();
  const canvas = document.getElementById('game');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.bgFar);
  scene.fog = new THREE.Fog(PALETTE.bgFar, 22, 62);

  buildSky(scene);
  cityGroup = buildCitySilhouette(scene);

  const hemi = new THREE.HemisphereLight(PALETTE.light, PALETTE.bgFar, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(PALETTE.light, 1.1);
  sun.position.set(6, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -4;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 120),
    new THREE.MeshToonMaterial({ color: PALETTE.bgFar }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  scene.add(ground);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 3.2, 7.5);
  resize();
  window.addEventListener('resize', resize);

  window.__game = { state: 'loading', fps: 0, drawCalls: 0, canLose: true, hazards: 0 };

  const gltf = await loadMage();
  player = new Player(gltf, scene);
  world = new World(scene);
  world.reset(STRESS);

  initUI({
    onStart: startRun,
    onRetry: startRun,
    onPauseToggle: togglePause,
  });

  state = 'menu';
  showScreen('start');
  updateGameApi();

  let acc = 0;
  let last = performance.now();
  function frame(now) {
    acc += Math.min((now - last) / 1000, 0.1);
    last = now;
    while (acc >= STEP) {
      if (!paused) step(STEP);
      acc -= STEP;
    }
    renderFrame(acc / STEP);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') {
      paused = true;
      showScreen('paused');
    }
  });
}

function startRun() {
  unlockAudio();
  score = 0;
  combo = 1;
  comboTimer = 0;
  scrollTimer = STRESS ? 999 : 0;
  paused = false;
  player.reset();
  world.reset(STRESS);
  if (STRESS) world.setScroll(CONFIG.scrollMax);
  state = 'playing';
  showScreen('playing');
}

function togglePause() {
  if (state !== 'playing' && state !== 'paused') return;
  paused = !paused;
  if (paused) {
    state = 'paused';
    showScreen('paused');
  } else {
    state = 'playing';
    showScreen('playing');
  }
}

function step(dt) {
  if (state !== 'playing') return;

  const actions = consumeActions();
  for (const a of actions) {
    if (a === 'pause') togglePause();
    else if (a === 'left') player.laneLeft();
    else if (a === 'right') player.laneRight();
    else if (a === 'jump') player.jump();
    else if (a === 'slide') player.slide();
  }

  if (!STRESS) {
    scrollTimer += dt;
    if (scrollTimer >= CONFIG.scrollRampInterval) {
      scrollTimer = 0;
      world.setScroll(Math.min(CONFIG.scrollMax, world.scroll + CONFIG.scrollRampStep));
    }
  }

  player.update(dt);
  world.update(dt);

  if (world.tryCollectPackage(player)) {
    play('collect');
    combo = Math.min(CONFIG.comboMax, combo + 1);
    comboTimer = CONFIG.comboDecay;
    score += CONFIG.packageScore * combo;
  }

  comboTimer -= dt;
  if (comboTimer <= 0 && combo > 1) combo = Math.max(1, combo - 1);

  score += (CONFIG.distanceScoreRate * world.scroll * dt) / 10;

  const hit = world.checkCollisions(player);
  if (hit && player.alive) {
    player.die();
    state = 'ended';
    showFinalScore(score, world.distance);
    showScreen('ended');
  }

  updateHUD({ score, combo, distance: world.distance });
  updateGameApi();
}

function renderFrame(alpha) {
  if (cityGroup) cityGroup.position.z = ((world?.distance || 0) % 40) * 0.05;

  const target = new THREE.Vector3(player.x * 0.6, 1.4 + player.y * 0.3, CONFIG.playerZ);
  camera.position.lerp(new THREE.Vector3(player.x * 0.45, 3.2, 7.2), 0.08);
  camera.lookAt(target);

  renderer.render(scene, camera);
  updateGameApi();
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

let frameTimes = [];
function updateGameApi() {
  const now = performance.now();
  if (window.__lastFrame) frameTimes.push(now - window.__lastFrame);
  if (frameTimes.length > 30) frameTimes.shift();
  window.__lastFrame = now;
  const avg = frameTimes.length ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length : 16.7;
  const info = renderer?.info?.render;
  window.__game = {
    state: state === 'paused' ? 'playing' : state,
    fps: Math.round(1000 / avg),
    drawCalls: info?.calls ?? 0,
    canLose: true,
    hazards: world?.countHazardsNearPlayer?.() ?? 0,
  };
}

boot().catch((e) => {
  console.error(e);
  state = 'ended';
});
