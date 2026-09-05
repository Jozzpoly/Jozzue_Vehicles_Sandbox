import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runRep4DamperedCornerProbe } from "../.e1-test-build/src/rep4/dampered-corner-world.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(root, process.argv[2] ?? "artifacts/rep4-coupled-diagnostics.json");
const v=(x=0,y=0,z=0)=>({x,y,z});

function authority(tieHeight, damperKind) {
  return {
    twoArm:{
      upper:{inboardAWorld:v(0,0.42,-0.3),inboardBWorld:v(0,0.42,0.3),outboardWorld:v(0.72,0.2,0)},
      lower:{inboardAWorld:v(0,-0.42,-0.3),inboardBWorld:v(0,-0.42,0.3),outboardWorld:v(0.76,-0.22,0)},
    },
    chassisTiePointWorld:v(0.28,tieHeight,0.32),
    uprightTiePickupWorld:v(0.74,0,0.18),
    damperChassisEyeWorld:v(0.18,0.13,0),
    damperLowerEyeWorld:damperKind === "inner" ? v(0.228,-0.36,0) : v(0.418,-0.31,0),
  };
}

function wrapRadians(a){return Math.atan2(Math.sin(a),Math.cos(a));}
function signedTwist(q,authorityValue){
  const axis={
    x:authorityValue.twoArm.upper.outboardWorld.x-authorityValue.twoArm.lower.outboardWorld.x,
    y:authorityValue.twoArm.upper.outboardWorld.y-authorityValue.twoArm.lower.outboardWorld.y,
    z:authorityValue.twoArm.upper.outboardWorld.z-authorityValue.twoArm.lower.outboardWorld.z,
  };
  const m=Math.hypot(axis.x,axis.y,axis.z);
  const ax=axis.x/m, ay=axis.y/m, az=axis.z/m;
  const projected=q.v.x*ax+q.v.y*ay+q.v.z*az;
  return wrapRadians(2*Math.atan2(projected,q.s));
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}

function summarize(authorityValue,result){
  return {
    tieHeight:authorityValue.chassisTiePointWorld.y,
    damperLowerEyeWorld:authorityValue.damperLowerEyeWorld,
    tieLength:result.derived.tieLength,
    physicalComponent:result.component,
    initialDamperLength:result.derived.initialDamperLength,
    damperRotationalJacobian:result.derived.rotationalJacobian,
    finalSignedTwist:signedTwist(result.final.uprightRotation,authorityValue),
    maxUprightDisplacement:result.maxUprightDisplacement,
    finalLowerArmAngle:result.final.lowerArmAngle,
    minDamperLength:result.minDamperLength,
    maxDamperLength:result.maxDamperLength,
    maxAbsDamperExtension:result.maxAbsDamperExtension,
    maxAbsDamperAxialForce:result.maxAbsDamperAxialForce,
    maxUpperBallSeparation:result.maxUpperBallSeparation,
    maxLowerBallSeparation:result.maxLowerBallSeparation,
    maxTieLengthError:result.maxTieLengthError,
  };
}

async function observeTieDuringTravel(baseAuthority,tieAuthority){
  const samples=[];
  for(let step=1;step<=30;step+=1){
    const [base,tie]=await Promise.all([
      runRep4DamperedCornerProbe(baseAuthority,"DAMPER",step),
      runRep4DamperedCornerProbe(tieAuthority,"DAMPER",step),
    ]);
    const baseDisplacement=distance(base.initial.uprightPositionWorld,base.final.uprightPositionWorld);
    const tieDisplacement=distance(tie.initial.uprightPositionWorld,tie.final.uprightPositionWorld);
    const baseTwist=signedTwist(base.final.uprightRotation,baseAuthority);
    const tieTwist=signedTwist(tie.final.uprightRotation,tieAuthority);
    samples.push({
      step,
      timeSeconds:step/60,
      baseDisplacement,
      tieDisplacement,
      baseTwist,
      tieTwist,
      signedTwistSeparation:Math.abs(wrapRadians(tieTwist-baseTwist)),
      displacementDifference:Math.abs(tieDisplacement-baseDisplacement),
    });
  }
  const atBaselinePeakTravel=samples.reduce((best,sample)=>
    sample.baseDisplacement>best.baseDisplacement?sample:best,
  samples[0]);
  const atMaxTwistSeparation=samples.reduce((best,sample)=>
    sample.signedTwistSeparation>best.signedTwistSeparation?sample:best,
  samples[0]);
  return {
    sampleWindow:{startStep:1,endStep:30,dtSeconds:1/60},
    atBaselinePeakTravel,
    atMaxTwistSeparation,
    samples,
  };
}

const baseAuthority=authority(0,"inner");
const tieAuthority=authority(-0.1,"inner");
const damperAuthority=authority(0,"outer");
const bothAuthority=authority(-0.1,"outer");
const [base,tieEdit,damperEdit,bothEdit,tieDuringTravel]=await Promise.all([
  runRep4DamperedCornerProbe(baseAuthority,"DAMPER",120),
  runRep4DamperedCornerProbe(tieAuthority,"DAMPER",120),
  runRep4DamperedCornerProbe(damperAuthority,"DAMPER",120),
  runRep4DamperedCornerProbe(bothAuthority,"DAMPER",120),
  observeTieDuringTravel(baseAuthority,tieAuthority),
]);

const baseSummary=summarize(baseAuthority,base);
const tieSummary=summarize(tieAuthority,tieEdit);
const damperSummary=summarize(damperAuthority,damperEdit);
const bothSummary=summarize(bothAuthority,bothEdit);
const evidence={
  schema:"rep4-a5-coupled-diagnostics-v2",
  baseline:baseSummary,
  tieEdit:tieSummary,
  damperEdit:damperSummary,
  bothEdit:bothSummary,
  tieDuringTravel,
  comparisons:{
    tieOnlyFinalSignedTwistSeparation:Math.abs(wrapRadians(tieSummary.finalSignedTwist-baseSummary.finalSignedTwist)),
    tieOnlyMaxSameTimeTwistSeparation:tieDuringTravel.atMaxTwistSeparation.signedTwistSeparation,
    tieOnlyTwistSeparationAtBaselinePeakTravel:tieDuringTravel.atBaselinePeakTravel.signedTwistSeparation,
    tieOnlyDisplacementDifferenceAtBaselinePeakTravel:tieDuringTravel.atBaselinePeakTravel.displacementDifference,
    tieOnlyLongRunMaxTravelDifference:Math.abs(tieSummary.maxUprightDisplacement-baseSummary.maxUprightDisplacement),
    damperOnlyFinalSignedTwistSeparation:Math.abs(wrapRadians(damperSummary.finalSignedTwist-baseSummary.finalSignedTwist)),
    damperOnlyTravelDifference:Math.abs(damperSummary.maxUprightDisplacement-baseSummary.maxUprightDisplacement),
    damperOnlyMaxExtensionDifference:Math.abs((damperSummary.maxAbsDamperExtension??0)-(baseSummary.maxAbsDamperExtension??0)),
    bothVsBaseFinalSignedTwistSeparation:Math.abs(wrapRadians(bothSummary.finalSignedTwist-baseSummary.finalSignedTwist)),
    bothVsBaseTravelDifference:Math.abs(bothSummary.maxUprightDisplacement-baseSummary.maxUprightDisplacement),
  }
};
mkdirSync(dirname(output),{recursive:true});
writeFileSync(output,JSON.stringify(evidence,null,2)+"\n","utf8");
console.log(JSON.stringify(evidence,null,2));
