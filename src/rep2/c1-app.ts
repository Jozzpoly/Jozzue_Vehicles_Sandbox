import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const DONOR_URL =
  "https://raw.githubusercontent.com/Jozzpoly/Box3d_FunProject/241fe10a9056836332c21d9614471d32d749ce3d/assets/source/Asset_Dumper.gltf";
const REQUIRED_PARTS = ["Part_Upper", "Part_Stretch", "Part_Lower"] as const;

type Point = Readonly<{ x: number; y: number; z: number }>;

interface C1BrowserEvidence {
  readonly schema: "rep2-c1-browser-import-v1";
  readonly status: "loading" | "ready" | "error";
  readonly donorUrl: string;
  readonly error?: string;
  readonly partNames?: readonly string[];
  readonly partNodeOrigins?: Readonly<Record<string, Point>>;
  readonly sceneBounds?: Readonly<{ min: Point; max: Point; size: Point }>;
  readonly meshCount?: number;
  readonly skinnedMeshCount?: number;
  readonly interpretationBoundary?: Readonly<{
    nodeOriginsAreMeasuredBindReferences: true;
    nodeOriginsAreAcceptedMechanicalEyes: false;
  }>;
}

declare global {
  interface Window {
    __REP2_C1__?: C1BrowserEvidence;
  }
}

function point(v: THREE.Vector3): Point {
  return { x: v.x, y: v.y, z: v.z };
}

function finitePoint(value: Point): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
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
shell.style.gridTemplateColumns = "minmax(0, 1fr) 340px";
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
renderer.setSize(viewport.clientWidth || window.innerWidth - 340, viewport.clientHeight || window.innerHeight);
viewport.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x11161d);
const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x30343d, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(4, 6, 5);
scene.add(key);
scene.add(new THREE.GridHelper(6, 24, 0x3b4654, 0x252d37));

window.__REP2_C1__ = {
  schema: "rep2-c1-browser-import-v1",
  status: "loading",
  donorUrl: DONOR_URL,
};
panel.textContent = "C1.0 — loading exact donor…";

function addBindReferenceMarker(position: THREE.Vector3, radius: number): void {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0xffc857, roughness: 0.45 }),
  );
  marker.position.copy(position);
  scene.add(marker);
}

function fitCamera(box: THREE.Box3): void {
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z, 0.5);
  camera.position.copy(center).add(new THREE.Vector3(span * 2.0, span * 0.7, span * 2.4));
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

const loader = new GLTFLoader();
loader.load(
  DONOR_URL,
  (gltf) => {
    const partOrigins: Record<string, Point> = {};
    const partObjects: THREE.Object3D[] = [];

    for (const name of REQUIRED_PARTS) {
      const object = gltf.scene.getObjectByName(name);
      if (!object) {
        throw new Error(`required donor node ${name} not found by GLTFLoader`);
      }
      partObjects.push(object);
    }

    gltf.scene.updateMatrixWorld(true);
    for (const object of partObjects) {
      const world = object.getWorldPosition(new THREE.Vector3());
      const measured = point(world);
      if (!finitePoint(measured)) {
        throw new Error(`non-finite bind reference for ${object.name}`);
      }
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

    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    if (box.isEmpty()) throw new Error("loaded donor has empty rendered bounds");
    const size = box.getSize(new THREE.Vector3());
    const markerRadius = Math.max(Math.max(size.x, size.y, size.z) * 0.025, 0.02);
    addBindReferenceMarker(new THREE.Vector3(
      partOrigins.Part_Upper.x,
      partOrigins.Part_Upper.y,
      partOrigins.Part_Upper.z,
    ), markerRadius);
    addBindReferenceMarker(new THREE.Vector3(
      partOrigins.Part_Lower.x,
      partOrigins.Part_Lower.y,
      partOrigins.Part_Lower.z,
    ), markerRadius);
    fitCamera(box.clone().expandByScalar(markerRadius * 2));
    resize();

    const evidence: C1BrowserEvidence = {
      schema: "rep2-c1-browser-import-v1",
      status: "ready",
      donorUrl: DONOR_URL,
      partNames: [...REQUIRED_PARTS],
      partNodeOrigins: partOrigins,
      sceneBounds: {
        min: point(box.min),
        max: point(box.max),
        size: point(size),
      },
      meshCount,
      skinnedMeshCount,
      interpretationBoundary: {
        nodeOriginsAreMeasuredBindReferences: true,
        nodeOriginsAreAcceptedMechanicalEyes: false,
      },
    };
    window.__REP2_C1__ = evidence;
    panel.textContent = [
      "Rep2 C1.0 — real donor import",
      "",
      "Yellow markers = authored node origins only.",
      "They are NOT yet accepted as mechanical eyes.",
      "",
      JSON.stringify(evidence, null, 2),
    ].join("\n");
  },
  undefined,
  (error) => {
    const message = error instanceof Error ? error.message : String(error);
    window.__REP2_C1__ = {
      schema: "rep2-c1-browser-import-v1",
      status: "error",
      donorUrl: DONOR_URL,
      error: message,
    };
    panel.textContent = `C1.0 donor load FAILED\n\n${message}`;
  },
);

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
