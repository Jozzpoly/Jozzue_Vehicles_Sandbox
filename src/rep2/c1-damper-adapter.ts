import * as THREE from "three";

export interface C1Point3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface C1DamperBindState {
  readonly upperRestWorld: THREE.Vector3;
  readonly stretchRestWorld: THREE.Vector3;
  readonly lowerRestWorld: THREE.Vector3;
  readonly authoredAxis: THREE.Vector3;
  readonly restGap: number;
  readonly stretchFractionFromUpper: number;
  readonly upperRestWorldQuaternion: THREE.Quaternion;
  readonly stretchRestWorldQuaternion: THREE.Quaternion;
  readonly lowerRestWorldQuaternion: THREE.Quaternion;
  readonly upperRestWorldScale: THREE.Vector3;
  readonly stretchRestWorldScale: THREE.Vector3;
  readonly lowerRestWorldScale: THREE.Vector3;
}

export interface C1DamperBinding {
  readonly scene: THREE.Object3D;
  readonly upper: THREE.Object3D;
  readonly stretch: THREE.Object3D;
  readonly lower: THREE.Object3D;
  readonly bind: C1DamperBindState;
}

export interface C1DamperAdaptationSnapshot {
  readonly requestedUpperWorld: C1Point3;
  readonly requestedLowerWorld: C1Point3;
  readonly visualUpperWorld: C1Point3;
  readonly visualStretchWorld: C1Point3;
  readonly visualLowerWorld: C1Point3;
  readonly visualUpperScale: C1Point3;
  readonly visualStretchScale: C1Point3;
  readonly visualLowerScale: C1Point3;
  readonly upperError: number;
  readonly lowerError: number;
  readonly liveGap: number;
  readonly stretchScaleRatio: number;
  readonly stretchFractionFromUpper: number;
  readonly apparatusRollConvention: "minimal-rotation-from-authored-axis";
}

const EPSILON = 1e-8;

function point(value: THREE.Vector3): C1Point3 {
  return { x: value.x, y: value.y, z: value.z };
}

function vector(value: C1Point3): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function requireFiniteVector(value: THREE.Vector3, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must be finite`);
  }
}

function worldTransform(object: THREE.Object3D): {
  readonly position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
  readonly scale: THREE.Vector3;
} {
  object.updateWorldMatrix(true, false);
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  object.matrixWorld.decompose(position, quaternion, scale);
  return { position, quaternion, scale };
}

function requireUniqueObject(scene: THREE.Object3D, name: string): THREE.Object3D {
  const matches: THREE.Object3D[] = [];
  scene.traverse((object) => {
    if (object.name === name) matches.push(object);
  });
  if (matches.length !== 1) {
    throw new Error(`C1 damper donor requires exactly one ${name}; found ${matches.length}`);
  }
  const object = matches[0];
  if (!object) throw new Error(`C1 damper donor lost ${name} after traversal`);
  return object;
}

function setWorldTransform(
  object: THREE.Object3D,
  worldPosition: THREE.Vector3,
  worldQuaternion: THREE.Quaternion,
  worldScale: THREE.Vector3,
): void {
  const parent = object.parent;
  if (!parent) throw new Error(`C1 donor part ${object.name} must have a parent`);

  parent.updateWorldMatrix(true, false);
  const desiredWorld = new THREE.Matrix4().compose(worldPosition, worldQuaternion, worldScale);
  const local = parent.matrixWorld.clone().invert().multiply(desiredWorld);
  local.decompose(object.position, object.quaternion, object.scale);
  object.updateMatrix();
  object.updateWorldMatrix(false, false);
}

export function bindC1DamperDonor(scene: THREE.Object3D): C1DamperBinding {
  scene.updateMatrixWorld(true);
  const upper = requireUniqueObject(scene, "Part_Upper");
  const stretch = requireUniqueObject(scene, "Part_Stretch");
  const lower = requireUniqueObject(scene, "Part_Lower");

  const upperRest = worldTransform(upper);
  const stretchRest = worldTransform(stretch);
  const lowerRest = worldTransform(lower);
  const restSpan = upperRest.position.clone().sub(lowerRest.position);
  const restGap = restSpan.length();
  if (!Number.isFinite(restGap) || restGap <= EPSILON) {
    throw new RangeError("C1 donor Upper/Lower bind references must define a finite non-zero span");
  }
  const authoredAxis = restSpan.multiplyScalar(1 / restGap);
  const stretchFractionFromUpper = THREE.MathUtils.clamp(
    upperRest.position.clone().sub(stretchRest.position).dot(authoredAxis) / restGap,
    0,
    1,
  );

  return {
    scene,
    upper,
    stretch,
    lower,
    bind: {
      upperRestWorld: upperRest.position.clone(),
      stretchRestWorld: stretchRest.position.clone(),
      lowerRestWorld: lowerRest.position.clone(),
      authoredAxis: authoredAxis.clone(),
      restGap,
      stretchFractionFromUpper,
      upperRestWorldQuaternion: upperRest.quaternion.clone(),
      stretchRestWorldQuaternion: stretchRest.quaternion.clone(),
      lowerRestWorldQuaternion: lowerRest.quaternion.clone(),
      upperRestWorldScale: upperRest.scale.clone(),
      stretchRestWorldScale: stretchRest.scale.clone(),
      lowerRestWorldScale: lowerRest.scale.clone(),
    },
  };
}

export function applyC1DamperBetween(
  binding: C1DamperBinding,
  requestedUpperWorld: C1Point3,
  requestedLowerWorld: C1Point3,
): C1DamperAdaptationSnapshot {
  const top = vector(requestedUpperWorld);
  const bottom = vector(requestedLowerWorld);
  requireFiniteVector(top, "C1 upper endpoint");
  requireFiniteVector(bottom, "C1 lower endpoint");

  const liveSpan = top.clone().sub(bottom);
  const liveGap = liveSpan.length();
  if (!Number.isFinite(liveGap) || liveGap <= EPSILON) {
    throw new RangeError("C1 damper endpoints must define a finite non-zero span");
  }
  const liveAxis = liveSpan.multiplyScalar(1 / liveGap);

  // C1.1 needs one deterministic bounded roll convention, not final component
  // orientation semantics. This minimal rotation maps the authored damper axis
  // onto the live axis while introducing no second endpoint or roll state.
  const axisRotation = new THREE.Quaternion().setFromUnitVectors(binding.bind.authoredAxis, liveAxis);

  const upperQuaternion = axisRotation.clone().multiply(binding.bind.upperRestWorldQuaternion);
  const lowerQuaternion = axisRotation.clone().multiply(binding.bind.lowerRestWorldQuaternion);
  const stretchQuaternion = axisRotation.clone().multiply(binding.bind.stretchRestWorldQuaternion);
  const stretchScaleRatio = liveGap / binding.bind.restGap;
  const stretchScale = binding.bind.stretchRestWorldScale.clone();
  stretchScale.y *= stretchScaleRatio;

  const stretchTarget = top.clone().lerp(bottom, binding.bind.stretchFractionFromUpper);

  setWorldTransform(
    binding.upper,
    top,
    upperQuaternion,
    binding.bind.upperRestWorldScale.clone(),
  );
  setWorldTransform(
    binding.lower,
    bottom,
    lowerQuaternion,
    binding.bind.lowerRestWorldScale.clone(),
  );
  setWorldTransform(binding.stretch, stretchTarget, stretchQuaternion, stretchScale);

  binding.scene.updateMatrixWorld(true);
  const upperWorld = worldTransform(binding.upper);
  const stretchWorld = worldTransform(binding.stretch);
  const lowerWorld = worldTransform(binding.lower);

  return {
    requestedUpperWorld: point(top),
    requestedLowerWorld: point(bottom),
    visualUpperWorld: point(upperWorld.position),
    visualStretchWorld: point(stretchWorld.position),
    visualLowerWorld: point(lowerWorld.position),
    visualUpperScale: point(upperWorld.scale),
    visualStretchScale: point(stretchWorld.scale),
    visualLowerScale: point(lowerWorld.scale),
    upperError: upperWorld.position.distanceTo(top),
    lowerError: lowerWorld.position.distanceTo(bottom),
    liveGap,
    stretchScaleRatio,
    stretchFractionFromUpper: binding.bind.stretchFractionFromUpper,
    apparatusRollConvention: "minimal-rotation-from-authored-axis",
  };
}
