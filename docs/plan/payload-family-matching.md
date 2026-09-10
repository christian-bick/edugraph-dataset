# Payload-family matching and regression follow-ups

## Agreed direction

Use mathematical payload families and explicit view input types as the primary generator/view
compatibility contract. Use positive applicability filters for restrictions within an accepted
family, such as numeric range. Ontology capability coverage remains necessary: type compatibility
alone does not establish a target's claims.

The unit-relation, measurement-extrema, shape-edge, fraction-partition, and angle-family splits are
implemented and canonically validated. This plan retains the unfinished framework and consumer
work. Current normative rules remain in [spec-view.md](../spec-view.md),
[implementation-generator.md](../implementation-generator.md), and
[implementation-view.md](../implementation-view.md); this plan does not silently change them.

## Open contract findings

- [ ] **Union-member matching.** [matching.ts](../../src/lib/matching.ts) permits a generator
  returning `A | B` to feed a view accepting only `A` when the view has any `requiredLabels`.
  Their presence does not prove that the generated payload is `A`. Inventory these pairs and remove
  that exception after adopting their contracts.
- [ ] **Shape construction.** `shape-build-shape` retains attribute/count, rotation, and
  excluded-subcategory branches with task-shaped payloads. Its construction and drawing consumers
  are not total over the declared union. Review the mathematical responsibilities and every
  consuming projection together; do not repair routing by changing truthful targets. Consuming
  schema-resolved ontology enum values is not itself raw-label parsing.
- [ ] **Fraction equivalence.** `fraction-equivalence` returns proper-fraction scaling,
  whole-number equivalence, or tenths-to-hundredths relations. Several views declare the whole
  union while accepting only a subset. A synthetic target with FractionEquivalence, ProperFractions,
  EqualShares, Equal, Formalization, and ArabicNumerals matches `fractions-whole-equivalence`, which
  rejects the proper-fraction payload. Current active CCSS/test targets avoid that combination.
  Decide whether a uniform mathematical model is truthful or precise generator entry points are
  needed, then align view input types. No blacklist or artificial family flag should conceal it.
- [ ] **Positive micro-filters.** `measurement-line-plot` and its `usesUnitSteps` parameter provide
  a concrete starting case: an explicit whole-step requirement must agree with generated
  subdivisions. Decide whether filters inspect target constraints or resolved generator guarantees,
  and how broad targets, fallbacks, alternatives, and bounded domains are handled. A flat
  `requiredLabels` conjunction is not proof of the complete generated domain.
- [ ] **Classification evidence.** Review the fraction-equivalence classification number-line
  question's literal "same point" caption in
  [fraction-line-view.tsx](../../src/visuals/views/numbers/fraction-line-view.tsx). It may disclose
  the requested verdict (`IMPL-V5`). Replay representative question/solution artifacts before
  deciding on a change; the completed structural cleanup does not settle this independent issue.

## Adoption order and boundaries

1. Inventory generator unions, member-only consumers, and family-selecting requirements/exclusions
   using the parsed type graph and compatible-pair index. Record concrete failures and affected
   targets; separate within-family limits from explicit target-participation policies.
2. Establish precise mathematical output contracts. A view may accept a small named union only
   when it supports every member. Share pure helpers and rendering components; do not manufacture
   unrelated optional fields merely to preserve one generator registration.
3. Review the positive micro-filter API with concrete examples before changing required/rejected
   semantics globally. Preserve dimension neutrality and avoid duplicate generator parameterization
   in views. An allowlist of every generator label on every view is not the objective.
4. Adopt consumers, then tighten matching and validation. Reject missing/unrecognized mappings and
   remove the presence-only union exception. Do not add pair-conditional capabilities or
   configuration-dependent output routing to keep a combined generator.
5. Verify direct and indexed matching agree. Test that unrelated new payload members cannot become
   eligible for narrower views, while valid capability extensions within a family remain reusable.
   Update the affected normative rules and skill references only when replacement behavior exists.
6. Rebuild the graph after matching-machinery changes, compare complete match sets, and canonically
   regenerate and validate affected artifacts. Keep indexed work and dependency-delta execution.

Every output reachable for an admitted target must satisfy the view's accepted payload contract.
Neither target-only label filters nor a passing sample prove that property for all configurations.

## Optional synthetic regression experiment

Compare declaration-derived regression cases with the hand-authored `test` spec:

- [ ] Derive valid schema choices and explicit fallback sets, paired only with compatible views
  whose applicability admits them. Avoid a blind label power set or unrestricted Cartesian product.
- [ ] Check resolution, deterministic generation, rendering in both modes, task identities, and
  fingerprints. Keep work proportional to declared choices, compatible-pair edges, and emitted cases.
- [ ] Compare detected failures and coverage with existing test targets. Preserve unique authored
  edge cases, bug reproductions, and human-readable fixtures. Replace generic reachability targets
  only if the experiment establishes an equivalent or stronger check.

This could strengthen regression testing; it does not replace live VQA of real standard artifacts
or establish standards coverage. No synthetic probing framework is implemented by this plan.
