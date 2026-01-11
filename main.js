let scene, camera, renderer;
let car, speed = 0, turn = 0;
let chunks = [];
let isMobile = false;
let playing = false;

const CHUNK_SIZE = 200;
const ROAD_WIDTH = 40;
const CAR_SPEED = 0.4;

window.onload = () => init();

function init() {
    detectDevice();
    setupScene();
    setupCar();
    createChunk(0);
    createChunk(1);

    document.getElementById("beginBtn").onclick = startGame;
    
    animate();
}

function detectDevice() {
    isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
        document.getElementById("mobileControls").style.display = "flex";
        setupMobileControls();
    }
}

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(light);
}

function setupCar() {
    const geometry = new THREE.BoxGeometry(8,4,14);
    const material = new THREE.MeshStandardMaterial({ color:0xffffff });
    car = new THREE.Mesh(geometry, material);
    car.position.set(0,3,0);
    scene.add(car);
}

function createChunk(index) {
    const offset = index * CHUNK_SIZE;
    
    // Terrain
    const tGeo = new THREE.PlaneGeometry(500, CHUNK_SIZE, 50, 50);
    tGeo.rotation.x = -Math.PI/2;
    
    for (let i=0;i<tGeo.vertices?.length;i++){
        const x = tGeo.vertices[i].x * 0.02;
        const z = (tGeo.vertices[i].z + offset) * 0.02;
        tGeo.vertices[i].y = noise.perlin2(x, z) * 6;
    }

    const tMat = new THREE.MeshStandardMaterial({color:0x7ED957, flatShading:true});
    const terrain = new THREE.Mesh(tGeo, tMat);
    terrain.position.z = offset;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Road
    const rGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CHUNK_SIZE);
    rGeo.rotation.x = -Math.PI/2;
    const rMat = new THREE.MeshStandardMaterial({color:0x303030});
    const road = new THREE.Mesh(rGeo, rMat);
    road.position.set(0,0.1,offset);
    scene.add(road);

    chunks.push({ terrain, road, index });
}

function updateChunks() {
    const first = chunks[0];
    if (car.position.z > (first.index+1)*CHUNK_SIZE) {
        first.terrain.position.z += CHUNK_SIZE*2;
        first.road.position.z += CHUNK_SIZE*2;
        first.index += 2;
        chunks.push(chunks.shift());
    }
}

function startGame() {
    document.getElementById("menu").style.display = "none";
    playing = true;
}

function animate() {
    requestAnimationFrame(animate);
    if (playing) update();
    renderer.render(scene, camera);
}

function update() {
    if (!isMobile) keyboardControls();
    moveCar();
    updateCamera();
    updateChunks();
}

function keyboardControls() {
    document.onkeydown = (e)=>{
        if (e.key==='a') turn = -1;
        if (e.key==='d') turn = 1;
        if (e.key==='w') speed = CAR_SPEED;
        if (e.key==='s') speed = -CAR_SPEED;
    };
    document.onkeyup = ()=>{ turn=0; speed=0; };
}

function setupMobileControls() {
    document.getElementById("btnLeft").ontouchstart = ()=> turn = -1;
    document.getElementById("btnRight").ontouchstart = ()=> turn = 1;
    document.getElementById("btnLeft").ontouchend = document.getElementById("btnRight").ontouchend = ()=> turn=0;
}

function moveCar() {
    car.position.z += speed;
    car.position.x += turn;
}

function updateCamera() {
    camera.position.set(car.position.x, car.position.y+15, car.position.z-30);
    camera.lookAt(car.position);
}

window.onresize = () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
};
