import { PhysicalSteeringWorld } from "./physical-steering-world.js";
import type { SteeringVariantId } from "./steering-geometry.js";

export interface V0SegmentEvidence {
  readonly variant: SteeringVariantId;
  readonly steeringInput: -0.65 | 0 | 0.65;
  readonly rackBaseline: number;
  readonly rackTarget: number;
  readonly segmentDistance: number;
  readonly segmentYaw: number;
  readonly segmentCurvature: number;
  readonly maxRackTrackingError: number;
  readonly maxOracleResidual: number;
  readonly maxTieRodError: number;
  readonly minimumLeftContactCount: number;
  readonly minimumRightContactCount: number;
  readonly minimumWorldContactCount: number;
  readonly finalSpeed: number;
}

function wrapAngle(value: number): number {
  let wrapped = value;
  while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
  while (wrapped < -Math.PI) wrapped += 2 * Math.PI;
  return wrapped;
}

export async function runV0SteeringEvidence(
  variant: SteeringVariantId,
  steeringInput: -0.65 | 0 | 0.65,
): Promise<V0SegmentEvidence> {
  const world = await PhysicalSteeringWorld.create(variant);
  try {
    world.step(180);
    world.setDrive(0.38);
    world.step(90);
    world.setSteering(steeringInput);

    // The rack and physical linkage settle before the measurement baseline.
    world.step(120);
    const baseline = world.trace();
    let previous = baseline;
    let distance = 0;
    let yaw = 0;
    let maxRackTrackingError = 0;
    let maxOracleResidual = 0;
    let maxTieRodError = 0;
    let minimumLeftContactCount = Number.POSITIVE_INFINITY;
    let minimumRightContactCount = Number.POSITIVE_INFINITY;
    let minimumWorldContactCount = Number.POSITIVE_INFINITY;

    for (let index = 0; index < 180; index += 1) {
      const current = world.step();
      const dx = current.chassis.position.x - previous.chassis.position.x;
      const dz = current.chassis.position.z - previous.chassis.position.z;
      distance += Math.hypot(dx, dz);
      yaw += wrapAngle(current.headingRadians - previous.headingRadians);
      maxRackTrackingError = Math.max(
        maxRackTrackingError,
        Math.abs(current.rackTrackingError),
      );
      maxOracleResidual = Math.max(
        maxOracleResidual,
        Math.abs(current.left.oracleResidual),
        Math.abs(current.right.oracleResidual),
      );
      maxTieRodError = Math.max(
        maxTieRodError,
        Math.abs(current.left.tieRodError ?? 0),
        Math.abs(current.right.tieRodError ?? 0),
      );
      minimumLeftContactCount = Math.min(
        minimumLeftContactCount,
        current.left.contactCount,
      );
      minimumRightContactCount = Math.min(
        minimumRightContactCount,
        current.right.contactCount,
      );
      minimumWorldContactCount = Math.min(
        minimumWorldContactCount,
        current.worldContacts,
      );
      previous = current;
    }

    return {
      variant,
      steeringInput,
      rackBaseline: baseline.rackTranslation,
      rackTarget: baseline.rackTarget,
      segmentDistance: distance,
      segmentYaw: yaw,
      segmentCurvature: distance > 0 ? yaw / distance : 0,
      maxRackTrackingError,
      maxOracleResidual,
      maxTieRodError,
      minimumLeftContactCount,
      minimumRightContactCount,
      minimumWorldContactCount,
      finalSpeed: previous.speed,
    };
  } finally {
    world.dispose();
  }
}
