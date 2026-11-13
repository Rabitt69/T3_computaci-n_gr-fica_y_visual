import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinnedModel } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/SkeletonUtils.js';

// Operación Extracción: compact FPS built with Three.js. GLB models are local.
const canvas=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene(); scene.background=new THREE.Color('#101923'); scene.fog=new THREE.Fog('#101923',22,92);
const camera=new THREE.PerspectiveCamera(74,1,.08,120); camera.position.set(0,1.65,4);
scene.add(new THREE.HemisphereLight('#a9c8d2','#292b31',2)); const sun=new THREE.DirectionalLight('#ffd5a0',2.2); sun.position.set(-8,14,5); sun.castShadow=true; scene.add(sun);
const mat=(c,r=.9)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const concrete=mat('#3c4547'), floorMat=mat('#30383a'), rusty=mat('#694838'), green=mat('#536b55'), glow=new THREE.MeshBasicMaterial({color:'#ffad5d'});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,130),floorMat); ground.rotation.x=-Math.PI/2; ground.position.set(0,-.04,-43); ground.receiveShadow=true; scene.add(ground);
function box(x,y,z,sx,sy,sz,m,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o;}
// A long evacuation road with four recognizable encounter zones and cover.
for(let side of [-1,1]){box(side*7,1,-39,1,2,94,concrete);for(let z=-82;z<5;z+=9){box(side*5.7,.65,z,1.7,1.3,1.2,rusty);box(side*4.4,.25,z-2,.45,.5,1.8,green);}}
for(let z=-84;z<4;z+=8){box(-1.8,.015,z,.08,.02,3,mat('#d2b784'),false);box(1.8,.015,z,.08,.02,3,mat('#d2b784'),false);}
// extraction beacon and perimeter
const extract=new THREE.Group();extract.position.set(0,0,-86);scene.add(extract);
for(let x of [-3.3,3.3]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,3,10),glow);p.position.set(x,1.5,0);extract.add(p);}
const arch=new THREE.Mesh(new THREE.BoxGeometry(6.8,.18,.25),glow);arch.position.y=3;extract.add(arch);
const floor=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,.08,32),new THREE.MeshBasicMaterial({color:'#2d9b76',transparent:true,opacity:.42}));floor.position.y=.02;extract.add(floor);
// GLB models: loaded asynchronously; visible procedural silhouettes remain as fallback until loaded.
const loader=new GLTFLoader(); const models={};
loader.load('./assets/free_ak47_gold.glb',g=>{models.rifle=g.scene;if(selected===1)equip(1);},undefined,error=>console.error('No se pudo cargar free_ak47_gold.glb',error));
loader.load('./assets/shotgun.glb',g=>{models.shotgun=g.scene;if(selected===2)equip(2);},undefined,()=>{});
loader.load('./assets/zombie_walk_test.glb',g=>{models.zombie=g;for(const enemy of enemies)attachZombieModel(enemy);},undefined,error=>console.error('No se pudo cargar zombie_walk_test.glb',error));
loader.load('./assets/crying_head.glb',g=>{models.fastZombie=g;for(const enemy of enemies)if(enemy.userData.fast)attachZombieModel(enemy);},undefined,error=>console.error('No se pudo cargar crying_head.glb',error));
const weaponMount=new THREE.Group(); weaponMount.position.set(.34,-.28,-.62); camera.add(weaponMount); scene.add(camera);
function makeGunFallback(kind){const group=new THREE.Group(),m=mat(kind===1?'#59636a':'#684b3c');const body=new THREE.Mesh(new THREE.BoxGeometry(kind===1?.13:.19,.15,.52),m);group.add(body);const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.48,10),mat('#252a2d'));barrel.rotation.x=Math.PI/2;barrel.position.z=-.43;group.add(barrel);const grip=new THREE.Mesh(new THREE.BoxGeometry(.09,.22,.12),m);grip.position.set(0,-.16,.05);grip.rotation.x=-.2;group.add(grip);if(kind===1){const sight=new THREE.Mesh(new THREE.BoxGeometry(.045,.055,.12),mat('#24292d'));sight.position.y=.1;group.add(sight);}return group;}
let selected=1,gun=makeGunFallback(1); weaponMount.add(gun);
function equip(n){selected=n;weaponMount.remove(gun);const loaded=n===1?models.rifle:models.shotgun;gun=loaded?loaded.clone(true):makeGunFallback(n);if(loaded){gun.scale.setScalar(1);gun.rotation.set(0,n===1?0:-Math.PI/2,0);gun.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(gun),extent=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=.88/Math.max(extent.x,extent.y,extent.z);gun.scale.setScalar(scale);gun.position.set(-center.x*scale,-center.y*scale,-center.z*scale);}weaponMount.add(gun);document.querySelector('#weapon-label').textContent=n===1?'FUSIL M4':'ESCOPETA';updateAmmo();}
const ammo={1:10,2:4},maxAmmo={1:18,2:8};let kills=0;
function updateAmmo(){document.querySelector('#ammo').textContent=`${ammo[selected]} / ${maxAmmo[selected]}`;}
const player=new THREE.Vector3(0,1.65,4); let yaw=0,pitch=0,locked=false,dragging=false,gameStarted=true,ended=false,won=false;
const keys=new Set(); const enemies=[],crates=[]; const zombieMat=mat('#667a61'),blood=mat('#773b31');
function attachZombieModel(enemy){
 const asset=enemy.userData.fast?models.fastZombie:models.zombie;if(!asset)return;
 enemy.clear();
 const model=cloneSkinnedModel(asset.scene);model.scale.setScalar(enemy.userData.fast ? .0012 : .58);if(enemy.userData.fast)model.position.y=.18;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});enemy.add(model);
 if(asset.animations.length){const mixer=new THREE.AnimationMixer(model);enemy.userData.mixer=mixer;if(enemy.userData.fast){const idleClip=asset.animations.find(a=>a.name.toUpperCase().includes('IDLE'));const moveClip=asset.animations.find(a=>a.name.toUpperCase().includes('MOVE'))||asset.animations[0];if(idleClip){enemy.userData.idleAction=mixer.clipAction(idleClip);enemy.userData.idleAction.play();}enemy.userData.action=mixer.clipAction(moveClip);if(enemy.userData.active){enemy.userData.idleAction?.fadeOut(.2);enemy.userData.action.play();enemy.userData.animationStarted=true;}else enemy.userData.action.paused=true;}else{enemy.userData.action=mixer.clipAction(asset.animations[0]);enemy.userData.action.play();enemy.userData.action.paused=true;if(enemy.userData.active)enemy.userData.action.paused=false;}}
}
function makeZombie(z,x,fast=false){const g=new THREE.Group();g.position.set(x,0,z);g.userData={hp:2,active:false,dead:false,fast,speed:fast?2.5:1.15+Math.random()*.35};
 const torso=new THREE.Mesh(new THREE.BoxGeometry(.56,.86,.3),zombieMat);torso.position.y=1.16;g.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),mat('#879276'));head.position.y=1.83;g.add(head);
 for(const s of [-1,1]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.16,.72,.16),zombieMat);arm.position.set(s*.39,1.23,-.12);arm.rotation.z=s*-.24;g.add(arm);const leg=new THREE.Mesh(new THREE.BoxGeometry(.21,.67,.23),mat('#39433b'));leg.position.set(s*.16,.38,0);g.add(leg);}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);enemies.push(g);return g;}
[-17,-30,-43,-57,-68,-75].forEach((z,i)=>makeZombie(z,i%2?2.3:-2.3,i===2));
function makeCrate(z,x){const g=new THREE.Group();g.position.set(x,.5,z);const c=new THREE.Mesh(new THREE.BoxGeometry(.8,.75,.65),mat('#8d6339'));g.add(c);for(let y of [-.18,.18]){const stripe=new THREE.Mesh(new THREE.BoxGeometry(.82,.065,.67),glow);stripe.position.y=y;g.add(stripe);}g.userData.taken=false;scene.add(g);crates.push(g);}
makeCrate(-24,-2.1);makeCrate(-51,2.1);makeCrate(-71,0);
let health=100,flashTimer=0; const ray=new THREE.Raycaster();
const bullets=[],muzzleFlashes=[];
const bulletGeometry=new THREE.CylinderGeometry(.012,.012,.32,6),bulletMaterial=new THREE.MeshBasicMaterial({color:'#ffe69a',toneMapped:false});
const flashGeometry=new THREE.SphereGeometry(.075,8,8),flashMaterial=new THREE.MeshBasicMaterial({color:'#ffb348',toneMapped:false});
function showBullet(origin,direction,distance){
 const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
 const muzzle=origin.clone().addScaledVector(direction,.68).addScaledVector(right,.32).addScaledVector(up,-.26);
 const bullet=new THREE.Mesh(bulletGeometry,bulletMaterial);bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);bullet.position.copy(muzzle);bullet.renderOrder=20;scene.add(bullet);
 bullets.push({mesh:bullet,start:muzzle,direction:direction.clone(),distance,travel:0,speed:100});
 const flash=new THREE.Mesh(flashGeometry,flashMaterial);flash.position.copy(muzzle);scene.add(flash);muzzleFlashes.push({mesh:flash,life:.065});
}
function shoot(){if(!gameStarted||ended)return;if(ammo[selected]<=0){toast('SIN MUNICIÓN · BUSCA SUMINISTROS');return;}ammo[selected]--;updateAmmo();const origin=camera.getWorldPosition(new THREE.Vector3()),dir=new THREE.Vector3();camera.getWorldDirection(dir);ray.set(origin,dir);ray.far=55;
 const targets=[];for(const z of enemies)if(!z.userData.dead){z.traverse(o=>{if(o.isMesh)targets.push(o);});}
 const hit=ray.intersectObjects(targets,false)[0];const shotDistance=hit?origin.distanceTo(hit.point):45;showBullet(origin,dir,shotDistance);if(hit){let z=hit.object;while(z.parent&&!z.userData?.hp)z=z.parent;if(z.userData?.hp){z.userData.hp--;toast(z.userData.hp?'IMPACTO · 1/2':'ZOMBI ELIMINADO');if(z.userData.hp===0){z.userData.dead=true;z.userData.action?.stop();kills++;z.rotation.x=-Math.PI/2;document.querySelector('#kills').textContent=kills;}}}
 flashTimer=.07;}
canvas.addEventListener('click',()=>{if(!gameStarted||ended)return;if(!locked){try{const result=canvas.requestPointerLock?.();result?.catch(()=>{});}catch{}}shoot();});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;document.querySelector('#lock-hint').classList.toggle('hidden',locked||ended);});
canvas.addEventListener('pointerdown',()=>{dragging=true;});window.addEventListener('pointerup',()=>{dragging=false;});
document.addEventListener('mousemove',e=>{if((!locked&&!dragging)||!gameStarted||ended)return;yaw-=e.movementX*.0022;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0022,-1.15,1.15);camera.rotation.set(pitch,yaw,0,'YXZ');});
document.addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if(e.key==='1')equip(1);if(e.key==='2')equip(2);if(e.key==='Escape'&&ended)restart();});document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
const end=document.querySelector('#end-card');document.querySelector('#restart-button').onclick=restart;
function toast(s){const t=document.querySelector('#toast');t.textContent=s;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1100);}
function finish(victory){if(ended)return;ended=true;won=victory;document.exitPointerLock?.();document.querySelector('#end-title').textContent=victory?'¡MISIÓN COMPLETADA!':'GAME OVER';document.querySelector('#end-copy').textContent=victory?'Has llegado a la zona de extracción.':'Un zombi te atrapó en la zona infestada.';end.classList.remove('hidden');}
function restart(){location.reload();}
function resize(){renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();
let last=performance.now(),elapsed=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.travel+=b.speed*dt;if(b.travel>b.distance){scene.remove(b.mesh);bullets.splice(i,1);}else b.mesh.position.copy(b.start).addScaledVector(b.direction,b.travel);}
 for(let i=muzzleFlashes.length-1;i>=0;i--){const f=muzzleFlashes[i];f.life-=dt;f.mesh.scale.setScalar(Math.max(.05,f.life/.065));if(f.life<=0){scene.remove(f.mesh);muzzleFlashes.splice(i,1);}}
 if(!ended&&gameStarted){const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),move=new THREE.Vector3();if(keys.has('w'))move.add(forward);if(keys.has('s'))move.sub(forward);if(keys.has('d'))move.add(right);if(keys.has('a'))move.sub(right);if(move.lengthSq())move.normalize().multiplyScalar(4.4*dt);player.add(move);player.x=THREE.MathUtils.clamp(player.x,-3.25,3.25);player.z=THREE.MathUtils.clamp(player.z,-83,4);camera.position.copy(player);
 for(const z of enemies){if(z.userData.dead)continue;const dx=player.x-z.position.x,dz=player.z-z.position.z,dist=Math.hypot(dx,dz);if(dist<13){z.userData.active=true;if(z.userData.fast&&!z.userData.animationStarted&&z.userData.action){z.userData.idleAction?.fadeOut(.2);z.userData.action.reset().fadeIn(.2).play();z.userData.animationStarted=true;}else if(z.userData.action)z.userData.action.paused=false;}if(z.userData.active){z.userData.mixer?.update(dt);z.position.x+=dx/(dist||1)*z.userData.speed*dt;z.position.z+=dz/(dist||1)*z.userData.speed*dt;z.rotation.y=Math.atan2(dx,dz);if(dist<.95){health-=34*dt;document.querySelector('#health').style.width=`${Math.max(0,health)}%`;document.querySelector('#health-value').textContent=`${Math.max(0,Math.ceil(health))}%`;if(health<=0)finish(false);}}}
 for(const c of crates)if(!c.userData.taken&&c.position.distanceTo(new THREE.Vector3(player.x,0,player.z))<1.45){c.userData.taken=true;scene.remove(c);ammo[1]=Math.min(maxAmmo[1],ammo[1]+8);ammo[2]=Math.min(maxAmmo[2],ammo[2]+4);updateAmmo();toast('SUMINISTROS +8 / +4');}
 if(player.z < -82)finish(true);document.querySelector('#progress').style.width=`${THREE.MathUtils.clamp((-player.z/86)*100,0,100)}%`;document.querySelector('#meters').textContent=`${Math.max(0,Math.floor(-player.z))} m`;
 }
 gun.rotation.x=Math.sin(elapsed*9)*.012; if(flashTimer>0)flashTimer-=dt;
 renderer.render(scene,camera);if(!window.__GAME_READY)window.__GAME_READY=true;
}requestAnimationFrame(animate);updateAmmo();
