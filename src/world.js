import * as THREE from 'three';
import { CONFIG } from './config.js';
import { PALETTE } from './palette.js';

// STYLE: anime cel shaded | PALETTE: #1d1b2f #5b5f97 #ffc1cc #a0e7e5 #fef9ef #ff6b6b | OUTLINE: thin | SHADING: cel | DETAIL: smooth | MOOD: dreamy, heroic, vivid

function makeToon(color) {
  return new THREE.MeshToonMaterial({ color });
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.segments = [];
    this.packages = [];
    this.scroll = CONFIG.scrollBase;
    this.distance = 0;
    this.tailZ = -CONFIG.segmentLength;
    this.matRoof = makeToon(PALETTE.bgNear);
    this.matTrim = makeToon(PALETTE.accent);
    this.matChimney = makeToon(PALETTE.highlight);
    this.matPackage = makeToon(PALETTE.highlight);
    this.packageGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.chimneyGeo = new THREE.BoxGeometry(1.1, 1.6, 1.1);
    this.rng = mulberry32(42);
    this.spawnIndex = 0;
    this.stressMode = false;
    this._fillInitial();
  }

  reset(stress = false) {
    this.stressMode = stress;
    this.segments.forEach((s) => this._disposeSegment(s));
    this.segments = [];
    this.packages = [];
    this.scroll = stress ? CONFIG.scrollMax : CONFIG.scrollBase;
    this.distance = stress ? 400 : 0;
    this.tailZ = -CONFIG.segmentLength;
    this.rng = mulberry32(stress ? 99 : 42);
    this.spawnIndex = 0;
    for (let i = 0; i < CONFIG.segmentPool; i++) this._spawnSegment();
  }

  setScroll(s) {
    this.scroll = s;
  }

  _fillInitial() {
    for (let i = 0; i < CONFIG.segmentPool; i++) this._spawnSegment();
  }

  _spawnSegment(z = null) {
    if (z === null) {
      z = this.tailZ;
      this.tailZ -= CONFIG.segmentLength;
    }
    const seg = {
      z,
      group: new THREE.Group(),
      chimneys: [],
      gaps: [],
      lowBars: [],
    };
    this.group.add(seg.group);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.35, CONFIG.segmentLength), this.matRoof);
    roof.position.set(0, -0.05, CONFIG.segmentLength / 2);
    roof.receiveShadow = true;
    seg.group.add(roof);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.08, 0.15), this.matTrim);
    trim.position.set(0, 0.12, CONFIG.segmentLength - 0.1);
    seg.group.add(trim);

    this.spawnIndex++;
    const safe = !this.stressMode && this.spawnIndex <= 2;
    if (!safe) {
      const kind = Math.floor(this.rng() * 3);
      if (kind === 0) {
        const lane = Math.floor(this.rng() * 3);
        const chim = new THREE.Mesh(this.chimneyGeo, this.matChimney);
        chim.castShadow = true;
        chim.position.set(CONFIG.lanes[lane], 0.75, CONFIG.segmentLength * 0.55);
        seg.group.add(chim);
        seg.chimneys.push({ lane, mesh: chim, zLocal: CONFIG.segmentLength * 0.55 });
      } else if (kind === 1) {
        const gapZ = CONFIG.segmentLength * 0.5;
        seg.gaps.push({ lane: 1, zLocal: gapZ, length: 2.2 });
        const left = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, CONFIG.segmentLength), this.matRoof);
        left.position.set(-2.75, -0.05, CONFIG.segmentLength / 2);
        seg.group.add(left);
        const right = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, CONFIG.segmentLength), this.matRoof);
        right.position.set(2.75, -0.05, CONFIG.segmentLength / 2);
        seg.group.add(right);
        roof.visible = false;
      } else {
        const lane = Math.floor(this.rng() * 3);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.25), this.matChimney);
        bar.position.set(CONFIG.lanes[lane], 0.55, CONFIG.segmentLength * 0.45);
        seg.group.add(bar);
        seg.lowBars.push({ lane, zLocal: CONFIG.segmentLength * 0.45 });
      }
    }

    if (this.rng() > 0.35) {
      const lane = Math.floor(this.rng() * 3);
      const pkg = new THREE.Mesh(this.packageGeo, this.matPackage);
      pkg.position.set(CONFIG.lanes[lane], 0.45, CONFIG.segmentLength * (0.25 + this.rng() * 0.5));
      pkg.castShadow = true;
      seg.group.add(pkg);
      const entry = { lane, zLocal: pkg.position.z, mesh: pkg, taken: false, seg };
      seg.packages = seg.packages || [];
      seg.packages.push(entry);
      this.packages.push(entry);
    }

    seg.group.position.z = z;
    this.segments.push(seg);
  }

  update(dt) {
    const move = this.scroll * dt;
    this.distance += move;
    for (const seg of this.segments) {
      seg.group.position.z += move;
    }

    while (this.segments.length && this.segments[0].group.position.z > CONFIG.segmentLength * 2) {
      const old = this.segments.shift();
      this._disposeSegment(old);
      const back =
        this.segments.length > 0
          ? this.segments[this.segments.length - 1].group.position.z - CONFIG.segmentLength
          : -CONFIG.segmentLength;
      this._spawnSegment(back);
    }

    const t = performance.now() * 0.003;
    for (const p of this.packages) {
      if (p.taken) continue;
      p.mesh.rotation.y = t + p.zLocal;
      p.mesh.position.y = 0.45 + Math.sin(t * 2 + p.zLocal) * 0.08;
    }
  }

  _disposeSegment(seg) {
    if (seg.packages) {
      for (const p of seg.packages) {
        const idx = this.packages.indexOf(p);
        if (idx >= 0) this.packages.splice(idx, 1);
      }
    }
    seg.group.traverse((o) => {
      if (o.isMesh && o.geometry && o.geometry !== this.chimneyGeo && o.geometry !== this.packageGeo) {
        o.geometry.dispose();
      }
    });
    this.group.remove(seg.group);
  }

  countHazardsNearPlayer() {
    let n = 0;
    for (const seg of this.segments) {
      const baseZ = seg.group.position.z;
      for (const c of seg.chimneys) {
        const wz = baseZ + c.zLocal;
        if (wz > -28 && wz < 12) n++;
      }
      for (const g of seg.gaps) {
        const wz = baseZ + g.zLocal;
        if (wz > -28 && wz < 12) n++;
      }
      for (const b of seg.lowBars) {
        const wz = baseZ + b.zLocal;
        if (wz > -28 && wz < 12) n++;
      }
    }
    return n;
  }

  checkCollisions(player) {
    const px = player.x;
    const lane = player.laneIndex;
    const pz = CONFIG.playerZ;
    const jumping = player.jumpT > 0.08 && player.jumpT < CONFIG.jumpDuration - 0.05;
    const sliding = player.slideT > 0 && player.slideT < CONFIG.slideDuration;
    const air = player.y > 0.35;

    for (const seg of this.segments) {
      const baseZ = seg.group.position.z;
      for (const c of seg.chimneys) {
        const wz = baseZ + c.zLocal;
        if (Math.abs(wz - pz) > 0.85) continue;
        if (c.lane === lane) return 'chimney';
      }
      for (const g of seg.gaps) {
        const gz = baseZ + g.zLocal;
        if (Math.abs(gz - pz) > 1.1) continue;
        if (lane === 1 && !air && !jumping) return 'gap';
      }
      for (const b of seg.lowBars) {
        const bz = baseZ + b.zLocal;
        if (Math.abs(bz - pz) > 0.75) continue;
        if (b.lane === lane && !sliding && player.y < 0.5) return 'bar';
      }
    }
    return null;
  }

  tryCollectPackage(player) {
    const lane = player.laneIndex;
    const pz = CONFIG.playerZ;
    for (const p of this.packages) {
      if (p.taken || p.lane !== lane) continue;
      const wz = p.seg.group.position.z + p.zLocal;
      if (Math.abs(wz - pz) < 0.9 && player.y < 1.2) {
        p.taken = true;
        p.mesh.visible = false;
        return true;
      }
    }
    return false;
  }
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSky(scene) {
  const geo = new THREE.SphereGeometry(80, 32, 16);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#5b5f97');
  g.addColorStop(0.55, '#a0e7e5');
  g.addColorStop(1, '#fef9ef');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
  const sky = new THREE.Mesh(geo, mat);
  scene.add(sky);
  return sky;
}

export function buildCitySilhouette(scene) {
  const mat = makeToon(PALETTE.bgFar);
  const group = new THREE.Group();
  for (let i = 0; i < 24; i++) {
    const h = 4 + Math.random() * 12;
    const m = new THREE.Mesh(new THREE.BoxGeometry(2 + Math.random() * 2, h, 2 + Math.random()), mat);
    m.position.set(-30 + i * 2.5, h / 2 - 2, -20 - Math.random() * 30);
    group.add(m);
  }
  scene.add(group);
  return group;
}
