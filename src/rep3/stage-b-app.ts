import "./stage-b-style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  deriveRep3HingeRelation,
  runRep3GeometryDerivedHinge,
  type Rep3GeometryDerivedHingeAuthority,
} from "./geometry-derived-hinge-world.js";

document.title = "JV Rep3 Geometry-Derived Hinge";

const root = document.querySelector<HTMLDivElement>("#app");
if (root === null) throw new Error("Rep3 Stage B app root is missing.");

root.innerHTML = `
  <main class="rep3-shell">
    <header class="rep3-header">
      <div>
        <p class="eyebrow">NEXTGEN JV · REP3 · STAGE B</p>
        <h1>Build the bearings. The hinge follows.</h1>
        <p class="subtitle">Two physical mount locations are the only spatial hinge-line authority.</p>
      </div>
      <nav class="mode-controls" aria-label="Rep3 experiment mode">
        <button data-testid="build" class="active">BUILD</button>
        <button data-testid="play">PLAY</button>
        <button data-testid="reset">Reset mounts</button>
      </nav>
    </header>

    <section class="rep3-stage">
      <canvas data-testid="rep3-viewport" aria-label="Geometry-derived hinge 3D construction viewport"></canvas>
      <aside class="truth-card">
        <p class="truth-label">PHYSICAL AUTHORITY</p>
        <strong data-testid="mode-label">BUILD · bearing placement</strong>
        <p data-testid="instruction">Click either bright bearing, then drag the X/Y/Z translate gizmo. Orbit on empty space. The hinge line itself is not editable.</p>

        <div class="mount-readout">
          <div>
            <span>BEARING A</span>
            <output data-testid="mount-a"></output>
          </div>
          <div>
            <span>BEARING B</span>
            <output data-testid="mount-b"></output>
          </div>
        </div>

        <div class="derived-readout">
          <span>DERIVED · not authored</span>
          <output data-testid="axis-readout"></output>
        </div>

        <div class="legend">
          <p><i class="dot bearing"></i>bright spheres · physical bearings</p>
          <p><i class="dot line"></i>steel line · inferred hinge relation</p>
          <p><i class="dot arm"></i>arm + endpoint · solver consequence</p>
          <p><i class="dot trail"></i>trail · previous/current physical run</p>
        </div>

        <p class="selection" data-testid="selection">Select a bearing to expose its translate gizmo.</p>
        <p class="status" data-testid="runtime-status" data-state="ready">READY · authored mounts editable</p>
      </aside>

      <div class="viewport-help">
        <span>Left drag empty space · orbit</span>
        <span>Wheel · zoom</span>
        <span>Click bearing · select</span>
        <span>Drag gizmo · move bearing</span>
      </div>
    </section>

    <footer>
      <span>Rep3 bounded apparatus · no editable hinge-axis parameter</span>
      <span>BUILD → PLAY → BUILD · real Box3D path</span>
    </footer>
  </main>
`;

const required = <T extends Element>(selector: string): T => {
  const value = root.querySelector<T>(selector);
  if (value === null) throw new Error(`Missing Rep3 Stage B UI element: ${selector}`);
  return value;
};

const canvas = required<HTMLCanvasElement>("[data-testid='rep3-viewport']");
const buildButton = required<HTMLButtonElement>("[data-testid='build']");
const playButton = required<HTMLButtonElement>("[data-testid='play']");
const resetButton = required<HTMLButtonElement>("[data-testid='reset']");
const status = required<HTMLElement>("[data-testid='runtime-status']");
const selectionText = required<HTMLElement>("[data-testid='selection']");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e13);
scene.fog = new THREE.Fog(0x0b0e13, 4.5, 8);

const camera = new THREE.PerspectiveCamera(42, 1, 0.02, 30);
camera.position.set(2.35, 1.55, 2.55);

const orbit = new OrbitControls(camera, canvas);
orbit.target.set(0.18, 0, 0);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.minDistance = 1.2;
orbit.maxDistance = 6;
orbit.maxPolarAngle = Math.PI * 0.93;

scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x1b1b20, 1.55));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
keyLight.position.set(3.5, 4.5, 3.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x8bb5ff, 1.3);
rimLight.position.set(-2.5, 1.5, -3);
scene.add(rimLight);

const grid = new THREE.GridHelper(5, 20, 0x4b596d, 0x242c38);
grid.position.y = -0.92;
scene.add(grid);

const chassisMaterial = new THREE.MeshStandardMaterial({
  color: 0x313945,
  roughness: 0.68,
  metalness: 0.34,
});
const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.75, 1.7), chassisMaterial);
chassis.position.set(-0.23, 0, 0);
chassis.castShadow = true;
chassis.receiveShadow = true;
scene.add(chassis);

const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x68778b, transparent: true, opacity: 0.72 });
const chassisEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(chassis.geometry),
  edgeMaterial,
);
chassisEdges.position.copy(chassis.position);
scene.add(chassisEdges);

const mountMaterialA = new THREE.MeshStandardMaterial({
  color: 0xffb34d,
  roughness: 0.28,
  metalness: 0.35,
  emissive: 0x3c1900,
  emissiveIntensity: 0.65,
});
const mountMaterialB = new THREE.MeshStandardMaterial({
  color: 0xffdd6e,
  roughness: 0.25,
  metalness: 0.3,
  emissive: 0x3c2700,
  emissiveIntensity: 0.62,
});
const mountGeometry = new THREE.SphereGeometry(0.105, 28, 20);
const mountA = new THREE.Mesh(mountGeometry, mountMaterialA);
const mountB = new THREE.Mesh(mountGeometry, mountMaterialB);
for (const mesh of [mountA, mountB]) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}
mountA.userData.mount = "A";
mountB.userData.mount = "B";

const pivotMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.036, 18, 12),
  new THREE.MeshStandardMaterial({ color: 0xdbe7f7, roughness: 0.3, metalness: 0.55 }),
);
pivotMarker.castShadow = true;
scene.add(pivotMarker);

function unitCylinder(radius: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 20), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

const bearingLine = unitCylinder(
  0.027,
  new THREE.MeshStandardMaterial({ color: 0xaab7c6, roughness: 0.34, metalness: 0.78 }),
);
const arm = unitCylinder(
  0.042,
  new THREE.MeshStandardMaterial({ color: 0x8cc9ff, roughness: 0.32, metalness: 0.54 }),
);
const standoffMaterial = new THREE.MeshStandardMaterial({
  color: 0x596574,
  roughness: 0.52,
  metalness: 0.52,
});
const standoffA = unitCylinder(0.034, standoffMaterial);
const standoffB = unitCylinder(0.034, standoffMaterial);

const endpoint = new THREE.Mesh(
  new THREE.SphereGeometry(0.078, 24, 18),
  new THREE.MeshStandardMaterial({
    color: 0x70c4ff,
    roughness: 0.24,
    metalness: 0.4,
    emissive: 0x071c30,
    emissiveIntensity: 0.8,
  }),
);
endpoint.castShadow = true;
scene.add(endpoint);

const trailGeometry = new THREE.BufferGeometry();
const trail = new THREE.Line(
  trailGeometry,
  new THREE.LineBasicMaterial({ color: 0x77e0ff, transparent: true, opacity: 0.78 }),
);
scene.add(trail);

const gizmoGroup = new THREE.Group();
scene.add(gizmoGroup);
gizmoGroup.visible = false;

type AxisName = "x" | "y" | "z";
const axisVectors: Record<AxisName, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const axisColors: Record<AxisName, number> = {
  x: 0xff5b5b,
  y: 0x68d77a,
  z: 0x5c8dff,
};
const gizmoPickers: THREE.Mesh[] = [];

function orientAlongY(object: THREE.Object3D, direction: THREE.Vector3): void {
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
}

for (const axisName of Object.keys(axisVectors) as AxisName[]) {
  const axis = axisVectors[axisName];
  const material = new THREE.MeshBasicMaterial({
    color: axisColors[axisName],
    depthTest: false,
    transparent: true,
    opacity: 0.98,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 12), material);
  shaft.position.copy(axis).multiplyScalar(0.17);
  orientAlongY(shaft, axis);
  shaft.renderOrder = 20;
  gizmoGroup.add(shaft);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.13, 16), material);
  cone.position.copy(axis).multiplyScalar(0.405);
  orientAlongY(cone, axis);
  cone.renderOrder = 20;
  gizmoGroup.add(cone);

  const picker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.48, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  picker.position.copy(axis).multiplyScalar(0.22);
  orientAlongY(picker, axis);
  picker.userData.axis = axisName;
  gizmoGroup.add(picker);
  gizmoPickers.push(picker);
}

const baseline = Object.freeze({
  mountAWorld: Object.freeze({ x: 0, y: -0.42, z: -0.38 }),
  mountBWorld: Object.freeze({ x: 0, y: 0.42, z: 0.34 }),
});

let authored: Rep3GeometryDerivedHingeAuthority = {
  mountAWorld: { ...baseline.mountAWorld },
  mountBWorld: { ...baseline.mountBWorld },
};

type Mode = "BUILD" | "PREPARING" | "PLAYING" | "PAUSED";
let mode: Mode = "BUILD";
let selectedMount: "A" | "B" | null = null;
let playPath: THREE.Vector3[] = [];
let displayedTrail: THREE.Vector3[] = [];
let playIndex = 0;
let playAccumulator = 0;
let lastFrameTime = performance.now();
let runGeneration = 0;
let renderFrames = 0;
let disposed = false;
let relationValid = true;
let derivedPivot = new THREE.Vector3();
let derivedAxis = new THREE.Vector3(0, 0, 1);
let derivedSpan = 0;

function copyAuthored(): Rep3GeometryDerivedHingeAuthority {
  return {
    mountAWorld: { ...authored.mountAWorld },
    mountBWorld: { ...authored.mountBWorld },
  };
}

function setCylinderBetween(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3): void {
  const delta = b.clone().sub(a);
  const length = delta.length();
  if (length <= 1e-8 || !Number.isFinite(length)) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(1, length, 1);
  orientAlongY(mesh, delta);
}

function setModeUi(): void {
  buildButton.classList.toggle("active", mode === "BUILD");
  playButton.classList.toggle("active", mode === "PLAYING" || mode === "PAUSED");
  buildButton.disabled = mode === "PREPARING";
  resetButton.disabled = mode === "PREPARING";

  if (mode === "BUILD") {
    playButton.textContent = "PLAY";
    playButton.disabled = !relationValid;
    required<HTMLElement>("[data-testid='mode-label']").textContent = "BUILD · bearing placement";
    required<HTMLElement>("[data-testid='instruction']").textContent =
      "Click either bright bearing, then drag the X/Y/Z translate gizmo. Orbit on empty space. The hinge line itself is not editable.";
  } else if (mode === "PREPARING") {
    playButton.textContent = "Preparing…";
    playButton.disabled = true;
    required<HTMLElement>("[data-testid='mode-label']").textContent = "PLAY · solving physical path";
  } else if (mode === "PLAYING") {
    playButton.textContent = "PAUSE";
    playButton.disabled = false;
    required<HTMLElement>("[data-testid='mode-label']").textContent = "PLAY · Box3D consequence";
    required<HTMLElement>("[data-testid='instruction']").textContent =
      "The arm is replaying the endpoint path solved from the two authored bearing locations. Camera remains free.";
  } else {
    playButton.textContent = playIndex >= playPath.length - 1 ? "REPLAY" : "RESUME";
    playButton.disabled = false;
    required<HTMLElement>("[data-testid='mode-label']").textContent =
      playIndex >= playPath.length - 1 ? "PLAY · run complete" : "PLAY · paused";
  }

  root.dataset.mode = mode;
}

function formatPoint(point: Readonly<{ x: number; y: number; z: number }>): string {
  return `X ${point.x.toFixed(3)} · Y ${point.y.toFixed(3)} · Z ${point.z.toFixed(3)}`;
}

function updateReadout(): void {
  required<HTMLOutputElement>("[data-testid='mount-a']").textContent = formatPoint(authored.mountAWorld);
  required<HTMLOutputElement>("[data-testid='mount-b']").textContent = formatPoint(authored.mountBWorld);
  required<HTMLOutputElement>("[data-testid='axis-readout']").textContent = relationValid
    ? `axis ${derivedAxis.x.toFixed(2)}, ${derivedAxis.y.toFixed(2)}, ${derivedAxis.z.toFixed(2)} · span ${derivedSpan.toFixed(3)} m`
    : "invalid mount pair · no hinge line";

  root.dataset.mountAX = String(authored.mountAWorld.x);
  root.dataset.mountAY = String(authored.mountAWorld.y);
  root.dataset.mountAZ = String(authored.mountAWorld.z);
  root.dataset.mountBX = String(authored.mountBWorld.x);
  root.dataset.mountBY = String(authored.mountBWorld.y);
  root.dataset.mountBZ = String(authored.mountBWorld.z);
  root.dataset.derivedAxisX = relationValid ? String(derivedAxis.x) : "invalid";
  root.dataset.derivedAxisY = relationValid ? String(derivedAxis.y) : "invalid";
  root.dataset.derivedAxisZ = relationValid ? String(derivedAxis.z) : "invalid";
  root.dataset.mountSpan = relationValid ? String(derivedSpan) : "invalid";
}

function updateMountingStandoff(mesh: THREE.Mesh, mount: THREE.Vector3): void {
  const chassisPoint = new THREE.Vector3(-0.14, mount.y, mount.z);
  setCylinderBetween(mesh, chassisPoint, mount);
}

function updateBuildGeometry(): void {
  mountA.position.set(authored.mountAWorld.x, authored.mountAWorld.y, authored.mountAWorld.z);
  mountB.position.set(authored.mountBWorld.x, authored.mountBWorld.y, authored.mountBWorld.z);
  updateMountingStandoff(standoffA, mountA.position);
  updateMountingStandoff(standoffB, mountB.position);

  try {
    const relation = deriveRep3HingeRelation(authored);
    relationValid = true;
    derivedPivot.set(relation.pivotWorld.x, relation.pivotWorld.y, relation.pivotWorld.z);
    derivedAxis.set(relation.axisWorld.x, relation.axisWorld.y, relation.axisWorld.z);
    derivedSpan = relation.mountSpan;

    const extension = 0.13;
    const lineA = mountA.position.clone().addScaledVector(derivedAxis, -extension);
    const lineB = mountB.position.clone().addScaledVector(derivedAxis, extension);
    setCylinderBetween(bearingLine, lineA, lineB);
    pivotMarker.visible = true;
    pivotMarker.position.copy(derivedPivot);

    const neutralEndpoint = derivedPivot.clone().add(new THREE.Vector3(0.7, 0, 0));
    setCylinderBetween(arm, derivedPivot, neutralEndpoint);
    endpoint.visible = true;
    endpoint.position.copy(neutralEndpoint);

    status.textContent = "READY · authored mounts editable";
    status.dataset.state = "ready";
  } catch (error) {
    relationValid = false;
    derivedSpan = 0;
    bearingLine.visible = false;
    pivotMarker.visible = false;
    arm.visible = false;
    endpoint.visible = false;
    status.textContent = `DIAGNOSIS · ${error instanceof Error ? error.message : "invalid mount relation"}`;
    status.dataset.state = "diagnosed";
  }

  if (selectedMount !== null) {
    gizmoGroup.position.copy(selectedMount === "A" ? mountA.position : mountB.position);
  }
  updateReadout();
  setModeUi();
}

function selectMount(id: "A" | "B" | null): void {
  selectedMount = id;
  mountA.scale.setScalar(id === "A" ? 1.18 : 1);
  mountB.scale.setScalar(id === "B" ? 1.18 : 1);
  gizmoGroup.visible = id !== null && mode === "BUILD";
  if (id !== null) gizmoGroup.position.copy(id === "A" ? mountA.position : mountB.position);
  selectionText.textContent =
    id === null
      ? "Select a bearing to expose its translate gizmo."
      : `Bearing ${id} selected · drag world X / Y / Z. This moves the bearing, not a hinge-axis parameter.`;
  root.dataset.selectedMount = id ?? "none";
}

function setTrail(points: THREE.Vector3[]): void {
  displayedTrail = points.map((point) => point.clone());
  trailGeometry.setFromPoints(displayedTrail.length >= 2 ? displayedTrail : []);
  trailGeometry.computeBoundingSphere();
  trail.visible = displayedTrail.length >= 2;
}

async function enterPlay(): Promise<void> {
  if (mode !== "BUILD" && !(mode === "PAUSED" && playIndex >= playPath.length - 1)) return;
  if (!relationValid) return;

  const generation = ++runGeneration;
  mode = "PREPARING";
  selectMount(null);
  setModeUi();
  status.textContent = "SOLVING · two bearings → native revolute → endpoint path";
  status.dataset.state = "working";

  try {
    const result = await runRep3GeometryDerivedHinge(copyAuthored(), 120);
    if (disposed || generation !== runGeneration) return;
    playPath = result.endpointPath.map((point) => new THREE.Vector3(point.x, point.y, point.z));
    derivedPivot.set(result.derived.pivotWorld.x, result.derived.pivotWorld.y, result.derived.pivotWorld.z);
    derivedAxis.set(result.derived.axisWorld.x, result.derived.axisWorld.y, result.derived.axisWorld.z);
    playIndex = 0;
    playAccumulator = 0;
    setTrail(playPath.slice(0, 1));
    mode = "PLAYING";
    status.textContent = "READY · physical Box3D path playing";
    status.dataset.state = "ready";
    root.dataset.playPathPoints = String(playPath.length);
    setModeUi();
  } catch (error) {
    if (generation !== runGeneration) return;
    mode = "BUILD";
    status.textContent = `DIAGNOSIS · ${error instanceof Error ? error.message : "physical run failed"}`;
    status.dataset.state = "diagnosed";
    updateBuildGeometry();
  }
}

function returnToBuild(): void {
  ++runGeneration;
  mode = "BUILD";
  playPath = [];
  playIndex = 0;
  playAccumulator = 0;
  gizmoGroup.visible = selectedMount !== null;
  updateBuildGeometry();
  setModeUi();
}

function resetMounts(): void {
  ++runGeneration;
  mode = "BUILD";
  authored = {
    mountAWorld: { ...baseline.mountAWorld },
    mountBWorld: { ...baseline.mountBWorld },
  };
  playPath = [];
  playIndex = 0;
  setTrail([]);
  selectMount(null);
  updateBuildGeometry();
}

function togglePlayPause(): void {
  if (mode === "BUILD") {
    void enterPlay();
  } else if (mode === "PLAYING") {
    mode = "PAUSED";
    status.textContent = "PAUSED · camera free · BUILD recovers authored bearings";
    setModeUi();
  } else if (mode === "PAUSED") {
    if (playIndex >= playPath.length - 1) {
      mode = "BUILD";
      void enterPlay();
    } else {
      mode = "PLAYING";
      status.textContent = "READY · physical Box3D path playing";
      setModeUi();
    }
  }
}

buildButton.addEventListener("click", returnToBuild);
playButton.addEventListener("click", togglePlayPause);
resetButton.addEventListener("click", resetMounts);

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
let dragAxisName: AxisName | null = null;
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

function startAxisDrag(axisName: AxisName, event: PointerEvent): void {
  if (selectedMount === null) return;
  dragAxisName = axisName;
  dragPointerId = event.pointerId;
  dragStartPosition.copy(selectedMount === "A" ? mountA.position : mountB.position);
  dragStartClient.set(event.clientX, event.clientY);

  const originScreen = worldToClient(dragStartPosition);
  const unitScreen = worldToClient(dragStartPosition.clone().add(axisVectors[axisName]));
  const delta = unitScreen.sub(originScreen);
  dragPixelsPerWorld = Math.max(1e-6, delta.length());
  dragScreenDirection.copy(delta).normalize();

  orbit.enabled = false;
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("dragging-gizmo");
  root.dataset.dragAxis = axisName;
  event.preventDefault();
  event.stopPropagation();
}

function applyAxisDrag(event: PointerEvent): void {
  if (dragAxisName === null || selectedMount === null) return;
  const pointerDelta = new THREE.Vector2(event.clientX, event.clientY).sub(dragStartClient);
  const worldDelta = pointerDelta.dot(dragScreenDirection) / dragPixelsPerWorld;
  const next = dragStartPosition
    .clone()
    .addScaledVector(axisVectors[dragAxisName], THREE.MathUtils.clamp(worldDelta, -2.5, 2.5));

  if (selectedMount === "A") {
    authored = { ...authored, mountAWorld: { x: next.x, y: next.y, z: next.z } };
  } else {
    authored = { ...authored, mountBWorld: { x: next.x, y: next.y, z: next.z } };
  }
  updateBuildGeometry();
}

function finishAxisDrag(event?: PointerEvent): void {
  if (dragAxisName === null) return;
  dragAxisName = null;
  orbit.enabled = true;
  canvas.classList.remove("dragging-gizmo");
  root.dataset.dragAxis = "none";
  if (event !== undefined && event.pointerId === dragPointerId && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  dragPointerId = -1;
}

canvas.addEventListener("pointerdown", (event) => {
  if (mode !== "BUILD") return;
  pointerToNdc(event.clientX, event.clientY);
  raycaster.setFromCamera(pointerNdc, camera);

  if (selectedMount !== null && gizmoGroup.visible) {
    const gizmoHit = raycaster.intersectObjects(gizmoPickers, false)[0];
    if (gizmoHit !== undefined) {
      startAxisDrag(gizmoHit.object.userData.axis as AxisName, event);
      return;
    }
  }

  const mountHit = raycaster.intersectObjects([mountA, mountB], false)[0];
  if (mountHit !== undefined) {
    selectMount(mountHit.object === mountA ? "A" : "B");
    event.preventDefault();
    return;
  }
});
canvas.addEventListener("pointermove", applyAxisDrag);
canvas.addEventListener("pointerup", finishAxisDrag);
canvas.addEventListener("pointercancel", finishAxisDrag);
canvas.addEventListener("lostpointercapture", () => finishAxisDrag());

function resize(): void {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);
resize();

function writeScreenEvidence(): void {
  const a = worldToClient(mountA.position);
  const b = worldToClient(mountB.position);
  root.dataset.mountAScreenX = String(a.x);
  root.dataset.mountAScreenY = String(a.y);
  root.dataset.mountBScreenX = String(b.x);
  root.dataset.mountBScreenY = String(b.y);

  if (selectedMount !== null && mode === "BUILD") {
    const selected = selectedMount === "A" ? mountA.position : mountB.position;
    const selectedScreen = worldToClient(selected);
    root.dataset.selectedScreenX = String(selectedScreen.x);
    root.dataset.selectedScreenY = String(selectedScreen.y);
    for (const axisName of Object.keys(axisVectors) as AxisName[]) {
      const handle = worldToClient(selected.clone().addScaledVector(axisVectors[axisName], 0.22));
      root.dataset[`gizmo${axisName.toUpperCase()}ScreenX` as keyof DOMStringMap] = String(handle.x);
      root.dataset[`gizmo${axisName.toUpperCase()}ScreenY` as keyof DOMStringMap] = String(handle.y);
    }
  }

  root.dataset.cameraX = String(camera.position.x);
  root.dataset.cameraY = String(camera.position.y);
  root.dataset.cameraZ = String(camera.position.z);
  root.dataset.renderFrames = String(renderFrames);
}

function updatePlayPose(): void {
  if (playPath.length === 0) return;
  const point = playPath[Math.min(playIndex, playPath.length - 1)]!;
  endpoint.visible = true;
  endpoint.position.copy(point);
  arm.visible = true;
  setCylinderBetween(arm, derivedPivot, point);
  pivotMarker.visible = true;
  pivotMarker.position.copy(derivedPivot);
  root.dataset.endpointX = String(point.x);
  root.dataset.endpointY = String(point.y);
  root.dataset.endpointZ = String(point.z);
}

function animate(time: number): void {
  if (disposed) return;
  const dt = Math.min(0.1, Math.max(0, (time - lastFrameTime) / 1000));
  lastFrameTime = time;

  orbit.update();
  if (mode === "PLAYING" && playPath.length > 0) {
    playAccumulator += dt;
    while (playAccumulator >= 1 / 60 && playIndex < playPath.length - 1) {
      playAccumulator -= 1 / 60;
      playIndex += 1;
    }
    updatePlayPose();
    setTrail(playPath.slice(0, playIndex + 1));
    if (playIndex >= playPath.length - 1) {
      mode = "PAUSED";
      status.textContent = "RUN COMPLETE · BUILD to move bearings and try another geometry";
      status.dataset.state = "ready";
      setModeUi();
    }
  }

  renderFrames += 1;
  writeScreenEvidence();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener(
  "pagehide",
  () => {
    disposed = true;
    ++runGeneration;
    resizeObserver.disconnect();
    orbit.dispose();
    renderer.dispose();
  },
  { once: true },
);

selectMount(null);
setTrail([]);
updateBuildGeometry();
setModeUi();
requestAnimationFrame(animate);
