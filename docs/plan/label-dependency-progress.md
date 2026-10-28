# Label dependency repair progress

Prepared on 2026-10-28 on `codex/label-dependency-audit`, using the working tree at
`d0beb699fff574f550519b4fa3bf8acf398454ec`. This ledger tracks the remaining work under the
[autonomous execution agreement](label-dependency-graph.md#autonomous-execution-agreement-2026-10-28)
and [batch roadmap](label-dependency-graph.md#remaining-batch-roadmap).

**Ready for repair execution; no remaining repair batch has started.** RB-A3 is next, followed
by RB-F1, RB-F6 and RB-F10, with early decision review for RB-D1, RB-A7 and RB-M1. Counts below
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
| Outstanding source gaps | 1,307 |
| Queued or not yet triaged | 1,307 |
| Assigned to deferred decision batches (subset of outstanding) | 0 |
| Verified closed / introduced / reopened | 0 / 0 / 0 |
| Known decision topics awaiting batch triage | 3 |

Zero assigned-deferred gaps means classification has not started. It does not mean all gaps
can be fixed through declarations. The three known topics below remain open.

## Source batch ledger

Every baseline selection/facet gap has exactly one owner. All rows initially have zero
closed, introduced, reopened and assigned-deferred gaps. Record those movements and evidence
in the checkpoint log when a batch is processed; update current counts and row state here.
The roadmap contains each scope's uncertainties and generator inventory.

| Batch | Scope | Baseline gaps | Current gaps | Deferred subset | State |
|---|---|---:|---:|---:|---|
| RB-A1 | Binary arithmetic operand widths | 118 | 118 | 0 | Queued |
| RB-A2 | Binary arithmetic zero participation | 28 | 28 | 0 | Queued |
| RB-A3 | Elementary numeral/base and number views | 64 | 64 | 0 | Queued — next |
| RB-A4 | Three- and four-operand arithmetic | 24 | 24 | 0 | Queued |
| RB-A5 | Arithmetic strategies and property relations | 38 | 38 | 0 | Queued |
| RB-A6 | Patterns, estimation and equation-zero contexts | 36 | 36 | 0 | Queued |
| RB-A7 | Parity grouping and zero classification | 2 | 2 | 0 | Queued |
| RB-A8 | Counting offsets, equal groups and arrays | 16 | 16 | 0 | Queued |
| RB-A9 | Place value, rounding and powers of ten | 71 | 71 | 0 | Queued |
| RB-A10 | Written algorithms and division models | 22 | 22 | 0 | Queued |
| RB-D1 | Symbolic and substituted algebra expressions | 56 | 56 | 0 | Queued |
| RB-D2 | Numerical expressions and powers | 44 | 44 | 0 | Queued |
| RB-F1 | Decimal notation, comparison and transcription | 35 | 35 | 0 | Queued |
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
| **Total: 26 source batches** | | **1,307** | **1,307** | **0** | |

| Acceptance batch | State | Entry condition |
|---|---|---|
| RB-V1 — Source readiness and canonical refresh | Waiting for readiness | Zero non-range source gaps, including deferred/new obligations; no conflicts, invalid contexts, contract errors or incomplete enumerations. |
| RB-V2 — VQA and stored acceptance | Waiting for refreshed dataset | Successful RB-V1, then necessary VQA refresh and strict stored annotation, image and coverage checks. |

The baseline remains **28 batches including acceptance**. Splitting a scope can increase that
number without increasing the gap count; verified closure is the primary progress measure.

## Decision topics awaiting triage

These topics refer to existing batch ownership. They are not extra batches or duplicate gap
counts. Create a deferred child only with an explicit affected selection/facet list and
before/after lineage. Preserve independent provable portions in the parent batch.

| Topic | Owner | Evidence and unresolved decision | Next preparation within the batch |
|---|---|---|---|
| DEC-ALG-01 | RB-D1 | Explicit rational domains, hidden bindings and visible coefficients provide different evidence. `3 + x`, `3 / x` with a nonzero restriction, and a displayed zero or negative coefficient must not inherit one occurrence claim. | Review the [algebra decision note](label-dependency-graph.md#algebra-establish-the-numerical-context-of-each-projection). Base10 is a candidate for 14 of 56 gaps; classify the other 42 per projection before assigning a deferred count. Recommend any needed semantic clarification or pre-draw model distinction with its scope effects. |
| DEC-PAR-01 | RB-A7 | Count 2 gives group size 1/remainder 0; count 1 gives 0/1; count 3 gives 1/1. Oddness alone cannot justify zero absence. | Review the [parity decision note](label-dependency-graph.md#parity-retain-singleton-even-and-larger-odd-cases). Compare explicit even/singleton-odd/larger-odd model cases and producer ownership while retaining all supported counts and targets. Both current gaps are in scope; record the concrete implementation decision before assigning the deferred child. |
| DEC-CONV-01 | RB-M1 | Legacy and explicit integer profiles differ despite both involving whole quantities. Shared consumers can gain new requirements; the documented counterfactual closes 84 old assessments but introduces 17. | Review the [conversion decision note](label-dependency-graph.md#deferred-conversion-decision--cover-legacy-profiles-and-shared-consumers). Assess a truthful profile distinction and declaration ownership, including `measurement-unit-scale` and currently gap-free derivation consumers. Document schema/resolver and coverage effects before proposing a design. |

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
