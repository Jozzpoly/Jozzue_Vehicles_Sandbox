import "./style.css";
import {
  REP2_BASELINE_GEOMETRY,
  Rep2SuspensionLinkWorld,
  type Rep2SuspensionGeometry,
  type Rep2SuspensionTrace,
} from "./suspension-link-world.js";
import { Rep2Projection } from "./projection.js";
import type { Rep2VisualCorrespondenceSnapshot } from "./visual-correspondence.js";

document.title = "JV Rep2 Visual Correspondence";

const root = document.querySelector<HTMLDivElement>("#app");
if (root === null) throw new Error("Rep2 app root is missing.");

const variant = new URLSearchParams(window.location.search).get("variant") ?? "baseline";
const raisedGeometry: Rep2SuspensionGeometry = Object.freeze({
  armPivotLocal: Object.freeze({ x: -0.42, y: 0.11, z: -0.62 }),
  wheelEndpointLocal: Object.freeze({ x: -0.66, y: -0.21, z: -0.62 }),
});
const authored = variant === "raised" ? raisedGeometry : REP2_BASELINE_GEOMETRY;

root.innerHTML = `
  <main class="rep2-shell">
    <header>
      <div>
        <p class="eyebrow">NEXTGEN JV · REP2 STAGE B DIAGNOSTIC</p>
        <h1>Single-source suspension correspondence</h1>
        <p>Orange link = live Box3D hinge → live arm wheel endpoint. No projection-side suspension geometry.</p>
      </div>
      <button data-testid="advance-drive">Advance physical drive</button>
    </header>
    <section class="rep2-stage">
      <canvas data-testid="rep2-viewport" aria-label="Rep2 physical and visual correspondence viewport"></canvas>
      <aside>
        <strong data-testid="runtime-status">Preparing physical world…</strong>
        <dl>
          <div><dt>Specimen</dt><dd data-testid="variant">${variant}</dd></div>
          <div><dt>Step</dt><dd data-testid="step">0</dd></div>
          <div><dt>Hinge angle</dt><dd data-testid="hinge-angle">0°</dd></div>
          <div><dt>Pivot error</dt><dd data-testid="pivot-error">—</dd></div>
          <div><dt>Arm start error</dt><dd data-testid="arm-start-error">—</dd></div>
          <div><dt>Arm end error</dt><dd data-testid="arm-end-error">—</dd></div>
          <div><dt>Wheel centre error</dt><dd data-testid="wheel-error">—</dd></div>
        </dl>
        <p class="note">Diagnostic primitives only. This is not a component model or Owner-facing builder.</p>
      </aside>
    </section>
  </main>
`;

const required = <T extends Element>(selector: string): T => {
  const value = root.querySelector<T>(selector);
  if (value === null) throw new Error(`Missing Rep2 UI element: ${selector}`);
  return value;
};

const canvas = required<HTMLCanvasElement>("canvas");
const projection = new Rep2Projection(canvas);
const world = await Rep2SuspensionLinkWorld.create(authored);
let disposed = false;

function formatMillimetres(value: number): string {
  return `${(value * 1000).toFixed(4)} mm`;
}

function publish(
  trace: Rep2SuspensionTrace,
  visual: Rep2VisualCorrespondenceSnapshot,
): void {
  required<HTMLElement>("[data-testid='step']").textContent = String(trace.step);
  required<HTMLElement>("[data-testid='hinge-angle']").textContent =
    `${((trace.hingeAngle * 180) / Math.PI).toFixed(2)}°`;
  required<HTMLElement>("[data-testid='pivot-error']").textContent = formatMillimetres(visual.pivotError);
  required<HTMLElement>("[data-testid='arm-start-error']").textContent = formatMillimetres(visual.armStartError);
  required<HTMLElement>("[data-testid='arm-end-error']").textContent = formatMillimetres(visual.armEndError);
  required<HTMLElement>("[data-testid='wheel-error']").textContent = formatMillimetres(visual.wheelCenterError);

  root.dataset.variant = variant;
  root.dataset.step = String(trace.step);
  root.dataset.hingeAngle = String(trace.hingeAngle);
  root.dataset.physicalPivotX = String(trace.hingeWorldFromArm.x);
  root.dataset.physicalPivotY = String(trace.hingeWorldFromArm.y);
  root.dataset.physicalPivotZ = String(trace.hingeWorldFromArm.z);
  root.dataset.physicalArmEndX = String(trace.wheelEndpointWorldFromArm.x);
  root.dataset.physicalArmEndY = String(trace.wheelEndpointWorldFromArm.y);
  root.dataset.physicalArmEndZ = String(trace.wheelEndpointWorldFromArm.z);
  root.dataset.physicalWheelX = String(trace.wheelCenterWorld.x);
  root.dataset.physicalWheelY = String(trace.wheelCenterWorld.y);
  root.dataset.physicalWheelZ = String(trace.wheelCenterWorld.z);
  root.dataset.visualPivotX = String(visual.visualPivotWorld.x);
  root.dataset.visualPivotY = String(visual.visualPivotWorld.y);
  root.dataset.visualPivotZ = String(visual.visualPivotWorld.z);
  root.dataset.visualArmEndX = String(visual.visualArmEndWorld.x);
  root.dataset.visualArmEndY = String(visual.visualArmEndWorld.y);
  root.dataset.visualArmEndZ = String(visual.visualArmEndWorld.z);
  root.dataset.visualWheelX = String(visual.visualWheelCenterWorld.x);
  root.dataset.visualWheelY = String(visual.visualWheelCenterWorld.y);
  root.dataset.visualWheelZ = String(visual.visualWheelCenterWorld.z);
  root.dataset.pivotError = String(visual.pivotError);
  root.dataset.armStartError = String(visual.armStartError);
  root.dataset.armEndError = String(visual.armEndError);
  root.dataset.wheelCenterError = String(visual.wheelCenterError);
}

function renderTrace(trace: Rep2SuspensionTrace): void {
  const visual = projection.render(trace);
  publish(trace, visual);
}

world.step(180);
renderTrace(world.trace());
required<HTMLElement>("[data-testid='runtime-status']").textContent =
  "READY · visible mechanism owned by live physical trace";
root.dataset.state = "ready";

required<HTMLButtonElement>("[data-testid='advance-drive']").addEventListener("click", () => {
  world.setDrive(0.45);
  const trace = world.step(240);
  world.setDrive(0);
  renderTrace(trace);
  root.dataset.state = "driven";
  required<HTMLElement>("[data-testid='runtime-status']").textContent =
    "DRIVEN · correspondence rechecked after physical motion";
});

window.addEventListener("beforeunload", () => {
  if (disposed) return;
  disposed = true;
  projection.dispose();
  world.dispose();
});
