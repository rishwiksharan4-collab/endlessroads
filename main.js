let scene,camera,renderer,car,road,terrain,light;
let speed=0, steer=0, autoDrive=false, started=false;
const keys={};

const engine=document.getElementById("engine");

document.getElementById("startBtn").onclick=()=>{
  started=true;
  engine.volume=0.4;
  engine.play();
};

window.onkeydown=e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key==="f") autoDrive=!autoDrive;
  if(e.key==="r") resetCar();
};

window.onkeyup=e=>keys[e.key.toLowerCase()]=false;

init();
animate();

function init(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x87ceeb);

  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,3000);

  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  document.body.appendChild(renderer.domElement);

  light=new THREE.DirectionalLight(0xffffff,1);
  light.position.set(50,100,50);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff,0.4));

  terrain=createTerrain();
  scene.add(terrain);

  road=createRoad();
  scene.add(road);

  car=createCar();
  scene.add(car);

  resetCar();

  window.onresize=()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  };
}

function createCar(){
  const g=new THREE.BoxGeometry(1,0.6,2);
  const m=new THREE.MeshStandardMaterial({color:0xff3333});
  const c=new THREE.Mesh(g,m);

  const head=new THREE.SpotLight(0xffffff,1,20,0.6);
  head.position.set(0,0.5,1.2);
  c.add(head);

  return c;
}

function createRoad(){
  const g=new THREE.PlaneGeometry(50,3000);
  g.rotateX(-Math.PI/2);
  const m=new THREE.MeshStandardMaterial({color:0x333333});
  return new THREE.Mesh(g,m);
}

function createTerrain(){
  const g=new THREE.PlaneGeometry(3000,3000,120,120);
  g.rotateX(-Math.PI/2);
  const p=g.attributes.position;

  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);
    const h=
      Math.sin(x*0.004)*6+
      Math.cos(z*0.004)*6+
      Math.sin((x+z)*0.002)*14;
    p.setY(i,h);
  }
  g.computeVertexNormals();

  return new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({color:0x5fbf5f})
  );
}

function resetCar(){
  car.position.set(0,0.4,0);
  car.rotation.set(0,0,0);
  speed=0;
}

let time=0;
function animate(){
  requestAnimationFrame(animate);

  if(started){
    if(keys["w"]) speed+=0.002;
    if(keys["s"]) speed-=0.002;
    if(keys[" "]) speed*=0.9;

    speed*=0.99;
    speed=Math.max(-0.2,Math.min(0.4,speed));

    if(keys["a"]) steer+=0.03;
    if(keys["d"]) steer-=0.03;
    steer*=0.9;

    if(autoDrive){
      steer+=(-car.rotation.y)*0.02;
      speed=0.15;
    }

    car.rotation.y+=steer*speed;
    car.position.x+=Math.sin(car.rotation.y)*speed*20;
    car.position.z+=Math.cos(car.rotation.y)*speed*20;

    engine.playbackRate=0.6+Math.abs(speed)*2;
  }

  camera.position.lerp(
    new THREE.Vector3(
      car.position.x,
      car.position.y+5,
      car.position.z-8
    ),0.1
  );
  camera.lookAt(car.position);

  time+=0.0003;
  light.intensity=0.5+Math.sin(time)*0.5;
  scene.background.setHSL(0.6,0.5,0.6+Math.sin(time)*0.2);

  renderer.render(scene,camera);
}
