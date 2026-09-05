import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import * as THREE from "three";

const DONOR = Object.freeze({
  repository: "Jozzpoly/Box3d_FunProject",
  commit: "241fe10a9056836332c21d9614471d32d749ce3d",
  path: "assets/source/Asset_Dumper.gltf",
  gitBlobSha: "dcdaf197bf48ef8894af4de27682d55dd0b1343d",
  byteLength: 32240,
  sourceUrl: "https://raw.githubusercontent.com/Jozzpoly/Box3d_FunProject/241fe10a9056836332c21d9614471d32d749ce3d/assets/source/Asset_Dumper.gltf",
  runtimeUrl: "/assets/rep2/Asset_Dumper.gltf",
  repositoryPath: "public/assets/rep2/Asset_Dumper.gltf",
});

const LOCAL_DONOR = new URL("../public/assets/rep2/Asset_Dumper.gltf", import.meta.url);

function fail(message) {
  throw new Error(`Rep2 C1 donor probe: ${message}`);
}

function gitBlobSha(bytes) {
  return createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`, "utf8"))
    .update(bytes)
    .digest("hex");
}

function dataUriBytes(uri, label) {
  if (typeof uri !== "string" || !uri.startsWith("data:")) {
    fail(`${label} must be embedded as a data URI`);
  }
  const comma = uri.indexOf(",");
  if (comma < 0 || !uri.slice(0, comma).includes(";base64")) {
    fail(`${label} must use base64 data URI encoding`);
  }
  return Buffer.from(uri.slice(comma + 1), "base64");
}

function componentReader(componentType) {
  switch (componentType) {
    case 5121:
      return { bytes: 1, read: (buffer, offset) => buffer.readUInt8(offset) };
    case 5123:
      return { bytes: 2, read: (buffer, offset) => buffer.readUInt16LE(offset) };
    case 5125:
      return { bytes: 4, read: (buffer, offset) => buffer.readUInt32LE(offset) };
    case 5126:
      return { bytes: 4, read: (buffer, offset) => buffer.readFloatLE(offset) };
    default:
      fail(`unsupported accessor componentType ${componentType}`);
  }
}

function componentCount(type) {
  const counts = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const count = counts[type];
  if (!count) fail(`unsupported accessor type ${type}`);
  return count;
}

function readAccessor(gltf, binary, accessorIndex) {
  const accessor = gltf.accessors?.[accessorIndex];
  if (!accessor) fail(`missing accessor ${accessorIndex}`);
  const view = gltf.bufferViews?.[accessor.bufferView];
  if (!view) fail(`missing bufferView ${accessor.bufferView}`);
  if ((view.buffer ?? 0) !== 0) fail("probe expects the donor's single embedded buffer");

  const reader = componentReader(accessor.componentType);
  const width = componentCount(accessor.type);
  const packedStride = reader.bytes * width;
  const stride = view.byteStride ?? packedStride;
  const baseOffset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const values = [];

  for (let i = 0; i < accessor.count; i += 1) {
    const row = [];
    const rowOffset = baseOffset + i * stride;
    for (let j = 0; j < width; j += 1) {
      row.push(reader.read(binary, rowOffset + j * reader.bytes));
    }
    values.push(row);
  }
  return values;
}

function localMatrix(node) {
  if (Array.isArray(node.matrix)) {
    return new THREE.Matrix4().fromArray(node.matrix);
  }
  const position = new THREE.Vector3(...(node.translation ?? [0, 0, 0]));
  const rotation = new THREE.Quaternion(...(node.rotation ?? [0, 0, 0, 1]));
  const scale = new THREE.Vector3(...(node.scale ?? [1, 1, 1]));
  return new THREE.Matrix4().compose(position, rotation, scale);
}

function buildNodeWorldMatrices(gltf) {
  const nodes = gltf.nodes ?? [];
  const parent = new Array(nodes.length).fill(-1);
  nodes.forEach((node, parentIndex) => {
    for (const child of node.children ?? []) {
      if (parent[child] !== -1) fail(`node ${child} has multiple parents`);
      parent[child] = parentIndex;
    }
  });

  const cache = new Map();
  const world = (index) => {
    if (cache.has(index)) return cache.get(index).clone();
    const node = nodes[index];
    if (!node) fail(`missing node ${index}`);
    const matrix = localMatrix(node);
    if (parent[index] !== -1) matrix.premultiply(world(parent[index]));
    cache.set(index, matrix.clone());
    return matrix;
  };
  return { parent, world };
}

function vectorObject(v) {
  return { x: v.x, y: v.y, z: v.z };
}

function boxObject(box) {
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  return {
    min: vectorObject(box.min),
    max: vectorObject(box.max),
    center: vectorObject(center),
    size: vectorObject(size),
  };
}

function nearestOriginBracket(points, epsilon = 1e-7) {
  let nearestPositive = Infinity;
  let nearestNegative = -Infinity;
  for (const point of points) {
    if (point.y > epsilon) nearestPositive = Math.min(nearestPositive, point.y);
    if (point.y < -epsilon) nearestNegative = Math.max(nearestNegative, point.y);
  }
  if (!Number.isFinite(nearestPositive) || !Number.isFinite(nearestNegative)) {
    return null;
  }

  const tolerance = 1e-6;
  const positivePlane = points.filter((point) => Math.abs(point.y - nearestPositive) <= tolerance);
  const negativePlane = points.filter((point) => Math.abs(point.y - nearestNegative) <= tolerance);
  const planeBounds = (plane) => {
    const box = new THREE.Box3();
    for (const point of plane) box.expandByPoint(point);
    return boxObject(box);
  };

  return {
    nearestNegativeY: nearestNegative,
    nearestPositiveY: nearestPositive,
    centerOffsetY: 0.5 * (nearestPositive + nearestNegative),
    halfSpanY: 0.5 * (nearestPositive - nearestNegative),
    symmetryErrorY: Math.abs(nearestPositive + nearestNegative),
    negativePlaneVertexCount: negativePlane.length,
    positivePlaneVertexCount: positivePlane.length,
    negativePlaneBounds: planeBounds(negativePlane),
    positivePlaneBounds: planeBounds(positivePlane),
  };
}

async function run() {
  const bytes = Buffer.from(await readFile(LOCAL_DONOR));
  const observedSha = gitBlobSha(bytes);

  if (bytes.length !== DONOR.byteLength) {
    fail(`byte length ${bytes.length} != expected ${DONOR.byteLength}`);
  }
  if (observedSha !== DONOR.gitBlobSha) {
    fail(`Git blob ${observedSha} != expected ${DONOR.gitBlobSha}`);
  }

  const gltf = JSON.parse(bytes.toString("utf8"));
  if (gltf.asset?.generator !== "Blockbench 5.1.4 glTF exporter") {
    fail(`unexpected generator ${String(gltf.asset?.generator)}`);
  }

  const externalResources = [];
  for (const [index, buffer] of (gltf.buffers ?? []).entries()) {
    if (typeof buffer.uri === "string" && !buffer.uri.startsWith("data:")) {
      externalResources.push(`buffer:${index}:${buffer.uri}`);
    }
  }
  for (const [index, image] of (gltf.images ?? []).entries()) {
    if (typeof image.uri === "string" && !image.uri.startsWith("data:")) {
      externalResources.push(`image:${index}:${image.uri}`);
    }
  }
  if (externalResources.length > 0) {
    fail(`unexpected external resources: ${externalResources.join(", ")}`);
  }

  const nodes = gltf.nodes ?? [];
  const expectedNames = ["Part_Upper", "Part_Stretch", "Part_Lower"];
  const namedNodes = new Map();
  for (const name of expectedNames) {
    const matches = nodes
      .map((node, index) => ({ node, index }))
      .filter(({ node }) => node.name === name);
    if (matches.length !== 1) fail(`${name} match count ${matches.length} != 1`);
    namedNodes.set(name, matches[0].index);
  }

  const meshNodeIndex = nodes.findIndex((node) => node.mesh === 0);
  if (meshNodeIndex < 0) fail("mesh node for mesh 0 not found");
  const primitive = gltf.meshes?.[0]?.primitives?.[0];
  if (!primitive) fail("mesh 0 primitive 0 missing");
  const skin = gltf.skins?.[0];
  if (!skin) fail("skin 0 missing");

  const binary = dataUriBytes(gltf.buffers?.[0]?.uri, "buffer 0");
  if (binary.length !== gltf.buffers?.[0]?.byteLength) {
    fail(`embedded binary length ${binary.length} != declared ${gltf.buffers?.[0]?.byteLength}`);
  }

  const positions = readAccessor(gltf, binary, primitive.attributes.POSITION);
  const joints = readAccessor(gltf, binary, primitive.attributes.JOINTS_0);
  const weights = readAccessor(gltf, binary, primitive.attributes.WEIGHTS_0);
  if (positions.length !== joints.length || positions.length !== weights.length) {
    fail("position/joint/weight accessor counts disagree");
  }

  const { world } = buildNodeWorldMatrices(gltf);
  const meshWorld = world(meshNodeIndex);
  const partGroups = new Map();
  for (const name of expectedNames) {
    const nodeIndex = namedNodes.get(name);
    const skinSlot = skin.joints.indexOf(nodeIndex);
    if (skinSlot < 0) fail(`${name} node ${nodeIndex} is not a skin joint`);
    partGroups.set(skinSlot, {
      name,
      nodeIndex,
      skinSlot,
      vertexCount: 0,
      sceneBox: new THREE.Box3(),
      jointLocalBox: new THREE.Box3(),
      jointLocalPoints: [],
      maxSecondaryWeight: 0,
    });
  }

  for (let i = 0; i < positions.length; i += 1) {
    const rowWeights = weights[i];
    const rowJoints = joints[i];
    let activeComponent = 0;
    for (let j = 1; j < rowWeights.length; j += 1) {
      if (rowWeights[j] > rowWeights[activeComponent]) activeComponent = j;
    }
    const activeWeight = rowWeights[activeComponent];
    const secondaryWeight = rowWeights.reduce(
      (max, weight, index) => (index === activeComponent ? max : Math.max(max, Math.abs(weight))),
      0,
    );
    if (Math.abs(activeWeight - 1) > 1e-6 || secondaryWeight > 1e-6) {
      fail(`vertex ${i} is not rigid one-hot weighted`);
    }

    const skinSlot = rowJoints[activeComponent];
    const group = partGroups.get(skinSlot);
    if (!group) continue;

    const scenePoint = new THREE.Vector3(...positions[i]).applyMatrix4(meshWorld);
    const jointInverse = world(group.nodeIndex).invert();
    const jointLocalPoint = scenePoint.clone().applyMatrix4(jointInverse);
    group.sceneBox.expandByPoint(scenePoint);
    group.jointLocalBox.expandByPoint(jointLocalPoint);
    group.jointLocalPoints.push(jointLocalPoint);
    group.vertexCount += 1;
    group.maxSecondaryWeight = Math.max(group.maxSecondaryWeight, secondaryWeight);
  }

  const parts = [...partGroups.values()].map((group) => {
    if (group.vertexCount === 0) fail(`${group.name} has zero rigid vertices`);
    return {
      name: group.name,
      nodeIndex: group.nodeIndex,
      skinSlot: group.skinSlot,
      nodeOriginScene: vectorObject(new THREE.Vector3().applyMatrix4(world(group.nodeIndex))),
      rigidVertexCount: group.vertexCount,
      rigidSceneBounds: boxObject(group.sceneBox),
      rigidJointLocalBounds: boxObject(group.jointLocalBox),
      nearestOriginBracket: nearestOriginBracket(group.jointLocalPoints),
      maxSecondaryWeight: group.maxSecondaryWeight,
    };
  });

  for (const name of ["Part_Upper", "Part_Lower"]) {
    const part = parts.find((candidate) => candidate.name === name);
    if (!part?.nearestOriginBracket) fail(`${name} does not geometrically bracket its authored node origin`);
    if (part.nearestOriginBracket.symmetryErrorY > 1e-6) {
      fail(`${name} nearest authored geometry is not Y-symmetric around its node origin`);
    }
    if (
      part.nearestOriginBracket.positivePlaneVertexCount === 0 ||
      part.nearestOriginBracket.negativePlaneVertexCount === 0
    ) {
      fail(`${name} lacks geometry on both sides of its node origin`);
    }
  }

  const summary = {
    schema: "rep2-c1-donor-probe-v2",
    donor: {
      ...DONOR,
      observedGitBlobSha: observedSha,
      observedByteLength: bytes.length,
    },
    gltf: {
      generator: gltf.asset?.generator,
      sceneCount: (gltf.scenes ?? []).length,
      nodeCount: nodes.length,
      meshCount: (gltf.meshes ?? []).length,
      skinCount: (gltf.skins ?? []).length,
      externalResources,
      meshNodeIndex,
      skinJoints: skin.joints,
      rigidOneHotSkinning: true,
      vertexCount: positions.length,
    },
    parts,
    interpretationBoundary: {
      nodeOriginsAreMeasuredBindReferences: true,
      endOriginsAreGeometricallyBracketed: true,
      nodeOriginsAreAcceptedMechanicalEyes: false,
      note: "C1.0 proves the end-node origins are authored geometric references bracketed by real donor geometry. C1's live mechanical authority comes from the separate native-spring relation, never from these visual nodes.",
    },
  };

  const json = `${JSON.stringify(summary, null, 2)}\n`;
  const outIndex = process.argv.indexOf("--out");
  if (outIndex >= 0) {
    const path = process.argv[outIndex + 1];
    if (!path) fail("--out requires a file path");
    await writeFile(path, json, "utf8");
  }
  process.stdout.write(json);
}

await run();
