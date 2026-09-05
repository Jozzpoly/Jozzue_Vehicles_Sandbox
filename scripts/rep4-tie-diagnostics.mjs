import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runRep4TieOwnedProbe } from "../.e1-test-build/src/rep4/tie-owned-upright-world.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(root, process.argv[2] ?? "artifacts/rep4-tie-diagnostics.json");
const v = (x=0,y=0,z=0)=>({x,y,z});

function baseline() {
  return {
    twoArm: {
      upper: { inboardAWorld:v(0,0.42,-0.3), inboardBWorld:v(0,0.42,0.3), outboardWorld:v(0.72,0.2,0) },
      lower: { inboardAWorld:v(0,-0.42,-0.3), inboardBWorld:v(0,-0.42,0.3), outboardWorld:v(0.76,-0.22,0) },
    },
    chassisTiePointWorld:v(0.28,0,0.32),
    uprightTiePickupWorld:v(0.74,0,0.18),
  };
}
function alternate() {
  const b=baseline();
  return {...b, chassisTiePointWorld:v(0.28,0,-0.18)};
}
function summarize(r){
  return {
    mode:r.mode, excitation:r.excitation,
    tieLength:r.derived.tieLength,
    tieNativeLength:r.tieNativeLength,
    maxTieLengthError:r.maxTieLengthError,
    maxUpperBallSeparation:r.maxUpperBallSeparation,
    maxLowerBallSeparation:r.maxLowerBallSeparation,
    maxUprightOrientationDeparture:r.maxUprightOrientationDeparture,
    maxUprightDisplacement:r.maxUprightDisplacement,
    initialPosition:r.initial.uprightPositionWorld,
    finalPosition:r.final.uprightPositionWorld,
    initialRotation:r.initial.uprightRotation,
    finalRotation:r.final.uprightRotation,
    finalAngularVelocity:r.final.uprightAngularVelocity,
  };
}
function qsep(a,b){
  const d=Math.abs(a.v.x*b.v.x+a.v.y*b.v.y+a.v.z*b.v.z+a.s*b.s);
  return 2*Math.acos(Math.max(-1,Math.min(1,d)));
}

const [twistTie,twistFree,travelBase,travelAlt]=await Promise.all([
  runRep4TieOwnedProbe(baseline(),"TIE","TWIST",45),
  runRep4TieOwnedProbe(baseline(),"FREE","TWIST",45),
  runRep4TieOwnedProbe(baseline(),"TIE","TRAVEL",90),
  runRep4TieOwnedProbe(alternate(),"TIE","TRAVEL",90),
]);
const evidence={
  schema:"rep4-a3-tie-diagnostics-v1",
  twistTie:summarize(twistTie),
  twistFree:summarize(twistFree),
  travelBaseline:summarize(travelBase),
  travelAlternate:summarize(travelAlt),
  comparisons:{
    freeMinusTiedMaxOrientation:twistFree.maxUprightOrientationDeparture-twistTie.maxUprightOrientationDeparture,
    travelFinalOrientationSeparation:qsep(travelBase.final.uprightRotation,travelAlt.final.uprightRotation),
    travelMaxOrientationDepartureDifference:Math.abs(travelBase.maxUprightOrientationDeparture-travelAlt.maxUprightOrientationDeparture),
    travelDisplacementDifference:Math.abs(travelBase.maxUprightDisplacement-travelAlt.maxUprightDisplacement),
  }
};
mkdirSync(dirname(output),{recursive:true});
writeFileSync(output,JSON.stringify(evidence,null,2)+"\n","utf8");
console.log(JSON.stringify(evidence,null,2));
