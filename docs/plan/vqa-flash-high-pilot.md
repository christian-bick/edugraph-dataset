# CCSS Flash high-thinking pilot

## Result

On 2026-09-28, one independent `gemini-3.5-flash` judgment with `thinkingLevel: HIGH`
was requested for each of the **17 remaining CCSS failures**. **Ten passed and seven
failed**. Every label on the ten passing samples was defendable; there were no uncertain
verdicts, newly rejected labels, or failed general checks. All 17 requests succeeded without
retries or rate-limit errors.

This is an isolated experiment. The committed cache remains **1,951 pass / 17 fail /
zero uncached** across 1,968 samples. No trial judgment has been promoted into that cache,
and no failure has been waived. The [original report](ontology-v029-vqa-rerun.md) and
[machine-readable findings](ontology-v029-vqa-findings.json) retain their current verdicts.

The [complete trial record](vqa-flash-high-pilot.json) preserves the input prompts, ontology
statements, image and context hashes, historical judgments, raw response text, policy-applied
evaluations, per-label changes, returned model version, response identifiers, token usage,
and timings. It is an experimental record, not a VQA cache file.

## Method

The baseline is commit `55c3e58b0c9137a7beb249366019e8e357d72bea`, with
`edugraph-ts` version `0.29.0-pre.5.a88ac7a500c5`. The pilot selected all and only the
17 failed sample identities in the current findings. Each rebuilt image/context/policy cache
key exactly matched its existing judgment before any request was made.

The harness reused `buildVqaPromptParts`, `buildVqaValidationContext`,
`VQA_RESPONSE_SCHEMA`, and `applyVqaValidationPolicy` from the existing library.
Each request contained the same canonical image, mode, full involvement statements and
comments, global checklist, leaf checklist, system instruction, and response schema.
Neither the previous verdict nor our disagreement classification was sent to the model.
Only the model's thinking configuration changed:

```ts
model: 'gemini-3.5-flash',
config: {
    systemInstruction: prompt.systemInstruction,
    responseMimeType: 'application/json',
    responseJsonSchema: VQA_RESPONSE_SCHEMA,
    thinkingConfig: {thinkingLevel: ThinkingLevel.HIGH}
}
```

Google documents `HIGH` as the highest supported level and `MEDIUM` as the default for
Gemini 3.5 Flash. The baseline source did not specify a thinking level.
[Google's thinking documentation](https://ai.google.dev/gemini-api/docs/generate-content/thinking).
Historical cache records do not record the actual served model version, thinking setting,
usage, or latency, so those baseline response properties cannot be verified retrospectively.

Concurrency was **3**. The pilot permitted one request attempt per image, with a four-minute
transport timeout and no semantic retries. It did not set an output-token cap, numerical
thinking budget, temperature, or media-resolution override. All trial responses reported
model version `gemini-3.5-flash`.

## Comparison

| Previously disputed claim | Samples | Trial passes | Trial failures |
| --- | ---: | ---: | ---: |
| `Base10` on shape-attribute counts | 6 | 3 | 3 |
| `Base10` on the parity question | 1 | 0 | 1 |
| `SingleStep` on time-interval tasks | 3 | 1 | 2 |
| `Square` on unit-cell arrays | 2 | 1 | 1 |
| `IteratedOperation` on fraction models | 2 | 2 | 0 |
| `NumbersWithoutZero` on place-value comparison | 1 | 1 | 0 |
| `Dollar` on a cents question | 1 | 1 | 0 |
| `EvenNumbers` on equal addends | 1 | 1 | 0 |
| **Total** | **17** | **10** | **7** |

The ten changed judgments now accept the relevant distinctions: zero digits versus separate
zero-valued quantities, cents within a dollar currency, the hidden even result of `7 + 7`,
equal copies as iterated addition, and unit squares as area evidence. One time question is
accepted as a single start-time-plus-duration transformation. Three shape comparisons accept
ordinary single-digit decimal numerals as base-ten representations.

The seven remaining rejections repeat the existing disagreements. Four still require explicit
multi-digit or place-value work for `Base10`; two count crossing an hour boundary as an extra
step; one restricts `Square` to the outer rectangle rather than its square cells.

The responses remain inconsistent across similar tasks. For example, `Base10` passes on
side counts of 3 and 0, but fails on vertex counts of 6 and 0. The square-cell solution passes,
while the corresponding question with the same measurement model fails. The accepted time
question also crosses an hour boundary, as both rejected solutions do. These examples support
continued evaluator investigation rather than changing the exercises to satisfy this trial.

All 17 images and the changed/repeated rejection evidence were inspected after the trial.
One passing explanation loosely attributes the general evenness of doubling to the equal-addend
banner; the banner only states that the same addend is used twice. The hidden result 14 still
provides the relevant mathematical evidence. One fractional-multiplication response contains
escaped control characters in place of a multiplication glyph in its evidence text; the original
response is preserved without correction. Neither issue changes the recorded label verdicts.

## Usage and verification

- **145 label checks:** 138 defendable, zero uncertain, seven not defendable.
- **119 general checks:** all pass.
- **17 requests:** zero API errors, invalid responses, retries, or rate limits.
- **63.5 seconds** wall time at concurrency 3; median request latency **9.4 seconds**,
  range **4.9–17.2 seconds**.
- Reported usage: **35,376 input**, **9,801 answer**, and **27,642 thinking tokens**;
  **72,819 total tokens**. Cached-token counts were not returned consistently and are
  recorded as unavailable, not zero. There is no historical usage baseline for comparison.
- Before/after hashes confirm unchanged CCSS metadata and all 1,968 images, both dataset
  pointers, and every CCSS and `test` VQA cache file.
- The strict offline CCSS audit still exits 1 solely for the original 17 failed judgments;
  no structural, renderer, missing, stale, duplicate, malformed, or obsolete-cache issues.
- Documentation checks pass, with the same four pre-existing external-reference fetch warnings.
  Result totals and unchanged original findings were independently checked against the baseline.
- No production implementation, prompt, schema, ontology, generator, view, or target changed.
  The experiment adds documentation and result records, so unit/coverage tests were not rerun.

This first pilot deliberately covers existing failures only. It has no passing or known-invalid
controls and only one observation per case. The observed 10/17 reversal rate is not an accuracy
estimate, and it does not separate increased thinking from ordinary rerun variability or a
possible change in the served model version. Higher thinking is promising, but does not by
itself resolve the remaining semantic inconsistency. A subsequent comparison with Pro/high
and reviewed control cases would be useful before adopting a production review policy.
