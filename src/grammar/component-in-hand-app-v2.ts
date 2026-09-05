import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { applyC1DamperBetween, type C1DamperBinding } from "../rep2/c1-damper-adapter.js";
import { bindRep4DamperDonorAtPhysicalRestLength } from "../rep4/stage-b-damper-visual.js";

const DONOR_URL = "/assets/rep2/Asset_Dumper.gltf";
const DONOR_REFERENCE_LENGTH = 0.5;
const SNAP_RADIUS = 0.20;

type EndName = "a" | "b";
interface SocketDef { readonly id: string; readonly label: string; readonly position: THREE.Vector3; readonly group: "chassis" | "hub"; }
interface EndState { position: THREE.Vector3; socketId: string | null; }
interface PartState { readonly id: string; a: EndState; b: EndState; }
interface SavedPart { readonly id: string; readonly a: readonly [number, number, number]; readonly b: readonly [number, number, number]; readonly aSocket: string | null; readonly bSocket: string | null; }
interface HistoryEntry { readonly parts: SavedPart[]; readonly selectedId: string | null; }
interface PartVisual { readonly root: THREE.Object3D; readonly binding: C1DamperBinding; readonly picker: THREE.Mesh; readonly a: THREE.Mesh; readonly b: THREE.Mesh; }

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Family C V2 requires #app.");
document.title = "JV Family C · Component in Hand";
app.innerHTML = `
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#080c11;color:#edf3f8}.stage{position:relative;width:100vw;height:100vh}canvas{width:100%;height:100%;display:block;touch-action:none}.panel{position:absolute;top:16px;left:16px;width:318px;padding:13px 14px;border:1px solid #40515f;border-radius:12px;background:rgba(8,13,19,.91);backdrop-filter:blur(7px);box-shadow:0 14px 34px rgba(0,0,0,.34)}.eyebrow{margin:0 0 4px;color:#98adbd;font-size:10px;letter-spacing:.14em;text-transform:uppercase}h1{margin:0;font-size:21px}.warning{margin:8px 0;padding:7px 9px;border:1px solid #745a3d;border-radius:8px;color:#e8c491;background:rgba(102,70,34,.18);font-size:10px;font-weight:700}.sub{margin:7px 0 9px;color:#a5b5c2;font-size:11px;line-height:1.42}.row{display:grid;grid-template-columns:82px 1fr;gap:6px;padding:3px 0;color:#8395a4;font-size:10px}.row output{color:#e1e9ef}.buttons{display:flex;gap:6px;margin-top:9px}button{border:1px solid #506678;border-radius:8px;background:#131d27;color:#eaf2f8;padding:7px 9px;font:11px/1.15 inherit;cursor:pointer}button:disabled{opacity:.38;cursor:default}.status{margin-top:9px;min-height:44px;padding:8px 9px;border:1px solid #2c3e4c;border-radius:8px;background:#0d151d;color:#bdcad5;font-size:11px;line-height:1.35}.hint{margin:9px 0 0;color:#7f93a3;font-size:10px;line-height:1.4}.rack-note{position:absolute;right:24px;bottom:20px;padding:8px 10px;border:1px solid #60717e;border-radius:9px;background:rgba(8,13,19,.82);color:#d3dde5;font-size:10px;pointer-events:none}
</style>
<main class="stage">
<canvas data-testid="family-c-canvas"></canvas>
<aside class="panel"><p class="eyebrow">NEXTGEN JV · GRAMMAR FAMILY C</p><h1>Take the damper. Fit it.</h1><div class="warning">INTERACTION SPIKE · NO PHYSICS CLAIM</div><p class="sub">The damper is a part in the world, not a relation button. Pick it from the rack, carry it, then drag either eye to attach, detach or reconnect.</p><div class="row"><span>selected</span><output data-testid="selected">none</output></div><div class="row"><span>parts</span><output data-testid="count">0</output></div><div class="row"><span>donor</span><output data-testid="donor">loading…</output></div><div class="buttons"><button data-testid="undo">Undo</button><button data-testid="delete" disabled>Delete part</button><button data-testid="clear">Clear</button></div><div class="status" data-testid="status">Loading real Asset_Dumper…</div><p class="hint">Empty-space drag orbits. Selected eyes are yellow/cyan. Release an eye away from a mount to detach it. Weird finite placements are allowed.</p></aside>
<div class="rack-note">PART RACK · the real damper is on the illuminated stand in front of the vehicle</div>
</main>`;

function req<T extends Element>(selector: string): T { const value = app.querySelector<T>(selector); if (!value) throw new Error(`Missing ${selector}`); return value; }
const canvas = req<HTMLCanvasElement>("[data-testid='family-c-canvas']");
const selectedOut = req<HTMLOutputElement>("[data-testid='selected']");
const countOut = req<HTMLOutputElement>("[data-testid='count']");
const donorOut = req<HTMLOutputElement>("[data-testid='donor']");
const statusOut = req<HTMLElement>("[data-testid='status']");
const undoButton = req<HTMLButtonElement>("[data-testid='undo']");
const deleteButton = req<HTMLButtonElement>("[data-testid='delete']");
const clearButton = req<HTMLButtonElement>("[data-testid='clear']");

const sockets: readonly SocketDef[] = Object.freeze([
  { id:"c-upper",label:"chassis upper",group:"chassis",position:new THREE.Vector3(-0.52,0.39,0) },
  { id:"c-mid",label:"chassis middle",group:"chassis",position:new THREE.Vector3(-0.52,0.04,0) },
  { id:"c-lower",label:"chassis lower",group:"chassis",position:new THREE.Vector3(-0.52,-0.34,0) },
  { id:"h-upper",label:"hub upper",group:"hub",position:new THREE.Vector3(0.72,0.27,0) },
  { id:"h-mid",label:"hub middle",group:"hub",position:new THREE.Vector3(0.72,0,0) },
  { id:"h-lower",label:"hub lower",group:"hub",position:new THREE.Vector3(0.72,-0.27,0) },
]);

let parts: PartState[]=[]; let history:HistoryEntry[]=[]; let selectedId:string|null=null; let nextId=1; let donorTemplate:THREE.Object3D|null=null; let donorReady=false; let renders=0;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.shadowMap.enabled=true;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x080c11);
const camera=new THREE.PerspectiveCamera(43,1,.02,30); camera.position.set(2.55,1.30,3.35);
const orbit=new OrbitControls(camera,canvas); orbit.target.set(.05,-.02,0); orbit.enableDamping=false; orbit.minDistance=1.4; orbit.maxDistance=7; orbit.update();
scene.add(new THREE.HemisphereLight(0xcbdbe8,0x182028,1.7)); const key=new THREE.DirectionalLight(0xffffff,2.8); key.position.set(3,4.2,3.3); key.castShadow=true; scene.add(key); const rim=new THREE.DirectionalLight(0x8dbbe0,1.15); rim.position.set(-2,1.4,-3); scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshStandardMaterial({color:0x0e151c,roughness:.95})); floor.rotation.x=-Math.PI/2; floor.position.y=-.73; floor.receiveShadow=true; scene.add(floor); const grid=new THREE.GridHelper(6,24,0x415466,0x1e2933); grid.position.y=-.725; scene.add(grid);
const chassis=new THREE.Mesh(new THREE.BoxGeometry(.34,1.16,.62),new THREE.MeshStandardMaterial({color:0x35414c,roughness:.5,metalness:.35})); chassis.position.set(-.68,.02,0); chassis.castShadow=true; scene.add(chassis);
const hub=new THREE.Mesh(new THREE.BoxGeometry(.22,.62,.45),new THREE.MeshStandardMaterial({color:0x586977,roughness:.4,metalness:.45})); hub.position.set(.83,0,0); hub.castShadow=true; scene.add(hub); const wheel=new THREE.Mesh(new THREE.TorusGeometry(.38,.078,14,40),new THREE.MeshStandardMaterial({color:0x202a33,roughness:.72})); wheel.rotation.y=Math.PI/2; wheel.position.set(1.03,0,0); wheel.castShadow=true; scene.add(wheel);
const socketMeshes:THREE.Mesh[]=[]; for(const s of sockets){const m=new THREE.Mesh(new THREE.SphereGeometry(.046,18,12),new THREE.MeshStandardMaterial({color:s.group==="chassis"?0x62dcea:0xe7a052,emissive:s.group==="chassis"?0x153a42:0x442716,emissiveIntensity:.35,roughness:.3}));m.position.copy(s.position);m.userData.socketId=s.id;m.castShadow=true;scene.add(m);socketMeshes.push(m)}

function setSegment(o:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3){const d=b.clone().sub(a),l=d.length();if(l<1e-7){o.visible=false;return}o.visible=true;o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());o.scale.set(1,l,1)}
function cyl(radius:number,color:number){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,16),new THREE.MeshStandardMaterial({color,roughness:.42,metalness:.28}));m.castShadow=true;return m}

// The rack is intentionally in front of the vehicle so its part is immediately discoverable.
const rack=new THREE.Group(); rack.position.set(.06,-.51,.92); scene.add(rack); const base=new THREE.Mesh(new THREE.BoxGeometry(1.08,.10,.52),new THREE.MeshStandardMaterial({color:0x31414d,emissive:0x101820,emissiveIntensity:.25,roughness:.55,metalness:.28}));rack.add(base); const rail1=cyl(.025,0x6b8496),rail2=cyl(.025,0x6b8496);setSegment(rail1,new THREE.Vector3(-.48,.08,-.18),new THREE.Vector3(.48,.08,-.18));setSegment(rail2,new THREE.Vector3(-.48,.08,.18),new THREE.Vector3(.48,.08,.18));rack.add(rail1,rail2);
const rackA=new THREE.Vector3(-.25,.18,0),rackB=new THREE.Vector3(.25,.18,0); const rackPicker=cyl(.09,0x202a33);(rackPicker.material as THREE.MeshStandardMaterial).transparent=true;(rackPicker.material as THREE.MeshStandardMaterial).opacity=.035;setSegment(rackPicker,rackA,rackB);rackPicker.userData.rack=true;rack.add(rackPicker);let rackDonor:THREE.Object3D|null=null;

const visuals=new Map<string,PartVisual>();
function findPart(id:string){const p=parts.find(v=>v.id===id);if(!p)throw new Error(`Missing part ${id}`);return p}
function makeVisual(p:PartState):PartVisual{if(!donorTemplate)throw new Error("Damper donor unavailable");const root=cloneSkeleton(donorTemplate);const scaled=bindRep4DamperDonorAtPhysicalRestLength(root,DONOR_REFERENCE_LENGTH);scene.add(root);const picker=cyl(.082,0x1c2630);(picker.material as THREE.MeshStandardMaterial).transparent=true;(picker.material as THREE.MeshStandardMaterial).opacity=.015;picker.userData.partId=p.id;scene.add(picker);const a=new THREE.Mesh(new THREE.SphereGeometry(.055,18,12),new THREE.MeshStandardMaterial({color:0xf2ce65,emissive:0x574411,emissiveIntensity:.48}));const b=new THREE.Mesh(new THREE.SphereGeometry(.055,18,12),new THREE.MeshStandardMaterial({color:0x84d8ff,emissive:0x17435d,emissiveIntensity:.48}));a.userData.partId=p.id;a.userData.end="a";b.userData.partId=p.id;b.userData.end="b";scene.add(a,b);return{root,binding:scaled.binding,picker,a,b}}
function syncVisual(p:PartState,v:PartVisual){applyC1DamperBetween(v.binding,p.a.position,p.b.position);setSegment(v.picker,p.a.position,p.b.position);v.a.position.copy(p.a.position);v.b.position.copy(p.b.position);const sel=p.id===selectedId;v.a.visible=sel;v.b.visible=sel;v.a.scale.setScalar(sel?1.28:.8);v.b.scale.setScalar(sel?1.28:.8)}
function syncAll(){const live=new Set(parts.map(p=>p.id));for(const[id,v]of visuals){if(!live.has(id)){scene.remove(v.root,v.picker,v.a,v.b);visuals.delete(id)}}for(const p of parts){let v=visuals.get(p.id);if(!v){v=makeVisual(p);visuals.set(p.id,v)}syncVisual(p,v)}}
function savePart(p:PartState):SavedPart{return{id:p.id,a:[p.a.position.x,p.a.position.y,p.a.position.z],b:[p.b.position.x,p.b.position.y,p.b.position.z],aSocket:p.a.socketId,bSocket:p.b.socketId}}
function snapshot():HistoryEntry{return{parts:parts.map(savePart),selectedId}}
function pushHistory(){history.push(snapshot());if(history.length>32)history.shift()}
function restore(h:HistoryEntry){parts=h.parts.map(p=>({id:p.id,a:{position:new THREE.Vector3(...p.a),socketId:p.aSocket},b:{position:new THREE.Vector3(...p.b),socketId:p.bSocket}}));selectedId=h.selectedId&&parts.some(p=>p.id===h.selectedId)?h.selectedId:null;syncAll();refresh();render()}
function socketById(id:string){const s=sockets.find(v=>v.id===id);if(!s)throw new Error(`Unknown socket ${id}`);return s}
function snap(e:EndState){let best:SocketDef|null=null,bestD=SNAP_RADIUS;for(const s of sockets){const d=e.position.distanceTo(s.position);if(d<bestD){best=s;bestD=d}}e.socketId=best?.id??null;if(best)e.position.copy(best.position)}
function setStatus(s:string){statusOut.textContent=s}
function refresh(){const p=selectedId?parts.find(v=>v.id===selectedId)??null:null;selectedOut.textContent=p?`damper · A ${p.a.socketId??"free"} · B ${p.b.socketId??"free"}`:"none";countOut.textContent=String(parts.length);donorOut.textContent=donorReady?"READY · Asset_Dumper":"loading…";undoButton.disabled=history.length===0;deleteButton.disabled=!p;publish()}
function undo(){const h=history.pop();if(!h)return;restore(h);setStatus("Undo restored the part and kept working selection where possible.")}
function removeSelected(){if(!selectedId)return;pushHistory();parts=parts.filter(p=>p.id!==selectedId);selectedId=null;syncAll();refresh();render();setStatus("Part removed. Undo is available.")}
function clear(){pushHistory();parts=[];selectedId=null;syncAll();refresh();render();setStatus("Bench cleared. Take another damper from the rack.")}
undoButton.addEventListener("click",undo);deleteButton.addEventListener("click",removeSelected);clearButton.addEventListener("click",clear);window.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undo()}else if((e.key==="Delete"||e.key==="Backspace")&&selectedId){e.preventDefault();removeSelected()}});

const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
function pointerNdc(x:number,y:number){const r=canvas.getBoundingClientRect();ndc.x=((x-r.left)/r.width)*2-1;ndc.y=-((y-r.top)/r.height)*2+1}
function world(x:number,y:number){pointerNdc(x,y);ray.setFromCamera(ndc,camera);const hit=new THREE.Vector3();return ray.ray.intersectPlane(plane,hit)??new THREE.Vector3()}
function hit(x:number,y:number,objects:THREE.Object3D[]){pointerNdc(x,y);ray.setFromCamera(ndc,camera);return ray.intersectObjects(objects,true)[0]??null}
interface Drag{pointerId:number;partId:string;mode:"carry"|"end";end:EndName|null;last:THREE.Vector3}let drag:Drag|null=null;
function begin(e:PointerEvent,partId:string,mode:Drag["mode"],end:EndName|null){drag={pointerId:e.pointerId,partId,mode,end,last:world(e.clientX,e.clientY)};orbit.enabled=false;canvas.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation()}
function spawn(at:THREE.Vector3){pushHistory();const p:PartState={id:`damper-${nextId++}`,a:{position:at.clone().add(new THREE.Vector3(0,.25,0)),socketId:null},b:{position:at.clone().add(new THREE.Vector3(0,-.25,0)),socketId:null}};parts=[...parts,p];selectedId=p.id;syncAll();refresh();render();return p}
canvas.addEventListener("pointerdown",e=>{const handles=[...visuals.values()].flatMap(v=>[v.a,v.b]);const hh=hit(e.clientX,e.clientY,handles);if(hh){const o=hh.object;const id=o.userData.partId as string|undefined,end=o.userData.end as EndName|undefined;if(id&&end){pushHistory();const p=findPart(id);p[end].socketId=null;selectedId=id;begin(e,id,"end",end);setStatus(`Moving ${end.toUpperCase()} eye. Release near a mount to attach; elsewhere to detach.`);return}}
const rh=hit(e.clientX,e.clientY,[rackPicker]);if(rh?.object.userData.rack){if(!donorReady){setStatus("Damper donor is still loading.");return}const p=spawn(world(e.clientX,e.clientY));begin(e,p.id,"carry",null);setStatus("Damper in hand. Move the part itself; release near a mount to catch the nearest eye.");return}
const bh=hit(e.clientX,e.clientY,[...visuals.values()].map(v=>v.picker));const id=bh?.object.userData.partId as string|undefined;if(id){selectedId=id;syncAll();refresh();render();const p=findPart(id);if(!p.a.socketId&&!p.b.socketId){pushHistory();begin(e,id,"carry",null);setStatus("Moving the free damper as one object.")}else{setStatus("Damper selected. Drag a visible eye to detach or reconnect it.");e.preventDefault();e.stopPropagation();}return}selectedId=null;syncAll();refresh();render()});
canvas.addEventListener("pointermove",e=>{if(!drag||drag.pointerId!==e.pointerId)return;const p=findPart(drag.partId),w=world(e.clientX,e.clientY);if(drag.mode==="carry"){const d=w.clone().sub(drag.last);p.a.position.add(d);p.b.position.add(d);p.a.socketId=null;p.b.socketId=null}else if(drag.end){p[drag.end].position.copy(w);p[drag.end].socketId=null}drag.last.copy(w);syncAll();refresh();render()});
function finish(e:PointerEvent){if(!drag||drag.pointerId!==e.pointerId)return;const p=findPart(drag.partId);if(drag.mode==="carry"){const da=Math.min(...sockets.map(s=>p.a.position.distanceTo(s.position))),db=Math.min(...sockets.map(s=>p.b.position.distanceTo(s.position)));snap(da<=db?p.a:p.b)}else if(drag.end)snap(p[drag.end]);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);orbit.enabled=true;const n=[p.a.socketId,p.b.socketId].filter(Boolean).length;setStatus(n===0?"Damper is free. Grab its body to carry it or drag an eye to a mount.":n===1?"One eye attached. Drag the free eye to another mount, or drag the attached eye away to detach.":"Both eyes attached. Either eye can still be detached or reconnected directly.");drag=null;syncAll();refresh();render()}
canvas.addEventListener("pointerup",finish);canvas.addEventListener("pointercancel",e=>{if(drag&&canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);drag=null;orbit.enabled=true;render()});

function client(p:THREE.Vector3){const q=p.clone().project(camera),r=canvas.getBoundingClientRect();return new THREE.Vector2(r.left+(q.x*.5+.5)*r.width,r.top+(-q.y*.5+.5)*r.height)}
function publish(){app.dataset.partCount=String(parts.length);app.dataset.selectedPart=selectedId??"none";app.dataset.donorReady=String(donorReady);app.dataset.parts=JSON.stringify(parts.map(savePart));app.dataset.canUndo=String(history.length>0)}
function screenEvidence(){for(const s of sockets){const p=client(s.position),k=s.id.replace(/-([a-z])/g,(_,c:string)=>c.toUpperCase());app.dataset[`${k}ScreenX`]=String(p.x);app.dataset[`${k}ScreenY`]=String(p.y)}const rackMid=rack.localToWorld(rackA.clone().add(rackB).multiplyScalar(.5)),rp=client(rackMid);app.dataset.rackDamperScreenX=String(rp.x);app.dataset.rackDamperScreenY=String(rp.y);const p=selectedId?parts.find(v=>v.id===selectedId):null;if(p){const a=client(p.a.position),b=client(p.b.position);app.dataset.selectedAScreenX=String(a.x);app.dataset.selectedAScreenY=String(a.y);app.dataset.selectedBScreenX=String(b.x);app.dataset.selectedBScreenY=String(b.y)}app.dataset.renderCount=String(renders)}
function resize(){const w=Math.max(1,Math.floor(canvas.clientWidth)),h=Math.max(1,Math.floor(canvas.clientHeight)),d=renderer.getPixelRatio();if(canvas.width!==Math.floor(w*d)||canvas.height!==Math.floor(h*d)){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}}
function render(){resize();renders++;renderer.render(scene,camera);screenEvidence();publish()}orbit.addEventListener("change",render);window.addEventListener("resize",render);
async function load(){try{const gltf=await new GLTFLoader().loadAsync(DONOR_URL);donorTemplate=gltf.scene;donorReady=true;rackDonor=cloneSkeleton(donorTemplate);const scaled=bindRep4DamperDonorAtPhysicalRestLength(rackDonor,DONOR_REFERENCE_LENGTH);applyC1DamperBetween(scaled.binding,rackA,rackB);rack.add(rackDonor);refresh();render();setStatus("Ready. Take the real damper from the illuminated rack in front of the vehicle.")}catch(error){donorReady=false;donorOut.textContent=`ERROR · ${error instanceof Error?error.message:"load failed"}`;setStatus("Damper donor failed to load. Do not use this checkpoint.");render()}}
window.addEventListener("pagehide",()=>{orbit.dispose();renderer.dispose()},{once:true});refresh();render();void load();
