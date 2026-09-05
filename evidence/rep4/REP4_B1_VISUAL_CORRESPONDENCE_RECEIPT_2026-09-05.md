# Rep4 B1 visual correspondence receipt — 2026-09-05

Status: **BOUNDED MACHINE / RENDERED PASS — NOT AN OWNER OR DIRECT-CONSTRUCTION VERDICT**

## Qualified runtime

- branch: `experiment/rep4-multi-relation-corner`
- exact qualified SHA: `91c682ff8faf8f31db1ef505e04e5d66118cb1b4`
- Rep4 B1 workflow: `Rep4 B1 Visual Correspondence`
  - run: `33969985550`
  - job: `101316656425`
  - result: PASS
  - source suite: `102/102 PASS`
  - production build: PASS
  - real Chromium rendered test: PASS
  - artifact: `rep4-b1-rendered-correspondence`
  - artifact id: `9970630045`
  - artifact SHA-256: `61483c00b83ca8bcf8c3d53a78bfcaf74ccf3ee33105c9759774a9e33042d8c1`
- same-SHA Stage-A regression workflow:
  - run: `33969985575`
  - result: PASS, including A3/A4/A5 diagnostics, post-PASS robustness neighborhood, and production build

## What B1 earned

1. BUILD visualization reads the authored Rep4 mechanical hardpoints directly.
2. PLAY visualization is an observer of the real native Box3D trace produced by the Stage-A mechanism; no second browser suspension solver or decorative motion path was introduced.
3. Visible tie and damper segments follow native current relation endpoints/lengths, and spherical solver gap is not cosmetically erased by inventing a visual midpoint.
4. Removing the physical damper relation makes the projection refuse to draw a fake PLAY damper.
5. The real `Asset_Dumper.gltf` donor is reused through the already-qualified C1 endpoint adapter.
6. The donor's Blockbench authored unit scale is now explicitly normalized before endpoint adaptation: source reference span `1.96875` is uniformly scaled to physical component `L0 = 0.5 m` (`~0.254×`). This is visual correspondence only; physical `k/c/L0` are unchanged.
7. Real Chromium consumes the native trace through a complete playback and returns to the exact BUILD projection. Accumulated rendered-observer metrics verify material native motion without depending on one race-prone selected frame, while the fixed tie is not allowed to acquire material visual stretch.
8. Screenshot review after the scale fix shows the donor as a readable component inside the corner rather than the previous giant scene-dominating mesh.

## Failure history retained

B1 was not green on the first attempt.

- First rendered run exposed delayed state publication: PLAY had started, but browser evidence was not published until the next render frame.
- The next run exposed a real timing bug: a first `requestAnimationFrame` timestamp could precede the click-handler `performance.now()`, yielding `frameIndex = -1` and `trace[-1]`.
- After clamping the playback index, the next gate exposed a test overclaim/race: it polled for an intermediate frame but could read evidence after automatic return to BUILD and therefore compare BUILD to BUILD.
- Screenshot inspection independently exposed that endpoint correctness did not imply visual scale correctness; the donor's raw authored units made it grossly oversized in Rep4.

The final gate removes those confounds rather than weakening the native mechanics or tuning physics to satisfy the browser test.

## Claim boundary

B1 does **not** establish:

- usable direct construction,
- builder feel,
- sufficient construction bandwidth,
- correct real-car bump steer,
- tire/contact/vehicle behavior,
- final donor/component semantics,
- final renderer or asset architecture,
- product-level suspension correctness.

Natural next question: can several mechanically different authored hardpoint classes be manipulated directly in one readable BUILD space without hidden parameter authority or cross-authority rewrites? That is Rep4 B2.
