let scene, camera, renderer;
let car, road;
let started = false;
let paused = false;

let speed = 0;
let maxSpeed = 0.6;
let accel = 0.01;
let friction = 0.02;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 10, 120);

  camera = new THREE.PerspectiveCamera(
    70, window.innerWidth / window.innerHeight, 0.1, 500
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // LIGHTS
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(50, 100, 50);
  scene.add(sun);

  // TERRAIN
  const groundGeo = new THREE.PlaneGeometry(500, 500);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x66cc66 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ROAD
  const roadGeo = new THREE.PlaneGeometry(8, 500);
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.01;
  scene.add(road);

  // CAR (BMW-INSPIRED, NOT COPYING)
  car = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.6, 4),
    new THREE.MeshStandardMaterial({ color: 0xff3300 })
  );
  body.position.y = 0.6;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.5, 2),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  cabin.position.set(0, 1, -0.2);
  car.add(cabin);

  car.position.z = 0;
  scene.add(car);

  camera.position.set(0, 4, 8);
  camera.lookAt(car.position);

  document.getElementById("startBtn").onclick = () => {
    started = true;
    document.getElementById("pauseBtn").disabled = false;
  };

  document.getElementById("pauseBtn").onclick = () => {
    paused = !paused;
  };

  window.addEventListener("keydown", controls);
}

function controls(e) {
  if (!started) return;

  if (e.key === "w") speed = Math.min(speed + accel, maxSpeed);
  if (e.key === "s") speed = Math.max(speed - accel, -0.3);
  if (e.key === "a") car.rotation.y += 0.04;
  if (e.key === "d") car.rotation.y -= 0.04;
  if (e.key === " ") speed = 0;
  if (e.key === "r") car.position.set(0, 0, 0);
}

function animate() {
  requestAnimationFrame(animate);

  if (started && !paused) {
    speed *= (1 - friction);
    car.translateZ(-speed);

    camera.position.lerp(
      new THREE.Vector3(
        car.position.x,
        car.position.y + 4,
        car.position.z + 8
      ), 0.1
    );

    document.getElementById("speed").innerText =
      "SPD " + Math.abs(speed * 200).toFixed(0);
  }

  renderer.render(scene, camera);
}
