import * as THREE from "three";
import type { Rep2SuspensionTrace } from "./suspension-link-world.js";
import {
  applyBodyFrame,
  measureRep2VisualCorrespondence,
  placeUnitYSegment,
  type Rep2VisualCorrespondenceSnapshot,
} from "./visual-correspondence.js";

function material(color: number, roughness = 0.72): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.12 });
}

export class Rep2Projection {
  readonly #renderer: THREE.WebGLRenderer;
  readonly #scene = new THREE.Scene();
  readonly #camera = new THREE.PerspectiveCamera(50, 1, 0.02, 100);
  readonly #chassis: THREE.Mesh;
  readonly #arm: THREE.Mesh;
  readonly #pivot: THREE.Mesh;
  readonly #selectedWheel: THREE.Mesh;
  readonly #oppositeRearWheel: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    this.#renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.#renderer.shadowMap.enabled = true;
    this.#scene.background = new THREE.Color(0x10171a);

    this.#scene.add(new THREE.HemisphereLight(0xd6efff, 0x26312d, 2.2));
    const sun = new THREE.DirectionalLight(0xfff3da, 3.0);
    sun.position.set(-4, 8, 5);
    sun.castShadow = true;
    this.#scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({ color: 0x26322d, roughness: 0.96 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.#scene.add(ground);
    const grid = new THREE.GridHelper(16, 32, 0x52756d, 0x344740);
    grid.position.y = 0.002;
    this.#scene.add(grid);

    const chassisMaterial = material(0x3c6574, 0.58);
    chassisMaterial.transparent = true;
    chassisMaterial.opacity = 0.35;
    chassisMaterial.depthWrite = false;
    this.#chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.32, 1.0),
      chassisMaterial,
    );

    this.#arm = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 16),
      material(0xe3974c, 0.42),
    );
    this.#pivot = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 18, 12),
      material(0xffd36a, 0.34),
    );

    const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.17, 28);
    wheelGeometry.rotateX(Math.PI / 2);
    this.#selectedWheel = new THREE.Mesh(wheelGeometry, material(0x182023, 0.82));
    this.#oppositeRearWheel = new THREE.Mesh(wheelGeometry, material(0x3c4649, 0.84));

    for (const mesh of [
      this.#chassis,
      this.#arm,
      this.#pivot,
      this.#selectedWheel,
      this.#oppositeRearWheel,
    ]) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.#scene.add(mesh);
    }

    this.#camera.position.set(2.8, 2.4, 3.6);
    this.#camera.lookAt(new THREE.Vector3(-0.4, 0.25, -0.25));
  }

  render(trace: Rep2SuspensionTrace): Rep2VisualCorrespondenceSnapshot {
    this.#resize();
    applyBodyFrame(this.#chassis, trace.chassis);
    applyBodyFrame(this.#selectedWheel, trace.selectedWheel);
    applyBodyFrame(this.#oppositeRearWheel, trace.oppositeRearWheel);

    this.#pivot.position.set(
      trace.hingeWorldFromArm.x,
      trace.hingeWorldFromArm.y,
      trace.hingeWorldFromArm.z,
    );
    this.#pivot.quaternion.identity();
    this.#pivot.scale.setScalar(1);

    placeUnitYSegment(
      this.#arm,
      trace.hingeWorldFromArm,
      trace.wheelEndpointWorldFromArm,
      0.045,
    );

    this.#renderer.render(this.#scene, this.#camera);
    return measureRep2VisualCorrespondence(
      trace,
      this.#arm,
      this.#pivot,
      this.#selectedWheel,
    );
  }

  dispose(): void {
    this.#renderer.dispose();
    this.#scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const item of materials) item.dispose();
    });
  }

  #resize(): void {
    const canvas = this.#renderer.domElement;
    const width = Math.max(1, canvas.clientWidth || canvas.width || 1);
    const height = Math.max(1, canvas.clientHeight || canvas.height || 1);
    const pixelRatio = this.#renderer.getPixelRatio();
    const targetWidth = Math.round(width * pixelRatio);
    const targetHeight = Math.round(height * pixelRatio);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      this.#renderer.setSize(width, height, false);
    }
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
  }
}
