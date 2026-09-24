# Label-variant integration follow-ups

The matching/generation implementation is merged through [PR #1](https://github.com/christian-bick/edugraph-dataset/pull/1), commit `56fe94f`. Its design and validation evidence remain in [label-variant-matching.md](label-variant-matching.md).

Follow-up order agreed on 2026-09-24:

1. **Integrate the feature.** Completed. Independent planner and persistence reviews found one bulk VQA cache-provenance issue, fixed before merge. Thirty focused tests pass with 100% evaluator line/function coverage; invalid row recipes fail before writes and strict audit remains read-only. GitHub's main validation and automatic explorer deployment both passed.
2. **Roll out the persisted formats.** Completed in the main checkout: canonical generation published 1,936 CCSS and 1,686 test images without rendering failures. All 3,622 image hashes and VQA keys match the verified feature-worktree baseline. An unchanged `--spec=test --affected` run proved clean inputs and skipped Docker startup entirely.
3. **Repair numeric feasibility.** Implemented and independently reviewed. The two under-20 arithmetic-estimation routes retain their target labels and now generate across 50 seeds each. The payload carries canonical `numberDomain` context; generator values, proposed answers, and displayed rounded values respect both bounds. Existing valid `0..1000` draws retain their sampling path. The sole consumer is adopted. Fifty-six focused tests pass; the generator has 100% line and 93.33% branch coverage, and type checking passes. Canonical regeneration and full production VQA follow before integration.
4. **Validate the complete production dataset.** Reuse exact passing image/context judgments, obtain Gemini judgments for missing or changed records, refresh every active recipe, prune obsolete records, and require the strict read-only audit and split checks to pass. Diagnose actual failures before changing code or rerunning judgments.
5. **Investigate dataset coverage last.** Distinguish truly exhausted mathematical spaces from retry/allocation defects. Preserve train/validation separation and truthful labels. Coverage warnings alone do not justify changing the agreed sample-count policy or fabricating target evidence.

Numeric changes and visual-validation fixes are separate from the completed matcher design. A local dataset rollout does not create a release tag or publish a new Hugging Face dataset.
