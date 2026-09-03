# Jozzue Vehicles Sandbox

> **Research repository for the next generation of Jozz Vehicle. Experiments are evidence, not architecture.**

The long-term product direction is a mechanically credible vehicle sandbox built around a short creative loop:

`build → run → observe → improve → get in and drive`

The repository currently preserves bounded research programs that reduce product uncertainty. It does **not** yet define the final builder, vehicle representation, engine, renderer, physics runtime, asset pipeline or desktop/Web split.

## Current truth

Two bounded research programs are closed:

- **E1 — construction-loop research:** CLOSED; its main hypothesis remains unresolved. E1 found bounded value in authored edit → causal PLAY → exact BUILD recovery and in locality-preserving completion, but did not establish a satisfying or general construction grammar.
- **V0 — drivable physical steering consequence:** CLOSED; technical consequence PASS plus final Owner readability PASS **for reuse as a bounded research carrier only**. V0 established that a real steering-geometry change can propagate through a physical rack/tie-rod/knuckle chain into a materially different trajectory and that, after removing confirmed input/camera/readability confounds, the Owner can perceive the A/B difference during driving.

Neither program has architecture authority.

The project is now in a short **closure/regrounding and next representative-problem selection** phase. Do not interpret V0 success as authorization to turn the primitive carrier into the product.

## Start here

For a fresh takeover, read in this order:

1. [`docs/NEXTGEN_JV_PROJECT_SOUL.md`](docs/NEXTGEN_JV_PROJECT_SOUL.md) — durable product intent and deliberate non-decisions.
2. [`docs/NEXTGEN_JV_CURRENT_STATE.md`](docs/NEXTGEN_JV_CURRENT_STATE.md) — exact current research state, refs, unknowns, provisional workflow and near-term roadmap.
3. [`evidence/v0/V0_OWNER_CLOSURE_2026-09-03.md`](evidence/v0/V0_OWNER_CLOSURE_2026-09-03.md) — V0 technical→Owner closure, confounds, deconfounding and scoped PASS.
4. [`evidence/e1/E1_CLOSURE_2026-08-31.md`](evidence/e1/E1_CLOSURE_2026-08-31.md) — E1 final disposition and limits.

Open older contracts, implementation designs and receipts only when a question actually requires their detailed provenance.

## Exact preserved research refs

### E1

- frozen historical control: `55b62da06632e9325c9f6e1cbfb4e9acb4ba6bde`
- final F1 specimen: `experiment/e1-final-f1@b9426adfcecb6f8340ffe21ff94fbd38c4c439ef`

### V0

- technical specimen: `work/front-steering-v0@673dd584d5783b59e177c4ed48c9a64f83a72e49`
- first Owner rehearsal checkpoint: `work/front-steering-owner-rehearsal@184c2ed9fb71632afa30f0d60032b8e2b923aa1e`
- final deconfounded Owner specimen: `work/front-steering-v0-deconfound@69d8a8ee91117d4ce44c7dd14657418241844b2e`

Preserve these branches as inspectable evidence. Do not merge their implementation merely to make `main` contain the newest experiment.

## Current frontier

The next implementation has **not** been selected yet.

A leading candidate is a bounded direct steering-linkage construction experiment: replace preset-only A/B authoring with a meaningful spatial edit, then carry the authored geometry through physical PLAY/DRIVE and back to BUILD. This is attractive because it could connect E1's construction-loop learning with V0's demonstrated driving consequence.

It remains a candidate because important questions are still open:

- would the edit be genuine spatial construction or a scalar slider disguised in 3D?
- when connected geometry changes, what adapts automatically and what reflects explicit Owner intent/locks?
- are V0 primitives sufficiently readable once the research question becomes construction quality rather than driving consequence?
- is steering the highest-information next representative problem compared with other candidates?

Select the next problem on information gain, representativeness, likely confounds, cost and prototype gravity before authorizing implementation.

## Hierarchy of truth

1. Current Owner judgement governs desired experience, feel, product value and intent.
2. Live source/runtime and reproducible evidence govern technical state.
3. Current scoped closure/state documents govern what has actually been learned.
4. Historical contracts/receipts govern only their own bounded experiments.
5. Donor code, assets, old docs and previous recommendations are evidence/candidates, not automatic authority.

A PASS must remain scoped to the evidence that earned it.

## Prototype-gravity boundaries

Do not silently inherit experimental apparatus into the product:

- E1's PointRef/AxisRef, relations, Connect/FIT grammar, evaluator and UI are E1-local.
- V0's spherical contacts, no-suspension carrier, A/B enum, oracle, HUD, chase camera and trail implementation are V0-local.
- Three.js, the current Box3D integration form and current Web packaging are substrates used by experiments, not final choices.
- existing Native/JV-Web/Blockbench/glTF material is donor capital, not a reference ontology or final component model.
- a successful one-parameter construction experiment will not establish a general builder architecture.

The project should retain knowledge while remaining willing to discard code.

## Working practice

Active implementation belongs on a named working/experimental branch, not directly on `main`.

At coherent boundaries use:

`checkpoint → validate → commit → push`

A checkpoint is reproducible state, not acceptance.

Choose the execution surface that best fits the task. Browser ChatGPT may perform research, GitHub work, synthesis and orchestration directly; local Codex/Work is valuable when local repo/filesystem/runtime/browser/desktop access materially improves execution or evidence. Do not route work through the Owner when an available agent/tool can safely perform it.

When multiple writers or surfaces are involved, synchronize exact branch/SHA before further writes. Do not force-push active research checkpoints.

## Archived default-branch runtime

The source currently present on canonical `main` is archived E1 apparatus. Running it does **not** mean E1 is the current product direction, and the final V0 carrier is intentionally preserved on its experimental branch rather than merged into the default source tree.

Use the exact research refs above when reproducing an experiment.
