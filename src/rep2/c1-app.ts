import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  applyC1DamperBetween,
  bindC1DamperDonor,
  type C1DamperAdaptationSnapshot,
  type C1DamperBinding,
  type C1Point3,
} from "./c1-damper-adapter.js";
import {
  C1NativeDamperWorld,
  type C1NativeDamperSnapshot,
} from "./c1-native-damper-world.js";

const DONOR_URL = "/assets/rep2/Asset_Dumper.gltf";
const REQUIRED_PARTS = ["Part_Upper", "Part_Stretch", "Part_Lower"] as const;
const CORRESPONDENCE_TOLERANCE = 1e-5;
const MINIMUM_PHYSICAL_EYE_MOTION = 0.02;
const MINIMUM_RESPONSE_SEPARATION = 0.005;
const MINIMUM_NEGATIVE_CONTROL_ERROR = 0.01;
const DYNAMIC_STEP_COUNT = 30;
const ADAPTER_VALIDATION_FIXTURE =
  new URLSearchParams(window.location.search).get("c1Fixture") === "adapter";

type Point = C1Point3;

interface BoundsEvidence {
  readonly min: Point;
  readonly max: Point;
  readonly size: Point;
  readonly center: Point;
}

interface C1BrowserAdaptationEvidence extends C1DamperAdaptationSnapshot {
  readonly renderedBounds: BoundsEvidence;
  readonly deformedSkinnedMeshCount: number;
}

type C1CorrespondencePhase =
  | "baseline-rest"
  | "baseline-moving"
  | "negative-stale-eye-b"
  | "recovered"
  | "geometry-mutant-rest"
  | "geometry-mutant-moving";

interface C1CorrespondenceObservation {
  readonly phase: C1CorrespondencePhase;
  readonly expected: "correspondence" | "mismatch-detected";
  readonly physical: C1NativeDamperSnapshot;
  readonly visualInputEyeA: Point;
  readonly visualInputEyeB: Point;
  readonly visualEyeA: Point;
  readonly visualEyeB: Point;
  readonly eyeAError: number;
  readonly eyeBError: number;
  readonly maxError: number;
  readonly tolerance: number;
  readonly detectorVerdict: "pass" | "mismatch-detected" | "unexpected-mismatch" | "missed-mismatch";
  readonly renderedBounds: BoundsEvidence;
  readonly deformedSkinnedMeshCount: number;
}

interface C1AuthorityGateEvidence {
  readonly schema: "rep2-c1-authority-gate-v1";
  readonly verdict: "pass" | "fail";
  readonly baseline: Readonly<{
    rest: C1CorrespondenceObservation;
    moving: C1CorrespondenceObservation;
    negativeStaleEyeB: C1CorrespondenceObservation;
    recovered: C1CorrespondenceObservation;
  }>;
  readonly geometryMutant: Readonly<{
    rest: C1CorrespondenceObservation;
    moving: C1CorrespondenceObservation;
  }>;
  readonly invariants: Readonly<{
    physicalEyeMotionBaseline: number;
    physicalEyeMotionMutant: number;
    componentPropertiesPreserved: boolean;
    authoredGeometryChanged: boolean;
    nativeLengthMaxError: number;
    nativeConstraintForcePeak: number;
    nativeConfigurationReadbackMatches: boolean;
    nativeSpringStateLive: boolean;
    hingeResponseSeparation: number;
    geometryConsequencePreserved: boolean;
    negativeControlError: number;
    negativeControlDetected: boolean;
    recoveryPassed: boolean;
  }>;
  readonly acceptance: Readonly<{
    correspondenceTolerance: number;
    minimumPhysicalEyeMotion: number;
    minimumResponseSeparation: number;
    minimumNegativeControlError: number;
    dynamicStepCount: number;
  }>;
}

interface C1BrowserEvidence {
  readonly schema: "rep2-c1-browser-authority-v3";
  readonly status: "loading" | "ready" | "error";
  readonly mode: "authority" | "adapter-validation";
  readonly donorUrl: string;
  readonly error?: string;
  readonly partNames?: readonly string[];
  readonly partNodeOrigins?: Readonly<Record<string, Point>>;
  readonly sceneBounds?: BoundsEvidence;
  readonly meshCount?: number;
  readonly skinnedMeshCount?: number;
  readonly adapterReady?: boolean;
  readonly restGap?: number;
  readonly stretchFractionFromUpper?: number;
  readonly currentAdaptation?: C1BrowserAdaptationEvidence;
  readonly authorityGate?: C1AuthorityGateEvidence;
  readonly interpretationBoundary?: Readonly<{
    nodeOriginsAreMeasuredBindReferences: true;
    nodeOriginsAreAcceptedMechanicalEyes: false;
    arbitraryEndpointApiIsValidationOnly: true;
    arbitraryEndpointApiAvailableOnlyInAdapterFixture: true;
    dynamicVisualEyesComeOnlyFromPhysicalSnapshots: boolean;
  }>;
}

declare global {
  interface Window {
    __REP2_C1__?: C1BrowserEvidence;
    __REP2_C1_APPLY__?: (
      upper: C1Point3,
      lower: C1Point3,
    ) => C1BrowserAdaptationEvidence;
  }
}

function point(v: THREE.Vector3): Point {
  return { x: v.x, y: v.y, z: v.z };
}

function finitePoint(value: Point): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function pointDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function sameComponent(
  a: C1NativeDamperSnapshot,
  b: C1NativeDamperSnapshot,
): boolean {
  return (
    a.springStiffness === b.springStiffness &&
    a.dampingCoefficient === b.dampingCoefficient &&
    a.restLength === b.restLength
  );
}

function sameBodyId(
  a: C1NativeDamperSnapshot["bodyASolverId"],
  b: C1NativeDamperSnapshot["bodyASolverId"],
): boolean {
  return a.index1 === b.index1 && a.world0 === b.world0 && a.generation === b.generation;
}

function nativeConfigurationMatches(snapshot: C1NativeDamperSnapshot): boolean {
  return (
    snapshot.nativeSpringEnabled &&
    snapshot.mappingPolicy === "axial-once-at-initial-state" &&
    Math.abs(snapshot.nativeRestLength - snapshot.restLength) <= CORRESPONDENCE_TOLERANCE &&
    Math.abs(snapshot.nativeSpringHertz - snapshot.appliedInitialHertz) <=
      CORRESPONDENCE_TOLERANCE &&
    Math.abs(
      snapshot.nativeSpringDampingRatio - snapshot.appliedInitialDampingRatio,
    ) <= CORRESPONDENCE_TOLERANCE &&
    sameBodyId(snapshot.nativeBodyASolverId, snapshot.bodyASolverId) &&
    sameBodyId(snapshot.nativeBodyBSolverId, snapshot.bodyBSolverId) &&
    pointDistance(snapshot.nativeEyeALocal, snapshot.eyeALocal) <=
      CORRESPONDENCE_TOLERANCE &&
    pointDistance(snapshot.nativeEyeBLocal, snapshot.eyeBLocal) <=
      CORRESPONDENCE_TOLERANCE
  );
}

function boundsEvidence(box: THREE.Box3): BoundsEvidence {
  if (box.isEmpty()) throw new Error("C1 donor has empty rendered bounds");
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return {
    min: point(box.min),
    max: point(box.max),
    size: point(size),
    center: point(center),
  };
}

const root = document.querySelector<HTMLElement>("#app") ?? document.body;
root.innerHTML = "";
root.style.margin = "0";
root.style.width = "100vw";
root.style.height = "100vh";
root.style.overflow = "hidden";
root.style.background = "#11161d";
root.style.color = "#e7edf5";
root.style.fontFamily = "system-ui, sans-serif";

const shell = document.createElement("div");
shell.style.display = "grid";
shell.style.gridTemplateColumns = "minmax(0, 1fr) 360px";
shell.style.width = "100%";
shell.style.height = "100%";
root.append(shell);

const viewport = document.createElement("div");
viewport.style.position = "relative";
viewport.style.minWidth = "0";
shell.append(viewport);

const panel = document.createElement("pre");
panel.style.margin = "0";
panel.style.padding = "18px";
panel.style.overflow = "auto";
panel.style.whiteSpace = "pre-wrap";
panel.style.background = "#0a0e13";
panel.style.borderLeft = "1px solid #29313c";
panel.style.fontSize = "12px";
panel.style.lineHeight = "1.45";
shell.append(panel);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth || window.innerWidth - 360, viewport.clientHeight || window.innerHeight);
viewport.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x11161d);
const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x30343d, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(4, 6, 5);
scene.add(key);
scene.add(new THREE.GridHelper(8, 32, 0x3b4654, 0x252d37));

window.__REP2_C1__ = {
  schema: "rep2-c1-browser-authority-v3",
  status: "loading",
  mode: ADAPTER_VALIDATION_FIXTURE ? "adapter-validation" : "authority",
  donorUrl: DONOR_URL,
};
panel.textContent = "C1 — loading exact donor…";

function makeBindReferenceMarker(radius: number): THREE.Group {
  const group = new THREE.Group();
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 18, 12),
    new THREE.MeshBasicMaterial({
      color: 0xff2fb3,
      wireframe: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  marker.renderOrder = 1000;
  group.add(marker);

  const axes = new THREE.AxesHelper(radius * 2.6);
  axes.renderOrder = 1001;
  axes.traverse((object) => {
    const material = (object as THREE.Line).material;
    if (material && !Array.isArray(material)) {
      material.depthTest = false;
      material.depthWrite = false;
      material.needsUpdate = true;
    }
  });
  group.add(axes);
  scene.add(group);
  return group;
}

function fitCamera(box: THREE.Box3): void {
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z, 0.5);
  camera.position.copy(center).add(new THREE.Vector3(span * 1.8, span * 0.8, span * 2.2));
  camera.lookAt(center);
  camera.near = Math.max(span / 1000, 0.001);
  camera.far = span * 30;
  camera.updateProjectionMatrix();
}

function resize(): void {
  const width = Math.max(viewport.clientWidth, 1);
  const height = Math.max(viewport.clientHeight, 1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

function refreshSkinnedMeshBounds(object: THREE.Object3D): number {
  object.updateMatrixWorld(true);
  let count = 0;
  object.traverse((candidate) => {
    const skinned = candidate as THREE.SkinnedMesh;
    if (!skinned.isSkinnedMesh) return;
    skinned.skeleton.update();
    skinned.computeBoundingBox();
    skinned.computeBoundingSphere();
    count += 1;
  });
  return count;
}

function renderedBounds(object: THREE.Object3D): THREE.Box3 {
  refreshSkinnedMeshBounds(object);
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object, true);
}

function updatePanel(evidence: C1BrowserEvidence): void {
  const gate = evidence.authorityGate;
  const gateSummary = gate
    ? [
        `GATE: ${gate.verdict.toUpperCase()}`,
        `normal max error: ${Math.max(
          gate.baseline.rest.maxError,
          gate.baseline.moving.maxError,
          gate.baseline.recovered.maxError,
          gate.geometryMutant.rest.maxError,
          gate.geometryMutant.moving.maxError,
        ).toExponential(3)} m`,
        `stale-eye detection: ${gate.invariants.negativeControlError.toFixed(5)} m`,
        `motion baseline / mutant: ${gate.invariants.physicalEyeMotionBaseline.toFixed(5)} / ${gate.invariants.physicalEyeMotionMutant.toFixed(5)} m`,
        `hinge response separation: ${gate.invariants.hingeResponseSeparation.toFixed(5)} rad`,
        "",
      ]
    : [];
  panel.textContent = [
    "Rep2 C1 — one authority, two projections",
    "",
    ...gateSummary,
    evidence.mode === "authority"
      ? "Normal path: live Box3D spring eyes → real donor adapter."
      : "Fixture path: isolated C1.1 arbitrary-endpoint adapter validation.",
    evidence.mode === "authority"
      ? "Detector: physical eyes vs visual references re-read from the real Three.js scene graph."
      : "This fixture has no mechanical authority claim.",
    evidence.mode === "authority"
      ? "Negative control: one stale visual eye must be rejected, then current authority must recover."
      : "The arbitrary-endpoint API is unavailable on the authority page.",
    "Roll convention is experiment-local minimal rotation, not product semantics.",
    "",
    JSON.stringify(evidence, null, 2),
  ].join("\n");
}

function setError(message: string): void {
  window.__REP2_C1_APPLY__ = undefined;
  const evidence: C1BrowserEvidence = {
    schema: "rep2-c1-browser-authority-v3",
    status: "error",
    mode: ADAPTER_VALIDATION_FIXTURE ? "adapter-validation" : "authority",
    donorUrl: DONOR_URL,
    error: message,
  };
  window.__REP2_C1__ = evidence;
  panel.textContent = `C1 donor apparatus FAILED\n\n${message}`;
}

const loader = new GLTFLoader();
loader.load(
  DONOR_URL,
  async (gltf) => {
    try {
      const partOrigins: Record<string, Point> = {};
      const partObjects: THREE.Object3D[] = [];

      for (const name of REQUIRED_PARTS) {
        const object = gltf.scene.getObjectByName(name);
        if (!object) throw new Error(`required donor node ${name} not found by GLTFLoader`);
        partObjects.push(object);
      }

      gltf.scene.updateMatrixWorld(true);
      for (const object of partObjects) {
        const measured = point(object.getWorldPosition(new THREE.Vector3()));
        if (!finitePoint(measured)) throw new Error(`non-finite bind reference for ${object.name}`);
        partOrigins[object.name] = measured;
      }

      let meshCount = 0;
      let skinnedMeshCount = 0;
      gltf.scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) meshCount += 1;
        if ((object as THREE.SkinnedMesh).isSkinnedMesh) skinnedMeshCount += 1;
      });
      if (meshCount < 1 || skinnedMeshCount < 1) {
        throw new Error(`expected loaded skinned donor mesh, got mesh=${meshCount}, skinned=${skinnedMeshCount}`);
      }

      const binding: C1DamperBinding = bindC1DamperDonor(gltf.scene);
      scene.add(gltf.scene);
      const initialBox = renderedBounds(gltf.scene);
      const initialBounds = boundsEvidence(initialBox);
      const markerRadius = Math.max(
        Math.max(initialBounds.size.x, initialBounds.size.y, initialBounds.size.z) * 0.035,
        0.025,
      );
      const upperMarker = makeBindReferenceMarker(markerRadius);
      const lowerMarker = makeBindReferenceMarker(markerRadius);

      const makeAuthorityMarker = (color: number): THREE.Mesh => {
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(markerRadius * 1.35, 20, 14),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82 }),
        );
        marker.renderOrder = 900;
        scene.add(marker);
        return marker;
      };
      const authorityEyeAMarker = makeAuthorityMarker(0x5dff9a);
      const authorityEyeBMarker = makeAuthorityMarker(0x5dff9a);
      const hingeMarker = makeAuthorityMarker(0x49c6ff);
      const armGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
      const armLine = new THREE.Line(
        armGeometry,
        new THREE.LineBasicMaterial({ color: 0xffa83d }),
      );
      armLine.renderOrder = 850;
      scene.add(armLine);

      const setPhysicalRig = (snapshot: C1NativeDamperSnapshot): void => {
        authorityEyeAMarker.position.set(
          snapshot.eyeAWorld.x,
          snapshot.eyeAWorld.y,
          snapshot.eyeAWorld.z,
        );
        authorityEyeBMarker.position.set(
          snapshot.eyeBWorld.x,
          snapshot.eyeBWorld.y,
          snapshot.eyeBWorld.z,
        );
        hingeMarker.position.set(
          snapshot.hingeWorld.x,
          snapshot.hingeWorld.y,
          snapshot.hingeWorld.z,
        );
        armGeometry.setFromPoints([
          new THREE.Vector3(
            snapshot.hingeWorld.x,
            snapshot.hingeWorld.y,
            snapshot.hingeWorld.z,
          ),
          new THREE.Vector3(
            snapshot.eyeBWorld.x,
            snapshot.eyeBWorld.y,
            snapshot.eyeBWorld.z,
          ),
        ]);
        armGeometry.computeBoundingSphere();
      };

      const setMarkersFromSnapshot = (snapshot: C1DamperAdaptationSnapshot): void => {
        upperMarker.position.set(
          snapshot.visualUpperWorld.x,
          snapshot.visualUpperWorld.y,
          snapshot.visualUpperWorld.z,
        );
        lowerMarker.position.set(
          snapshot.visualLowerWorld.x,
          snapshot.visualLowerWorld.y,
          snapshot.visualLowerWorld.z,
        );
      };

      const observeCorrespondence = (
        phase: C1CorrespondencePhase,
        expected: C1CorrespondenceObservation["expected"],
        physical: C1NativeDamperSnapshot,
        visualInputEyeA: Point = physical.eyeAWorld,
        visualInputEyeB: Point = physical.eyeBWorld,
      ): C1CorrespondenceObservation => {
        const adaptation = applyC1DamperBetween(
          binding,
          visualInputEyeA,
          visualInputEyeB,
        );
        const deformedSkinnedMeshCount = refreshSkinnedMeshBounds(gltf.scene);
        const box = renderedBounds(gltf.scene);
        binding.scene.updateMatrixWorld(true);
        const visualEyeA = point(
          binding.upper.getWorldPosition(new THREE.Vector3()),
        );
        const visualEyeB = point(
          binding.lower.getWorldPosition(new THREE.Vector3()),
        );
        const eyeAError = pointDistance(visualEyeA, physical.eyeAWorld);
        const eyeBError = pointDistance(visualEyeB, physical.eyeBWorld);
        const maxError = Math.max(eyeAError, eyeBError);
        const detectorVerdict = expected === "correspondence"
          ? maxError <= CORRESPONDENCE_TOLERANCE
            ? "pass"
            : "unexpected-mismatch"
          : maxError >= MINIMUM_NEGATIVE_CONTROL_ERROR
            ? "mismatch-detected"
            : "missed-mismatch";
        setMarkersFromSnapshot(adaptation);
        setPhysicalRig(physical);
        return {
          phase,
          expected,
          physical,
          visualInputEyeA: { ...visualInputEyeA },
          visualInputEyeB: { ...visualInputEyeB },
          visualEyeA,
          visualEyeB,
          eyeAError,
          eyeBError,
          maxError,
          tolerance: CORRESPONDENCE_TOLERANCE,
          detectorVerdict,
          renderedBounds: boundsEvidence(box),
          deformedSkinnedMeshCount,
        };
      };

      const runAuthorityGate = async (): Promise<C1AuthorityGateEvidence> => {
        const baselineWorld = await C1NativeDamperWorld.create("baseline");
        let baselineRest: C1CorrespondenceObservation;
        let baselineMoving: C1CorrespondenceObservation;
        let negativeStaleEyeB: C1CorrespondenceObservation;
        let recovered: C1CorrespondenceObservation;
        try {
          const restPhysical = baselineWorld.snapshot();
          baselineRest = observeCorrespondence(
            "baseline-rest",
            "correspondence",
            restPhysical,
          );
          const movingPhysical = baselineWorld.step(DYNAMIC_STEP_COUNT);
          baselineMoving = observeCorrespondence(
            "baseline-moving",
            "correspondence",
            movingPhysical,
          );
          negativeStaleEyeB = observeCorrespondence(
            "negative-stale-eye-b",
            "mismatch-detected",
            movingPhysical,
            movingPhysical.eyeAWorld,
            restPhysical.eyeBWorld,
          );
          recovered = observeCorrespondence(
            "recovered",
            "correspondence",
            movingPhysical,
          );
        } finally {
          baselineWorld.dispose();
        }

        const mutantWorld = await C1NativeDamperWorld.create("half-radius");
        let mutantRest: C1CorrespondenceObservation;
        let mutantMoving: C1CorrespondenceObservation;
        try {
          const restPhysical = mutantWorld.snapshot();
          mutantRest = observeCorrespondence(
            "geometry-mutant-rest",
            "correspondence",
            restPhysical,
          );
          mutantMoving = observeCorrespondence(
            "geometry-mutant-moving",
            "correspondence",
            mutantWorld.step(DYNAMIC_STEP_COUNT),
          );
        } finally {
          mutantWorld.dispose();
        }

        const physicalEyeMotionBaseline = pointDistance(
          baselineRest.physical.eyeBWorld,
          baselineMoving.physical.eyeBWorld,
        );
        const physicalEyeMotionMutant = pointDistance(
          mutantRest.physical.eyeBWorld,
          mutantMoving.physical.eyeBWorld,
        );
        const componentPropertiesPreserved = [
          baselineMoving.physical,
          mutantRest.physical,
          mutantMoving.physical,
        ].every((snapshot) => sameComponent(baselineRest.physical, snapshot));
        const authoredGeometryChanged =
          pointDistance(
            baselineRest.physical.eyeALocal,
            mutantRest.physical.eyeALocal,
          ) > 0.1 &&
          pointDistance(
            baselineRest.physical.eyeBLocal,
            mutantRest.physical.eyeBLocal,
          ) > 0.1;
        const baselineResponse =
          baselineMoving.physical.hingeAngle - baselineRest.physical.hingeAngle;
        const mutantResponse =
          mutantMoving.physical.hingeAngle - mutantRest.physical.hingeAngle;
        const hingeResponseSeparation = Math.abs(baselineResponse - mutantResponse);
        const normalObservations = [
          baselineRest,
          baselineMoving,
          recovered,
          mutantRest,
          mutantMoving,
        ];
        const nativeLengthMaxError = Math.max(
          ...normalObservations.map((observation) => Math.abs(
            observation.physical.currentLength - observation.physical.nativeCurrentLength,
          )),
        );
        const nativeConstraintForcePeak = Math.max(
          Math.abs(baselineMoving.physical.nativeAxialForce),
          Math.abs(mutantMoving.physical.nativeAxialForce),
        );
        const nativeConfigurationReadbackMatches = normalObservations.every(
          (observation) => nativeConfigurationMatches(observation.physical),
        );
        const nativeSpringStateLive =
          nativeLengthMaxError <= CORRESPONDENCE_TOLERANCE &&
          Number.isFinite(nativeConstraintForcePeak) &&
          nativeConstraintForcePeak > 0.1 &&
          nativeConfigurationReadbackMatches;
        const negativeControlDetected =
          negativeStaleEyeB.detectorVerdict === "mismatch-detected";
        const recoveryPassed = recovered.detectorVerdict === "pass";
        const geometryConsequencePreserved =
          hingeResponseSeparation >= MINIMUM_RESPONSE_SEPARATION;
        const pass =
          normalObservations.every((observation) => observation.detectorVerdict === "pass") &&
          physicalEyeMotionBaseline >= MINIMUM_PHYSICAL_EYE_MOTION &&
          physicalEyeMotionMutant >= MINIMUM_PHYSICAL_EYE_MOTION &&
          componentPropertiesPreserved &&
          authoredGeometryChanged &&
          nativeSpringStateLive &&
          geometryConsequencePreserved &&
          negativeControlDetected &&
          recoveryPassed;

        // Leave the visible apparatus on the recovered causal path. The
        // negative control exists only inside this bounded gate.
        const finalAdaptation = applyC1DamperBetween(
          binding,
          recovered.physical.eyeAWorld,
          recovered.physical.eyeBWorld,
        );
        setMarkersFromSnapshot(finalAdaptation);
        setPhysicalRig(recovered.physical);

        return {
          schema: "rep2-c1-authority-gate-v1",
          verdict: pass ? "pass" : "fail",
          baseline: {
            rest: baselineRest,
            moving: baselineMoving,
            negativeStaleEyeB,
            recovered,
          },
          geometryMutant: {
            rest: mutantRest,
            moving: mutantMoving,
          },
          invariants: {
            physicalEyeMotionBaseline,
            physicalEyeMotionMutant,
            componentPropertiesPreserved,
            authoredGeometryChanged,
            nativeLengthMaxError,
            nativeConstraintForcePeak,
            nativeConfigurationReadbackMatches,
            nativeSpringStateLive,
            hingeResponseSeparation,
            geometryConsequencePreserved,
            negativeControlError: negativeStaleEyeB.maxError,
            negativeControlDetected,
            recoveryPassed,
          },
          acceptance: {
            correspondenceTolerance: CORRESPONDENCE_TOLERANCE,
            minimumPhysicalEyeMotion: MINIMUM_PHYSICAL_EYE_MOTION,
            minimumResponseSeparation: MINIMUM_RESPONSE_SEPARATION,
            minimumNegativeControlError: MINIMUM_NEGATIVE_CONTROL_ERROR,
            dynamicStepCount: DYNAMIC_STEP_COUNT,
          },
        };
      };

      upperMarker.position.copy(binding.bind.upperRestWorld);
      lowerMarker.position.copy(binding.bind.lowerRestWorld);
      fitCamera(initialBox.clone().expandByScalar(markerRadius * 2));
      resize();

      let evidence: C1BrowserEvidence = {
        schema: "rep2-c1-browser-authority-v3",
        status: "loading",
        mode: ADAPTER_VALIDATION_FIXTURE ? "adapter-validation" : "authority",
        donorUrl: DONOR_URL,
        partNames: [...REQUIRED_PARTS],
        partNodeOrigins: partOrigins,
        sceneBounds: initialBounds,
        meshCount,
        skinnedMeshCount,
        adapterReady: true,
        restGap: binding.bind.restGap,
        stretchFractionFromUpper: binding.bind.stretchFractionFromUpper,
        interpretationBoundary: {
          nodeOriginsAreMeasuredBindReferences: true,
          nodeOriginsAreAcceptedMechanicalEyes: false,
          arbitraryEndpointApiIsValidationOnly: true,
          arbitraryEndpointApiAvailableOnlyInAdapterFixture: true,
          dynamicVisualEyesComeOnlyFromPhysicalSnapshots: !ADAPTER_VALIDATION_FIXTURE,
        },
      };
      window.__REP2_C1__ = evidence;
      updatePanel(evidence);

      window.__REP2_C1_APPLY__ = ADAPTER_VALIDATION_FIXTURE
        ? (upper, lower) => {
            const adaptation = applyC1DamperBetween(binding, upper, lower);
            const deformedSkinnedMeshCount = refreshSkinnedMeshBounds(gltf.scene);
            const box = renderedBounds(gltf.scene);
            const browserEvidence: C1BrowserAdaptationEvidence = {
              ...adaptation,
              renderedBounds: boundsEvidence(box),
              deformedSkinnedMeshCount,
            };
            setMarkersFromSnapshot(adaptation);
            evidence = { ...evidence, currentAdaptation: browserEvidence };
            window.__REP2_C1__ = evidence;
            updatePanel(evidence);
            return browserEvidence;
          }
        : undefined;

      const authorityGate = ADAPTER_VALIDATION_FIXTURE
        ? undefined
        : await runAuthorityGate();
      evidence = { ...evidence, status: "ready", authorityGate };
      window.__REP2_C1__ = evidence;
      const finalBox = renderedBounds(gltf.scene).expandByScalar(markerRadius * 4);
      fitCamera(finalBox);
      resize();
      updatePanel(evidence);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  },
  undefined,
  (error) => setError(error instanceof Error ? error.message : String(error)),
);

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
