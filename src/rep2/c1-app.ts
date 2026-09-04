import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  applyC1DamperBetween,
  bindC1DamperDonor,
  type C1DamperAdaptationSnapshot,
  type C1DamperBinding,
  type C1Point3,
} from "./c1-damper-adapter.js";

const DONOR_URL =
  "https://raw.githubusercontent.com/Jozzpoly/Box3d_FunProject/241fe10a9056836332c21d9614471d32d749ce3d/assets/source/Asset_Dumper.gltf";
const REQUIRED_PARTS = ["Part_Upper", "Part_Stretch", "Part_Lower"] as const;

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

interface C1BrowserEvidence {
  readonly schema: "rep2-c1-browser-import-v1";
  readonly status: "loading" | "ready" | "error";
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
  readonly interpretationBoundary?: Readonly<{
    nodeOriginsAreMeasuredBindReferences: true;
    nodeOriginsAreAcceptedMechanicalEyes: false;
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
  schema: "rep2-c1-browser-import-v1",
  status: "loading",
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
    skinned.boundingBox = null;
    skinned.boundingSphere = null;
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
  panel.textContent = [
    "Rep2 C1 — real donor correspondence apparatus",
    "",
    "Magenta markers = visual attachment references reconstructed from the real donor scene graph.",
    "C1.1 endpoint inputs are apparatus targets only; they are NOT yet physical authority.",
    "Roll convention is experiment-local minimal rotation, not product semantics.",
    "",
    JSON.stringify(evidence, null, 2),
  ].join("\n");
}

function setError(message: string): void {
  window.__REP2_C1_APPLY__ = undefined;
  const evidence: C1BrowserEvidence = {
    schema: "rep2-c1-browser-import-v1",
    status: "error",
    donorUrl: DONOR_URL,
    error: message,
  };
  window.__REP2_C1__ = evidence;
  panel.textContent = `C1 donor apparatus FAILED\n\n${message}`;
}

const loader = new GLTFLoader();
loader.load(
  DONOR_URL,
  (gltf) => {
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

      upperMarker.position.copy(binding.bind.upperRestWorld);
      lowerMarker.position.copy(binding.bind.lowerRestWorld);
      fitCamera(initialBox.clone().expandByScalar(markerRadius * 2));
      resize();

      let evidence: C1BrowserEvidence = {
        schema: "rep2-c1-browser-import-v1",
        status: "ready",
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
        },
      };
      window.__REP2_C1__ = evidence;
      updatePanel(evidence);

      window.__REP2_C1_APPLY__ = (upper, lower) => {
        const adaptation = applyC1DamperBetween(binding, upper, lower);
        const deformedSkinnedMeshCount = refreshSkinnedMeshBounds(gltf.scene);
        const box = renderedBounds(gltf.scene);
        const browserEvidence: C1BrowserAdaptationEvidence = {
          ...adaptation,
          renderedBounds: boundsEvidence(box),
          deformedSkinnedMeshCount,
        };
        setMarkersFromSnapshot(adaptation);
        fitCamera(box.clone().expandByScalar(markerRadius * 2));
        resize();
        evidence = { ...evidence, currentAdaptation: browserEvidence };
        window.__REP2_C1__ = evidence;
        updatePanel(evidence);
        return browserEvidence;
      };
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
