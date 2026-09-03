# JV_CORE Visual Model / Rig / physics↔visual correspondence — bounded donor forensics

Date: 2026-09-04

Status: **bounded source-forensics complete; no architecture promotion; no R2 defined**

## 1. Scope and provenance

This evidence was produced after the post-R1 fresh takeover. E1, V0 and R1 remain closed evidence and were not repeated or polished.

Canonical Nextgen JV source state used for the takeover:

- repository: `Jozzpoly/Jozzue_Vehicles_Sandbox`
- branch: `main`
- verified commit: `ad75ca9ea7436548f901bf6c11e69cd5e465379e`

JV_CORE donor inspected:

- repository: `Jozzpoly/Box3d_FunProject`
- branch: `jozz-scan-terrain-f0`
- verified live branch commit: `241fe10a9056836332c21d9614471d32d749ce3d`
- exact tree at that commit: `8c3acbf84e923a22f3fe90f4887f345cc1829134`

Important provenance correction: the takeover's `8c3acbf...` identifies the exact donor **tree**, not the commit object. Both commit and tree are recorded above so future work does not conflate them.

This pass is source/asset forensics. It did not claim a fresh runtime drive test or Owner feel result.

## 2. Fresh falsification before interpretation

An earlier trail pointing to `assets/visual-rig-models/OneSided_Steering_Suspension_Rig.gltf` did not survive exact-tree verification. The verified donor tree instead contains:

`assets/source/OneSided_Steering_Suspension_Rig.gltf`

The stale path was rejected rather than used as evidence.

## 3. Layer A — asset truth

`assets/source/OneSided_Steering_Suspension_Rig.gltf` is a Blockbench 5.1.4 glTF export. For this asset, the word **rig** is not merely a filename convention: the file contains a glTF `skin`, `skin.joints`, `JOINTS_0` and `WEIGHTS_0`.

Important authored nodes include:

- `Chassis_Top`
- `Chassis_Bottom`
- `Socket_WheelCenter`
- `Socket_ChassisMount_a`
- `Socket_ChassisMount_b`
- `Socket_SingleDamper_Mount`
- `Socket_SingleDamperUpper`
- `Socket_SingleDamperLower`
- `Socket_SteeringRod`
- `Socket_CardanDrive`
- `Socket_CardanHub`
- `Axis_SuspensionTravel_Top`
- `Axis_SuspensionTravel_Bottom`

The weights are treated by the donor loader as a rigid-skin convention: one dominant bone approximately owns each vertex.

**What the asset proves:** an authored hierarchy, named semantic reference points, and rigid per-bone visual grouping exist.

**What it does not prove:** those bones are Box3D bodies, those sockets are physics anchors, or authored geometry is the authority for the live suspension.

## 4. Layer B — import truth

Two materially different import paths exist in the donor.

### 4.1 Static glTF

`JozzVehicleVisualMesh::LoadStaticGltf`:

- reads only the first supported primitive;
- composes authored node transforms;
- bakes that transform into vertices in metres;
- registers one static render mesh.

The authored hierarchy is therefore flattened for this path.

### 4.2 Rigged glTF

`JozzVehicleRiggedMesh::LoadSkinnedGltf` does **not** keep a conventional live skinned skeleton. It:

- reads nodes, first skin joints, `JOINTS_0` and `WEIGHTS_0`;
- selects the dominant bone for each vertex;
- groups triangles by bone;
- registers one rigid mesh part per bone group;
- stores each part's `boneName`, node index, rest bounds and authored bone rest position.

The runtime visual rig is therefore a set of independently placeable rigid render pieces derived from an authored skin.

This distinction matters: **authored skeletal rig != runtime skeletal simulation != physics rig**.

## 5. Asset contract truth

`assets/contracts/one_sided_steering_suspension.asset.json` describes this asset as:

`steering_suspension_corner_visual`

Every required visual endpoint/part and both suspension-axis hints have `physicsAuthority: false`.

The contract explicitly intends the data as visual endpoints / physics hints, not physics authority. It also records expected body affinities such as chassis, knuckle and lower arm.

The validator reinforces this boundary: `ValidateJozzVehicleSteeringSuspensionContract` reports an error if any required visual steering-suspension role is marked `physicsAuthority: true`.

Therefore the donor itself contains an explicit non-authority boundary for this combined steering/suspension visual asset.

## 6. Layer C/D/E — runtime visual, physics and correspondence

The current donor does not have one uniform physics↔visual mapping. It mixes direct body-follow, derived visual solving, authored references and several disagreements.

| Element | Visual runtime driver | Physics counterpart | Correspondence verdict |
|---|---|---|---|
| Body visual | live `chassisId` transform + visual-local offset | chassis body | **direct body-follow**, with render-only placement correction |
| Wheel visual | live `wheelId` transform + `ComputeJozzVehicleWheelVisualCorrection` | wheel body/collider | **direct body-follow**, correction explicitly visual-only |
| `Socket_WheelCenter` part | `knuckleId` live transform | knuckle body | **direct body-follow** |
| `Chassis_Top` visual arm | `DrawPartBetween`: chassis endpoint → endpoint taken from **lower-arm** placement | physical **upperArmId** exists separately | **derived and not 1:1**; upper visual arm is not driven by `upperArmId` |
| `Chassis_Bottom` visual arm | `DrawPartBetween`: chassis endpoint → lower-arm placement | physical `lowerArmId` | **derived from live physics**, but rendered by endpoint solve/stretch rather than the body transform |
| `Socket_ChassisMount_b` | explicitly dispatched to `lowerArmId` in `DrawSteeringRig` | contract says this role rides `knuckle` | **contract↔runtime conflict** |
| steering rod visual | rendered between **rack centre** and a knuckle-derived outboard endpoint | physical front `steerLinkJointId` is a rigid distance joint between a **rack end (`±rackHalfWidth`)** and knuckle steering-arm hardpoint | **live-body-derived but geometrically different from the physical tie rod** |
| damper visual | top from chassis visual frame; lower eye mapped through lower-arm visual placement | physical wishbone `coiloverJointId` connects **chassis ↔ knuckle** | **mechanism correspondence mismatch** |
| suspension travel axis markers | resolved as contract roles / `physics_hint` | physical wishbone hardpoints/travel come from `JozzVehicleM6MakeWishboneHardpoints(config.wishbone, ...)` | **reference only; not physics authority** |
| cardan roles | contract describes chassis/knuckle affinities | no correspondence conclusion established in this pass | **UNKNOWN**; draw dispatch has no dedicated cardan case, but this pass did not establish which cardan bones actually own rendered triangles |

### 6.1 The physical wishbone is independently authored in code/config

For `JOZZ_M6_RIG_DOUBLE_WISHBONE`, the actual physics path creates:

- dynamic shapeless `upperArmId` and `lowerArmId` bodies;
- revolute chassis hinges;
- spherical arm↔knuckle joints;
- a dynamic knuckle body;
- a physical rack body on a prismatic joint;
- rigid distance-joint tie rods;
- a chassis↔knuckle spring/damper distance joint;
- a separate wheel body and spin joint.

Its hardpoints are generated from `config.wishbone` via `JozzVehicleM6MakeWishboneHardpoints(...)`.

No source found in this bounded pass makes `OneSided_Steering_Suspension_Rig.gltf` or its steering-suspension contract the authority that creates those wishbone hardpoints/bodies/joints.

### 6.2 A useful contrasting donor path exists

The donor is not uniformly visual-only. `LoadJozzVehicleM7TrailingArmGeometry(...)` reads roles from an asset contract, computes pivot/damper offsets, and returns `JozzVehicleM6TrailingArmGeometry` consumed by the trailing-arm physics construction path.

So JV_CORE contains at least two distinct patterns:

1. **combined steering/suspension visual rig:** authored asset semantics adapt to an independently generated live physics rig;
2. **trailing-arm import:** selected authored contract points feed physics geometry.

Neither pattern should be promoted to Nextgen architecture merely because it exists. The asymmetry is itself useful donor evidence.

## 7. Main finding

The strongest bounded conclusion is:

> The current combined `OneSided_Steering_Suspension_Rig` is a real authored glTF skin and a meaningful runtime visual rig, but it is **not the causal authority for the current front wishbone physics**. Runtime correspondence is hybrid: some pieces follow real bodies directly, some are reconstructed/stretched between live points, and some visible mechanisms do not use the same anchors/bodies as the physical mechanism they appear to represent.

This means that a visually convincing moving rig in JV_CORE must not be treated as proof that authored mechanism geometry causally determines vehicle behavior.

That is directly relevant to Nextgen JV's Soul: when the product presents a mechanism as the cause of behavior, a real causal path is preferable to a decorative/parallel mechanism around hidden handling or independent geometry.

## 8. What this pass does NOT conclude

This evidence does **not** conclude that:

- JV_CORE's rig system is bad or should be discarded;
- skeletal skinning is the right Nextgen component model;
- existing `hardpoints` should become the Nextgen data model;
- the Blockbench contract should become a runtime contract;
- `frame`, `suspension`, `adaptive components`, intent locks or any R2 design are settled;
- every visible donor part is mismatched;
- the current visual/physics differences are perceptually important without a runtime/Owner test.

## 9. Uncertainties left deliberately open

- Exact rendered ownership/presence of every cardan/socket bone was not established.
- No fresh runtime probe measured visible divergence under extreme suspension/steering articulation.
- No general donor-wide audit was attempted; this pass intentionally stayed on the front steering/suspension correspondence seam.
- The correct Nextgen causal representation remains open.

## 10. Next bounded move selected from this evidence

Do **not** name or implement “R2” yet.

The next high-information problem should be a **small causal-correspondence probe**, using the donor only as evidence rather than architecture authority:

- choose one mechanism where visual and physical definitions currently diverge strongly (steering link is the cleanest candidate);
- construct/trace one representation in which the same authored endpoints define both the visible link and the physical constraint;
- change one endpoint spatially;
- verify separately that the visible mechanism changes, the physical constraint changes, and vehicle response changes through that same path;
- stop once that single causal chain is demonstrated or falsified.

This would test the product-level unknown exposed by donor forensics — whether authored construction can be the actual mechanism — without turning the old rig, its hardpoint model, or a guessed R2 into architecture by inertia.
