// main.js (module) - Ultra realism scaffold (Three.js)
// NOTE: This is a high-quality procedural road + environment system.
// It's self-contained and avoids external models. It aims for "slow-roads-like" visuals,
// but remains original and optimized for mobile where possible.

import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

// small helper: detect mobile / low-power
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// basic DOM refs
const canvas = document.getElementById('gameCanvas');
const startBtn = document.getElementById('startBtn');
const qualitySelect = document.getElementById('qualitySelect');
const hud = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const speedEl = document.getElementById('speed');
const pauseBtn = document.getElementById('pauseBtn');

// Renderer + scene + camera
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87c1ff); // sky base color
scene.fog = new THREE.FogExp2(0x87c1ff, 0.00055);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 5.6, 13);

// Lights (physically-inspired)
const hemi = new THREE.HemisphereLight(0xffffff, 0x8fb6ff, 0.9);
hemi.position.set(0, 50, 0);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff7e6, 1.0);
sun.position.set(-40, 80, 30);
sun.castShadow = true;
sun.shadow.camera.left = -120; sun.shadow.camera.right = 120; sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120;
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 300;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

// ground/hills (procedural, low-poly)
const hills = new THREE.Group();
scene.add(hills);

function makeHills(detail = 18, spread = 160) {
  // remove old
  while (hills.children.length) hills.remove(hills.children[0]);

  const g = new THREE.PlaneGeometry(spread*2, spread*2, detail, detail);
  g.rotateX(-Math.PI/2);
  // displace vertices to create rolling hills using Perlin-like noise
  for (let i=0;i<g.attributes.position.count;i++){
    const x = g.attributes.position.getX(i);
    const z = g.attributes.position.getZ(i);
    // layered simple pseudo-noise
    const h = (Math.sin(x*0.03) + Math.cos(z*0.02*0.9) + Math.sin((x+z)*0.015))*1.6;
    g.attributes.position.setY(i, h - 6); // sink below camera
  }
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({color:0x9bcc7a, roughness:1.0, metalness:0.0});
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  m.position.y = -1.5;
  hills.add(m);
}

makeHills(36, 180);

// Procedural road generator (curved segments)
const road = new THREE.Group();
scene.add(road);

function makeRoadSegments(segmentCount = 160, segLen = 10, laneW = 3.0) {
  while (road.children.length) road.remove(road.children[0]);

  // base geometry for a straight segment
  for (let i=0;i<segmentCount;i++){
    const z = -i*segLen;
    // width taper small random
    const seg = new THREE.Group();
    const roadGeom = new THREE.BoxGeometry(laneW*3.2, 0.15, segLen+0.4);
    const roadMat = new THREE.MeshStandardMaterial({color:0x2e343a, roughness:0.95});
    const mesh = new THREE.Mesh(roadGeom, roadMat);
    mesh.position.set(0, 0, z);
    mesh.receiveShadow = true;
    seg.add(mesh);

    // center dashed line
    const dashCount = 4;
    for (let d=0; d<dashCount; d++){
      const w = 0.22, h = 0.02;
      const dz = z - segLen/2 + (d+0.5)*(segLen/dashCount);
      const dashGeo = new THREE.BoxGeometry(w, h, segLen/dashCount*0.6);
      const dash = new THREE.Mesh(dashGeo, new THREE.MeshBasicMaterial({color:0xfff1b0}));
      dash.position.set(0, 0.08, dz);
      seg.add(dash);
    }

    // small side detail
    const sideGeom = new THREE.BoxGeometry(laneW*2.4, 0.12, segLen+0.4);
    const left = new THREE.Mesh(sideGeom, new THREE.MeshStandardMaterial({color:0x83b46f}));
    left.position.set(-laneW*1.6, -0.06, z); seg.add(left);
    const right = left.clone(); right.position.set(laneW*1.6, -0.06, z); seg.add(right);

    road.add(seg);
  }
}

// create road
makeRoadSegments();

// player car (primitive but polished)
const car = new THREE.Group();
function makeCar() {
  while (car.children.length) car.remove(car.children[0]);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.6,2.4), new THREE.MeshStandardMaterial({color:0xff6b6b, roughness:0.5, metalness:0.1}));
  body.position.set(0, 0.9, 6);
  car.add(body);
  const wind = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.28,0.92), new THREE.MeshStandardMaterial({color:0x7fe7ff, metalness:0.1, roughness:0.3}));
  wind.position.set(0,1.03,5.35); car.add(wind);
  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.5, 12);
  const wheelMat = new THREE.MeshStandardMaterial({color:0x333});
  for (let x of [-0.7, 0.7]) for (let z of [5.6, 6.3]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI/2; w.position.set(x,0.34,z); car.add(w);
  }
  scene.add(car);
}
makeCar();

// performance / quality settings
let quality = 'medium';
function applyQuality(q) {
  quality = q;
  if (q === 'high') {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    sun.shadow.mapSize.set(2048,2048);
    makeHills(48, 240);
    makeRoadSegments(220, 10);
  } else if (q === 'medium') {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    sun.shadow.mapSize.set(1024,1024);
    makeHills(36, 180);
    makeRoadSegments(160, 10);
  } else {
    renderer.setPixelRatio(1);
    sun.shadow.mapSize.set(512,512);
    makeHills(24, 120);
    makeRoadSegments(100, 12);
  }
  sun.shadow.needsUpdate = true;
}
applyQuality('medium');

qualitySelect.addEventListener('change', (e)=> applyQuality(e.target.value));

// camera follow & controls
let targetLane = 0, lane = 0;
const lanePositions = [-3.0, 0, 3.0];
function moveLeft(){ targetLane = Math.max(-1, targetLane-1); }
function moveRight(){ targetLane = Math.min(1, targetLane+1); }
window.addEventListener('keydown', (ev)=> { if (ev.key==='ArrowLeft'||ev.key==='a') moveLeft(); if (ev.key==='ArrowRight'||ev.key==='d') moveRight(); });
window.addEventListener('touchstart', (e)=> { if (!e.touches) return; const x = e.touches[0].clientX; if (x < window.innerWidth/2) moveLeft(); else moveRight(); });

// tilt (cosmetic)
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', (ev) => {
    if (ev.gamma !== null) {
      const tilt = Math.max(-25, Math.min(25, ev.gamma));
      car.rotation.z = THREE.MathUtils.degToRad(-tilt/35);
    }
  });
}

// game simulation state
let running = false;
let paused = false;
let speed = 0.9; // base forward camera speed (tweak)
let distance = 0;
let segmentsMoved = 0;

// recycle logic: move each segment forward and when too close re-position to far end with curvature
function updateRoad(dt) {
  const move = speed * dt * 28; // scale
  distance += move;
  // shift segments forward
  road.children.forEach(seg => {
    seg.position.z += move;
  });

  // recycle
  let farZ = Math.min(...road.children.map(s => s.position.z));
  for (let seg of road.children) {
    if (seg.position.z > 15) {
      // move to far end
      seg.position.z = farZ - 10;
      // add slight curve/random bank for variety
      const bank = (Math.random()-0.5)*0.12;
      seg.rotation.z = bank;
      farZ = Math.min(...road.children.map(s => s.position.z));
      segmentsMoved++;
    }
  }
}

// main loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());

  if (running && !paused) {
    // accelerate slightly over time
    speed = Math.min(1.8, speed + dt * 0.02);
    updateRoad(dt);
  }

  // smooth lane movement
  lane += (targetLane - lane) * 0.12;
  car.position.x += (lanePositions[lane+1] - car.position.x) * 0.16;

  // camera follow (subtle)
  camera.position.x += (car.position.x - camera.position.x) * 0.08;
  camera.lookAt(car.position.x, 1.8, car.position.z - 6);

  // HUD
  scoreEl.innerText = `Score: ${Math.floor(distance*2)}`;
  speedEl.innerText = `SPD: ${Math.round(speed*100)}`;

  renderer.render(scene, camera);
}
animate();

// start/pause handlers
startBtn.addEventListener('click', () => {
  running = true;
  hud.classList.remove('hidden');
  document.getElementById('menu').classList.add('hidden');
});
// pause
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.innerText = paused ? '▶' : '⏸';
});

// resize handler
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// expose a simple API for debugging
window.__ER = { scene, renderer, camera, applyQuality };
