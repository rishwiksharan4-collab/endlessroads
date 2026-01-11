let scene, camera, renderer;
let car;
let speed = 0;
let forward = false;
let turnLeft = false;
let turnRight = false;
let started = false;

// MOBILE
let isMobile = /Android|iPhone/i.test(navigator.userAgent);

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Terrain
    let groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    groundGeo.rotateX(-Math.PI / 2);

    let groundMat = new THREE.MeshLambertMaterial({ color: 0x7CFC00 });
    let ground = new THREE.Mesh(groundGeo, groundMat);
    scene.add(ground);

    // Car
    let carGeo = new THREE.BoxGeometry(1, 0.5, 2);
    let carMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    car = new THREE.Mesh(carGeo, carMat);
    car.position.y = 0.3;
    scene.add(car);

    // Lighting
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    if (started) {
        if (forward) speed += 0.002;
        else speed *= 0.98;

        if (turnLeft) car.rotation.y += 0.04;
        if (turnRight) car.rotation.y -= 0.04;

        car.position.x -= Math.sin(car.rotation.y) * speed;
        car.position.z -= Math.cos(car.rotation.y) * speed;

        camera.position.lerp(
            new THREE.Vector3(car.position.x, car.position.y + 3, car.position.z + 8),
            0.05
        );
        camera.lookAt(car.position);
    }

    renderer.render(scene, camera);
}

document.getElementById("startBtn").onclick = () => {
    document.getElementById("ui").style.display = "none";
    started = true;
};

// PC Controls
window.onkeydown = (e) => {
    if (e.key === "w") forward = true;
    if (e.key === "a") turnLeft = true;
    if (e.key === "d") turnRight = true;
};

window.onkeyup = (e) => {
    if (e.key === "w") forward = false;
    if (e.key === "a") turnLeft = false;
    if (e.key === "d") turnRight = false;
};

// Mobile Controls
if (isMobile) {
    document.getElementById("mobileControls").style.display = "flex";

    btnLeft.onclick = () => { turnLeft = true; setTimeout(()=>turnLeft=false,150); }
    btnRight.onclick = () => { turnRight = true; setTimeout(()=>turnRight=false,150); }
    btnBrake.onclick = () => { speed *= 0.5; }
}

init();
