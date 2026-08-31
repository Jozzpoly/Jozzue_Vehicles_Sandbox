# Final E1 F1 — technical preflight

Date: 2026-08-31. **Technical PASS; Owner comparison NOT_RUN; H0 unresolved.**
Base/frozen provenance control: `55b62da06632e9325c9f6e1cbfb4e9acb4ba6bde`.
This receipt describes local working-tree changes on that base, not a new published
ref. No commit or push in this pass. Historical receipts remain unchanged.
Scope: [final F1 contract](../../docs/e1/FINAL_F1_CONTRACT.md), not JV architecture.

## What changed

- `src/e1/f1-construction.ts`: disposable T1 operation functions only. Second point
  Connect preserves the single satisfied other-endpoint anchor, changes pose only,
  and adds an ordinary explicit relation. FIT preserves the selected anchor and
  pose, moving only the opposite local point. No endpoint-role/recovery data.
- `src/e1/app.ts`: `?f1=C1` (default) / `?f1=T1`, shared named target identity,
  shared FIT access at point selection, and condition-specific operation dispatch.
  A chosen overlap target cannot mislabel a different target after pointer motion.
- No changes to model, scenario, evaluator, C1 construction functions, spatial
  helpers, edit session, projection, styles, dependencies or committed harness config.
  No asset integration, placeholder work, inference, solver or unresolved system.

### Explicit adjustment: FIT anchor is ordinary visible selection

The existing 0.11 m satisfaction tolerance can label both endpoints satisfied
before FIT. Choosing the first array entry, oldest relation or smaller residual
would silently assign an anchor role. Instead, both conditions select the prior
anchor after a qualifying second Connect and expose the existing FIT command at
that point. T1 uses this explicit selection; body-level T1 FIT requires exactly
one satisfied candidate. No hidden connection history is retained.

C1 geometry/pose operation functions remain byte-identical to the frozen base;
its UI is intentionally not byte-identical. C1 retains its body numeric-length
editor. T1 shows length read-only and authors it through FIT only. The comparison
is Connect/FIT consequence evidence, not a claim that every control is identical.
Manual-length or manual-pose bypasses must be recorded, not scored as a clean
Connect/FIT comparison. The target identity aid itself is identical in C1/T1.

## Verified claims

| Claim | Evidence |
| --- | --- |
| A-first/B-first for both linear kinds | Pure tests, also with reversed reference arrays, non-origin anchors and non-identity poses |
| Connect preserves own geometry and existing world anchor | Pure state comparisons; new mismatch lies along the target line |
| FIT preserves the correct endpoint/pose and closes both point relations | Pure tests for both orders/kinds; no array-order anchor assumption |
| No manual registration needed on the supported full path | Two complete UI-only T1 runs, A-first and B-first for link and damper |
| Full resolved rocker PLAY, then BUILD and Undo | Both UI runs: five relations, zero violations, a full >4 s PLAY cycle, exact displayed revision recovery; independent pure tests prove unchanged authored state/history |
| Mixed authoring orders and deterministic evaluator | All four link/damper order combinations resolve all evaluator frames; repeated evaluation identical; final endpoint positions agree |
| Ambiguous/multi-anchor/unsatisfied cases do not complete | Local eligibility tests; legacy Connect fallback, no T1 FIT/repair |
| C1 still has the old consequence | Matched UI run: second link Connect introduces one violation; old FIT changes length to 0.975 m but leaves the violation. T1 reaches zero without pose repair |
| Target aid is matched | Same axis, both overlapping point identities, and new-target-after-overlap checks in C1/T1 |

UI rehearsal used actual canvas clicks, explicit overlap cycling/confirmation,
existing add/disconnect/Connect/FIT buttons and BUILD/PLAY/Undo. No `page.evaluate`,
authored-state injection, imported model oracle, orient helper, gizmo registration
or hidden coordinates computed from scene state. Pixel positions were obtained
from visible screenshots. Pure fixture tests are separate from UI reachability.

One confirmed numerical edge was corrected locally: the shared quaternion helper
rounds near-antiparallel directions to exactly PI. F1 now uses the actual angle
there, so a length-only FIT need not compensate for angular error. Shared/C1 math
and relation tolerances were not changed; exact/near-antiparallel regressions pass.

## Reproduction and environment

- Windows, Node `24.16.0`, Edge `152.0.4191.53`, Playwright `1.62.1`.
- Clean `npm ci --no-audit --no-fund`, then `npm run check`: **39/39 tests**, typecheck
  and Vite production build PASS. Existing >500 kB bundle-size warning remains;
  this is not a performance/optimization gate.
- Full browser suite: **8/8 PASS**. New F1 runs at 1280x720; prior tests at 1440x900.
  Console warnings/errors and page errors guarded; none in tested pages.
- Port 4173 belonged to an unrelated ANVIL server. It was not stopped. Used temporary
  external `C:/Users/Pioter/AppData/Local/Temp/jv-f1-playwright.config.mjs` with the
  same server lifecycle/browser settings, changing only path resolution and port
  to 4181. The standard `npm run test:browser` remains reproducible when 4173 is free.
  Command used: `node node_modules/@playwright/test/cli.js test --config C:/Users/Pioter/AppData/Local/Temp/jv-f1-playwright.config.mjs`.
- Browser skill controller could not be invoked: no browser/Node-REPL tools were
  exposed. Used repository Playwright/Edge fallback, not a model-level surrogate.
- Harness-owned JV server stopped after tests. No Owner server or comparison launched.
- `git diff --check` PASS; frozen boundary files compared to base and unchanged.

Transient screenshots (not repository authority) are in the system temp folder:
`jv-f1-ui-rocker-play.png`, `jv-f1-matched-C1.png`, `jv-f1-matched-T1.png`,
`jv-f1-T1-full-rocker-UI-A-first.png`, `jv-f1-T1-full-rocker-UI-B-first.png`.
The test scripts reproduce them; they are not Owner visual acceptance.

Validated file SHA-256 values (working-tree bytes, before Git line normalization):

```text
src/e1/app.ts
9B10F89E2E7E580F1E511E4434DD35E3F1280C33932BE824ADA344C8BB69D4CC
src/e1/f1-construction.ts
904C496DC3B792A1632D09946F85944AAF6DC1B51FCFA215E0C0C7F5AFFCC1DC
tests/e1/final-f1.test.ts
DAE6A87A540EBC5C4947990B5AED4D3C60021378CAC83E0E04CA45D1DEF1B87A
tests/browser/e1-final-f1.spec.ts
7221BAA46AA0017D3502807C8D83EA28C6A0CEC00A4082E890B0146D612580D7
```

## Ceiling / stop

This proves bounded operation correctness and technical UI reachability, not
natural construction, Owner satisfaction, H0 PASS or a general assembly model.
Placeholder readability, task understanding, target picking, selection/FIT burden
and single-Owner learning/order effects remain confounds. Do not interpret timed
A/B completion as a controlled causal measurement. No mobile/performance or
general-topology claim was tested.

**Stop at technical preflight.** Owner comparison is the remaining judgement, not
authorization to improve E1 again. After that comparison E1 ends regardless of
outcome. No T2/T3, automatic continuation, or promotion of F1 into JV architecture.
