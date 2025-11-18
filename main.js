// Endless Roads - main.js
(() => {
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

  // simple UI navigation
  settingsBtn.addEventListener('click', ()=>{ menu.classList.add('hidden'); settings.classList.remove('hidden'); });
  aboutBtn.addEventListener('click', ()=>{ menu.classList.add('hidden'); about.classList.remove('hidden'); });
  backFromSettings.addEventListener('click', ()=>{ settings.classList.add('hidden'); menu.classList.remove('hidden'); });
  backFromAbout.addEventListener('click', ()=>{ about.classList.add('hidden'); menu.classList.remove('hidden'); });

  // three.js setup
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x87ceeb, 0); // transparent sky

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.0006);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
  camera.position.set(0, 6, 14);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
  hemi.position.set(0,50,0); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(5,10,2); scene.add(dir);

  // road params
  const laneWidth = 2.8;
  const roadWidth = laneWidth * 3;
  const segLen = 12;
  const visibleSegments = 14;

  const roadMat = new THREE.MeshStandardMaterial({color:0x222a31, metalness:0.1, roughness:0.9});
  const lineMat = new THREE.MeshBasicMaterial({color:0xffd54f});
  const sideMat = new THREE.MeshStandardMaterial({color:0x1e612d});

  const roadGroup = new THREE.Group(); scene.add(roadGroup);

  function makeRoadSegment(z) {
    const g = new THREE.Group();
    const plane = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, 0.1, segLen), roadMat);
    plane.position.set(0, 0, z);
    g.add(plane);
    const dashCount = 6;
    for (let i=0;i<dashCount;i++){
      const dw = 0.2, dh = 0.02;
      const dz = z - segLen/2 + (i+0.5)*(segLen/dashCount);
      const dash = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, segLen/dashCount*0.6), lineMat);
      dash.position.set(0, 0.06, dz);
      g.add(dash);
    }
    const left = new THREE.Mesh(new THREE.BoxGeometry(roadWidth*2, 0.1, segLen), sideMat);
    left.position.set(-roadWidth, 0, z); g.add(left);
    const right = left.clone(); right.position.set(roadWidth, 0, z); g.add(right);
    return g;
  }

  const segments = [];
  for (let i=0;i<visibleSegments;i++){
    const seg = makeRoadSegment(-i*segLen);
    roadGroup.add(seg);
    segments.push(seg);
  }

  // car
  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.5,2.2), new THREE.MeshStandardMaterial({color:0xff3b3b}));
  body.position.set(0,0.6,6); car.add(body);
  const wheelGeo = new THREE.BoxGeometry(0.3,0.3,0.7);
  const wheelMat = new THREE.MeshStandardMaterial({color:0x111111});
  for (let x of [-0.55,0.55]) for (let z of [-0.6,0.6]){
    const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(x,0.25,6+z); car.add(w);
  }
  scene.add(car);

  // simple clouds (billboards)
  const cloudGeo = new THREE.PlaneGeometry(6,2.4);
  const cloudMat = new THREE.MeshBasicMaterial({color:0xffffff, opacity:0.95, transparent:true});
  for(let i=0;i<8;i++){
    const c = new THREE.Mesh(cloudGeo, cloudMat);
    c.position.set((Math.random()-0.5)*60, 8+Math.random()*6, -Math.random()*100);
    c.rotation.y = Math.random()*0.6-0.3;
    scene.add(c);
  }

  // controls
  let lane = 0; let targetX = 0;
  const lanePositions = [-laneWidth, 0, laneWidth];
  function moveLeft(){ lane = Math.max(-1, lane-1); targetX = lanePositions[lane+1]; }
  function moveRight(){ lane = Math.min(1, lane+1); targetX = lanePositions[lane+1]; }

  window.addEventListener('keydown', (e)=>{ if(e.key==='ArrowLeft'||e.key==='a') moveLeft(); if(e.key==='ArrowRight'||e.key==='d') moveRight(); });

  // touch steering (screen edge)
  let touchStartX = null;
  window.addEventListener('touchstart', (e)=>{ if(e.touches && e.touches[0]) touchStartX = e.touches[0].clientX; });
  window.addEventListener('touchend', (e)=>{ if(!touchStartX) return; const x = e.changedTouches[0].clientX; if(x < touchStartX-20) moveLeft(); else if(x > touchStartX+20) moveRight(); touchStartX = null; });

  // tilt cosmetic
  if(window.DeviceOrientationEvent) window.addEventListener('deviceorientation', (ev)=>{ if(ev.gamma!==null){ const tilt = Math.max(-25, Math.min(25, ev.gamma)); car.rotation.z = THREE.MathUtils.degToRad(-tilt/40); } });

  // game state
  let speed = 0.35; let distance = 0; let score = 0; let running = false; let paused = false;

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    if(running && !paused){
      speed = Math.min(1.4, speed + dt*0.02);
      const moveZ = speed * 60 * dt * 0.04;
      for (let seg of segments){
        seg.position.z += moveZ;
        if(seg.position.z > segLen*1.5){
          const minZ = Math.min(...segments.map(s=>s.position.z));
          seg.position.z = minZ - segLen;
        }
      }
      // score
      distance += moveZ;
      const newScore = Math.floor(distance * 2);
      if(newScore !== score){ score = newScore; scoreEl && (scoreEl.innerText = `Score: ${score}`); }
    }
    // smooth car
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
    running = true;
    paused = false;
  });
  pauseBtn.addEventListener('click', ()=>{
    paused = !paused;
    pauseBtn.innerText = paused ? '▶' : '⏸';
  });

  // resize
  window.addEventListener('resize', ()=>{ renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); });

})();
