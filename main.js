// BASIC SETUP
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

// LIGHT
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 100, 50);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// GROUND (FREE ROAM)
const groundGeo = new THREE.PlaneGeometry(2000, 2000);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x6dbf4b });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ROAD (NO LINES)
const roadGeo = new THREE.PlaneGeometry(20, 2000);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.01;
scene.add(road);

// CAR
const car = new THREE.Mesh(
  new THREE.BoxGeometry(1, 0.6, 2),
  new THREE.MeshStandardMaterial({ color: 0xff4444 })
);
car.position.y = 0.3;
scene.add(car);

// STATE
let started = false;
let speed = 0;
let autoDrive = false;
const keys = {};

// UI
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const hud = document.getElementById("hud");

startBtn.onclick = () => {
  started = true;
  menu.style.display = "none";
};

// INPUT
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === "f") autoDrive = !autoDrive;
});
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// DAY / NIGHT
let time = 0;

// LOOP
function animate() {
  requestAnimationFrame(animate);

  if (!started) {
    renderer.render(scene, camera);
    return;
  }

  // CONTROLS
  if (keys["w"] || autoDrive) speed += 0.02;
  if (keys["s"]) speed -= 0.03;
  if (keys[" "]) speed *= 0.9;

  speed *= 0.98;
  speed = THREE.MathUtils.clamp(speed, -1, 2);

  if (keys["a"]) car.rotation.y += 0.04;
  if (keys["d"]) car.rotation.y -= 0.04;

  car.translateZ(speed);

  camera.position.lerp(
    new THREE.Vector3(
      car.position.x,
      car.position.y + 3,
      car.position.z + 6
    ),
    0.08
  );
  camera.lookAt(car.position);

  // DAY NIGHT CYCLE
  time += 0.0005;
  const t = (Math.sin(time) + 1) / 2;
  scene.background = new THREE.Color().setHSL(0.6, 0.5, 0.3 + t * 0.4);
  sun.intensity = 0.3 + t;

  hud.textContent = "SPD " + Math.abs(speed * 100).toFixed(0);

  renderer.render(scene, camera);
}

animate();

window.onresize = () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
};
