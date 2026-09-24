# Explicit producer/view payload contracts

Status: implemented and integrated; the phase-specific validation below is historical.
The subsequent [label-variant implementation](label-variant-matching.md) and
[integration follow-ups](label-variant-followups.md) complete domain handover, canonical rollout,
numeric repairs, and full production VQA. This producer-contract phase is not a general numeric solver.

## Decisions

- Seven broad producer modules become 19 precise producer leaves. The catalog has 105 generators, 188 views, and 211 type-compatible pairs.
- Fifteen specialized views use named mathematical contracts instead of family-selecting requirements. The tens-bundle view also drops its negative hundreds selector. Requirements for learner-task intent remain.
- Equation formalization replaces its payload selector `Area.Equation` with the target requirement `Ability.Formalization`. The declaration guarantees equation data; the requirement prevents ordinary reading/solving targets from selecting equation writing.
- The ordinary word-problem leaf accepts one-step pairs and ordinary two-step relations. Its shared renderer accepts the wider union used by the specialized leaves. The general strategy view accepts all eight named strategy contracts. The small counting view accepts one- and ten-step offsets, with the ten-step producer excluding upper bounds below twenty.
- Mass retains gram/kilogram parameterization inside a stable payload family. Factor pairs/multiple tests and the six other arithmetic strategies retain unions because their consumers support every member. Neither a new generator per label nor negative-label inversion is needed.
- Matching code, target labels, ontology package, and global required/rejected-label semantics are unchanged. Eligibility loads declarations only; there is no payload inspection, sample probe, or generator-specific compatibility callback.

The adoption follows SPEC-11, IMPL-G6, IMPL-V8, and IMPL-G8. Canonical quantities, calculated evidence, and semantic context retain their existing fields. No learner instruction, unknown placement, or rendering decision moves into a generator. Shared helpers preserve the mathematical construction; fixed families become invariant labels rather than configurable payload dispatch. Counting direction now resolves to neutral `inc`/`dec` values before numerical generation.

## Consumer adoption matrix

This matrix was inventoried before consumer edits and updated after adoption. Every production consumer of the seven original producers is included. Existing generator mathematical tests, leaf schema tests, and `payload-family-contracts.test.ts` verify the corresponding rows; canonical generation covers their real CCSS targets.

| Consumer | Adopted producer(s) | CCSS target families | Accepted contract | Projection disposition |
|---|---|---|---|---|
| counting-hundred-more-less | counting-hundred-offset | 2.NBT.B.8-place-value-offsets | CountingHundredOffsetProblem | Existing fields and projection retained; declaration narrowed where specialized |
| counting-inc-dec | counting-inc-dec | K.CC.A.2-count-from-number, K.CC.B.4c-one-larger | CountingSmallOffsetProblem | Existing fields and projection retained; declaration narrowed where specialized |
| counting-ten-more-less | counting-ten-offset | 1.NBT.C.5-ten-more-less, 2.NBT.B.8-place-value-offsets | CountingTenOffsetProblem | Existing fields and projection retained; declaration narrowed where specialized |
| measure-liquid-volume | measurement-liquid-volume | 3.MD.A.2-measure-liquid-volume | LiquidVolumeMeasurementProblem | Existing fields and projection retained; declaration narrowed where specialized |
| measure-liquid-volume-estimate | measurement-liquid-volume-estimation | 3.MD.A.2-measure-liquid-volume, 3.MD.A.2-estimate-liquid-volume | LiquidVolumeEstimateProblem | Existing fields and projection retained; declaration narrowed where specialized |
| measure-mass | measurement-mass | 3.MD.A.2-measure-mass | MassMeasurementProblem | Existing fields and projection retained; declaration narrowed where specialized |
| measure-mass-estimate | measurement-mass-estimation | 3.MD.A.2-measure-mass, 3.MD.A.2-estimate-mass | MassEstimateProblem | Existing fields and projection retained; declaration narrowed where specialized |
| numbers-composite-classification | numbers-composite-classification | 4.OA.B.4-composite-classification | CompositeClassificationProblem | Existing fields and projection retained; declaration narrowed where specialized |
| numbers-factors-multiples | factor-multiple-relations | 4.OA.B.4-factor-pairs, 4.OA.B.4-multiple-test | FactorPairsOrMultipleTestProblem | Existing fields and projection retained; declaration narrowed where specialized |
| numbers-prime-classification | numbers-prime-classification | 4.OA.B.4-prime-classification | PrimeClassificationProblem | Existing fields and projection retained; declaration narrowed where specialized |
| operations-add-subtract-strategy-understanding | integer-add-subtract-strategies, integer-addition-counting-on | 1.OA.B.4-unknown-addend-strategy, 1.OA.C.6-addition-counting-on, 1.OA.C.6-addition-make-ten, 1.OA.C.6-subtraction-make-ten, 1.OA.C.6-addition-near-doubles, 3.NBT.A.2-flexible-strategies | IntegerAddSubtractStrategyProblem | Existing fields and projection retained; declaration narrowed where specialized |
| operations-counting-back-operation-derivation | integer-subtraction-counting-back | 1.OA.C.5-counting-operation-relationship | SubtractionCountingBackProblem | Existing fields and projection retained; declaration narrowed where specialized |
| operations-counting-on-operation-derivation | integer-addition-counting-on | 1.OA.C.5-counting-operation-relationship | AdditionCountingOnProblem | Existing fields and projection retained; declaration narrowed where specialized |
| operations-word-problem-equation-formalization | arithmetic-word-problems-letter-equation | 4.OA.A.3-multistep-letter-equations | ArithmeticWordProblemLetterEquation | Existing fields and projection retained; declaration narrowed where specialized |
| operations-word-problem-reasoning | arithmetic-word-problems-rounding | 3.OA.D.8-answer-reasonableness, 4.OA.A.3-answer-reasonableness | ArithmeticWordProblemRounding | Existing fields and projection retained; declaration narrowed where specialized |
| operations-word-problem-remainder-interpretation | arithmetic-word-problems-interpreted-remainder | 4.OA.A.3-interpret-remainders | ArithmeticWordProblemInterpretedRemainder | Existing fields and projection retained; declaration narrowed where specialized |
| operations-word-problem-within-100 | arithmetic-word-problems-two-step | 2.OA.A.1-two-step-word-problems, 3.OA.D.8-two-step-word-problems | ArithmeticWordProblemWithin100 | Existing fields and projection retained; declaration narrowed where specialized |
| place-value-hundreds-bundles | place-value-hundreds-bundles | 2.NBT.A.1a-ten-tens-make-hundred, 2.NBT.A.1b-hundreds | PlaceValueHundredsBundlesProblem | Existing fields and projection retained; declaration narrowed where specialized |
| place-value-tens-bundles | place-value-bundles | 1.NBT.B.2a-ten-bundle, 1.NBT.B.2c-multiples-of-ten | PlaceValueTensBundlesProblem | Existing fields and projection retained; declaration narrowed where specialized |

## Verification

- TypeScript and `npm run check -- --spec=ccss,test` pass.
- `npm run test:coverage`: 511 test files, 2,756 tests pass; every generator meets the required coverage thresholds. Extracted evidence helpers additionally have 96.8% statement, 93.28% branch, and 100% function coverage.
- Declaration-only regressions reject former broad output unions, incompatible siblings, and incompatible label conjunctions; direct and indexed matching agree on both complete standards catalogs.
- CCSS retains all 830 target/generator/view realizations modulo the intended producer registration moves. No target/view combination is added or lost.
- The test catalog moves from 691 to 692 realizations with the same target/view combinations. The extra choice is the ten-step producer for the existing counting view and within-twenty target. Its former broad producer could already choose that step. Within-ten targets cannot select the ten-step producer.

- Canonical Docker generation passes for all 19 producer leaves against both test and CCSS catalogs (38 scoped runs). Subsequent `--affected` regeneration passes for both catalogs after the word-problem fixes.
- CCSS VQA passes all 180 prepared arithmetic, 28 counting, and eight place-value samples. Measurement passes 17 of 18: the unchanged mass-estimation renderer displays the target apple as text rather than a picture, contrary to its existing identity checklist. This pre-existing visual defect remains separate from the type-contract migration. These are prepared-scope results, not a new full-catalog visual audit.
- VQA exposed two inherited declaration/construction defects that are fixed: remainder evidence no longer claims `MultiLevelComposition`, and rounding data/proposed answers honor `NumbersWithoutZero`. Regression tests cover positive rounding boundaries. Payload fields and layout are retained.
- Cache churn in the isolated validation checkout shows 1,935 stable identities, 102 additions from new registrations, and nine changed counting identities (three image changes and six attempt shifts); no seed-scheme changes. Counting changes follow its fixed one-step construction and revised resolved configuration. Old producer cache entries were retained during this scoped audit; zero removals does not mean those registrations remain active.

New producer IDs intentionally change structural sample seeds and validation-split assignment. Validation artifacts remain in the isolated checkout rather than being mixed into the source patch. Dataset/cache updates must be regenerated through the existing dependency planner; old registrations must not be relabeled as new samples.

## Domain follow-up — completed for label compatibility

Family compatibility is explicit for these consumers. The subsequent label-variant implementation
resolves the measurement-line-plot number-kind/subdivision issue, label-expressible conjunctions,
and omitted-label alternatives using declared types, mappings, labels, and domain metadata.
Matching preserves the admissible space through generation without inspecting payloads.
General numeric satisfiability still requires mathematical implementation and tests; the two
identified arithmetic-estimation failures are repaired in the integration follow-ups. Successful
samples and VQA do not prove arbitrary-domain totality.
