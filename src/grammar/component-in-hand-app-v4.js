import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { applyC1DamperBetween } from "../rep2/c1-damper-adapter.js";
import { bindRep4DamperDonorAtPhysicalRestLength } from "../rep4/stage-b-damper-visual.js";

const DONOR_URL = "/assets/rep2/Asset_Dumper.gltf";
const SNAP_RADIUS = 0.20;
const PREVIEW_RADIUS = 0.34;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const app = document.querySelector("#app");
if (!app) throw new Error("Family C V4 requires #app");

document.title = "JV Family C · Spatial Compass";
app.innerHTML = `
<style>
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#080c11;color:#edf3f8}.stage{position:relative;width:100vw;height:100vh}canvas{display:block;width:100%;height:100%;touch-action:none}.panel{position:absolute;top:16px;left:16px;width:326px;padding:13px 14px;border:1px solid #40515f;border-radius:12px;background:rgba(8,13,19,.91);backdrop-filter:blur(7px);box-shadow:0 14px 34px #0006}.eyebrow{margin:0 0 4px;color:#98adbd;font-size:10px;letter-spacing:.14em}h1{margin:0;font-size:21px}.warn{margin:8px 0;padding:7px 9px;border:1px solid #745a3d;border-radius:8px;color:#e8c491;background:#6646222e;font-size:10px;font-weight:700}.sub,.hint{font-size:11px;line-height:1.42;color:#a5b5c2}.hint{font-size:10px;color:#7f93a3}.row{display:grid;grid-template-columns:82px 1fr;gap:6px;padding:3px 0;font-size:10px;color:#8395a4}.row output{color:#e1e9ef}.buttons{display:flex;gap:6px;margin-top:9px}button{border:1px solid #506678;border-radius:8px;background:#131d27;color:#eaf2f8;padding:7px 9px;font:11px system-ui;cursor:pointer}button:disabled{opacity:.35}.status{margin-top:9px;min-height:48px;padding:8px 9px;border:1px solid #2c3e4c;border-radius:8px;background:#0d151d;color:#bdcad5;font-size:11px;line-height:1.35}.legend{display:flex;gap:10px;margin-top:8px;color:#95a7b5;font-size:9px}.legend b{font-weight:800}.span{color:#f0bc58}.lift{color:#60d9d0}.side{color:#b995ef}.racknote{position:absolute;right:24px;bottom:20px;padding:8px 10px;border:1px solid #60717e;border-radius:9px;background:#080d13d9;color:#d3dde5;font-size:10px;pointer-events:none}
</style>
<main class="stage"><canvas data-testid="family-c-canvas"></canvas><aside class="panel"><p class="eyebrow">NEXTGEN JV · FAMILY C · SPATIAL COMPASS V0</p><h1>Take it. Fit it. Rework it.</h1><div class="warn">INTERACTION SPIKE · NO PHYSICS CLAIM</div><p class="sub">A damper is still a part in the world. Direct eye drag now follows the current view instead of a hidden world plane. Select a part to expose one tiny mechanism-aware compass.</p><div class="row"><span>selected</span><output data-testid="selected">none</output></div><div class="row"><span>active eye</span><output data-testid="active-end">—</output></div><div class="row"><span>parts</span><output data-testid="count">0</output></div><div class="row"><span>donor</span><output data-testid="donor">loading…</output></div><div class="legend"><b class="span">SPAN</b><span>along part</span><b class="lift">LIFT</b><span>up-plane</span><b class="side">SIDE</b><span>lateral</span></div><div class="buttons"><button data-testid="undo">Undo</button><button data-testid="delete" disabled>Delete part</button><button data-testid="clear">Clear</button></div><div class="status" data-testid="status">Loading real Asset_Dumper…</div><p class="hint">Drag an eye itself = free movement in the current view. Small petals = constrained movement in the part's local mechanical frame. Empty-space drag orbits. A pale halo previews a compatible mount; snap commits only on release. Weird finite placements remain allowed.</p></aside><div class="racknote">PART RACK · real Asset_Dumper</div></main>`;

const canvas = app.querySelector("[data-testid='family-c-canvas']");
const selectedOut = app.querySelector("[data-testid='selected']");
const activeOut = app.querySelector("[data-testid='active-end']");
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
let parts=[], history=[], selectedId=null, activeEnd="a", nextId=1, donorTemplate=null, donorReady=false, renderCount=0, previewSocket=null;

const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x080c11);
const camera=new THREE.PerspectiveCamera(43,1,.02,30);camera.position.set(2.55,1.28,3.3);
const orbit=new OrbitControls(camera,canvas);orbit.target.set(.05,-.02,0);orbit.enableDamping=false;orbit.minDistance=1.35;orbit.maxDistance=7;orbit.update();
scene.add(new THREE.HemisphereLight(0xcbdbe8,0x182028,1.7));const key=new THREE.DirectionalLight(0xffffff,2.8);key.position.set(3,4.2,3.3);scene.add(key);const rim=new THREE.DirectionalLight(0x84b5d8,1.0);rim.position.set(-2,1.2,-3);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshStandardMaterial({color:0x0e151c,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-.73;scene.add(floor);const grid=new THREE.GridHelper(6,24,0x415466,0x1e2933);grid.position.y=-.725;scene.add(grid);
const chassis=new THREE.Mesh(new THREE.BoxGeometry(.34,1.16,.62),new THREE.MeshStandardMaterial({color:0x35414c,roughness:.5,metalness:.25}));chassis.position.set(-.68,.02,0);scene.add(chassis);
const hub=new THREE.Mesh(new THREE.BoxGeometry(.22,.62,.45),new THREE.MeshStandardMaterial({color:0x586977,roughness:.42,metalness:.32}));hub.position.set(.83,0,0);scene.add(hub);
const wheel=new THREE.Mesh(new THREE.TorusGeometry(.38,.078,14,40),new THREE.MeshStandardMaterial({color:0x202a33,roughness:.72}));wheel.rotation.y=Math.PI/2;wheel.position.set(1.03,0,0);scene.add(wheel);
const socketMeshes=[];
for(const s of sockets){const m=new THREE.Mesh(new THREE.SphereGeometry(.047,18,12),new THREE.MeshStandardMaterial({color:s.group==="c"?0x62dcea:0xe7a052,emissive:s.group==="c"?0x153a42:0x442716,emissiveIntensity:.4}));m.position.copy(s.p);m.userData.socketId=s.id;scene.add(m);socketMeshes.push(m)}

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function segment(o,a,b){const d=b.clone().sub(a),l=d.length();if(l<1e-6){o.visible=false;return}o.visible=true;o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());o.scale.set(1,l,1)}
function cylinder(r,c,opacity=1){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1,14),new THREE.MeshStandardMaterial({color:c,roughness:.42,metalness:.2,transparent:opacity<1,opacity,depthWrite:opacity>.4}));return m}
function sameSocket(id){return sockets.find(s=>s.id===id)??null}
function nearestSocket(pos,radius=PREVIEW_RADIUS){let best=null,dist=radius;for(const s of sockets){const d=pos.distanceTo(s.p);if(d<dist){best=s;dist=d}}return best}

const rack=new THREE.Group();rack.position.set(.05,-.51,.90);scene.add(rack);const rackBase=new THREE.Mesh(new THREE.BoxGeometry(1.05,.1,.5),new THREE.MeshStandardMaterial({color:0x3b4b57,emissive:0x17222a,emissiveIntensity:.35}));rack.add(rackBase);const rackA=new THREE.Vector3(-.25,.18,0),rackB=new THREE.Vector3(.25,.18,0);const rackPicker=cylinder(.10,0x202a33,.03);rackPicker.userData.rack=true;segment(rackPicker,rackA,rackB);rack.add(rackPicker);let rackDonor=null;

const snapHalo=new THREE.Mesh(new THREE.SphereGeometry(.088,20,14),new THREE.MeshBasicMaterial({color:0xd9f4ff,transparent:true,opacity:.38,wireframe:true,depthWrite:false}));snapHalo.visible=false;scene.add(snapHalo);const snapLine=cylinder(.009,0xd9f4ff,.35);snapLine.visible=false;scene.add(snapLine);

const gizmo={root:new THREE.Group(),handles:{},stems:{}};scene.add(gizmo.root);gizmo.root.visible=false;
for(const [name,color] of [["span",0xf0bc58],["lift",0x60d9d0],["side",0xb995ef]]){const stem=cylinder(.008,color,.72);const handle=new THREE.Mesh(new THREE.SphereGeometry(.045,16,10),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.16,roughness:.38}));handle.userData.gizmoAxis=name;gizmo.root.add(stem,handle);gizmo.stems[name]=stem;gizmo.handles[name]=handle}

const visuals=new Map();
function save(){return{parts:parts.map(p=>({id:p.id,a:[...p.a.p],b:[...p.b.p],as:p.a.s,bs:p.b.s})),selectedId,activeEnd}}
function restore(h){parts=h.parts.map(p=>({id:p.id,a:{p:new THREE.Vector3(...p.a),s:p.as},b:{p:new THREE.Vector3(...p.b),s:p.bs}}));selectedId=h.selectedId&&parts.some(p=>p.id===h.selectedId)?h.selectedId:null;activeEnd=h.activeEnd??"a";previewSocket=null;sync();refresh();render()}
function push(){history.push(save());if(history.length>32)history.shift()}
function makeVisual(p){const root=cloneSkeleton(donorTemplate);const scaled=bindRep4DamperDonorAtPhysicalRestLength(root,.5);scene.add(root);const picker=cylinder(.085,0x1b2630,.015);picker.userData.partId=p.id;scene.add(picker);const beam=cylinder(.018,0xe7eef4,.20);beam.visible=false;scene.add(beam);const a=new THREE.Mesh(new THREE.SphereGeometry(.057,18,12),new THREE.MeshStandardMaterial({color:0xf2ce65,emissive:0x574411,emissiveIntensity:.5}));const b=new THREE.Mesh(new THREE.SphereGeometry(.057,18,12),new THREE.MeshStandardMaterial({color:0x84d8ff,emissive:0x17435d,emissiveIntensity:.5}));a.userData={partId:p.id,end:"a"};b.userData={partId:p.id,end:"b"};scene.add(a,b);return{root,binding:scaled.binding,picker,beam,a,b}}
function part(id){return parts.find(p=>p.id===id)??null}
function chosenEnd(p){if(!p)return"a";if(activeEnd==="a"||activeEnd==="b")return activeEnd;return!p.a.s?"a":"b"}
function sync(){const live=new Set(parts.map(p=>p.id));for(const[id,v]of visuals){if(!live.has(id)){scene.remove(v.root,v.picker,v.beam,v.a,v.b);visuals.delete(id)}}for(const p of parts){let v=visuals.get(p.id);if(!v){v=makeVisual(p);visuals.set(p.id,v)}applyC1DamperBetween(v.binding,p.a.p,p.b.p);segment(v.picker,p.a.p,p.b.p);segment(v.beam,p.a.p,p.b.p);v.a.position.copy(p.a.p);v.b.position.copy(p.b.p);const sel=p.id===selectedId;v.a.visible=sel;v.b.visible=sel;v.beam.visible=sel}}
function componentFrame(p,end){const origin=p[end].p,other=p[end==="a"?"b":"a"].p;const span=origin.clone().sub(other);if(span.lengthSq()<1e-8)span.set(1,0,0);span.normalize();let lift=WORLD_UP.clone().addScaledVector(span,-WORLD_UP.dot(span));if(lift.lengthSq()<.02){const camUp=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);lift=camUp.addScaledVector(span,-camUp.dot(span))}if(lift.lengthSq()<1e-8)lift.set(0,0,1);lift.normalize();let side=new THREE.Vector3().crossVectors(span,lift);if(side.lengthSq()<1e-8)side=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);side.normalize();return{origin:origin.clone(),span,lift,side}}
function updateGizmo(){const p=selectedId?part(selectedId):null;if(!p){gizmo.root.visible=false;return}const end=chosenEnd(p);activeEnd=end;const frame=componentFrame(p,end);const radius=clamp(camera.position.distanceTo(frame.origin)*.055,.14,.25);gizmo.root.visible=true;for(const name of["span","lift","side"]){const axis=frame[name],tip=frame.origin.clone().addScaledVector(axis,radius);const stem=gizmo.stems[name],handle=gizmo.handles[name];segment(stem,frame.origin,tip);handle.position.copy(tip);handle.scale.setScalar(clamp(radius/.18,.82,1.3))}}
function updatePreview(anchorPos){previewSocket=nearestSocket(anchorPos);if(!previewSocket){snapHalo.visible=false;snapLine.visible=false;return}snapHalo.visible=true;snapHalo.position.copy(previewSocket.p);snapLine.visible=true;segment(snapLine,anchorPos,previewSocket.p)}
function clearPreview(){previewSocket=null;snapHalo.visible=false;snapLine.visible=false}
function snap(end){const best=nearestSocket(end.p,SNAP_RADIUS);end.s=best?.id??null;if(best)end.p.copy(best.p);return best}
function refresh(){const p=selectedId?part(selectedId):null;selectedOut.textContent=p?`damper · A ${p.a.s??"free"} · B ${p.b.s??"free"}`:"none";activeOut.textContent=p?chosenEnd(p).toUpperCase():"—";countOut.textContent=String(parts.length);donorOut.textContent=donorReady?"READY · Asset_Dumper":"loading…";undoBtn.disabled=!history.length;deleteBtn.disabled=!p;publish()}
function status(t){statusOut.textContent=t}
function undo(){const h=history.pop();if(h){restore(h);status("Undo restored the previous assembly state.")}}
function remove(){if(!selectedId)return;push();parts=parts.filter(p=>p.id!==selectedId);selectedId=null;clearPreview();sync();refresh();render();status("Part removed. Undo is available.")}
function clear(){push();parts=[];selectedId=null;clearPreview();sync();refresh();render();status("Bench cleared. Take another damper from the rack.")}
undoBtn.onclick=undo;deleteBtn.onclick=remove;clearBtn.onclick=clear;

const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let drag=null;
function ndcAt(x,y){const r=canvas.getBoundingClientRect();ndc.x=((x-r.left)/r.width)*2-1;ndc.y=-((y-r.top)/r.height)*2+1}
function hit(x,y,objects){ndcAt(x,y);ray.setFromCamera(ndc,camera);return ray.intersectObjects(objects,true)[0]??null}
function viewPlane(point){const normal=new THREE.Vector3();camera.getWorldDirection(normal);return new THREE.Plane().setFromNormalAndCoplanarPoint(normal.normalize(),point)}
function pointOnPlane(x,y,plane,fallback){ndcAt(x,y);ray.setFromCamera(ndc,camera);return ray.ray.intersectPlane(plane,new THREE.Vector3())??fallback.clone()}
function client(p){const q=p.clone().project(camera),r=canvas.getBoundingClientRect();return{x:r.left+(q.x*.5+.5)*r.width,y:r.top+(-q.y*.5+.5)*r.height}}
function axisScreen(origin,axis){const a=client(origin),b=client(origin.clone().add(axis));const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);return{ux:len>1e-6?dx/len:0,uy:len>1e-6?dy/len:-1,pixelsPerUnit:len}}
function beginDirect(e,pid,end){const p=part(pid);if(!p)return;push();activeEnd=end;p[end].s=null;const start=p[end].p.clone();drag={pointerId:e.pointerId,pid,end,mode:"direct",plane:viewPlane(start),start,startPointer:{x:e.clientX,y:e.clientY}};orbit.enabled=false;canvas.setPointerCapture(e.pointerId);updatePreview(start);refresh();render();e.preventDefault();e.stopPropagation();status(`Eye ${end.toUpperCase()} · direct view-plane move. Release near a pale mount halo to snap.`)}
function beginAxis(e,pid,end,axisName){const p=part(pid);if(!p)return;push();activeEnd=end;p[end].s=null;const frame=componentFrame(p,end),axis=frame[axisName].clone(),screen=axisScreen(frame.origin,axis);drag={pointerId:e.pointerId,pid,end,mode:"axis",axisName,axis,start:p[end].p.clone(),startPointer:{x:e.clientX,y:e.clientY},screen};orbit.enabled=false;canvas.setPointerCapture(e.pointerId);updatePreview(p[end].p);refresh();render();e.preventDefault();e.stopPropagation();status(`${axisName.toUpperCase()} · constrained in the damper's semantic frame. Release commits placement/snap.`)}
function beginCarry(e,pid){const p=part(pid);if(!p)return;push();p.a.s=p.b.s=null;const mid=p.a.p.clone().add(p.b.p).multiplyScalar(.5),plane=viewPlane(mid),grab=pointOnPlane(e.clientX,e.clientY,plane,mid);drag={pointerId:e.pointerId,pid,mode:"carry",plane,startPointer:{x:e.clientX,y:e.clientY},last:grab,startA:p.a.p.clone(),startB:p.b.p.clone()};orbit.enabled=false;canvas.setPointerCapture(e.pointerId);clearPreview();render();e.preventDefault();e.stopPropagation();status("Whole free damper in hand · current-view plane. Release may attach the nearer eye.")}
function spawn(at){push();const p={id:`damper-${nextId++}`,a:{p:at.clone().add(new THREE.Vector3(0,.25,0)),s:null},b:{p:at.clone().add(new THREE.Vector3(0,-.25,0)),s:null}};parts.push(p);selectedId=p.id;activeEnd="a";sync();refresh();render();return p}
function selectPart(id){selectedId=id;const p=part(id);if(p){activeEnd=!p.a.s?"a":!p.b.s?"b":"a"}sync();refresh();render()}

canvas.addEventListener("pointerdown",e=>{if(e.button!==0)return;const gh=hit(e.clientX,e.clientY,Object.values(gizmo.handles));if(gh?.object.userData.gizmoAxis&&selectedId){beginAxis(e,selectedId,chosenEnd(part(selectedId)),gh.object.userData.gizmoAxis);return}const hh=hit(e.clientX,e.clientY,[...visuals.values()].flatMap(v=>[v.a,v.b]));if(hh?.object.userData.end){const id=hh.object.userData.partId,end=hh.object.userData.end;selectedId=id;beginDirect(e,id,end);return}const rh=hit(e.clientX,e.clientY,[rackPicker]);if(rh?.object.userData.rack){if(!donorReady){status("Damper is still loading.");return}const rackMid=rack.localToWorld(rackA.clone().add(rackB).multiplyScalar(.5)),plane=viewPlane(rackMid),at=pointOnPlane(e.clientX,e.clientY,plane,rackMid);const p=spawn(at);beginCarry(e,p.id);return}const bh=hit(e.clientX,e.clientY,[...visuals.values()].map(v=>v.picker));const id=bh?.object.userData.partId;if(id){selectPart(id);const p=part(id);if(!p.a.s&&!p.b.s)beginCarry(e,id);else{status("Damper selected. Drag either eye directly, or use its SPAN / LIFT / SIDE compass petals.");e.preventDefault();e.stopPropagation()}return}
// Empty-space LMB deliberately remains owned by OrbitControls. Selection persists while orbiting.
});

canvas.addEventListener("pointermove",e=>{if(!drag||drag.pointerId!==e.pointerId)return;const p=part(drag.pid);if(!p)return;if(drag.mode==="carry"){const w=pointOnPlane(e.clientX,e.clientY,drag.plane,drag.last),d=w.clone().sub(drag.last);p.a.p.add(d);p.b.p.add(d);drag.last.copy(w)}else if(drag.mode==="direct"){p[drag.end].p.copy(pointOnPlane(e.clientX,e.clientY,drag.plane,drag.start));updatePreview(p[drag.end].p)}else{const dx=e.clientX-drag.startPointer.x,dy=e.clientY-drag.startPointer.y;const projected=dx*drag.screen.ux+dy*drag.screen.uy;let scalar;if(drag.screen.pixelsPerUnit>8)scalar=projected/drag.screen.pixelsPerUnit;else scalar=-dy/180;p[drag.end].p.copy(drag.start).addScaledVector(drag.axis,scalar);updatePreview(p[drag.end].p)}sync();refresh();render()});

function finish(e){if(!drag||drag.pointerId!==e.pointerId)return;const p=part(drag.pid);let snapped=null;if(p){if(drag.mode==="carry"){const da=Math.min(...sockets.map(s=>p.a.p.distanceTo(s.p))),db=Math.min(...sockets.map(s=>p.b.p.distanceTo(s.p)));snapped=snap(da<=db?p.a:p.b)}else snapped=snap(p[drag.end])}if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);orbit.enabled=true;drag=null;clearPreview();if(p){const n=[p.a.s,p.b.s].filter(Boolean).length;status(snapped?`Snapped to ${snapped.id}. ${n===2?"Both eyes attached; topology remains editable.":"One eye attached; keep fitting or repositioning."}`:n===0?"Part is free in space.":"Placement kept unsnapped. One eye remains attached.")}sync();refresh();render()}
canvas.addEventListener("pointerup",finish);canvas.addEventListener("pointercancel",e=>{if(drag&&canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);drag=null;orbit.enabled=true;clearPreview();render()});

function publish(){app.dataset.partCount=String(parts.length);app.dataset.selectedPart=selectedId??"none";app.dataset.activeEnd=selectedId?activeEnd:"none";app.dataset.donorReady=String(donorReady);app.dataset.previewSocket=previewSocket?.id??"none";app.dataset.parts=JSON.stringify(parts.map(p=>({id:p.id,aSocket:p.a.s,bSocket:p.b.s,a:[...p.a.p],b:[...p.b.p]})));app.dataset.canUndo=String(!!history.length);const f=new THREE.Vector3();camera.getWorldDirection(f);app.dataset.cameraForward=JSON.stringify([...f])}
function evidence(){for(const s of sockets){const p=client(s.p),k=s.id.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());app.dataset[`${k}ScreenX`]=String(p.x);app.dataset[`${k}ScreenY`]=String(p.y)}const rp=client(rack.localToWorld(rackA.clone().add(rackB).multiplyScalar(.5)));app.dataset.rackDamperScreenX=String(rp.x);app.dataset.rackDamperScreenY=String(rp.y);const p=selectedId?part(selectedId):null;if(p){const a=client(p.a.p),b=client(p.b.p);app.dataset.selectedAScreenX=String(a.x);app.dataset.selectedAScreenY=String(a.y);app.dataset.selectedBScreenX=String(b.x);app.dataset.selectedBScreenY=String(b.y);const end=chosenEnd(p),origin=p[end].p,oc=client(origin);app.dataset.activeEyeScreenX=String(oc.x);app.dataset.activeEyeScreenY=String(oc.y);for(const name of["span","lift","side"]){const c=client(gizmo.handles[name].getWorldPosition(new THREE.Vector3()));app.dataset[`gizmo${name[0].toUpperCase()+name.slice(1)}ScreenX`]=String(c.x);app.dataset[`gizmo${name[0].toUpperCase()+name.slice(1)}ScreenY`]=String(c.y)}}app.dataset.renderCount=String(renderCount)}
function render(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();updateGizmo();renderCount++;renderer.render(scene,camera);evidence();publish()}
orbit.addEventListener("change",render);window.addEventListener("resize",render);
async function load(){try{const gltf=await new GLTFLoader().loadAsync(DONOR_URL);donorTemplate=gltf.scene;donorReady=true;rackDonor=cloneSkeleton(donorTemplate);const scaled=bindRep4DamperDonorAtPhysicalRestLength(rackDonor,.5);applyC1DamperBetween(scaled.binding,rackA,rackB);rack.add(rackDonor);refresh();render();status("Ready. Take the real damper. Direct drag follows the view; the local compass is optional.")}catch(err){donorOut.textContent="ERROR";status(`Donor load failed: ${err instanceof Error?err.message:String(err)}`);render()}}
window.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undo()}else if((e.key==="Delete"||e.key==="Backspace")&&selectedId){e.preventDefault();remove()}});
refresh();render();void load();
