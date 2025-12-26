let scene, camera, renderer;
let car, speed = 0, steer = 0;
let paused = false;
let sensitivity = 1;
let autoDrive = false;
let time = 0;

const terrainTiles = [];
const TILE_SIZE = 200;
const TILE_COUNT = 8;

init();
animate();

/* ---------- INIT ---------- */
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 50, 900);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 2000);
  camera.position.set(0, 6, 12);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(50, 100, 50);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  createCar();
  createRoad();
  createTerrain();

  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKey);
}

/* ---------- CAR ---------- */
function createCar() {
  car = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.6, 4),
    new THREE.MeshStandardMaterial({ color: 0x2222ff })
  );
  body.position.y = 1;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.6, 2),
    new THREE.MeshStandardMaterial({ color: 0x4444ff })
  );
  cabin.position.set(0, 1.4, -0.3);
  car.add(cabin);

  scene.add(car);
}

/* ---------- ROAD ---------- */
let road;
function createRoad() {
  const geo = new THREE.PlaneGeometry(40, 2000, 1, 200);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  road = new THREE.Mesh(geo, mat);
  road.position.y = 0.05;
  scene.add(road);
}

function roadX(z) {
  return Math.sin(z * 0.002) * 25;
}

/* ---------- TERRAIN ---------- */
function createTerrain() {
  for (let i = 0; i < TILE_COUNT; i++) {
    const tile = makeTerrainTile(i * TILE_SIZE);
    terrainTiles.push(tile);
    scene.add(tile);
  }
}

function makeTerrainTile(z) {
  const geo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, 20, 20);
  geo.rotateX(-Math.PI / 2);

  geo.vertices?.forEach(v => {
    v.y = Math.random() * 4;
  });

  const mat = new THREE.MeshStandardMaterial({ color: 0x55aa55 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -z;
  return mesh;
}

/* ---------- CONTROLS ---------- */
function onKey(e) {
  if (e.key === "f") autoDrive = !autoDrive;
}

function startGame() {
  paused = false;
}

function togglePause() {
  paused = !paused;
}

function openSettings() {
  document.getElementById("settings").style.display = "block";
}

function closeSettings() {
  sensitivity = document.getElementById("sens").value;
  document.getElementById("settings").style.display = "none";
}

/* ---------- LOOP ---------- */
function animate() {
  requestAnimationFrame(animate);
  if (paused) return;

  time += 0.01;

  speed *= 0.98;
  if (keys("w")) speed = Math.min(speed + 0.02, 1.2);
  if (keys("s")) speed = Math.max(speed - 0.02, -0.5);
  if (keys(" ")) speed *= 0.9;

  if (autoDrive) {
    steer += (roadX(car.position.z) - car.position.x) * 0.002;
  } else {
    if (keys("a")) steer += 0.02 * sensitivity;
    if (keys("d")) steer -= 0.02 * sensitivity;
  }

  steer *= 0.9;
  car.position.x += steer;
  car.position.z -= speed;
  car.position.y = 0;

  camera.position.lerp(
    new THREE.Vector3(car.position.x, 6, car.position.z + 12),
    0.1
  );
  camera.lookAt(car.position);

  updateTerrain();
  document.getElementById("hud").innerText = `SPD ${Math.round(speed*100)}`;

  renderer.render(scene, camera);
}

/* ---------- TERRAIN RECYCLE ---------- */
function updateTerrain() {
  terrainTiles.forEach(tile => {
    if (tile.position.z - car.position.z > TILE_SIZE) {
      tile.position.z -= TILE_SIZE * TILE_COUNT;
    }
  });
}

/* ---------- UTIL ---------- */
const keyState = {};
window.addEventListener("keydown", e => keyState[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keyState[e.key.toLowerCase()] = false);
function keys(k) { return keyState[k]; }

function onResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
