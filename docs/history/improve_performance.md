# Performance safeguards and follow-ups

The generation, matching, coverage, and validation performance migration is complete for the
supported development paths. This file retains its performance contract and deferred opportunities,
not the completed implementation log. Current architecture and commands are documented in
[DOCS.md](../../DOCS.md#specs-and-the-union-dataset).

## Performance contract

1. Every generation and validation task must scale linearly.
2. Development tasks must be processable as a delta of content changes.
3. External changes must use reliable record-, entity-, or relation-level deltas. During development,
   retain the pinned input and report why an external update was ignored when its delta cannot be
   established reliably.

Linear means `O(input records + dependency edges + necessary output)`. Exhaustive rejection
diagnostics may have larger output, but must be explicit and separate from production matching.
Use work-counter growth tests, not timing alone, to establish complexity.

Reuse the shared dependency graph and its content identities rather than adding a second
invalidation system. Release verification remains a complete linear pass. Ordinary generator/view
implementation changes use the affected closure; capability, structure, and ambiguous changes
currently fall back to one authoritative linear graph build.

False cache hits are correctness defects; avoidable false misses are performance defects. Reuse
requires complete input identity and verified output integrity. Publication must remain atomic,
and failed work must leave the previous dataset intact. Machinery changes require the explicit
rebuild/reset workflow in [DOCS.md](../../DOCS.md#rules-that-keep-invalidation-minimal).

## Deferred opportunities

- [ ] **Immutable-store retention.** Review reachability-based cleanup for the dataset store and
  explorer asset pool. Existing explorer snapshot pruning is not a general blob-retention policy.
  Preserve everything reachable from current or intentionally retained manifests, provide a dry-run
  report, and delete only unreachable artifacts after a retention window. Cleanup must not determine
  cache validity or require clearing an entire cache.
- [ ] **Finer target-file ownership, if measured costs justify it.** Existing generator/view source
  changes have a fast path; target/spec structure and capability changes retain a complete linear
  planning boundary. Consider finer ownership postings only if those rebuilds become material.
- [ ] **Field-origin provenance, if useful for review.** A field-to-view read index could improve
  payload audit explanations. It must reuse compatible-pair and production-tuple indexes and stay
  linear in source size and graph edges. It is not required to complete the payload migration.

These are separate maintenance or research opportunities, not reasons to reopen completed
migrations. Evaluate them against current measurements before scheduling implementation.
