import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { applyC1DamperBetween, type C1DamperBinding } from "../rep2/c1-damper-adapter.js";
import { bindRep4DamperDonorAtPhysicalRestLength } from "../rep4/stage-b-damper-visual.js";

const DONOR_URL = "/assets/rep2/Asset_Dumper.gltf";
const DONOR_REFERENCE_LENGTH = 0.5;

type GrammarMode = "drag" | "tool";
type RelationKind = "link" | "damper";
type EndpointName = "a" | "b";

interface SocketDef {
  readonly id: string;
  readonly label: string;
  readonly group: "chassis" | "hub";
  readonly position: THREE.Vector3;
}

interface RelationState {
  readonly id: string;
  readonly kind: RelationKind;
  readonly a: string;
  readonly b: string;
}

interface RelationVisual {
  readonly root: THREE.Object3D;
  readonly picker: THREE.Mesh;
  readonly halo: THREE.Mesh;
  readonly damperBinding: C1DamperBinding | null;
}

const appCandidate = document.querySelector<HTMLElement>("#app");
if (appCandidate === null) throw new Error("Construction Grammar Spikes V0 requires #app.");
const app = appCandidate;

document.title = "JV Construction Grammar Spikes V0";
app.innerHTML = `
<style>
  :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; overflow: hidden; background: #080c11; color: #edf3f8; }
  .grammar { position: relative; width: 100vw; height: 100vh; }
  .grammar canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  .panel {
    position: absolute; z-index: 20; top: 16px; left: 16px;
    width: min(420px, calc(100vw - 32px)); padding: 14px 15px;
    border: 1px solid #3d5062; border-radius: 12px;
    background: rgba(8,13,19,.92); backdrop-filter: blur(8px);
    box-shadow: 0 14px 34px rgba(0,0,0,.34);
  }
  .eyebrow { margin: 0 0 4px; color: #9bb1c4; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
  h1 { margin: 0; font-size: 20px; line-height: 1.15; }
  .warning { margin: 8px 0 10px; padding: 8px 10px; border: 1px solid #805b35; border-radius: 8px; background: rgba(107,70,30,.18); color: #efc38c; font-size: 11px; font-weight: 650; letter-spacing: .03em; }
  .sub { margin: 7px 0 10px; color: #aabac8; font-size: 12px; line-height: 1.4; }
  .section { margin-top: 9px; padding-top: 9px; border-top: 1px solid #273543; }
  .label { margin-bottom: 5px; color: #8399ab; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; }
  .buttons { display: flex; flex-wrap: wrap; gap: 6px; }
  button { appearance: none; border: 1px solid #526a80; background: #131d27; color: #eaf2f9; padding: 7px 10px; border-radius: 8px; font: 12px/1.15 inherit; cursor: pointer; }
  button:hover { border-color: #7b96ae; }
  button.active { background: #274761; border-color: #82a7c5; }
  button.danger { border-color: #70484b; }
  button:disabled { opacity: .38; cursor: default; }
  .status { margin-top: 8px; min-height: 38px; padding: 8px 9px; border: 1px solid #2d4051; border-radius: 8px; background: #0d151d; color: #b8c8d5; font-size: 11px; line-height: 1.38; }
  .row { display: grid; grid-template-columns: 110px 1fr; gap: 7px; padding: 3px 0; color: #9badbd; font-size: 11px; }
  .row output { color: #e0e8ef; overflow-wrap: anywhere; }
  .legend { margin-top: 9px; color: #8093a4; font-size: 10px; line-height: 1.45; }
  .kbd { padding: 1px 5px; border: 1px solid #465766; border-bottom-width: 2px; border-radius: 4px; color: #cbd7e1; }
  .mode-note { min-height: 32px; margin-top: 6px; color: #9fb1c0; font-size: 11px; line-height: 1.35; }
</style>
<main class="grammar">
  <canvas data-testid="grammar-canvas" aria-label="Construction grammar comparison workbench"></canvas>
  <aside class="panel">
    <p class="eyebrow">NEXTGEN JV · CONSTRUCTION GRAMMAR SPIKES V0</p>
    <h1>Create relations, not coordinates</h1>
    <div class="warning">INTERACTION PROTOTYPE · NO PHYSICAL-CAUSALITY CLAIM</div>
    <p class="sub">Same workbench, two grammars. Create arbitrary connection graphs, remove them and reconnect endpoints. Physics is intentionally deferred until an interaction idea earns value.</p>

    <div class="section">
      <div class="label">Grammar</div>
      <div class="buttons">
        <button data-testid="mode-drag" class="active">A · drag to connect</button>
        <button data-testid="mode-tool">B · tool then endpoints</button>
      </div>
      <div class="mode-note" data-testid="mode-note"></div>
    </div>

    <div class="section">
      <div class="label">Next component</div>
      <div class="buttons">
        <button data-testid="kind-link" class="active">Adaptive link</button>
        <button data-testid="kind-damper">Real damper donor</button>
      </div>
    </div>

    <div class="section">
      <div class="label">Topology</div>
      <div class="buttons">
        <button data-testid="undo">Undo</button>
        <button data-testid="reconnect-a" disabled>Reconnect A</button>
        <button data-testid="reconnect-b" disabled>Reconnect B</button>
        <button data-testid="delete" class="danger" disabled>Delete selected</button>
        <button data-testid="clear" class="danger">Clear</button>
        <button data-testid="example">Example corner</button>
      </div>
      <div class="status" data-testid="status"></div>
    </div>

    <div class="section">
      <div class="row"><span>relations</span><output data-testid="relation-count">0</output></div>
      <div class="row"><span>selected</span><output data-testid="selected">none</output></div>
      <div class="row"><span>damper donor</span><output data-testid="donor">loading…</output></div>
    </div>

    <p class="legend">Small cyan sockets belong to the chassis; orange sockets belong to the hub reference. Empty-space drag orbits. Select a relation to reconnect an endpoint. <span class="kbd">Ctrl+Z</span> undoes topology edits. Weird finite graphs are allowed.</p>
  </aside>
</main>`;

function required<T extends Element>(selector: string): T {
  const value = app.querySelector<T>(selector);
  if (value === null) throw new Error(`Missing grammar UI element ${selector}`);
  return value;
}

const canvas = required<HTMLCanvasElement>("[data-testid='grammar-canvas']");
const modeDragButton = required<HTMLButtonElement>("[data-testid='mode-drag']");
const modeToolButton = required<HTMLButtonElement>("[data-testid='mode-tool']");
const kindLinkButton = required<HTMLButtonElement>("[data-testid='kind-link']");
const kindDamperButton = required<HTMLButtonElement>("[data-testid='kind-damper']");
const undoButton = required<HTMLButtonElement>("[data-testid='undo']");
const reconnectAButton = required<HTMLButtonElement>("[data-testid='reconnect-a']");
const reconnectBButton = required<HTMLButtonElement>("[data-testid='reconnect-b']");
const deleteButton = required<HTMLButtonElement>("[data-testid='delete']");
const clearButton = required<HTMLButtonElement>("[data-testid='clear']");
const exampleButton = required<HTMLButtonElement>("[data-testid='example']");
const statusOutput = required<HTMLElement>("[data-testid='status']");
const relationCountOutput = required<HTMLOutputElement>("[data-testid='relation-count']");
const selectedOutput = required<HTMLOutputElement>("[data-testid='selected']");
const donorOutput = required<HTMLOutputElement>("[data-testid='donor']");
const modeNote = required<HTMLElement>("[data-testid='mode-note']");

const sockets: readonly SocketDef[] = Object.freeze([
  { id: "c-upper-front", label: "chassis upper front", group: "chassis", position: new THREE.Vector3(-0.34, 0.36, -0.28) },
  { id: "c-upper-rear", label: "chassis upper rear", group: "chassis", position: new THREE.Vector3(-0.34, 0.36, 0.28) },
  { id: "c-lower-front", label: "chassis lower front", group: "chassis", position: new THREE.Vector3(-0.34, -0.34, -0.28) },
  { id: "c-lower-rear", label: "chassis lower rear", group: "chassis", position: new THREE.Vector3(-0.34, -0.34, 0.28) },
  { id: "c-damper", label: "chassis damper mount", group: "chassis", position: new THREE.Vector3(-0.16, 0.52, 0.02) },
  { id: "h-upper-front", label: "hub upper front", group: "hub", position: new THREE.Vector3(0.70, 0.23, -0.16) },
  { id: "h-upper-rear", label: "hub upper rear", group: "hub", position: new THREE.Vector3(0.70, 0.23, 0.16) },
  { id: "h-lower-front", label: "hub lower front", group: "hub", position: new THREE.Vector3(0.70, -0.23, -0.16) },
  { id: "h-lower-rear", label: "hub lower rear", group: "hub", position: new THREE.Vector3(0.70, -0.23, 0.16) },
  { id: "h-damper", label: "hub damper mount", group: "hub", position: new THREE.Vector3(0.61, -0.17, 0.04) },
]);
const socketById = new Map(sockets.map((value) => [value.id, value] as const));

function socket(id: string): SocketDef {
  const value = socketById.get(id);
  if (value === undefined) throw new Error(`Unknown construction socket ${id}`);
  return value;
}

const makeExample = (): RelationState[] => [
  { id: "r-example-upper", kind: "link", a: "c-upper-front", b: "h-upper-front" },
  { id: "r-example-lower", kind: "link", a: "c-lower-front", b: "h-lower-front" },
  { id: "r-example-damper", kind: "damper", a: "c-damper", b: "h-damper" },
];
const cloneRelations = (value: readonly RelationState[]): RelationState[] => value.map((relation) => ({ ...relation }));

let mode: GrammarMode = "drag";
let activeKind: RelationKind = "link";
let relations: RelationState[] = makeExample();
let selectedRelationId: string | null = null;
let pendingSocketId: string | null = null;
let reconnectEndpoint: EndpointName | null = null;
let history: RelationState[][] = [];
let nextRelationIndex = 1;
let donorTemplate: THREE.Object3D | null = null;
let donorReady = false;
let interactionCount = 0;
let renderCount = 0;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080c11);
const camera = new THREE.PerspectiveCamera(43, 1, 0.02, 30);
camera.position.set(2.45, 1.32, 2.60);
const orbit = new OrbitControls(camera, canvas);
orbit.target.set(0.18, 0, 0);
orbit.enableDamping = false;
orbit.minDistance = 1.3;
orbit.maxDistance = 7;
orbit.update();

scene.add(new THREE.HemisphereLight(0xc8d9e8, 0x1a222a, 1.65));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
keyLight.position.set(2.8, 4.2, 3.1);
keyLight.castShadow = true;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x8dbde3, 1.1);
rimLight.position.set(-2, 1.5, -3);
scene.add(rimLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 7),
  new THREE.MeshStandardMaterial({ color: 0x0e151c, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.72;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(6, 24, 0x415466, 0x1e2933);
grid.position.y = -0.715;
scene.add(grid);

const chassis = new THREE.Mesh(
  new THREE.BoxGeometry(0.30, 1.16, 0.90),
  new THREE.MeshStandardMaterial({ color: 0x35414d, roughness: 0.52, metalness: 0.38 }),
);
chassis.position.set(-0.52, 0, 0);
chassis.castShadow = true;
scene.add(chassis);

const upright = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 0.58, 0.38),
  new THREE.MeshStandardMaterial({ color: 0x566675, roughness: 0.38, metalness: 0.48 }),
);
upright.position.set(0.73, 0, 0);
upright.castShadow = true;
scene.add(upright);

const wheel = new THREE.Mesh(
  new THREE.TorusGeometry(0.37, 0.075, 14, 38),
  new THREE.MeshStandardMaterial({ color: 0x202a33, roughness: 0.72, metalness: 0.12 }),
);
wheel.rotation.y = Math.PI / 2;
wheel.position.set(0.91, 0, 0);
wheel.castShadow = true;
scene.add(wheel);

const socketMeshes = new Map<string, THREE.Mesh>();
for (const def of sockets) {
  const color = def.group === "chassis" ? 0x58d1e4 : 0xffa64b;
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.22,
    roughness: 0.28,
    metalness: 0.08,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.046, 18, 12), material);
  mesh.position.copy(def.position);
  mesh.userData.socketId = def.id;
  mesh.castShadow = true;
  scene.add(mesh);
  socketMeshes.set(def.id, mesh);
}

function segmentMesh(radius: number, color: number): THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial> {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 1, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.3 }),
  );
  mesh.castShadow = true;
  return mesh;
}

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

const relationVisuals = new Map<string, RelationVisual>();
const haloMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false });
const pickerMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

function clearRelationVisuals(): void {
  for (const visual of relationVisuals.values()) {
    scene.remove(visual.root);
    scene.remove(visual.picker);
    scene.remove(visual.halo);
  }
  relationVisuals.clear();
}

function relationCylinder(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 14), material);
  setSegment(mesh, a, b);
  return mesh;
}

function rebuildRelationVisuals(): void {
  clearRelationVisuals();
  for (const relation of relations) {
    const a = socket(relation.a).position;
    const b = socket(relation.b).position;
    const picker = relationCylinder(a, b, 0.065, pickerMaterial);
    picker.userData.relationId = relation.id;
    scene.add(picker);
    const halo = relationCylinder(a, b, 0.052, haloMaterial);
    halo.visible = relation.id === selectedRelationId;
    scene.add(halo);

    if (relation.kind === "damper" && donorTemplate !== null) {
      // Asset_Dumper is a skinned glTF. Object3D.clone(true) leaves the cloned
      // SkinnedMesh bound to the original skeleton and produces corrupted visual
      // transforms. SkeletonUtils.clone relinks the cloned skin to cloned bones.
      const donor = cloneSkeleton(donorTemplate);
      const scaled = bindRep4DamperDonorAtPhysicalRestLength(donor, DONOR_REFERENCE_LENGTH);
      applyC1DamperBetween(scaled.binding, a, b);
      scene.add(donor);
      relationVisuals.set(relation.id, { root: donor, picker, halo, damperBinding: scaled.binding });
    } else {
      const color = relation.kind === "damper" ? 0xb88ad3 : 0xafbecb;
      const mesh = segmentMesh(relation.kind === "damper" ? 0.032 : 0.025, color);
      setSegment(mesh, a, b);
      scene.add(mesh);
      relationVisuals.set(relation.id, { root: mesh, picker, halo, damperBinding: null });
    }
  }
  render();
}

const previewGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const previewLine = new THREE.Line(
  previewGeometry,
  new THREE.LineBasicMaterial({ color: 0xe9f4ff, transparent: true, opacity: 0.78 }),
);
previewLine.visible = false;
scene.add(previewLine);

function updatePreview(a: THREE.Vector3, b: THREE.Vector3): void {
  previewGeometry.setFromPoints([a, b]);
  previewGeometry.computeBoundingSphere();
  previewLine.visible = true;
  render();
}
function hidePreview(): void {
  previewLine.visible = false;
  render();
}

function pushHistory(): void {
  history.push(cloneRelations(relations));
  if (history.length > 40) history.shift();
}

function selectedRelation(): RelationState | null {
  return relations.find((relation) => relation.id === selectedRelationId) ?? null;
}

function setStatus(message: string): void {
  statusOutput.textContent = message;
}

function mutateRelations(next: RelationState[], message: string): void {
  pushHistory();
  relations = next;
  selectedRelationId = null;
  pendingSocketId = null;
  reconnectEndpoint = null;
  interactionCount += 1;
  rebuildRelationVisuals();
  refreshUi();
  setStatus(message);
}

function addRelation(a: string, b: string): void {
  if (a === b) {
    setStatus("Choose two different sockets. Self-links are intentionally rejected in this spike.");
    return;
  }
  pushHistory();
  const relation: RelationState = { id: `r-${nextRelationIndex++}`, kind: activeKind, a, b };
  relations = [...relations, relation];
  selectedRelationId = relation.id;
  pendingSocketId = null;
  reconnectEndpoint = null;
  interactionCount += 1;
  rebuildRelationVisuals();
  refreshUi();
  setStatus(`Created ${activeKind} relation. Select/reconnect/delete it or keep building.`);
}

function deleteSelected(): void {
  if (selectedRelationId === null) return;
  mutateRelations(
    relations.filter((relation) => relation.id !== selectedRelationId),
    "Relation removed. Undo is available.",
  );
}

function reconnectSelected(endpoint: EndpointName, targetSocket: string): void {
  const selected = selectedRelation();
  if (selected === null) return;
  const other = endpoint === "a" ? selected.b : selected.a;
  if (targetSocket === other) {
    setStatus("Choose a socket different from the relation's other endpoint.");
    return;
  }
  pushHistory();
  relations = relations.map((relation) => relation.id === selected.id
    ? { ...relation, [endpoint]: targetSocket }
    : relation);
  reconnectEndpoint = null;
  interactionCount += 1;
  rebuildRelationVisuals();
  refreshUi();
  setStatus(`Reconnected endpoint ${endpoint.toUpperCase()} to ${socket(targetSocket).label}.`);
}

function undo(): void {
  const previous = history.pop();
  if (previous === undefined) return;
  relations = cloneRelations(previous);
  selectedRelationId = null;
  pendingSocketId = null;
  reconnectEndpoint = null;
  interactionCount += 1;
  rebuildRelationVisuals();
  refreshUi();
  setStatus("Undid the last topology mutation.");
}

function resetForMode(nextMode: GrammarMode): void {
  mode = nextMode;
  relations = makeExample();
  selectedRelationId = null;
  pendingSocketId = null;
  reconnectEndpoint = null;
  history = [];
  interactionCount += 1;
  rebuildRelationVisuals();
  refreshUi();
  setStatus(nextMode === "drag"
    ? "Drag from one socket to another to create the selected component."
    : "Choose a component, click endpoint A, then endpoint B.");
}

function setKind(kind: RelationKind): void {
  activeKind = kind;
  pendingSocketId = null;
  reconnectEndpoint = null;
  refreshUi();
  setStatus(kind === "damper"
    ? "Real donor damper selected for the next relation."
    : "Adaptive link selected for the next relation.");
}

function refreshSocketAppearance(): void {
  for (const def of sockets) {
    const mesh = socketMeshes.get(def.id)!;
    const pending = def.id === pendingSocketId;
    mesh.scale.setScalar(pending ? 1.45 : 1);
    const material = mesh.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = pending ? 0.72 : 0.22;
  }
  render();
}

function refreshUi(): void {
  modeDragButton.classList.toggle("active", mode === "drag");
  modeToolButton.classList.toggle("active", mode === "tool");
  kindLinkButton.classList.toggle("active", activeKind === "link");
  kindDamperButton.classList.toggle("active", activeKind === "damper");
  modeNote.textContent = mode === "drag"
    ? "Gesture-first: express the relation by dragging directly between physical connection points."
    : "Tool-first: choose the component, then explicitly nominate its two endpoints.";

  const selected = selectedRelation();
  relationCountOutput.textContent = String(relations.length);
  selectedOutput.textContent = selected === null
    ? "none"
    : `${selected.kind} · ${socket(selected.a).label} ↔ ${socket(selected.b).label}`;
  donorOutput.textContent = donorReady ? "READY · real Asset_Dumper" : "loading…";
  undoButton.disabled = history.length === 0;
  reconnectAButton.disabled = selected === null;
  reconnectBButton.disabled = selected === null;
  deleteButton.disabled = selected === null;
  reconnectAButton.classList.toggle("active", reconnectEndpoint === "a");
  reconnectBButton.classList.toggle("active", reconnectEndpoint === "b");
  refreshSocketAppearance();
  publishEvidence();
}

modeDragButton.addEventListener("click", () => resetForMode("drag"));
modeToolButton.addEventListener("click", () => resetForMode("tool"));
kindLinkButton.addEventListener("click", () => setKind("link"));
kindDamperButton.addEventListener("click", () => setKind("damper"));
undoButton.addEventListener("click", undo);
deleteButton.addEventListener("click", deleteSelected);
clearButton.addEventListener("click", () => mutateRelations([], "Construction cleared. Build any relation graph you want."));
exampleButton.addEventListener("click", () => mutateRelations(makeExample(), "Restored the same example corner for comparison."));
reconnectAButton.addEventListener("click", () => {
  if (selectedRelationId === null) return;
  reconnectEndpoint = "a";
  pendingSocketId = null;
  refreshUi();
  setStatus("Reconnect A: choose a new socket.");
});
reconnectBButton.addEventListener("click", () => {
  if (selectedRelationId === null) return;
  reconnectEndpoint = "b";
  pendingSocketId = null;
  refreshUi();
  setStatus("Reconnect B: choose a new socket.");
});

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
  } else if ((event.key === "Delete" || event.key === "Backspace") && selectedRelationId !== null) {
    event.preventDefault();
    deleteSelected();
  }
});

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const constructionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
let dragStartSocketId: string | null = null;
let dragPointerId = -1;

function pointerToNdc(clientX: number, clientY: number): void {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

function socketHit(clientX: number, clientY: number): string | null {
  pointerToNdc(clientX, clientY);
  raycaster.setFromCamera(pointerNdc, camera);
  const hit = raycaster.intersectObjects([...socketMeshes.values()], false)[0];
  return (hit?.object.userData.socketId as string | undefined) ?? null;
}

function relationHit(clientX: number, clientY: number): string | null {
  pointerToNdc(clientX, clientY);
  raycaster.setFromCamera(pointerNdc, camera);
  const pickers = [...relationVisuals.values()].map((visual) => visual.picker);
  const hit = raycaster.intersectObjects(pickers, false)[0];
  return (hit?.object.userData.relationId as string | undefined) ?? null;
}

function pointerWorld(clientX: number, clientY: number): THREE.Vector3 {
  pointerToNdc(clientX, clientY);
  raycaster.setFromCamera(pointerNdc, camera);
  const hit = new THREE.Vector3();
  return raycaster.ray.intersectPlane(constructionPlane, hit) ?? new THREE.Vector3();
}

canvas.addEventListener("pointerdown", (event) => {
  const hitSocketId = socketHit(event.clientX, event.clientY);

  if (hitSocketId !== null && reconnectEndpoint !== null) {
    reconnectSelected(reconnectEndpoint, hitSocketId);
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (hitSocketId !== null && mode === "tool") {
    if (pendingSocketId === null) {
      pendingSocketId = hitSocketId;
      selectedRelationId = null;
      refreshUi();
      setStatus(`Endpoint A = ${socket(hitSocketId).label}. Choose endpoint B.`);
    } else {
      const start = pendingSocketId;
      pendingSocketId = null;
      addRelation(start, hitSocketId);
    }
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (hitSocketId !== null && mode === "drag") {
    dragStartSocketId = hitSocketId;
    dragPointerId = event.pointerId;
    orbit.enabled = false;
    canvas.setPointerCapture(event.pointerId);
    updatePreview(socket(hitSocketId).position, pointerWorld(event.clientX, event.clientY));
    setStatus(`Connecting from ${socket(hitSocketId).label}… release on another socket.`);
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const hitRelationId = relationHit(event.clientX, event.clientY);
  if (hitRelationId !== null) {
    selectedRelationId = hitRelationId;
    pendingSocketId = null;
    reconnectEndpoint = null;
    rebuildRelationVisuals();
    refreshUi();
    setStatus("Relation selected. Reconnect an endpoint, delete it, or keep building.");
    event.preventDefault();
    event.stopPropagation();
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (dragStartSocketId === null) return;
  const targetSocket = socketHit(event.clientX, event.clientY);
  const target = targetSocket === null ? pointerWorld(event.clientX, event.clientY) : socket(targetSocket).position;
  updatePreview(socket(dragStartSocketId).position, target);
});

function finishDrag(event: PointerEvent): void {
  if (dragStartSocketId === null) return;
  const start = dragStartSocketId;
  const target = socketHit(event.clientX, event.clientY);
  dragStartSocketId = null;
  hidePreview();
  orbit.enabled = true;
  if (event.pointerId === dragPointerId && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  dragPointerId = -1;
  if (target !== null) addRelation(start, target);
  else setStatus("Connection cancelled — release on a socket to create a relation.");
}
canvas.addEventListener("pointerup", finishDrag);
canvas.addEventListener("pointercancel", (event) => {
  dragStartSocketId = null;
  hidePreview();
  orbit.enabled = true;
  if (event.pointerId === dragPointerId && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  dragPointerId = -1;
});

function worldToClient(point: THREE.Vector3): THREE.Vector2 {
  const projected = point.clone().project(camera);
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(
    rect.left + (projected.x * 0.5 + 0.5) * rect.width,
    rect.top + (-projected.y * 0.5 + 0.5) * rect.height,
  );
}

function publishEvidence(): void {
  app.dataset.mode = mode;
  app.dataset.kind = activeKind;
  app.dataset.relationCount = String(relations.length);
  app.dataset.selectedRelation = selectedRelationId ?? "none";
  app.dataset.pendingSocket = pendingSocketId ?? "none";
  app.dataset.reconnectEndpoint = reconnectEndpoint ?? "none";
  app.dataset.donorReady = String(donorReady);
  app.dataset.canUndo = String(history.length > 0);
  app.dataset.interactionCount = String(interactionCount);
  app.dataset.relations = JSON.stringify(relations.map(({ id, kind, a, b }) => ({ id, kind, a, b })));
}

function publishScreenEvidence(): void {
  for (const def of sockets) {
    const screen = worldToClient(def.position);
    const key = def.id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    app.dataset[`${key}ScreenX`] = String(screen.x);
    app.dataset[`${key}ScreenY`] = String(screen.y);
  }
  app.dataset.renderFrames = String(renderCount);
}

function resizeRenderer(): void {
  const width = Math.max(1, Math.floor(canvas.clientWidth));
  const height = Math.max(1, Math.floor(canvas.clientHeight));
  const pixelRatio = renderer.getPixelRatio();
  if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function render(): void {
  resizeRenderer();
  renderCount += 1;
  publishScreenEvidence();
  renderer.render(scene, camera);
}

orbit.addEventListener("change", render);
window.addEventListener("resize", render);

async function prepareDonor(): Promise<void> {
  try {
    const gltf = await new GLTFLoader().loadAsync(DONOR_URL);
    donorTemplate = gltf.scene;
    donorReady = true;
    rebuildRelationVisuals();
    refreshUi();
    setStatus("Ready. Compare the two construction grammars; physics is intentionally absent.");
  } catch (error) {
    donorReady = false;
    donorOutput.textContent = `ERROR · ${error instanceof Error ? error.message : "donor load failed"}`;
    setStatus("Damper donor failed to load. Do not use this checkpoint for donor comparison.");
    publishEvidence();
    render();
  }
}

window.addEventListener("pagehide", () => {
  orbit.dispose();
  renderer.dispose();
}, { once: true });

rebuildRelationVisuals();
refreshUi();
setStatus("Loading real damper donor… generic link topology is already interactive.");
render();
void prepareDonor();
