import * as THREE from "three";
import type {
  PhysicalSteeringTrace,
  V0BodyFrame,
} from "./physical-steering-world.js";
import type {
  PlanarPoint,
  SteeringGeometry,
  SteeringSide,
} from "./steering-geometry.js";

const UP = new THREE.Vector3(0, 1, 0);
const TRAIL_Y = 0.018;
const TRAIL_SAMPLE_DISTANCE = 0.04;
const MAX_TRAIL_POINTS = 1_200;
const BUILD_Y = 0.32;

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

function trailGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(MAX_TRAIL_POINTS * 3), 3),
  );
  geometry.setDrawRange(0, 0);
  return geometry;
}

function updateTrailGeometry(
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>,
  points: readonly THREE.Vector3[],
): void {
  const position = line.geometry.getAttribute("position");
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
    position.setXYZ(index, point.x, point.y, point.z);
  }
  position.needsUpdate = true;
  line.geometry.setDrawRange(0, points.length);
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
  readonly #frontCue: THREE.Mesh;
  readonly #currentTrail: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  readonly #ghostTrail: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  readonly #currentTrailPoints: THREE.Vector3[] = [];
  #ghostTrailPoints: THREE.Vector3[] = [];
  readonly #raycaster = new THREE.Raycaster();
  readonly #dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BUILD_Y);
  readonly #buildPickupWorld: Record<SteeringSide, THREE.Vector3> = {
    LEFT: new THREE.Vector3(),
    RIGHT: new THREE.Vector3(),
  };

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

    const frontCueGeometry = new THREE.ConeGeometry(0.16, 0.36, 3);
    frontCueGeometry.rotateZ(-Math.PI / 2);
    this.#frontCue = new THREE.Mesh(frontCueGeometry, material(0xffd36a, 0.3));

    this.#currentTrail = new THREE.Line(
      trailGeometry(),
      new THREE.LineBasicMaterial({
        color: 0xffc857,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.#currentTrail.frustumCulled = false;
    this.#ghostTrail = new THREE.Line(
      trailGeometry(),
      new THREE.LineBasicMaterial({
        color: 0xa395ff,
        transparent: true,
        opacity: 0.82,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.#ghostTrail.frustumCulled = false;
    this.#currentTrail.visible = false;
    this.#ghostTrail.visible = false;

    for (const mesh of [
      this.#chassis,
      this.#rack,
      ...this.#knuckles,
      ...this.#wheels,
      ...this.#tieRods,
      ...this.#steeringArms,
      ...this.#markers,
      this.#frontCue,
    ]) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.#scene.add(mesh);
    }
    this.#scene.add(this.#ghostTrail, this.#currentTrail);
  }

  beginRun(): boolean {
    const hasPreviousTrail = this.#currentTrailPoints.length >= 2;
    if (hasPreviousTrail) {
      this.#ghostTrailPoints = this.#currentTrailPoints.map((point) =>
        point.clone(),
      );
      updateTrailGeometry(this.#ghostTrail, this.#ghostTrailPoints);
      this.#ghostTrail.visible = true;
    }
    this.#currentTrailPoints.length = 0;
    updateTrailGeometry(this.#currentTrail, this.#currentTrailPoints);
    this.#currentTrail.visible = false;
    return hasPreviousTrail;
  }

  get currentTrailPointCount(): number {
    return this.#currentTrailPoints.length;
  }

  get ghostTrailPointCount(): number {
    return this.#ghostTrailPoints.length;
  }

  renderBuild(geometry: SteeringGeometry): void {
    const chassis = new THREE.Vector3(0, 0.53, 0);
    const leftPivot = new THREE.Vector3(
      geometry.frontAxleX,
      BUILD_Y,
      -geometry.trackHalfWidth,
    );
    const rightPivot = new THREE.Vector3(
      geometry.frontAxleX,
      BUILD_Y,
      geometry.trackHalfWidth,
    );
    const leftPickup = leftPivot
      .clone()
      .add(new THREE.Vector3(geometry.pickupLocal.LEFT.x, 0, geometry.pickupLocal.LEFT.z));
    const rightPickup = rightPivot
      .clone()
      .add(new THREE.Vector3(geometry.pickupLocal.RIGHT.x, 0, geometry.pickupLocal.RIGHT.z));
    const leftRack = new THREE.Vector3(
      geometry.rackX,
      BUILD_Y,
      -geometry.rackHalfWidth,
    );
    const rightRack = new THREE.Vector3(
      geometry.rackX,
      BUILD_Y,
      geometry.rackHalfWidth,
    );
    this.#buildPickupWorld.LEFT.copy(leftPickup);
    this.#buildPickupWorld.RIGHT.copy(rightPickup);

    this.#chassis.position.copy(chassis);
    this.#chassis.quaternion.identity();
    this.#rack.position.set(geometry.rackX, BUILD_Y, 0);
    this.#rack.quaternion.identity();
    this.#knuckles[0].position.copy(leftPivot);
    this.#knuckles[1].position.copy(rightPivot);
    this.#knuckles[0].quaternion.identity();
    this.#knuckles[1].quaternion.identity();
    this.#wheels[0].position.copy(leftPivot);
    this.#wheels[1].position.copy(rightPivot);
    this.#wheels[2].position.set(-0.66, BUILD_Y, -geometry.trackHalfWidth);
    this.#wheels[3].position.set(-0.66, BUILD_Y, geometry.trackHalfWidth);
    for (const wheel of this.#wheels) wheel.quaternion.identity();
    segment(this.#tieRods[0], leftRack, leftPickup, 0.025);
    segment(this.#tieRods[1], rightRack, rightPickup, 0.025);
    segment(this.#steeringArms[0], leftPivot, leftPickup, 0.034);
    segment(this.#steeringArms[1], rightPivot, rightPickup, 0.034);
    const points = [leftRack, leftPickup, rightRack, rightPickup];
    this.#markers.forEach((marker, index) => {
      marker.position.copy(points[index]!);
      marker.scale.setScalar(index % 2 === 1 ? 1.9 : 1);
    });
    this.#frontCue.position.set(geometry.frontAxleX + 1.05, 0.62, 0);
    this.#frontCue.quaternion.identity();
    this.#currentTrail.visible = false;
    this.#ghostTrail.visible = false;
    this.#resize();
    this.#camera.position.set(3.15, 4.1, 3.55);
    this.#camera.lookAt(new THREE.Vector3(0.35, 0.2, 0));
    this.#renderer.render(this.#scene, this.#camera);
  }

  pickBuildPickup(clientX: number, clientY: number): SteeringSide | null {
    const rect = this.#renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.#raycaster.setFromCamera(pointer, this.#camera);
    const hits = this.#raycaster.intersectObjects(
      [this.#markers[1], this.#markers[3]],
      false,
    );
    const hit = hits[0]?.object;
    return hit === this.#markers[1]
      ? "LEFT"
      : hit === this.#markers[3]
        ? "RIGHT"
        : null;
  }

  buildPickupFromPointer(
    side: SteeringSide,
    clientX: number,
    clientY: number,
  ): PlanarPoint | null {
    const rect = this.#renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.#raycaster.setFromCamera(pointer, this.#camera);
    const point = new THREE.Vector3();
    if (!this.#raycaster.ray.intersectPlane(this.#dragPlane, point)) return null;
    const pivotZ = side === "LEFT" ? -0.62 : 0.62;
    return { x: point.x - 0.66, z: point.z - pivotZ };
  }

  pickupScreenPoint(side: SteeringSide): { x: number; y: number } {
    const point = this.#buildPickupWorld[side].clone().project(this.#camera);
    const rect = this.#renderer.domElement.getBoundingClientRect();
    return {
      x: rect.left + ((point.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - point.y) / 2) * rect.height,
    };
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
      marker.scale.setScalar(1);
    });

    this.#appendTrail(trace.chassis.position);
    this.#frontCue.position
      .copy(this.#chassis.position)
      .add(new THREE.Vector3(1.05, 0.3, 0).applyQuaternion(this.#chassis.quaternion));
    this.#frontCue.quaternion.copy(this.#chassis.quaternion);

    const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(
      this.#chassis.quaternion,
    );
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const target = this.#chassis.position
      .clone()
      .addScaledVector(forward, 0.45)
      .add(new THREE.Vector3(0, 0.25, 0));
    const cameraScale = THREE.MathUtils.clamp(
      1.15 / this.#camera.aspect,
      1,
      1.8,
    );
    this.#camera.position
      .copy(target)
      .addScaledVector(forward, -4.6 * cameraScale)
      .addScaledVector(right, 1.2 * cameraScale)
      .add(new THREE.Vector3(0, 2.65 * cameraScale, 0));
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
    this.#currentTrail.geometry.dispose();
    this.#currentTrail.material.dispose();
    this.#ghostTrail.geometry.dispose();
    this.#ghostTrail.material.dispose();
  }

  #appendTrail(position: Readonly<{ x: number; z: number }>): void {
    const point = new THREE.Vector3(position.x, TRAIL_Y, position.z);
    const last = this.#currentTrailPoints.at(-1);
    if (last !== undefined && point.distanceTo(last) < TRAIL_SAMPLE_DISTANCE) {
      return;
    }
    this.#currentTrailPoints.push(point);
    if (this.#currentTrailPoints.length > MAX_TRAIL_POINTS) {
      this.#currentTrailPoints.splice(
        0,
        this.#currentTrailPoints.length - MAX_TRAIL_POINTS,
      );
    }
    updateTrailGeometry(this.#currentTrail, this.#currentTrailPoints);
    this.#currentTrail.visible = this.#currentTrailPoints.length >= 2;
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
