# Nextgen JV — Creative Freedom State / Authority Addendum

Date: 2026-09-06  
Status: **compact pressure addendum / NOT architecture**

This note extends the creative-freedom foundation audit and red-team without expanding them into a larger framework. It records several additional distinctions that became visible only after comparing Family C with Rep2/Rep3/Rep4 and older real-asset donors.

## 1. Authoring constraint != physical relation != runtime contact

A future JV mechanism may involve three superficially similar but semantically different facts:

1. an **authoring condition** used to construct/resolve geometry, e.g. align these surfaces or keep this datum coincident while editing;
2. an **authored mechanical relation**, e.g. these two semantic interfaces form a revolute joint with one free rotational DOF;
3. a **transient evaluated interaction**, e.g. these two shapes happen to collide and create a solver contact during PLAY.

They must not become one universal `Connection` merely because all can mention two things.

The same warning extends to non-mechanical domains. Electrical, hydraulic, control and power-transmission connections need not share transform semantics with rigid-body joints.

**Protect the distinction; defer the taxonomy.**

## 2. Installed BUILD geometry != component rest state != PLAY state

Rep2/Rep4 already contain a useful physical pressure:

- authored/derived attachment geometry determines a current eye-to-eye distance;
- the damper component separately owns `restLength` plus stiffness/damping;
- physics computes `extension = currentLength - restLength`;
- runtime motion changes `currentLength` without rewriting the component's `restLength`.

This separation is essential even though the current experiments explicitly do **not** claim a finished preload product model.

A future builder must be able to represent mechanisms intentionally assembled away from physical free/rest state:

- preloaded spring/damper;
- belt or chain tension;
- cable tension;
- bump/droop bias;
- torsion preload;
- interference/compliance where intentionally supported.

A convenient authoring system that silently sets every physical neutral/rest value from the installed BUILD pose would destroy mechanically meaningful design freedom.

Pressure model:

```text
AUTHORED INSTALLED CONFIGURATION
        !=
COMPONENT PHYSICAL PARAMETERS / FREE-REST STATE
        !=
TRANSIENT EVALUATED PLAY STATE
```

The exact data ownership is deferred.

## 3. Adaptation and material properties create another authority problem

When adaptive geometry changes, some physical properties may reasonably change with it.

Examples:

- longer/thicker tube changes mass and inertia;
- different tire geometry changes radius/contact representation;
- larger wing changes aerodynamic area/inertia;
- resized shaft may change mass, inertia and perhaps strength limits.

Those values might be:

- derived from material + generated geometry;
- inherited from component definition;
- explicitly overridden by the Owner;
- supplied by a higher-fidelity physical model.

Therefore the future problem is not only “lock geometry”. It is **which authority owns a derived property and why**.

Do not design a universal property-provenance engine now. Preserve the seam so later intent locks/overrides can be meaningful rather than fighting hard-coded adaptation.

## 4. Causal explainability should be a consequence of authority separation

The Project Soul values understanding *why* a mechanism behaves as it does.

If the system can distinguish authored, inherited, inferred, adapted and runtime-evaluated state, future diagnostics can answer useful causal questions such as:

- this tube became longer because endpoint B moved;
- this mass increased because geometry changed while material density remained inherited;
- this damper carries preload because installed length differs from physical rest length;
- this axis is derived from two authored mounts;
- this reference is broken because source revision removed the semantic feature it targeted.

The exact UX is deferred. The architectural pressure is that a future explanation system is impossible if all values collapse into one mutable transform/property blob.

## 5. Source coordinates are not final JV semantic coordinates

Existing donor contracts already contain source-specific correction and role hints. They are useful adoption information, not authored mechanical authority.

A future source path should conceptually allow:

```text
BLOCKBENCH / GLTF SOURCE REVISION
        ↓ exact provenance + source binding
JV SEMANTIC ADOPTION / COMPONENT MEANING
        ↓
AUTHORED INSTANCES / REFERENCES
```

A Blockbench/glTF node basis, node order or source correction should therefore not automatically become the permanent coordinate convention of all authored mechanisms using that asset.

## 6. Real donor audit falsifies name-only source identity

The historical `Box3d_FunProject` asset-contract audit reports duplicate source node names for multiple real donor assets and explicitly states that name-only binding is unsafe.

Examples include duplicate root names in the damper, cardan shaft, wheel and one-sided suspension-corner sources. The contracts therefore use stronger contextual binding hints such as semantic path/role plus node-index information.

This strengthens a narrow invariant:

> source node names are useful semantic hints, not durable authored JV identity.

Likewise node indices can help bind one exact source revision but should not become long-lived authored references across arbitrary reimports.

## 7. JV-native generated geometry should emit semantic features, not only triangles

Persistent naming is hardest for arbitrary unstructured imported geometry.

JV-native adaptive/procedural components have an opportunity to make the problem easier by producing semantic feature information alongside geometry.

Example pressure for a generated frame tube:

- endpoint/start reference;
- endpoint/end reference;
- centerline/path parameterization;
- meaningful side/surface regions where applicable;
- generated attachment features created by the component.

A downstream authored reference could then target semantic/generated coordinates rather than raw triangle IDs.

This is a hypothesis to test, not a proposed feature-map schema.

## 8. Missing capability must not imply destructive data loss

Extreme long-term extensibility creates a loading/recovery pressure.

If a future project contains an authored thing whose specialized evaluator/component capability is temporarily unavailable, the safest long-term behavior is likely closer to:

`preserve opaque authored identity + data + references → diagnose unsupported capability`

than:

`drop unknown thing → rewrite project without it`.

This does **not** authorize a plugin ABI or unknown-field serialization design today. It merely protects future recoverability as a requirement.

## 9. Derived dependency graphs cannot assume a simple tree or DAG

Mechanical assemblies naturally contain loops and constraints. Future cross-domain networks can contain additional cycles.

Any eventual adaptive/resolution system therefore must not rely on a hidden assumption that authored dependencies can always be evaluated once in parent-to-child order.

Possible future outcomes include:

- deterministic derivation where acyclic;
- simultaneous/iterative solving where warranted;
- explicit underconstraint/overconstraint/conflict diagnostics;
- preserving unresolved intent instead of silently selecting an arbitrary evaluation order.

No solver architecture is selected here.

## 10. Real non-damper donor capital already exists for falsification

The old donor snapshot contains materially richer real assets than `Asset_Dumper`, including:

- one-sided steering/suspension assemblies;
- wheel mount/suspension-corner assets with many semantic socket/axis hints;
- cardan shaft;
- wheel assets;
- body/chassis material.

The one-sided suspension-corner contract alone exposes several different mount endpoints plus a suspension-travel axis and multiple visual parts. This is enough to falsify a large amount of damper-centric thinking before inventing new placeholder components.

Therefore a later **component-diversity test should prefer a real multi-interface donor** rather than another synthetic primitive.

It should still remain bounded and must not inherit the old donor contract as architecture authority.

## 11. Updated minimal protection spine

After this addendum, the smallest long-term protection spine remains intentionally small:

1. stable committed authored identity where persistence matters;
2. authored intent distinct from preview, derived realization and transient evaluated state;
3. trustworthy durable references: resolve correctly or remain explicitly broken/ambiguous rather than plausibly wrong;
4. explicit enough authority/provenance to distinguish Owner-authored values from inherited/adapted/evaluated values;
5. reversible/versioned authored transitions;
6. source/revision binding separate from JV-authored identity and semantics;
7. replaceable representations/evaluators/domain capabilities consume authored meaning rather than own it;
8. no one universal component/connection/tree/solver/gizmo taxonomy is promoted without materially different consumers.

Everything beyond this remains under experimental pressure.
