# Rep2 C1 causal damper correspondence — closure receipt

Date: 2026-09-05

Status: **CLOSED — BOUNDED TECHNICAL PASS**

Owner checkpoint: **NOT RUN**

Product / vehicle / architecture acceptance: **NOT CLAIMED**

## 1. Verdict

C1 passes its bounded research question.

The exact real donor is driven on the normal runtime path only from the live
world-space eyes of one native Box3D distance-spring relation. An independent
observer re-reads the donor's actual Three.js scene nodes and finds zero
correspondence error in the accepted normal states. A deliberately stale visual
eye produces a measured mismatch and the apparatus then recovers to the current
physical authority.

This closes the experiment. It does not promote this apparatus as product
architecture and it does not authorize vehicle-carrier work on this branch.

## 2. Exact provenance

- working branch: `codex/nextgen-jv-live-frontier`
- experimental base: `experiment/rep2-c1-causal-damper-correspondence@751a08125fb3138bacef4b1f4c06d844202e53b1`
- compile-only repair: `c0c04d795ccfb1778ac15045ea956c2c9c505b65`
- accepted implementation: `8c7cb1515577f0c885e576266ad10997e69b26e7`
- original C1 contract: `005bc82aeb75167ca153b3d704585af4ef022049`
- canonical project baseline, not implementation parent: `origin/main@ad75ca9ea7436548f901bf6c11e69cd5e465379e`
- accepted C0c native-spring specimen: `2da7ff61219e20afd49d2be7ac7520645625a186`
- C0c branch closure: `ca69ccabd6a9d2df6ec1874c46a38d0b1f0d3230`

The general project docs inherited by this experimental line predate the Rep2
closure and are not canonical current truth. They were intentionally not
rewritten here.

## 3. Exact donor

- repository: `Jozzpoly/Box3d_FunProject`
- commit: `241fe10a9056836332c21d9614471d32d749ce3d`
- source path: `assets/source/Asset_Dumper.gltf`
- local runtime path: `public/assets/rep2/Asset_Dumper.gltf`
- Git blob: `dcdaf197bf48ef8894af4de27682d55dd0b1343d`
- size: `32240 bytes`
- authored nodes: `Part_Upper`, `Part_Stretch`, `Part_Lower`
- real donor structure: one `SkinnedMesh`, rigid one-hot skinning, 240 vertices

The donor's authored node origins are fixed asset-local visual bind references.
They are not accepted mechanical eyes. Historical M6 socket, rig, and runtime
authority are neither imported nor required.

## 4. Single-authority chain

One immutable experiment authority record owns:

- relation ID;
- exact Box3D body identities;
- body-local eye A and eye B;
- authored component `k`, `c`, and `L0`.

The native Box3D distance spring is configured from that record. The evidence
then reads back from the live joint its bodies, local frames, spring-enabled
state, rest length, Hertz, and damping ratio. Current world eyes are read from
the live bodies. Only those world eyes are passed to the donor adapter on the
authority page.

The observer does not trust adapter return values as visible truth: it reads the
transformed `Part_Upper` and `Part_Lower` references back from the actual Three.js
scene graph and compares them with the physical eyes.

The old arbitrary-endpoint C1.1 API is isolated to
`?c1=1&c1Fixture=adapter`. That page identifies itself as
`adapter-validation`, exposes no authority gate, and makes no mechanical claim.
On the accepted `?c1=1` authority page the API is `undefined`.

## 5. Bounded physical substrate

- component: `k=900 N/m`, `c=18 N*s/m`, `L0=0.5 m`
- time step: `1/60 s`
- substeps: `4`
- arm mass: `8 kg`
- arm length: `0.7 m`
- initial arm angle: `0.08 rad`
- baseline attachment radius: `0.35 m`
- geometry mutant attachment radius: `0.175 m`
- dynamic observation: `30` steps
- mapping policy: `axial-once-at-initial-state`

The axial effective-mass mapping is pinned by an independent source-test oracle.
It is deliberately not advertised as a live remapping policy for large travel.

Observed initial mapping:

| Geometry | Axial mass | Hertz | Damping ratio |
| --- | ---: | ---: | ---: |
| baseline | `8` | `1.68809309279457` | `0.106066017177982` |
| half-radius | `4.583635527065` | `2.23016167318105` | `0.140125190575662` |

## 6. Browser authority gate

Pre-verdict acceptance thresholds:

- normal correspondence: `<= 0.00001 m`
- physical eye motion per specimen: `>= 0.02 m`
- geometry-response separation: `>= 0.005 rad`
- deliberate stale-eye mismatch: `>= 0.01 m`

Observed values:

| Observation | Value |
| --- | ---: |
| maximum normal correspondence error | `0 m` |
| maximum physical-vs-native joint length error | `0.0000000789617957686062 m` |
| baseline physical eye motion | `0.0323160521063434 m` |
| half-radius physical eye motion | `0.0213812386866045 m` |
| baseline hinge response | `-0.0923716649413109 rad` |
| half-radius hinge response | `-0.122341830283403 rad` |
| hinge-response separation | `0.0299701653420925 rad` |
| stale-eye scene-graph mismatch | `0.0323160521063434 m` |
| baseline moving native axial force magnitude | `0.838815213309398 N` |
| half-radius moving native axial force magnitude | `7.54343118223607 N` |

Additional accepted invariants:

- native joint configuration readback matches the authority and derived mapping;
- both geometry specimens keep identical authored `k/c/L0`;
- body identities stay stable within each specimen;
- the geometry mutation changes both local eyes and real hinge response;
- the stale-eye detector fires;
- recovery returns to the same current physical snapshot;
- the authority page has no arbitrary-endpoint escape hatch.

The negative control is a browser scene-graph sensitivity check. It is applied
and measured synchronously, then recovered before the accepted screenshot; it is
not claimed as a screenshot of a GPU-presented bad frame.

## 7. Validation evidence

### Local preflight on accepted implementation

- donor probe: PASS, exact local blob and size
- source tests: `68/68` PASS
- production TypeScript/Vite build: PASS
- hermetic Playwright Chromium: `1/1` PASS, exit `0`
- console errors asserted: `0`
- page errors asserted: `0`
- server reuse: disabled; occupied port fails closed
- Browser plugin: unavailable; repository Playwright was used
- recovered-authority screenshot: visually inspected, non-blank real donor and
  `GATE: PASS` panel visible
- local JSON evidence SHA-256:
  `6d5a3c4c395aec2f6b94ba049ab2631f745a1aaea218d5fcba9ab63be71ba1aa`
- local screenshot SHA-256:
  `a6a74e9aab6dc310402313f28d543fdc5dff28837ff71e605a740220a732bf34`

### GitHub Actions on accepted implementation

- run: `33953935724`
- run URL: `https://github.com/Jozzpoly/Jozzue_Vehicles_Sandbox/actions/runs/33953935724`
- exact head: `8c7cb1515577f0c885e576266ad10997e69b26e7`
- source-check job `101273692613`: SUCCESS
- rendered-correspondence job `101273692687`: SUCCESS
- every recorded step in both jobs: SUCCESS
- source artifact `9965729601`, `rep2-c1-source-evidence`:
  `sha256:bcc2957db6e0c122fdaf7752b247ba39055e75aa7a3b7f67ab623a46aa75e5cd`
- rendered artifact `9965735413`, `rep2-c1-rendered-evidence`:
  `sha256:43192de9c2e27c9f31a7062415f20317d6152f9004aa91784f3bd1abfde28e4f`

The current CLI token could read run, job, step, artifact IDs, and artifact
digests, but downloading artifact archives returned HTTP 401 and fetching full
job logs returned HTTP 403. Archive-content reinspection from CI is therefore
**NOT RUN**. This does not replace or weaken the recorded successful steps, but
it is a provenance-access limitation worth retaining.

## 8. Material failure and recovery history

1. Remote frontier `751a081...` had rendered Chromium `1/1` PASS but a red
   workflow because two compile-only assignments attempted to set Three.js
   bounds to `null`. `c0c04d...` removed those assignments and restored the
   source gate without changing rendered semantics.
2. The original runtime fetched the donor remotely. The exact donor is now a
   repository-local asset verified before both source and browser execution.
3. Adversarial review found that the authority page still exported the C1.1
   arbitrary-endpoint hook. It could create a parallel visible truth while a
   stale PASS remained displayed. The hook was removed from the authority page
   and isolated to the non-mechanical adapter fixture before acceptance.
4. Adversarial review found that native Hertz, damping ratio, frames, bodies,
   and spring state were initially self-reported rather than read back. The gate
   now consumes live joint getters and requires their correspondence.
5. The first hardened source run failed on exact JS-vs-WASM float equality for
   `-0.35` versus `-0.349999994...`. Only continuous-vector comparisons were
   changed to an explicit `1e-6` tolerance; discrete IDs remain exact.
6. A sandboxed local Playwright run completed its test but could not terminate
   its own Windows server process. The final hermetic run was repeated with the
   required process permission and returned `1/1`, exit `0`.
7. GitHub Actions emitted a non-blocking warning that v4 actions still target
   deprecated Node.js 20 while the runner forced Node.js 24.

## 9. Explicit non-claims and remaining debt

Not demonstrated:

- Owner readability or Owner acceptance;
- product component schema, builder UX, discoverability, or direct manipulation;
- a symmetric vehicle carrier, handling, contact, or driving feel;
- pure damping with `k=0, c>0`;
- nonlinear spring/damper curves, bump/droop, preload, friction, or ride height;
- large-travel validity or a policy for repeated axial-mass remapping;
- full suspension topology;
- performance or lifecycle behavior at product scale;
- final asset pipeline, renderer, solver, or generic component framework.

The current real-donor adapter, native bench, markers, and evidence UI remain
disposable experimental apparatus.

## 10. Stop and next move

C1 is closed. Do not continue vehicle or carrier implementation on this branch.

The next highest-value move is a separate docs-only canonicalization branch
created from a freshly verified `origin/main`. It should index the Rep2/C0/C1
results and durable one-authority rule without merging or promoting this
experimental code. Only after that truth spine is current should the next
problem be freshly reselected; a minimal carrier is a candidate, not an
automatic stage.
