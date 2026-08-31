import * as THREE from "three";
import type {
  PhysicalSteeringTrace,
  V0BodyFrame,
} from "./physical-steering-world.js";

const UP = new THREE.Vector3(0, 1, 0);

function material(color: number, roughness = 0.7): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.15 });
}

function frame(mesh: THREE.Object3D, value: V0BodyFrame): void {
  mesh.position.set(value.position.x, value.position.y, value.position.z);
  mesh.quaternion.set(
    value.rotation.v.x,
    value.rotation.v.y,
    value.rotation.v.z,
    value.rotation.s,
  );
}

function segment(
  mesh: THREE.Mesh,
  a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>,
  radius: number,
): void {
  const start = new THREE.Vector3(a.x, a.y, a.z);
  const end = new THREE.Vector3(b.x, b.y, b.z);
  const delta = end.clone().sub(start);
  const length = Math.max(1e-6, delta.length());
  mesh.position.copy(start.add(end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(UP, delta.normalize());
  mesh.scale.set(radius, length, radius);
}

export class V0Projection {
  readonly #renderer: THREE.WebGLRenderer;
  readonly #scene = new THREE.Scene();
  readonly #camera = new THREE.PerspectiveCamera(48, 1, 0.02, 200);
  readonly #chassis: THREE.Mesh;
  readonly #rack: THREE.Mesh;
  readonly #knuckles: readonly [THREE.Mesh, THREE.Mesh];
  readonly #wheels: readonly [THREE.Mesh, THREE.Mesh, THREE.Mesh, THREE.Mesh];
  readonly #tieRods: readonly [THREE.Mesh, THREE.Mesh];
  readonly #steeringArms: readonly [THREE.Mesh, THREE.Mesh];
  readonly #markers: readonly [THREE.Mesh, THREE.Mesh, THREE.Mesh, THREE.Mesh];

  constructor(canvas: HTMLCanvasElement) {
    this.#renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.#renderer.shadowMap.enabled = true;
    this.#renderer.shadowMap.type = THREE.PCFShadowMap;
    this.#scene.background = new THREE.Color(0x10171a);
    this.#scene.fog = new THREE.Fog(0x10171a, 18, 65);

    const hemi = new THREE.HemisphereLight(0xcdefff, 0x28302b, 2.1);
    this.#scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4d6, 3.2);
    sun.position.set(-5, 10, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.#scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x27332e, roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.#scene.add(ground);
    const grid = new THREE.GridHelper(120, 120, 0x4b7068, 0x32443f);
    grid.position.y = 0.002;
    this.#scene.add(grid);

    const chassisMaterial = material(0x3c6574, 0.55);
    chassisMaterial.transparent = true;
    chassisMaterial.opacity = 0.48;
    chassisMaterial.depthWrite = false;
    this.#chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.32, 1),
      chassisMaterial,
    );
    this.#rack = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.78),
      material(0xe8b04b, 0.42),
    );
    const knuckleGeometry = new THREE.BoxGeometry(0.15, 0.22, 0.13);
    this.#knuckles = [
      new THREE.Mesh(knuckleGeometry, material(0xd5734c)),
      new THREE.Mesh(knuckleGeometry, material(0xd5734c)),
    ];
    const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.17, 24);
    wheelGeometry.rotateX(Math.PI / 2);
    this.#wheels = ([0, 1, 2, 3] as const).map(
      () => new THREE.Mesh(wheelGeometry, material(0x182023, 0.82)),
    ) as unknown as readonly [THREE.Mesh, THREE.Mesh, THREE.Mesh, THREE.Mesh];
    const unitSegment = new THREE.CylinderGeometry(1, 1, 1, 12);
    this.#tieRods = [
      new THREE.Mesh(unitSegment, material(0x61d7e7, 0.34)),
      new THREE.Mesh(unitSegment, material(0x61d7e7, 0.34)),
    ];
    this.#steeringArms = [
      new THREE.Mesh(unitSegment, material(0xe77d55, 0.34)),
      new THREE.Mesh(unitSegment, material(0xe77d55, 0.34)),
    ];
    const markerGeometry = new THREE.SphereGeometry(0.045, 16, 10);
    this.#markers = ([0, 1, 2, 3] as const).map(
      () => new THREE.Mesh(markerGeometry, material(0xffd36a, 0.3)),
    ) as unknown as readonly [THREE.Mesh, THREE.Mesh, THREE.Mesh, THREE.Mesh];

    for (const mesh of [
      this.#chassis,
      this.#rack,
      ...this.#knuckles,
      ...this.#wheels,
      ...this.#tieRods,
      ...this.#steeringArms,
      ...this.#markers,
    ]) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.#scene.add(mesh);
    }
  }

  render(trace: PhysicalSteeringTrace): void {
    this.#resize();
    frame(this.#chassis, trace.chassis);
    frame(this.#rack, trace.rack);
    frame(this.#knuckles[0], trace.left);
    frame(this.#knuckles[1], trace.right);
    frame(this.#wheels[0], trace.left.wheel);
    frame(this.#wheels[1], trace.right.wheel);
    frame(this.#wheels[2], trace.rearWheels[0]);
    frame(this.#wheels[3], trace.rearWheels[1]);

    segment(
      this.#tieRods[0],
      trace.left.rackEndpointWorld,
      trace.left.steeringPickupWorld,
      0.025,
    );
    segment(
      this.#tieRods[1],
      trace.right.rackEndpointWorld,
      trace.right.steeringPickupWorld,
      0.025,
    );
    segment(
      this.#steeringArms[0],
      trace.left.position,
      trace.left.steeringPickupWorld,
      0.034,
    );
    segment(
      this.#steeringArms[1],
      trace.right.position,
      trace.right.steeringPickupWorld,
      0.034,
    );
    const points = [
      trace.left.rackEndpointWorld,
      trace.left.steeringPickupWorld,
      trace.right.rackEndpointWorld,
      trace.right.steeringPickupWorld,
    ];
    this.#markers.forEach((marker, index) => {
      const point = points[index]!;
      marker.position.set(point.x, point.y, point.z);
    });

    const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(
      this.#chassis.quaternion,
    );
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const target = this.#chassis.position
      .clone()
      .addScaledVector(forward, 0.45)
      .add(new THREE.Vector3(0, 0.25, 0));
    this.#camera.position
      .copy(target)
      .addScaledVector(forward, 3.6)
      .addScaledVector(right, 2.5)
      .add(new THREE.Vector3(0, 2.35, 0));
    this.#camera.lookAt(target);
    this.#renderer.render(this.#scene, this.#camera);
  }

  dispose(): void {
    const disposedGeometry = new Set<THREE.BufferGeometry>();
    const disposedMaterial = new Set<THREE.Material>();
    this.#scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (!disposedGeometry.has(object.geometry)) {
        disposedGeometry.add(object.geometry);
        object.geometry.dispose();
      }
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const entry of materials) {
        if (!disposedMaterial.has(entry)) {
          disposedMaterial.add(entry);
          entry.dispose();
        }
      }
    });
    this.#renderer.dispose();
  }

  #resize(): void {
    const canvas = this.#renderer.domElement;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const pixelRatio = this.#renderer.getPixelRatio();
    if (
      canvas.width !== Math.floor(width * pixelRatio) ||
      canvas.height !== Math.floor(height * pixelRatio)
    ) {
      this.#renderer.setSize(width, height, false);
      this.#camera.aspect = width / height;
      this.#camera.updateProjectionMatrix();
    }
  }
}
