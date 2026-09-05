import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { applyC1DamperBetween, type C1DamperBinding } from "../rep2/c1-damper-adapter.js";
import {
  REP4_DAMPER_COMPONENT,
  deriveRep4DamperRelation,
  type Rep4DamperedCornerAuthority,
} from "./dampered-corner-world.js";
import {
  REP4_B2_HARDPOINTS,
  cloneRep4B2Authority,
  rep4B2Hardpoint,
  withRep4B2Hardpoint,
  type Rep4B2HardpointId,
} from "./stage-b-authoring.js";
import { bindRep4DamperDonorAtPhysicalRestLength } from "./stage-b-damper-visual.js";
import {
  projectRep4BuildFrame,
  rep4StageBSegmentLength,
  type Rep4StageBSegment,
} from "./stage-b-projection.js";

const DONOR_URL = "/assets/rep2/Asset_Dumper.gltf";
const rootCandidate = document.querySelector<HTMLElement>("#app");
if (rootCandidate === null) throw new Error("Rep4 B2 requires #app.");
const root: HTMLElement = rootCandidate;

document.title = "JV Rep4 B2 Direct Construction";
root.innerHTML = `
<style>
  :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; overflow: hidden; background: #090d12; color: #e8eef5; }
  .b2 { width: 100vw; height: 100vh; position: relative; }
  .b2 canvas { width: 100%; height: 100%; display: block; touch-action: none; }
  .panel { position: absolute; top: 18px; left: 18px; width: min(420px, calc(100vw - 36px)); padding: 15px 16px; border: 1px solid #405064; border-radius: 12px; background: rgba(10,15,21,.91); backdrop-filter: blur(8px); box-shadow: 0 12px 32px rgba(0,0,0,.28); }
  .eyebrow { margin: 0 0 5px; color: #8fa6bc; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 0; font-size: 20px; font-weight: 650; }
  .sub { margin: 7px 0 11px; color: #aebdca; font-size: 13px; line-height: 1.38; }
  .classes { display: grid; gap: 5px; margin: 10px 0; font-size: 12px; }
  .classes div { display: flex; align-items: center; gap: 7px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px currentColor; }
  .bearing { color: #ffae4d; background: #ffae4d; }
  .tie { color: #e0b878; background: #e0b878; }
  .damper { color: #b890d8; background: #b890d8; }
  .selection { padding: 9px 10px; border: 1px solid #314254; border-radius: 8px; background: #101821; font-size: 12px; line-height: 1.35; }
  .coords { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 8px 0 10px; }
  .coords label { display: grid; gap: 3px; color: #7f93a5; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
  .coords input { width: 100%; padding: 6px 7px; border-radius: 6px; border: 1px solid #405064; background: #0d141c; color: #e8eef5; font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; }
  .coords input:disabled { opacity: .45; }
  .row { display: grid; grid-template-columns: 118px 1fr; gap: 8px; padding: 3px 0; font-size: 12px; }
  .row span { color: #8398ab; }
  .row output { overflow-wrap: anywhere; }
  .status-ready { color: #a9d6b3; }
  .status-diagnosed { color: #efc37e; }
  button { appearance: none; border: 1px solid #536a81; background: #17212c; color: #eaf2fa; padding: 7px 11px; border-radius: 8px; font: inherit; cursor: pointer; }
  .footer { margin-top: 9px; padding-top: 9px; border-top: 1px solid #2c3946; color: #9fb0bf; font-size: 11px; line-height: 1.45; }
</style>
<main class="b2">
  <canvas data-testid="rep4-b2-canvas" aria-label="Rep4 B2 direct mechanical hardpoint construction viewport"></canvas>
  <aside class="panel">
    <p class="eyebrow">NEXTGEN JV · REP4 B2 · BUILD-ONLY DIRECT CONSTRUCTION</p>
    <h1>Move physical hardpoints, not tuning parameters</h1>
    <p class="sub">Three deliberately different mechanical classes share one spatial editing grammar. PLAY is intentionally absent from B2.</p>
    <div class="classes">
      <div><i class="dot bearing"></i>upper arm bearing A</div>
      <div><i class="dot tie"></i>chassis tie point</div>
      <div><i class="dot damper"></i>damper lower eye</div>
    </div>
    <div class="selection" data-testid="b2-selection">Select one colored hardpoint in the scene.</div>
    <div class="coords">
      <label>X<input data-testid="b2-x" type="number" step="0.001" disabled></label>
      <label>Y<input data-testid="b2-y" type="number" step="0.001" disabled></label>
      <label>Z<input data-testid="b2-z" type="number" step="0.001" disabled></label>
    </div>
    <div class="row"><span>mechanical state</span><output data-testid="b2-status">checking…</output></div>
    <div class="row"><span>upper hinge</span><output data-testid="b2-axis">—</output></div>
    <div class="row"><span>tie length</span><output data-testid="b2-tie-length">—</output></div>
    <div class="row"><span>damper span</span><output data-testid="b2-damper-length">—</output></div>
    <div class="row"><span>donor damper</span><output data-testid="b2-donor">loading…</output></div>
    <p><button data-testid="b2-reset">Reset authored hardpoints</button></p>
    <p class="footer">Click colored hardpoint → world X/Y/Z gizmo. Drag empty space → orbit. Exact coordinate entry edits the same authored point. Invalid finite construction is diagnosed rather than silently rewritten.</p>
  </aside>
</main>`;

function required<T extends Element>(selector: string): T {
  const value = root.querySelector<T>(selector);
  if (value === null) throw new Error(`Missing Rep4 B2 UI element: ${selector}`);
  return value;
}

const canvas = required<HTMLCanvasElement>("[data-testid='rep4-b2-canvas']");
const selectionOutput = required<HTMLElement>("[data-testid='b2-selection']");
const statusOutput = required<HTMLOutputElement>("[data-testid='b2-status']");
const axisOutput = required<HTMLOutputElement>("[data-testid='b2-axis']");
const tieOutput = required<HTMLOutputElement>("[data-testid='b2-tie-length']");
const damperOutput = required<HTMLOutputElement>("[data-testid='b2-damper-length']");
const donorOutput = required<HTMLOutputElement>("[data-testid='b2-donor']");
const resetButton = required<HTMLButtonElement>("[data-testid='b2-reset']");
const coordInputs = {
  x: required<HTMLInputElement>("[data-testid='b2-x']"),
  y: required<HTMLInputElement>("[data-testid='b2-y']"),
  z: required<HTMLInputElement>("[data-testid='b2-z']"),
};
type AxisName = keyof typeof coordInputs;

const baseline: Rep4DamperedCornerAuthority = Object.freeze({
  twoArm: Object.freeze({
    upper: Object.freeze({
      inboardAWorld: Object.freeze({ x: 0, y: 0.42, z: -0.3 }),
      inboardBWorld: Object.freeze({ x: 0, y: 0.42, z: 0.3 }),
      outboardWorld: Object.freeze({ x: 0.72, y: 0.2, z: 0 }),
    }),
    lower: Object.freeze({
      inboardAWorld: Object.freeze({ x: 0, y: -0.42, z: -0.3 }),
      inboardBWorld: Object.freeze({ x: 0, y: -0.42, z: 0.3 }),
      outboardWorld: Object.freeze({ x: 0.76, y: -0.22, z: 0 }),
    }),
  }),
  chassisTiePointWorld: Object.freeze({ x: 0.28, y: -0.1, z: 0.32 }),
  uprightTiePickupWorld: Object.freeze({ x: 0.74, y: 0, z: 0.18 }),
  damperChassisEyeWorld: Object.freeze({ x: 0.18, y: 0.13, z: 0 }),
  damperLowerEyeWorld: Object.freeze({ x: 0.418, y: -0.31, z: 0 }),
});
let authored = cloneRep4B2Authority(baseline);
let selectedId: Rep4B2HardpointId | null = null;
let relationValid = false;
let donorReady = false;
let damperBinding: C1DamperBinding | null = null;
let disposed = false;
let renderFrames = 0;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090d12);
const camera = new THREE.PerspectiveCamera(42, 1, 0.02, 30);
camera.position.set(2.25, 1.25, 2.45);
const orbit = new OrbitControls(camera, canvas);
orbit.target.set(0.32, -0.04, 0);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.minDistance = 1.1;
orbit.maxDistance = 6;
orbit.update();

scene.add(new THREE.HemisphereLight(0xbfd5e7, 0x1d2630, 1.7));
const light = new THREE.DirectionalLight(0xffffff, 2.8);
light.position.set(2.5, 4, 3);
light.castShadow = true;
scene.add(light);
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(6, 6),
  new THREE.MeshStandardMaterial({ color: 0x10161d, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.68;
scene.add(floor);
const grid = new THREE.GridHelper(5, 20, 0x45586b, 0x202b35);
grid.position.y = -0.675;
scene.add(grid);
const support = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 1.25, 0.86),
  new THREE.MeshStandardMaterial({ color: 0x37414d, roughness: 0.5, metalness: 0.5 }),
);
support.position.set(-0.12, 0, 0);
support.castShadow = true;
scene.add(support);

function segmentMesh(radius: number, color: number): THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial> {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 1, 14),
    new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.35 }),
  );
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

const upperMeshes = [segmentMesh(0.035, 0xaab7c5), segmentMesh(0.035, 0xaab7c5)] as const;
const lowerMeshes = [segmentMesh(0.04, 0x8798a8), segmentMesh(0.04, 0x8798a8)] as const;
const uprightMesh = segmentMesh(0.055, 0xd3dce5);
const tieMesh = segmentMesh(0.018, 0xe0b878);
const fallbackDamperMesh = segmentMesh(0.027, 0xb586cb);
const wheel = new THREE.Mesh(
  new THREE.TorusGeometry(0.29, 0.055, 12, 30),
  new THREE.MeshStandardMaterial({ color: 0x26313b, roughness: 0.7, metalness: 0.15 }),
);
scene.add(wheel);

function marker(color: number, radius: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 14),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.18, roughness: 0.3 }),
  );
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

const editableMarkers: Record<Rep4B2HardpointId, THREE.Mesh> = {
  "upper-bearing-a": marker(0xffae4d, 0.075),
  "chassis-tie": marker(0xe0b878, 0.075),
  "damper-lower-eye": marker(0xb890d8, 0.075),
};
for (const descriptor of REP4_B2_HARDPOINTS) {
  editableMarkers[descriptor.id].userData.hardpointId = descriptor.id;
}

const passiveMaterial = new THREE.MeshStandardMaterial({ color: 0xdbe5ee, roughness: 0.35, metalness: 0.12 });
const passivePoints = [
  baseline.twoArm.upper.inboardBWorld,
  baseline.twoArm.upper.outboardWorld,
  baseline.twoArm.lower.inboardAWorld,
  baseline.twoArm.lower.inboardBWorld,
  baseline.twoArm.lower.outboardWorld,
  baseline.uprightTiePickupWorld,
  baseline.damperChassisEyeWorld,
];
for (const point of passivePoints) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.037, 14, 10), passiveMaterial);
  mesh.position.set(point.x, point.y, point.z);
  scene.add(mesh);
}

function setSegment(mesh: THREE.Object3D, value: Rep4StageBSegment): void {
  const a = new THREE.Vector3(value.a.x, value.a.y, value.a.z);
  const b = new THREE.Vector3(value.b.x, value.b.y, value.b.z);
  const delta = b.clone().sub(a);
  const length = delta.length();
  if (!Number.isFinite(length) || length <= 1e-8) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
  mesh.scale.set(1, length, 1);
}

const axisVectors: Record<AxisName, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const axisColors: Record<AxisName, number> = { x: 0xff5b5b, y: 0x68d77a, z: 0x5c8dff };
const gizmo = new THREE.Group();
scene.add(gizmo);
gizmo.visible = false;
const gizmoPickers: THREE.Mesh[] = [];
function orientAlongY(object: THREE.Object3D, direction: THREE.Vector3): void {
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
}
for (const axisName of Object.keys(axisVectors) as AxisName[]) {
  const axis = axisVectors[axisName];
  const material = new THREE.MeshBasicMaterial({ color: axisColors[axisName], depthTest: false, transparent: true, opacity: 0.98 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.34, 12), material);
  shaft.position.copy(axis).multiplyScalar(0.17);
  orientAlongY(shaft, axis);
  shaft.renderOrder = 20;
  gizmo.add(shaft);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.13, 16), material);
  cone.position.copy(axis).multiplyScalar(0.405);
  orientAlongY(cone, axis);
  cone.renderOrder = 20;
  gizmo.add(cone);
  const picker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.48, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  picker.position.copy(axis).multiplyScalar(0.22);
  orientAlongY(picker, axis);
  picker.userData.axis = axisName;
  gizmo.add(picker);
  gizmoPickers.push(picker);
}

function hardpointLabel(id: Rep4B2HardpointId): string {
  return REP4_B2_HARDPOINTS.find((item) => item.id === id)?.label ?? id;
}

function mechanicalClass(id: Rep4B2HardpointId): string {
  return REP4_B2_HARDPOINTS.find((item) => item.id === id)?.mechanicalClass ?? "unknown";
}

function syncCoordinateInputs(): void {
  const selected = selectedId === null ? null : rep4B2Hardpoint(authored, selectedId);
  for (const axis of Object.keys(coordInputs) as AxisName[]) {
    const input = coordInputs[axis];
    input.disabled = selected === null;
    input.value = selected === null ? "" : selected[axis].toFixed(6);
  }
}

function selectHardpoint(id: Rep4B2HardpointId | null): void {
  selectedId = id;
  for (const descriptor of REP4_B2_HARDPOINTS) {
    editableMarkers[descriptor.id].scale.setScalar(descriptor.id === id ? 1.25 : 1);
  }
  gizmo.visible = id !== null;
  if (id !== null) {
    const point = rep4B2Hardpoint(authored, id);
    gizmo.position.set(point.x, point.y, point.z);
    selectionOutput.textContent = `${hardpointLabel(id)} selected · ${mechanicalClass(id)} · drag world X/Y/Z or enter exact coordinates.`;
  } else {
    selectionOutput.textContent = "Select one colored hardpoint in the scene.";
  }
  root.dataset.selectedHardpoint = id ?? "none";
  root.dataset.selectedClass = id === null ? "none" : mechanicalClass(id);
  syncCoordinateInputs();
}

function publishAuthority(): void {
  const bearing = rep4B2Hardpoint(authored, "upper-bearing-a");
  const tie = rep4B2Hardpoint(authored, "chassis-tie");
  const damper = rep4B2Hardpoint(authored, "damper-lower-eye");
  root.dataset.upperBearingAX = String(bearing.x);
  root.dataset.upperBearingAY = String(bearing.y);
  root.dataset.upperBearingAZ = String(bearing.z);
  root.dataset.chassisTieX = String(tie.x);
  root.dataset.chassisTieY = String(tie.y);
  root.dataset.chassisTieZ = String(tie.z);
  root.dataset.damperLowerEyeX = String(damper.x);
  root.dataset.damperLowerEyeY = String(damper.y);
  root.dataset.damperLowerEyeZ = String(damper.z);
  root.dataset.derivedValid = String(relationValid);
  root.dataset.donorReady = String(donorReady);
}

function refreshBuild(): void {
  const frame = projectRep4BuildFrame(authored);
  setSegment(upperMeshes[0], frame.upperArm[0]);
  setSegment(upperMeshes[1], frame.upperArm[1]);
  setSegment(lowerMeshes[0], frame.lowerArm[0]);
  setSegment(lowerMeshes[1], frame.lowerArm[1]);
  setSegment(uprightMesh, frame.upright);
  setSegment(tieMesh, frame.tie);
  wheel.position.set(frame.wheelCenter.x, frame.wheelCenter.y, frame.wheelCenter.z);

  const damperLength = rep4StageBSegmentLength(frame.damper);
  if (damperBinding !== null && damperLength > 1e-8) {
    try {
      damperBinding.scene.visible = true;
      fallbackDamperMesh.visible = false;
      applyC1DamperBetween(damperBinding, frame.damper.a, frame.damper.b);
    } catch {
      damperBinding.scene.visible = false;
      fallbackDamperMesh.visible = true;
      setSegment(fallbackDamperMesh, frame.damper);
    }
  } else {
    if (damperBinding !== null) damperBinding.scene.visible = false;
    fallbackDamperMesh.visible = true;
    setSegment(fallbackDamperMesh, frame.damper);
  }

  for (const descriptor of REP4_B2_HARDPOINTS) {
    const point = rep4B2Hardpoint(authored, descriptor.id);
    editableMarkers[descriptor.id].position.set(point.x, point.y, point.z);
  }

  try {
    const derived = deriveRep4DamperRelation(authored);
    relationValid = true;
    statusOutput.textContent = "READY · authored construction mechanically derivable";
    statusOutput.className = "status-ready";
    axisOutput.textContent = `${derived.twoArm.upper.axisWorld.x.toFixed(3)}, ${derived.twoArm.upper.axisWorld.y.toFixed(3)}, ${derived.twoArm.upper.axisWorld.z.toFixed(3)}`;
    tieOutput.textContent = `${derived.tieLength.toFixed(6)} m`;
    damperOutput.textContent = `${derived.initialDamperLength.toFixed(6)} m`;
    root.dataset.upperAxisX = String(derived.twoArm.upper.axisWorld.x);
    root.dataset.upperAxisY = String(derived.twoArm.upper.axisWorld.y);
    root.dataset.upperAxisZ = String(derived.twoArm.upper.axisWorld.z);
    root.dataset.tieLength = String(derived.tieLength);
    root.dataset.damperLength = String(derived.initialDamperLength);
  } catch (error) {
    relationValid = false;
    statusOutput.textContent = `DIAGNOSIS · ${error instanceof Error ? error.message : "invalid authored geometry"}`;
    statusOutput.className = "status-diagnosed";
    axisOutput.textContent = "invalid";
    tieOutput.textContent = "invalid";
    damperOutput.textContent = Number.isFinite(damperLength) ? `${damperLength.toFixed(6)} m · unsolved` : "invalid";
    root.dataset.upperAxisX = "invalid";
    root.dataset.upperAxisY = "invalid";
    root.dataset.upperAxisZ = "invalid";
    root.dataset.tieLength = "invalid";
    root.dataset.damperLength = Number.isFinite(damperLength) ? String(damperLength) : "invalid";
  }

  if (selectedId !== null) {
    const point = rep4B2Hardpoint(authored, selectedId);
    gizmo.position.set(point.x, point.y, point.z);
  }
  syncCoordinateInputs();
  publishAuthority();
}

function setSelectedAxis(axis: AxisName, value: number): void {
  if (selectedId === null || !Number.isFinite(value)) return;
  const current = rep4B2Hardpoint(authored, selectedId);
  const next = { ...current, [axis]: value };
  authored = withRep4B2Hardpoint(authored, selectedId, next);
  refreshBuild();
}
for (const axis of Object.keys(coordInputs) as AxisName[]) {
  coordInputs[axis].addEventListener("change", () => {
    const value = Number(coordInputs[axis].value);
    if (Number.isFinite(value)) setSelectedAxis(axis, value);
    else syncCoordinateInputs();
  });
}

resetButton.addEventListener("click", () => {
  authored = cloneRep4B2Authority(baseline);
  selectHardpoint(null);
  refreshBuild();
});

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
let dragAxis: AxisName | null = null;
let dragStartPosition = new THREE.Vector3();
let dragStartClient = new THREE.Vector2();
let dragScreenDirection = new THREE.Vector2(1, 0);
let dragPixelsPerWorld = 1;
let dragPointerId = -1;

function pointerToNdc(clientX: number, clientY: number): void {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

function worldToClient(point: THREE.Vector3): THREE.Vector2 {
  const projected = point.clone().project(camera);
  const rect = canvas.getBoundingClientRect();
  return new THREE.Vector2(
    rect.left + (projected.x * 0.5 + 0.5) * rect.width,
    rect.top + (-projected.y * 0.5 + 0.5) * rect.height,
  );
}

function beginAxisDrag(axis: AxisName, event: PointerEvent): void {
  if (selectedId === null) return;
  dragAxis = axis;
  dragPointerId = event.pointerId;
  const current = rep4B2Hardpoint(authored, selectedId);
  dragStartPosition.set(current.x, current.y, current.z);
  dragStartClient.set(event.clientX, event.clientY);
  const originScreen = worldToClient(dragStartPosition);
  const unitScreen = worldToClient(dragStartPosition.clone().add(axisVectors[axis]));
  const delta = unitScreen.sub(originScreen);
  dragPixelsPerWorld = Math.max(1e-6, delta.length());
  dragScreenDirection.copy(delta).normalize();
  orbit.enabled = false;
  canvas.setPointerCapture(event.pointerId);
  root.dataset.dragAxis = axis;
  event.preventDefault();
  event.stopPropagation();
}

function applyAxisDrag(event: PointerEvent): void {
  if (dragAxis === null || selectedId === null) return;
  const pointerDelta = new THREE.Vector2(event.clientX, event.clientY).sub(dragStartClient);
  const worldDelta = THREE.MathUtils.clamp(pointerDelta.dot(dragScreenDirection) / dragPixelsPerWorld, -2.5, 2.5);
  const next = dragStartPosition.clone().addScaledVector(axisVectors[dragAxis], worldDelta);
  authored = withRep4B2Hardpoint(authored, selectedId, { x: next.x, y: next.y, z: next.z });
  refreshBuild();
}

function finishAxisDrag(event?: PointerEvent): void {
  if (dragAxis === null) return;
  dragAxis = null;
  orbit.enabled = true;
  root.dataset.dragAxis = "none";
  if (event !== undefined && event.pointerId === dragPointerId && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  dragPointerId = -1;
}

canvas.addEventListener("pointerdown", (event) => {
  pointerToNdc(event.clientX, event.clientY);
  raycaster.setFromCamera(pointerNdc, camera);
  if (selectedId !== null && gizmo.visible) {
    const gizmoHit = raycaster.intersectObjects(gizmoPickers, false)[0];
    if (gizmoHit !== undefined) {
      beginAxisDrag(gizmoHit.object.userData.axis as AxisName, event);
      return;
    }
  }
  const markerHit = raycaster.intersectObjects(Object.values(editableMarkers), false)[0];
  if (markerHit !== undefined) {
    selectHardpoint(markerHit.object.userData.hardpointId as Rep4B2HardpointId);
    event.preventDefault();
  }
});
canvas.addEventListener("pointermove", applyAxisDrag);
canvas.addEventListener("pointerup", finishAxisDrag);
canvas.addEventListener("pointercancel", finishAxisDrag);
canvas.addEventListener("lostpointercapture", () => finishAxisDrag());

function resize(): void {
  const width = Math.max(1, Math.floor(canvas.clientWidth));
  const height = Math.max(1, Math.floor(canvas.clientHeight));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function publishScreenPoint(prefix: string, point: THREE.Vector3): void {
  const screen = worldToClient(point);
  root.dataset[`${prefix}ScreenX`] = String(screen.x);
  root.dataset[`${prefix}ScreenY`] = String(screen.y);
}

function writeScreenEvidence(): void {
  publishScreenPoint("upperBearingA", editableMarkers["upper-bearing-a"].position);
  publishScreenPoint("chassisTie", editableMarkers["chassis-tie"].position);
  publishScreenPoint("damperLowerEye", editableMarkers["damper-lower-eye"].position);
  if (selectedId !== null) {
    const selected = editableMarkers[selectedId].position;
    for (const axis of Object.keys(axisVectors) as AxisName[]) {
      publishScreenPoint(`gizmo${axis.toUpperCase()}`, selected.clone().addScaledVector(axisVectors[axis], 0.22));
    }
  }
  root.dataset.cameraX = String(camera.position.x);
  root.dataset.cameraY = String(camera.position.y);
  root.dataset.cameraZ = String(camera.position.z);
  root.dataset.renderFrames = String(renderFrames);
}

async function prepareDonor(): Promise<void> {
  try {
    const gltf = await new GLTFLoader().loadAsync(DONOR_URL);
    const scaled = bindRep4DamperDonorAtPhysicalRestLength(gltf.scene, REP4_DAMPER_COMPONENT.restLength);
    damperBinding = scaled.binding;
    donorReady = true;
    donorOutput.textContent = `READY · Asset_Dumper · ${scaled.scaleFactor.toFixed(3)}× visual scale`;
    donorOutput.className = "status-ready";
    scene.add(gltf.scene);
    refreshBuild();
  } catch (error) {
    donorReady = false;
    donorOutput.textContent = `ERROR · ${error instanceof Error ? error.message : "donor load failed"}`;
    donorOutput.className = "status-diagnosed";
    refreshBuild();
  }
}

function animate(): void {
  if (disposed) return;
  resize();
  orbit.update();
  renderFrames += 1;
  writeScreenEvidence();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("pagehide", () => {
  disposed = true;
  orbit.dispose();
  renderer.dispose();
}, { once: true });

selectHardpoint(null);
refreshBuild();
void prepareDonor();
requestAnimationFrame(animate);
