import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveRep4DamperRelation,
  runRep4DamperedCornerProbe,
} from "../.e1-test-build/src/rep4/dampered-corner-world.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(root, process.argv[2] ?? "artifacts/rep4-damper-diagnostics.json");
const v=(x=0,y=0,z=0)=>({x,y,z});

function baseline(){
  return {
    twoArm:{
      upper:{inboardAWorld:v(0,0.42,-0.3),inboardBWorld:v(0,0.42,0.3),outboardWorld:v(0.72,0.2,0)},
      lower:{inboardAWorld:v(0,-0.42,-0.3),inboardBWorld:v(0,-0.42,0.3),outboardWorld:v(0.76,-0.22,0)},
    },
    chassisTiePointWorld:v(0.28,0,0.32),
    uprightTiePickupWorld:v(0.74,0,0.18),
    damperChassisEyeWorld:v(0.18,0.13,0),
    damperLowerEyeWorld:v(0.418,-0.31,0),
  };
}
function inner(){return {...baseline(),damperLowerEyeWorld:v(0.228,-0.36,0)};}
function summarize(authority,result){
  const d=deriveRep4DamperRelation(authority);
  return {
    mode:result.mode,
    physicalComponent:result.component,
    initialDamperLength:d.initialDamperLength,
    rotationalJacobian:d.rotationalJacobian,
    axialMass:d.axialMass,
    hertz:d.hertz,
    dampingRatio:d.dampingRatio,
    nativeRestLength:result.damperNativeRestLength,
    nativeHertz:result.damperNativeHertz,
    nativeDampingRatio:result.damperNativeDampingRatio,
    maxUpperBallSeparation:result.maxUpperBallSeparation,
    maxLowerBallSeparation:result.maxLowerBallSeparation,
    maxTieLengthError:result.maxTieLengthError,
    maxUprightDisplacement:result.maxUprightDisplacement,
    initialLowerArmAngle:result.initial.lowerArmAngle,
    finalLowerArmAngle:result.final.lowerArmAngle,
    finalUprightPosition:result.final.uprightPositionWorld,
    minDamperLength:result.minDamperLength,
    maxDamperLength:result.maxDamperLength,
    maxAbsDamperExtension:result.maxAbsDamperExtension,
    maxAbsDamperAxialForce:result.maxAbsDamperAxialForce,
  };
}

const a=baseline();
const b=inner();
const [base,innerResult,free]=await Promise.all([
  runRep4DamperedCornerProbe(a,"DAMPER",120),
  runRep4DamperedCornerProbe(b,"DAMPER",120),
  runRep4DamperedCornerProbe(a,"FREE",120),
]);
const evidence={
  schema:"rep4-a4-damper-diagnostics-v1",
  baseline:summarize(a,base),
  inner:summarize(b,innerResult),
  free:summarize(a,free),
  comparisons:{
    neutralLengthDifference:Math.abs(base.derived.initialDamperLength-innerResult.derived.initialDamperLength),
    leverageDifference:Math.abs(base.derived.rotationalJacobian-innerResult.derived.rotationalJacobian),
    maxUprightDisplacementDifference:Math.abs(base.maxUprightDisplacement-innerResult.maxUprightDisplacement),
    finalLowerArmAngleDifference:Math.abs(base.final.lowerArmAngle-innerResult.final.lowerArmAngle),
    baselineVsFreeUprightDisplacementDifference:Math.abs(base.maxUprightDisplacement-free.maxUprightDisplacement),
  }
};
mkdirSync(dirname(output),{recursive:true});
writeFileSync(output,JSON.stringify(evidence,null,2)+"\n","utf8");
console.log(JSON.stringify(evidence,null,2));
