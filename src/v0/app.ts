import "./style.css";
import { PhysicalSteeringWorld } from "./physical-steering-world.js";
import { V0Projection } from "./projection.js";
import type { SteeringVariantId } from "./steering-geometry.js";

document.title = "JV Front Steering V0";

const root = document.querySelector<HTMLDivElement>("#app");
if (root === null) throw new Error("V0 app root is missing.");

root.innerHTML = `
  <main class="v0-shell">
    <header class="v0-header">
      <div>
        <p class="eyebrow">NEXTGEN JV · V0</p>
        <h1>Physical Steering Truth Loop</h1>
        <p class="subtitle">Rack → physical tie-rods → knuckles → wheel contact → trajectory</p>
      </div>
      <div class="variant-controls" aria-label="Geometry variant">
        <button data-testid="variant-a" data-variant="A">A · short arm</button>
        <button data-testid="variant-b" data-variant="B">B · long arm</button>
        <button data-testid="reset">Reset</button>
      </div>
    </header>
    <section class="v0-stage">
      <canvas data-testid="v0-viewport"></canvas>
      <aside class="truth-card">
        <p class="truth-label">ACTIVE TRUTH</p>
        <strong data-testid="active-variant">Variant A</strong>
        <p>Orange: rack/arms · Cyan: physical fixed-length tie-rods</p>
        <dl>
          <div><dt>Rack</dt><dd data-testid="rack">0.0 mm</dd></div>
          <div><dt>Wheel L / R</dt><dd data-testid="angles">0.0° / 0.0°</dd></div>
          <div><dt>Oracle residual</dt><dd data-testid="residual">0.00°</dd></div>
          <div><dt>Tie-rod error</dt><dd data-testid="tie-error">0.00 mm</dd></div>
          <div><dt>Distance</dt><dd data-testid="distance">0.00 m</dd></div>
          <div><dt>Session curvature</dt><dd data-testid="curvature">0.000 rad/m</dd></div>
          <div><dt>Wheel contacts</dt><dd data-testid="contacts">0 / 0 / world 0</dd></div>
        </dl>
      </aside>
      <div class="drive-pad" aria-label="Driving controls">
        <button data-hold="left" aria-label="Steer left">◀</button>
        <button data-hold="forward" class="forward" aria-label="Drive forward">▲</button>
        <button data-hold="right" aria-label="Steer right">▶</button>
        <button data-hold="reverse" class="reverse" aria-label="Drive reverse">▼</button>
      </div>
      <p class="key-help">W/S or ↑/↓ drive · A/D or ←/→ steer · R reset</p>
    </section>
    <footer>
      <span data-testid="runtime-status">Starting physical runtime…</span>
      <span>Disposable low-speed spherical contact · no suspension</span>
    </footer>
  </main>
`;

const required = <T extends Element>(selector: string): T => {
  const value = root.querySelector<T>(selector);
  if (value === null) throw new Error(`Missing V0 UI element: ${selector}`);
  return value;
};

const canvas = required<HTMLCanvasElement>("canvas");
const projection = new V0Projection(canvas);
const held = new Set<string>();
let steeringCommand = 0;
let variant: SteeringVariantId = "A";
let world = await PhysicalSteeringWorld.create(variant);
let trace = world.trace();
let disposed = false;
let lastTime = performance.now();
let accumulator = 0;
let resetGeneration = 0;

const status = required<HTMLElement>("[data-testid='runtime-status']");
status.textContent = "READY · physical linkage owns steering";
status.dataset.state = "ready";

function inputState(): Readonly<{ steering: number; drive: number }> {
  const drive =
    (held.has("forward") || held.has("KeyW") || held.has("ArrowUp") ? 0.42 : 0) -
    (held.has("reverse") || held.has("KeyS") || held.has("ArrowDown") ? 0.3 : 0);
  return { steering: steeringCommand, drive };
}

function updateTelemetry(): void {
  const degrees = (value: number): number => (value * 180) / Math.PI;
  const maxResidual = Math.max(
    Math.abs(trace.left.oracleResidual),
    Math.abs(trace.right.oracleResidual),
  );
  const maxTieError = Math.max(
    Math.abs(trace.left.tieRodError ?? 0),
    Math.abs(trace.right.tieRodError ?? 0),
  );
  required<HTMLElement>("[data-testid='active-variant']").textContent =
    `Variant ${variant}`;
  required<HTMLElement>("[data-testid='rack']").textContent =
    `${(trace.rackTranslation * 1000).toFixed(1)} mm`;
  required<HTMLElement>("[data-testid='angles']").textContent =
    `${degrees(trace.left.steeringAngle).toFixed(1)}° / ${degrees(trace.right.steeringAngle).toFixed(1)}°`;
  required<HTMLElement>("[data-testid='residual']").textContent =
    `${degrees(maxResidual).toFixed(2)}°`;
  required<HTMLElement>("[data-testid='tie-error']").textContent =
    `${(maxTieError * 1000).toFixed(2)} mm`;
  required<HTMLElement>("[data-testid='distance']").textContent =
    `${trace.travelledDistance.toFixed(2)} m`;
  required<HTMLElement>("[data-testid='curvature']").textContent =
    `${trace.curvature.toFixed(3)} rad/m`;
  required<HTMLElement>("[data-testid='contacts']").textContent =
    `${trace.left.contactCount} / ${trace.right.contactCount} / world ${trace.worldContacts}`;
  root!.dataset.variant = variant;
  root!.dataset.rack = String(trace.rackTranslation);
  root!.dataset.distance = String(trace.travelledDistance);
  root!.dataset.curvature = String(trace.curvature);
  root!.dataset.leftAngle = String(trace.left.steeringAngle);
  root!.dataset.rightAngle = String(trace.right.steeringAngle);
  required<HTMLButtonElement>("[data-testid='variant-a']").classList.toggle(
    "active",
    variant === "A",
  );
  required<HTMLButtonElement>("[data-testid='variant-b']").classList.toggle(
    "active",
    variant === "B",
  );
}

function releaseInputs(): void {
  held.clear();
  steeringCommand = 0;
  world.setDrive(0);
  world.setSteering(0);
}

async function reset(nextVariant = variant): Promise<void> {
  const generation = ++resetGeneration;
  releaseInputs();
  const next = await PhysicalSteeringWorld.create(nextVariant);
  if (generation !== resetGeneration || disposed) {
    next.dispose();
    return;
  }
  world.dispose();
  world = next;
  variant = nextVariant;
  world.step(120);
  trace = world.trace();
  accumulator = 0;
  lastTime = performance.now();
  updateTelemetry();
}

required<HTMLButtonElement>("[data-testid='variant-a']").addEventListener(
  "click",
  () => void reset("A"),
);
required<HTMLButtonElement>("[data-testid='variant-b']").addEventListener(
  "click",
  () => void reset("B"),
);
required<HTMLButtonElement>("[data-testid='reset']").addEventListener(
  "click",
  () => void reset(),
);

for (const button of root.querySelectorAll<HTMLButtonElement>("[data-hold]")) {
  const id = button.dataset.hold!;
  const release = (): void => {
    held.delete(id);
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerdown", (event) => {
    button.setPointerCapture(event.pointerId);
    held.add(id);
    if (id === "left") steeringCommand = -1;
    if (id === "right") steeringCommand = 1;
    button.classList.add("pressed");
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyR") {
    void reset();
    return;
  }
  if (event.code === "KeyA" || event.code === "ArrowLeft") {
    steeringCommand = -1;
  }
  if (event.code === "KeyD" || event.code === "ArrowRight") {
    steeringCommand = 1;
  }
  held.add(event.code);
  if (event.code.startsWith("Arrow")) event.preventDefault();
});
window.addEventListener("keyup", (event) => held.delete(event.code));
window.addEventListener("blur", releaseInputs);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) releaseInputs();
});

function animate(time: number): void {
  if (disposed) return;
  accumulator += Math.min(0.1, Math.max(0, (time - lastTime) / 1000));
  lastTime = time;
  const input = inputState();
  world.setSteering(input.steering);
  world.setDrive(input.drive);
  let steps = 0;
  while (accumulator >= 1 / 60 && steps < 6) {
    trace = world.step();
    accumulator -= 1 / 60;
    steps += 1;
  }
  projection.render(trace);
  updateTelemetry();
  requestAnimationFrame(animate);
}

window.addEventListener(
  "pagehide",
  () => {
    disposed = true;
    world.dispose();
    projection.dispose();
  },
  { once: true },
);

world.step(120);
trace = world.trace();
updateTelemetry();
requestAnimationFrame(animate);
