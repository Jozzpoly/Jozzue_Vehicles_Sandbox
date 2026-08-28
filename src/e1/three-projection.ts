import * as THREE from "three";
import type { E1Document, E1Vec3 } from "./model.js";
import type { E1EvaluationFrame } from "./evaluator.js";
import { authoredArmEnd } from "./evaluator.js";

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function toThree(value: E1Vec3): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function alignAlongX(object: THREE.Object3D, start: E1Vec3, end: E1Vec3): void {
  const from = toThree(start);
  const to = toThree(end);
  const delta = to.clone().sub(from);
  object.position.copy(from.add(to).multiplyScalar(0.5));
  object.scale.x = delta.length();
  object.quaternion.setFromUnitVectors(X_AXIS, delta.normalize());
}

function alignAlongY(object: THREE.Object3D, start: E1Vec3, end: E1Vec3): void {
  const from = toThree(start);
  const to = toThree(end);
  const delta = to.clone().sub(from);
  object.position.copy(from.add(to).multiplyScalar(0.5));
  object.scale.y = delta.length();
  object.quaternion.setFromUnitVectors(Y_AXIS, delta.normalize());
}

export class E1ThreeProjection {
  readonly root = new THREE.Group();
  readonly upperHardpointHandle: THREE.Mesh;
  readonly pickTargets: THREE.Object3D[];

  #arm: THREE.Mesh;
  #pivot: THREE.Mesh;
  #axis: THREE.Mesh;
  #damperBody: THREE.Mesh;
  #damperRod: THREE.Mesh;
  #armEnd: THREE.Mesh;
  #mountHalo: THREE.Mesh;
  #damperBodyMaterial: THREE.MeshStandardMaterial;
  #armMaterial: THREE.MeshStandardMaterial;

  constructor() {
    const structureMaterial = new THREE.MeshStandardMaterial({
      color: 0x333b40,
      roughness: 0.58,
      metalness: 0.32,
    });
    this.#armMaterial = new THREE.MeshStandardMaterial({
      color: 0xd5d0c7,
      roughness: 0.42,
      metalness: 0.48,
    });
    this.#damperBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8d969b,
      roughness: 0.36,
      metalness: 0.62,
    });
    const rodMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6edf0,
      roughness: 0.16,
      metalness: 0.82,
    });
    const cyanMaterial = new THREE.MeshStandardMaterial({
      color: 0x54d9ff,
      emissive: 0x0a3f52,
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.35,
    });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.25, 1.1), structureMaterial);
    chassis.position.set(-2.05, 1.45, 0.08);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.root.add(chassis);

    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.05, 0.62), structureMaterial);
    tower.position.set(-0.7, 2.35, 0.48);
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.root.add(tower);

    this.#arm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.22, 0.38), this.#armMaterial);
    this.#arm.castShadow = true;
    this.#arm.receiveShadow = true;
    this.root.add(this.#arm);

    this.#pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.48, 28), structureMaterial);
    this.#pivot.castShadow = true;
    this.root.add(this.#pivot);

    this.#axis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1, 16),
      new THREE.MeshBasicMaterial({ color: 0x56d8ff, transparent: true, opacity: 0.8 }),
    );
    this.root.add(this.#axis);

    this.#damperBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 1, 24),
      this.#damperBodyMaterial,
    );
    this.#damperBody.castShadow = true;
    this.root.add(this.#damperBody);

    this.#damperRod = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1, 18), rodMaterial);
    this.#damperRod.castShadow = true;
    this.root.add(this.#damperRod);

    this.#armEnd = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 16), structureMaterial);
    this.#armEnd.castShadow = true;
    this.root.add(this.#armEnd);

    this.upperHardpointHandle = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), cyanMaterial);
    this.upperHardpointHandle.castShadow = true;
    this.upperHardpointHandle.userData.e1Pick = "upper-hardpoint";
    this.root.add(this.upperHardpointHandle);

    this.#mountHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.025, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0x54d9ff, transparent: true, opacity: 0.78 }),
    );
    this.root.add(this.#mountHalo);

    this.pickTargets = [this.upperHardpointHandle];
  }

  setSelected(selected: boolean): void {
    this.#mountHalo.visible = selected;
    this.upperHardpointHandle.scale.setScalar(selected ? 1.12 : 1);
  }

  renderBuild(document: E1Document): void {
    const armEnd = authoredArmEnd(document);
    this.#applyGeometry(document.pivot.origin, document.pivot.axis, armEnd, document.damper.upperHardpoint);
    this.#armMaterial.emissive.setHex(0x000000);
    this.#damperBodyMaterial.emissive.setHex(0x000000);
  }

  renderFrame(frame: E1EvaluationFrame, axis: E1Vec3): void {
    this.#applyGeometry(frame.pivot, axis, frame.armEnd, frame.damperUpper);
    const diagnostic = frame.status !== "resolved";
    this.#armMaterial.emissive.setHex(diagnostic ? 0x4b2600 : 0x00190f);
    this.#damperBodyMaterial.emissive.setHex(diagnostic ? 0x4b2600 : 0x00190f);
  }

  syncHandleToAuthored(document: E1Document): void {
    this.upperHardpointHandle.position.copy(toThree(document.damper.upperHardpoint));
    this.#mountHalo.position.copy(this.upperHardpointHandle.position);
  }

  #applyGeometry(pivot: E1Vec3, axis: E1Vec3, armEnd: E1Vec3, upperHardpoint: E1Vec3): void {
    alignAlongX(this.#arm, pivot, armEnd);
    this.#pivot.position.copy(toThree(pivot));
    this.#pivot.quaternion.setFromUnitVectors(Y_AXIS, toThree(axis).normalize());

    const axisUnit = toThree(axis).normalize();
    const axisStart = toThree(pivot).addScaledVector(axisUnit, -0.8);
    const axisEnd = toThree(pivot).addScaledVector(axisUnit, 0.8);
    alignAlongY(
      this.#axis,
      { x: axisStart.x, y: axisStart.y, z: axisStart.z },
      { x: axisEnd.x, y: axisEnd.y, z: axisEnd.z },
    );

    this.#armEnd.position.copy(toThree(armEnd));
    const middle = {
      x: upperHardpoint.x + (armEnd.x - upperHardpoint.x) * 0.48,
      y: upperHardpoint.y + (armEnd.y - upperHardpoint.y) * 0.48,
      z: upperHardpoint.z + (armEnd.z - upperHardpoint.z) * 0.48,
    };
    alignAlongY(this.#damperBody, upperHardpoint, middle);
    alignAlongY(this.#damperRod, middle, armEnd);
    this.upperHardpointHandle.position.copy(toThree(upperHardpoint));
    this.#mountHalo.position.copy(this.upperHardpointHandle.position);
    this.#mountHalo.lookAt(toThree(armEnd));
  }
}
