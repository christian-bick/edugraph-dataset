# Label dependency repair progress

Prepared on 2026-10-28 on `codex/label-dependency-audit`, using the working tree at
`d0beb699fff574f550519b4fa3bf8acf398454ec`. This ledger tracks the remaining work under the
[autonomous execution agreement](label-dependency-graph.md#autonomous-execution-agreement-2026-10-28)
and [batch roadmap](label-dependency-graph.md#remaining-batch-roadmap).

**Execution started: RB-A3's supported declarations are implemented.** RB-F1 is next, followed
by RB-F6 and RB-F10, with early decision review for RB-D1, RB-A7 and RB-M1. Counts below
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
| Outstanding source gaps | 1,306 |
| Queued or not yet triaged | 1,267 |
| Assigned to deferred decision batches (subset of outstanding) | 39 |
| Verified closed / introduced / reopened | 25 / 24 / 0 |
| Known decision topics | 6 |

The three original topics remain open; RB-A3 adds three concrete child scopes below.
Deferred gaps remain included in the outstanding total.

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
| RB-D1 | Symbolic and substituted algebra expressions | 56 | 56 | 0 | Queued |
| RB-D2 | Numerical expressions and powers | 44 | 44 | 0 | Queued |
| RB-F1 | Decimal notation, comparison and transcription | 35 | 35 | 0 | Queued — next |
| RB-F2 | Decimal operations and place-value zero | 14 | 14 | 0 | Queued |
| RB-F3 | Fraction arithmetic and benchmark estimation | 133 | 133 | 0 | Queued |
| RB-F4 | Fraction division and quotient projections | 177 | 177 | 0 | Queued |
| RB-F5 | Fraction equivalence and whole/tenths projections | 49 | 49 | 0 | Queued |
| RB-F6 | Fraction comparison and number lines | 40 | 40 | 0 | Queued |
| RB-F7 | Fraction products and scaling | 40 | 40 | 0 | Queued |
| RB-F8 | Rational number-line representations | 40 | 40 | 0 | Queued |
| RB-F9 | Signed rationals, order, magnitude and opposites | 54 | 54 | 0 | Queued |
| RB-F10 | Ratios, rates and percentages | 30 | 30 | 0 | Queued |
| RB-M1 | Legacy conversion profiles and shared consumers | 84 | 84 | 0 | Queued |
| RB-M2 | Clock reading and construction | 46 | 46 | 0 | Queued |
| RB-M3 | Elapsed time and interval arithmetic | 24 | 24 | 0 | Queued |
| RB-M4 | Length measurement and unit relations | 22 | 22 | 0 | Queued |
| **Total: 29 source batches** | | **1,307** | **1,306** | **39** | |

| Acceptance batch | State | Entry condition |
|---|---|---|
| RB-V1 — Source readiness and canonical refresh | Waiting for readiness | Zero non-range source gaps, including deferred/new obligations; no conflicts, invalid contexts, contract errors or incomplete enumerations. |
| RB-V2 — VQA and stored acceptance | Waiting for refreshed dataset | Successful RB-V1, then necessary VQA refresh and strict stored annotation, image and coverage checks. |

The original baseline remains **28 batches including acceptance**; three explicit child scopes
bring the current inventory to **31**. Splitting does not close gaps. Verified closure and newly
introduced requirements are the primary progress measures.

## Decision topics

These topics refer to existing batch ownership. They are not extra batches or duplicate gap
counts. Create a deferred child only with an explicit affected selection/facet list and
before/after lineage. Preserve independent provable portions in the parent batch.

| Topic | Owner | Evidence and unresolved decision | Next preparation within the batch |
|---|---|---|---|
| DEC-ALG-01 | RB-D1 | Explicit rational domains, hidden bindings and visible coefficients provide different evidence. `3 + x`, `3 / x` with a nonzero restriction, and a displayed zero or negative coefficient must not inherit one occurrence claim. | Review the [algebra decision note](label-dependency-graph.md#algebra-establish-the-numerical-context-of-each-projection). Base10 is a candidate for 14 of 56 gaps; classify the other 42 per projection before assigning a deferred count. Recommend any needed semantic clarification or pre-draw model distinction with its scope effects. |
| DEC-PAR-01 | RB-A7 | Count 2 gives group size 1/remainder 0; count 1 gives 0/1; count 3 gives 1/1. Oddness alone cannot justify zero absence. | Review the [parity decision note](label-dependency-graph.md#parity-retain-singleton-even-and-larger-odd-cases). Compare explicit even/singleton-odd/larger-odd model cases and producer ownership while retaining all supported counts and targets. Both current gaps are in scope; record the concrete implementation decision before assigning the deferred child. |
| DEC-CONV-01 | RB-M1 | Legacy and explicit integer profiles differ despite both involving whole quantities. Shared consumers can gain new requirements; the documented counterfactual closes 84 old assessments but introduces 17. | Review the [conversion decision note](label-dependency-graph.md#deferred-conversion-decision--cover-legacy-profiles-and-shared-consumers). Assess a truthful profile distinction and declaration ownership, including `measurement-unit-scale` and currently gap-free derivation consumers. Document schema/resolver and coverage effects before proposing a design. |
| DEC-A3-01 | RB-A3-D1 | Twenty numeral/base requirements belong to object-only counting conservation, counting comparison/matching and sorting-extremum tasks. Neither mode shows count numerals; the ontology explicitly distinguishes numerals from object quantities. | Decide the dependency applicability or representation contract; ArabicNumerals/Base10 cannot be added from hidden counts. No gate or rendering change is made here. |
| DEC-A3-02 | RB-A3-D2 | Eleven writing zero requirements span six projections. The producer owns `requireZero`; its positive branch feeds a number-line projection with visible origin zero. View-owned zero invariants overlap the producer schema under SPEC-8/SPEC-11. | Review a normal pre-draw declaration ownership contract that preserves positive/explicit-zero configurations and all projections. The attempted number-line zero additions were withdrawn after ownership validation; the two arithmetic zero gaps remain in RB-A2. |
| DEC-A3-03 | RB-A3-D3 | Eight existing reasoning numeral gaps are deferred because declaring ArabicNumerals would also admit unsafe new matches. Generator seed 92 with Addition+Addition and range 0..100 produces 23+32+45=100; view seed 1 renders proposed answer 200. | Agree a repair for the existing projection/compatibility guarantee before enabling those matches. Preserve targets and range policy. The proposed reasoning declaration and test edit were fully withdrawn. |

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
is the commit adding this section. Next queued batch: RB-F1.

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
