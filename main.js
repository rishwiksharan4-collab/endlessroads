// BASIC SETUP
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 200);

let camera = new THREE.PerspectiveCamera(
  70, window.innerWidth / window.innerHeight, 0.1, 500
);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LIGHTS
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
let sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 100, 50);
scene.add(sun);

// CURVED ROAD PATH
let path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(10, 0, -50),
  new THREE.Vector3(-10, 0, -100),
  new THREE.Vector3(0, 0, -150),
]);

// ROAD MESH
let roadGeo = new THREE.TubeGeometry(path, 100, 3, 8, false);
let roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
let road = new THREE.Mesh(roadGeo, roadMat);
scene.add(road);

// GROUND
let ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshLambertMaterial({ color: 0x66cc66 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// SIMPLE CAR (LOW POLY, WHITE)
let car = new THREE.Group();

let base = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.6, 4),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
base.position.y = 0.6;
car.add(base);

let cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.6, 2),
  new THREE.MeshStandardMaterial({ color: 0xdddddd })
);
cabin.position.set(0, 1, -0.3);
car.add(cabin);

scene.add(car);

// MOVEMENT
let speed = 0;
let maxSpeed = 0.3;
let accel = 0.01;
let friction = 0.02;

// CAMERA MODES
let camMode = "third";

// CONTROLS
window.addEventListener("keydown", e => {
  if (e.key === "w") speed = Math.min(speed + accel, maxSpeed);
  if (e.key === "s") speed = Math.max(speed - accel, -0.2);
  if (e.key === "a") car.rotation.y += 0.04;
  if (e.key === "d") car.rotation.y -= 0.04;
  if (e.key === " ") speed = 0;

  if (e.key === "c") camMode = "first";
  if (e.key === "e") camMode = "drone";
  if (e.key === "v") camMode = "third";
});

// ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);

  speed *= (1 - friction);
  car.translateZ(-speed);

  // CAMERA LOGIC
  if (camMode === "third") {
    camera.position.lerp(
      new THREE.Vector3(
        car.position.x,
        car.position.y + 4,
        car.position.z + 8
      ), 0.1
    );
    camera.lookAt(car.position);
  }

  if (camMode === "first") {
    camera.position.copy(
      car.position.clone().add(new THREE.Vector3(0, 1.2, -1))
    );
    camera.rotation.copy(car.rotation);
  }

  if (camMode === "drone") {
    camera.position.lerp(
      new THREE.Vector3(
        car.position.x + 10,
        car.position.y + 10,
        car.position.z + 10
      ), 0.02
    );
    camera.lookAt(car.position);
  }

  document.getElementById("hud").innerText =
    "SPD " + Math.abs(speed * 200).toFixed(0);

  renderer.render(scene, camera);
}

animate();
