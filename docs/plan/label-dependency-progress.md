# Label dependency repair progress

Prepared on 2026-10-28 on `codex/label-dependency-audit`, using the working tree at
`d0beb699fff574f550519b4fa3bf8acf398454ec`. This ledger tracks the remaining work under the
[autonomous execution agreement](label-dependency-graph.md#autonomous-execution-agreement-2026-10-28)
and [batch roadmap](label-dependency-graph.md#remaining-batch-roadmap).

**Execution in progress: 16 original source scopes have completed their supported repairs.**
Arithmetic and legacy conversion are next. Quotient equivalent-choice metadata remains under
technical investigation. Decision review continues for the deferred children and parity. Counts below
start at this preparation baseline; they do not erase previously completed measurement and
currency repairs. The source still has gaps, so dataset regeneration is not ready.

## Verified starting point

The fresh report-only audit matches the previously committed backlog exactly:

| Measure | Baseline |
|---|---:|
| Normalized targets / semantic matches | 1,013 / 1,182 |
| Admitted selections / eligible selections | 1,232 / 817 |
| Selections with non-range gaps | 538 |
| Affected generators / generator-view pairs | 79 / 169 |
| Distinct source selection/facet gaps | 1,307 |
| Raw source rule/facet findings | 1,325 |
| Conflicts, invalid contexts, incomplete enumerations, row/contract errors | 0 |
| Stored findings: raw / distinct sample-facet gaps | 4,146 / 4,012 |
| Stored samples with findings | 1,332 |

The stored snapshot is a separate measurement of the same work, not an additional backlog.
The 18 repeated source base checks explain the raw/distinct difference. The Area allowlist,
integer-only digit gate and range-policy exclusion are unchanged.

| Progress since this baseline | Count |
|---|---:|
| Outstanding source gaps | 722 |
| Queued, in review or not yet triaged | 479 |
| Assigned to deferred decision batches (subset of outstanding) | 243 |
| Verified closed / introduced / reopened | 645 / 60 / 0 |
| Review/decision scopes (two unsplit topics plus twenty children) | 22 |

The original algebra topic now has an explicit child owner. Parity and legacy conversion remain
unsplit topics; twenty children have exact ownership. Deferred gaps remain in the outstanding total.

## Source batch ledger

Every selection/facet gap has exactly one current owner. Record movements and evidence
in the checkpoint log when a batch is processed; update current counts and row state here.
The roadmap contains each scope's uncertainties and generator inventory.

| Batch | Scope | Baseline gaps | Current gaps | Deferred subset | State |
|---|---|---:|---:|---:|---|
| RB-A1 | Binary arithmetic operand widths | 118 | 142 | 0 | Queued |
| RB-A2 | Binary arithmetic zero participation | 28 | 28 | 0 | Queued |
| RB-A3 | Elementary numeral/base and number views | 64 | 0 | 0 | Complete; children below |
| RB-A3-D1 | Object-only numeral/base applicability | 0 | 20 | 20 | Deferred |
| RB-A3-D2 | Writing zero declaration ownership | 0 | 11 | 11 | Deferred |
| RB-A3-D3 | Rounding-reasoning match guarantees | 0 | 8 | 8 | Deferred |
| RB-A4 | Three- and four-operand arithmetic | 24 | 24 | 0 | Queued |
| RB-A5 | Arithmetic strategies and property relations | 38 | 38 | 0 | Queued |
| RB-A6 | Patterns, estimation and equation-zero contexts | 36 | 36 | 0 | Queued |
| RB-A7 | Parity grouping and zero classification | 2 | 2 | 0 | Queued |
| RB-A8 | Counting offsets, equal groups and arrays | 16 | 16 | 0 | Queued |
| RB-A9 | Place value, rounding and powers of ten | 71 | 71 | 0 | Queued |
| RB-A10 | Written algorithms and division models | 22 | 22 | 0 | Queued |
| RB-D1 | Symbolic and substituted algebra expressions | 56 | 0 | 0 | Complete; child below |
| RB-D1-D1 | Algebra domain/sign/zero distinctions | 0 | 35 | 35 | Deferred |
| RB-D2 | Numerical expressions and powers | 44 | 0 | 0 | Complete; child below |
| RB-D2-D1 | Power-expression sign and zero | 0 | 10 | 10 | Deferred |
| RB-F1 | Decimal notation, comparison and transcription | 35 | 0 | 0 | Complete; child below |
| RB-F1-D1 | Decimal zero-component/projection decisions | 0 | 8 | 8 | Deferred |
| RB-F2 | Decimal operations and place-value zero | 14 | 0 | 0 | Complete; child below |
| RB-F2-D1 | Decimal zero/component distinctions | 0 | 8 | 8 | Deferred |
| RB-F3 | Fraction arithmetic and benchmark estimation | 133 | 0 | 0 | Complete; child below |
| RB-F3-D1 | Arithmetic/benchmark fraction magnitude | 0 | 21 | 21 | Deferred |
| RB-F4 | Fraction division and quotient projections | 177 | 0 | 0 | Complete; children below |
| RB-F4-D1 | Variable division/model zero | 0 | 35 | 35 | Deferred |
| RB-F4-D2 | Division fraction magnitude | 0 | 19 | 19 | Deferred |
| RB-F4-D3 | Whole-sharing number-kind/profile design | 0 | 1 | 1 | Deferred |
| RB-F4-D4 | Unit-dividend label/configuration preservation | 0 | 16 | 0 | In review |
| RB-F5 | Fraction equivalence and whole/tenths projections | 49 | 0 | 0 | Complete; child below |
| RB-F5-D1 | Equal-whole versus proper tenths | 0 | 2 | 2 | Deferred |
| RB-F6 | Fraction comparison and number lines | 40 | 0 | 0 | Complete |
| RB-F7 | Fraction products and scaling | 40 | 0 | 0 | Complete; children below |
| RB-F7-D1 | Nonmixed-product fraction magnitude | 0 | 3 | 3 | Deferred |
| RB-F7-D2 | Product word-problem zero across modes | 0 | 2 | 2 | Deferred |
| RB-F8 | Rational number-line representations | 40 | 0 | 0 | Complete; child below |
| RB-F8-D1 | Mixed fraction-axis magnitude | 0 | 4 | 4 | Deferred |
| RB-F9 | Signed rationals, order, magnitude and opposites | 54 | 0 | 0 | Complete; children below |
| RB-F9-D1 | Contextual order sign distinctions | 0 | 4 | 4 | Deferred |
| RB-F9-D2 | Contextual zero/reference distinctions | 0 | 9 | 9 | Deferred |
| RB-F10 | Ratios, rates and percentages | 30 | 0 | 0 | Complete |
| RB-M1 | Legacy conversion profiles and shared consumers | 84 | 84 | 0 | Queued |
| RB-M2 | Clock reading and construction | 46 | 0 | 0 | Complete; child below |
| RB-M2-D1 | Clock numeral/base/zero evidence | 0 | 37 | 37 | Deferred |
| RB-M3 | Elapsed time and interval arithmetic | 24 | 0 | 0 | Complete; child below |
| RB-M3-D1 | Clock-component zero across modes | 0 | 6 | 6 | Deferred |
| RB-M4 | Length measurement and unit relations | 22 | 0 | 0 | Complete |
| **Total: 46 source batches** | | **1,307** | **722** | **243** | |

| Acceptance batch | State | Entry condition |
|---|---|---|
| RB-V1 — Source readiness and canonical refresh | Waiting for readiness | Zero non-range source gaps, including deferred/new obligations; no conflicts, invalid contexts, contract errors or incomplete enumerations. |
| RB-V2 — VQA and stored acceptance | Waiting for refreshed dataset | Successful RB-V1, then necessary VQA refresh and strict stored annotation, image and coverage checks. |

The original baseline remains **28 batches including acceptance**; twenty explicit child scopes
bring the current inventory to **48**, of which 16 source parents are complete and 32 batches
remain including acceptance. This exceeds the original planning allowance, which was not a cap.
Splitting does not close gaps. Verified closure and newly introduced requirements are the primary
progress measures.

## Decision topics

These topics refer to existing batch ownership. They are not extra batches or duplicate gap
counts. Create a deferred child only with an explicit affected selection/facet list and
before/after lineage. Preserve independent provable portions in the parent batch.

| Topic | Owner | Evidence and unresolved decision | Next preparation within the batch |
|---|---|---|---|
| DEC-ALG-01 | RB-D1-D1 | Thirty-five remaining gaps concern explicit/hidden domains and variable sign/zero evidence. `3 + x`, `3 / x` with a nonzero restriction, and a displayed zero or negative coefficient must not inherit one occurrence claim. | Base10 closes 14 gaps and explicit-domain/substituted rational-kind declarations close seven. Resolve the seven hidden-domain kind findings and 28 sign/zero findings through the [algebra decision note](label-dependency-graph.md#algebra-establish-the-numerical-context-of-each-projection), without excluding this intended Area boundary. |
| DEC-PAR-01 | RB-A7 | Count 2 gives group size 1/remainder 0; count 1 gives 0/1; count 3 gives 1/1. Oddness alone cannot justify zero absence. | Review the [parity decision note](label-dependency-graph.md#parity-retain-singleton-even-and-larger-odd-cases). Compare explicit even/singleton-odd/larger-odd model cases and producer ownership while retaining all supported counts and targets. Both current gaps are in scope; record the concrete implementation decision before assigning the deferred child. |
| DEC-CONV-01 | RB-M1 | Legacy and explicit integer profiles differ despite both involving whole quantities. Shared consumers can gain new requirements; the documented counterfactual closes 84 old assessments but introduces 17. | Review the [conversion decision note](label-dependency-graph.md#deferred-conversion-decision--cover-legacy-profiles-and-shared-consumers). Assess a truthful profile distinction and declaration ownership, including `measurement-unit-scale` and currently gap-free derivation consumers. Document schema/resolver and coverage effects before proposing a design. |
| DEC-A3-01 | RB-A3-D1 | Twenty numeral/base requirements belong to object-only counting conservation, counting comparison/matching and sorting-extremum tasks. Neither mode shows count numerals; the ontology explicitly distinguishes numerals from object quantities. | Decide the dependency applicability or representation contract; ArabicNumerals/Base10 cannot be added from hidden counts. No gate or rendering change is made here. |
| DEC-A3-02 | RB-A3-D2 | Eleven writing zero requirements span six projections. The producer owns `requireZero`; its positive branch feeds a number-line projection with visible origin zero. View-owned zero invariants overlap the producer schema under SPEC-8/SPEC-11. | Review a normal pre-draw declaration ownership contract that preserves positive/explicit-zero configurations and all projections. The attempted number-line zero additions were withdrawn after ownership validation; the two arithmetic zero gaps remain in RB-A2. |
| DEC-A3-03 | RB-A3-D3 | Eight existing reasoning numeral gaps are deferred because declaring ArabicNumerals would also admit unsafe new matches. Generator seed 92 with Addition+Addition and range 0..100 produces 23+32+45=100; view seed 1 renders proposed answer 200. | Agree a repair for the existing projection/compatibility guarantee before enabling those matches. Preserve targets and range policy. The proposed reasoning declaration and test edit were fully withdrawn. |
| DEC-F1-01 | RB-F1-D1 | Eight zero requirements concern decimal comparison, fraction/decimal transcription and decimal reading/writing. Place-value coefficients, zero whole parts and solution-only decompositions provide different evidence; a zero glyph alone does not establish an involved zero value. | Review the concrete target/projection examples in `temp/label-dependency-execution/f1-review.md`. Preserve both modes; do not declare blanket zero absence on positive decimal values or infer presence from hidden solution coefficients. |
| DEC-F8-01 | RB-F8-D1 | Four fraction-axis magnitude findings remain. One supported axis may show 0/1, 1/2 and 5/2; another stays below magnitude one. | Decide whether magnitude describes the located value or all displayed fraction representations, and how mixed axes are represented. Preserve points, axes and sampling; no range-policy change. |
| DEC-F9-01 | RB-F9-D1 | Four contextual-order sign findings vary with the two sampled signed readings inside existing choices. | Define ordinary pre-draw distinctions or clarify intended involved-value evidence; no sampled-payload classification. |
| DEC-F9-02 | RB-F9-D2 | Nine contextual zero/reference findings differ by projection and selected readings; visible reference zero and absence of a zero reading are different evidence. | Review the exact examples in `f8-f9-review.md` before adding a zero descriptor. |
| DEC-M2-01 | RB-M2-D1 | Thirty-seven clock requirements remain: nineteen original findings plus eighteen activated by truthful integer/nonnegative declarations. Analog-reading questions can have no digits; digital-construction questions use words/placeholders, with digits in solutions. Zero components also vary. | Decide representation and zero evidence across modes and the existing one-sided zero selector. Keep all targets, clock precision and rendering. |
| DEC-M3-01 | RB-M3-D1 | Six elapsed/interval zero findings remain. A positive question such as 1:31 to 2:05 has a solution introducing the reference 2:00. | Clarify component versus composite time occurrence and mode-specific evidence. A zero digit alone is not sufficient. |
| DEC-D2-01 | RB-D2-D1 | Ten power sign/zero findings remain: the same exponent profile admits 2^2, (-2)^2 and 0^2; another admits exponent zero. | Review ordinary pre-draw distinctions preserving all supported bases, coefficients and exponents. PositiveExponent alone does not classify base sign or zero participation. |
| DEC-F2-01 | RB-F2-D1 | Eight decimal zero findings concern component/decomposition evidence and values or results that vary inside existing choices. | Separate zero digits from involved zero values; review the concrete expanded, comparison, rounding and addition/subtraction projections. |
| DEC-F3-01 | RB-F3-D1 | Twenty-one arithmetic/benchmark magnitude findings vary between proper, equal-whole and improper operands, results or benchmark candidates. | Determine participating quantities and ordinary pre-draw distinctions; a proper input alone does not classify a complete arithmetic task. |
| DEC-F4-01 | RB-F4-D1 | Thirty-five division zero findings vary by model and projection. General models can display origin zero; shared union views also accept positive unit-part models without that origin. | Review model/projection ownership and question/solution evidence without blanket generator absence or union-view presence. |
| DEC-F4-02 | RB-F4-D2 | Nineteen magnitude findings include eighteen exposed by truthful FractionNumbers declarations; dividends and quotients can be proper, equal-whole or improper. | Represent actual mathematical distinctions before drawing, preserving all original values and cases. |
| DEC-F4-03 | RB-F4-D3 | The remaining whole-sharing kind is visible in solutions, but adding FractionNumbers to its profile would make it compete with the original fraction-as-quotient profile. | Agree a profile/ownership design preserving the distinct contexts; adding the label directly changes admitted configurations. |
| REVIEW-F4-04 | RB-F4-D4 | Sixteen unit-dividend zero-absence claims are true, but naive enriched bundles change three old tuples from one to three profiles. | Investigate existing equivalent-choice metadata and old request aliases. This is technical work still in review, not a semantic decision merely because the first patch failed. |
| DEC-F5-01 | RB-F5-D1 | Two tenths assignments include both proper 1/10–9/10 and equal-whole 10/10=100/100. | Preserve numerator ten and agree a normal pre-draw magnitude distinction. |
| DEC-F7-01 | RB-F7-D1 | Three nonmixed product magnitude findings vary across multiplier, quantity and product values. | Review supported pre-draw distinctions without choosing a label from one sampled value. |
| DEC-F7-02 | RB-F7-D2 | Two product-story questions show only positive quantities; their solutions add a model with origin zero. | Settle question/solution evidence scope before declaring either zero member. |

For each decision, record the concrete examples, affected declarations and projections,
available options, recommended choice, and effects on targets, configuration, sampling,
rendering and validation. Continue independent work; seek a user decision only for the
scope or interpretation that the current agreement does not settle.

## Checkpoint accounting

Use `queued`, `in review`, `partial`, `deferred` and `complete` states. A partially repaired
parent can become complete only after its remaining gaps have explicit child ownership;
those children remain outstanding for global readiness. Keep parent/child links and show
transfers separately from closures. Decision approval is not gap closure: the fix must pass
its evidence review and validation first.

On a split, retain the parent's original baseline count and give the new child a baseline
count of zero. Move its current gaps from the parent through an explicit transfer; those
gaps are inherited work, not new findings. This keeps the baseline total fixed at 1,307 and
the current ownership unique even as the number of batches grows.

For each checkpoint record:

- Batch and child IDs; start/end revision and audit policy/ontology identity; owned files.
- Declaration evidence and all affected consumers; before/after target, match and configuration
  comparison; any genuinely added matches and their review.
- Distinct and raw findings, affected selections, closed/introduced/reopened counts, assigned
  deferred subset, and transfers between batches, both locally and globally.
- Tests, coverage, replay/rendering evidence as applicable, independent reviewer findings and
  disposition, the checkpoint commit, and the next queued scope or decision.

Globally, `before + introduced + reopened - closed = after`. Within a batch, add transfers in
and subtract transfers out. Count each shared fix once globally and reconcile all affected
owner rows. Deferred gaps are a subset of outstanding gaps, never subtracted from that total.

Audit selection IDs locate findings within one snapshot. Label additions can alter those
hashes; compare preserved target/generator/view/configuration lineage before calling a gap
closed, introduced or reopened. If that mapping is ambiguous, investigate before recording
closure. Removing support or pushing a task outside the fixed Area gate is not a repair.

### Preparation checkpoint — 2026-10-28

Fresh audit and matching enumeration completed successfully. All 1,307 distinct gaps map to
exactly one of the 26 source batches. No repair was implemented; all progress deltas are zero.
Only this ledger, the execution agreement and the plan index belong to the preparation commit.
Documentation validation passed with five existing external-document fetch warnings and no
errors. The independent read-only review confirmed counts, ownership, authorization and
readiness boundaries; its requested split-accounting clarification is included above.
Preservation checks confirmed all 3,295 baseline paths outside the two existing preparation
documents, unrelated Git status and the dataset pointer are unchanged. The new ledger is
the only added nonignored file. No runtime tests were needed for this documentation-only
checkpoint. Regeneration and VQA remain pending the source-readiness gate.

### RB-A3 — Supported numeral declarations

Four view invariants add `ArabicNumerals`: `operations-number-line-arithmetic`,
`operations-number-line-representation`, `measurement-word-problem` and `numbers-write-name`.
Both modes display ordinary decimal digit numerals; the paired producers already declare
Base10. Existing schemas, compatibility, mathematical generation and rendering are unchanged.
Two existing exact declaration assertions are updated. No target or existing label is removed.

The fresh audit closes **25 distinct/raw RB-A3 findings** and introduces **24 operand-digit
requirements** from eight newly admitted measurement-word-problem matches, each with three
unit alternatives. These matches were reviewed against their full target claims and both modes;
their requirements belong to RB-A1. Global accounting is **1,307 + 24 - 25 = 1,306 distinct**,
with **1,324 raw source findings across 562 selections**, 1,256 admitted selections and 841
eligible selections. No conflicts, contract errors, invalid contexts or incomplete tuples occur.
All 1,013 targets and 1,182 prior matches remain; the match count is now 1,190.

The original 211 affected tuple/configuration lineages reconcile exactly. Their 422 question/
solution probes and 522 stored-origin draws preserve configuration, prepared and generator
random states, random continuation, payloads, content/task fingerprints and existing labels.
Selection/plan hash changes are reconciled rather than counted as new findings. The stored
snapshot and its 4,146 raw findings are unchanged.

Transfer the remaining **39 RB-A3 gaps** to children: 20 object-only numeral/base findings,
11 writing zero findings, and eight reasoning numeral findings. The children have baseline
zero and explicit inherited current ownership; no transfer counts as closure. Exact baseline
locators and before/after configuration lineage are retained in `a3-deferred-final.json`
and the local evidence below.

Source evidence and independent review: `a3-review.md`, `a3-new-match-review.md` and
`a3-new-match-evidence.json` under `temp/label-dependency-execution/`. The latter captures the
reproducible rounding counterexample. Final rematch, audit, replay and per-facet accounting
are under `a3-accepted/` (including `comparison.json`), compared with `before/`. The original
30-locator deferred draft is superseded by the 39-gap ownership described here and the final
audit; it is not a second outstanding count.

Validation: type and declaration ownership checks pass; 840 suites / 6,436 tests pass with
98.49% statements, 97.05% branches, 100% functions and 99.51% lines in the configured coverage
scope. Every checked generator clears its thresholds. The complete coverage gate used four
workers after the sandbox blocked Vitest temporary-file renames and the unconstrained run
encountered contention. Documentation checks pass with five external-fetch warnings. Evidence
logs: `a3-types.log`, `a3-specs-final.log`, `a3-coverage-bounded.log`,
`a3-generator-coverage.log`, `a3-docs.log` and `a3-preservation.json`. Only the nine owned source,
test and documentation paths differ from the execution working-tree baseline. The checkpoint
is `cedb75c3`. Next queued batch at that checkpoint: RB-F1.

### RB-F1 / RB-F6 / RB-F10 — Decimal, fraction and ratio declarations

These independent scopes share one acceptance checkpoint. Their production changes are
23 `spec.ts` files, with 15 existing declaration assertions updated. All schemas, resolvers,
mathematical generators and rendering sources retain their previous bytes. F1 supplies
supported nonnegative/numeral/base/explicit-origin claims. Three conversion leaves refine
`FractionNumbers` to `ProperFractions`, retaining the parent capability through specialization
and avoiding redundant invariant ancestors under SPEC-2. F6 supplies fraction-comparison
sign/zero guarantees and fraction-line notation/visible-origin evidence. F10 supplies ratio,
unit-rate and percent notation and supported zero absence. Ratio-table zero absence stays on
the two table leaves because the shared coordinate consumer displays origin zero.

The fresh full audit closes **97 distinct / 104 raw findings**: F1 closes 27 distinct / 34 raw,
F6 closes 40, and F10 closes 30. No new missing requirement is introduced. F1's eight remaining
zero findings transfer to RB-F1-D1 with baseline zero; both F6 and F10 are complete. The global
total is **1,306 - 97 = 1,209 distinct / 1,220 raw source findings**, across 540 selections.
There are 1,260 admitted / 845 eligible selections; no conflicts, invalid contexts, contract
errors or incomplete enumerations occur. All 1,013 targets and 1,190 prior matches remain.
Two rational-number-line positioning matches add four complete selections, bringing matching
to 1,192; their full target and question/solution evidence is reviewed separately.

Replay reconciles all 235 prior affected tuple/configuration lineages: 470 question/solution
probes and 522 stored-origin draws preserve configuration, prepared/generator random states,
continuation, mathematical payloads and content/task fingerprints. The only replaced annotation
claims are the three justified proper-fraction refinements above. Stored rows, their 4,146 raw
findings and the dataset pointer remain unchanged.

Evidence is under `temp/label-dependency-execution/`: `f1-review.md`, `f6-f10-review.md`,
`f-declarations/{draws.json,comparison.json,audit/}`, `f1-owned-paths.json`,
`f6-f10-owned-paths.json` and their exact before-file copies. Four owned files already contain
unrelated ontology-adoption changes; only declaration/expectation hunks are staged. The saved
before copies match the execution-start hashes, preserving those unrelated edits. The two
focused runs pass 15 suites / 52 tests and 20 suites / 110 tests respectively. Type and
declaration ownership checks pass. Independent source and new-match review found no actionable
issues. The shared complete coverage gate passes 840 suites / 6,436 tests, with 98.49% statements,
97.05% branches, 100% functions and 99.51% lines; all checked generators clear their thresholds.
Logs: `f-types.log`, `f-specs.log`, `f-coverage.log` and `f-generator-coverage.log`.
Next queued scopes: RB-F8/RB-F9.

### RB-F8 / RB-F9 / RB-M2–M4 / RB-D1–D2 — Rational, measurement and expression declarations

The supported repairs cover 59 spec/test files across these seven original source scopes.
They add visible numeral/base claims, exact mathematical invariants and labels on existing
reference-zero and expression relation bundles. The relation values, resolvers, admitted
mathematical configurations, sampling and renderers remain unchanged. An explicit `flatMap<string>`
type argument fixes heterogeneous Area/Scope bundle inference without changing runtime values.
Unit-composition sign/zero absence stays view-owned because canonical power maps can contain
negative/zero powers which the presentation expresses through positive denominator units.

| Scope | Existing distinct gaps closed | New requirements | Remaining child ownership |
|---|---:|---:|---|
| RB-F8 | 36 | 0 | 4 magnitude |
| RB-F9 | 41 | 0 | 4 sign + 9 zero |
| RB-M2 | 27 | 18 | 37 clock notation/zero |
| RB-M3 | 18 | 0 | 6 clock-component zero |
| RB-M4 | 22 | 0 | None |
| RB-D1 | 21 | 0 | 35 algebra kind/sign/zero |
| RB-D2 | 34 | 0 | 10 power sign/zero |
| **Total** | **199** | **18** | **105 transferred to seven children** |

Global accounting is **1,209 + 18 - 199 = 1,028 distinct / 1,035 raw findings**, across 511
selections. All 1,013 targets, 1,192 matches and 1,260 admitted / 845 eligible selections remain.
No conflict, invalid context, contract error or incomplete enumeration occurs. The 18 new
clock obligations are consequences of truthful kind/sign declarations on six previously
untriggered selections; they remain outstanding in RB-M2-D1.

All 545 prior affected configuration lineages reconcile: 1,090 question/solution probes and
1,218 stored-origin draws preserve resolved values, prepared/generator random states, random
continuation, payloads and content/task fingerprints. No label is removed. The stored dataset
and pointer remain unchanged. The three focused runs pass 20 suites / 193 tests, 20 suites /
107 tests and 15 suites / 124 tests; the type fix additionally passes four suites / 64 tests.
Type and ownership checks pass. Independent source/consumer review found no actionable issues.
The complete coverage gate passes 840 suites / 6,436 tests with 98.49% statements, 97.05%
branches, 100% functions and 99.51% lines; generator thresholds pass. Documentation passes
with five external-fetch warnings. Final preservation confirms only owned changes and an
unchanged dataset pointer. Logs: `d1-d2-types.log`, `rmd-specs.log`, `rmd-coverage.log`,
`rmd-generator-coverage.log`, `rmd-docs.log` and `rmd-final/preservation.json`.

Evidence: `f8-f9-review.md`, `m2-m4-review.md`, `d1-d2-review.md`, each group's before-file/hash
manifest, and `rmd-final/{draws.json,comparison.json,audit/}` under the execution scratch folder.
Compare against `remaining-before/`, captured after `b9dfc3a0`'s source edits and before these
seven scopes. Raw audit locators are reconciled by preserved configuration, not hash identity;
`rmd-final/deferred.json` contains all 152 currently assigned decision gaps.
The existing algebra-adoption and signed-context/zero-view changes are preserved through
staging only the owned declaration/expectation hunks. Next supported scopes: RB-F2/F3/F4/F5/F7.

### RB-F2 / RB-F3 / RB-F4 / RB-F5 / RB-F7 — Remaining fraction/decimal declarations

This checkpoint changes 39 specs and 23 existing test expectations. It adds proven notation,
nonnegative/positive-context and explicit-origin declarations, a fraction-kind invariant for
general division, and an improper-fraction descriptor on the existing mixed-product choice.
Scaling sign/zero absence is declared only on its two views because its unused canonical
part-difference field can be zero or negative. Whole-sharing number-kind remains unchanged.

The first unit-dividend bundle proposal failed preservation: three old basic requests acquired
three admissible profiles, and direct resolution could choose inverse/equation. Those three
zero-absence additions and corresponding expectations were withdrawn. Resolver values and
guards remain unchanged. The fraction-as-quotient additions pass replay. Sixteen unit-dividend
findings remain in a separate technical review for an existing declarative metadata solution.

| Scope | Existing distinct gaps closed | New requirements | Remaining ownership |
|---|---:|---:|---|
| RB-F2 | 6 | 0 | 8 zero |
| RB-F3 | 112 | 0 | 21 magnitude |
| RB-F4 | 124 | 18 | 35 zero + 19 magnitude + 1 kind + 16 metadata review |
| RB-F5 | 47 | 0 | 2 magnitude |
| RB-F7 | 35 | 0 | 3 magnitude + 2 zero |
| **Total** | **324** | **18** | **107 transferred; 16 still in technical review** |

Global accounting is **1,028 + 18 - 324 = 722 distinct / 729 raw findings**, across 485
selections. There are 1,262 admitted / 847 eligible selections, no conflicts, contract errors,
invalid contexts or incomplete enumerations. All 1,013 targets and 1,192 prior matches remain.
Two whole-number equivalence line matches add one complete selection each, bringing matching
to 1,194; independent review confirms their complete target claims in both modes.

Replay preserves all 545 previous configuration lineages, 1,090 question/solution probes and
1,218 stored-origin draws: configurations, random states/continuation, mathematical payloads
and content/task fingerprints are identical. No annotation is removed. Dataset rows, pointer
and stored findings are unchanged. Focused tests pass 87 suites / 400 tests. The complete gate
passes 840 suites / 6,436 tests at 98.49% statements, 97.05% branches, 100% functions and 99.51%
lines; generator thresholds pass. Type, ownership and independent source/new-match review pass.

Evidence: `f2-f7-review.md`, `next-f-before-files/`, `next-f-owned-inventory.json`,
`next-f-final/{draws.json,comparison.json,audit/}`, `next-f-focused-final.log`,
`next-f-coverage.log` and `next-f-generator-coverage.log` under the execution scratch folder.
The prepared `next-f.patch` is a superseded draft; final evidence includes the withdrawal.
Documentation checks pass with five external-fetch warnings; final preservation confirms the
protected files and dataset pointer are unchanged. `next-f-final/deferred.json` records the
243 assigned decision gaps; the sixteen quotient metadata cases remain in review separately.
Next: supported arithmetic and legacy conversion declarations, plus quotient metadata review.

## Baseline evidence and preservation

The initial index was empty. The captured working tree includes **187 pre-existing modified
paths and two untracked files**; these are not preparation changes. HEAD alone therefore
does not reproduce this baseline. A content-hash manifest protects all 3,297 existing tracked
and nonignored untracked paths. Compare it before committing, exempting only the preparation
documents; do not reset, stage or amend unrelated work.

| Identity | Value |
|---|---|
| Ontology | `edugraph-ts` `v0.31.0-pre.58.9231304124e9` |
| Dependency policy SHA-256 | `01584d603f3c0b48a0c882f3a0350acc7b0dc511553560e50c390ed52b41122c` |
| Fresh audit SHA-256 | `d76c73c1e18cfbb96142fb4c066ad75bf5bb9e1f18abb16f957588d13ce16813` |
| Normalized target labels SHA-256 | `10347eb3b15799256f5cefd1d61815f5d6c0d3d9c511189cbb951125e199052d` |
| Match identities SHA-256 | `916e147100155e9a514caaa6abfee30e786c50ece4464871bea44de5541fef33` |
| Working-tree manifest SHA-256 | `0f9e89cde3386d075e17c22837e54bcbf226412405447e724ebceea9865e4d00` |
| Stored generation | `cada54596eb7b8fd3dc3dd293c5576d9ec8d6fa0f952134a356e1b462058f4c2` |
| Dataset pointer SHA-256 | `ea5c766e5504186d7b1db8943c3f9cabece437059b7369ba3520842608929e51` |

Local verification artifacts are under `temp/label-dependency-autonomy/`:

- `audit/audit.json`, `audit/audit.md` and `audit.log`: fresh report-only audit.
- `working-tree-baseline.json`: file hashes, original status/index and dataset pointer.
- `matching-baseline.json`: complete normalized target labels, match identities and enumerated
  selection plans for later configuration/identity reconciliation.
- `ledger-baseline.json`: all raw/distinct finding ownership and initial batch counters.
- `baseline-summary.json` and `capture-baseline.ts`: summary and local capture procedure.

These gitignored artifacts support verification, not runtime labeling. The committed ledger
and roadmap are the durable summary. Before each repair checkpoint, capture a fresh baseline
and reconcile any intervening changes; do not silently replace this starting point or use
stale temporary artifacts as proof of preservation.

The audit can be repeated into a new temporary directory with:

```bash
npm run audit:label-dependencies -- --spec=ccss --output-dir=temp/label-dependency-autonomy/recheck
```
