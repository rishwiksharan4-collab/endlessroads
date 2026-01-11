let scene,camera,renderer,car,terrain=[],speed=0,dir=0;
const chunkSize=200, chunks=6, roadWidth=20;
let started=false;

function startGame(){
  document.getElementById("menu").style.display="none";
  init();
}

function init(){
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000);
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  document.body.appendChild(renderer.domElement);

  // CAR
  let geo=new THREE.BoxGeometry(4,2,8);
  let mat=new THREE.MeshStandardMaterial({color:"white"});
  car=new THREE.Mesh(geo,mat);
  car.position.y=1;
  scene.add(car);

  // LIGHT
  let light=new THREE.DirectionalLight(0xffffff,1);
  light.position.set(0,50,50);
  scene.add(light);

  spawnTerrain();
  animate();
  setupControls();
}

function spawnTerrain(){
  for(let i=0;i<chunks;i++){
    let mesh=makeChunk(i*chunkSize);
    terrain.push(mesh);
    scene.add(mesh);
  }
}

function makeChunk(zOffset){
  let geo=new THREE.PlaneGeometry(chunkSize,chunkSize,40,40);
  geo.rotateX(-Math.PI/2);

  for(let i=0;i<geo.attributes.position.count;i++){
    let v=new THREE.Vector3().fromBufferAttribute(geo.attributes.position,i);
    let h=perlin.noise(v.x*0.02,0,v.z*0.02)*5;
    v.y=h;
    geo.attributes.position.setXYZ(i,v.x,v.y,v.z);
  }

  geo.computeVertexNormals();
  let mat=new THREE.MeshStandardMaterial({color:"#8ff28f"});
  let mesh=new THREE.Mesh(geo,mat);
  mesh.position.z=-zOffset;
  return mesh;
}

function recycleChunks(){
  for(let c of terrain){
    if(car.position.z - c.position.z < -chunkSize){
      c.position.z -= chunks*chunkSize;
    }
  }
}

function setupControls(){
  let isMobile = /Android|iPhone/i.test(navigator.userAgent);
  if(isMobile){
    let t=document.getElementById("touchControls");
    t.style.display="flex";
    document.getElementById("btnL").ontouchstart=()=>dir=0.03;
    document.getElementById("btnL").ontouchend=()=>dir=0;
    document.getElementById("btnR").ontouchstart=()=>dir=-0.03;
    document.getElementById("btnR").ontouchend=()=>dir=0;
  } else {
    onkeydown=e=>{
      if(e.key==="a")dir=0.03;
      if(e.key==="d")dir=-0.03;
      if(e.key==="w")speed=0.4;
    }
    onkeyup=e=>{
      if(e.key==="a"||e.key==="d")dir=0;
      if(e.key==="w")speed=0;
    }
  }
}

function animate(){
  requestAnimationFrame(animate);
  car.position.z -= 0.5 + speed;
  car.position.x += dir * car.position.z * 0.0 + dir*10;

  camera.position.set(car.position.x,10,car.position.z+15);
  camera.lookAt(car.position);

  recycleChunks();
  renderer.render(scene,camera);
}
