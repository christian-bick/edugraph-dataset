# Flash 3.8 LOW / HIGH VQA

Implemented and deployed to the CCSS cache on 2026-09-28. All **1,968 samples pass**
the strict offline audit, with zero uncached samples or audit issues. Source commit:
`675ffc6`; cache commit: `f456d4d`.

## Implementation plan

Use `gemini-3.8-flash` with explicit LOW thinking for each fresh evaluation. When
the existing pass policy rejects that response, request one independent HIGH
evaluation of exactly the same image, prompt, and response schema. HIGH receives
no earlier verdict. Its complete evaluation becomes the final decision; uncertain
labels keep their existing passing semantics and remain visible in reports.

Store both judgments, requested settings, served model version, request identity,
latency, and available usage in the cache. Persist LOW before HIGH so interrupted
reviews can resume. API and malformed-response errors are not semantic verdicts.
A completed HIGH failure is cached and never repeatedly reviewed automatically.
Strict offline audit must verify that the effective verdict agrees with the
recorded stages. Historical single-stage records remain valid without fabricated
model provenance; evaluator machinery does not change graph-owned cache keys.

Use three concurrent samples by default. Add an explicit `--retry-failed` option
to re-evaluate failed cached samples while retaining valid passing coverage;
`--force` continues to re-evaluate the entire selected scope. Normal runs resume
unfinished HIGH reviews. Report request errors separately and preserve progress
for other samples.

Verify stage transitions, independent requests, cache reuse, interrupted reviews,
malformed responses, strict audit consistency, and report uncertainty. Run the
complete coverage gate and repository checks. Then revalidate the 17 outstanding
CCSS failures with the production evaluator at concurrency three, audit all 1,968
samples, preserve the original evidence and unresolved review candidates, and
update the original report. Dataset images and the `test` dataset remain outside
this change. Commit implementation and results separately, then push the branch.

## Results

Implementation is complete. `npm run test:coverage` passed 3,576 tests in 550 files,
and every generator met the coverage gate. The final focused suite passed 80 tests;
the six touched library modules have 97.25% statement and 90.29% branch coverage.
The new review module has 100% statement, branch, function, and line coverage.
CCSS repository checks and the final TypeScript check pass. Documentation checks
pass with the same four existing external-reference fetch warnings.

The production command was:

```sh
npm run validate:dataset -- --spec=ccss --rebuild-graph --retry-failed --concurrency=3
```

It re-evaluated the 17 outstanding failures and retained 1,951 earlier passing records.
Every fresh LOW judgment passes with all labels defendable, so no HIGH request occurred.
The live results therefore exercise LOW and cache integration; unit tests exercise
semantic escalation, HIGH acceptance/rejection, interruption/resume, and malformed
responses. The earlier independent HIGH pilot remains unchanged.

| Measure | Result |
| --- | ---: |
| Fresh LOW evaluations / passes | 17 / 17 |
| HIGH evaluations | 0 |
| Defendable / uncertain / rejected labels in fresh judgments | 145 / 0 / 0 |
| General checks passed | 119 / 119 |
| Exposed request errors | 0 |
| Median request time | 3.36 seconds |
| Request-time range | 2.36–15.89 seconds |
| Input tokens | 35,376 |
| Answer tokens | 8,891 |
| Total reported tokens | 46,505 |
| Dataset pass / fail / uncached | 1,968 / 0 / 0 |
| Historical passing samples with an uncertain label | 8 |

All responses report `gemini-3.8-flash`. Thinking-token metadata is present in seven
responses, totaling 2,238 reported tokens; the other ten omit that field. Cached-token
metadata is absent in every response. Missing fields are not recorded as observed zeros.
SDK transport retries are not instrumented, so zero exposed errors is not a claim of
zero internal retries. Live request processing spans approximately 25.83 seconds,
excluding graph verification and cache/report work.

The [machine-readable rollout record](vqa-two-stage-evaluation.json) preserves every
previous rejection, new judgment, stage setting, usage field, and request identity,
with a hash-bound reference to the unchanged pilot inputs. No pilot verdict was
promoted. The [original report](ontology-v029-vqa-rerun.md) and
[findings history](ontology-v029-vqa-findings.json) now contain zero active failures
and 75 resolved historical records: 55 passing revalidations and 20 retired identities
with corrected, passing replacements. Prior evidence is preserved.

Full before/after verification proves unchanged metadata and all 1,968 canonical images,
both dataset pointers, all 1,951 earlier passing records, every `test` cache file, and
all three prior experiment records. Churn reports zero identity, image, seed or attempt
changes. The strict audit verifies all current images and cache records with zero issues.
No content edits or new major operational problems were needed.

These results do not measure overall accuracy: the selected cases have no known-invalid
controls. LOW's clear verdicts also differ from the two uncertain outcomes in the earlier
HIGH pilot, illustrating judgment variation. The eight historical uncertain passes remain
visible in the generated report. Pro's four unconfirmed review candidates
(`Formalization`, `AdditiveCount`, `NumerationWithIntegers`, and repeated-addition caption
economy) remain open; this evaluator rollout does not resolve those questions by consensus.

The transport settings permit three SDK attempts for transient request failures,
with a four-minute timeout. This is separate from the single semantic HIGH review;
invalid model output is not retried automatically. Successful stage records contain
the usage returned by Google; omitted usage fields mean unavailable, not zero.

The chosen thinking levels follow [Google's Flash 3.8 model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
and [thinking guide](https://ai.google.dev/gemini-api/docs/generate-content/thinking).
HIGH allocates thinking dynamically and does not force a fixed token expenditure.
