# Rep4 B2 direct construction receipt — 2026-09-05

Status: **BOUNDED MACHINE / RENDERED PASS — NOT AN OWNER, PLAY, OR GENERAL-BUILDER VERDICT**

## Qualified runtime

- branch: `experiment/rep4-multi-relation-corner`
- exact qualified runtime SHA: `53d28b90bb3a7e3d2ccdb373873768aa575e740e`
- frozen ownerless technical checkpoint: `rep4-b2-ownerless-qualified-checkpoint` at the exact runtime SHA above
- Rep4 B2 workflow: `Rep4 B2 Direct Construction`
  - run: `33970680361`
  - job: `101318516277`
  - result: PASS
  - source tests + production build: PASS
  - real Chromium direct-construction preflight: PASS
  - artifact: `rep4-b2-direct-construction`
  - artifact id: `9970836004`
  - artifact SHA-256: `8b24227a2ded734dcdc6e1de5466b7789ce89065b846f2e1a884e4fc4110b578`
- same-SHA Stage-A causal regression:
  - run: `33970680356`
  - job: `101318516025`
  - result: PASS
- same-SHA B1 visual-correspondence regression:
  - run: `33970680358`
  - job: `101318516131`
  - result: PASS

## What B2 earned

B2 tested BUILD-space construction bandwidth only. In one rendered Rep4 corner, three mechanically different authored hardpoint classes can be selected and edited directly:

1. an upper-arm bearing,
2. a chassis tie point,
3. a damper lower eye.

Each edit changes its own authored spatial authority and the visible mechanism is rebuilt from that authority. The interaction surface does not expose a hidden handling slider, conventional suspension-axis parameter, or alternate decorative geometry authority.

The browser gate exercises selection and XYZ translation in real Chromium. Exact numeric entry remains available alongside spatial manipulation. Rendered review of baseline and three-class-edited screenshots remained readable after all edits, including intentionally odd geometry; B2 does not auto-correct or forbid strange construction.

## Failure history retained

The first B2 candidate at `06c87af4e43bf79292c734fda553bcd37ca86de6` was **not** accepted.

Its real Chromium gate exposed a genuine acquisition/usability bug: enlarged invisible gizmo pickers were raycast before physical hardpoints. After editing one point, a gizmo picker could overlap a nearby visible hardpoint and steal the click, making the visible part difficult or impossible to select directly.

The fix at `53d28b90bb3a7e3d2ccdb373873768aa575e740e` changed interaction semantics rather than weakening the test: visible physical hardpoints now get selection priority; the gizmo receives the pointer only when no hardpoint was hit. The same exact SHA then passed Stage A, B1, and B2 gates.

## Rendered-review boundary

The edited configuration can become mechanically strange. That is not a B2 failure: the current builder direction is permissive and should generally let authored oddities exist. The review only establishes that selection, gizmo ownership, component scale, and mechanism readability remain sufficient for the bounded experiment.

## Claim boundary

B2 does **not** establish:

- BUILD → PLAY causal continuity from edited authority,
- exact restoration of authored construction after simulation,
- usable construction feel for the Owner,
- sufficient bandwidth for a general vehicle builder,
- arbitrary topology editing,
- final component/adaptive-component semantics,
- correct real-car suspension behavior,
- tire/contact/whole-vehicle behavior,
- final UI, renderer, or asset architecture.

Natural next question: can a materially edited B2 construction feed the same real native Rep4 physics path, produce observable motion from that edited authority, and then return exactly to the authored BUILD state without replacing construction authority with simulated state? That is Rep4 B3.
