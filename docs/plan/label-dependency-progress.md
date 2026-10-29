# Label dependency repair progress

Prepared on 2026-10-28 on `codex/label-dependency-audit`, using the working tree at
`d0beb699fff574f550519b4fa3bf8acf398454ec`. This ledger tracks the remaining work under the
[autonomous execution agreement](label-dependency-graph.md#autonomous-execution-agreement-2026-10-28)
and [batch roadmap](label-dependency-graph.md#remaining-batch-roadmap).

**All 26 original source scopes are triaged; supported declaration repairs are implemented.**
Eight mathematically settled cases are closed through exhaustively validated configuration inference.
The measurement generator/view split closes another 21 through ordinary declarations.
The **362** remaining requirements have exact ownership in **25** dependency scopes, all deferred.
The known reasoning content defect in RB-A3-D3
also remains open, despite its retired dependency requirements. Full dataset readiness still
waits for those decisions. Counts below
start at this preparation baseline; they do not erase previously completed measurement and
currency repairs. The source still has gaps, so dataset regeneration is not ready.

The agreed [narrowing of the blanket numeral/base dependencies](label-dependency-graph.md#agreed-direction-conditional-notation-dependencies)
is implemented. It retires 38 source requirements without changing annotations or claiming
repairs. Representation completeness remains a separate, unestimated design topic; no mandatory
`NumberRepresentation` replacement has been adopted.

## Place-value subtraction width acceptance (2026-10-29)

The two mathematically settled RB-A9-D2 subtraction-with-borrowing omissions are closed.
The [implementation and alternative review](label-dependency-graph.md#place-value-subtraction-width-fixes-2026-10-29)
explains why ordinary conditional bundles do not preserve the existing direct resolution
contract and why the narrowly scoped `inferredLabels` fallback is appropriate here.

- Source gaps decrease **364 → 362**; operand-digit findings decrease **111 → 109**.
  RB-A9-D2 retains four unresolved width findings. Other facet counts are unchanged.
- All 22 place-value selections have exhaustive configuration outcomes, with two actual
  width additions and 20 abstentions. The total inference count is 34 exhaustive,
  zero pending and zero invalid. Possible `produces` labels are not counted as repairs.
- All **1,013 targets**, **1,209 tuples** and **1,284 selections** are preserved. The complete
  plan domains, correlations and ordering are equal before and after the change; all seven
  target files and 3,056 unowned source files are byte-identical.
- Before/after sampling checks pass for **132 planned draws** and **2,880 direct probes**,
  including unspecified operations and unsupported combinations. Configuration, null/success
  outcomes, payloads and random continuation are identical. All **44 question/solution SSR
  comparisons** are byte-identical, and 132 replays reproduce their original draw.
  These payload/render checks are sampled; complete configuration-domain equality and static
  annotation resolution provide the exhaustive evidence.
- All 22 old source plans are rejected by freshness validation. Semantic plan hashes stay
  stable because their choices are unchanged; source input identities change as required.
- Type, label, ownership/spec and documentation checks pass. Full coverage passes
  **851 suites / 6,728 tests** and every generator threshold; the affected generator has
  **92.18% statements / 87.91% branches**. Independent implementation review is clean.
- Matching capabilities, targets, Area allowlist, integer qualification and range-policy
  exclusion remain unchanged. The shared proof registrations change the audit implementation
  hash, not the dependency policy. Stored findings remain **2,542 raw / 2,528 distinct**;
  canonical regeneration and VQA remain deferred until source readiness.

Local evidence: `temp/place-value-width-fixes/`, including the before/after audit,
exact requirement reconciliation, preservation comparison and validation logs.

## Measurement split acceptance (2026-10-29)

RB-M1-D1 is complete. Checkpoint `214d9b05` establishes the contracts/helpers without behavior
changes; `2be5fa36` migrates both producers and their views; the final documentation checkpoint
records acceptance. The [implementation record](label-dependency-graph.md#split-checkpoint-3--acceptance-and-backlog-reconciliation)
contains the complete verification and identity consequences.

- All seven target files are unchanged; all 1,013 targets remain covered and all 35 old
  conversion selections have successors. Catalog tuples increase 1,195 → 1,209 and admitted
  selections 1,263 → 1,284 through the reviewed additional matches.
- The affected family's pre-dedup candidates increase **88 → 126** under the existing sampling
  defaults, all valid without retries: 36 from added routes and two from successor validation
  reassignment. This records the accepted identity/match effect, not final canonical counts.
- The 21 original number-kind omissions close through ordinary matching-capable declarations,
  with no new non-range requirements. Effective source gaps fall **385 → 364**, across
  **284** affected selections. Remaining facets: zero **173**, operand digits **111**, fraction
  magnitude **49**, sign **23**, number kind **8**.
- All 56 new family selections pass annotation validation and deterministic replay. The
  288 same-math render comparisons and 384 story-preservation probes pass. Twenty-two native
  previews render; reviewed question/solution images preserve the tasks and layouts.
- Types, ownership, labels, documentation and integration checks pass. Full coverage passes
  **851 suites / 6,713 tests**, including all generator thresholds. The new generators each
  have 100% scoped coverage. Independent implementation reviews are clean.
- Policy, Area allowlist, integer-only digit qualification and range-policy exclusion are
  unchanged. The additional selections create 21 report-only range assessments, which are
  outside this backlog. Representation completeness remains separate.
- Stored data remains at generation `cada54596eb7b8fd3dc3dd293c5576d9ec8d6fa0f952134a356e1b462058f4c2`:
  **2,542 raw / 2,528 distinct** non-range findings across 1,282 samples. Canonical regeneration
  and VQA still wait for the remaining source gaps and the reasoning-view content defect.

Evidence is under `temp/measurement-split-implementation/`; its matching, replay, audit,
coverage and visual summaries are verification artifacts, not runtime inference or adapters.

## Verified starting point

This historical preparation audit matched the previously committed backlog exactly:

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
| Outstanding source gaps | 362 |
| Authorized implementation in progress (subset of outstanding) | 0 |
| Assigned to deferred decision batches (subset of outstanding) | 362 |
| Verified repairs / introduced / reopened | 982 / 75 / 0 |
| Policy-retired / policy-added requirements | 38 / 0 |
| Active dependency scopes, including implementation | 25 |
| Separately open content-defect scopes | 1 |

All remaining findings have explicit child owners. Thirty child scopes have been created;
the quotient metadata, near-doubles and measurement-conversion children are complete,
the object-only applicability requirements are retired, 25 children own dependency gaps,
and RB-A3-D3 retains an open content defect with zero graph
gaps. Deferred gaps stay in the outstanding total. Cumulative accounting is
**1,307 + 75 - 982 - 38 = 362**; the policy retirement is separate from verified repairs.

## Source batch ledger

Every selection/facet gap has exactly one current owner. Record movements and evidence
in the checkpoint log when a batch is processed; update current counts and row state here.
The roadmap contains each scope's uncertainties and generator inventory.

| Batch | Scope | Baseline gaps | Current gaps | Deferred subset | State |
|---|---|---:|---:|---:|---|
| RB-A1 | Binary arithmetic operand widths | 118 | 0 | 0 | Complete; child below |
| RB-A1-D1 | Variable pair width profiles | 0 | 102 | 102 | Deferred |
| RB-A2 | Binary arithmetic zero participation | 28 | 0 | 0 | Triaged; child below |
| RB-A2-D1 | Pair zero projection/ownership | 0 | 28 | 28 | Deferred |
| RB-A3 | Elementary numeral/base and number views | 64 | 0 | 0 | Complete; children below |
| RB-A3-D1 | Object-only numeral/base applicability | 0 | 0 | 0 | Requirements policy-retired; representation design separate |
| RB-A3-D2 | Writing zero declaration ownership | 0 | 11 | 11 | Deferred |
| RB-A3-D3 | Rounding-reasoning match guarantees | 0 | 0 | 0 | Open content defect; dependency requirements policy-retired |
| RB-A4 | Three- and four-operand arithmetic | 24 | 0 | 0 | Complete |
| RB-A5 | Arithmetic strategies and property relations | 38 | 0 | 0 | Complete; children below |
| RB-A5-D1 | Compensation/unknown-role primary widths | 0 | 3 | 3 | Deferred |
| RB-A5-D2 | Near-doubles legacy sampling/API boundary | 0 | 0 | 0 | Complete through validated configuration inference |
| RB-A6 | Patterns, estimation and equation-zero contexts | 36 | 0 | 0 | Complete; child below |
| RB-A6-D1 | Equation/estimation zero distinctions | 0 | 6 | 6 | Deferred |
| RB-A7 | Parity grouping and zero classification | 2 | 0 | 0 | Triaged; child below |
| RB-A7-D1 | Singleton/even/larger-odd grouping | 0 | 2 | 2 | Deferred |
| RB-A8 | Counting offsets, equal groups and arrays | 16 | 0 | 0 | Complete |
| RB-A9 | Place value, rounding and powers of ten | 71 | 0 | 0 | Complete; children below |
| RB-A9-D1 | Place-count/intermediate zero evidence | 0 | 25 | 25 | Four expanded-form cases complete; 25 deferred |
| RB-A9-D2 | Variable place-value primary widths | 0 | 4 | 4 | Partial; two borrowing-subtraction widths complete, remaining deferred |
| RB-A10 | Written algorithms and division models | 22 | 0 | 0 | Complete; child below |
| RB-A10-D1 | Algorithm operands/partial rows/remainders | 0 | 10 | 10 | Deferred |
| RB-D1 | Symbolic and substituted algebra expressions | 56 | 0 | 0 | Complete; child below |
| RB-D1-D1 | Algebra domain/sign/zero distinctions | 0 | 35 | 35 | Deferred |
| RB-D2 | Numerical expressions and powers | 44 | 0 | 0 | Complete; child below |
| RB-D2-D1 | Power-expression sign and zero | 0 | 10 | 10 | Deferred |
| RB-F1 | Decimal notation, comparison and transcription | 35 | 0 | 0 | Complete; child below |
| RB-F1-D1 | Decimal zero-component/projection decisions | 0 | 3 | 3 | Partial; remaining deferred |
| RB-F2 | Decimal operations and place-value zero | 14 | 0 | 0 | Complete; child below |
| RB-F2-D1 | Decimal zero/component distinctions | 0 | 7 | 7 | Partial; remaining deferred |
| RB-F3 | Fraction arithmetic and benchmark estimation | 133 | 0 | 0 | Complete; child below |
| RB-F3-D1 | Arithmetic/benchmark fraction magnitude | 0 | 21 | 21 | Deferred |
| RB-F4 | Fraction division and quotient projections | 177 | 0 | 0 | Complete; children below |
| RB-F4-D1 | Variable division/model zero | 0 | 35 | 35 | Deferred |
| RB-F4-D2 | Division fraction magnitude | 0 | 19 | 19 | Deferred |
| RB-F4-D3 | Whole-sharing number-kind/profile design | 0 | 1 | 1 | Deferred |
| RB-F4-D4 | Unit-dividend label/configuration preservation | 0 | 0 | 0 | Complete |
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
| RB-F9-D2 | Contextual zero/reference distinctions | 0 | 2 | 2 | Partial; remaining deferred |
| RB-F10 | Ratios, rates and percentages | 30 | 0 | 0 | Complete |
| RB-M1 | Legacy conversion profiles and shared consumers | 84 | 0 | 0 | Complete; child below |
| RB-M1-D1 | Legacy integer profile/ownership distinction | 0 | 0 | 0 | Complete through the approved generator/view split and ordinary declarations |
| RB-M2 | Clock reading and construction | 46 | 0 | 0 | Complete; child below |
| RB-M2-D1 | Clock numeral/base/zero evidence | 0 | 17 | 17 | Partial; zero findings deferred, notation requirements policy-retired |
| RB-M3 | Elapsed time and interval arithmetic | 24 | 0 | 0 | Complete; child below |
| RB-M3-D1 | Clock-component zero across modes | 0 | 6 | 6 | Deferred |
| RB-M4 | Length measurement and unit relations | 22 | 0 | 0 | Complete |
| **Total: 56 source batches** | | **1,307** | **362** | **362** | |

| Acceptance batch | State | Entry condition |
|---|---|---|
| RB-V1 — Source readiness and canonical refresh | Waiting for readiness | Zero non-range source gaps, including deferred/new obligations; no conflicts, invalid contexts, contract errors or incomplete enumerations; repair or explicit user-approved scope disposition of the known RB-A3-D3 reasoning content defect. Policy retirement does not repair that defect. |
| RB-V2 — VQA and stored acceptance | Waiting for refreshed dataset | Successful RB-V1, then necessary VQA refresh and strict stored annotation, image and coverage checks. |

The original baseline remains **28 batches including acceptance**; thirty explicit child scopes
bring the current inventory to **58**. All 26 original scopes have been triaged and the quotient,
near-doubles and measurement-conversion children are complete; **25 dependency decision scopes,
one content-defect scope and two acceptance batches remain: 28 scopes in total**. Representation completeness is a separate,
unestimated design topic outside this count.
This exceeds the original planning allowance, which was not a cap.
Splitting does not close gaps. Verified closure and newly introduced requirements are the primary
progress measures; policy retirement is reported separately.

## Decision topics

These topics refer to existing batch ownership. They are not extra batches or duplicate gap
counts. Create a deferred child only with an explicit affected selection/facet list and
before/after lineage. Preserve independent provable portions in the parent batch.

| Topic | Owner | Evidence and unresolved decision | Next preparation within the batch |
|---|---|---|---|
| DEC-ALG-01 | RB-D1-D1 | Thirty-five remaining gaps concern explicit/hidden domains and variable sign/zero evidence. `3 + x`, `3 / x` with a nonzero restriction, and a displayed zero or negative coefficient must not inherit one occurrence claim. | Base10 closes 14 gaps and explicit-domain/substituted rational-kind declarations close seven. Resolve the seven hidden-domain kind findings and 28 sign/zero findings through the [algebra decision note](label-dependency-graph.md#algebra-establish-the-numerical-context-of-each-projection), without excluding this intended Area boundary. |
| DEC-PAR-01 | RB-A7-D1 | Count 2 gives group size 1/remainder 0; count 1 gives 0/1; count 3 gives 1/1. Oddness alone cannot justify zero absence. | Review the [parity decision note](label-dependency-graph.md#parity-retain-singleton-even-and-larger-odd-cases). Preserve singleton, even and larger-odd cases and agree a normal mathematical grouping contract; zero is not a universal shared-counting claim. |
| DEC-CONV-01 | RB-M1-D1 | Resolved: all 21 old number-kind omissions have validated ordinary-declaration successors. | The approved split separates integer sequences from integer/decimal numeric equalities and gives each execution task a fixed view. All original targets and task paths survive; see [acceptance](#measurement-split-acceptance-2026-10-29). |
| DEC-A3-01 | RB-A3-D1 | Twenty object-only numeral/base requirements are policy-retired; zero graph findings remain in this scope. Neither mode shows count numerals; the ontology explicitly distinguishes numerals from object quantities. | Representation completeness remains a separate design topic. ArabicNumerals/Base10 cannot be added from hidden counts; removing the overbroad obligations is not an annotation repair. |
| DEC-A3-02 | RB-A3-D2 | Eleven writing zero requirements span six projections. The producer owns `requireZero`; its positive branch feeds a number-line projection with visible origin zero. View-owned zero invariants overlap the producer schema under SPEC-8/SPEC-11. | Review a normal pre-draw declaration ownership contract that preserves positive/explicit-zero configurations and all projections. The attempted number-line zero additions were withdrawn after ownership validation; the two arithmetic zero gaps remain in RB-A2. |
| DEC-A3-03 | RB-A3-D3 | Eight reasoning numeral requirements are policy-retired, but the known content defect remains open. Declaring ArabicNumerals would admit unsafe new matches: generator seed 92 with Addition+Addition and range 0..100 produces 23+32+45=100; view seed 1 renders proposed answer 200. | Agree a repair or explicit user-approved scope disposition for the existing projection/compatibility guarantee. Preserve targets and range policy. The proposed reasoning declaration and test edit were fully withdrawn; zero dependency findings do not establish source readiness for this defect. |
| DEC-F1-01 | RB-F1-D1 | Three decimal reading/writing zero requirements remain; whole parts and expanded coefficients vary. Five comparison/conversion findings are closed by explicit or necessarily requested Ones=0 coefficients. | Apply the existing ontology's necessary-consequence evidence rule; a zero glyph alone remains insufficient. The remaining writing profiles still need a pre-draw distinction and projection review. |
| DEC-F8-01 | RB-F8-D1 | Four fraction-axis magnitude findings remain. One supported axis may show 0/1, 1/2 and 5/2; another stays below magnitude one. | Decide whether magnitude describes the located value or all displayed fraction representations, and how mixed axes are represented. Preserve points, axes and sampling; no range-policy change. |
| DEC-F9-01 | RB-F9-D1 | Four contextual-order sign findings vary with the two sampled signed readings inside existing choices. | Define ordinary pre-draw distinctions or clarify intended involved-value evidence; no sampled-payload classification. |
| DEC-F9-02 | RB-F9-D2 | Two signed-context zero findings remain. Seven order/magnitude findings are closed because all their projections explicitly establish a numerical zero datum, including sea level. | The separate signed-context producer already owns zero through its relation choices and does not uniformly expose the same reference. Review its ownership and selected readings; do not generalize the seven repairs to this producer. |
| DEC-M2-01 | RB-M2-D1 | Seventeen clock zero findings remain after ten analog-reading numeral/base requirements were policy-retired. The earlier ten digital-construction notation findings were repaired by declarations because the visible task necessarily requests positional decimal digits. | Review zero-selector ownership. Analog reading's generic response does not require the same notation; representation completeness remains separate. Preserve targets, precision and rendering. |
| DEC-M3-01 | RB-M3-D1 | Six elapsed/interval zero findings remain. A positive question such as 1:31 to 2:05 has a solution introducing the reference 2:00. | Clarify component versus composite time occurrence and mode-specific evidence. A zero digit alone is not sufficient. |
| DEC-D2-01 | RB-D2-D1 | Ten power sign/zero findings remain: the same exponent profile admits 2^2, (-2)^2 and 0^2; another admits exponent zero. | Review ordinary pre-draw distinctions preserving all supported bases, coefficients and exponents. PositiveExponent alone does not classify base sign or zero participation. |
| DEC-F2-01 | RB-F2-D1 | Seven decimal zero findings remain. Equality's guaranteed zero thousandths coefficient is now declared on its existing choice; inequality, expansion, scaling, rounding and arithmetic values still vary. | Preserve existing numeric choices and distinguish explicit coefficients from digit glyphs. Further blanket zero declarations are not justified. |
| DEC-F3-01 | RB-F3-D1 | Twenty-one arithmetic/benchmark magnitude findings vary between proper, equal-whole and improper operands, results or benchmark candidates. | Determine participating quantities and ordinary pre-draw distinctions; a proper input alone does not classify a complete arithmetic task. |
| DEC-F4-01 | RB-F4-D1 | Thirty-five division zero findings vary by model and projection. General models can display origin zero; shared union views also accept positive unit-part models without that origin. | Review model/projection ownership and question/solution evidence without blanket generator absence or union-view presence. |
| DEC-F4-02 | RB-F4-D2 | Nineteen magnitude findings include eighteen exposed by truthful FractionNumbers declarations; dividends and quotients can be proper, equal-whole or improper. | Represent actual mathematical distinctions before drawing, preserving all original values and cases. |
| DEC-F4-03 | RB-F4-D3 | The remaining whole-sharing kind is visible in solutions, but adding FractionNumbers to its profile would make it compete with the original fraction-as-quotient profile. | Agree a profile/ownership design preserving the distinct contexts; adding the label directly changes admitted configurations. |
| REVIEW-F4-04 | RB-F4-D4 — complete | The sixteen unit-dividend claims are repaired through existing same-value aliases, forwarded equivalence groups and canonical enriched fallback bundles. | No user decision was required. The 1→3 widening is eliminated while preserving all old admitted request domains and sampling; this completed child is not part of the current backlog. |
| DEC-F5-01 | RB-F5-D1 | Two tenths assignments include both proper 1/10–9/10 and equal-whole 10/10=100/100. | Preserve numerator ten and agree a normal pre-draw magnitude distinction. |
| DEC-F7-01 | RB-F7-D1 | Three nonmixed product magnitude findings vary across multiplier, quantity and product values. | Review supported pre-draw distinctions without choosing a label from one sampled value. |
| DEC-F7-02 | RB-F7-D2 | Two product-story questions show only positive quantities; their solutions add a model with origin zero. | Settle question/solution evidence scope before declaring either zero member. |
| DEC-A1-01 | RB-A1-D1 | The remaining 102 pair contexts admit different primary digit widths inside the same operation/range/zero choices. | Agree ordinary pre-draw width profiles, preserving all supported numerical cases and explicitly assessing distribution changes. No width may be inferred from a sampled payload. |
| DEC-A2-01 | RB-A2-D1 | Twenty-eight positive-pair contexts cannot inherit universal zero absence because compatible number-line projections display origin zero. | Review model/projection ownership while retaining both zero-capable and positive cases. A blanket absence default would be false for some projections. |
| DEC-A5-01 | RB-A5-D1 | Two compensation contexts have small adjustments but variable primary widths; one inverse comparison can ask 24÷12 or 24÷2. | Classify primary operands, not adjustments or hidden relation roles; agree any new pre-draw distinction. |
| DEC-A5-02 | RB-A5-D2 — complete | Two near-doubles width claims are closed by validated configuration inference. The earlier alias prototype preserved production plans but changed legacy extractConfig entropy in 32/128 probes. | Inference now adds only the proved smaller-operand width after ordinary resolution. Both planned and direct paths preserve configuration and entropy; no matching capability is added. |
| DEC-A6-01 | RB-A6-D1 | Six equation/estimation zero cases vary in generated quantities or displayed procedure evidence. | Review ordinary pre-draw cases and the exact participating values; do not choose absence from a positive sample. |
| DEC-A9-01 | RB-A9-D1 | Twenty-five place-value/rounding/power zero findings remain. Four expanded-form cases are now closed by validated configuration inference; their earlier alias prototype changed entropy and could select a wrong zero alias. | The completed low-branch annotation follows positive summands; the high-branch annotation follows a necessarily zero place coefficient. The other 25 still need their projection/model decisions. |
| DEC-A9-02 | RB-A9-D2 | Two borrowing-subtraction width findings are closed by exhaustive configuration inference; four other place-value widths still vary under existing profiles. | Propose normal width choices for the remaining four, with supported-case and sampling comparisons; keep existing range policy unchanged. |
| DEC-A10-01 | RB-A10-D1 | Ten algorithm contexts have varying zero operands, partial products, quotient digits or remainders. | Review explicit mathematical cases and question/solution procedures. Hidden initialization zero and shifted zero glyphs do not establish invariant zero participation. |

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
- Distinct and raw findings, affected selections, repaired/introduced/reopened counts,
  policy-retired/policy-added requirements, assigned deferred subset, and transfers between
  batches, both locally and globally.
- Tests, coverage, replay/rendering evidence as applicable, independent reviewer findings and
  disposition, the checkpoint commit, and the next queued scope or decision.

Globally, `before + introduced + reopened - verified repairs + policy-added - policy-retired = after`.
Within a batch, add transfers in and subtract transfers out. Count each shared fix once globally
and reconcile all affected owner rows. Policy retirement changes an obligation; it does not
repair annotations or a known content defect. Deferred gaps are a subset of outstanding gaps,
never subtracted from that total.

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

### Arithmetic, legacy conversion and preserved quotient choices

The final declaration checkpoint closes **285 existing gaps**: A1 40, A4 24, A5 33, A6 30,
A8 16, A9 37, A10 12, M1 77, and the previously reviewed quotient child 16. It introduces
**15 requirements**: fourteen legacy number-kind findings and one zero finding in a newly
admitted place-value tens model. Global accounting is **722 + 15 - 285 = 452 distinct/raw**,
across 338 selections. There are 1,263 admitted / 848 eligible selections and 1,195 matches;
all 1,013 targets and 1,194 previous matches remain. Conflicts, invalid contexts, contract
errors and incomplete enumerations are zero.

The ALL-catalogue baseline covers every current tuple, not only initially failing generators.
All 1,262 old configurations, 2,524 question/solution probes and 2,808 stored-origin draws
preserve configuration, prepared/generator random states, continuation, payloads and content/
task fingerprints. No annotation is removed. The newly admitted physical tens subtraction
model was reviewed against its full target and both modes; its zero gap remains explicit.
Stored dataset rows, pointer and 4,146 raw stored findings are unchanged.

Widths come from invariants, existing strategy/count/law bundles and qualified aliases for
40 pair plus 14 triple contexts. These qualifiers read unchanged range scopes as mathematical
evidence; they change no bounds, threshold semantics, range labels or range-validation policy.
The added width guards are inert for old unqualified assignments. The three original
property-law rules remain range-free; existing infeasible numeric cases still reach generation
unchanged. The old test now distinguishes these rules from the separate width-truth rule.

Independent review also found three unsafe predicate label fallthroughs in the draft.
They were repaired using existing exact-set mapping aliases/canonical bundles, with regressions
for contradictory pattern zero claims, unqualified triple widths and unqualified tens widths.
No new resolver algorithm or framework was introduced. The quotient repair likewise uses
thirteen legal same-value aliases, eight unchanged profiles and eight canonical fallbacks.
All 152 old normalized request domains and 1,760 old request/entropy probes remain intact.
The two near-doubles cases are excluded because they would violate legacy entropy preservation.

Evidence is under the execution scratch folder: `arithmetic-final-review.md`,
`arithmetic-leak-fixes.md`, `arithmetic-conditional-options.md`, `legacy-parity-review.md`,
`quotient-preservation-options.md`, their saved before/proposed manifests, and
`last-final/{draws.json,comparison.json,audit/}` compared with `last-before/`.
Type, ownership, focused regressions, full coverage, documentation and preservation results
complete this checkpoint. The complete suite passes **841 files / 6,483 tests**, at 98.49%
statements, 97.05% branches, 100% functions and 99.51% lines in the configured coverage scope;
all checked generators clear their thresholds. The audit integration fixture now deliberately
removes width annotations, since its original within-ten omission has been repaired; it retains
exact snapshots of both incomplete input arrays to verify nonmutation. Its final focused run
also passes. Logs: `last-final-types.log`, `last-final-specs.log`, `last-coverage-final.log`,
`last-generator-coverage-final.log`, `last-audit-final-tests.log`, `last-docs.log` and
`last-final/preservation.json`. Documentation has five external-fetch warnings and no errors.
All remaining source findings now have a concrete decision owner;
transferring them does not count as closure.

### Necessary mathematical and notation evidence re-review

Committed as `37ac3001`, starting from `c0cd7a1d`; a fresh audit exactly reproduced the prior final report. Review of
the installed ontology's content-evidence rules corrected an overly literal interpretation
of evidence in three deferred children. Accessible necessary consequences are already
accepted; a new semantic convention or evaluator change is not needed for these cases.

| Child | Supported evidence | Existing gaps closed | Remaining |
|---|---|---:|---:|
| RB-F1-D1 | Explicit Ones=0 table entries, or the necessarily zero Ones response for a proper fraction, in three decimal views | 5 | 3 |
| RB-F9-D2 | Explicit contextual zero reference in four order/magnitude views: 0°C, settled balance or sea-level datum | 7 | 2 |
| RB-M2-D1 | Digital-construction instructions, time clue and digit slots necessarily require Arabic digits and positional decimal components | 10 | 27 |
| **Total** | Eight view invariants; five existing test expectation updates | **22** | **32 in these children** |

The repair adds ordinary declarations only. It does not classify sampled payloads or borrow
an optional solution method as question evidence. A digit zero inside a nonzero numeral
still does not establish an involved numerical zero. Analog reading's generic answer box
still does not require Arabic notation. Earlier scratch reviews that treated `Numerals`
as ineligible were also incorrect: the pinned ontology marks it eligible, but its written-symbol
definition cannot truthfully label an object-only task.

Global accounting is **452 - 22 = 430 distinct/raw gaps**, across 330 selections. Cumulative
progress is **1,307 + 75 - 952 = 430**. All 29 child owners remain active. The audit retains
1,263 admitted / 848 eligible selections, 1,013 targets and 1,195 matches, with no new or
removed matches, conflicts, invalid contexts, contract errors or incomplete enumerations.
All 1,263 old configurations, 2,526 question/solution probes and 2,808 stored-origin draws
preserve configurations, random states and continuation, data and content/task fingerprints.
No existing annotation is removed. Rendering sources, policy and stored dataset are unchanged.

Focused validation passes 20 suites / 120 tests; independent declaration and evidence review,
type and ownership checks pass. Full coverage passes 841 suites / 6,483 tests at 98.49%
statements, 97.05% branches, 100% functions and 99.51% lines; generator thresholds pass.
Documentation passes with the same five external-fetch warnings and no errors. Logs are
`coverage.log`, `generator-coverage.log`, `types.log`, `specs.log` and `docs.log` in the evidence
directory below. The current policy remains unchanged; the
[earlier representation proposal](label-dependency-graph.md#separate-question-representation-completeness)
was an unapproved counterfactual at this checkpoint and contributes no closures to this ledger;
the later plan refinement below supersedes it.

Evidence is in `temp/label-dependency-decisions/`: `before.json`, the zero/digital owned-file
manifests and before copies, `zero-review.md`, `numeral-decision-review.md`, `contract-review.md`,
`verification.json`, and the current exact `deferred.json`. Replay/audit snapshots are
`temp/label-dependency-execution/decisions-before/` and `decisions-after/`; the latter contains
the comparison and complete lineage. Protected unrelated file hashes and the dataset pointer
remain unchanged. No regeneration or VQA was run.

### Decimal equality choice checkpoint

Starting from `37ac3001`, `decimal-place-comparison` adds `NumbersWithZero` to its existing
Equal relation. Every equality payload has a zero thousandths coefficient, and its only
view displays all six named place coefficients in both modes. The old `[Equal]` request
remains a legal same-value alias; three canonical fallbacks retain Greater/Equal/Less values.
The existing exact-set resolver rejects unsupported Greater/Less plus zero requests. No
generator mathematics, sampled profile, rendering, target or evaluator code changes.

This closes **one RB-F2-D1 finding**, with no new findings: **430 - 1 = 429** distinct/raw,
across 329 selections. Cumulative accounting is **1,307 + 75 - 953 = 429**; all 29 child scopes
remain active. The full audit retains 1,263 selections, 848 eligible, 1,013 targets and 1,195
matches, with zero conflicts, invalid contexts, contract errors or incomplete enumerations.
All 1,263 prior configurations, 2,526 Q/S probes and 2,808 stored-origin draws remain identical
apart from the additive label. The additional focused proof preserves 192 ordinary draws,
192 target-based legacy extractions and 768 exhaustive checks over old extractable requests.

The four expanded-form candidates stay within RB-A9-D1 and count as outstanding. Their
zero facts follow from existing range/cardinality choices, but the scratch prototype changes
legacy extraction entropy in 128/192 probes; that API also lacks the planner guard that would
prevent an incorrect low/high zero alias. No prototype change was applied. This is a declaration
mechanism/preservation decision, not permission to reinterpret zero or alter ranges.

The source diff contains one generator spec and its existing tests. Focused tests pass three
suites / 19 tests, including unsupported zero-claim regressions. Independent source review,
type/ownership and whole-catalogue preservation pass. Full coverage passes 841 suites / 6,485
tests at 98.49% statements, 97.05% branches, 100% functions and 99.51% lines; generator thresholds
pass. Documentation passes with five existing external-fetch warnings and no errors. The
`equality-coverage.log`, `equality-generator-coverage.log`, `equality-types.log`,
`equality-specs.log` and `equality-docs.log` record these checks. Evidence: `secondary-owned.json`,
`secondary-before-files/`, `zero-secondary-review.md`, `zero-secondary-proof.json`,
`equality-verification.json` and `equality-deferred.json` under the decisions scratch directory.
The latest audit, replay and comparison are in
`temp/label-dependency-execution/decisions-equality/`, compared with `decisions-after/`.
The representation proposal was unapproved at this checkpoint and contributes no closures. Stored data,
policy and unrelated work are unchanged; regeneration/VQA still wait for source readiness.

### Conditional-dependency plan refinement

Historical documentation-only checkpoint (`ff716c87`).

The user agreed to narrow the overly broad numeral/base requirements first and keep
representation completeness as a separate design question. That plan checkpoint recorded the direction,
conditional base evidence and the required selector/audit verification. It removed the previous
recommendation for a blanket `NumberRepresentation` assessment and marks its counterfactual
counts as superseded. That change was documentation only: graph, evaluator, annotations, targets,
sampling, rendering, Area allowlist and range exclusion were unchanged. All **429 gaps across
29 child scopes** remained at that checkpoint; no policy reclassification or repair was claimed.
Documentation validation and independent scope review passed, with five existing external-fetch
warnings and no errors. All 3,296 paths outside these three plan documents and the dataset
pointer are byte-identical to the pre-edit state. Evidence is in
`temp/label-dependency-policy-plan/`; runtime tests were not rerun for this documentation-only change.

### Narrowed numeral/base dependencies — current implementation checkpoint

The graph now removes `numeralSystem` and `base` from the blanket `LD-NUM-01`
assessments while retaining number kind, range presence, sign and zero. The new
`LD-POSITIONAL-01` requires a base for the evidenced positional representations
`RodNumerals`, `BaseTenBlocks` and `ScientificExponentNotation`, or an involved Area
within `PlaceValue` or `DecimalNotation`. `LD-DECIMAL-01` retains the decimal-number
base requirement. A numeral repertoire alone does not establish positional notation;
the graph adds no mandatory representation label or inferred annotation.

The Area allowlist remains universal over the involved Areas: all must belong beneath
Arithmetic, IntuitiveMathematics or FormalMathematics, and at least one Area must be
present. The integer-only operand-digit gate, other assessments and conflict rules are
unchanged. Range-policy work remains excluded. Representation completeness is a
separate design question, so zero numeral findings do not prove complete numeral labeling.

The same 1,263 source selections, including 848 eligible selections, were reevaluated:

| Measure | Before | After | Accounting |
|---|---:|---:|---|
| Distinct / raw source findings | 429 / 429 | 391 / 391 | 38 policy-retired; zero repairs or new findings |
| Affected source selections | 329 | 311 | Same selection population |
| RB-A3-D1 object-only requirements | 20 | 0 | 10 numeral + 10 base retired |
| RB-A3-D3 reasoning requirements | 8 | 0 | Eight numeral requirements retired; content defect stays open |
| RB-M2-D1 clock requirements | 27 | 17 | Five numeral + five base retired; 17 zero findings remain |
| Stored raw / distinct sample-facet findings | 4,146 / 4,012 | 2,542 / 2,528 | 1,484 distinct requirements policy-retired; zero new findings |
| Stored samples with findings | 1,332 | 1,282 | Same 2,808 stored rows; 1,884 eligible |

The source retirement is **23 numeral + 15 base = 38**. Cumulative verified declaration
repairs remain **953**, with **75** introduced requirements and no reopened requirements:
**1,307 + 75 - 953 - 38 = 391**. Stored distinct retirement is **830 numeral + 654 base
= 1,484**; its raw reduction differs because repeated rule/facet findings are counted
separately. Source and stored findings are separate measurements, not additive backlogs.
The stored results changed only through policy reevaluation; the dataset was not regenerated.

Verification confirms all **4,071** source/stored annotation inputs, **1,195** matched
target/generator/view tuples, targets, selection plans, stored dataset and unrelated work
are unchanged. The policy SHA-256 changes from
`01584d603f3c0b48a0c882f3a0350acc7b0dc511553560e50c390ed52b41122c` to
`de3acb553955484a3f8452b6fb149a079777ba3985f042a113fd23a402a50d1c`.
Evidence is in `temp/label-dependency-narrowing/verification.json`, `policy-retired.json`,
`deferred.json`, the before/after audits and the ontology/accounting reviews in that directory.
Validation passes: **841 suites / 6,517 tests**, type checking and all generator coverage
thresholds. The configured coverage scope has **98.49% statements, 97.05% branches,
100% functions and 99.51% lines**. Documentation checks pass with five existing external-fetch
warnings and no errors. The initial full run identified one obsolete Arabic-only missing-base
fixture; it now declares independent positional evidence and still verifies failure before
retry/fallback. The complete rerun passes. Independent review confirms the ontology selectors,
strict-gate behavior, policy identity, preservation and separate retirement accounting.
All 56 source ledger rows reconcile with the audit, retaining baseline 1,307 and current 391.
All 3,288 baseline paths outside the eleven owned source/test/documentation files, unrelated
Git status and the dataset pointer are unchanged. Logs include `coverage-final.log`,
`generator-coverage.log`, `types.log`, `docs.log`, `verification.log` and `acceptance-review.md`.

Twenty-seven child scopes now own all 391 dependency gaps. RB-A3-D3 separately retains
the known reasoning guarantee defect and must receive a repair or explicit user-approved scope disposition
before source readiness; withdrawing its numeral obligation did not repair it. Together with
the two acceptance batches, **30 scopes remain**. The separate representation-completeness
design topic is not estimated in this count. No rendering, sampling, target, adapter,
automatic-completion or range-policy change is included.

### Configuration inference checkpoint 1 — contract and validation (2026-10-29)

The common `ModuleSpec<TSchema>` now supports `inferredLabels` with schema-derived,
deeply read-only complete configuration. The shared runtime helper validates declared and
returned IDs, eligibility and owner-local declarations; uses an isolated read-only snapshot;
rejects asynchronous callbacks, mutation attempts and random-state access; and preserves
independent rule inputs. It adds no matching capability. Static validation and ownership
discovery include potential outputs without invoking callbacks or treating them as providers.

[SPEC-12](../spec-general.md#spec-12--inferred-annotations-are-a-fallback-without-matching-capabilities)
documents this as a fallback after invariant, existing-choice and explicit-profile alternatives.
Those alternatives support matching; inferred labels deliberately do not. The documentation
also distinguishes pending inference from exhaustively established resolved annotations.

This checkpoint introduces no module callbacks or production integration, so **zero gaps close**.
The fresh audit retains all **391** source requirements, **1,263** selections, **1,195** matches,
and the same **2,808** stored samples. All 4,071 audit subject inputs/evaluations are identical
apart from conservative plan source-identity changes. The recorded baseline includes all
2,526 question/solution draws and 2,808 stored-origin draws for later preservation comparison.

Validation: **843 suites / 6,594 tests pass**, type checking and spec ownership checks pass,
and generator coverage thresholds pass. Configured coverage remains 98.49% statements,
97.05% branches, 100% functions and 99.51% lines. Focused inference-helper coverage is 100%
lines/functions and 97.95% branches. Documentation checks pass with five existing external-fetch
warnings. Independent review found and verified corrections for sparse-array snapshots and
seed inspection. The near-doubles acceptance review also clarified that the module is the owner:
same-owner schema/inference output IDs may repeat and are deduplicated, preserving the existing
make-ten matching capability. Cross-role overlap, generator Ability and existing invariant/schema
restrictions remain enforced. An earlier full run overlapped guard corrections; the stable rerun
above passes. Evidence is in `temp/inferred-labels/` and `temp/label-inference-static/`.
Unrelated working-tree content and the stored dataset remain unchanged.

### Configuration inference checkpoint 2 — resolution, identity and audit (2026-10-29)

Both planned owners resolve their full configurations before independent inference. Direct
generator/view helpers, catalog-loaded instances, orchestration, diagnostics and public replay
carry the owning specs. Cross-role declarations are checked before planned resolution; returned
labels reach the existing combined annotation gate. Prepared browser configuration remains the
rendering input. No inferred output supplies matching capability or participation.

The audit separately records original declarations and `not_required`, `exhaustive`, `pending`
or `invalid` annotation resolution. Only actual output from reviewed complete singleton outcomes
can close a source finding. Unknown/custom resolver outcomes remain pending without speculative
execution, and block readiness. Source/import changes and declared output ontology semantics
invalidate owner artifacts. The pipeline epoch changes; at source readiness an authoritative
`--rebuild-graph` remains required before regeneration/VQA acceptance.

This machinery checkpoint adds no module inference declarations: **391 source gaps remain**.
The full catalog comparison preserves **1,013 targets, 1,195 matches and 1,263 selections**.
All **2,526 question/solution probes** and **2,808 stored-origin draws** have identical resolved
configurations, mathematical payloads, labels, view configuration, fingerprints and random
continuation. Stored annotations and the dataset pointer remain unchanged. The fresh audit
preserves every previous subject evaluation, adding only explicit inference coverage metadata.

Independent integration review found no unresolved runtime/audit issues. Focused tests cover
pending versus exhaustive proof, public replay and question-to-solution reuse, source/helper
identity invalidation, ontology output dependencies, ownership and no matching promotion.
The complete coverage run passes **845 suites / 6,626 tests**, with generator thresholds met;
type, spec ownership and documentation checks pass. A subsequent API review found and corrected
strict-function-variance incompatibility at heterogeneous catalog/matching type boundaries.
Authored specs retain owner-schema typing; the boundary aliases change no matching behavior.
The boundary correction passes **5 focused suites / 48 tests** and type checking; its five
production files transpile to unchanged JavaScript.
Verification artifacts are in `temp/inferred-labels/`, `temp/label-inference-runtime/` and
`temp/label-dependency-inference-preparation/`.

### Configuration inference checkpoint 3 — six acceptance cases (2026-10-29)

The two owner specs now declare configuration-only lambdas, with their existing schemas and
generator mathematics unchanged. Generator classes expose their specs for direct resolution.
No callback inspects generated data, view output, a target or the dependency graph.

| Original finding / owner | Closed | Proof from complete configuration |
|---|---:|---|
| RB-A5-D2 near-doubles | 2 | For maxima 10 and 20, the smaller integer operand `b` satisfies `2b + 1 < maximum`, hence `b <= 9`. The larger operand can be 10, so only the smaller-width label is asserted. Wider or unrelated strategies add nothing. |
| RB-A9-D1 expanded form, legacy branch | 2 | Both two- and three-term expansions require only positive summands, shown in solutions. Zero digits within positive numerals do not establish a separate zero-valued component in that layout. |
| RB-A9-D1 expanded form, larger branch | 2 | At least four displayed place coefficients and exactly two or three nonzero terms guarantee a zero coefficient in both question and solution. Unconstrained high-branch term counts add no claim. |

The owner-specific reasons for using this fallback are recorded in the specs and plan: width
depends jointly on strategy/range, and zero participation on the existing branch/term count.
Invariant or single-choice additions would overclaim; the earlier aliases changed legacy
selection behavior. Existing matching-capable declarations are preserved, including make-ten's
width bundle. These annotations deliberately do not make new target requests match.

The source audit proves **12 exhaustive owner selections**, with **zero pending/invalid**
inference selections. Six actual additions close exactly six original selection/facet findings;
the other six owner selections gain nothing. Original pre-resolution omissions remain visible
through `declaredLabels`. Effective gaps fall **391 → 385**, across **305** affected selections,
with **zero introduced or reopened gaps**. Zero findings are **173**, operand-digit findings
**111**, fraction magnitude **49**, number kind **29**, and sign **23**. There are no conflicts,
invalid contexts, row/contract errors or incomplete enumerations.

The complete before/after comparison preserves all **1,013 targets, 1,195 matches and 1,263
selection assignments**, including selection identities. All **2,526 question/solution probes**
and **2,808 stored-origin draws** preserve configurations, payloads, fingerprints, view inputs and
PRNG continuation; only 24 draw annotation sets gain the expected label. View sources are
unchanged. Six dedicated acceptance tests cover static proof, planned resolution, both modes and
replay; 73 generator/spec tests cover direct helpers, mathematical boundaries and abstention.

Final validation passes **847 suites / 6,653 tests**, type checking, spec ownership and generator
coverage thresholds. Generator coverage is **98.49% statements, 97.05% branches, 100% functions
and 99.51% lines**. A separate focused coverage run for the four new inference/static-audit
libraries reports **96.89% statements, 90.32% branches, 100% functions and 100% lines**.
Documentation checks pass with the existing five external-fetch warnings. Independent review
confirms the mathematical claims and accounting; no unresolved implementation issue remains.

Stored rows remain unchanged at **2,542 raw / 2,528 distinct** non-range findings. These source
closures do not rewrite stored labels or constitute dataset acceptance. The Area allowlist,
integer qualification and range-policy exclusion are unchanged, and representation completeness
remains separate. At this inference checkpoint, source readiness still waited for
**385 deferred gaps in 26 dependency scopes**,
the known reasoning content defect, and the two subsequent acceptance batches (**29 scopes**).
Local audit, draw comparisons and validation evidence are in `temp/inferred-labels/`.

## Decision queue after autonomous declarations

No declaration batch remains untriaged. The eight accepted inference cases and the measurement
split are complete; the remaining 362 require their recorded decisions. The 25 active
dependency child batches account for every outstanding requirement. Their facet totals are:

| Decision facet | Gaps |
|---|---:|
| Zero occurrence, components, model/projection ownership | 173 |
| Integer primary-operand widths | 109 |
| Fraction magnitude and mixed representations | 49 |
| Number-kind/domain/profile ownership | 8 |
| Sign occurrence/domain distinctions | 23 |
| **Total** | **362** |

The narrowed graph has no remaining source numeral/base findings; representation completeness
remains a separate design question. The three configuration-inference checkpoints are complete.
Next resolve question/solution declaration ownership
and ordinary width/model profiles, then fraction magnitude, algebra/domain ownership
and any remaining legacy-API cases. Retain the RB-A3-D3 reasoning content defect
as its own open scope even though the graph no longer reports its retired numeral requirements. These are
reviewable semantic/model or preservation-contract decisions, not permission requests for
routine declaration edits. The source reports provide counterexamples and recommendations.
The ontology already accepts necessarily required answers and meaningful zero references;
do not reopen those as blanket semantic votes. Keep the Area allowlist and range exclusion fixed
when deciding the unresolved model/policy cases. RB-V1/RB-V2 remain
blocked by source readiness, including repair or explicit user-approved scope disposition of the known reasoning
defect; no regeneration, stored-label rewrite or VQA run was performed.

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
