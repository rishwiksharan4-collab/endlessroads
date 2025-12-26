// ===============================
// BASIC SETUP
// ===============================
const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9fd6ff, 40, 220);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

// ===============================
// LIGHTING (DAY / NIGHT)
// ===============================
const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 0.6);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(-50, 60, 30);
scene.add(sun);

// ===============================
// TERRAIN (GREEN LAND)
// ===============================
const terrainGeo = new THREE.PlaneGeometry(600, 600, 64, 64);
terrainGeo.rotateX(-Math.PI / 2);

for (let i = 0; i < terrainGeo.attributes.position.count; i++) {
  const y = Math.sin(i * 0.15) * 1.5;
  terrainGeo.attributes.position.setY(i, y - 2);
}
terrainGeo.computeVertexNormals();

const terrain = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshStandardMaterial({
    color: 0x7fbf7f,
    roughness: 1,
  })
);
scene.add(terrain);

// ===============================
// ROAD (GUIDE, NOT CAGE)
// ===============================
const roadGeo = new THREE.PlaneGeometry(10, 400);
roadGeo.rotateX(-Math.PI / 2);

const road = new THREE.Mesh(
  roadGeo,
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.position.y = 0.05;
scene.add(road);

// ===============================
// CAR (PLACEHOLDER – WILL UPGRADE)
// ===============================
const car = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.7, 3),
  new THREE.MeshStandardMaterial({ color: 0xff5555 })
);
car.position.set(0, 0.6, 10);
scene.add(car);

// ===============================
// CAMERA FOLLOW
// ===============================
camera.position.set(0, 5, 15);

// ===============================
// INPUT
// ===============================
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ===============================
// CAR PHYSICS (SIMPLE & SAFE)
// ===============================
let speed = 0;
let steering = 0;
let autoDrive = false;

const MAX_SPEED = 0.6;
const ACCEL = 0.02;
const TURN_SPEED = 0.04;
const FRICTION = 0.96;

// ===============================
// DAY / NIGHT CYCLE
// ===============================
let time = 0;

// ===============================
// UI
// ===============================
const speedUI = document.getElementById("speed");

// ===============================
// GAME LOOP
// ===============================
function animate() {
  requestAnimationFrame(animate);

  // ---- INPUT ----
  if (keys["f"]) {
    autoDrive = !autoDrive;
    keys["f"] = false;
  }

  if (keys["w"] || autoDrive) speed += ACCEL;
  if (keys["s"]) speed -= ACCEL;
  if (keys[" "]) speed *= 0.9;

  speed = Math.max(-0.3, Math.min(MAX_SPEED, speed));
  speed *= FRICTION;

  if (keys["a"]) steering += TURN_SPEED;
  if (keys["d"]) steering -= TURN_SPEED;
  steering *= 0.9;

  // ---- MOVE CAR ----
  car.rotation.y += steering * speed * 2;
  car.position.x += Math.sin(car.rotation.y) * speed * 20;
  car.position.z += Math.cos(car.rotation.y) * speed * 20;

  // ---- CAMERA ----
  const camTarget = new THREE.Vector3(
    car.position.x,
    car.position.y + 2,
    car.position.z - 10
  );
  camera.position.lerp(camTarget, 0.08);
  camera.lookAt(car.position.x, car.position.y + 1, car.position.z);

  // ---- DAY / NIGHT ----
  time += 0.001;
  const daylight = (Math.sin(time) + 1) / 2;

  sun.intensity = 0.2 + daylight;
  hemi.intensity = 0.3 + daylight * 0.6;

  scene.background = new THREE.Color().lerpColors(
    new THREE.Color(0x0b132b),
    new THREE.Color(0x9fd6ff),
    daylight
  );

  // ---- UI ----
  speedUI.innerText = "SPD " + Math.round(Math.abs(speed) * 200);

  renderer.render(scene, camera);
}

animate();

// ===============================
// RESIZE
// ===============================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
