// ================== BASIC SETUP ==================
const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 5000);
camera.position.set(0, 6, 12);

// ================== LIGHTING ==================
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(100, 200, 100);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// ================== TERRAIN ==================
const TERRAIN_SIZE = 2000;
const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 120, 120);
terrainGeo.rotateX(-Math.PI / 2);

const terrainPos = terrainGeo.attributes.position;
for (let i = 0; i < terrainPos.count; i++) {
  const x = terrainPos.getX(i);
  const z = terrainPos.getZ(i);
  const height =
    Math.sin(x * 0.003) * 6 +
    Math.cos(z * 0.003) * 6 +
    Math.sin((x + z) * 0.002) * 12;
  terrainPos.setY(i, height);
}
terrainGeo.computeVertexNormals();

const terrain = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshStandardMaterial({ color: 0x5fbf5f })
);
scene.add(terrain);

// ================== ROAD ==================
const roadGeo = new THREE.PlaneGeometry(40, TERRAIN_SIZE);
roadGeo.rotateX(-Math.PI / 2);
const road = new THREE.Mesh(
  roadGeo,
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.position.y = 0.05;
scene.add(road);

// ================== CAR ==================
const car = new THREE.Group();

// Body
const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 0.5, 3.6),
  new THREE.MeshStandardMaterial({ color: 0x2222ff })
);
body.position.y = 0.6;

// Cabin
const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 0.5, 1.6),
  new THREE.MeshStandardMaterial({ color: 0x4444ff })
);
cabin.position.set(0, 1, -0.2);

// Wheels (visual only)
function wheel(x, z) {
  const w = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  w.rotation.z = Math.PI / 2;
  w.position.set(x, 0.35, z);
  return w;
}

car.add(
  body,
  cabin,
  wheel(-0.9, 1.2),
  wheel(0.9, 1.2),
  wheel(-0.9, -1.2),
  wheel(0.9, -1.2)
);

scene.add(car);

// ================== GAME STATE ==================
let speed = 0;
let steer = 0;
let autoDrive = false;
let started = false;

const MAX_SPEED = 0.6;
const ACCEL = 0.01;
const BRAKE = 0.04;

const keys = {};

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "f") autoDrive = !autoDrive;
  if (e.key === "r") resetCar();
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ================== UI ==================
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const hud = document.getElementById("hud");

startBtn.onclick = () => {
  started = true;
  menu.style.display = "none";
};

// ================== HELPERS ==================
function resetCar() {
  car.position.set(0, 1, 0);
  car.rotation.set(0, 0, 0);
  speed = 0;
}

function terrainHeight(x, z) {
  return (
    Math.sin(x * 0.003) * 6 +
    Math.cos(z * 0.003) * 6 +
    Math.sin((x + z) * 0.002) * 12
  );
}

// ================== MAIN LOOP ==================
let time = 0;

function animate() {
  requestAnimationFrame(animate);

  if (started) {
    // INPUT
    if (keys["w"] || autoDrive) speed += ACCEL;
    if (keys["s"]) speed -= ACCEL;
    if (keys[" "]) speed *= 1 - BRAKE;

    speed *= 0.98;
    speed = THREE.MathUtils.clamp(speed, -0.3, MAX_SPEED);

    if (keys["a"]) steer += 0.02;
    if (keys["d"]) steer -= 0.02;
    steer *= 0.9;

    // AUTODRIVE ROAD SEEK
    if (autoDrive) {
      const roadOffset = car.position.x;
      steer += -roadOffset * 0.002;
    }

    // MOVE
    car.rotation.y += steer * speed;
    car.position.x += Math.sin(car.rotation.y) * speed * 20;
    car.position.z += Math.cos(car.rotation.y) * speed * 20;

    // TERRAIN FOLLOW
    const groundY = terrainHeight(car.position.x, car.position.z);
    car.position.y = groundY + 0.8;

    // ENDLESS LOOP
    if (Math.abs(car.position.z) > TERRAIN_SIZE / 2) {
      car.position.z = 0;
    }

    hud.textContent = "SPD " + Math.round(Math.abs(speed) * 100);
  }

  // CAMERA
  camera.position.lerp(
    new THREE.Vector3(
      car.position.x,
      car.position.y + 6,
      car.position.z - 10
    ),
    0.08
  );
  camera.lookAt(car.position);

  // DAY / NIGHT
  time += 0.0004;
  sun.intensity = 0.6 + Math.sin(time) * 0.4;
  scene.background.setHSL(0.6, 0.5, 0.55 + Math.sin(time) * 0.15);

  renderer.render(scene, camera);
}

animate();

// ================== RESIZE ==================
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
