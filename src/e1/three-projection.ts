import * as THREE from "three";
import type {
  E1Document,
  E1Participant,
  E1ParticipantId,
  E1ReferenceId,
  E1SpatialReference,
  E1Vec3,
} from "./model.js";
import type { E1EvaluationFrame } from "./evaluator.js";
import type { E1RelationGeometryStatus } from "./construction.js";

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

export interface E1ProjectionPick {
  readonly kind: "participant" | "reference";
  readonly id: string;
}

export interface E1ProjectionVisualState {
  readonly selectedParticipantId: E1ParticipantId | null;
  readonly selectedReferenceId: E1ReferenceId | null;
  readonly hoveredReferenceId: E1ReferenceId | null;
  readonly connectionSourceReferenceId: E1ReferenceId | null;
  readonly connectionTargetReferenceId: E1ReferenceId | null;
}

function toThree(value: E1Vec3): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function setPose(object: THREE.Object3D, participant: E1Participant): void {
  object.position.copy(toThree(participant.pose.position));
  object.quaternion.set(
    participant.pose.rotation.x,
    participant.pose.rotation.y,
    participant.pose.rotation.z,
    participant.pose.rotation.w,
  );
}

function alignAlong(
  object: THREE.Object3D,
  localAxis: THREE.Vector3,
  scaleAxis: "x" | "y",
  start: E1Vec3,
  end: E1Vec3,
): void {
  const from = toThree(start);
  const to = toThree(end);
  const delta = to.clone().sub(from);
  const magnitude = Math.max(delta.length(), 1e-5);
  object.position.copy(from.add(to).multiplyScalar(0.5));
  if (scaleAxis === "x") {
    object.scale.x = magnitude;
  } else {
    object.scale.y = magnitude;
  }
  object.quaternion.setFromUnitVectors(localAxis, delta.multiplyScalar(1 / magnitude));
}

function lineBetween(start: E1Vec3, end: E1Vec3, color: number, opacity = 1): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([toThree(start), toThree(end)]);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
}

function basicMaterial(color: number, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthTest: true,
  });
}

function participantBodyMaterial(kind: E1Participant["kind"], selected: boolean): THREE.MeshStandardMaterial {
  const colors: Record<E1Participant["kind"], number> = {
    "fixed-fixture": 0x30393e,
    "driven-arm": 0xd4cec4,
    "telescopic-damper": 0x8f989d,
    rocker: 0xffb35a,
    "rigid-link": 0xdbe5e8,
  };
  return new THREE.MeshStandardMaterial({
    color: colors[kind],
    emissive: selected ? 0x18313a : 0x000000,
    emissiveIntensity: selected ? 0.9 : 0,
    roughness: 0.42,
    metalness: 0.48,
  });
}

function pickTag(object: THREE.Object3D, pick: E1ProjectionPick): void {
  object.userData.e1Pick = pick;
}

export function projectionPick(object: THREE.Object3D | null): E1ProjectionPick | null {
  let current = object;
  while (current) {
    const pick = current.userData.e1Pick as E1ProjectionPick | undefined;
    if (pick) {
      return pick;
    }
    current = current.parent;
  }
  return null;
}

export class E1ThreeProjection {
  readonly root = new THREE.Group();
  readonly buildRoot = new THREE.Group();
  readonly playRoot = new THREE.Group();
  readonly pickTargets: THREE.Object3D[] = [];

  #participantsRoot = new THREE.Group();
  #relationsRoot = new THREE.Group();
  #previewRoot = new THREE.Group();
  #participantGroups = new Map<E1ParticipantId, THREE.Group>();
  #playArm: THREE.Mesh;
  #playDamper: THREE.Mesh;
  #playPushrod: THREE.Mesh;
  #playRockerA: THREE.Mesh;
  #playRockerB: THREE.Mesh;
  #playRockerHub: THREE.Mesh;
  #playAxis: THREE.Mesh;

  constructor() {
    this.root.add(this.buildRoot, this.playRoot);
    this.buildRoot.add(this.#participantsRoot, this.#relationsRoot, this.#previewRoot);

    const armMaterial = participantBodyMaterial("driven-arm", false);
    const damperMaterial = participantBodyMaterial("telescopic-damper", false);
    const pushrodMaterial = participantBodyMaterial("rigid-link", false);
    const rockerMaterial = participantBodyMaterial("rocker", false);
    this.#playArm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.22, 0.38), armMaterial);
    this.#playDamper = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 20), damperMaterial);
    this.#playPushrod = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1, 16), pushrodMaterial);
    this.#playRockerA = new THREE.Mesh(new THREE.BoxGeometry(1, 0.18, 0.28), rockerMaterial);
    this.#playRockerB = new THREE.Mesh(new THREE.BoxGeometry(1, 0.18, 0.28), rockerMaterial);
    this.#playRockerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.34, 24), rockerMaterial);
    this.#playAxis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.4, 14),
      basicMaterial(0x63dcff, 0.82),
    );
    for (const mesh of [
      this.#playArm,
      this.#playDamper,
      this.#playPushrod,
      this.#playRockerA,
      this.#playRockerB,
      this.#playRockerHub,
    ]) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.playRoot.add(mesh);
    }
    this.playRoot.add(this.#playAxis);
    this.playRoot.visible = false;
  }

  participantObject(participantId: E1ParticipantId): THREE.Group | null {
    return this.#participantGroups.get(participantId) ?? null;
  }

  setMode(mode: "build" | "play"): void {
    const build = mode === "build";
    this.buildRoot.visible = build;
    this.playRoot.visible = !build;
  }

  renderBuild(
    document: E1Document,
    statuses: readonly E1RelationGeometryStatus[],
    visualState: E1ProjectionVisualState,
  ): void {
    const liveIds = new Set(document.participants.map((participant) => participant.id));
    for (const [participantId, group] of this.#participantGroups) {
      if (!liveIds.has(participantId)) {
        this.#participantsRoot.remove(group);
        this.#participantGroups.delete(participantId);
      }
    }
    this.pickTargets.length = 0;
    const relationStateByReference = new Map<E1ReferenceId, "satisfied" | "violated">();
    for (const status of statuses) {
      const state = status.satisfied ? "satisfied" : "violated";
      for (const referenceId of [
        status.relation.sourceReferenceId,
        status.relation.targetReferenceId,
      ]) {
        if (state === "violated" || !relationStateByReference.has(referenceId)) {
          relationStateByReference.set(referenceId, state);
        }
      }
    }
    for (const participant of document.participants) {
      let group = this.#participantGroups.get(participant.id);
      if (!group) {
        group = new THREE.Group();
        this.#participantGroups.set(participant.id, group);
        this.#participantsRoot.add(group);
      }
      group.clear();
      setPose(group, participant);
      this.#buildParticipant(
        group,
        participant,
        visualState.selectedParticipantId === participant.id,
        relationStateByReference,
        visualState,
      );
    }
    this.#renderRelations(statuses);
    this.#renderConnectionPreview(document, visualState);
    // Picking may run in the same pointer turn as a rebuild. Do not wait for the
    // next renderer frame to make freshly projected participant transforms real.
    this.root.updateMatrixWorld(true);
  }

  renderFrame(document: E1Document, frame: E1EvaluationFrame): void {
    const diagnostic = frame.status !== "resolved";
    for (const object of [this.#playArm, this.#playDamper, this.#playPushrod, this.#playRockerA, this.#playRockerB]) {
      const material = object.material as THREE.MeshStandardMaterial;
      material.emissive.setHex(diagnostic ? 0x4b2600 : 0x00190f);
    }
    alignAlong(this.#playArm, X_AXIS, "x", frame.pivot, frame.armEnd);
    alignAlong(this.#playDamper, Y_AXIS, "y", frame.damperUpper, frame.damperLower);

    const hasRocker = Boolean(
      frame.rockerPivot && frame.rockerAxis && frame.rockerInput && frame.rockerOutput &&
      frame.pushrodStart && frame.pushrodEnd,
    );
    this.#playPushrod.visible = hasRocker;
    this.#playRockerA.visible = hasRocker;
    this.#playRockerB.visible = hasRocker;
    this.#playRockerHub.visible = hasRocker;
    this.#playAxis.visible = hasRocker;
    if (hasRocker) {
      alignAlong(this.#playPushrod, Y_AXIS, "y", frame.pushrodStart!, frame.pushrodEnd!);
      alignAlong(this.#playRockerA, X_AXIS, "x", frame.rockerPivot!, frame.rockerInput!);
      alignAlong(this.#playRockerB, X_AXIS, "x", frame.rockerPivot!, frame.rockerOutput!);
      this.#playRockerHub.position.copy(toThree(frame.rockerPivot!));
      this.#playRockerHub.quaternion.setFromUnitVectors(Y_AXIS, toThree(frame.rockerAxis!).normalize());
      const axisDirection = toThree(frame.rockerAxis!).normalize();
      const axisStart = toThree(frame.rockerPivot!).addScaledVector(axisDirection, -0.7);
      const axisEnd = toThree(frame.rockerPivot!).addScaledVector(axisDirection, 0.7);
      alignAlong(
        this.#playAxis,
        Y_AXIS,
        "y",
        { x: axisStart.x, y: axisStart.y, z: axisStart.z },
        { x: axisEnd.x, y: axisEnd.y, z: axisEnd.z },
      );
    }

    // The fixed fixture is renderer-local scaffolding. Its dimensions are not authored meaning.
    const chassis = document.participants.find((participant) => participant.kind === "fixed-fixture");
    if (chassis && this.playRoot.getObjectByName("e1-play-fixture") === undefined) {
      const fixture = this.#fixtureBody(chassis, false);
      fixture.name = "e1-play-fixture";
      this.playRoot.add(fixture);
    }
  }

  #buildParticipant(
    group: THREE.Group,
    participant: E1Participant,
    selected: boolean,
    relationStateByReference: ReadonlyMap<E1ReferenceId, "satisfied" | "violated">,
    visualState: E1ProjectionVisualState,
  ): void {
    const body = participant.kind === "fixed-fixture"
      ? this.#fixtureBody(participant, selected)
      : this.#mechanismBody(participant, selected);
    pickTag(body, { kind: "participant", id: participant.id });
    group.add(body);
    this.pickTargets.push(body);
    for (const reference of participant.references) {
      const handle = this.#referenceHandle(
        participant,
        reference,
        relationStateByReference.get(reference.id),
        visualState,
      );
      pickTag(handle, { kind: "reference", id: reference.id });
      group.add(handle);
      this.pickTargets.push(handle);
    }
  }

  #fixtureBody(participant: E1Participant, selected: boolean): THREE.Group {
    const group = new THREE.Group();
    const material = participantBodyMaterial(participant.kind, selected);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.25, 1.1), material);
    base.position.set(-2.05, 1.45, 0.08);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.05, 0.62), material);
    tower.position.set(-0.7, 2.35, 0.48);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);
    const axis = participant.references.find((reference) => reference.kind === "axis");
    if (axis?.kind === "axis") {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.48, 0.52), material);
      bracket.position.copy(toThree(axis.localOrigin));
      bracket.castShadow = true;
      group.add(bracket);
    }
    return group;
  }

  #mechanismBody(participant: E1Participant, selected: boolean): THREE.Group {
    const group = new THREE.Group();
    const material = participantBodyMaterial(participant.kind, selected);
    const points = participant.references.filter((reference) => reference.kind === "point");
    const axes = participant.references.filter((reference) => reference.kind === "axis");
    if (participant.kind === "driven-arm" && points[0]) {
      const pivot = axes[0]?.kind === "axis" ? axes[0].localOrigin : { x: 0, y: 0, z: 0 };
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.22, 0.38), material);
      alignAlong(arm, X_AXIS, "x", pivot, points[0].localPosition);
      arm.castShadow = true;
      arm.receiveShadow = true;
      group.add(arm);
    } else if ((participant.kind === "rigid-link" || participant.kind === "telescopic-damper") && points.length === 2) {
      const radius = participant.kind === "rigid-link" ? 0.075 : 0.15;
      const link = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 18), material);
      alignAlong(link, Y_AXIS, "y", points[0]!.localPosition, points[1]!.localPosition);
      link.castShadow = true;
      group.add(link);
    } else if (participant.kind === "rocker" && axes[0]?.kind === "axis") {
      const pivot = axes[0].localOrigin;
      for (const point of points) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.18, 0.28), material);
        alignAlong(bar, X_AXIS, "x", pivot, point.localPosition);
        bar.castShadow = true;
        group.add(bar);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.34, 24), material);
      hub.position.copy(toThree(pivot));
      hub.quaternion.setFromUnitVectors(Y_AXIS, toThree(axes[0].localDirection).normalize());
      hub.castShadow = true;
      group.add(hub);
    }
    return group;
  }

  #referenceHandle(
    participant: E1Participant,
    reference: E1SpatialReference,
    relationState: "satisfied" | "violated" | undefined,
    visualState: E1ProjectionVisualState,
  ): THREE.Object3D {
    let color = reference.kind === "point" ? 0x65dfff : 0x9d7dff;
    if (relationState === "satisfied") color = 0x65e18a;
    if (relationState === "violated") color = 0xffb24d;
    if (visualState.hoveredReferenceId === reference.id) color = 0xffffff;
    if (visualState.selectedReferenceId === reference.id) color = 0xffffff;
    if (visualState.connectionSourceReferenceId === reference.id) color = 0xff72d2;
    if (visualState.connectionTargetReferenceId === reference.id) color = 0x66efff;
    const material = basicMaterial(color, participant.fixed ? 0.86 : 0.96);
    if (reference.kind === "point") {
      const pointMaterial = participant.fixed
        ? new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, wireframe: true })
        : material;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(participant.fixed ? 0.23 : 0.15, 18, 12),
        pointMaterial,
      );
      sphere.position.copy(toThree(reference.localPosition));
      sphere.scale.setScalar(
        visualState.selectedReferenceId === reference.id || visualState.hoveredReferenceId === reference.id
          ? 1.3
          : 1,
      );
      return sphere;
    }
    const axisGroup = new THREE.Group();
    axisGroup.position.copy(toThree(reference.localOrigin));
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(participant.fixed ? 0.085 : 0.052, participant.fixed ? 0.085 : 0.052, participant.fixed ? 1.25 : 1.05, 14),
      participant.fixed
        ? new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, wireframe: true })
        : material,
    );
    cylinder.quaternion.setFromUnitVectors(Y_AXIS, toThree(reference.localDirection).normalize());
    axisGroup.add(cylinder);
    return axisGroup;
  }

  #renderRelations(statuses: readonly E1RelationGeometryStatus[]): void {
    this.#relationsRoot.clear();
    for (const status of statuses) {
      const color = status.satisfied ? 0x65e18a : 0xffb24d;
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), basicMaterial(color, 0.92));
      marker.position.copy(toThree(status.sourcePosition));
      this.#relationsRoot.add(marker);
      if (!status.satisfied) {
        this.#relationsRoot.add(lineBetween(status.sourcePosition, status.targetPosition, color, 0.92));
      }
    }
  }

  #renderConnectionPreview(document: E1Document, visualState: E1ProjectionVisualState): void {
    this.#previewRoot.clear();
    if (!visualState.connectionSourceReferenceId || !visualState.connectionTargetReferenceId) {
      return;
    }
    const sourceParticipant = document.participants.find((participant) =>
      participant.references.some((reference) => reference.id === visualState.connectionSourceReferenceId),
    );
    const targetParticipant = document.participants.find((participant) =>
      participant.references.some((reference) => reference.id === visualState.connectionTargetReferenceId),
    );
    const sourceReference = sourceParticipant?.references.find(
      (reference) => reference.id === visualState.connectionSourceReferenceId,
    );
    const targetReference = targetParticipant?.references.find(
      (reference) => reference.id === visualState.connectionTargetReferenceId,
    );
    if (!sourceParticipant || !targetParticipant || !sourceReference || !targetReference) return;
    const sourceLocal = sourceReference.kind === "point" ? sourceReference.localPosition : sourceReference.localOrigin;
    const targetLocal = targetReference.kind === "point" ? targetReference.localPosition : targetReference.localOrigin;
    const source = toThree(sourceLocal).applyQuaternion(sourceParticipant.pose.rotation as THREE.Quaternion).add(toThree(sourceParticipant.pose.position));
    const target = toThree(targetLocal).applyQuaternion(targetParticipant.pose.rotation as THREE.Quaternion).add(toThree(targetParticipant.pose.position));
    this.#previewRoot.add(
      lineBetween(
        { x: source.x, y: source.y, z: source.z },
        { x: target.x, y: target.y, z: target.z },
        0xff72d2,
        0.9,
      ),
    );
  }
}
