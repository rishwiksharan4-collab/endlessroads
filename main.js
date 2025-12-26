// BASIC SCENE
const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd6ff);
scene.fog = new THREE.Fog(0x9fd6ff, 30, 160);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 5, 12);

// LIGHTING (DAYTIME, REALISTIC)
scene.add(new THREE.HemisphereLight(0xffffff, 0x88bbff, 0.9));

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(-30, 50, 20);
scene.add(sun);

// GROUND / TERRAIN
const groundGeo = new THREE.PlaneGeometry(400, 400, 32, 32);
groundGeo.rotateX(-Math.PI / 2);

for (let i = 0; i < groundGeo.attributes.position.count; i++) {
  const y = Math.sin(i * 0.15) * 1.2;
  groundGeo.attributes.position.setY(i, y - 2);
}
groundGeo.computeVertexNormals();

const ground = new THREE.Mesh(
  groundGeo,
  new THREE.MeshStandardMaterial({ color: 0x8fbc8f, roughness: 1 })
);
scene.add(ground);

// ROAD SEGMENTS (ENDLESS)
const road = new THREE.Group();
scene.add(road);

const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

function createRoadSegment(z) {
  const geo = new THREE.BoxGeometry(8, 0.1, 12);
  const mesh = new THREE.Mesh(geo, roadMat);
  mesh.position.z = z;
  mesh.position.y = 0.05;
  return mesh;
}

const segments = [];
for (let i = 0; i < 30; i++) {
  const seg = createRoadSegment(-i * 12);
  road.add(seg);
  segments.push(seg);
}

// CAR
const car = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.6, 2.8),
  new THREE.MeshStandardMaterial({ color: 0xff5555 })
);
car.position.y = 0.6;
car.position.z = 2;
scene.add(car);

// LANE SYSTEM
const lanes = [-3, 0, 3];
let currentLane = 1;
let targetX = 0;

// CONTROLS
window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") currentLane = Math.max(0, currentLane - 1);
  if (e.key === "ArrowRight") currentLane = Math.min(2, currentLane + 1);
  targetX = lanes[currentLane];
});

// GAME STATE
let speed = 0;
let running = false;

document.getElementById("startBtn").onclick = () => {
  running = true;
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");
};

// LOOP
function animate() {
  requestAnimationFrame(animate);

  if (running) {
    speed = Math.min(speed + 0.002, 0.5);

    // MOVE ROAD
    segments.forEach(seg => {
      seg.position.z += speed * 20;
      if (seg.position.z > 10) {
        seg.position.z -= 360;
      }
    });

    // SMOOTH LANE MOVE
    car.position.x += (targetX - car.position.x) * 0.1;

    // CAMERA FOLLOW
    camera.position.x += (car.position.x - camera.position.x) * 0.05;
    camera.lookAt(car.position.x, 1, -20);

    document.getElementById("speed").innerText =
      "SPD " + Math.round(speed * 200);
  }

  renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
