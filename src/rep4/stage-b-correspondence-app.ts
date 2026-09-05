import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  applyC1DamperBetween,
  bindC1DamperDonor,
  type C1DamperBinding,
} from "../rep2/c1-damper-adapter.js";
import {
  runRep4DamperedCornerProbe,
  type Rep4DamperedCornerAuthority,
  type Rep4DamperedCornerResult,
} from "./dampered-corner-world.js";
import {
  projectRep4BuildFrame,
  projectRep4PlayFrame,
  rep4StageBSegmentLength,
  type Rep4StageBProjectionFrame,
  type Rep4StageBSegment,
} from "./stage-b-projection.js";

const DONOR_URL = "/assets/rep2/Asset_Dumper.gltf";
const TRACE_STEPS = 60;
const TRACE_HZ = 60;

const rootCandidate = document.querySelector<HTMLElement>("#app");
if (rootCandidate === null) throw new Error("Rep4 B1 requires #app.");
const root: HTMLElement = rootCandidate;

root.innerHTML = `
<style>
  :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; overflow: hidden; background: #090d12; color: #e8eef5; }
  .b1 { width: 100vw; height: 100vh; position: relative; }
  .b1 canvas { width: 100%; height: 100%; display: block; }
  .panel { position: absolute; top: 18px; left: 18px; width: min(390px, calc(100vw - 36px)); padding: 15px 16px; border: 1px solid #405064; border-radius: 12px; background: rgba(10,15,21,.89); backdrop-filter: blur(8px); box-shadow: 0 12px 32px rgba(0,0,0,.28); }
  .eyebrow { margin: 0 0 5px; color: #8fa6bc; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 0; font-size: 20px; font-weight: 650; }
  .sub { margin: 7px 0 12px; color: #aebdca; font-size: 13px; line-height: 1.35; }
  .buttons { display: flex; gap: 8px; margin-bottom: 11px; }
  button { appearance: none; border: 1px solid #536a81; background: #17212c; color: #eaf2fa; padding: 7px 12px; border-radius: 8px; font: inherit; cursor: pointer; }
  button.active { background: #28445d; border-color: #7898b7; }
  button:disabled { opacity: .45; cursor: default; }
  .row { display: grid; grid-template-columns: 110px 1fr; gap: 8px; padding: 4px 0; font-size: 12px; }
  .row span { color: #8398ab; }
  .row output { overflow-wrap: anywhere; }
  .legend { margin-top: 9px; padding-top: 9px; border-top: 1px solid #2c3946; color: #9fb0bf; font-size: 11px; line-height: 1.45; }
  .status-ready { color: #a9d6b3; }
  .status-error { color: #efacac; }
</style>
<main class="b1">
  <canvas data-testid="rep4-b1-canvas"></canvas>
  <aside class="panel">
    <p class="eyebrow">NEXTGEN JV · REP4 B1 · READ-ONLY CORRESPONDENCE</p>
    <h1>One authority, one visible mechanism</h1>
    <p class="sub">This is not the Owner checkpoint. It only verifies that BUILD hardpoints and native PLAY snapshots can drive the same visible A-arms, upright, tie and qualified donor damper.</p>
    <div class="buttons">
      <button data-testid="b1-build" class="active">BUILD</button>
      <button data-testid="b1-play" disabled>PLAY TRACE</button>
    </div>
    <div class="row"><span>phase</span><output data-testid="b1-phase">BUILD</output></div>
    <div class="row"><span>native trace</span><output data-testid="b1-trace">preparing…</output></div>
    <div class="row"><span>donor damper</span><output data-testid="b1-donor">loading…</output></div>
    <div class="row"><span>tie length</span><output data-testid="b1-tie">—</output></div>
    <div class="row"><span>damper length</span><output data-testid="b1-damper">—</output></div>
    <div class="row"><span>ball gaps</span><output data-testid="b1-gaps">—</output></div>
    <p class="legend">Bright spheres are authored BUILD hardpoints. Solid A-arm/upright/tie geometry is projected only from current authority/native observer state. The real Rep2 Asset_Dumper donor is projected with the already-qualified C1 endpoint adapter.</p>
  </aside>
</main>`;

const canvas = root.querySelector<HTMLCanvasElement>("[data-testid='rep4-b1-canvas']")!;
const buildButton = root.querySelector<HTMLButtonElement>("[data-testid='b1-build']")!;
const playButton = root.querySelector<HTMLButtonElement>("[data-testid='b1-play']")!;
const phaseOutput = root.querySelector<HTMLOutputElement>("[data-testid='b1-phase']")!;
const traceOutput = root.querySelector<HTMLOutputElement>("[data-testid='b1-trace']")!;
const donorOutput = root.querySelector<HTMLOutputElement>("[data-testid='b1-donor']")!;
const tieOutput = root.querySelector<HTMLOutputElement>("[data-testid='b1-tie']")!;
const damperOutput = root.querySelector<HTMLOutputElement>("[data-testid='b1-damper']")!;
const gapsOutput = root.querySelector<HTMLOutputElement>("[data-testid='b1-gaps']")!;

const authority: Rep4DamperedCornerAuthority = Object.freeze({
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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090d12);
const camera = new THREE.PerspectiveCamera(42, 1, 0.02, 30);
camera.position.set(2.25, 1.25, 2.45);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

const orbit = new OrbitControls(camera, canvas);
orbit.target.set(0.32, -0.04, 0);
orbit.enableDamping = true;
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
scene.add(new THREE.GridHelper(5, 20, 0x45586b, 0x202b35));
const grid = scene.children[scene.children.length - 1]!;
grid.position.y = -0.675;

const support = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 1.25, 0.86),
  new THREE.MeshStandardMaterial({ color: 0x37414d, roughness: 0.5, metalness: 0.5 }),
);
support.position.set(-0.12, 0, 0);
scene.add(support);

function segmentMesh(radius: number, color: number): THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial> {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 1, 14),
    new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.35 }),
  );
}

const upperMeshes = [segmentMesh(0.035, 0xaab7c5), segmentMesh(0.035, 0xaab7c5)] as const;
const lowerMeshes = [segmentMesh(0.04, 0x8798a8), segmentMesh(0.04, 0x8798a8)] as const;
const uprightMesh = segmentMesh(0.055, 0xd3dce5);
const tieMesh = segmentMesh(0.018, 0xe0b878);
const fallbackDamperMesh = segmentMesh(0.027, 0xb586cb);
for (const mesh of [...upperMeshes, ...lowerMeshes, uprightMesh, tieMesh, fallbackDamperMesh]) {
  mesh.castShadow = true;
  scene.add(mesh);
}

const wheel = new THREE.Mesh(
  new THREE.TorusGeometry(0.29, 0.055, 12, 30),
  new THREE.MeshStandardMaterial({ color: 0x26313b, roughness: 0.7, metalness: 0.15 }),
);
scene.add(wheel);

const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xe7f0f7, roughness: 0.3, metalness: 0.05 });
const authoredPoints = [
  authority.twoArm.upper.inboardAWorld,
  authority.twoArm.upper.inboardBWorld,
  authority.twoArm.upper.outboardWorld,
  authority.twoArm.lower.inboardAWorld,
  authority.twoArm.lower.inboardBWorld,
  authority.twoArm.lower.outboardWorld,
  authority.chassisTiePointWorld,
  authority.uprightTiePickupWorld,
  authority.damperChassisEyeWorld,
  authority.damperLowerEyeWorld,
];
for (const p of authoredPoints) {
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10), handleMaterial);
  marker.position.set(p.x, p.y, p.z);
  scene.add(marker);
}

function setSegment(mesh: THREE.Object3D, value: Rep4StageBSegment): void {
  const a = new THREE.Vector3(value.a.x, value.a.y, value.a.z);
  const b = new THREE.Vector3(value.b.x, value.b.y, value.b.z);
  const delta = b.clone().sub(a);
  const length = delta.length();
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  mesh.scale.set(1, length, 1);
}

let damperBinding: C1DamperBinding | null = null;
let nativeResult: Rep4DamperedCornerResult | null = null;
let frameIndex = 0;
let phase: "BUILD" | "PLAY" = "BUILD";
let playbackStartedAt = 0;

interface Rep4B1Evidence {
  status: "loading" | "ready" | "error";
  phase: "BUILD" | "PLAY";
  donorReady: boolean;
  traceReady: boolean;
  traceLength: number;
  frameIndex: number;
  tieVisibleLength: number;
  damperVisibleLength: number;
  upperBallGap: number;
  lowerBallGap: number;
  error?: string;
}

declare global {
  interface Window { __REP4_B1__?: Rep4B1Evidence; }
}

function publish(frame: Rep4StageBProjectionFrame): void {
  const evidence: Rep4B1Evidence = {
    status: nativeResult !== null ? "ready" : "loading",
    phase,
    donorReady: damperBinding !== null,
    traceReady: nativeResult !== null,
    traceLength: nativeResult?.trace.length ?? 0,
    frameIndex,
    tieVisibleLength: rep4StageBSegmentLength(frame.tie),
    damperVisibleLength: rep4StageBSegmentLength(frame.damper),
    upperBallGap: frame.upperBallConstraintGap,
    lowerBallGap: frame.lowerBallConstraintGap,
  };
  window.__REP4_B1__ = evidence;
  root.dataset.phase = phase;
  root.dataset.donorReady = String(evidence.donorReady);
  root.dataset.traceReady = String(evidence.traceReady);
  root.dataset.frameIndex = String(frameIndex);
}

function renderProjection(frame: Rep4StageBProjectionFrame): void {
  setSegment(upperMeshes[0], frame.upperArm[0]);
  setSegment(upperMeshes[1], frame.upperArm[1]);
  setSegment(lowerMeshes[0], frame.lowerArm[0]);
  setSegment(lowerMeshes[1], frame.lowerArm[1]);
  setSegment(uprightMesh, frame.upright);
  setSegment(tieMesh, frame.tie);
  wheel.position.set(frame.wheelCenter.x, frame.wheelCenter.y, frame.wheelCenter.z);

  if (damperBinding !== null) {
    fallbackDamperMesh.visible = false;
    applyC1DamperBetween(damperBinding, frame.damper.a, frame.damper.b);
  } else {
    fallbackDamperMesh.visible = true;
    setSegment(fallbackDamperMesh, frame.damper);
  }

  phaseOutput.textContent = phase;
  tieOutput.textContent = `${rep4StageBSegmentLength(frame.tie).toFixed(6)} m`;
  damperOutput.textContent = `${rep4StageBSegmentLength(frame.damper).toFixed(6)} m`;
  gapsOutput.textContent = `${frame.upperBallConstraintGap.toExponential(2)} / ${frame.lowerBallConstraintGap.toExponential(2)} m`;
  publish(frame);
}

function showBuild(): void {
  phase = "BUILD";
  frameIndex = 0;
  buildButton.classList.add("active");
  playButton.classList.remove("active");
  renderProjection(projectRep4BuildFrame(authority));
}

function startPlay(): void {
  if (nativeResult === null) return;
  phase = "PLAY";
  frameIndex = 0;
  playbackStartedAt = performance.now();
  buildButton.classList.remove("active");
  playButton.classList.add("active");
  renderProjection(projectRep4PlayFrame(authority, nativeResult.derived, nativeResult.trace[0]!));
}

buildButton.addEventListener("click", showBuild);
playButton.addEventListener("click", startPlay);

async function prepare(): Promise<void> {
  try {
    const [result, gltf] = await Promise.all([
      runRep4DamperedCornerProbe(authority, "DAMPER", TRACE_STEPS),
      new GLTFLoader().loadAsync(DONOR_URL),
    ]);
    nativeResult = result;
    damperBinding = bindC1DamperDonor(gltf.scene);
    scene.add(gltf.scene);
    traceOutput.textContent = `${result.trace.length} native snapshots · ${TRACE_HZ} Hz`;
    donorOutput.textContent = "READY · Rep2 Asset_Dumper + qualified C1 adapter";
    donorOutput.className = "status-ready";
    playButton.disabled = false;
    showBuild();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    donorOutput.textContent = `ERROR · ${message}`;
    donorOutput.className = "status-error";
    traceOutput.textContent = "not qualified";
    window.__REP4_B1__ = {
      status: "error",
      phase,
      donorReady: false,
      traceReady: nativeResult !== null,
      traceLength: nativeResult?.trace.length ?? 0,
      frameIndex,
      tieVisibleLength: 0,
      damperVisibleLength: 0,
      upperBallGap: 0,
      lowerBallGap: 0,
      error: message,
    };
  }
}

function resize(): void {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate(now: number): void {
  resize();
  if (phase === "PLAY" && nativeResult !== null) {
    frameIndex = Math.max(
      0,
      Math.min(
        nativeResult.trace.length - 1,
        Math.floor(((now - playbackStartedAt) / 1000) * TRACE_HZ),
      ),
    );
    renderProjection(projectRep4PlayFrame(authority, nativeResult.derived, nativeResult.trace[frameIndex]!));
    if (frameIndex >= nativeResult.trace.length - 1) {
      showBuild();
    }
  }
  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

showBuild();
void prepare();
requestAnimationFrame(animate);
