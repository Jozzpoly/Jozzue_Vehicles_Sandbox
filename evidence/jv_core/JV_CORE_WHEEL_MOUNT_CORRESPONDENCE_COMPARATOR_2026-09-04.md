# JV_CORE wheel-mount correspondence comparator

Date: 2026-09-04

Companion evidence to `JV_CORE_VISUAL_RIG_FORENSICS_2026-09-04.md`.

## Question

Does the older `One_Sided_wheel_mount` path provide a clean counterexample where one authored representation is already the shared causal authority for both visual articulation and suspension physics?

## Result

**No.** It proves a narrower and useful thing — selected authored contract points can feed physics geometry — but the donor still splits visual and physical meaning across different consumers and rig types.

## Evidence

### Contract semantics

`assets/contracts/one_sided_wheel_mount.asset.json` declares the asset as `suspension_corner_visual`.

Its chassis mount, wheel center, damper endpoints, cardan endpoints, travel-axis markers and visual parts are all marked `physicsAuthority: false`; the roles used later by the physics importer are still named `suspension.visual.*`. The contract's own physics section describes the v0 treatment as `visual_only_attached_to_wheel_joint_corner` and only calls multi-body suspension a future candidate.

### Physics consumer contradicts the apparent authority boundary

`LoadJozzVehicleM7TrailingArmGeometry("one_sided_wheel_mount.asset.json")` resolves the contract roles:

- `suspension.visual.chassis_mount`
- `suspension.visual.wheel_center`
- damper upper/lower visual endpoints

and converts their positions into `JozzVehicleM6TrailingArmGeometry` pivot and damper offsets.

The M6/M7 lab copies that imported geometry into `m_config.trailingArm`; when a corner uses `JOZZ_M6_RIG_TRAILING_ARM`, the physics builder creates the arm body, hinge and coilover from that geometry.

Therefore source inspection demonstrates that the donor's `physicsAuthority:false` / `visual_endpoint` labels are **not a reliable global statement that downstream physics will not consume those coordinates**.

This is a concrete example of why donor contracts/docs cannot outrank traced runtime/source behavior.

### Visual consumer uses a different rig gate

The old `One_Sided_wheel_mount` render path does not establish shared visual↔trailing-arm authority.

`SetupMountRig()` sets `m_cornerHasMount[corner]` only when the live corner is `JOZZ_M6_RIG_DOUBLE_WISHBONE` and has a knuckle. The render path skips corners where `m_cornerHasMount` is false, then drives the old mount visual from chassis and **knuckle** transforms.

A trailing-arm corner therefore does not, through this inspected path, render the same old mount model as a visual skin driven by the trailing-arm body whose geometry was imported from that asset contract.

## Refined donor classification

The donor contains three distinct ideas, not one coherent rig contract:

1. **authored semantic-point extraction** from Blockbench/glTF contracts;
2. **physics geometry import** that can consume selected authored points even when the contract calls them visual/non-authoritative;
3. **visual articulation adapters** that place/stretch rigid per-bone meshes onto whichever live bodies a given render path chooses.

Those ideas are individually useful donor capital. Their current composition is **negative evidence against assuming that asset role names, `physicsAuthority` flags, visual rig names or apparent mechanism shape imply a single causal representation**.

## Consequence for Nextgen JV

Do not transplant the donor contract semantics as architecture.

The valuable principle to extract is narrower:

> authored spatial geometry *can* be resolved from real assets and used to build live physics, while visual geometry can also adapt to live endpoints.

The unresolved Nextgen problem is to make those two facts meet in one honest causal chain when the product presents a mechanism as the cause of behavior.

This comparator strengthens, rather than weakens, the case that a future representative problem should explicitly test **single-source spatial construction → physical mechanism → matching visible mechanism → driving consequence**, instead of merely making an old rig look more faithful.
