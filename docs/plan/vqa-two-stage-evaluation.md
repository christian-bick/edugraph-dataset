# Flash 3.8 LOW / HIGH VQA

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
CCSS repository checks and the final TypeScript check pass. Live validation is next.

The transport settings permit three SDK attempts for transient request failures,
with a four-minute timeout. This is separate from the single semantic HIGH review;
invalid model output is not retried automatically. Successful stage records contain
the usage returned by Google; omitted usage fields mean unavailable, not zero.

The chosen thinking levels follow [Google's Flash 3.8 model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
and [thinking guide](https://ai.google.dev/gemini-api/docs/generate-content/thinking).
HIGH allocates thinking dynamically and does not force a fixed token expenditure.
