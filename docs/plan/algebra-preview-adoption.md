# Algebra preview adoption

## Scope and migration

The dataset dependency moves from `0.30.0-pre.8.275616e7115c` to the published
[`0.30.0-pre.10.10a40360f726` preview](https://github.com/christian-bick/edugraph-ontology/releases/tag/preview-0.30.0-pre.10.10a40360f726).
The exact release asset is pinned in `package.json` and the lockfile. Its 4,766 authored
assertions and 888 descriptors match the committed ontology release source. The sibling
ontology working tree is not the dependency source and is not changed by this adoption.

The published-to-published audit finds two removed identifiers, 18 directly changed existing
descriptors, three additional existing descriptors with derived structural changes, and
101 additions: 99 Areas and two Scopes. Existing Ability, Scope, and schema assertions are
unchanged. Intermediate draft changes discussed during ontology refinement are not treated
as migrations unless they differ between these published versions.

| Previous label | Adopted expression | Meaning in current content |
| --- | --- | --- |
| `NumericalExpression` | `ArithmeticExpression` | Expressions composed of numbers and arithmetic operations, with grouping as needed. |
| `GroupedExpression` | `ArithmeticExpression` + `GroupingSymbol` + `OrderOfOperations` | Arithmetic expressions whose grouping and operator binding are explicitly interpreted, constructed, or used. |

`ArithmeticExpression` and `AlgebraicExpression` are sibling specializations of
`MathematicalExpression`. Current arithmetic tasks contain no variables or non-arithmetic
function applications, so their mathematics already satisfies the adopted label. The
`GroupingSymbol` primitive describes the role of the symbols; the separate expression
and precedence labels retain the rest of the competency claim (`TSPEC-6`, `TSPEC-13`).

The migration updates the four Grade 5 target builders, generator capability and grouping
resolver, grouping-view requirements, tests, and affected wording. The resolver still
requires the joint `GroupingSymbol`/`OrderOfOperations` selection. Existing generator and
view identifiers, payloads, learner actions, and renderers remain stable.

## Matching impact

Production matching remains **822 targets before and after**. Four Grade 5 target IDs change
because their label sets change (`TSPEC-5`); the same four generator/view paths remain. No
other generation-plan or target-disposition changes, lost matches, or new curriculum
competencies are introduced by the label migration.

All four paths use `arithmetic-numerical-expressions`:

| Competency | Retained view |
| --- | --- |
| `5.OA.A.1-use-grouping` | `operations-grouping-write` |
| `5.OA.A.1-evaluate-grouped-expressions` | `operations-grouping-evaluate` |
| `5.OA.A.2-write-numerical-expression` | `operations-numerical-expression-write` |
| `5.OA.A.2-interpret-numerical-expression` | `operations-numerical-expression-interpretation` |

Changed target IDs retire their old sample identities and produce new ones. This expected
identity change can also change seeds and validation allocation; it does not remove a
competency. Renaming stable module IDs for wording parity would introduce unrelated churn
and is not part of this adoption.

## Review of retained entities

| Existing descriptors | Published semantic change | Adoption requirement |
| --- | --- | --- |
| `Equation` | Definition now explicitly concerns the form and meaning of equality assertions; examples added. | Existing tasks retain their labels. Composite-volume questions now explicitly request equations for each part and the total, rather than allowing bare numerical answers. Printing an incidental equals sign alone would not establish this claim. |
| `OrderOfOperations` | Definition describes operator binding, precedence, and grouping at equal precedence; examples added. | Existing grouping tasks already require these conventions. Retain the label in their conjunction. Its final `partOf ArithmeticLaws` relation is unchanged. |
| `AssociativeLaw`, `CommutativeLaw`, `DistributiveLaw` | Examples added; definitions and matching ancestry unchanged. | Current numerical-law tasks remain valid. The symbolic distributive example does not require variables in every task. |
| `MathematicalExpression`, `MathematicalStatement`, `FormalMathematics` | Definitions emphasize syntax, form, and meaning; expressions include single value-denoting symbols and may contain relations below their outermost level. | No direct content declarations need migration. Arithmetic expressions and equations keep their respective specialization parents. |
| `Inequality`, `RatioNotation` | Definitions describe the concept without prescribing an Ability; examples clarify strictness, non-equality, and ratio order. | No current content use found. |
| `IntegerNotation`, `SignNotation` | Integer notation excludes a decimal separator or fraction bar; signs indicate polarity independently of magnitude, including signed zero. | No current content use found. Integer-valued decimals/fractions do not become integer notation. |
| `PercentageNotation` | Example added only. | No current content use found. |
| `Sine`, `Cosine`, `Tangent` | Definitions extend to circular relationships and domains; specialize new `TrigonometricFunction`, thereby inheriting `NumericFunction`. | No current content use found; future trigonometric content gains these matching ancestors. |
| `Algebra` | Definition includes symbolic structure, constraints, functions, and transformations, with an explicit analysis boundary. | No current content use found. New constituent families also change eligibility, as recorded below. |
| `ArithmeticEvaluation` | Progression reference changes from `NumericalExpression` to `ArithmeticExpression`. | No current content use found. Progression does not provide capability substitution. |

The retained changed labels actually used in current declarations are `Equation`,
`OrderOfOperations`, and the three arithmetic laws. Their target, generator, and view
contracts continue to expose the relevant concept (`SPEC-3`, `SPEC-G3`, `TSPEC-13`,
`CHK-V6`). The review found **no further compulsory relabeling**. Visual validation and
the subsequent prompt clarification are recorded below.

Existing direct `partOf` edges are unchanged between the two releases. The trigonometric
specializations are the only new specialization edges on retained descriptors. Thus no
retained used label gains or loses capability ancestry, and the arithmetic laws do not
newly imply `AlgebraicEquivalence`.

| Existing descriptor | Derived structural change | Content implication |
| --- | --- | --- |
| `Algebra`, `Analysis` | New constituent families make both organizational and ineligible as content labels. | Neither Area is used in current content. Future targets must select eligible concepts (`SPEC-3`). |
| `FormalMathematics` | Adds constituent `ExpressionStructure`. | Remains organizational; its constituent-child identity changes for dependent graph records. |
| `ArithmeticLaws` | Adds constituent `ExponentLaws`. | Remains organizational; existing law children remain eligible. |
| `ExpressionComplexity` | Adds constituent `VariableCardinality`. | Remains organizational; existing operand/value scopes keep their meaning and matching ancestry. |

The newly available solving, satisfaction, expression, and function concepts are not added
automatically to elementary targets. Each would need independently observable competency
evidence. The agreed dependence family remains as published; this adoption does not reopen
its design or add dependence labels to existing content.

## Generation planning and artifact refresh

The audit exposed a generation-planner migration defect: existing rows carrying removed
labels requested their definitions from the new ontology before they could be replaced.
The planner now retains those rows' image, shard, and count records, adds explicit
missing-label dependencies to their images, and withholds current VQA keys. The resulting
dependency changes require their owning pairs to regenerate, even when old image digests
are reused. The strict VQA definition resolver still rejects unknown labels. No metadata
is relabeled in place and no replacement definition is invented.

The repaired production planner succeeded against all **2,288 persisted samples** across
260 generator/view pairs and 369 shards. That pre-generation baseline recorded preview
`.8`; the read-only comparison used current source, preview `.10`, and the canonical
renderer identity.

| Required or reusable work | Count |
| --- | ---: |
| Generator/view pairs requiring regeneration | 127 |
| Baseline samples in those pairs | 1,322 |
| Reusable pairs outside the render closure | 133 |
| Reusable baseline samples outside that closure | 966 |
| Existing samples whose VQA keys already change | 350 |
| Old expression samples with removed labels and no current VQA key | 8 |
| Additional pairs requiring only validation | 0 |

The render closure is broader than the four expression pairs because the constituent-child
identities of `ArithmeticLaws`, `ExpressionComplexity`, and `FormalMathematics` changed.
These ancestors participate in existing target and capability dependencies. Definition-only
changes remain separate: involvement statements include examples, so the law comments
also change validation contexts. The 350 changed keys already fall inside the render
closure for independent structural reasons. Final VQA call counts depend on the generated
image bytes and available matching cache records; an affected graph node alone does not
require a fresh judgment. Future sample counts can also change through deduplication and
validation allocation.

After Docker became available on 2026-10-06,
`npm run generate:dataset -- --spec=ccss --rebuild-graph` completed successfully. It selected
the expected 127 pairs and rendered 1,324 images in 263 seconds. Content addressing reused
365 existing shards and wrote five shards, including the newly allocated validation shard.
No graph reset was needed.

| Final generation result | Count |
| --- | ---: |
| Samples | 2,290 (1,916 train; 374 validation) |
| Retained sample identities with identical metadata | 2,280 |
| Retained images unchanged | 2,277 |
| Retained questions with clarified equation instructions | 3 |
| Removed old expression samples | 8 |
| New expression samples | 10 |
| Unselected samples preserved | 966 |
| Original VQA records preserved exactly | 1,894 |
| Refreshed current VQA judgments | 396 |

Only the expression target migrations changed sample identities. The interpretation
target's new hash also allocates it to validation, adding a question and solution pair;
the other three migrated targets remain train-only. Split integrity passes: every matched
tuple has training evidence, no validation content occurs in training, and no configured
task is duplicated within a view. The existing 55 validation-coverage gaps remain unchanged.

Direct visual review of all ten new expression images found correct calculations,
grouping evidence, question/solution withholding, and legible layouts. The first VQA pass
evaluated 360 samples while reusing 1,930 judgments. It produced two rejections under an
outdated vertical-only checklist and one malformed response. All ontology labels on the
two rejected images were defendable.

The `operations-vertical` checklist now describes both its column layout and its
deliberate equivalent-equation property layout. The `operations-properties` checklist
clarifies that one missing value may occupy two boxes when both forms share a result.
These corrections align the observable contract with the existing supported behavior
(`CHK-V6`); they do not relax the mathematical or label requirements. The graph refresh
changed 52 validation keys, reused all 370 shards, and rendered no images. Those 52
judgments and the one malformed-response retry all passed.

One accepted but uncertain `Equation` judgment prompted a further semantic review. Both
composite-volume question layouts allowed bare values or expressions under their former
response instructions. They now ask: **Write equations for Part A, Part B, and the total.**
This makes the existing Equation claim observable (`TSPEC-13`, `IMPL-V11`) without changing
the labels, mathematics, solutions, sample identities, seeds, or attempts. Incremental
generation selected three shared-renderer pairs and rendered eight images; exactly the
three intended question images changed. Their direct visual review and fresh VQA pass.

The final local explorer snapshot contains all 2,290 assets, including the ten replacement
expression images and the three clarified volume questions. Against the original `.8`
snapshot, 362 old shards remain reusable, seven were replaced, and one validation shard
was added. All 966 samples outside the original render closure are untouched.

The final cache contains **2,290 current passing records**, with zero stale, missing,
orphaned, malformed, duplicate, or failing records. Of those, 1,894 original records are
preserved exactly, including their judgments and timestamps; 396 current records have
fresh passing LOW judgments. Earlier failed checklist judgments and the malformed response
are retained in the migration's temporary audit history, not treated as current evidence.

Two refreshed judgments remain uncertain under the existing passing policy. The
`volume-formula-story` question requests a formula and substitution but withholds the
written equality; review found that appropriate for question mode. A vertical-addition
question received `NumbersWithoutZero` uncertainty because its nonzero answer, 100,
contains zero digits; that confuses numeric value with numeral spelling and needs no
content change. The composite-volume Equation uncertainty is resolved by the prompt fix.

## Verification

The package/source comparison, source migration, matching comparison, full repository
checks, TypeScript check, documentation-reference validation, and production build pass.
Coverage verification passes **4,261 tests in 672 files**, with all configured
coverage thresholds met. The planner regression covers short/full label identifiers,
reused image digests, retained image/shard/count records, unchanged sibling reuse,
scope rejection, and byte-for-byte preservation of stored artifacts during planning.
The strict unknown-label VQA test continues to pass. After the prompt clarification,
the five composite-volume render tests and TypeScript check also pass. External documentation fetches
remain unverified because of network restrictions; local references pass.

The final strict audit independently checked all 2,290 PNGs and passed with exact passing
cache coverage, no uncovered images, no structure or renderer-identity issues, and no
byte-identical image groups. Cache churn confirms 2,277 unchanged images, the three
intended prompt changes, ten added identities, and eight removed identities. There are
no seed or attempt shifts. Canonical regeneration, VQA, split integrity, cache verification,
and the local explorer refresh are complete. This is a local dataset refresh; a future
release must rebuild the merged dataset and release asset index before publication.
