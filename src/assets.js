import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

const loader = new GLTFLoader();

export function loadMage() {
  return new Promise((resolve, reject) => {
    loader.load(
      '/assets/models/mage.glb',
      (gltf) => resolve(gltf),
      undefined,
      reject,
    );
  });
}

export const CLIPS = {
  idle: 'Idle',
  run: 'Running_A',
  walk: 'Walking_A',
  jump: 'Jump_Full_Short',
  slide: 'Dodge_Forward',
  hit: 'Hit_A',
  die: 'Death_A',
};

export function playerScale() {
  return CONFIG.playerModelHeight / CONFIG.mageNativeHeight;
}
