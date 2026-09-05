import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  deriveRep4DamperRelation,
  REP4_DAMPER_COMPONENT,
  runRep4DamperedCornerProbe,
  type Rep4DamperDerivedRelation,
  type Rep4DamperedCornerAuthority,
  type Rep4DamperedCornerSnapshot,
} from "./dampered-corner-world.js";
import "./stage-b-style.css";

type Point3 = { x: number; y: number; z: number };
type EditableAuthority = {
  twoArm: {
    upper: {
      inboardAWorld: Point3;
      inboardBWorld: Point3;
      outboardWorld: Point3;
    };
    lower: {
      inboardAWorld: Point3;
      inboardBWorld: Point3;
      outboardWorld: Point3;
    };
  };
  chassisTiePointWorld: Point3;
  uprightTiePickupWorld: Point3;
  damperChassisEyeWorld: Point3;
  damperLowerEyeWorld: Point3;
};

type PointKey =
  | "upperInboardA"
  | "upperInboardB"
  | "upperOutboard"
  | "lowerInboardA"
  | "lowerInboardB"
  | "lowerOutboard"
  | "tieChassis"
  | "tieUpright"
  | "damperChassis"
  | "damperLower";

type PointCategory = "bearing" | "ball" | "tie" | "damper";
type AxisName = "x" | "y" | "z";
type Mode = "BUILD" | "PREPARING" | "PLAYING" | "PAUSED";

type PointDescriptor = {
  key: PointKey;
  label: string;
  shortLabel: string;
  category: PointCategory;
  get: (document: EditableAuthority) => Point3;
  set: (document: EditableAuthority, point: Point3) => void;
};

const DONOR_DAMPER_URL =
  "https://raw.githubusercontent.com/Jozzpoly/Box3d_FunProject/241fe10a9056836332c21d9614471d32d749ce3d/assets/source/Asset_Dumper.gltf";
const DONOR_SOURCE_COMMIT = "241fe10a9056836332c21d9614471d32d749ce3d";

const root = document.querySelector<HTMLElement>("#app");
if (root === null) throw new Error("Missing #app root.");

root.innerHTML = `
  <main class="rep4-shell">
    <header class="rep4-header">
      <div>
        <p class="eyebrow">NEXTGEN JV · REP4 · OWNER APPARATUS PREVIEW</p>
        <h1>Multi-relation suspension corner</h1>
        <p class="subtitle">Move physical hardpoints. Bearing lines, tie length, spring mapping and PLAY motion are consequences.</p>
      </div>
      <div class="mode-controls" aria-label="Mode controls">
        <button type="button" data-testid="build" class="active">BUILD</button>
        <button type="button" data-testid="play">PLAY</button>
        <button type="button" data-testid="reset">RESET</button>
      </div>
    </header>

    <section class="rep4-stage">
      <canvas data-testid="rep4-viewport" aria-label="Rep4 suspension construction viewport"></canvas>

      <aside class="truth-card" aria-label="Mechanism truth">
        <p class="truth-label">MECHANISM TRUTH</p>
        <strong data-testid="mode-label">BUILD · direct hardpoint authoring</strong>
        <p data-testid="instruction">Click a bright physical hardpoint, then drag world X / Y / Z. Orbit on empty space.</p>

        <div class="selection-block">
          <span>SELECTED · AUTHORED</span>
          <output data-testid="selection">None</output>
          <output data-testid="selected-position">—</output>
        </div>

        <div class="derived-grid">
          <div>
            <span>DERIVED · UPPER HINGE</span>
            <output data-testid="upper-axis">—</output>
          </div>
          <div>
            <span>DERIVED · LOWER HINGE</span>
            <output data-testid="lower-axis">—</output>
          </div>
          <div>
            <span>DERIVED · TIE</span>
            <output data-testid="tie-length">—</output>
          </div>
          <div>
            <span>PHYSICAL DAMPER</span>
            <output data-testid="damper-readout">k 900 · c 18 · L0 0.500</output>
          </div>
        </div>

        <div class="live-readout">
          <span>LIVE PLAY · OBSERVER ONLY</span>
          <output data-testid="live-readout">BUILD geometry is authoritative</output>
        </div>

        <div class="legend" aria-label="Visual legend">
          <p><i class="dot bearing"></i> inboard bearing hardpoint</p>
          <p><i class="dot ball"></i> outboard / upright hardpoint</p>
          <p><i class="dot tie"></i> tie hardpoint + physical link</p>
          <p><i class="dot damper"></i> damper eye + donor skin</p>
          <p><i class="dot derived"></i> derived relation / neutral ghost</p>
        </div>

        <p class="donor-status" data-testid="donor-status" data-state="loading">DONOR · loading Asset_Dumper.gltf…</p>
        <p class="status" data-testid="runtime-status" data-state="working">INITIALIZING · deriving composed mechanism</p>
      </aside>

      <div class="viewport-help" aria-hidden="true">
        <span>LMB point · select</span>
        <span>drag gizmo · translate</span>
        <span>empty drag · orbit</span>
        <span>wheel · zoom</span>
        <span>PLAY · native Box3D trace</span>
      </div>
    </section>

    <footer>
      <span>Authored geometry → derived native relations → live solver state</span>
      <span>Donor visuals never supply physics sockets or axes</span>
    </footer>
  </main>
`;

function required<T extends Element>(selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing required element ${selector}`);
  return element;
}

const canvas = required<HTMLCanvasElement>("[data-testid='rep4-viewport']");
const buildButton = required<HTMLButtonElement>("[data-testid='build']");
const playButton = required<HTMLButtonElement>("[data-testid='play']");
const resetButton = required<HTMLButtonElement>("[data-testid='reset']");
const status = required<HTMLElement>("[data-testid='runtime-status']");
const donorStatus = required<HTMLElement>("[data-testid='donor-status']");
const selectionText = required<HTMLOutputElement>("[data-testid='selection']");
const selectedPositionText = required<HTMLOutputElement>("[data-testid='selected-position']");
const upperAxisText = required<HTMLOutputElement>("[data-testid='upper-axis']");
const lowerAxisText = required<HTMLOutputElement>("[data-testid='lower-axis']");
const tieLengthText = required<HTMLOutputElement>("[data-testid='tie-length']");
const damperReadoutText = required<HTMLOutputElement>("[data-testid='damper-readout']");
const liveReadoutText = required<HTMLOutputElement>("[data-testid='live-readout']");
const modeLabel = required<HTMLElement>("[data-testid='mode-label']");
const instruction = required<HTMLElement>("[data-testid='instruction']");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d12);
scene.fog = new THREE.Fog(0x0a0d12, 4.5, 9);

const camera = new THREE.PerspectiveCamera(42, 1, 0.02, 40);
camera.position.set(2.35, 1.25, 2.55);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const orbit = new OrbitControls(camera, canvas);
orbit.target.set(0.32, -0.05, 0);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.minDistance = 1.1;
orbit.maxDistance = 7;
orbit.update();

scene.add(new THREE.HemisphereLight(0xaec8e6, 0x1c222a, 1.8));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
keyLight.position.set(2.5, 4.5, 3.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x8fc9ff, 1.2);
rimLight.position.set(-2.5, 1.8, -3.5);
scene.add(rimLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 8),
  new THREE.MeshStandardMaterial({ color: 0x10151c, roughness: 0.96, metalness: 0.02 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.72;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(5.5, 22, 0x3e5063, 0x202b37);
grid.position.y = -0.715;
scene.add(grid);

const support = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 1.35, 0.92),
  new THREE.MeshStandardMaterial({ color: 0x2b3440, roughness: 0.54, metalness: 0.62 }),
);
support.position.set(-0.14, -0.02, 0);
support.castShadow = true;
support.receiveShadow = true;
scene.add(support);

const pointDescriptors: readonly PointDescriptor[] = [
  {
    key: "upperInboardA",
    label: "Upper bearing A",
    shortLabel: "U-A",
    category: "bearing",
    get: (d) => d.twoArm.upper.inboardAWorld,
    set: (d, p) => { d.twoArm.upper.inboardAWorld = p; },
  },
  {
    key: "upperInboardB",
    label: "Upper bearing B",
    shortLabel: "U-B",
    category: "bearing",
    get: (d) => d.twoArm.upper.inboardBWorld,
    set: (d, p) => { d.twoArm.upper.inboardBWorld = p; },
  },
  {
    key: "upperOutboard",
    label: "Upper ball hardpoint",
    shortLabel: "U-OUT",
    category: "ball",
    get: (d) => d.twoArm.upper.outboardWorld,
    set: (d, p) => { d.twoArm.upper.outboardWorld = p; },
  },
  {
    key: "lowerInboardA",
    label: "Lower bearing A",
    shortLabel: "L-A",
    category: "bearing",
    get: (d) => d.twoArm.lower.inboardAWorld,
    set: (d, p) => { d.twoArm.lower.inboardAWorld = p; },
  },
  {
    key: "lowerInboardB",
    label: "Lower bearing B",
    shortLabel: "L-B",
    category: "bearing",
    get: (d) => d.twoArm.lower.inboardBWorld,
    set: (d, p) => { d.twoArm.lower.inboardBWorld = p; },
  },
  {
    key: "lowerOutboard",
    label: "Lower ball hardpoint",
    shortLabel: "L-OUT",
    category: "ball",
    get: (d) => d.twoArm.lower.outboardWorld,
    set: (d, p) => { d.twoArm.lower.outboardWorld = p; },
  },
  {
    key: "tieChassis",
    label: "Tie chassis hardpoint",
    shortLabel: "TIE-C",
    category: "tie",
    get: (d) => d.chassisTiePointWorld,
    set: (d, p) => { d.chassisTiePointWorld = p; },
  },
  {
    key: "tieUpright",
    label: "Tie upright pickup",
    shortLabel: "TIE-U",
    category: "tie",
    get: (d) => d.uprightTiePickupWorld,
    set: (d, p) => { d.uprightTiePickupWorld = p; },
  },
  {
    key: "damperChassis",
    label: "Damper chassis eye",
    shortLabel: "D-C",
    category: "damper",
    get: (d) => d.damperChassisEyeWorld,
    set: (d, p) => { d.damperChassisEyeWorld = p; },
  },
  {
    key: "damperLower",
    label: "Damper lower-arm eye",
    shortLabel: "D-L",
    category: "damper",
    get: (d) => d.damperLowerEyeWorld,
    set: (d, p) => { d.damperLowerEyeWorld = p; },
  },
] as const;

const descriptorByKey = new Map<PointKey, PointDescriptor>(
  pointDescriptors.map((descriptor) => [descriptor.key, descriptor]),
);

const baseline: EditableAuthority = {
  twoArm: {
    upper: {
      inboardAWorld: { x: 0, y: 0.42, z: -0.3 },
      inboardBWorld: { x: 0, y: 0.42, z: 0.3 },
      outboardWorld: { x: 0.72, y: 0.2, z: 0 },
    },
    lower: {
      inboardAWorld: { x: 0, y: -0.42, z: -0.3 },
      inboardBWorld: { x: 0, y: -0.42, z: 0.3 },
      outboardWorld: { x: 0.76, y: -0.22, z: 0 },
    },
  },
  chassisTiePointWorld: { x: 0.28, y: 0, z: 0.32 },
  uprightTiePickupWorld: { x: 0.74, y: 0, z: 0.18 },
  damperChassisEyeWorld: { x: 0.18, y: 0.13, z: 0 },
  damperLowerEyeWorld: { x: 0.228, y: -0.36, z: 0 },
};

function cloneDocument(document: EditableAuthority): EditableAuthority {
  return JSON.parse(JSON.stringify(document)) as EditableAuthority;
}

function toAuthority(document: EditableAuthority): Rep4DamperedCornerAuthority {
  return cloneDocument(document);
}

let authored = cloneDocument(baseline);
let derived: Rep4DamperDerivedRelation | null = null;
let relationValid = false;
let mode: Mode = "BUILD";
let selectedPoint: PointKey | null = null;
let playTrace: readonly Rep4DamperedCornerSnapshot[] = [];
let playDerived: Rep4DamperDerivedRelation | null = null;
let playIndex = 0;
let playAccumulator = 0;
let runGeneration = 0;
let disposed = false;
let renderFrames = 0;
let lastFrameTime = performance.now();

function colorForCategory(category: PointCategory): number {
  if (category === "bearing") return 0xffc45d;
  if (category === "ball") return 0x8bd5ff;
  if (category === "tie") return 0xff8fd1;
  return 0x8df0ad;
}

const handleGeometry = new THREE.SphereGeometry(0.048, 18, 12);
const handleMeshes = new Map<PointKey, THREE.Mesh>();
for (const descriptor of pointDescriptors) {
  const mesh = new THREE.Mesh(
    handleGeometry,
    new THREE.MeshStandardMaterial({
      color: colorForCategory(descriptor.category),
      emissive: colorForCategory(descriptor.category),
      emissiveIntensity: 0.22,
      roughness: 0.34,
      metalness: 0.25,
    }),
  );
  mesh.castShadow = true;
  mesh.userData.pointKey = descriptor.key;
  scene.add(mesh);
  handleMeshes.set(descriptor.key, mesh);
}

const authoredGhostMaterial = new THREE.MeshBasicMaterial({
  color: 0x8a9db2,
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
});
const derivedMaterial = new THREE.MeshStandardMaterial({
  color: 0x9eafc2,
  roughness: 0.38,
  metalness: 0.55,
});
const upperArmMaterial = new THREE.MeshStandardMaterial({
  color: 0x78c8ff,
  roughness: 0.34,
  metalness: 0.5,
});
const lowerArmMaterial = new THREE.MeshStandardMaterial({
  color: 0x5a9bd5,
  roughness: 0.34,
  metalness: 0.5,
});
const tieMaterial = new THREE.MeshStandardMaterial({
  color: 0xff8fd1,
  roughness: 0.3,
  metalness: 0.58,
});
const damperRelationMaterial = new THREE.MeshStandardMaterial({
  color: 0x8df0ad,
  roughness: 0.3,
  metalness: 0.48,
  transparent: true,
  opacity: 0.82,
});
const uprightMaterial = new THREE.MeshStandardMaterial({
  color: 0xd7e0e9,
  roughness: 0.31,
  metalness: 0.68,
});
const tireMaterial = new THREE.MeshStandardMaterial({
  color: 0x20262e,
  roughness: 0.78,
  metalness: 0.05,
});
const wheelDirectionMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5f8fb,
  emissive: 0x5f7996,
  emissiveIntensity: 0.18,
  roughness: 0.36,
  metalness: 0.42,
});

function makeRod(radius: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 12), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

const upperLegA = makeRod(0.025, upperArmMaterial);
const upperLegB = makeRod(0.025, upperArmMaterial);
const lowerLegA = makeRod(0.028, lowerArmMaterial);
const lowerLegB = makeRod(0.028, lowerArmMaterial);
const upperBearingLine = makeRod(0.018, derivedMaterial);
const lowerBearingLine = makeRod(0.018, derivedMaterial);
const tieRod = makeRod(0.019, tieMaterial);
const damperRelation = makeRod(0.015, damperRelationMaterial);

const standoffMaterial = new THREE.MeshStandardMaterial({
  color: 0x3a4756,
  roughness: 0.55,
  metalness: 0.52,
});
const standoffs = Array.from({ length: 6 }, () => makeRod(0.018, standoffMaterial));

const uprightGroup = new THREE.Group();
scene.add(uprightGroup);
const uprightBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 14), uprightMaterial);
uprightBody.castShadow = true;
uprightGroup.add(uprightBody);
const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.055, 12, 28), tireMaterial);
wheel.rotation.y = Math.PI / 2;
wheel.castShadow = true;
uprightGroup.add(wheel);
const wheelDirection = new THREE.Mesh(
  new THREE.CylinderGeometry(0.011, 0.011, 0.68, 10),
  wheelDirectionMaterial,
);
wheelDirection.rotation.x = Math.PI / 2;
uprightGroup.add(wheelDirection);

const neutralWheelGhost = new THREE.Mesh(
  new THREE.TorusGeometry(0.27, 0.012, 8, 30),
  authoredGhostMaterial,
);
neutralWheelGhost.rotation.y = Math.PI / 2;
neutralWheelGhost.visible = false;
scene.add(neutralWheelGhost);

const trailGeometry = new THREE.BufferGeometry();
const trail = new THREE.Line(
  trailGeometry,
  new THREE.LineBasicMaterial({ color: 0x77e0ff, transparent: true, opacity: 0.8 }),
);
trail.visible = false;
scene.add(trail);
let displayedTrail: THREE.Vector3[] = [];

const gizmoGroup = new THREE.Group();
gizmoGroup.visible = false;
gizmoGroup.renderOrder = 20;
scene.add(gizmoGroup);
const gizmoPickers: THREE.Object3D[] = [];
const axisVectors: Record<AxisName, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const axisColors: Record<AxisName, number> = { x: 0xff6666, y: 0x73df83, z: 0x6e9fff };

function orientAlongY(object: THREE.Object3D, direction: THREE.Vector3): void {
  if (direction.lengthSq() <= 1e-14) return;
  object.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
}

for (const axisName of Object.keys(axisVectors) as AxisName[]) {
  const axis = axisVectors[axisName];
  const color = axisColors[axisName];
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.36, 8),
    new THREE.MeshBasicMaterial({ color, depthTest: false }),
  );
  shaft.position.copy(axis).multiplyScalar(0.18);
  orientAlongY(shaft, axis);
  shaft.renderOrder = 20;
  gizmoGroup.add(shaft);

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.11, 10),
    new THREE.MeshBasicMaterial({ color, depthTest: false }),
  );
  cone.position.copy(axis).multiplyScalar(0.405);
  orientAlongY(cone, axis);
  cone.renderOrder = 20;
  gizmoGroup.add(cone);

  const picker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  picker.position.copy(axis).multiplyScalar(0.22);
  orientAlongY(picker, axis);
  picker.userData.axis = axisName;
  gizmoGroup.add(picker);
  gizmoPickers.push(picker);
}

function pointToVector(point: Readonly<Point3>): THREE.Vector3 {
  return new THREE.Vector3(point.x, point.y, point.z);
}

function quatToThree(q: Rep4DamperedCornerSnapshot["uprightRotation"]): THREE.Quaternion {
  return new THREE.Quaternion(q.v.x, q.v.y, q.v.z, q.s).normalize();
}

function setCylinderBetween(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3): void {
  const delta = b.clone().sub(a);
  const length = delta.length();
  if (!Number.isFinite(length) || length <= 1e-8) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(1, length, 1);
  orientAlongY(mesh, delta);
}

function setLocalCylinderBetween(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3): void {
  const delta = b.clone().sub(a);
  const length = delta.length();
  if (!Number.isFinite(length) || length <= 1e-8) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(1, length, 1);
  orientAlongY(mesh, delta);
}

let donorDamperFrame: THREE.Group | null = null;
let donorDamperBaseLength = 1;
let donorDamperRadialScale = 1;

function updateDonorDamper(a: THREE.Vector3, b: THREE.Vector3): void {
  if (donorDamperFrame === null) return;
  const delta = b.clone().sub(a);
  const length = delta.length();
  if (!Number.isFinite(length) || length <= 1e-8) {
    donorDamperFrame.visible = false;
    return;
  }
  donorDamperFrame.visible = true;
  donorDamperFrame.position.copy(a).add(b).multiplyScalar(0.5);
  orientAlongY(donorDamperFrame, delta);
  donorDamperFrame.scale.set(
    donorDamperRadialScale,
    length / donorDamperBaseLength,
    donorDamperRadialScale,
  );
}

async function loadDonorDamper(): Promise<void> {
  root.dataset.donorDamperLoaded = "loading";
  try {
    const gltf = await new GLTFLoader().loadAsync(DONOR_DAMPER_URL);
    if (disposed) return;
    gltf.scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 1e-5) {
      throw new Error("donor damper has no finite longitudinal extent");
    }

    const frame = new THREE.Group();
    const normalized = new THREE.Group();
    normalized.add(gltf.scene);
    gltf.scene.position.sub(center);
    frame.add(normalized);
    frame.renderOrder = 4;
    gltf.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    donorDamperBaseLength = size.y;
    const radialExtent = Math.max(size.x, size.z, 1e-4);
    donorDamperRadialScale = 0.15 / radialExtent;
    donorDamperFrame = frame;
    scene.add(frame);

    root.dataset.donorDamperLoaded = "true";
    root.dataset.donorSourceCommit = DONOR_SOURCE_COMMIT;
    donorStatus.dataset.state = "ready";
    donorStatus.textContent = "DONOR · Asset_Dumper.gltf loaded · visual-only · physicsAuthority:false";
    if (mode === "BUILD") updateBuildGeometry();
  } catch (error) {
    root.dataset.donorDamperLoaded = "false";
    donorStatus.dataset.state = "diagnosed";
    donorStatus.textContent = `DONOR FALLBACK · ${error instanceof Error ? error.message : "load failed"}`;
  }
}

function formatPoint(point: Readonly<Point3>): string {
  return `X ${point.x.toFixed(3)} · Y ${point.y.toFixed(3)} · Z ${point.z.toFixed(3)}`;
}

function formatAxis(axis: Readonly<Point3>): string {
  return `${axis.x.toFixed(2)}, ${axis.y.toFixed(2)}, ${axis.z.toFixed(2)}`;
}

function setTrail(points: THREE.Vector3[]): void {
  displayedTrail = points.map((point) => point.clone());
  trailGeometry.setFromPoints(displayedTrail.length >= 2 ? displayedTrail : []);
  trailGeometry.computeBoundingSphere();
  trail.visible = displayedTrail.length >= 2;
}

function updateFixedStandoffs(): void {
  const fixedPoints = [
    authored.twoArm.upper.inboardAWorld,
    authored.twoArm.upper.inboardBWorld,
    authored.twoArm.lower.inboardAWorld,
    authored.twoArm.lower.inboardBWorld,
    authored.chassisTiePointWorld,
    authored.damperChassisEyeWorld,
  ];
  fixedPoints.forEach((point, index) => {
    const end = pointToVector(point);
    const start = new THREE.Vector3(-0.14, end.y, end.z);
    setCylinderBetween(standoffs[index]!, start, end);
  });
}

function updateAuthoredHandles(): void {
  for (const descriptor of pointDescriptors) {
    const mesh = handleMeshes.get(descriptor.key)!;
    const point = descriptor.get(authored);
    mesh.position.set(point.x, point.y, point.z);
    mesh.visible = true;
    mesh.material = mesh.material;
  }
}

function updateRawConstruction(): void {
  updateAuthoredHandles();
  updateFixedStandoffs();

  const upperA = pointToVector(authored.twoArm.upper.inboardAWorld);
  const upperB = pointToVector(authored.twoArm.upper.inboardBWorld);
  const upperOut = pointToVector(authored.twoArm.upper.outboardWorld);
  const lowerA = pointToVector(authored.twoArm.lower.inboardAWorld);
  const lowerB = pointToVector(authored.twoArm.lower.inboardBWorld);
  const lowerOut = pointToVector(authored.twoArm.lower.outboardWorld);
  setCylinderBetween(upperBearingLine, upperA, upperB);
  setCylinderBetween(lowerBearingLine, lowerA, lowerB);
  setCylinderBetween(upperLegA, upperA, upperOut);
  setCylinderBetween(upperLegB, upperB, upperOut);
  setCylinderBetween(lowerLegA, lowerA, lowerOut);
  setCylinderBetween(lowerLegB, lowerB, lowerOut);
  setCylinderBetween(
    tieRod,
    pointToVector(authored.chassisTiePointWorld),
    pointToVector(authored.uprightTiePickupWorld),
  );
  const damperA = pointToVector(authored.damperChassisEyeWorld);
  const damperB = pointToVector(authored.damperLowerEyeWorld);
  setCylinderBetween(damperRelation, damperA, damperB);
  updateDonorDamper(damperA, damperB);
}

function updateUprightBuildVisual(relation: Rep4DamperDerivedRelation): void {
  const origin = pointToVector(relation.twoArm.uprightOriginWorld);
  const upperLocal = pointToVector(relation.twoArm.uprightUpperLocal);
  const lowerLocal = pointToVector(relation.twoArm.uprightLowerLocal);
  uprightGroup.visible = true;
  uprightGroup.position.copy(origin);
  uprightGroup.quaternion.identity();
  setLocalCylinderBetween(uprightBody, upperLocal, lowerLocal);
  wheel.position.set(0, 0, 0);
  wheelDirection.position.set(0, 0, 0);
  neutralWheelGhost.position.copy(origin);
  neutralWheelGhost.quaternion.identity();
}

function updateRootAuthoredData(): void {
  const data = root.dataset as DOMStringMap & Record<string, string>;
  data.authoredSnapshot = JSON.stringify(authored);
  for (const descriptor of pointDescriptors) {
    const point = descriptor.get(authored);
    data[`${descriptor.key}X`] = String(point.x);
    data[`${descriptor.key}Y`] = String(point.y);
    data[`${descriptor.key}Z`] = String(point.z);
  }
}

function updateBuildGeometry(): void {
  updateRawConstruction();
  try {
    derived = deriveRep4DamperRelation(toAuthority(authored));
    relationValid = true;
    updateUprightBuildVisual(derived);
    upperAxisText.textContent = `${formatAxis(derived.twoArm.upper.axisWorld)} · span ${derived.twoArm.upper.mountSpan.toFixed(3)} m`;
    lowerAxisText.textContent = `${formatAxis(derived.twoArm.lower.axisWorld)} · span ${derived.twoArm.lower.mountSpan.toFixed(3)} m`;
    tieLengthText.textContent = `${derived.tieLength.toFixed(3)} m · auto-fit neutral`;
    damperReadoutText.textContent =
      `k ${REP4_DAMPER_COMPONENT.springStiffness} · c ${REP4_DAMPER_COMPONENT.dampingCoefficient} · L0 ${REP4_DAMPER_COMPONENT.restLength.toFixed(3)} · J ${derived.rotationalJacobian.toFixed(3)}`;
    status.textContent = "READY · authored hardpoints derive one complete native corner";
    status.dataset.state = "ready";
  } catch (error) {
    derived = null;
    relationValid = false;
    uprightGroup.visible = false;
    neutralWheelGhost.visible = false;
    upperAxisText.textContent = "invalid / unresolved";
    lowerAxisText.textContent = "invalid / unresolved";
    tieLengthText.textContent = "invalid / unresolved";
    damperReadoutText.textContent = `k ${REP4_DAMPER_COMPONENT.springStiffness} · c ${REP4_DAMPER_COMPONENT.dampingCoefficient} · L0 ${REP4_DAMPER_COMPONENT.restLength.toFixed(3)}`;
    status.textContent = `DIAGNOSIS · ${error instanceof Error ? error.message : "invalid composed geometry"}`;
    status.dataset.state = "diagnosed";
  }

  if (selectedPoint !== null) {
    const point = descriptorByKey.get(selectedPoint)!.get(authored);
    gizmoGroup.position.set(point.x, point.y, point.z);
  }
  updateRootAuthoredData();
  updateSelectionUi();
  setModeUi();
}

function updateSelectionUi(): void {
  if (selectedPoint === null) {
    selectionText.textContent = "None · click a physical hardpoint";
    selectedPositionText.textContent = "—";
    root.dataset.selectedPoint = "none";
    return;
  }
  const descriptor = descriptorByKey.get(selectedPoint)!;
  const point = descriptor.get(authored);
  selectionText.textContent = `${descriptor.label} · ${descriptor.shortLabel}`;
  selectedPositionText.textContent = formatPoint(point);
  root.dataset.selectedPoint = selectedPoint;
  root.dataset.selectedWorldX = String(point.x);
  root.dataset.selectedWorldY = String(point.y);
  root.dataset.selectedWorldZ = String(point.z);
}

function selectPoint(key: PointKey | null): void {
  selectedPoint = key;
  for (const descriptor of pointDescriptors) {
    handleMeshes.get(descriptor.key)!.scale.setScalar(descriptor.key === key ? 1.35 : 1);
  }
  gizmoGroup.visible = key !== null && mode === "BUILD";
  if (key !== null) {
    const point = descriptorByKey.get(key)!.get(authored);
    gizmoGroup.position.set(point.x, point.y, point.z);
  }
  updateSelectionUi();
}

function setModeUi(): void {
  buildButton.classList.toggle("active", mode === "BUILD");
  playButton.classList.toggle("active", mode === "PLAYING" || mode === "PAUSED");
  buildButton.disabled = mode === "PREPARING";
  resetButton.disabled = mode === "PREPARING";

  if (mode === "BUILD") {
    playButton.textContent = "PLAY";
    playButton.disabled = !relationValid;
    modeLabel.textContent = "BUILD · direct hardpoint authoring";
    instruction.textContent = "Click a bright physical hardpoint, then drag world X / Y / Z. Orbit on empty space.";
    liveReadoutText.textContent = "BUILD geometry is authoritative";
  } else if (mode === "PREPARING") {
    playButton.textContent = "Preparing…";
    playButton.disabled = true;
    modeLabel.textContent = "PLAY · solving native trace";
    instruction.textContent = "The complete corner is being rebuilt from the authored geometry and stepped in Box3D.";
  } else if (mode === "PLAYING") {
    playButton.textContent = "PAUSE";
    playButton.disabled = false;
    modeLabel.textContent = "PLAY · native composed consequence";
    instruction.textContent = "Wheel/upright, arms, tie and damper are replaying the exact 1/60 s native solver trace. Camera remains free.";
  } else {
    playButton.textContent = playIndex >= playTrace.length - 1 ? "REPLAY" : "RESUME";
    playButton.disabled = false;
    modeLabel.textContent = playIndex >= playTrace.length - 1 ? "PLAY · run complete" : "PLAY · paused";
  }
  root.dataset.mode = mode;
}

function signedTwist(
  snapshot: Rep4DamperedCornerSnapshot,
  relation: Rep4DamperDerivedRelation,
): number {
  const axis = new THREE.Vector3(
    relation.twoArm.upper.outboardWorld.x - relation.twoArm.lower.outboardWorld.x,
    relation.twoArm.upper.outboardWorld.y - relation.twoArm.lower.outboardWorld.y,
    relation.twoArm.upper.outboardWorld.z - relation.twoArm.lower.outboardWorld.z,
  ).normalize();
  const q = snapshot.uprightRotation;
  const projected = q.v.x * axis.x + q.v.y * axis.y + q.v.z * axis.z;
  return Math.atan2(
    Math.sin(2 * Math.atan2(projected, q.s)),
    Math.cos(2 * Math.atan2(projected, q.s)),
  );
}

function liveTiePickup(
  snapshot: Rep4DamperedCornerSnapshot,
  relation: Rep4DamperDerivedRelation,
): THREE.Vector3 {
  const local = pointToVector(relation.uprightTiePickupLocal);
  local.applyQuaternion(quatToThree(snapshot.uprightRotation));
  return local.add(pointToVector(snapshot.uprightPositionWorld));
}

function updatePlayPose(snapshot: Rep4DamperedCornerSnapshot): void {
  if (playDerived === null) return;
  const upperA = pointToVector(authored.twoArm.upper.inboardAWorld);
  const upperB = pointToVector(authored.twoArm.upper.inboardBWorld);
  const lowerA = pointToVector(authored.twoArm.lower.inboardAWorld);
  const lowerB = pointToVector(authored.twoArm.lower.inboardBWorld);
  const upperOut = pointToVector(snapshot.upperArmOutboardWorld);
  const lowerOut = pointToVector(snapshot.lowerArmOutboardWorld);
  setCylinderBetween(upperLegA, upperA, upperOut);
  setCylinderBetween(upperLegB, upperB, upperOut);
  setCylinderBetween(lowerLegA, lowerA, lowerOut);
  setCylinderBetween(lowerLegB, lowerB, lowerOut);

  uprightGroup.visible = true;
  uprightGroup.position.copy(pointToVector(snapshot.uprightPositionWorld));
  uprightGroup.quaternion.copy(quatToThree(snapshot.uprightRotation));

  const tieEnd = liveTiePickup(snapshot, playDerived);
  setCylinderBetween(tieRod, pointToVector(authored.chassisTiePointWorld), tieEnd);

  if (snapshot.damperChassisEyeWorld !== null && snapshot.damperLowerEyeWorld !== null) {
    const damperA = pointToVector(snapshot.damperChassisEyeWorld);
    const damperB = pointToVector(snapshot.damperLowerEyeWorld);
    setCylinderBetween(damperRelation, damperA, damperB);
    updateDonorDamper(damperA, damperB);
  }

  const twist = signedTwist(snapshot, playDerived);
  liveReadoutText.textContent =
    `toe/twist ${(twist * 180 / Math.PI).toFixed(2)}° · tie ${snapshot.tieCurrentLength.toFixed(3)} m · damper ${snapshot.damperCurrentLength?.toFixed(3) ?? "—"} m`;
  root.dataset.liveUprightX = String(snapshot.uprightPositionWorld.x);
  root.dataset.liveUprightY = String(snapshot.uprightPositionWorld.y);
  root.dataset.liveUprightZ = String(snapshot.uprightPositionWorld.z);
  root.dataset.liveTwist = String(twist);
  root.dataset.liveTieLength = String(snapshot.tieCurrentLength);
  root.dataset.liveDamperLength = String(snapshot.damperCurrentLength ?? Number.NaN);
}

async function enterPlay(): Promise<void> {
  if (mode !== "BUILD" && !(mode === "PAUSED" && playIndex >= playTrace.length - 1)) return;
  if (!relationValid) return;
  const generation = ++runGeneration;
  const authoredAtRun = cloneDocument(authored);
  root.dataset.playAuthoredSnapshot = JSON.stringify(authoredAtRun);
  mode = "PREPARING";
  selectPoint(null);
  neutralWheelGhost.visible = derived !== null;
  setTrail([]);
  setModeUi();
  status.textContent = "SOLVING · authored geometry → native hinges/spherical/tie/damper";
  status.dataset.state = "working";

  try {
    const result = await runRep4DamperedCornerProbe(toAuthority(authoredAtRun), "DAMPER", 120);
    if (disposed || generation !== runGeneration) return;
    playTrace = result.trace;
    playDerived = result.derived;
    playIndex = 0;
    playAccumulator = 0;
    root.dataset.playTracePoints = String(playTrace.length);
    root.dataset.playMaxUprightDisplacement = String(result.maxUprightDisplacement);
    let maxAbsTwist = 0;
    for (const snapshot of playTrace) {
      maxAbsTwist = Math.max(maxAbsTwist, Math.abs(signedTwist(snapshot, result.derived)));
    }
    root.dataset.playMaxAbsTwist = String(maxAbsTwist);
    mode = "PLAYING";
    status.textContent = "READY · exact native trace playing";
    status.dataset.state = "ready";
    if (playTrace[0] !== undefined) updatePlayPose(playTrace[0]);
    setModeUi();
  } catch (error) {
    if (generation !== runGeneration) return;
    mode = "BUILD";
    playTrace = [];
    playDerived = null;
    neutralWheelGhost.visible = false;
    status.textContent = `DIAGNOSIS · ${error instanceof Error ? error.message : "native composed run failed"}`;
    status.dataset.state = "diagnosed";
    updateBuildGeometry();
  }
}

function returnToBuild(): void {
  ++runGeneration;
  mode = "BUILD";
  playTrace = [];
  playDerived = null;
  playIndex = 0;
  playAccumulator = 0;
  neutralWheelGhost.visible = false;
  setTrail([]);
  updateBuildGeometry();
  gizmoGroup.visible = selectedPoint !== null;
  setModeUi();
}

function resetDocument(): void {
  ++runGeneration;
  authored = cloneDocument(baseline);
  mode = "BUILD";
  playTrace = [];
  playDerived = null;
  playIndex = 0;
  playAccumulator = 0;
  neutralWheelGhost.visible = false;
  setTrail([]);
  selectPoint(null);
  updateBuildGeometry();
}

function togglePlayPause(): void {
  if (mode === "BUILD") {
    void enterPlay();
  } else if (mode === "PLAYING") {
    mode = "PAUSED";
    status.textContent = "PAUSED · BUILD recovers the exact authored construction";
    status.dataset.state = "ready";
    setModeUi();
  } else if (mode === "PAUSED") {
    if (playIndex >= playTrace.length - 1) {
      mode = "BUILD";
      void enterPlay();
    } else {
      mode = "PLAYING";
      status.textContent = "READY · exact native trace playing";
      status.dataset.state = "ready";
      setModeUi();
    }
  }
}

buildButton.addEventListener("click", returnToBuild);
playButton.addEventListener("click", togglePlayPause);
resetButton.addEventListener("click", resetDocument);

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
  if (selectedPoint === null) return;
  const point = descriptorByKey.get(selectedPoint)!.get(authored);
  dragAxisName = axisName;
  dragPointerId = event.pointerId;
  dragStartPosition.set(point.x, point.y, point.z);
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
  if (dragAxisName === null || selectedPoint === null) return;
  const pointerDelta = new THREE.Vector2(event.clientX, event.clientY).sub(dragStartClient);
  const worldDelta = pointerDelta.dot(dragScreenDirection) / dragPixelsPerWorld;
  const next = dragStartPosition.clone().addScaledVector(
    axisVectors[dragAxisName],
    THREE.MathUtils.clamp(worldDelta, -2.5, 2.5),
  );
  descriptorByKey.get(selectedPoint)!.set(authored, { x: next.x, y: next.y, z: next.z });
  updateBuildGeometry();
}

function finishAxisDrag(event?: PointerEvent): void {
  if (dragAxisName === null) return;
  dragAxisName = null;
  orbit.enabled = true;
  canvas.classList.remove("dragging-gizmo");
  root.dataset.dragAxis = "none";
  if (
    event !== undefined &&
    event.pointerId === dragPointerId &&
    canvas.hasPointerCapture(event.pointerId)
  ) {
    canvas.releasePointerCapture(event.pointerId);
  }
  dragPointerId = -1;
}

canvas.addEventListener("pointerdown", (event) => {
  if (mode !== "BUILD") return;
  pointerToNdc(event.clientX, event.clientY);
  raycaster.setFromCamera(pointerNdc, camera);

  if (selectedPoint !== null && gizmoGroup.visible) {
    const gizmoHit = raycaster.intersectObjects(gizmoPickers, false)[0];
    if (gizmoHit !== undefined) {
      startAxisDrag(gizmoHit.object.userData.axis as AxisName, event);
      return;
    }
  }

  const handleHit = raycaster.intersectObjects([...handleMeshes.values()], false)[0];
  if (handleHit !== undefined) {
    selectPoint(handleHit.object.userData.pointKey as PointKey);
    event.preventDefault();
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
  const data = root.dataset as DOMStringMap & Record<string, string>;
  for (const descriptor of pointDescriptors) {
    const mesh = handleMeshes.get(descriptor.key)!;
    const screen = worldToClient(mesh.position);
    data[`${descriptor.key}ScreenX`] = String(screen.x);
    data[`${descriptor.key}ScreenY`] = String(screen.y);
  }

  if (selectedPoint !== null && mode === "BUILD") {
    const point = pointToVector(descriptorByKey.get(selectedPoint)!.get(authored));
    const selectedScreen = worldToClient(point);
    data.selectedScreenX = String(selectedScreen.x);
    data.selectedScreenY = String(selectedScreen.y);
    for (const axisName of Object.keys(axisVectors) as AxisName[]) {
      const screen = worldToClient(point.clone().addScaledVector(axisVectors[axisName], 0.22));
      data[`gizmo${axisName.toUpperCase()}ScreenX`] = String(screen.x);
      data[`gizmo${axisName.toUpperCase()}ScreenY`] = String(screen.y);
    }
  }

  data.cameraX = String(camera.position.x);
  data.cameraY = String(camera.position.y);
  data.cameraZ = String(camera.position.z);
  data.renderFrames = String(renderFrames);
}

function animate(time: number): void {
  if (disposed) return;
  const dt = Math.min(0.1, Math.max(0, (time - lastFrameTime) / 1000));
  lastFrameTime = time;
  orbit.update();

  if (mode === "PLAYING" && playTrace.length > 0) {
    playAccumulator += dt;
    while (playAccumulator >= 1 / 60 && playIndex < playTrace.length - 1) {
      playAccumulator -= 1 / 60;
      playIndex += 1;
    }
    const snapshot = playTrace[Math.min(playIndex, playTrace.length - 1)]!;
    updatePlayPose(snapshot);
    const trailPoints = playTrace
      .slice(0, playIndex + 1)
      .map((state) => pointToVector(state.uprightPositionWorld));
    setTrail(trailPoints);
    root.dataset.playIndex = String(playIndex);
    if (playIndex >= playTrace.length - 1) {
      mode = "PAUSED";
      status.textContent = "RUN COMPLETE · BUILD to edit the same authored construction";
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

root.dataset.dragAxis = "none";
root.dataset.donorSourceCommit = DONOR_SOURCE_COMMIT;
selectPoint(null);
setTrail([]);
updateBuildGeometry();
setModeUi();
void loadDonorDamper();
requestAnimationFrame(animate);
