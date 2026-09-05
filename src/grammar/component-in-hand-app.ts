import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { applyC1DamperBetween, type C1DamperBinding } from "../rep2/c1-damper-adapter.js";
import { bindRep4DamperDonorAtPhysicalRestLength } from "../rep4/stage-b-damper-visual.js";

const DONOR_URL = "/assets/rep2/Asset_Dumper.gltf";
const DONOR_REFERENCE_LENGTH = 0.5;
const SNAP_RADIUS = 0.20;

type ComponentKind = "link" | "damper";
type EndpointName = "a" | "b";

interface SocketDef {
  readonly id: string;
  readonly label: string;
  readonly position: THREE.Vector3;
  readonly group: "chassis" | "hub";
}

interface EndpointState {
  position: THREE.Vector3;
  socketId: string | null;
}

interface ComponentState {
  readonly id: string;
  readonly kind: ComponentKind;
  a: EndpointState;
  b: EndpointState;
}

interface SerializedComponent {
  readonly id: string;
  readonly kind: ComponentKind;
  readonly a: readonly [number, number, number];
  readonly b: readonly [number, number, number];
  readonly aSocket: string | null;
  readonly bSocket: string | null;
}

interface ComponentVisual {
  readonly root: THREE.Object3D;
  readonly picker: THREE.Mesh;
  readonly handleA: THREE.Mesh;
  readonly handleB: THREE.Mesh;
  readonly damperBinding: C1DamperBinding | null;
}

const appCandidate = document.querySelector<HTMLElement>("#app");
if (appCandidate === null) throw new Error("Component-in-hand spike requires #app.");
const app = appCandidate;

document.title = "JV Construction Grammar Family C";
app.innerHTML = `
<style>
  :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; overflow: hidden; background: #080c11; color: #edf3f8; }
  .stage { width: 100vw; height: 100vh; position: relative; }
  canvas { width: 100%; height: 100%; display: block; touch-action: none; }
  .panel { position: absolute; top: 16px; left: 16px; width: 332px; padding: 13px 14px; border: 1px solid #3d4e5e; border-radius: 12px; background: rgba(8,13,19,.91); backdrop-filter: blur(7px); box-shadow: 0 14px 36px rgba(0,0,0,.34); pointer-events: auto; }
  .eyebrow { margin: 0 0 4px; color: #9db1c1; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
  h1 { margin: 0; font-size: 20px; line-height: 1.15; }
  .warning { margin: 8px 0; padding: 7px 9px; border: 1px solid #745a3e; border-radius: 8px; background: rgba(104,72,36,.18); color: #e8c595; font-size: 10px; font-weight: 700; letter-spacing: .04em; }
  .sub { margin: 7px 0 10px; color: #a7b7c4; font-size: 11px; line-height: 1.42; }
  .status { margin-top: 9px; min-height: 45px; padding: 8px 9px; border: 1px solid #2c3e4d; border-radius: 8px; background: #0d151d; color: #bdcad5; font-size: 11px; line-height: 1.35; }
  .row { display: grid; grid-template-columns: 92px 1fr; gap: 6px; padding: 3px 0; color: #8396a6; font-size: 10px; }
  .row output { color: #e0e8ef; overflow-wrap: anywhere; }
  .buttons { display: flex; gap: 6px; margin-top: 9px; }
  button { border: 1px solid #506578; border-radius: 8px; background: #131d27; color: #e9f1f7; padding: 7px 9px; font: 11px/1.15 inherit; cursor: pointer; }
  button:disabled { opacity: .38; cursor: default; }
  .hint { margin: 9px 0 0; color: #7f93a4; font-size: 10px; line-height: 1.4; }
  .rack-label { position: absolute; right: 28px; bottom: 24px; padding: 7px 9px; border: 1px solid #425563; border-radius: 8px; background: rgba(8,13,19,.78); color: #b9c8d4; font-size: 10px; pointer-events: none; }
</style>
<main class="stage">
  <canvas data-testid="component-canvas" aria-label="Component in hand construction spike"></canvas>
  <aside class="panel">
    <p class="eyebrow">NEXTGEN JV · CONSTRUCTION GRAMMAR · FAMILY C</p>
    <h1>Take a part. Fit it.</h1>
    <div class="warning">INTERACTION SPIKE · NO PHYSICS CLAIM</div>
    <p class="sub">Pick a physical part from the rack in the scene. Move the part itself. Drop an eye near a mount to attach it; drag either eye later to detach or reconnect.</p>
    <div class="row"><span>selected</span><output data-testid="selected">none</output></div>
    <div class="row"><span>parts</span><output data-testid="count">0</output></div>
    <div class="row"><span>damper donor</span><output data-testid="donor">loading…</output></div>
    <div class="buttons">
      <button data-testid="undo">Undo</button>
      <button data-testid="delete" disabled>Delete part</button>
      <button data-testid="reset">Reset bench</button>
    </div>
    <div class="status" data-testid="status">Loading the real damper donor…</div>
    <p class="hint">Empty-space drag orbits. Selected-part eyes are larger. Release an eye away from mounts to leave it free. Strange finite assemblies are allowed.</p>
  </aside>
  <div class="rack-label">PART RACK · click-drag a real damper or adaptive link</div>
</main>`;

function required<T extends Element>(selector: string): T {
  const value = app.querySelector<T>(selector);
  if (value === null) throw new Error(`Missing Family C UI element ${selector}`);
  return value;
}

const canvas = required<HTMLCanvasElement>("[data-testid='component-canvas']");
const selectedOutput = required<HTMLOutputElement>("[data-testid='selected']");
const countOutput = required<HTMLOutputElement>("[data-testid='count']");
const donorOutput = required<HTMLOutputElement>("[data-testid='donor']");
const statusOutput = required<HTMLElement>("[data-testid='status']");
const undoButton = required<HTMLButtonElement>("[data-testid='undo']");
const deleteButton = required<HTMLButtonElement>("[data-testid='delete']");
const resetButton = required<HTMLButtonElement>("[data-testid='reset']");

const sockets: readonly SocketDef[] = Object.freeze([
  { id: "c-upper", label: "chassis upper", group: "chassis", position: new THREE.Vector3(-0.50, 0.40, 0.00) },
  { id: "c-mid", label: "chassis middle", group: "chassis", position: new THREE.Vector3(-0.50, 0.05, 0.00) },
  { id: "c-lower", label: "chassis lower", group: "chassis", position: new THREE.Vector3(-0.50, -0.35, 0.00) },
  { id: "h-upper", label: "hub upper", group: "hub", position: new THREE.Vector3(0.72, 0.27, 0.00) },
  { id: "h-mid", label: "hub middle", group: "hub", position: new THREE.Vector3(0.72, 0.00, 0.00) },
  { id: "h-lower", label: "hub lower", group: "hub", position: new THREE.Vector3(0.72, -0.27, 0.00) },
]);
const socketById = new Map(sockets.map((entry) => [entry.id, entry] as const));
function socket(id: string): SocketDef {
  const value = socketById.get(id);
  if (!value) throw new Error(`Unknown Family C socket ${id}`);
  return value;
}

let components: ComponentState[] = [];
let history: SerializedComponent[][] = [];
let selectedId: string | null = null;
let nextId = 1;
let donorTemplate: THREE.Object3D | null = null;
let donorReady = false;
let renderCount = 0;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080c11);
const camera = new THREE.PerspectiveCamera(43, 1, 0.02, 30);
camera.position.set(2.45, 1.22, 3.15);
const orbit = new OrbitControls(camera, canvas);
orbit.target.set(0.08, -0.02, 0);
orbit.enableDamping = false;
orbit.minDistance = 1.4;
orbit.maxDistance = 7;
orbit.update();

scene.add(new THREE.HemisphereLight(0xcbdbe8, 0x182028, 1.7));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
keyLight.position.set(3.0, 4.3, 3.2);
keyLight.castShadow = true;
scene.add(keyLight);
const rim = new THREE.DirectionalLight(0x8dbbe0, 1.1);
rim.position.set(-2.0, 1.6, -3.0);
scene.add(rim);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshStandardMaterial({ color: 0x0e151c, roughness: 0.95 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.73;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(6, 24, 0x415466, 0x1e2933);
grid.position.y = -0.725;
scene.add(grid);

const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.16, 0.62), new THREE.MeshStandardMaterial({ color: 0x35414c, roughness: 0.5, metalness: 0.35 }));
chassis.position.set(-0.68, 0.02, 0);
chassis.castShadow = true;
scene.add(chassis);
const hub = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, 0.45), new THREE.MeshStandardMaterial({ color: 0x586977, roughness: 0.4, metalness: 0.45 }));
hub.position.set(0.83, 0, 0);
hub.castShadow = true;
scene.add(hub);
const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.078, 14, 40), new THREE.MeshStandardMaterial({ color: 0x202a33, roughness: 0.72 }));
wheel.rotation.y = Math.PI / 2;
wheel.position.set(1.03, 0, 0);
wheel.castShadow = true;
scene.add(wheel);

const socketMeshes = new Map<string, THREE.Mesh>();
for (const def of sockets) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 18, 12),
    new THREE.MeshStandardMaterial({
      color: def.group === "chassis" ? 0x64dbea : 0xe8a153,
      emissive: def.group === "chassis" ? 0x153a42 : 0x432716,
      emissiveIntensity: 0.34,
      roughness: 0.3,
    }),
  );
  mesh.position.copy(def.position);
  mesh.userData.socketId = def.id;
  mesh.castShadow = true;
  scene.add(mesh);
  socketMeshes.set(def.id, mesh);
}

const rackGroup = new THREE.Group();
rackGroup.position.set(0.30, -0.55, -0.88);
scene.add(rackGroup);
const rackBase = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 0.56), new THREE.MeshStandardMaterial({ color: 0x28343e, roughness: 0.66, metalness: 0.28 }));
rackBase.position.set(0, -0.03, 0);
rackBase.castShadow = true;
rackGroup.add(rackBase);

function setSegment(object: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3): number {
  const delta = b.clone().sub(a);
  const length = delta.length();
  if (!Number.isFinite(length) || length <= 1e-7) {
    object.visible = false;
    return 0;
  }
  object.visible = true;
  object.position.copy(a).add(b).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
  object.scale.set(1, length, 1);
  return length;
}

function makeCylinder(radius: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.28 }));
  mesh.castShadow = true;
  return mesh;
}

const rackPickers: THREE.Mesh[] = [];
const rackLinkA = new THREE.Vector3(-0.47, 0.02, 0);
const rackLinkB = new THREE.Vector3(-0.02, 0.02, 0);
const rackLink = makeCylinder(0.028, 0xb9c7d1);
setSegment(rackLink, rackLinkA, rackLinkB);
rackGroup.add(rackLink);
const rackLinkPicker = makeCylinder(0.075, 0x22303b);
(rackLinkPicker.material as THREE.MeshStandardMaterial).transparent = true;
(rackLinkPicker.material as THREE.MeshStandardMaterial).opacity = 0.05;
setSegment(rackLinkPicker, rackLinkA, rackLinkB);
rackLinkPicker.userData.rackKind = "link";
rackGroup.add(rackLinkPicker);
rackPickers.push(rackLinkPicker);

const rackDamperA = new THREE.Vector3(0.16, 0.02, 0);
const rackDamperB = new THREE.Vector3(0.65, 0.02, 0);
const rackDamperFallback = makeCylinder(0.036, 0xb68bd2);
setSegment(rackDamperFallback, rackDamperA, rackDamperB);
rackGroup.add(rackDamperFallback);
const rackDamperPicker = makeCylinder(0.08, 0x2b2332);
(rackDamperPicker.material as THREE.MeshStandardMaterial).transparent = true;
(rackDamperPicker.material as THREE.MeshStandardMaterial).opacity = 0.05;
setSegment(rackDamperPicker, rackDamperA, rackDamperB);
rackDamperPicker.userData.rackKind = "damper";
rackGroup.add(rackDamperPicker);
rackPickers.push(rackDamperPicker);
let rackDamperDonor: THREE.Object3D | null = null;

const componentVisuals = new Map<string, ComponentVisual>();
const pickerMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

function componentById(id: string): ComponentState {
  const value = components.find((entry) => entry.id === id);
  if (!value) throw new Error(`Unknown Family C component ${id}`);
  return value;
}

function createVisual(state: ComponentState): ComponentVisual {
  let root: THREE.Object3D;
  let damperBinding: C1DamperBinding | null = null;
  if (state.kind === "damper" && donorTemplate !== null) {
    const donor = cloneSkeleton(donorTemplate);
    const scaled = bindRep4DamperDonorAtPhysicalRestLength(donor, DONOR_REFERENCE_LENGTH);
    root = donor;
    damperBinding = scaled.binding;
    scene.add(root);
  } else {
    root = makeCylinder(state.kind === "damper" ? 0.035 : 0.027, state.kind === "damper" ? 0xb68bd2 : 0xbac8d2);
    scene.add(root);
  }
  const picker = makeCylinder(0.075, 0x1b2630);
  (picker.material as THREE.MeshStandardMaterial).transparent = true;
  (picker.material as THREE.MeshStandardMaterial).opacity = 0.02;
  picker.userData.componentId = state.id;
  scene.add(picker);
  const handleMatA = new THREE.MeshStandardMaterial({ color: 0xf1d06d, emissive: 0x5d4918, emissiveIntensity: 0.45 });
  const handleMatB = new THREE.MeshStandardMaterial({ color: 0x8bd7ff, emissive: 0x19425e, emissiveIntensity: 0.45 });
  const handleA = new THREE.Mesh(new THREE.SphereGeometry(0.052, 18, 12), handleMatA);
  const handleB = new THREE.Mesh(new THREE.SphereGeometry(0.052, 18, 12), handleMatB);
  handleA.userData.componentId = state.id; handleA.userData.endpoint = "a";
  handleB.userData.componentId = state.id; handleB.userData.endpoint = "b";
  scene.add(handleA, handleB);
  return { root, picker, handleA, handleB, damperBinding };
}

function disposeVisual(visual: ComponentVisual): void {
  scene.remove(visual.root, visual.picker, visual.handleA, visual.handleB);
}

function syncVisual(state: ComponentState, visual: ComponentVisual): void {
  const a = state.a.position;
  const b = state.b.position;
  if (visual.damperBinding !== null) applyC1DamperBetween(visual.damperBinding, a, b);
  else setSegment(visual.root, a, b);
  setSegment(visual.picker, a, b);
  visual.handleA.position.copy(a);
  visual.handleB.position.copy(b);
  const selected = state.id === selectedId;
  visual.handleA.scale.setScalar(selected ? 1.30 : 0.75);
  visual.handleB.scale.setScalar(selected ? 1.30 : 0.75);
  visual.handleA.visible = selected;
  visual.handleB.visible = selected;
}

function syncAllVisuals(): void {
  const live = new Set(components.map((entry) => entry.id));
  for (const [id, visual] of componentVisuals) {
    if (!live.has(id)) { disposeVisual(visual); componentVisuals.delete(id); }
  }
  for (const state of components) {
    let visual = componentVisuals.get(state.id);
    if (!visual) { visual = createVisual(state); componentVisuals.set(state.id, visual); }
    syncVisual(state, visual);
  }
}

function serialize(): SerializedComponent[] {
  return components.map((state) => ({
    id: state.id,
    kind: state.kind,
    a: [state.a.position.x, state.a.position.y, state.a.position.z],
    b: [state.b.position.x, state.b.position.y, state.b.position.z],
    aSocket: state.a.socketId,
    bSocket: state.b.socketId,
  }));
}

function restore(snapshot: readonly SerializedComponent[]): void {
  components = snapshot.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    a: { position: new THREE.Vector3(...entry.a), socketId: entry.aSocket },
    b: { position: new THREE.Vector3(...entry.b), socketId: entry.bSocket },
  }));
  selectedId = null;
  syncAllVisuals();
  refreshUi();
  render();
}

function pushHistory(): void {
  history.push(serialize());
  if (history.length > 40) history.shift();
}

function snapEndpoint(endpoint: EndpointState): void {
  let best: SocketDef | null = null;
  let bestDistance = SNAP_RADIUS;
  for (const def of sockets) {
    const distance = endpoint.position.distanceTo(def.position);
    if (distance < bestDistance) { best = def; bestDistance = distance; }
  }
  endpoint.socketId = best?.id ?? null;
  if (best) endpoint.position.copy(best.position);
}

function refreshUi(): void {
  const selected = selectedId === null ? null : components.find((entry) => entry.id === selectedId) ?? null;
  selectedOutput.textContent = selected === null
    ? "none"
    : `${selected.kind} · A ${selected.a.socketId ?? "free"} · B ${selected.b.socketId ?? "free"}`;
  countOutput.textContent = String(components.length);
  donorOutput.textContent = donorReady ? "READY · real Asset_Dumper" : "loading…";
  undoButton.disabled = history.length === 0;
  deleteButton.disabled = selected === null;
  publishEvidence();
}

function setStatus(text: string): void { statusOutput.textContent = text; }

function deleteSelected(): void {
  if (selectedId === null) return;
  pushHistory();
  components = components.filter((entry) => entry.id !== selectedId);
  selectedId = null;
  syncAllVisuals(); refreshUi(); render();
  setStatus("Part removed. Undo is available.");
}

function undo(): void {
  const previous = history.pop();
  if (!previous) return;
  restore(previous);
  setStatus("Undid the last component operation.");
}

function resetBench(): void {
  pushHistory();
  components = [];
  selectedId = null;
  syncAllVisuals(); refreshUi(); render();
  setStatus("Bench cleared. Take a part from the spatial rack.");
}

undoButton.addEventListener("click", undo);
deleteButton.addEventListener("click", deleteSelected);
resetButton.addEventListener("click", resetBench);
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undo(); }
  else if ((event.key === "Delete" || event.key === "Backspace") && selectedId !== null) { event.preventDefault(); deleteSelected(); }
});

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const constructionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

function pointerToNdc(x: number, y: number): void {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((x - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((y - rect.top) / rect.height) * 2 + 1;
}

function pointerWorld(x: number, y: number): THREE.Vector3 {
  pointerToNdc(x, y);
  raycaster.setFromCamera(pointerNdc, camera);
  const hit = new THREE.Vector3();
  return raycaster.ray.intersectPlane(constructionPlane, hit) ?? new THREE.Vector3();
}

function firstHit<T extends THREE.Object3D>(x: number, y: number, objects: readonly T[]): THREE.Intersection | null {
  pointerToNdc(x, y); raycaster.setFromCamera(pointerNdc, camera);
  return raycaster.intersectObjects([...objects], true)[0] ?? null;
}

interface DragState {
  readonly pointerId: number;
  readonly componentId: string;
  readonly mode: "carry" | "endpoint";
  readonly endpoint: EndpointName | null;
  lastWorld: THREE.Vector3;
}
let dragState: DragState | null = null;

function spawnComponent(kind: ComponentKind, world: THREE.Vector3): ComponentState {
  pushHistory();
  const half = kind === "damper" ? 0.25 : 0.32;
  const state: ComponentState = {
    id: `part-${nextId++}`,
    kind,
    a: { position: world.clone().add(new THREE.Vector3(0, half, 0)), socketId: null },
    b: { position: world.clone().add(new THREE.Vector3(0, -half, 0)), socketId: null },
  };
  components = [...components, state];
  selectedId = state.id;
  syncAllVisuals(); refreshUi(); render();
  return state;
}

function beginDrag(event: PointerEvent, componentId: string, mode: DragState["mode"], endpoint: EndpointName | null): void {
  dragState = { pointerId: event.pointerId, componentId, mode, endpoint, lastWorld: pointerWorld(event.clientX, event.clientY) };
  orbit.enabled = false;
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault(); event.stopPropagation();
}

canvas.addEventListener("pointerdown", (event) => {
  const endpointObjects = [...componentVisuals.values()].flatMap((visual) => [visual.handleA, visual.handleB]);
  const endpointHit = firstHit(event.clientX, event.clientY, endpointObjects);
  if (endpointHit) {
    const object = endpointHit.object as THREE.Object3D;
    const componentId = object.userData.componentId as string | undefined;
    const endpoint = object.userData.endpoint as EndpointName | undefined;
    if (componentId && endpoint) {
      pushHistory();
      const state = componentById(componentId);
      state[endpoint].socketId = null;
      selectedId = componentId;
      beginDrag(event, componentId, "endpoint", endpoint);
      setStatus(`Moving ${endpoint.toUpperCase()} eye. Release near a mount to attach; release elsewhere to leave it free.`);
      return;
    }
  }

  const rackHit = firstHit(event.clientX, event.clientY, rackPickers);
  const rackKind = rackHit?.object.userData.rackKind as ComponentKind | undefined;
  if (rackKind) {
    if (rackKind === "damper" && !donorReady) { setStatus("Real damper donor is still loading."); return; }
    const world = pointerWorld(event.clientX, event.clientY);
    const state = spawnComponent(rackKind, world);
    beginDrag(event, state.id, "carry", null);
    setStatus(`Picked up ${rackKind}. Move the part itself; release near a mount to catch the nearest eye.`);
    return;
  }

  const bodyObjects = [...componentVisuals.values()].map((visual) => visual.picker);
  const bodyHit = firstHit(event.clientX, event.clientY, bodyObjects);
  const componentId = bodyHit?.object.userData.componentId as string | undefined;
  if (componentId) {
    selectedId = componentId;
    const state = componentById(componentId);
    syncAllVisuals(); refreshUi(); render();
    if (state.a.socketId === null && state.b.socketId === null) {
      pushHistory();
      beginDrag(event, componentId, "carry", null);
      setStatus("Moving the free component as one object.");
    } else {
      setStatus("Part selected. Drag either visible eye to detach or reconnect it.");
      event.preventDefault(); event.stopPropagation();
    }
  } else {
    selectedId = null; syncAllVisuals(); refreshUi(); render();
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (dragState === null || event.pointerId !== dragState.pointerId) return;
  const world = pointerWorld(event.clientX, event.clientY);
  const state = componentById(dragState.componentId);
  if (dragState.mode === "carry") {
    const delta = world.clone().sub(dragState.lastWorld);
    state.a.position.add(delta); state.b.position.add(delta);
    state.a.socketId = null; state.b.socketId = null;
  } else if (dragState.endpoint !== null) {
    state[dragState.endpoint].position.copy(world);
    state[dragState.endpoint].socketId = null;
  }
  dragState.lastWorld.copy(world);
  syncAllVisuals(); refreshUi(); render();
});

function finishDrag(event: PointerEvent): void {
  if (dragState === null || event.pointerId !== dragState.pointerId) return;
  const state = componentById(dragState.componentId);
  if (dragState.mode === "carry") {
    const da = Math.min(...sockets.map((def) => state.a.position.distanceTo(def.position)));
    const db = Math.min(...sockets.map((def) => state.b.position.distanceTo(def.position)));
    snapEndpoint(da <= db ? state.a : state.b);
  } else if (dragState.endpoint !== null) {
    snapEndpoint(state[dragState.endpoint]);
  }
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  orbit.enabled = true;
  const attached = [state.a.socketId, state.b.socketId].filter(Boolean).length;
  setStatus(attached === 0
    ? "Part is free in space. Grab its body to move it, or drag an eye toward a mount."
    : attached === 1
      ? "One eye attached. Drag the free eye to another mount — or drag the attached eye away to detach it."
      : "Both eyes attached. You can still detach or reconnect either eye directly.");
  dragState = null;
  syncAllVisuals(); refreshUi(); render();
}
canvas.addEventListener("pointerup", finishDrag);
canvas.addEventListener("pointercancel", (event) => {
  if (dragState && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  dragState = null; orbit.enabled = true; render();
});

function worldToClient(point: THREE.Vector3): THREE.Vector2 {
  const projected = point.clone().project(camera);
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(rect.left + (projected.x * 0.5 + 0.5) * rect.width, rect.top + (-projected.y * 0.5 + 0.5) * rect.height);
}

function publishEvidence(): void {
  app.dataset.componentCount = String(components.length);
  app.dataset.selectedComponent = selectedId ?? "none";
  app.dataset.donorReady = String(donorReady);
  app.dataset.canUndo = String(history.length > 0);
  app.dataset.components = JSON.stringify(serialize());
}

function publishScreenEvidence(): void {
  for (const def of sockets) {
    const screen = worldToClient(def.position);
    const key = def.id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    app.dataset[`${key}ScreenX`] = String(screen.x);
    app.dataset[`${key}ScreenY`] = String(screen.y);
  }
  const linkWorld = rackGroup.localToWorld(rackLinkA.clone().add(rackLinkB).multiplyScalar(0.5));
  const damperWorld = rackGroup.localToWorld(rackDamperA.clone().add(rackDamperB).multiplyScalar(0.5));
  const linkScreen = worldToClient(linkWorld); const damperScreen = worldToClient(damperWorld);
  app.dataset.rackLinkScreenX = String(linkScreen.x); app.dataset.rackLinkScreenY = String(linkScreen.y);
  app.dataset.rackDamperScreenX = String(damperScreen.x); app.dataset.rackDamperScreenY = String(damperScreen.y);
  const selected = selectedId ? components.find((entry) => entry.id === selectedId) ?? null : null;
  if (selected) {
    const a = worldToClient(selected.a.position); const b = worldToClient(selected.b.position);
    app.dataset.selectedAScreenX = String(a.x); app.dataset.selectedAScreenY = String(a.y);
    app.dataset.selectedBScreenX = String(b.x); app.dataset.selectedBScreenY = String(b.y);
  }
  app.dataset.renderCount = String(renderCount);
}

function resizeRenderer(): void {
  const width = Math.max(1, Math.floor(canvas.clientWidth));
  const height = Math.max(1, Math.floor(canvas.clientHeight));
  const ratio = renderer.getPixelRatio();
  if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}
function render(): void {
  resizeRenderer();
  renderCount += 1;
  renderer.render(scene, camera);
  publishScreenEvidence();
  publishEvidence();
}
orbit.addEventListener("change", render);
window.addEventListener("resize", render);

async function loadDonor(): Promise<void> {
  try {
    const gltf = await new GLTFLoader().loadAsync(DONOR_URL);
    donorTemplate = gltf.scene;
    donorReady = true;
    rackDamperFallback.visible = false;
    rackDamperDonor = cloneSkeleton(donorTemplate);
    const scaled = bindRep4DamperDonorAtPhysicalRestLength(rackDamperDonor, DONOR_REFERENCE_LENGTH);
    applyC1DamperBetween(scaled.binding, rackDamperA, rackDamperB);
    rackGroup.add(rackDamperDonor);
    syncAllVisuals(); refreshUi(); render();
    setStatus("Ready. Take a physical part from the rack and fit it to the mechanism.");
  } catch (error) {
    donorReady = false;
    donorOutput.textContent = `ERROR · ${error instanceof Error ? error.message : "load failed"}`;
    setStatus("Damper donor failed to load. Do not use this checkpoint for Family C judgement.");
    render();
  }
}

window.addEventListener("pagehide", () => { orbit.dispose(); renderer.dispose(); }, { once: true });

refreshUi();
render();
void loadDonor();
