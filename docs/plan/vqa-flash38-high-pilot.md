# CCSS Flash 3.8 high-thinking comparison

## Result

On 2026-09-28, `gemini-3.8-flash` evaluated the **same 17 CCSS images** as the
[Flash 3.5](vqa-flash-high-pilot.md) and [Pro 3.1](vqa-pro-high-pilot.md) pilots,
using its highest supported thinking level. All **17 pass under the existing policy**:
**15 have every label defendable**, and **two have one uncertain label each**.
No label is rejected, and all 119 general checks pass.

| Measure | Flash 3.5 / HIGH | Pro 3.1 Preview / HIGH | Flash 3.8 / HIGH |
| --- | ---: | ---: | ---: |
| Samples evaluated | 17 | 17 | 17 |
| Passes with every label defendable | 10 | 9 | **15** |
| Passes with uncertainty | 0 | 1 | **2** |
| Failed samples | 7 | 7 | **0** |
| Defendable / uncertain / rejected label checks | 138 / 0 / 7 | 134 / 1 / 10 | **143 / 2 / 0** |
| Failed general checks | 0 | 1 | **0** |
| Wall time, concurrency 3 | 63.5 s | 99.5 s | **58.8 s** |
| Median request latency | 9.4 s | 13.5 s | **7.4 s** |
| Input tokens | 35,376 | 35,376 | 35,376 |
| Answer tokens | 9,801 | 9,743 | 8,932 |
| Thinking tokens | 27,642 | 24,011 | 27,694 |
| Total reported tokens | 72,819 | 69,130 | 72,002 |

This is the strongest agreement with the reviewed cases among the three trials. It does not
establish overall accuracy: the set contains selected original failures, has no known-invalid
or passing controls, and each model has only one observation per image.

The [complete experiment record](vqa-flash38-high-pilot.json) preserves exact inputs,
historical judgments, raw responses, per-label evidence, usage, timing, and comparisons with
both earlier models. All experiments remain separate from the official cache, which still
contains **1,951 pass / 17 fail / zero uncached** across 1,968 CCSS images.

## Maximum reasoning setting and controlled inputs

The requested maximum reasoning setting was implemented as
`thinkingConfig: {thinkingLevel: ThinkingLevel.HIGH}`. Flash 3.8 supports `low`,
`medium`, and `high`; `HIGH` is its maximum supported level and allocates thinking
dynamically. There was no explicit numerical `thinkingBudget` or output-token cap.
[Google's model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
and [thinking guide](https://ai.google.dev/gemini-api/docs/generate-content/thinking).
This setting allows maximum reasoning depth but does not force a fixed number of thinking tokens.

The run began at commit `258d8dfa11d23aac2dc07963f0bae1d2356017c6`, retaining
`edugraph-ts` version `0.29.0-pre.5.a88ac7a500c5`. Before the calls, the harness verified
exact equality with both earlier experiments for sample identities, canonical image hashes,
prompts, label definitions, original judgments, and validation keys. The entire request profile
matched each previous trial except for the model field.

Each independent request contained the same image, mode, full involvement statements and
comments, leaf checklist, global checklist, system instruction, and response schema. Flash 3.8
received no earlier verdicts, failure explanations, or manual classifications. The existing
`applyVqaValidationPolicy` was applied without modification; it permits uncertain labels.

Concurrency remained **3**, with one request attempt per image, the same four-minute transport
timeout, and no temperature or media-resolution override. Every response reported model version
`gemini-3.8-flash`. All 17 calls succeeded without retries, rate limits, or malformed responses.
Individual requests took **6.1–26.9 seconds**. Cached-token counts were not consistently returned
and are recorded as unavailable rather than zero.

## Evidence and remaining uncertainty

Flash 3.8 consistently accepts all seven disputed `Base10` claims, including single-digit
shape counts and the parity question. It also accepts both square-cell models, both equal-copy
fraction models, the cents denomination, and the distinction between zero digits and separate
zero-valued quantities. Fifteen original rejections become defendable; the other two become
uncertain:

| Image | Uncertain label | Model's explanation |
| --- | --- | --- |
| `2.OA.C.3-even-equal-addends~88f610cb`, train question | `EvenNumbers` | The visible addends are odd, while the necessarily even hidden sum of 14 supplies indirect evidence. |
| `3.MD.A.1-time-interval-word-problems~2cc9b380`, train solution | `SingleStep` | The displayed `45 + 41 = 86` is one arithmetic step, but converting 86 minutes after 5:00 to 6:26 requires hour regrouping. |

Both samples pass the current policy. They would remain open under the previously discussed
conservative second-stage policy that requires affirmative evidence to overturn a rejected label.
The other time-interval solution, `42 + 32 = 74` followed by 9:14, receives a defendable
`SingleStep` verdict despite also crossing an hour boundary. That difference means the
step-granularity interpretation is still not completely consistent.

Against each earlier model, Flash 3.8 retains all ten passes and changes all seven failures
to passes. One earlier fully defendable Flash 3.5 result (`EvenNumbers`) becomes uncertain,
so the higher sample pass count should not obscure individual changes in confidence.

Flash 3.8 accepts the three additional labels questioned by Pro: it cites formal equation
formatting for `Formalization`, partitioning a collection item by item for `AdditiveCount`, and
enumerating integer quantities for `NumerationWithIntegers`. Its text-economy check also passes
the repeated-addition banner. These different judgments are preserved alongside Pro's evidence;
they do not by themselves settle the four [review candidates](vqa-pro-high-pilot.md#additional-review-candidates).
In particular, the image presents an already partitioned collection; an item-by-item process is
an interpretation of that representation, not a depicted sequence of actions.

The response evidence was checked against the unchanged images inspected in the first trial,
the supplied definitions, and the earlier judgments. No content or ontology change was made.

## Verification and next decision

Before/after hashes verify unchanged CCSS metadata and all 1,968 images, both dataset pointers,
every CCSS and `test` cache file, and both earlier machine-readable experiment records.
Original cached findings and classifications remain intact; only a new experiment follow-up
is appended. The strict offline audit still exits 1 solely for the 17 original cached failures,
with no structural, renderer, stale, missing, duplicate, malformed, or obsolete-cache issues.
Documentation checks pass with the same four pre-existing external-reference fetch warnings.
No production code changed, so unit and coverage suites were not rerun for this experiment.

Flash 3.8/HIGH is the leading candidate from these observations. A reviewed control set containing
both valid and defective examples is still needed before choosing a production evaluator or
automatic escalation policy. The two uncertain outcomes and Pro's additional review candidates
remain explicit; this experiment does not promote judgments or waive failures.
