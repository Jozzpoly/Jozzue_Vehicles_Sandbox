import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import "./style.css";
import { E1EditSession } from "./edit-session.js";
import { evaluateDirectPlay, type E1EvaluationFrame, type E1PlayResult } from "./evaluator.js";
import type { E1Document, E1Vec3 } from "./model.js";
import { createE1DirectBaseline } from "./scenario.js";
import { E1ThreeProjection } from "./three-projection.js";

type E1Mode = "build" | "play";

const rootCandidate = document.querySelector<HTMLDivElement>("#app");
if (!rootCandidate) {
  throw new Error("Missing #app root.");
}
const root = rootCandidate;

root.innerHTML = `
  <main class="e1-shell">
    <div class="e1-viewport" data-testid="viewport"></div>
    <div class="e1-toolbar">
      <div class="e1-actions">
        <button class="e1-button" data-testid="undo">UNDO</button>
        <button class="e1-button" data-testid="edit-mount">EDIT MOUNT</button>
      </div>
      <div class="e1-mode" aria-label="Evaluation mode">
        <button class="e1-button" data-testid="build" data-mode="build" data-active="true">BUILD</button>
        <button class="e1-button" data-testid="play" data-mode="play" data-active="false">PLAY</button>
      </div>
      <div class="e1-view-actions">
        <button class="e1-button" data-testid="reset-view">RESET VIEW</button>
      </div>
    </div>
    <section class="e1-inspector" data-testid="inspector" data-open="true">
      <div class="e1-eyebrow">AUTHORED HARDPOINT</div>
      <h2>Damper upper mount</h2>
      <p>Drag the 3D gizmo. Release commits one edit; Escape cancels the preview.</p>
      <div class="e1-vector">
        <div class="e1-coordinate"><label for="e1-x">X</label><input id="e1-x" data-axis="x" type="number" step="0.1" /></div>
        <div class="e1-coordinate"><label for="e1-y">Y</label><input id="e1-y" data-axis="y" type="number" step="0.1" /></div>
        <div class="e1-coordinate"><label for="e1-z">Z</label><input id="e1-z" data-axis="z" type="number" step="0.1" /></div>
      </div>
    </section>
    <div class="e1-hint"><strong>BUILD</strong> edits authored geometry. <strong>PLAY</strong> evaluates a fresh deterministic cycle without changing it.</div>
    <div class="e1-badge">E1-LOCAL · PROVISIONAL</div>
    <footer class="e1-status" data-testid="status" data-kind="build">
      <div class="e1-state"><span class="e1-dot"></span><span data-testid="state-label">BUILD · Ready</span></div>
      <div class="e1-message" data-testid="message">Upper mount selected. Drag it, then PLAY to inspect the causal change.</div>
      <div class="e1-metric" data-testid="metric">Damper 0.000 m</div>
    </footer>
  </main>
`;

function requiredElement<T extends Element>(selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing E1 UI element: ${selector}`);
  }
  return element;
}

const viewport = requiredElement<HTMLDivElement>("[data-testid='viewport']");
const buildButton = requiredElement<HTMLButtonElement>("[data-testid='build']");
const playButton = requiredElement<HTMLButtonElement>("[data-testid='play']");
const undoButton = requiredElement<HTMLButtonElement>("[data-testid='undo']");
const editMountButton = requiredElement<HTMLButtonElement>("[data-testid='edit-mount']");
const resetViewButton = requiredElement<HTMLButtonElement>("[data-testid='reset-view']");
const inspector = requiredElement<HTMLElement>("[data-testid='inspector']");
const status = requiredElement<HTMLElement>("[data-testid='status']");
const stateLabel = requiredElement<HTMLElement>("[data-testid='state-label']");
const message = requiredElement<HTMLElement>("[data-testid='message']");
const metric = requiredElement<HTMLElement>("[data-testid='metric']");
const coordinateInputs = Array.from(root.querySelectorAll<HTMLInputElement>("[data-axis]"));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f12);
scene.fog = new THREE.Fog(0x0b0f12, 11, 24);

const camera = new THREE.PerspectiveCamera(43, 1, 0.05, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
viewport.append(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(0, 1.35, 0);
orbit.minDistance = 3;
orbit.maxDistance = 16;

function resetView(): void {
  camera.position.set(6.5, 4.4, 7.2);
  orbit.target.set(0, 1.4, 0);
  orbit.update();
}
resetView();

scene.add(new THREE.HemisphereLight(0xc5d6dc, 0x131a1e, 1.55));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(5, 9, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1536, 1536);
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
scene.add(keyLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x141a1e, roughness: 0.92, metalness: 0.06 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(30, 60, 0x34454d, 0x1d282e);
grid.position.y = 0.004;
scene.add(grid);

const projection = new E1ThreeProjection();
scene.add(projection.root);

const transform = new TransformControls(camera, renderer.domElement);
transform.setMode("translate");
transform.setSpace("world");
transform.setSize(0.82);
scene.add(transform.getHelper());

const initialDocument = createE1DirectBaseline();
const session = new E1EditSession(initialDocument);
let mode: E1Mode = "build";
let selected = true;
let playResult: E1PlayResult | null = null;
let playStartedAt = 0;
let currentPlayFrame: E1EvaluationFrame | null = null;
let transformDragging = false;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function updateCoordinateInputs(document: E1Document): void {
  for (const input of coordinateInputs) {
    const axis = input.dataset.axis as keyof E1Vec3;
    if (document.damper.upperHardpoint[axis] !== undefined) {
      input.value = document.damper.upperHardpoint[axis].toFixed(2);
    }
    input.disabled = mode !== "build";
  }
}

function selectMount(nextSelected: boolean): void {
  selected = nextSelected;
  projection.setSelected(selected);
  inspector.dataset.open = String(selected && mode === "build");
  if (selected && mode === "build") {
    transform.attach(projection.upperHardpointHandle);
  } else {
    transform.detach();
  }
}

function setStatus(kind: "build" | "play" | "warning", label: string, detail: string): void {
  status.dataset.kind = kind;
  stateLabel.textContent = label;
  message.textContent = detail;
}

function renderBuildState(detail = "Upper mount selected. Drag it, then PLAY to inspect the causal change."): void {
  const document = session.document;
  projection.renderBuild(document);
  updateCoordinateInputs(document);
  undoButton.disabled = session.historyLength === 0;
  metric.textContent = `Revision ${document.revision} · ${session.historyLength} edit${session.historyLength === 1 ? "" : "s"}`;
  setStatus("build", session.hasPreview ? "BUILD · Preview" : "BUILD · Ready", detail);
}

function beginHardpointPreview(): void {
  if (!session.hasPreview) {
    session.beginPreview("upper-hardpoint-drag");
  }
}

function previewHardpoint(position: THREE.Vector3): void {
  beginHardpointPreview();
  session.updatePreview((draft) => ({
    ...draft,
    damper: {
      ...draft.damper,
      upperHardpoint: { x: position.x, y: position.y, z: position.z },
    },
  }));
  renderBuildState("Preview only · release to commit or press Escape to cancel.");
}

function commitHardpointPreview(): void {
  const committed = session.commitPreview();
  renderBuildState(committed ? "Hardpoint edit committed as one reversible action." : "No authored change to commit.");
  projection.syncHandleToAuthored(session.document);
}

function cancelHardpointPreview(): void {
  if (!session.cancelPreview()) {
    return;
  }
  renderBuildState("Preview cancelled. Authored state and history are unchanged.");
  projection.syncHandleToAuthored(session.document);
}

function enterBuild(): void {
  mode = "build";
  playResult = null;
  currentPlayFrame = null;
  buildButton.dataset.active = "true";
  playButton.dataset.active = "false";
  inspector.dataset.open = String(selected);
  selectMount(selected);
  renderBuildState("Exact authored construction recovered; PLAY did not change its revision or history.");
}

function enterPlay(): void {
  cancelHardpointPreview();
  mode = "play";
  buildButton.dataset.active = "false";
  playButton.dataset.active = "true";
  inspector.dataset.open = "false";
  transform.detach();
  playResult = evaluateDirectPlay(session.committedDocument);
  playStartedAt = performance.now();
  const diagnostic = playResult.diagnostics[0];
  if (diagnostic) {
    setStatus("warning", "PLAY · Diagnosed static", diagnostic.message);
  } else {
    setStatus("play", "PLAY · Deterministic cycle", "The entire supported chain is evaluated from authored geometry.");
  }
  updateCoordinateInputs(session.committedDocument);
}

transform.addEventListener("dragging-changed", (event) => {
  const dragging = Boolean((event as unknown as { value: boolean }).value);
  transformDragging = dragging;
  orbit.enabled = !dragging;
});
transform.addEventListener("mouseDown", () => beginHardpointPreview());
transform.addEventListener("objectChange", () => previewHardpoint(projection.upperHardpointHandle.position));
transform.addEventListener("mouseUp", () => commitHardpointPreview());

renderer.domElement.addEventListener("click", (event) => {
  if (mode !== "build" || transformDragging) {
    return;
  }
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  selectMount(raycaster.intersectObjects(projection.pickTargets, false).length > 0);
});

for (const input of coordinateInputs) {
  input.addEventListener("change", () => {
    if (mode !== "build") {
      return;
    }
    const axis = input.dataset.axis as keyof E1Vec3;
    const value = Number(input.value);
    if (!Number.isFinite(value)) {
      updateCoordinateInputs(session.document);
      return;
    }
    beginHardpointPreview();
    const before = session.document.damper.upperHardpoint;
    const next = { ...before, [axis]: value };
    previewHardpoint(new THREE.Vector3(next.x, next.y, next.z));
    commitHardpointPreview();
  });
}

undoButton.addEventListener("click", () => {
  if (mode !== "build") {
    return;
  }
  const undone = session.undo();
  renderBuildState(undone ? "Last authored edit undone exactly." : "Nothing to undo.");
  projection.syncHandleToAuthored(session.document);
});
editMountButton.addEventListener("click", () => selectMount(true));
buildButton.addEventListener("click", enterBuild);
playButton.addEventListener("click", enterPlay);
resetViewButton.addEventListener("click", resetView);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mode === "build") {
    cancelHardpointPreview();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && mode === "build") {
    event.preventDefault();
    if (session.undo()) {
      renderBuildState("Last authored edit undone exactly.");
      projection.syncHandleToAuthored(session.document);
    }
  }
});

function resize(): void {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(viewport);
resize();

function animate(time: number): void {
  requestAnimationFrame(animate);
  orbit.update();
  if (mode === "play" && playResult) {
    const durationMs = 4000;
    const phase = ((time - playStartedAt) % durationMs) / durationMs;
    const index = Math.min(playResult.frames.length - 1, Math.floor(phase * playResult.frames.length));
    const frame = playResult.frames[index];
    if (frame) {
      currentPlayFrame = frame;
      projection.renderFrame(frame, session.committedDocument.pivot.axis);
      metric.textContent = `Damper ${frame.damperLength.toFixed(3)} m`;
      if (frame.status !== "resolved" && frame.diagnostics[0]) {
        setStatus("warning", `PLAY · ${frame.status}`, frame.diagnostics[0].message);
      }
    }
  }
  renderer.render(scene, camera);
}

projection.renderBuild(session.document);
selectMount(true);
renderBuildState();
requestAnimationFrame(animate);
