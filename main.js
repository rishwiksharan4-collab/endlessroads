const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 3000);
camera.position.set(0, 4, 8);

// LIGHT
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 100, 50);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// TERRAIN
const terrainGeo = new THREE.PlaneGeometry(3000, 3000, 120, 120);
terrainGeo.rotateX(-Math.PI / 2);
const pos = terrainGeo.attributes.position;

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);
  const h =
    Math.sin(x * 0.004) * 6 +
    Math.cos(z * 0.004) * 6 +
    Math.sin((x + z) * 0.002) * 14;
  pos.setY(i, h);
}
terrainGeo.computeVertexNormals();

const terrain = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshStandardMaterial({ color: 0x5fbf5f })
);
scene.add(terrain);

// ROAD
const roadGeo = new THREE.PlaneGeometry(40, 3000);
roadGeo.rotateX(-Math.PI / 2);
const road = new THREE.Mesh(
  roadGeo,
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.position.y = 0.02;
scene.add(road);

// CAR (CLEAR FRONT)
const car = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.5, 2.8),
  new THREE.MeshStandardMaterial({ color: 0xff3333 })
);
body.position.y = 0.4;

const hood = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 0.4, 1.2),
  new THREE.MeshStandardMaterial({ color: 0xdd2222 })
);
hood.position.set(0, 0.6, 0.8);

car.add(body, hood);
scene.add(car);

// STATE
let speed = 0;
let steer = 0;
let autoDrive = false;
let started = false;
const keys = {};

const engine = document.getElementById("engine");

// UI
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const hud = document.getElementById("hud");

startBtn.onclick = () => {
  started = true;
  menu.style.display = "none";
  engine.volume = 0.4;
  engine.play();
};

// INPUT
addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "f") autoDrive = !autoDrive;
  if (e.key === "r") resetCar();
});
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function resetCar() {
  car.position.set(0, 0.4, 0);
  car.rotation.set(0, 0, 0);
  speed = 0;
}

// LOOP
let time = 0;
function animate() {
  requestAnimationFrame(animate);

  if (started) {
    if (keys["w"] || autoDrive) speed += 0.02;
    if (keys["s"]) speed -= 0.02;
    if (keys[" "]) speed *= 0.9;

    speed *= 0.98;
    speed = THREE.MathUtils.clamp(speed, -0.5, 1.2);

    if (keys["a"]) steer += 0.03;
    if (keys["d"]) steer -= 0.03;
    steer *= 0.9;

    if (autoDrive) steer += -car.rotation.y * 0.02;

    car.rotation.y += steer * speed;
    car.position.x += Math.sin(car.rotation.y) * speed * 15;
    car.position.z += Math.cos(car.rotation.y) * speed * 15;

    engine.playbackRate = 0.7 + Math.abs(speed) * 1.5;
    hud.textContent = "SPD " + Math.round(Math.abs(speed) * 100);
  }

  camera.position.lerp(
    new THREE.Vector3(
      car.position.x,
      car.position.y + 5,
      car.position.z - 8
    ),
    0.1
  );
  camera.lookAt(car.position);

  time += 0.0004;
  sun.intensity = 0.4 + Math.sin(time) * 0.4;
  scene.background.setHSL(0.6, 0.5, 0.55 + Math.sin(time) * 0.15);

  renderer.render(scene, camera);
}

animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
