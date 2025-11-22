// Endless Roads - cartoon edition (main.js)
(() => {
  // UI refs
  const startBtn = document.getElementById('startBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const aboutBtn = document.getElementById('aboutBtn');
  const menu = document.getElementById('menu');
  const settings = document.getElementById('settings');
  const about = document.getElementById('about');
  const backFromSettings = document.getElementById('backFromSettings');
  const backFromAbout = document.getElementById('backFromAbout');
  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score');
  const pauseBtn = document.getElementById('pauseBtn');
  const canvas = document.getElementById('gameCanvas');

  // UI navigation
  settingsBtn.addEventListener('click', ()=>{ menu.classList.add('hidden'); settings.classList.remove('hidden'); });
  aboutBtn.addEventListener('click', ()=>{ menu.classList.add('hidden'); about.classList.remove('hidden'); });
  backFromSettings.addEventListener('click', ()=>{ settings.classList.add('hidden'); menu.classList.remove('hidden'); });
  backFromAbout.addEventListener('click', ()=>{ about.classList.add('hidden'); menu.classList.remove('hidden'); });

  // renderer & scene
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x87ceeb, 0); // transparent so CSS gradient shows

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.0007);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth/window.innerHeight, 0.1, 2000);
  camera.position.set(0, 6, 14);

  // lights (soft, cartoony)
  const hemi = new THREE.HemisphereLight(0xffffff, 0xbbd6ff, 0.9); hemi.position.set(0,50,0); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(5,10,2); scene.add(dir);

  // road params
  const laneWidth = 2.6;
  const roadWidth = laneWidth * 3;
  const segLen = 14;
  const visibleSegments = 16;

  // simple materials with cartoon-ish look (no textures)
  const roadMat = new THREE.MeshStandardMaterial({color:0x35424a, metalness:0.1, roughness:0.8});
  const lineMat = new THREE.MeshBasicMaterial({color:0xfff0a8});
  const grassMat = new THREE.MeshStandardMaterial({color:0x9bcc7a, metalness:0.05, roughness:0.9});

  // container
  const roadGroup = new THREE.Group(); scene.add(roadGroup);

  function makeRoadSegment(z) {
    const g = new THREE.Group();
    const plane = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, 0.2, segLen), roadMat);
    plane.position.set(0, 0, z); g.add(plane);

    // dashed center line (cartoon dashes)
    const dashCount = 5;
    for (let i=0;i<dashCount;i++){
      const dw = 0.3, dh = 0.06;
      const dz = z - segLen/2 + (i+0.5)*(segLen/dashCount);
      const dash = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, segLen/dashCount*0.6), lineMat);
      dash.position.set(0, 0.12, dz);
      g.add(dash);
    }

    // grassy sides (wider planes slightly lower)
    const left = new THREE.Mesh(new THREE.BoxGeometry(roadWidth*2.2, 0.2, segLen), grassMat);
    left.position.set(-roadWidth*1.2, -0.06, z); g.add(left);
    const right = left.clone(); right.position.set(roadWidth*1.2, -0.06, z); g.add(right);

    return g;
  }

  const segments = [];
  for (let i=0;i<visibleSegments;i++){
    const seg = makeRoadSegment(-i*segLen);
    roadGroup.add(seg);
    segments.push(seg);
  }

  // CARTOON CAR (original, simple shapes)
  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.6,2.4), new THREE.MeshStandardMaterial({color:0xff6b6b, metalness:0.1, roughness:0.6}));
  body.position.set(0,0.9,6); body.castShadow = true; car.add(body);
  // windshield
  const wind = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.3,0.9), new THREE.MeshStandardMaterial({color:0x4ad3ff, metalness:0.2, roughness:0.3}));
  wind.position.set(0,1.05,5.35); car.add(wind);
  // wheels (simple rounded boxes)
  const wheelGeo = new THREE.CylinderGeometry(0.28,0.28,0.5,16);
  const wheelMat = new THREE.MeshStandardMaterial({color:0x222});
  for (let x of [-0.7,0.7]) for (let z of [5.6,6.3]){
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI/2;
    w.position.set(x,0.35,z);
    car.add(w);
  }
  scene.add(car);

  // Some cartoon clouds (simple planes)
  const cloudGeo = new THREE.PlaneGeometry(6,2.8);
  const cloudMat = new THREE.MeshBasicMaterial({color:0xffffff, opacity:0.95, transparent:true});
  for(let i=0;i<8;i++){
    const c = new THREE.Mesh(cloudGeo, cloudMat);
    c.position.set((Math.random()-0.5)*80, 7+Math.random()*6, -Math.random()*200);
    c.rotation.y = Math.random()*0.6-0.3;
    scene.add(c);
  }

  // controls & state
  let lane = 0; let targetX = 0;
  const lanePositions = [-laneWidth, 0, laneWidth];
  function moveLeft(){ lane = Math.max(-1, lane-1); targetX = lanePositions[lane+1]; }
  function moveRight(){ lane = Math.min(1, lane+1); targetX = lanePositions[lane+1]; }

  window.addEventListener('keydown', (e)=>{ if(e.key==='ArrowLeft'||e.key==='a') moveLeft(); if(e.key==='ArrowRight'||e.key==='d') moveRight(); });

  // simple touch: left/right half tap
  window.addEventListener('touchstart', (e)=>{ if(!e.touches || !e.touches[0]) return; const x = e.touches[0].clientX; if(x < window.innerWidth/2) moveLeft(); else moveRight(); });

  // tilt cosmetic
  if(window.DeviceOrientationEvent) window.addEventListener('deviceorientation', (ev)=>{ if(ev.gamma!==null){ const tilt = Math.max(-25, Math.min(25, ev.gamma)); car.rotation.z = THREE.MathUtils.degToRad(-tilt/40); } });

  // game mechanics
  let speed = 0.35; let distance = 0; let score = 0; let running = false; let paused = false;

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    if(running && !paused){
      speed = Math.min(1.6, speed + dt*0.02);
      const moveZ = speed * 60 * dt * 0.04;
      for (let seg of segments){
        seg.position.z += moveZ;
        if(seg.position.z > segLen*1.5){
          const minZ = Math.min(...segments.map(s=>s.position.z));
          seg.position.z = minZ - segLen;
        }
      }
      distance += moveZ;
      const newScore = Math.floor(distance * 2);
      if(newScore !== score){ score = newScore; scoreEl && (scoreEl.innerText = `Score: ${score}`); }
    }
    // smooth car lateral movement
    car.position.x += (targetX - car.position.x) * 0.18;
    camera.position.x += (car.position.x - camera.position.x)*0.05;
    camera.lookAt(car.position.x, 1.8, car.position.z - 6);
    renderer.render(scene, camera);
  }
  animate();

  // UI interactions
  startBtn.addEventListener('click', ()=>{
    menu.classList.add('hidden');
    hud.classList.remove('hidden');
    running = true; paused = false;
  });
  pauseBtn.addEventListener('click', ()=>{
    paused = !paused;
    pauseBtn.innerText = paused ? '▶' : '⏸';
  });

  // resize handling
  window.addEventListener('resize', ()=>{ renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); });

})();
