import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import "./style.css";
import {
  addParticipant,
  allRelationStatuses,
  connectionTargetReferenceIds,
  connectReferences,
  connectedTargetSpan,
  disconnectRelation,
  getParticipant,
  linearParticipantLength,
  relationsForReference,
  resolveReference,
  setLinearParticipantLength,
  withParticipantPose,
} from "./construction.js";
import { E1EditSession } from "./edit-session.js";
import {
  canFitLinearParticipantF1, connectReferencesF1, f1SecondConnectAnchor,
  f1SoleSatisfiedAnchor, fitLinearParticipantF1,
} from "./f1-construction.js";
import { evaluateE1Play, type E1EvaluationFrame, type E1PlayResult } from "./evaluator.js";
import type {
  E1Document,
  E1ParticipantId,
  E1Pose,
  E1ReferenceId,
  E1Relation,
} from "./model.js";
import {
  createE1DirectBaseline,
  createE1PushrodParticipant,
  createE1RockerParticipant,
  E1_IDS,
} from "./scenario.js";
import {
  E1ThreeProjection,
  projectionPick,
  type E1ProjectionPick,
} from "./three-projection.js";

type E1Mode = "build" | "play";
type E1TransformMode = "translate" | "rotate";

interface E1ConnectionIntent {
  readonly kind: E1Relation["kind"];
  readonly sourceReferenceId: E1ReferenceId;
}

const rootCandidate = document.querySelector<HTMLDivElement>("#app");
if (!rootCandidate) throw new Error("Missing #app root.");
const root = rootCandidate;
// Final E1 comparison only. Never serialized into authored state.
const f1Condition = new URLSearchParams(window.location.search).get("f1") === "T1" ? "T1" : "C1";

root.innerHTML = `
  <main class="e1-shell">
    <div class="e1-viewport" data-testid="viewport"></div>
    <div class="e1-toolbar">
      <div class="e1-actions">
        <button class="e1-button" data-testid="undo">UNDO</button>
        <button class="e1-button" data-testid="reset-task">RESET TASK</button>
      </div>
      <div class="e1-mode" aria-label="Evaluation mode">
        <button class="e1-button" data-testid="build" data-mode="build" data-active="true">BUILD</button>
        <button class="e1-button" data-testid="play" data-mode="play" data-active="false">PLAY</button>
      </div>
      <div class="e1-view-actions">
        <button class="e1-button" data-testid="move" data-active="true">MOVE</button>
        <button class="e1-button" data-testid="rotate" data-active="false">ROTATE</button>
        <button class="e1-button" data-testid="reset-view">RESET VIEW</button>
      </div>
    </div>

    <section class="e1-inspector" data-testid="inspector" data-open="true">
      <div class="e1-eyebrow" data-testid="selection-kind">PARTICIPANT</div>
      <h2 data-testid="selection-title">Damper</h2>
      <p data-testid="selection-description">Select a body to change its pose, or a point/axis to author a relation.</p>
      <div class="e1-selection-meta" data-testid="selection-meta"></div>
      <p data-testid="target-identity" hidden></p>
      <div class="e1-geometry-controls" data-testid="geometry-controls" hidden>
        <label for="e1-length">AUTHORED OWN LENGTH</label>
        <div class="e1-length-row">
          <input id="e1-length" data-testid="length-input" type="number" min="0.1" step="0.01" />
          <button class="e1-button e1-small" data-testid="fit-length">FIT TO TARGET SPAN</button>
        </div>
        <small data-testid="target-span"></small>
      </div>
      <div class="e1-reference-controls" data-testid="reference-controls" hidden>
        <button class="e1-button e1-small" data-testid="connect-point">CONNECT POINTS</button>
        <button class="e1-button e1-small" data-testid="connect-axis">CONNECT AXES</button>
        <button class="e1-button e1-small" data-testid="confirm-connect" hidden>CONNECT HIGHLIGHTED</button>
        <select class="e1-relation-select" data-testid="disconnect-relation-select" aria-label="Relation to disconnect" hidden></select>
        <button class="e1-button e1-small e1-danger" data-testid="disconnect">DISCONNECT</button>
        <button class="e1-button e1-small" data-testid="cancel-connect">CANCEL CONNECT</button>
      </div>
    </section>

    <aside class="e1-task-card" data-testid="task-card">
      <div class="e1-eyebrow">STRUCTURAL REWIRE · E1</div>
      <h2>Rebuild the motion path</h2>
      <p>Replace the direct arm → damper path with:</p>
      <div class="e1-topology">MOVING ARM → RIGID LINK → ROCKER → DAMPER</div>
      <p>Mount the rocker on the chassis axis. Choose the construction sequence and spatial arrangement yourself.</p>
      <div class="e1-part-tray">
        <button class="e1-button" data-testid="add-rocker">+ ROCKER</button>
        <button class="e1-button" data-testid="add-pushrod">+ RIGID LINK</button>
      </div>
      <div class="e1-task-note">Detached and geometrically strange states are legal. Warnings do not block PLAY.</div>
    </aside>

    <div class="e1-hint"><strong>Body</strong> = pose. <strong>Point/axis</strong> = relation. Connect changes only source pose; it never edits part geometry.</div>
    <div class="e1-badge"><span data-testid="f1-condition">${f1Condition}</span> · E1-LOCAL · PROVISIONAL · NOT JV ARCHITECTURE</div>
    <footer class="e1-status" data-testid="status" data-kind="build">
      <div class="e1-state"><span class="e1-dot"></span><span data-testid="state-label">BUILD · Ready</span></div>
      <div class="e1-message" data-testid="message">Run the direct baseline, then rebuild its explicit motion path.</div>
      <div class="e1-metric" data-testid="metric"></div>
    </footer>
  </main>
`;

function requiredElement<T extends Element>(selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing E1 UI element: ${selector}`);
  return element;
}

const viewport = requiredElement<HTMLDivElement>("[data-testid='viewport']");
const buildButton = requiredElement<HTMLButtonElement>("[data-testid='build']");
const playButton = requiredElement<HTMLButtonElement>("[data-testid='play']");
const undoButton = requiredElement<HTMLButtonElement>("[data-testid='undo']");
const resetTaskButton = requiredElement<HTMLButtonElement>("[data-testid='reset-task']");
const moveButton = requiredElement<HTMLButtonElement>("[data-testid='move']");
const rotateButton = requiredElement<HTMLButtonElement>("[data-testid='rotate']");
const resetViewButton = requiredElement<HTMLButtonElement>("[data-testid='reset-view']");
const addRockerButton = requiredElement<HTMLButtonElement>("[data-testid='add-rocker']");
const addPushrodButton = requiredElement<HTMLButtonElement>("[data-testid='add-pushrod']");
const selectionKind = requiredElement<HTMLElement>("[data-testid='selection-kind']");
const selectionTitle = requiredElement<HTMLElement>("[data-testid='selection-title']");
const selectionDescription = requiredElement<HTMLElement>("[data-testid='selection-description']");
const selectionMeta = requiredElement<HTMLElement>("[data-testid='selection-meta']");
const targetIdentity = requiredElement<HTMLElement>("[data-testid='target-identity']");
const geometryControls = requiredElement<HTMLElement>("[data-testid='geometry-controls']");
const lengthInput = requiredElement<HTMLInputElement>("[data-testid='length-input']");
const fitLengthButton = requiredElement<HTMLButtonElement>("[data-testid='fit-length']");
const targetSpan = requiredElement<HTMLElement>("[data-testid='target-span']");
const referenceControls = requiredElement<HTMLElement>("[data-testid='reference-controls']");
const connectPointButton = requiredElement<HTMLButtonElement>("[data-testid='connect-point']");
const connectAxisButton = requiredElement<HTMLButtonElement>("[data-testid='connect-axis']");
const confirmConnectButton = requiredElement<HTMLButtonElement>("[data-testid='confirm-connect']");
const disconnectRelationSelect = requiredElement<HTMLSelectElement>("[data-testid='disconnect-relation-select']");
const disconnectButton = requiredElement<HTMLButtonElement>("[data-testid='disconnect']");
const cancelConnectButton = requiredElement<HTMLButtonElement>("[data-testid='cancel-connect']");
const status = requiredElement<HTMLElement>("[data-testid='status']");
const stateLabel = requiredElement<HTMLElement>("[data-testid='state-label']");
const message = requiredElement<HTMLElement>("[data-testid='message']");
const metric = requiredElement<HTMLElement>("[data-testid='metric']");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f12);
scene.fog = new THREE.Fog(0x0b0f12, 13, 28);
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
orbit.minDistance = 3;
orbit.maxDistance = 20;

function resetView(): void {
  camera.position.set(7.2, 5.1, 8.6);
  orbit.target.set(0.45, 1.55, 0.2);
  orbit.update();
}
resetView();

scene.add(new THREE.HemisphereLight(0xc5d6dc, 0x131a1e, 1.55));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(5, 9, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1536, 1536);
keyLight.shadow.camera.left = -9;
keyLight.shadow.camera.right = 9;
keyLight.shadow.camera.top = 9;
keyLight.shadow.camera.bottom = -9;
scene.add(keyLight);
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(32, 32),
  new THREE.MeshStandardMaterial({ color: 0x141a1e, roughness: 0.92, metalness: 0.06 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(32, 64, 0x34454d, 0x1d282e);
grid.position.y = 0.004;
scene.add(grid);

const projection = new E1ThreeProjection();
scene.add(projection.root);
const transform = new TransformControls(camera, renderer.domElement);
transform.setSize(0.78);
scene.add(transform.getHelper());

const baseline = createE1DirectBaseline();
const session = new E1EditSession(baseline);
let mode: E1Mode = "build";
let transformMode: E1TransformMode = "translate";
let selectedParticipantId: E1ParticipantId | null = E1_IDS.damper;
let selectedReferenceId: E1ReferenceId | null = null;
let hoveredReferenceId: E1ReferenceId | null = null;
let connectionIntent: E1ConnectionIntent | null = null;
let connectionTargetReferenceId: E1ReferenceId | null = null;
let disconnectRelationChoice: string | null = null;
let playResult: E1PlayResult | null = null;
let playStartedAt = 0;
let transformDragging = false;
let lastDetail = "Run the direct baseline, then rebuild its explicit motion path.";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function setStatus(kind: "build" | "play" | "warning", label: string, detail: string): void {
  status.dataset.kind = kind;
  stateLabel.textContent = label;
  message.textContent = detail;
}

function selectedParticipant(document: E1Document) {
  return selectedParticipantId ? getParticipant(document, selectedParticipantId) : null;
}

function attachTransformToSelection(): void {
  if (mode !== "build" || !selectedParticipantId) {
    transform.detach();
    return;
  }
  const participant = getParticipant(session.document, selectedParticipantId);
  const object = projection.participantObject(selectedParticipantId);
  if (participant.fixed || !object) {
    transform.detach();
    return;
  }
  if (transform.object !== object) transform.attach(object);
  transform.setMode(transformMode);
  transform.setSpace(transformMode === "rotate" ? "local" : "world");
}

function renderLinearControls(document: E1Document, participantId: E1ParticipantId, pointId: E1ReferenceId | null): void {
  const length = linearParticipantLength(getParticipant(document, participantId));
  if (length === null || connectionIntent) return;
  geometryControls.hidden = false;
  lengthInput.value = length.toFixed(3);
  lengthInput.readOnly = f1Condition === "T1" || pointId !== null;
  const span = connectedTargetSpan(document, participantId);
  targetSpan.textContent = span === null
    ? "Connect both endpoints to expose their target span."
    : `Connected target span: ${span.toFixed(3)} m`;
  fitLengthButton.disabled = span === null;
  if (f1Condition === "T1") {
    const anchorId = pointId ?? f1SoleSatisfiedAnchor(document, participantId);
    fitLengthButton.disabled = !anchorId || !canFitLinearParticipantF1(document, anchorId);
    targetSpan.textContent += anchorId
      ? ` · FIT preserves ${resolveReference(document, anchorId).reference.label}; aligned targets only.`
      : " · Select the satisfied endpoint to preserve for FIT.";
  }
}

function renderInspector(document: E1Document): void {
  geometryControls.hidden = true;
  referenceControls.hidden = true;
  const targetId = connectionTargetReferenceId ?? hoveredReferenceId;
  const validTarget = connectionIntent && targetId && connectionTargetReferenceIds(
    document, connectionIntent.kind, connectionIntent.sourceReferenceId,
  ).includes(targetId);
  targetIdentity.hidden = !connectionIntent;
  targetIdentity.textContent = validTarget
    ? `TARGET: ${resolveReference(document, targetId!).participant.label} · ${resolveReference(document, targetId!).reference.label}`
    : "TARGET: point at a legal reference. Overlap: click to cycle, then confirm the named target.";
  if (selectedReferenceId) {
    const resolved = resolveReference(document, selectedReferenceId);
    const relations = relationsForReference(document, selectedReferenceId);
    selectionKind.textContent = `${resolved.reference.kind.toUpperCase()} REFERENCE`;
    selectionTitle.textContent = `${resolved.participant.label} · ${resolved.reference.label}`;
    selectionDescription.textContent = connectionIntent
      ? "Now point at and click one explicit target. Only the source participant pose may snap."
      : "References author explicit relations. They do not carry socket or capability semantics in E1.";
    selectionMeta.textContent = relations.length === 0
      ? "Detached · no authored relation"
      : `${relations.length} authored relation${relations.length === 1 ? "" : "s"}`;
    referenceControls.hidden = false;
    connectPointButton.hidden = resolved.reference.kind !== "point";
    connectAxisButton.hidden = resolved.reference.kind !== "axis";
    connectPointButton.disabled = resolved.participant.fixed || connectionIntent !== null;
    connectAxisButton.disabled = resolved.participant.fixed || connectionIntent !== null;
    confirmConnectButton.hidden = connectionIntent === null || connectionTargetReferenceId === null;
    disconnectRelationSelect.replaceChildren();
    if (relations.length > 1) {
      const placeholder = new Option("CHOOSE RELATION…", "");
      disconnectRelationSelect.add(placeholder);
    }
    for (const relation of relations) {
      const otherReferenceId = relation.sourceReferenceId === selectedReferenceId
        ? relation.targetReferenceId
        : relation.sourceReferenceId;
      const other = resolveReference(document, otherReferenceId);
      disconnectRelationSelect.add(new Option(
        `${relation.kind} → ${other.participant.label} · ${other.reference.label}`,
        relation.id,
      ));
    }
    if (relations.length === 1) {
      disconnectRelationSelect.value = relations[0]!.id;
    } else if (relations.some((relation) => relation.id === disconnectRelationChoice)) {
      disconnectRelationSelect.value = disconnectRelationChoice ?? "";
    } else {
      disconnectRelationSelect.value = "";
    }
    disconnectRelationSelect.hidden = relations.length <= 1 || connectionIntent !== null;
    disconnectButton.hidden = relations.length === 0 || connectionIntent !== null;
    disconnectButton.disabled = relations.length > 1 && disconnectRelationSelect.value === "";
    cancelConnectButton.hidden = connectionIntent === null;
    if (resolved.reference.kind === "point") renderLinearControls(document, resolved.participant.id, selectedReferenceId);
    return;
  }
  const participant = selectedParticipant(document);
  if (!participant) {
    selectionKind.textContent = "BUILD";
    selectionTitle.textContent = "Select a mechanical thing";
    selectionDescription.textContent = "Click a body for pose manipulation, or a point/axis for relation authoring.";
    selectionMeta.textContent = "Nothing selected";
    return;
  }
  selectionKind.textContent = "PARTICIPANT · POSE";
  selectionTitle.textContent = participant.label;
  selectionDescription.textContent = participant.fixed
    ? "This fixture is fixed in E1. Its references can still be explicit connection targets."
    : `${transformMode === "translate" ? "Move" : "Rotate"} changes only this participant pose. It never edits its own reference layout.`;
  selectionMeta.textContent = participant.fixed
    ? "Fixed fixture"
    : `Pose edit · ${transformMode === "translate" ? "world translation" : "local rotation"}`;
  renderLinearControls(document, participant.id, null);
}

function renderBuildState(detail = lastDetail): void {
  lastDetail = detail;
  const document = session.document;
  if (selectedParticipantId && !document.participants.some((participant) => participant.id === selectedParticipantId)) {
    selectedParticipantId = null;
  }
  if (selectedReferenceId && !document.participants.some((participant) =>
    participant.references.some((reference) => reference.id === selectedReferenceId),
  )) {
    selectedReferenceId = null;
  }
  if (connectionIntent && !document.participants.some((participant) =>
    participant.references.some((reference) => reference.id === connectionIntent?.sourceReferenceId),
  )) {
    connectionIntent = null;
    connectionTargetReferenceId = null;
  }
  const connectionCandidates = connectionIntent
    ? connectionTargetReferenceIds(
        document,
        connectionIntent.kind,
        connectionIntent.sourceReferenceId,
      )
    : null;
  if (connectionTargetReferenceId && !connectionCandidates?.includes(connectionTargetReferenceId)) {
    connectionTargetReferenceId = null;
  }
  const statuses = allRelationStatuses(document);
  const violated = statuses.filter((entry) => !entry.satisfied);
  projection.setMode("build");
  projection.renderBuild(document, statuses, {
    selectedParticipantId,
    selectedReferenceId,
    hoveredReferenceId,
    connectionSourceReferenceId: connectionIntent?.sourceReferenceId ?? null,
    connectionTargetReferenceId: connectionTargetReferenceId ?? (connectionIntent ? hoveredReferenceId : null),
    connectionCandidateReferenceIds: connectionCandidates,
  });
  attachTransformToSelection();
  renderInspector(document);
  undoButton.disabled = session.historyLength === 0;
  addRockerButton.disabled = document.participants.some((participant) => participant.id === E1_IDS.rocker);
  addPushrodButton.disabled = document.participants.some((participant) => participant.id === E1_IDS.pushrod);
  moveButton.dataset.active = String(transformMode === "translate");
  rotateButton.dataset.active = String(transformMode === "rotate");
  metric.textContent = `Rev ${document.revision} · ${document.relations.length} relations · ${violated.length} violated`;
  const label = connectionIntent
    ? "BUILD · Choose explicit target"
    : session.hasPreview
      ? "BUILD · Pose preview"
      : violated.length > 0
        ? "BUILD · Permissive warning"
        : "BUILD · Ready";
  setStatus(violated.length > 0 ? "warning" : "build", label, detail);
}

function selectPick(pick: E1ProjectionPick | null): void {
  const nextReferenceId = pick?.kind === "reference" ? pick.id : null;
  if (nextReferenceId !== selectedReferenceId) disconnectRelationChoice = null;
  if (!pick) {
    selectedParticipantId = null;
    selectedReferenceId = null;
  } else if (pick.kind === "participant") {
    selectedParticipantId = pick.id;
    selectedReferenceId = null;
  } else {
    selectedReferenceId = pick.id;
    selectedParticipantId = null;
  }
  renderBuildState();
}

function beginPosePreview(): void {
  if (!selectedParticipantId || session.hasPreview) return;
  session.beginPreview("participant-pose");
}

function poseFromObject(object: THREE.Object3D): E1Pose {
  return {
    position: { x: object.position.x, y: object.position.y, z: object.position.z },
    rotation: {
      x: object.quaternion.x,
      y: object.quaternion.y,
      z: object.quaternion.z,
      w: object.quaternion.w,
    },
  };
}

function previewSelectedPose(): void {
  if (!selectedParticipantId || !transform.object) return;
  beginPosePreview();
  const participantId = selectedParticipantId;
  const pose = poseFromObject(transform.object);
  session.updatePreview((draft) => withParticipantPose(draft, participantId, pose));
  renderBuildState("Pose preview only · release to commit or press Escape to cancel.");
}

function commitPosePreview(): void {
  if (!session.hasPreview) return;
  const committed = session.commitPreview();
  renderBuildState(committed
    ? "Participant pose committed. Own geometry and reference layout were unchanged."
    : "No authored pose change to commit.");
}

function cancelWorkingState(): void {
  if (connectionIntent) {
    connectionIntent = null;
    connectionTargetReferenceId = null;
    disconnectRelationChoice = null;
    hoveredReferenceId = null;
    renderBuildState("Connection preview cancelled. Authored topology is unchanged.");
    return;
  }
  if (session.cancelPreview()) {
    renderBuildState("Pose preview cancelled. Authored state and history are unchanged.");
  }
}

function enterBuild(): void {
  mode = "build";
  playResult = null;
  buildButton.dataset.active = "true";
  playButton.dataset.active = "false";
  renderBuildState("Exact authored construction recovered; PLAY changed neither revision nor Undo history.");
}

function enterPlay(): void {
  cancelWorkingState();
  mode = "play";
  buildButton.dataset.active = "false";
  playButton.dataset.active = "true";
  transform.detach();
  projection.setMode("play");
  playResult = evaluateE1Play(session.committedDocument);
  playStartedAt = performance.now();
  const diagnostic = playResult.diagnostics[0];
  if (diagnostic) {
    setStatus("warning", "PLAY · Diagnosed static", diagnostic.message);
  } else {
    setStatus(
      "play",
      `PLAY · ${playResult.topology === "rocker" ? "Rocker path" : "Direct path"}`,
      "The complete supported chain is evaluated from authored references and relations.",
    );
  }
}

function canvasPicks(event: PointerEvent | MouseEvent): E1ProjectionPick[] {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const picks: E1ProjectionPick[] = [];
  for (const intersection of raycaster.intersectObjects(projection.pickTargets, true)) {
    const pick = projectionPick(intersection.object);
    if (pick && !picks.some((candidate) => candidate.kind === pick.kind && candidate.id === pick.id)) {
      picks.push(pick);
    }
  }
  const references = picks.filter((pick) => pick.kind === "reference");
  return references.length > 0 ? references : picks.filter((pick) => pick.kind === "participant");
}

function commitConnection(targetReferenceId: E1ReferenceId): void {
  if (!connectionIntent) return;
  const sourceReferenceId = connectionIntent.sourceReferenceId;
  const kind = connectionIntent.kind;
  try {
    const anchorId = f1SecondConnectAnchor(session.document, kind, sourceReferenceId, targetReferenceId);
    const committed = session.commitOperation("connect-references", (draft) =>
      (f1Condition === "T1" ? connectReferencesF1 : connectReferences)(draft, kind, sourceReferenceId, targetReferenceId),
    );
    connectionIntent = null;
    connectionTargetReferenceId = null;
    hoveredReferenceId = null;
    selectedReferenceId = anchorId ?? sourceReferenceId;
    disconnectRelationChoice = null;
    renderBuildState(committed
      ? f1Condition === "T1" && anchorId
        ? "Relation committed. Existing anchor preserved; source pose aligned, own length unchanged. FIT is a separate geometry operation."
        : `Relation committed. Source-pose snap; own geometry and length preserved.${f1Condition === "T1" ? " No unambiguous second-anchor completion applied." : ""}`
      : "That relation already exists; authored state is unchanged.");
  } catch (error) {
    renderBuildState(error instanceof Error ? error.message : "Connection could not be committed.");
  }
}

transform.addEventListener("dragging-changed", (event) => {
  const dragging = Boolean((event as unknown as { value: boolean }).value);
  transformDragging = dragging;
  orbit.enabled = !dragging;
});
transform.addEventListener("mouseDown", beginPosePreview);
transform.addEventListener("objectChange", previewSelectedPose);
transform.addEventListener("mouseUp", commitPosePreview);

renderer.domElement.addEventListener("pointermove", (event) => {
  if (mode !== "build" || transformDragging) return;
  const legalIds = connectionIntent ? connectionTargetReferenceIds(session.document, connectionIntent.kind, connectionIntent.sourceReferenceId) : null;
  const picks = canvasPicks(event).filter((candidate) => !legalIds || (candidate.kind === "reference" && legalIds.includes(candidate.id)));
  const pick = picks[0] ?? null;
  const nextHovered = pick?.kind === "reference" ? pick.id : null;
  // A cycled overlap choice survives moving to its confirmation button, but
  // cannot mislabel a different canvas target that the next click would commit.
  const leftChosenTarget = connectionTargetReferenceId !== null && !picks.some((candidate) => candidate.id === connectionTargetReferenceId);
  if (nextHovered !== hoveredReferenceId || leftChosenTarget) {
    if (leftChosenTarget) connectionTargetReferenceId = null;
    hoveredReferenceId = nextHovered;
    renderBuildState();
  }
});
renderer.domElement.addEventListener("pointerleave", () => {
  if (hoveredReferenceId) {
    hoveredReferenceId = null;
    if (mode === "build") renderBuildState();
  }
});
renderer.domElement.addEventListener("click", (event) => {
  if (mode !== "build" || transformDragging) return;
  const picks = canvasPicks(event);
  if (connectionIntent) {
    const candidates = new Set(connectionTargetReferenceIds(
      session.document,
      connectionIntent.kind,
      connectionIntent.sourceReferenceId,
    ));
    const targets = picks.filter(
      (pick): pick is E1ProjectionPick & { readonly kind: "reference" } =>
        pick.kind === "reference" && candidates.has(pick.id),
    );
    if (targets.length === 1) {
      commitConnection(targets[0]!.id);
      return;
    }
    if (targets.length > 1) {
      const currentIndex = targets.findIndex((pick) => pick.id === connectionTargetReferenceId);
      connectionTargetReferenceId = targets[(currentIndex + 1 + targets.length) % targets.length]!.id;
      hoveredReferenceId = connectionTargetReferenceId;
      renderBuildState(
        `${targets.length} legal targets overlap here · click again to cycle, then CONNECT HIGHLIGHTED.`,
      );
      return;
    }
    connectionTargetReferenceId = null;
    renderBuildState("No legal target at this location. Source, same-participant, and wrong-kind references are not targets.");
    return;
  }
  const referencePicks = picks.filter((pick) => pick.kind === "reference");
  if (referencePicks.length > 1) {
    const currentIndex = referencePicks.findIndex((pick) => pick.id === selectedReferenceId);
    const next = referencePicks[(currentIndex + 1 + referencePicks.length) % referencePicks.length]!;
    selectPick(next);
    lastDetail = `${referencePicks.length} references overlap here · click again to cycle explicitly.`;
    setStatus("build", "BUILD · Overlapping references", lastDetail);
    return;
  }
  selectPick(picks[0] ?? null);
});

function startConnection(kind: E1Relation["kind"]): void {
  if (!selectedReferenceId) return;
  connectionIntent = { kind, sourceReferenceId: selectedReferenceId };
  connectionTargetReferenceId = null;
  renderBuildState("Choose one explicit target in the viewport. No target is inferred or ranked.");
}

connectPointButton.addEventListener("click", () => startConnection("point-coincidence"));
connectAxisButton.addEventListener("click", () => startConnection("revolute-axis"));
confirmConnectButton.addEventListener("click", () => {
  if (connectionTargetReferenceId) commitConnection(connectionTargetReferenceId);
});
cancelConnectButton.addEventListener("click", cancelWorkingState);
disconnectRelationSelect.addEventListener("change", () => {
  disconnectRelationChoice = disconnectRelationSelect.value || null;
  renderBuildState();
});
disconnectButton.addEventListener("click", () => {
  if (!selectedReferenceId) return;
  const relations = relationsForReference(session.document, selectedReferenceId);
  const relation = relations.length === 1
    ? relations[0]
    : relations.find((candidate) => candidate.id === disconnectRelationSelect.value);
  if (!relation) return;
  session.commitOperation("disconnect-relation", (draft) => disconnectRelation(draft, relation.id));
  disconnectRelationChoice = null;
  renderBuildState("Relation removed. Both participants stayed exactly where they were.");
});

function addPart(kind: "rocker" | "pushrod"): void {
  const participant = kind === "rocker" ? createE1RockerParticipant() : createE1PushrodParticipant();
  const committed = session.commitOperation("add-participant", (draft) => addParticipant(draft, participant));
  if (!committed) return;
  selectedParticipantId = participant.id;
  selectedReferenceId = null;
  renderBuildState(`${participant.label} added as a detached legal BUILD participant.`);
}
addRockerButton.addEventListener("click", () => addPart("rocker"));
addPushrodButton.addEventListener("click", () => addPart("pushrod"));

lengthInput.addEventListener("change", () => {
  if (mode !== "build" || !selectedParticipantId || f1Condition === "T1") return;
  const nextLength = Number(lengthInput.value);
  const participantId = selectedParticipantId;
  const committed = session.commitOperation("participant-geometry", (draft) =>
    setLinearParticipantLength(draft, participantId, nextLength),
  );
  renderBuildState(committed
    ? "Own length changed as an explicit authored geometry operation. Pose was unchanged."
    : "Length was not changed.");
});
fitLengthButton.addEventListener("click", () => {
  if (mode !== "build") return;
  const participantId = selectedReferenceId ? resolveReference(session.document, selectedReferenceId).participant.id : selectedParticipantId;
  if (!participantId) return;
  if (f1Condition === "T1") {
    const anchorId = selectedReferenceId ?? f1SoleSatisfiedAnchor(session.document, participantId);
    if (!anchorId) return;
    const committed = session.commitOperation("participant-geometry", (draft) => fitLinearParticipantF1(draft, anchorId));
    renderBuildState(committed
      ? "FIT changed only the opposite local endpoint. Selected anchor and participant pose preserved."
      : "No FIT change: already exact, ambiguous anchors, or targets not aligned with the part.");
    return;
  }
  const span = connectedTargetSpan(session.document, participantId);
  if (span === null) return;
  session.commitOperation("participant-geometry", (draft) =>
    setLinearParticipantLength(draft, participantId, span),
  );
  renderBuildState("Own length explicitly fitted to the connected target span. This was not a snap side effect.");
});

function setTransformMode(nextMode: E1TransformMode): void {
  transformMode = nextMode;
  renderBuildState(`${nextMode === "translate" ? "Move" : "Rotate"} manipulates participant pose only.`);
}
moveButton.addEventListener("click", () => setTransformMode("translate"));
rotateButton.addEventListener("click", () => setTransformMode("rotate"));
undoButton.addEventListener("click", () => {
  if (mode !== "build") return;
  connectionIntent = null;
  connectionTargetReferenceId = null;
  disconnectRelationChoice = null;
  const undone = session.undo();
  renderBuildState(undone ? "Last authored operation undone exactly." : "Nothing to undo.");
});
resetTaskButton.addEventListener("click", () => {
  if (mode !== "build") return;
  session.reset(baseline);
  connectionIntent = null;
  connectionTargetReferenceId = null;
  disconnectRelationChoice = null;
  hoveredReferenceId = null;
  selectedParticipantId = E1_IDS.damper;
  selectedReferenceId = null;
  renderBuildState("Deterministic direct-acting baseline restored; experiment history cleared.");
});
buildButton.addEventListener("click", enterBuild);
playButton.addEventListener("click", enterPlay);
resetViewButton.addEventListener("click", resetView);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mode === "build") cancelWorkingState();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && mode === "build") {
    event.preventDefault();
    connectionIntent = null;
    connectionTargetReferenceId = null;
    disconnectRelationChoice = null;
    if (session.undo()) renderBuildState("Last authored operation undone exactly.");
  }
  if (event.key.toLowerCase() === "g" && mode === "build") setTransformMode("translate");
  if (event.key.toLowerCase() === "r" && mode === "build") setTransformMode("rotate");
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
    const frame: E1EvaluationFrame | undefined = playResult.frames[index];
    if (frame) {
      projection.renderFrame(session.committedDocument, frame);
      metric.textContent = playResult.topology === "rocker"
        ? `Damper ${frame.damperLength.toFixed(3)} m · rigid link ${frame.pushrodLength?.toFixed(3) ?? "—"} m`
        : `Damper ${frame.damperLength.toFixed(3)} m`;
      if (frame.status !== "resolved" && frame.diagnostics[0]) {
        setStatus("warning", `PLAY · ${frame.status}`, frame.diagnostics[0].message);
      }
    }
  }
  renderer.render(scene, camera);
}

renderBuildState();
requestAnimationFrame(animate);
