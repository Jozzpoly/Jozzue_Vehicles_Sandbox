import type * as THREE from "three";
import {
  bindC1DamperDonor,
  type C1DamperBinding,
} from "../rep2/c1-damper-adapter.js";

export interface Rep4ScaledDamperDonor {
  readonly binding: C1DamperBinding;
  readonly sourceRestGap: number;
  readonly targetRestGap: number;
  readonly scaleFactor: number;
}

const SCALE_TOLERANCE = 1e-9;

export function bindRep4DamperDonorAtPhysicalRestLength(
  scene: THREE.Object3D,
  targetRestGap: number,
): Rep4ScaledDamperDonor {
  if (!Number.isFinite(targetRestGap) || targetRestGap <= 0) {
    throw new RangeError("Rep4 visual damper target rest gap must be finite and positive.");
  }

  const sourceBinding = bindC1DamperDonor(scene);
  const sourceRestGap = sourceBinding.bind.restGap;
  const scaleFactor = targetRestGap / sourceRestGap;
  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
    throw new RangeError("Rep4 visual damper scale factor must be finite and positive.");
  }

  // The Blockbench donor's authored units are visual asset units, not metres.
  // Apply one uniform root-scale policy before the already-qualified C1 endpoint
  // adapter so rigid end geometry and thickness scale with the physical component
  // rest length instead of leaving a metre-scale donor around a 0.5 m mechanism.
  scene.scale.multiplyScalar(scaleFactor);
  scene.updateMatrixWorld(true);

  const binding = bindC1DamperDonor(scene);
  const error = Math.abs(binding.bind.restGap - targetRestGap);
  if (error > SCALE_TOLERANCE) {
    throw new Error(
      `Rep4 visual damper scaling failed: rest-gap error ${error} exceeds ${SCALE_TOLERANCE}.`,
    );
  }

  return Object.freeze({
    binding,
    sourceRestGap,
    targetRestGap,
    scaleFactor,
  });
}
