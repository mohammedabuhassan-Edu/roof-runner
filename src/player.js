import * as THREE from 'three';
import { CONFIG } from './config.js';
import { CLIPS, playerScale } from './assets.js';
import { play } from './audio.js';

export class Player {
  constructor(gltf, scene) {
    this.model = gltf.scene;
    this.scale = playerScale();
    this.model.scale.setScalar(this.scale);
    this.model.rotation.y = Math.PI;
    scene.add(this.model);

    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    for (const [key, name] of Object.entries(CLIPS)) {
      const clip = THREE.AnimationClip.findByName(gltf.animations, name);
      if (clip) {
        const action = this.mixer.clipAction(clip);
        if (['jump', 'hit', 'die'].includes(key)) {
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
        }
        this.actions[key] = action;
      }
    }
    this.current = 'idle';
    this._fade('run', 0);

    this.laneIndex = 1;
    this.targetX = CONFIG.lanes[1];
    this.x = this.targetX;
    this.y = 0;
    this.jumpT = 0;
    this.slideT = 0;
    this.alive = true;
    this.laneMoveT = 0;
  }

  _fade(name, dur = 0.2) {
    if (!this.actions[name] || this.current === name) return;
    const prev = this.actions[this.current];
    const next = this.actions[name];
    if (prev) prev.fadeOut(dur);
    next.reset().fadeIn(dur).play();
    this.current = name;
  }

  reset() {
    this.laneIndex = 1;
    this.targetX = CONFIG.lanes[1];
    this.x = this.targetX;
    this.y = 0;
    this.jumpT = 0;
    this.slideT = 0;
    this.alive = true;
    this.model.visible = true;
    this.model.rotation.x = 0;
    this._fade('run', 0.01);
  }

  laneLeft() {
    if (this.laneIndex <= 0 || this.laneMoveT > 0) return;
    this.laneIndex--;
    this.targetX = CONFIG.lanes[this.laneIndex];
    this.laneMoveT = CONFIG.laneSwitchTime;
    play('lane');
  }

  laneRight() {
    if (this.laneIndex >= 2 || this.laneMoveT > 0) return;
    this.laneIndex++;
    this.targetX = CONFIG.lanes[this.laneIndex];
    this.laneMoveT = CONFIG.laneSwitchTime;
    play('lane');
  }

  jump() {
    if (this.jumpT > 0 || this.slideT > 0) return;
    this.jumpT = CONFIG.jumpDuration;
    this._fade('jump');
    play('jump');
  }

  slide() {
    if (this.slideT > 0 || this.jumpT > 0) return;
    this.slideT = CONFIG.slideDuration;
    this._fade('slide');
    play('slide');
  }

  die() {
    this.alive = false;
    this._fade('die');
    play('lose');
  }

  update(dt) {
    this.mixer.update(dt);
    if (this.laneMoveT > 0) {
      this.laneMoveT -= dt;
      const t = 1 - Math.max(0, this.laneMoveT) / CONFIG.laneSwitchTime;
      this.x = THREE.MathUtils.lerp(this.x, this.targetX, Math.min(1, t * 2.5));
    } else {
      this.x = THREE.MathUtils.lerp(this.x, this.targetX, 0.35);
    }

    if (this.jumpT > 0) {
      this.jumpT -= dt;
      const p = 1 - this.jumpT / CONFIG.jumpDuration;
      this.y = Math.sin(p * Math.PI) * CONFIG.jumpHeight;
      if (this.jumpT <= 0) {
        this.y = 0;
        if (this.alive) this._fade('run');
      }
    }

    if (this.slideT > 0) {
      this.slideT -= dt;
      this.model.rotation.x = 0.55;
      this.y = 0.15;
      if (this.slideT <= 0) {
        this.model.rotation.x = 0;
        if (this.jumpT <= 0) this.y = 0;
        if (this.alive && this.jumpT <= 0) this._fade('run');
      }
    } else if (this.jumpT <= 0) {
      this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, 0, 0.2);
    }

    if (this.alive && this.jumpT <= 0 && this.slideT <= 0 && this.current !== 'run') {
      if (this.actions.run) this._fade('run');
    }

    this.model.position.set(this.x, this.y, CONFIG.playerZ);
  }
}
