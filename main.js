// BASIC SETUP
let scene, camera, renderer;
let car, roadGroup = [], terrain = [];
let started = false, paused = false, autoDrive = false;
let speed = 0;
let cameraMode = 0;

const keys = {};
const ROAD_WIDTH = 10;
const TILE = 100;

// UI
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const speedUI = document.getElementById("speed");

// SCENE
scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xaaccee, 20, 300);

// CAMERA
camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, -12);

// RENDERER
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xaaccee);
document.body.appendChild(renderer.domElement);

// LIGHTS
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(10, 20, -10);
scene.add(sun);

// CAR (CLEAR FRONT/BACK)
function createCar() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.5, 3),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  body.position.y = 0.4;
  group.add(body);

  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.4, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xdddddd })
  );
  hood.position.set(0, 0.55, 0.9);
  group.add(hood);

  const front = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  front.position.set(0, 0.3, 1.6);
  group.add(front);

  group.position.y = 0.3;
  return group;
}

car = createCar();
scene.add(car);

// ROAD (CURVED)
function roadX(z) {
  return Math.sin(z * 0.01) * 6;
}

function createRoad(z) {
  const geo = new THREE.PlaneGeometry(ROAD_WIDTH, TILE);
  const mat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = z;
  scene.add(mesh);
  roadGroup.push(mesh);
}

for (let i = 0; i < 10; i++) createRoad(i * TILE);

// TERRAIN
function createTerrain(z) {
  const geo = new THREE.PlaneGeometry(200, TILE);
  const mat = new THREE.MeshStandardMaterial({ color: 0x66bb66 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = z;
  scene.add(mesh);
  terrain.push(mesh);
}

for (let i = 0; i < 10; i++) createTerrain(i * TILE);

// INPUT
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "f") autoDrive = !autoDrive;
  if (e.key === "c") cameraMode = (cameraMode + 1) % 3;
});

document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// UI BUTTONS
startBtn.onclick = () => {
  started = true;
  paused = false;
  pauseBtn.disabled = false;
};

pauseBtn.onclick = () => paused = !paused;

// LOOP
function animate() {
  requestAnimationFrame(animate);
  if (!started || paused) return renderer.render(scene, camera);

  // SPEED
  if (keys["w"]) speed += 0.02;
  if (keys["s"]) speed -= 0.02;
  if (!keys["w"] && !keys["s"]) speed *= 0.98;
  speed = Math.max(0, Math.min(speed, 2));

  // STEER
  if (keys["a"]) car.position.x -= 0.1;
  if (keys["d"]) car.position.x += 0.1;

  // AUTO DRIVE
  if (autoDrive) {
    const tx = roadX(car.position.z);
    car.position.x += (tx - car.position.x) * 0.05;
    speed = Math.max(speed, 0.6);
  }

  // MOVE
  car.position.z += speed;
  car.position.y = 0.3;

  // ROAD FOLLOW
  roadGroup.forEach(r => {
    r.position.x = roadX(r.position.z);
    if (r.position.z + TILE < car.position.z)
      r.position.z += TILE * roadGroup.length;
  });

  // TERRAIN LOOP
  terrain.forEach(t => {
    if (t.position.z + TILE < car.position.z)
      t.position.z += TILE * terrain.length;
  });

  // CAMERA MODES
  if (cameraMode === 0) {
    camera.position.lerp(new THREE.Vector3(car.position.x, 6, car.position.z - 12), 0.1);
  } else if (cameraMode === 1) {
    camera.position.lerp(new THREE.Vector3(car.position.x, 1.2, car.position.z + 1), 0.1);
  } else {
    camera.position.lerp(new THREE.Vector3(car.position.x + 10, 12, car.position.z - 10), 0.1);
  }

  camera.lookAt(car.position);
  speedUI.innerText = "SPD " + Math.round(speed * 50);
  renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
