export type SteeringSide = "LEFT" | "RIGHT";
export type SteeringVariantId = "A" | "B" | "AUTHORED";

export interface PlanarPoint {
  readonly x: number;
  readonly z: number;
}

export interface SteeringGeometry {
  readonly id: SteeringVariantId;
  readonly frontAxleX: number;
  readonly trackHalfWidth: number;
  readonly rackX: number;
  readonly rackHalfWidth: number;
  readonly rackTravel: number;
  /** Authored vector from each knuckle pivot to its steering-arm pickup. */
  readonly pickupLocal: Readonly<Record<SteeringSide, PlanarPoint>>;
}

export interface SteeringOracleCorner {
  readonly side: SteeringSide;
  readonly pivot: PlanarPoint;
  readonly rackEndpoint: PlanarPoint;
  readonly pickup: PlanarPoint;
  readonly tieRodLength: number;
  readonly angleRadians: number;
  readonly circleHeight: number;
  readonly branch: 0 | 1;
}

export interface SteeringOracleFrame {
  readonly variant: SteeringVariantId;
  readonly rackTranslation: number;
  readonly left: SteeringOracleCorner;
  readonly right: SteeringOracleCorner;
}

const COMMON = Object.freeze({
  frontAxleX: 0.66,
  trackHalfWidth: 0.62,
  rackX: 0.28,
  rackHalfWidth: 0.3,
  rackTravel: 0.075,
} as const);

export const STEERING_GEOMETRIES: Readonly<
  Record<SteeringVariantId, SteeringGeometry>
> = Object.freeze({
  A: Object.freeze({
    ...COMMON,
    id: "A",
    pickupLocal: Object.freeze({ LEFT: { x: -0.18, z: 0 }, RIGHT: { x: -0.18, z: 0 } }),
  }),
  B: Object.freeze({
    ...COMMON,
    id: "B",
    pickupLocal: Object.freeze({ LEFT: { x: -0.3, z: 0 }, RIGHT: { x: -0.3, z: 0 } }),
  }),
  AUTHORED: Object.freeze({
    ...COMMON,
    id: "AUTHORED",
    pickupLocal: Object.freeze({ LEFT: { x: -0.18, z: 0 }, RIGHT: { x: -0.18, z: 0 } }),
  }),
});

const sideSign = (side: SteeringSide): -1 | 1 =>
  side === "LEFT" ? -1 : 1;

function distance(a: PlanarPoint, b: PlanarPoint): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function straightPickup(
  geometry: SteeringGeometry,
  side: SteeringSide,
): PlanarPoint {
  const pivot = pivotPoint(geometry, side);
  const pickup = geometry.pickupLocal[side];
  return {
    x: pivot.x + pickup.x,
    z: pivot.z + pickup.z,
  };
}

export function pickupLocal(
  geometry: SteeringGeometry,
  side: SteeringSide,
): PlanarPoint {
  return geometry.pickupLocal[side];
}

export function pivotPoint(
  geometry: SteeringGeometry,
  side: SteeringSide,
): PlanarPoint {
  return {
    x: geometry.frontAxleX,
    z: sideSign(side) * geometry.trackHalfWidth,
  };
}

export function rackEndpoint(
  geometry: SteeringGeometry,
  side: SteeringSide,
  rackTranslation: number,
): PlanarPoint {
  return {
    x: geometry.rackX,
    z: sideSign(side) * geometry.rackHalfWidth + rackTranslation,
  };
}

export function straightTieRodLength(
  geometry: SteeringGeometry,
  side: SteeringSide,
): number {
  return distance(
    straightPickup(geometry, side),
    rackEndpoint(geometry, side, 0),
  );
}

function solveCorner(
  geometry: SteeringGeometry,
  side: SteeringSide,
  rackTranslation: number,
): SteeringOracleCorner {
  if (
    !Number.isFinite(rackTranslation) ||
    Math.abs(rackTranslation) > geometry.rackTravel + 1e-12
  ) {
    throw new RangeError("Rack translation is outside the geometry travel.");
  }

  const pivot = pivotPoint(geometry, side);
  const target = rackEndpoint(geometry, side, rackTranslation);
  const authoredPickup = pickupLocal(geometry, side);
  const radius = Math.hypot(authoredPickup.x, authoredPickup.z);
  if (radius <= 1e-9) {
    throw new Error(`${geometry.id}/${side} has a zero-length steering arm.`);
  }
  const tieRodLength = straightTieRodLength(geometry, side);
  const dx = target.x - pivot.x;
  const dz = target.z - pivot.z;
  const centerDistance = Math.hypot(dx, dz);
  if (
    centerDistance <= 1e-9 ||
    centerDistance > radius + tieRodLength ||
    centerDistance < Math.abs(radius - tieRodLength)
  ) {
    throw new Error(`${geometry.id}/${side} has no circle intersection.`);
  }

  const along =
    (radius * radius - tieRodLength * tieRodLength +
      centerDistance * centerDistance) /
    (2 * centerDistance);
  const heightSquared = radius * radius - along * along;
  if (heightSquared <= 1e-10) {
    throw new Error(`${geometry.id}/${side} reaches a steering singularity.`);
  }
  const circleHeight = Math.sqrt(heightSquared);
  const ux = dx / centerDistance;
  const uz = dz / centerDistance;
  const base = {
    x: pivot.x + along * ux,
    z: pivot.z + along * uz,
  };
  const candidates = [
    { x: base.x - circleHeight * uz, z: base.z + circleHeight * ux },
    { x: base.x + circleHeight * uz, z: base.z - circleHeight * ux },
  ] as const;
  const straight = straightPickup(geometry, side);
  const branch: 0 | 1 =
    distance(candidates[0], straight) <= distance(candidates[1], straight)
      ? 0
      : 1;
  const pickup = candidates[branch];
  const rawAngleRadians = Math.atan2(
    pickup.z - pivot.z,
    -(pickup.x - pivot.x),
  );
  const authoredNeutralAngleRadians = Math.atan2(
    authoredPickup.z,
    -authoredPickup.x,
  );
  const angleRadians = rawAngleRadians - authoredNeutralAngleRadians;
  return {
    side,
    pivot,
    rackEndpoint: target,
    pickup,
    tieRodLength,
    angleRadians,
    circleHeight,
    branch,
  };
}

export function solveSteeringOracle(
  geometry: SteeringGeometry,
  rackTranslation: number,
): SteeringOracleFrame {
  return {
    variant: geometry.id,
    rackTranslation,
    left: solveCorner(geometry, "LEFT", rackTranslation),
    right: solveCorner(geometry, "RIGHT", rackTranslation),
  };
}

export function validateSteeringGeometry(
  geometry: SteeringGeometry,
  sampleCount = 61,
): readonly SteeringOracleFrame[] {
  if (!Number.isInteger(sampleCount) || sampleCount < 3) {
    throw new RangeError("Geometry validation needs at least three samples.");
  }
  const frames: SteeringOracleFrame[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const ratio = index / (sampleCount - 1);
    const rack = -geometry.rackTravel + 2 * geometry.rackTravel * ratio;
    const frame = solveSteeringOracle(geometry, rack);
    if (
      Math.abs(frame.left.angleRadians) > Math.PI / 3 ||
      Math.abs(frame.right.angleRadians) > Math.PI / 3
    ) {
      throw new Error(`${geometry.id} exceeds the bounded V0 steering angle.`);
    }
    frames.push(frame);
  }
  return frames;
}

export function createAuthoredSteeringGeometry(
  left: PlanarPoint,
  right: PlanarPoint,
): SteeringGeometry {
  for (const point of [left, right]) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) {
      throw new RangeError("Authored pickup coordinates must be finite.");
    }
  }
  return Object.freeze({
    ...COMMON,
    id: "AUTHORED",
    pickupLocal: Object.freeze({
      LEFT: Object.freeze({ x: left.x, z: left.z }),
      RIGHT: Object.freeze({ x: right.x, z: right.z }),
    }),
  });
}
