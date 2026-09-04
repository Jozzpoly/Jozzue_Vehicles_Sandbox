# Rep2 critical quality review — pre-continuation gate

Date: 2026-09-04

Status: **forward growth frozen; Rep2 is provisional research, not an earned product/architecture direction**

## Live anchors

- canonical `main` remains `ad75ca9ea7436548f901bf6c11e69cd5e465379e`;
- Stage-A successful specimen: `experiment/rep2-single-source-suspension-link@954b6eb8e5f3bc3466134e77934cecc841ff5e5a`;
- later Stage-B implementation head inspected: `bb77b6035f49d88a5882aab3e2e6f0410f25ca84`;
- Stage-B `Rep2 Gates` run `33827520477`: both `source-check` and `rendered-correspondence` concluded **failure**.

No Rep2 implementation is promoted to `main`.

## 1. What Stage A still earns

Stage A remains useful bounded evidence:

- one authored `armPivotLocal` + `wheelEndpointLocal` state constructs a real Box3D arm body, chassis/arm revolute hinge and arm/wheel spin joint;
- runtime-derived joint/body endpoints follow authored mutations;
- equal-length but differently directed authored layouts separate live arm/wheel response;
- the selected wheel contacts the world and the carrier drives under the bounded protocol;
- odd finite geometry remains permissive while non-finite/near-zero geometry is rejected explicitly;
- exact Box3D donor semantics confirm a revolute joint allows relative rotation about local Z. Rep2's baseline arm lies in X/Y with common Z, so identity joint frames are mechanically consistent with the intended one-sided/trailing-link-like swing.

This does **not** establish final suspension semantics, realistic arm mass/inertia, spring/damper semantics, topology editing, adaptive components, final hardpoint/data model, visual rig semantics or Owner-facing product value.

## 2. Stage B is not PASS

The current Stage-B implementation must not be described as validated.

Failure classification from run `33827520477`:

1. `source-check` failed TypeScript because `src/rep2/app.ts` does not preserve the non-null narrowing of `root` into its nested/async update path. This is implementation/evidence plumbing, not a physics falsification.
2. Rendered B3 correspondence assertions themselves did not expose a geometry mismatch, but the test was failed by the generic console-warning collector on Chromium/ANGLE `ReadPixels` performance warnings.
3. B4 read missing dataset fields before async Box3D/app initialization completed, producing `NaN`; it did not first wait for the runtime-ready state used by B3.
4. B5 has the same readiness race and observed an empty `data-variant` before initialization.

These failures mean the gate is invalid as PASS evidence. They do not, by themselves, establish that the underlying live-trace-to-Three endpoint mapping is wrong.

## 3. More important: current Stage B has low research information gain

The placeholder arm is intentionally posed directly from:

`trace.hingeWorldFromArm -> trace.wheelEndpointWorldFromArm`

and the test then reconstructs its rendered endpoints and compares them with those same trace endpoints.

That is a useful regression/preflight guard against a second visual hardpoint table, but it is close to tautological as a research result. It does not resolve the difficult donor question: whether **real authored Blockbench/glTF geometry and its semantic parts** can correspond to the physical mechanism without per-part hacks, duplicated authority or hidden mappings.

If Rep2 survives the donor review, treat this implementation as **B0 — correspondence harness/preflight**, not as the real Visual Model/Rig milestone.

## 4. Canonical process debt discovered

The canonical current-state/fresh-takeover workflow required the donor work to proceed through:

- authored asset inspection;
- loader/import inspection;
- visual runtime tracing;
- physics runtime tracing;
- explicit correspondence tracing;
- **render the exact donor specimen**;
- bounded telemetry/overlays where needed;
- **bring rendered findings to Owner for correction**;
- only then select the next clean-room representative problem.

The source-forensics receipts correctly marked fresh runtime/render observation as not yet performed / UNKNOWN. Nevertheless Rep2 was selected and Stage A/B work began before the rendered-donor + Owner-correction layers were completed.

Therefore the selection document is best interpreted as a **well-motivated provisional hypothesis**, not yet an earned canonical Representative Problem #2.

This is an epistemic/process correction, not evidence that Stage-A mechanics are false.

## 5. Why this is a high-consequence boundary

The project is moving from a local causal proof (R1) toward decisions about what authored geometry, physics authority and visible mechanism mean in a future builder.

The main risks are now:

- **prototype gravity** — a clean disposable Rep2 seam becomes de-facto architecture because it is easier to work with than the messy donor;
- **evidence substitution** — source/tests/telemetry are allowed to stand in for rendered correspondence or Owner judgement;
- **placeholder lock-in** — a procedural cylinder/endpoint representation becomes the implicit component grammar before real donor geometry is confronted;
- **premature authority** — `Rep2SuspensionGeometry` or its two-point member semantics are promoted beyond the one bounded experiment;
- **Owner-test confounds** — the current Stage-A selected rear corner has different drive/topology from the opposite direct-spin rear wheel; this is acceptable for machine causal evidence but should not be used unmodified for a future feel/handling checkpoint.

## 6. Missing evidence recovery now in progress

A throwaway donor branch was created from the exact native donor commit:

- repo: `Jozzpoly/Box3d_FunProject`
- exact runtime base: `241fe10a9056836332c21d9614471d32d749ce3d`
- branch: `research/jv-core-rendered-forensics-2026-09-04`

The donor already contains its own bounded native screenshot apparatus:

- `--sample-name <substr>`;
- `--frames N`;
- `--screenshot <path>`;
- M6 `JOZZ_M6_*` environment hooks for deterministic visual/debug variants.

A first Linux/Xvfb idea was rejected before use as evidence because `CaptureFrameToPng()` is implemented only for the Windows/D3D11 backend. The throwaway workflow was corrected to Windows so it uses the donor's intended screenshot path rather than adding a parallel renderer.

Target captures:

1. M6 baseline authored visual;
2. M6 visual + physics diagnostics / arm tint;
3. M6 front steering-rig visual + diagnostics.

These renders are forensic evidence only. They do not replace Owner correction or hands-on feel.

## 7. Decision gate after rendered donor evidence

Do not fix/extend Stage B, import donor fragments, add direct manipulation, or call Rep2 canonical until the rendered donor pass is inspected.

After that pass:

### If rendered evidence supports the current problem framing

Keep Stage A as preliminary physical evidence, downgrade current Stage B to B0, and design the next bounded experiment around **real donor visual geometry** consuming the same physical/authored semantics. Only then prepare an Owner correction/checkpoint.

### If rendered evidence materially changes the interpretation

Re-open representative-problem selection. Rep2 may be reframed or discarded without protecting its code investment.

### If the donor reveals a stronger reusable seam

Prefer the newly demonstrated seam even if it means abandoning the current two-point suspension-link apparatus.

## 8. Current recommendation

**Freeze forward Rep2 growth. Complete exact donor rendered-forensics, inspect it against source-level correspondence claims, obtain Owner correction, then re-decide whether Rep2 deserves continuation.**

This is the smallest move that repairs the current evidence hierarchy while protecting Stage-A information and avoiding prototype gravity.
