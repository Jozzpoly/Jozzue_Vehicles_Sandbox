import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { applyC1DamperBetween } from "../rep2/c1-damper-adapter.js";
import { bindRep4DamperDonorAtPhysicalRestLength } from "../rep4/stage-b-damper-visual.js";

const DONOR_URL = "/assets/rep2/Asset_Dumper.gltf";
const app = document.querySelector("#app");
if (!app) throw new Error("Family C V3 requires #app");

document.title = "JV Family C · Component in Hand";
app.innerHTML = `
<style>
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#080c11;color:#edf3f8}.stage{position:relative;width:100vw;height:100vh}canvas{display:block;width:100%;height:100%;touch-action:none}.panel{position:absolute;top:16px;left:16px;width:310px;padding:13px 14px;border:1px solid #40515f;border-radius:12px;background:rgba(8,13,19,.91);backdrop-filter:blur(7px);box-shadow:0 14px 34px #0006}.eyebrow{margin:0 0 4px;color:#98adbd;font-size:10px;letter-spacing:.14em}h1{margin:0;font-size:21px}.warn{margin:8px 0;padding:7px 9px;border:1px solid #745a3d;border-radius:8px;color:#e8c491;background:#6646222e;font-size:10px;font-weight:700}.sub,.hint{font-size:11px;line-height:1.4;color:#a5b5c2}.hint{font-size:10px;color:#7f93a3}.row{display:grid;grid-template-columns:78px 1fr;gap:6px;padding:3px 0;font-size:10px;color:#8395a4}.row output{color:#e1e9ef}.buttons{display:flex;gap:6px;margin-top:9px}button{border:1px solid #506678;border-radius:8px;background:#131d27;color:#eaf2f8;padding:7px 9px;font:11px system-ui;cursor:pointer}button:disabled{opacity:.35}.status{margin-top:9px;min-height:44px;padding:8px 9px;border:1px solid #2c3e4c;border-radius:8px;background:#0d151d;color:#bdcad5;font-size:11px;line-height:1.35}.racknote{position:absolute;right:24px;bottom:20px;padding:8px 10px;border:1px solid #60717e;border-radius:9px;background:#080d13d9;color:#d3dde5;font-size:10px;pointer-events:none}
</style>
<main class="stage"><canvas data-testid="family-c-canvas"></canvas><aside class="panel"><p class="eyebrow">NEXTGEN JV · GRAMMAR FAMILY C</p><h1>Take the damper. Fit it.</h1><div class="warn">INTERACTION SPIKE · NO PHYSICS CLAIM</div><p class="sub">The damper is a part in the world, not a relation button. Pick it from the rack, carry it, then drag either eye to attach, detach or reconnect.</p><div class="row"><span>selected</span><output data-testid="selected">none</output></div><div class="row"><span>parts</span><output data-testid="count">0</output></div><div class="row"><span>donor</span><output data-testid="donor">loading…</output></div><div class="buttons"><button data-testid="undo">Undo</button><button data-testid="delete" disabled>Delete part</button><button data-testid="clear">Clear</button></div><div class="status" data-testid="status">Loading real Asset_Dumper…</div><p class="hint">Empty-space drag orbits. Selected eyes are visible. Release an eye away from a mount to detach it. Weird finite placements are allowed.</p></aside><div class="racknote">PART RACK · real damper on the illuminated stand</div></main>`;

const canvas = app.querySelector("[data-testid='family-c-canvas']");
const selectedOut = app.querySelector("[data-testid='selected']");
const countOut = app.querySelector("[data-testid='count']");
const donorOut = app.querySelector("[data-testid='donor']");
const statusOut = app.querySelector("[data-testid='status']");
const undoBtn = app.querySelector("[data-testid='undo']");
const deleteBtn = app.querySelector("[data-testid='delete']");
const clearBtn = app.querySelector("[data-testid='clear']");

const sockets = [
  {id:"c-upper",group:"c",p:new THREE.Vector3(-.52,.39,0)},
  {id:"c-mid",group:"c",p:new THREE.Vector3(-.52,.04,0)},
  {id:"c-lower",group:"c",p:new THREE.Vector3(-.52,-.34,0)},
  {id:"h-upper",group:"h",p:new THREE.Vector3(.72,.27,0)},
  {id:"h-mid",group:"h",p:new THREE.Vector3(.72,0,0)},
  {id:"h-lower",group:"h",p:new THREE.Vector3(.72,-.27,0)},
];
let parts=[], history=[], selectedId=null, nextId=1, donorTemplate=null, donorReady=false, renderCount=0;

const renderer=new THREE.WebGLRenderer({canvas,antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.shadowMap.enabled=true;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x080c11);
const camera=new THREE.PerspectiveCamera(43,1,.02,30); camera.position.set(2.55,1.28,3.3);
const orbit=new OrbitControls(camera,canvas); orbit.target.set(.05,-.02,0); orbit.enableDamping=false; orbit.update();
scene.add(new THREE.HemisphereLight(0xcbdbe8,0x182028,1.7)); const key=new THREE.DirectionalLight(0xffffff,2.8); key.position.set(3,4.2,3.3); scene.add(key);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshStandardMaterial({color:0x0e151c,roughness:.95})); floor.rotation.x=-Math.PI/2; floor.position.y=-.73; scene.add(floor); const grid=new THREE.GridHelper(6,24,0x415466,0x1e2933); grid.position.y=-.725; scene.add(grid);
const chassis=new THREE.Mesh(new THREE.BoxGeometry(.34,1.16,.62),new THREE.MeshStandardMaterial({color:0x35414c})); chassis.position.set(-.68,.02,0); scene.add(chassis);
const hub=new THREE.Mesh(new THREE.BoxGeometry(.22,.62,.45),new THREE.MeshStandardMaterial({color:0x586977})); hub.position.set(.83,0,0); scene.add(hub);
const wheel=new THREE.Mesh(new THREE.TorusGeometry(.38,.078,14,40),new THREE.MeshStandardMaterial({color:0x202a33})); wheel.rotation.y=Math.PI/2; wheel.position.set(1.03,0,0); scene.add(wheel);
for(const s of sockets){const m=new THREE.Mesh(new THREE.SphereGeometry(.047,18,12),new THREE.MeshStandardMaterial({color:s.group==="c"?0x62dcea:0xe7a052,emissive:s.group==="c"?0x153a42:0x442716,emissiveIntensity:.4}));m.position.copy(s.p);scene.add(m)}

function segment(o,a,b){const d=b.clone().sub(a),l=d.length();if(l<1e-6){o.visible=false;return}o.visible=true;o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());o.scale.set(1,l,1)}
function cylinder(r,c){return new THREE.Mesh(new THREE.CylinderGeometry(r,r,1,14),new THREE.MeshStandardMaterial({color:c,roughness:.42,metalness:.25}))}
const rack=new THREE.Group(); rack.position.set(.05,-.51,.90); scene.add(rack); const rackBase=new THREE.Mesh(new THREE.BoxGeometry(1.05,.1,.5),new THREE.MeshStandardMaterial({color:0x3b4b57,emissive:0x17222a,emissiveIntensity:.35})); rack.add(rackBase); const rackA=new THREE.Vector3(-.25,.18,0),rackB=new THREE.Vector3(.25,.18,0); const rackPicker=cylinder(.10,0x202a33); rackPicker.material.transparent=true; rackPicker.material.opacity=.03; rackPicker.userData.rack=true; segment(rackPicker,rackA,rackB); rack.add(rackPicker); let rackDonor=null;

const visuals=new Map();
function save(){return {parts:parts.map(p=>({id:p.id,a:[...p.a.p],b:[...p.b.p],as:p.a.s,bs:p.b.s})),selectedId}}
function restore(h){parts=h.parts.map(p=>({id:p.id,a:{p:new THREE.Vector3(...p.a),s:p.as},b:{p:new THREE.Vector3(...p.b),s:p.bs}}));selectedId=h.selectedId&&parts.some(p=>p.id===h.selectedId)?h.selectedId:null;sync();refresh();render()}
function push(){history.push(save());if(history.length>32)history.shift()}
function makeVisual(p){const root=cloneSkeleton(donorTemplate);const scaled=bindRep4DamperDonorAtPhysicalRestLength(root,.5);scene.add(root);const picker=cylinder(.085,0x1b2630);picker.material.transparent=true;picker.material.opacity=.015;picker.userData.partId=p.id;scene.add(picker);const a=new THREE.Mesh(new THREE.SphereGeometry(.057,18,12),new THREE.MeshStandardMaterial({color:0xf2ce65,emissive:0x574411,emissiveIntensity:.5}));const b=new THREE.Mesh(new THREE.SphereGeometry(.057,18,12),new THREE.MeshStandardMaterial({color:0x84d8ff,emissive:0x17435d,emissiveIntensity:.5}));a.userData={partId:p.id,end:"a"};b.userData={partId:p.id,end:"b"};scene.add(a,b);return{root,binding:scaled.binding,picker,a,b}}
function sync(){const live=new Set(parts.map(p=>p.id));for(const[id,v]of visuals){if(!live.has(id)){scene.remove(v.root,v.picker,v.a,v.b);visuals.delete(id)}}for(const p of parts){let v=visuals.get(p.id);if(!v){v=makeVisual(p);visuals.set(p.id,v)}applyC1DamperBetween(v.binding,p.a.p,p.b.p);segment(v.picker,p.a.p,p.b.p);v.a.position.copy(p.a.p);v.b.position.copy(p.b.p);const sel=p.id===selectedId;v.a.visible=sel;v.b.visible=sel}}
function part(id){return parts.find(p=>p.id===id)}
function snap(end){let best=null,dist=.20;for(const s of sockets){const d=end.p.distanceTo(s.p);if(d<dist){best=s;dist=d}}end.s=best?.id??null;if(best)end.p.copy(best.p)}
function refresh(){const p=selectedId?part(selectedId):null;selectedOut.textContent=p?`damper · A ${p.a.s??"free"} · B ${p.b.s??"free"}`:"none";countOut.textContent=String(parts.length);donorOut.textContent=donorReady?"READY · Asset_Dumper":"loading…";undoBtn.disabled=!history.length;deleteBtn.disabled=!p;publish()}
function status(t){statusOut.textContent=t}
function undo(){const h=history.pop();if(h){restore(h);status("Undo restored the part and kept working selection where possible.")}}
function remove(){if(!selectedId)return;push();parts=parts.filter(p=>p.id!==selectedId);selectedId=null;sync();refresh();render();status("Part removed. Undo is available.")}
function clear(){push();parts=[];selectedId=null;sync();refresh();render();status("Bench cleared. Take another damper from the rack.")}
undoBtn.onclick=undo;deleteBtn.onclick=remove;clearBtn.onclick=clear;

const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);let drag=null;
function ndcAt(x,y){const r=canvas.getBoundingClientRect();ndc.x=((x-r.left)/r.width)*2-1;ndc.y=-((y-r.top)/r.height)*2+1}
function world(x,y){ndcAt(x,y);ray.setFromCamera(ndc,camera);return ray.ray.intersectPlane(plane,new THREE.Vector3())??new THREE.Vector3()}
function hit(x,y,objects){ndcAt(x,y);ray.setFromCamera(ndc,camera);return ray.intersectObjects(objects,true)[0]??null}
function begin(e,pid,mode,end=null){drag={pointerId:e.pointerId,pid,mode,end,last:world(e.clientX,e.clientY)};orbit.enabled=false;canvas.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation()}
function spawn(at){push();const p={id:`damper-${nextId++}`,a:{p:at.clone().add(new THREE.Vector3(0,.25,0)),s:null},b:{p:at.clone().add(new THREE.Vector3(0,-.25,0)),s:null}};parts.push(p);selectedId=p.id;sync();refresh();render();return p}
canvas.addEventListener("pointerdown",e=>{const hh=hit(e.clientX,e.clientY,[...visuals.values()].flatMap(v=>[v.a,v.b]));if(hh?.object.userData.end){const id=hh.object.userData.partId,end=hh.object.userData.end;push();const p=part(id);p[end].s=null;selectedId=id;begin(e,id,"end",end);status(`Moving ${end.toUpperCase()} eye. Release near a mount to attach; elsewhere to detach.`);return}const rh=hit(e.clientX,e.clientY,[rackPicker]);if(rh?.object.userData.rack){if(!donorReady){status("Damper is still loading.");return}const p=spawn(world(e.clientX,e.clientY));begin(e,p.id,"carry");status("Damper in hand. Carry the part, then fit its eyes.");return}const bh=hit(e.clientX,e.clientY,[...visuals.values()].map(v=>v.picker));const id=bh?.object.userData.partId;if(id){selectedId=id;sync();refresh();render();const p=part(id);if(!p.a.s&&!p.b.s){push();begin(e,id,"carry");status("Moving the free damper as one object.")}else{status("Damper selected. Drag either visible eye to detach or reconnect it.");e.preventDefault();e.stopPropagation()}return}selectedId=null;sync();refresh();render()});
canvas.addEventListener("pointermove",e=>{if(!drag||drag.pointerId!==e.pointerId)return;const p=part(drag.pid),w=world(e.clientX,e.clientY);if(drag.mode==="carry"){const d=w.clone().sub(drag.last);p.a.p.add(d);p.b.p.add(d);p.a.s=p.b.s=null}else{p[drag.end].p.copy(w);p[drag.end].s=null}drag.last.copy(w);sync();refresh();render()});
function finish(e){if(!drag||drag.pointerId!==e.pointerId)return;const p=part(drag.pid);if(drag.mode==="carry"){const da=Math.min(...sockets.map(s=>p.a.p.distanceTo(s.p))),db=Math.min(...sockets.map(s=>p.b.p.distanceTo(s.p)));snap(da<=db?p.a:p.b)}else snap(p[drag.end]);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);orbit.enabled=true;const n=[p.a.s,p.b.s].filter(Boolean).length;status(n===0?"Damper is free in space.":n===1?"One eye attached. Fit the free eye, or detach the attached one.":"Both eyes attached. Either eye can still be reconnected.");drag=null;sync();refresh();render()}
canvas.addEventListener("pointerup",finish);canvas.addEventListener("pointercancel",e=>{if(drag&&canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);drag=null;orbit.enabled=true;render()});

function client(p){const q=p.clone().project(camera),r=canvas.getBoundingClientRect();return{x:r.left+(q.x*.5+.5)*r.width,y:r.top+(-q.y*.5+.5)*r.height}}
function publish(){app.dataset.partCount=String(parts.length);app.dataset.selectedPart=selectedId??"none";app.dataset.donorReady=String(donorReady);app.dataset.parts=JSON.stringify(parts.map(p=>({id:p.id,aSocket:p.a.s,bSocket:p.b.s,a:[...p.a.p],b:[...p.b.p]})));app.dataset.canUndo=String(!!history.length)}
function evidence(){for(const s of sockets){const p=client(s.p),k=s.id.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());app.dataset[`${k}ScreenX`]=String(p.x);app.dataset[`${k}ScreenY`]=String(p.y)}const rp=client(rack.localToWorld(rackA.clone().add(rackB).multiplyScalar(.5)));app.dataset.rackDamperScreenX=String(rp.x);app.dataset.rackDamperScreenY=String(rp.y);const p=selectedId?part(selectedId):null;if(p){const a=client(p.a.p),b=client(p.b.p);app.dataset.selectedAScreenX=String(a.x);app.dataset.selectedAScreenY=String(a.y);app.dataset.selectedBScreenX=String(b.x);app.dataset.selectedBScreenY=String(b.y)}app.dataset.renderCount=String(renderCount)}
function render(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderCount++;renderer.render(scene,camera);evidence();publish()}
orbit.addEventListener("change",render);window.addEventListener("resize",render);
async function load(){try{const gltf=await new GLTFLoader().loadAsync(DONOR_URL);donorTemplate=gltf.scene;donorReady=true;rackDonor=cloneSkeleton(donorTemplate);const scaled=bindRep4DamperDonorAtPhysicalRestLength(rackDonor,.5);applyC1DamperBetween(scaled.binding,rackA,rackB);rack.add(rackDonor);refresh();render();status("Ready. Take the real damper from the illuminated rack.")}catch(err){donorOut.textContent="ERROR";status(`Donor load failed: ${err instanceof Error?err.message:String(err)}`);render()}}
window.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undo()}else if((e.key==="Delete"||e.key==="Backspace")&&selectedId){e.preventDefault();remove()}});
refresh();render();void load();
