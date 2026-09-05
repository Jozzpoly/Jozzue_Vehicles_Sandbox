import assert from "node:assert/strict";
import test from "node:test";
import type { b3Vec3 } from "box3d.js";
import type { Rep4DamperedCornerAuthority } from "../../src/rep4/dampered-corner-world.js";
import {
  REP4_B2_HARDPOINTS,
  cloneRep4B2Authority,
  rep4B2Hardpoint,
  withRep4B2Hardpoint,
} from "../../src/rep4/stage-b-authoring.js";

const v = (x: number, y: number, z: number): b3Vec3 => ({ x, y, z });

function fixture(): Rep4DamperedCornerAuthority {
  return {
    twoArm: {
      upper: {
        inboardAWorld: v(0, 0.42, -0.3),
        inboardBWorld: v(0, 0.42, 0.3),
        outboardWorld: v(0.72, 0.2, 0),
      },
      lower: {
        inboardAWorld: v(0, -0.42, -0.3),
        inboardBWorld: v(0, -0.42, 0.3),
        outboardWorld: v(0.76, -0.22, 0),
      },
    },
    chassisTiePointWorld: v(0.28, -0.1, 0.32),
    uprightTiePickupWorld: v(0.74, 0, 0.18),
    damperChassisEyeWorld: v(0.18, 0.13, 0),
    damperLowerEyeWorld: v(0.418, -0.31, 0),
  };
}

test("Rep4 B2 exposes three deliberately different mechanical hardpoint classes", () => {
  assert.deepEqual(
    REP4_B2_HARDPOINTS.map((item) => [item.id, item.mechanicalClass]),
    [
      ["upper-bearing-a", "bearing"],
      ["chassis-tie", "tie"],
      ["damper-lower-eye", "damper-eye"],
    ],
  );
});

test("Rep4 B2 hardpoint edits are immutable and modify only the selected authored coordinate owner", () => {
  const base = fixture();
  const original = cloneRep4B2Authority(base);

  const bearing = withRep4B2Hardpoint(base, "upper-bearing-a", v(0.11, 0.47, -0.24));
  assert.deepEqual(rep4B2Hardpoint(bearing, "upper-bearing-a"), v(0.11, 0.47, -0.24));
  assert.deepEqual(bearing.chassisTiePointWorld, base.chassisTiePointWorld);
  assert.deepEqual(bearing.damperLowerEyeWorld, base.damperLowerEyeWorld);

  const tie = withRep4B2Hardpoint(base, "chassis-tie", v(0.34, -0.05, 0.35));
  assert.deepEqual(tie.chassisTiePointWorld, v(0.34, -0.05, 0.35));
  assert.deepEqual(tie.twoArm, base.twoArm);
  assert.deepEqual(tie.damperLowerEyeWorld, base.damperLowerEyeWorld);

  const damper = withRep4B2Hardpoint(base, "damper-lower-eye", v(0.46, -0.27, 0.03));
  assert.deepEqual(damper.damperLowerEyeWorld, v(0.46, -0.27, 0.03));
  assert.deepEqual(damper.twoArm, base.twoArm);
  assert.deepEqual(damper.chassisTiePointWorld, base.chassisTiePointWorld);

  assert.deepEqual(base, original, "editing helpers must not mutate the source authority");
});

test("Rep4 B2 hardpoint editing rejects non-finite authored coordinates instead of sanitizing them", () => {
  const base = fixture();
  assert.throws(
    () => withRep4B2Hardpoint(base, "chassis-tie", v(Number.NaN, 0, 0)),
    /must be finite/,
  );
  assert.throws(
    () => withRep4B2Hardpoint(base, "damper-lower-eye", v(0, Number.POSITIVE_INFINITY, 0)),
    /must be finite/,
  );
});
