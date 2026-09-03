import "./style.css";
import { PhysicalSteeringWorld } from "../v0/physical-steering-world.js";
import { V0Projection } from "../v0/projection.js";
import {
  createAuthoredSteeringGeometry,
  type PlanarPoint,
  type SteeringSide,
} from "../v0/steering-geometry.js";

document.title = "JV R1 Direct Steering Pickup";

const root = document.querySelector<HTMLDivElement>("#app");
if (root === null) throw new Error("R1 app root is missing.");

root.innerHTML = `
  <main class="r1-shell">
    <header class="r1-header">
      <div>
        <p class="eyebrow">NEXTGEN JV · BOUNDED R1 EXPERIMENT</p>
        <h1>Direct steering construction</h1>
        <p class="subtitle">Author a real linkage point → drive the physical consequence → recover the exact build.</p>
      </div>
      <nav class="mode-controls" aria-label="Experiment mode">
        <button data-testid="build" class="active">BUILD</button>
        <button data-testid="run">RUN / DRIVE</button>
        <button data-testid="reset-authored">Reset authored</button>
      </nav>
    </header>
    <section class="r1-stage">
      <canvas data-testid="r1-viewport" aria-label="Vehicle steering linkage authoring viewport"></canvas>
      <aside class="truth-card">
        <p class="truth-label">AUTHORED TRUTH</p>
        <strong data-testid="mode-label">BUILD · Direct pickup authoring</strong>
        <p data-testid="instruction">Drag either gold pickup point in the viewport. Each side has independent local X/Z; this is not a steering-arm slider.</p>
        <div class="pickup-readout">
          <div><span>LEFT pickup</span><output data-testid="left-pickup">X -0.180 · Z 0.000</output></div>
          <div><span>RIGHT pickup</span><output data-testid="right-pickup">X -0.180 · Z 0.000</output></div>
        </div>
        <p class="rule-note">Fixed: rack · axle · track · chassis. Neutral tie-rod length auto-fits these authored endpoints for this experiment only.</p>
        <dl class="drive-metrics" hidden>
          <div><dt>Rack</dt><dd data-testid="rack">0.0 mm</dd></div>
          <div><dt>Wheel L / R</dt><dd data-testid="angles">0.0° / 0.0°</dd></div>
          <div><dt>Tie-rod error</dt><dd data-testid="tie-error">0.00 mm</dd></div>
          <div><dt>Distance</dt><dd data-testid="distance">0.00 m</dd></div>
          <div><dt>Curvature</dt><dd data-testid="curvature">0.000 rad/m</dd></div>
          <div><dt>Wheel contacts</dt><dd data-testid="contacts">0 / 0 / world 0</dd></div>
        </dl>
        <p class="trail-status" data-testid="trail-status">No physical run yet</p>
      </aside>
      <div class="drive-pad" aria-label="Driving controls" hidden>
        <button data-hold="left" aria-label="Steer left">◀</button>
        <button data-hold="forward" class="forward" aria-label="Drive forward">▲</button>
        <button data-hold="right" aria-label="Steer right">▶</button>
        <button data-hold="reverse" class="reverse" aria-label="Drive reverse">▼</button>
      </div>
      <p class="key-help" hidden>W/S or ↑/↓ drive · hold A/D or ←/→ steer · C center · R reset</p>
    </section>
    <footer>
      <span data-testid="runtime-status">Preparing BUILD authoring…</span>
      <span>Physical PLAY · fixed rack / axle / track · permissive diagnosed carrier</span>
    </footer>
  </main>
`;

const required = <T extends Element>(selector: string): T => {
  const value = root.querySelector<T>(selector);
  if (value === null) throw new Error(`Missing R1 UI element: ${selector}`);
  return value;
};

const canvas = required<HTMLCanvasElement>("canvas");
const projection = new V0Projection(canvas);
const status = required<HTMLElement>("[data-testid='runtime-status']");
const metrics = required<HTMLElement>(".drive-metrics");
const drivePad = required<HTMLElement>(".drive-pad");
const keyHelp = required<HTMLElement>(".key-help");
const buildButton = required<HTMLButtonElement>("[data-testid='build']");
const runButton = required<HTMLButtonElement>("[data-testid='run']");
const held = new Set<string>();
const fixedStepSeconds = 1 / 60;
const steeringTargetRate = 1;
const forwardDrive = 0.58;
const reverseDrive = 0.42;
const baselinePickups = Object.freeze({
  LEFT: Object.freeze({ x: -0.18, z: 0 }),
  RIGHT: Object.freeze({ x: -0.18, z: 0 }),
});

type R1Mode = "BUILD" | "DRIVE";
let authored = createAuthoredSteeringGeometry(
  baselinePickups.LEFT,
  baselinePickups.RIGHT,
);
let mode: R1Mode = "BUILD";
let world: PhysicalSteeringWorld | null = null;
let trace = null as Awaited<ReturnType<PhysicalSteeringWorld["trace"]>> | null;
let steeringCommand = 0;
let draggingSide: SteeringSide | null = null;
let disposed = false;
let lastTime = performance.now();
let accumulator = 0;
let hadPhysicalRun = false;

function formatPickup(point: PlanarPoint): string {
  return `X ${point.x.toFixed(3)} · Z ${point.z.toFixed(3)}`;
}

function setModeControls(): void {
  buildButton.classList.toggle("active", mode === "BUILD");
  runButton.classList.toggle("active", mode === "DRIVE");
  metrics.hidden = mode !== "DRIVE";
  drivePad.hidden = mode !== "DRIVE";
  keyHelp.hidden = mode !== "DRIVE";
  required<HTMLElement>("[data-testid='mode-label']").textContent =
    mode === "BUILD" ? "BUILD · Direct pickup authoring" : "DRIVE · Physical linkage";
  required<HTMLElement>("[data-testid='instruction']").textContent =
    mode === "BUILD"
      ? "Drag either gold pickup point in the viewport. Each side has independent local X/Z; this is not a steering-arm slider."
      : "Drive with the physical rack and tie-rods. The linkage, not a hidden wheel-angle mapping, owns steering. BUILD recovers the authored points exactly.";
}

function updateAuthoredReadout(): void {
  required<HTMLElement>("[data-testid='left-pickup']").textContent = formatPickup(
    authored.pickupLocal.LEFT,
  );
  required<HTMLElement>("[data-testid='right-pickup']").textContent = formatPickup(
    authored.pickupLocal.RIGHT,
  );
  root!.dataset.leftPickupX = String(authored.pickupLocal.LEFT.x);
  root!.dataset.leftPickupZ = String(authored.pickupLocal.LEFT.z);
  root!.dataset.rightPickupX = String(authored.pickupLocal.RIGHT.x);
  root!.dataset.rightPickupZ = String(authored.pickupLocal.RIGHT.z);
  const leftScreen = projection.pickupScreenPoint("LEFT");
  const rightScreen = projection.pickupScreenPoint("RIGHT");
  root!.dataset.leftPickupScreenX = String(leftScreen.x);
  root!.dataset.leftPickupScreenY = String(leftScreen.y);
  root!.dataset.rightPickupScreenX = String(rightScreen.x);
  root!.dataset.rightPickupScreenY = String(rightScreen.y);
}

function renderBuild(): void {
  projection.renderBuild(authored);
  updateAuthoredReadout();
  root!.dataset.mode = "BUILD";
  status.textContent = hadPhysicalRun
    ? "READY · exact authored BUILD recovered"
    : "READY · authored geometry editable";
  status.dataset.state = "ready";
  required<HTMLElement>("[data-testid='trail-status']").textContent =
    hadPhysicalRun ? "Previous physical run retained as ghost" : "No physical run yet";
}

function updateDriveTelemetry(): void {
  if (trace === null) return;
  const degrees = (value: number): number => (value * 180) / Math.PI;
  const maxTieError = Math.max(
    Math.abs(trace.left.tieRodError ?? 0),
    Math.abs(trace.right.tieRodError ?? 0),
  );
  required<HTMLElement>("[data-testid='rack']").textContent =
    `${(trace.rackTranslation * 1000).toFixed(1)} mm`;
  required<HTMLElement>("[data-testid='angles']").textContent =
    `${degrees(trace.left.steeringAngle).toFixed(1)}° / ${degrees(trace.right.steeringAngle).toFixed(1)}°`;
  required<HTMLElement>("[data-testid='tie-error']").textContent =
    `${(maxTieError * 1000).toFixed(2)} mm`;
  required<HTMLElement>("[data-testid='distance']").textContent =
    `${trace.travelledDistance.toFixed(2)} m`;
  required<HTMLElement>("[data-testid='curvature']").textContent =
    `${trace.curvature.toFixed(3)} rad/m`;
  required<HTMLElement>("[data-testid='contacts']").textContent =
    `${trace.left.contactCount} / ${trace.right.contactCount} / world ${trace.worldContacts}`;
  root!.dataset.mode = "DRIVE";
  root!.dataset.rack = String(trace.rackTranslation);
  root!.dataset.distance = String(trace.travelledDistance);
  root!.dataset.curvature = String(trace.curvature);
  root!.dataset.heading = String(trace.headingRadians);
  root!.dataset.currentTrailPoints = String(projection.currentTrailPointCount);
  root!.dataset.ghostTrailPoints = String(projection.ghostTrailPointCount);
  if (trace.oracleStatus !== "VALID") {
    status.textContent = "DRIVE · diagnosed layout outside analytical oracle domain";
    status.dataset.state = "diagnosed";
  }
}

async function enterDrive(): Promise<void> {
  if (mode === "DRIVE") return;
  held.clear();
  steeringCommand = 0;
  if (world !== null) world.dispose();
  try {
    world = await PhysicalSteeringWorld.create(authored);
  } catch (error) {
    status.textContent = `DIAGNOSIS · ${error instanceof Error ? error.message : "geometry could not be instantiated"}`;
    status.dataset.state = "diagnosed";
    world = null;
    return;
  }
  if (disposed) {
    world.dispose();
    return;
  }
  projection.beginRun();
  world.step(120);
  trace = world.trace();
  mode = "DRIVE";
  hadPhysicalRun = true;
  accumulator = 0;
  lastTime = performance.now();
  setModeControls();
  status.textContent = "READY · physical linkage owns steering";
  status.dataset.state = "ready";
  required<HTMLElement>("[data-testid='trail-status']").textContent =
    projection.ghostTrailPointCount > 2
      ? "Current authored trail · previous authored ghost"
      : "Current authored trail · no previous run";
  updateDriveTelemetry();
  requestAnimationFrame(animate);
}

function returnToBuild(): void {
  if (mode === "BUILD") return;
  held.clear();
  steeringCommand = 0;
  world?.setDrive(0);
  world?.dispose();
  world = null;
  trace = null;
  mode = "BUILD";
  setModeControls();
  renderBuild();
}

function resetAuthored(): void {
  returnToBuild();
  authored = createAuthoredSteeringGeometry(
    baselinePickups.LEFT,
    baselinePickups.RIGHT,
  );
  renderBuild();
}

function updateDraggedPickup(event: PointerEvent): void {
  if (draggingSide === null || mode !== "BUILD") return;
  const point = projection.buildPickupFromPointer(
    draggingSide,
    event.clientX,
    event.clientY,
  );
  if (point === null) return;
  authored = createAuthoredSteeringGeometry(
    draggingSide === "LEFT" ? point : authored.pickupLocal.LEFT,
    draggingSide === "RIGHT" ? point : authored.pickupLocal.RIGHT,
  );
  renderBuild();
}

canvas.addEventListener("pointerdown", (event) => {
  if (mode !== "BUILD") return;
  const side = projection.pickBuildPickup(event.clientX, event.clientY);
  if (side === null) return;
  draggingSide = side;
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("dragging");
  updateDraggedPickup(event);
});
canvas.addEventListener("pointermove", updateDraggedPickup);
const releaseDrag = (event: PointerEvent): void => {
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  draggingSide = null;
  canvas.classList.remove("dragging");
};
canvas.addEventListener("pointerup", releaseDrag);
canvas.addEventListener("pointercancel", releaseDrag);

buildButton.addEventListener("click", returnToBuild);
runButton.addEventListener("click", () => void enterDrive());
required<HTMLButtonElement>("[data-testid='reset-authored']").addEventListener(
  "click",
  resetAuthored,
);

function stopActiveInputs(): void {
  held.clear();
  world?.setDrive(0);
}

for (const button of root.querySelectorAll<HTMLButtonElement>("[data-hold]")) {
  const id = button.dataset.hold!;
  const release = (): void => {
    held.delete(id);
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerdown", (event) => {
    button.setPointerCapture(event.pointerId);
    held.add(id);
    button.classList.add("pressed");
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyR") {
    resetAuthored();
    return;
  }
  if (event.code === "KeyC" && mode === "DRIVE") {
    steeringCommand = 0;
    world?.setSteering(0);
    return;
  }
  if (mode !== "DRIVE") return;
  held.add(event.code);
  if (event.code.startsWith("Arrow")) event.preventDefault();
});
window.addEventListener("keyup", (event) => held.delete(event.code));
window.addEventListener("blur", stopActiveInputs);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopActiveInputs();
});

function animate(time: number): void {
  if (disposed) return;
  if (mode !== "DRIVE" || world === null) return;
  accumulator += Math.min(0.1, Math.max(0, (time - lastTime) / 1000));
  lastTime = time;
  const steeringRate =
    (held.has("left") || held.has("KeyA") || held.has("ArrowLeft") ? 1 : 0) -
    (held.has("right") || held.has("KeyD") || held.has("ArrowRight") ? 1 : 0);
  const drive =
    (held.has("forward") || held.has("KeyW") || held.has("ArrowUp")
      ? forwardDrive
      : 0) -
    (held.has("reverse") || held.has("KeyS") || held.has("ArrowDown")
      ? reverseDrive
      : 0);
  world.setDrive(drive);
  let steps = 0;
  while (accumulator >= fixedStepSeconds && steps < 6) {
    steeringCommand = Math.max(
      -1,
      Math.min(1, steeringCommand + steeringRate * steeringTargetRate * fixedStepSeconds),
    );
    world.setSteering(steeringCommand);
    trace = world.step();
    accumulator -= fixedStepSeconds;
    steps += 1;
  }
  projection.render(trace!);
  updateDriveTelemetry();
  requestAnimationFrame(animate);
}

window.addEventListener(
  "pagehide",
  () => {
    disposed = true;
    world?.dispose();
    projection.dispose();
  },
  { once: true },
);

setModeControls();
renderBuild();
