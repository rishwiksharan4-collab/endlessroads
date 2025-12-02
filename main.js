// main.js (module) — Real 3D medium-quality scaffold
import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

// DOM
const canvas = document.getElementById('gameCanvas');
const startBtn = document.getElementById('startBtn');
const qualitySelect = document.getElementById('qualitySelect');
const hud = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const speedEl = document.getElementById('speed');
const pauseBtn = document.getElementById('pauseBtn');

// Detect mobile
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd6ff);
scene.fog = new THREE.FogExp2(0x9fd6ff, 0.0006);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(0, 5.2, 12);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0xcfe6ff, 0.9); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff7e0, 1.0); sun.position.set(-50, 80, 30);
sun.castShadow = true;
sun.shadow.camera.left = -120; sun.shadow.camera.right = 120; sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120;
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 400;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

// rolling hills (displaced plane)
const hillsGroup = new THREE.Group();
scene.add(hillsGroup);
function buildHills(detail = 36, spread = 220) {
  while (hillsGroup.children.length) hillsGroup.remove(hillsGroup.children[0]);
  const g = new THREE.PlaneGeometry(spread * 2, spread * 2, detail, detail);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    // layered trig-based height (fast, deterministic, original)
    const h = (Math.sin(x * 0.02) * 3 + Math.cos(z * 0.015) * 2 + Math.sin((x + z) * 0.01) * 1.6) * 1.6;
    pos.setY(i, h - 6);
  }
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0x9ac87a, roughness: 1.0, metalness: 0.0 });
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  m.position.y = -1.8;
  hillsGroup.add(m);
}
buildHills(36, 220);

// ROAD: extruded shape along CatmullRom curve to allow smooth banking & curvature
const roadGroup = new THREE.Group(); scene.add(roadGroup);

// create an initial path with gentle curves
function createPath(points = 200, length = 2000) {
  const pts = [];
  let z = 0;
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const x = Math.sin(t * Math.PI * 2.0 * 0.18) * 8.0 * Math.sin(t * Math.PI);
    const y = 0;
    z = -i * (length / points);
    pts.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

let pathCurve = createPath(280, 2800);

// extrude road geometry along curve for smooth look
function makeRoad(curve, laneWidth = 3.0, segSub = 280) {
  while (roadGroup.children.length) roadGroup.remove(roadGroup.children[0]);

  // road cross-section shape (wide road)
  const shape = new THREE.Shape();
  const half = laneWidth * 3 / 2;
  shape.moveTo(-half, 0);
  shape.lineTo(half, 0);
  // generate geometry by sampling curve and creating a tube-like extrude manually
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const up = new THREE.Vector3(0, 1, 0);

  const matRoad = new THREE.MeshStandardMaterial({ color: 0x2f3336, roughness: 0.85, metalness: 0.03 });
  const matStrip = new THREE.MeshStandardMaterial({ color: 0xfff3ad });

  // sample curve
  const samples = segSub;
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize(); // right vector
    // banking: small roll from curvature
    const roll = Math.sin(t * Math.PI * 2.0 * 0.06) * 0.02;

    // left & right vertices
    const left = new THREE.Vector3().copy(p).addScaledVector(normal, -half);
    const right = new THREE.Vector3().copy(p).addScaledVector(normal, half);

    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    // normals (approx)
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(t * 10, 0, t * 10, 1);
  }

  // indices
  for (let i = 0; i < samples - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    indices.push(a, c, b); indices.push(b, c, d);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, matRoad);
  mesh.receiveShadow = true;
  roadGroup.add(mesh);

  // dashed center line: simple repeated boxes positioned along curve
  const dashGeo = new THREE.BoxGeometry(0.22, 0.02, 6);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xfff0a0 });
  for (let i = 0; i < samples; i += 6) {
    const t = i / (samples - 1);
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.copy(p).addScaledVector(new THREE.Vector3(0, 0.08, 0), 1);
    dash.lookAt(p.clone().add(tangent));
    dash.position.addScaledVector(new THREE.Vector3(0, 0, 0), 0);
    roadGroup.add(dash);
  }
}

// initial build
makeRoad(pathCurve, 3.2, 360);

// CAR (primitive but more realistic proportions)
const car = new THREE.Group();
scene.add(car);
function makeCar() {
  while (car.children.length) car.remove(car.children[0]);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.4), new THREE.MeshStandardMaterial({ color: 0xff5e5e, roughness: 0.45, metalness: 0.15 }));
  body.position.set(0, 0.88, 6);
  car.add(body);
  const wind = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 0.9), new THREE.MeshStandardMaterial({ color: 0x9fe9ff, metalness: 0.12, roughness: 0.2 }));
  wind.position.set(0, 1.02, 5.4); car.add(wind);
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.45, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222 });
  for (let x of [-0.75, 0.75]) for (let z of [5.6, 6.2]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); car.add(w);
  }
}
makeCar();

// state & controls
let running = false, paused = false;
let targetLane = 0, lane = 0;
const lanePositions = [-3.2, 0, 3.2];
function moveLeft(){ targetLane = Math.max(-1, targetLane - 1); }
function moveRight(){ targetLane = Math.min(1, targetLane + 1); }
window.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft(); if (e.key === 'ArrowRight' || e.key === 'd') moveRight(); });
window.addEventListener('touchstart', e => { if (!e.touches) return; const x = e.touches[0].clientX; if (x < window.innerWidth / 2) moveLeft(); else moveRight(); });

// tilt cosmetic
if (window.DeviceOrientationEvent) window.addEventListener('deviceorientation', ev => { if (ev.gamma !== null) car.rotation.z = THREE.MathUtils.degToRad(-Math.max(-25, Math.min(25, ev.gamma)) / 35); });

// simulation variables
let speed = 0.95; let distance = 0;

// road update (recycle technique)
function updateRoad(dt) {
  const move = speed * dt * 40;
  // move road group children forward (we built road as static geometry approximating long track; to simulate forward: shift camera and recycle)
  // We'll shift the roadGroup position z for simple reuse effect
  roadGroup.position.z += move;
  if (roadGroup.position.z > 20) {
    // reset and slightly modify curve for variety: rotate or re-create small randomness
    pathCurve = createPath(280, 2800); // re-create curve with new randomness
    makeRoad(pathCurve, 3.2, 360);
    roadGroup.position.z = 0;
  }
  distance += move;
}

// quality presets (control hills detail & shadows)
let quality = 'medium';
function applyQuality(q) {
  quality = q;
  if (q === 'high') {
    sun.shadow.mapSize.set(2048, 2048);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    buildHills(48, 300);
    makeRoad(pathCurve, 3.2, 420);
  } else if (q === 'medium') {
    sun.shadow.mapSize.set(1024, 1024);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    buildHills(36, 220);
    makeRoad(pathCurve, 3.2, 360);
  } else {
    sun.shadow.mapSize.set(512, 512);
    renderer.setPixelRatio(1);
    buildHills(20, 160);
    makeRoad(pathCurve, 3.0, 220);
  }
}
applyQuality('medium');
qualitySelect.addEventListener('change', e => applyQuality(e.target.value));

// camera behavior & main loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  if (running && !paused) {
    // increase speed slightly
    speed = Math.min(2.0, speed + dt * 0.02);
    updateRoad(dt);
  }
  // lane smoothing
  lane += (targetLane - lane) * 0.14;
  car.position.x += (lanePositions[lane + 1] - car.position.x) * 0.16;

  // camera follows car smoothly with slight tremor
  camera.position.x += (car.position.x - camera.position.x) * 0.06;
  const camZ = 12 + Math.max(0, (2.0 - speed) * 2.5);
  camera.position.z += (car.position.z - camZ - camera.position.z) * 0.06;
  camera.lookAt(car.position.x, 1.6, car.position.z - 6);

  // HUD update
  scoreEl.innerText = `Score: ${Math.floor(distance * 2)}`;
  speedEl.innerText = `SPD: ${Math.round(speed * 100)}`;

  renderer.render(scene, camera);
}
animate();

// UI hooks
startBtn.addEventListener('click', () => {
  running = true;
  hud.classList.remove('hidden');
  document.getElementById('menu').classList.add('hidden');
});
pauseBtn && pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.innerText = paused ? '▶' : '⏸';
});

// resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
});

// helper to re-create path (same function as earlier usage)
function createPath(points = 280, length = 2800) {
  const pts = [];
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const x = Math.sin(t * Math.PI * 2.0 * 0.14) * 8.4 * Math.sin(t * Math.PI) * (1.0 + (Math.sin(t * 8) * 0.08));
    const z = -i * (length / points);
    pts.push(new THREE.Vector3(x, 0, z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

// expose API for debugging
window.__ER = { scene, renderer, camera, applyQuality };
