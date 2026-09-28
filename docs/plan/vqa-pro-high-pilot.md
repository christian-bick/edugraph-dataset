# CCSS Pro high-thinking comparison

## Result

On 2026-09-28, `gemini-3.1-pro-preview` at `thinkingLevel: HIGH` evaluated the **same
17 CCSS images** as the [Flash/high pilot](vqa-flash-high-pilot.md). Pro returned **10 passes
and seven failures**, matching Flash's overall pass count but changing eight sample verdicts.
Only **nine** Pro passes have every label defendable. The tenth passes under the current
policy because its previously rejected `Base10` label is now uncertain.

| Measure | Flash 3.5 / HIGH | Pro 3.1 Preview / HIGH |
| --- | ---: | ---: |
| Samples evaluated | 17 | 17 |
| Passes with every label defendable | 10 | 9 |
| Passes with uncertainty | 0 | 1 |
| Failed samples | 7 | 7 |
| Defendable / uncertain / rejected label checks | 138 / 0 / 7 | 134 / 1 / 10 |
| Failed general checks | 0 | 1 |
| Wall time, concurrency 3 | 63.5 s | 99.5 s |
| Median request latency | 9.4 s | 13.5 s |
| Input tokens | 35,376 | 35,376 |
| Answer tokens | 9,801 | 9,743 |
| Thinking tokens | 27,642 | 24,011 |
| Total reported tokens | 72,819 | 69,130 |

There were no API errors, invalid responses, retries, or rate limits. This result does not
demonstrate an improvement from switching to Pro. Both experiments cover selected failures
only, with one observation per image and no known-invalid or passing controls, so they do
not establish overall evaluator accuracy.

The [complete comparison record](vqa-pro-high-pilot.json) preserves every input prompt,
definition, context hash, baseline judgment, Pro response, token count, and per-label change
against both the original cache and Flash/high. No experimental judgment has been promoted.
The official cache remains **1,951 pass / 17 fail / zero uncached** across 1,968 images.

## Identical inputs and independent judgments

The run started from commit `717fe4130abee4b851fcc990f3c9ddb253282aeb`, using the same
`edugraph-ts` version `0.29.0-pre.5.a88ac7a500c5`. Before making any calls, the harness
verified that all sample identities, image bytes, prompts, label definitions, original judgments,
and validation keys exactly matched the committed Flash experiment. It also checked that the
entire request profile differed only in its model field.

The configured endpoint was `gemini-3.1-pro-preview`, the documented Pro 3.1 model supporting
image input, thinking, and structured output.
[Google's model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview).
All responses reported that model version. Thinking was explicitly `HIGH`; the response schema,
pass policy, and all prompt text were unchanged. Pro received neither Flash's judgments nor
the original failure evidence or our classifications.

Concurrency remained **3**, with one request attempt per image and the same four-minute
transport timeout. There was no explicit output-token cap, numerical thinking budget,
temperature, or image-resolution override. Request latency ranged from **10.2 to 34.9 seconds**.
Cached-token usage was not consistently returned and is recorded as unavailable.

## Where the models differ

| Flash/high | Pro/high | Samples |
| --- | --- | ---: |
| Pass | Pass | 6 |
| Fail | Pass | 4 |
| Pass | Fail | 4 |
| Fail | Fail | 3 |

Pro passes the square-cell area question and two vertex-count comparisons that Flash rejected.
It also changes the flat-face comparison question's `Base10` verdict from rejected to uncertain;
that is the fourth pass under the existing policy, but it would not clear a previously rejected
label under the conservative second-stage policy discussed before these experiments.

Conversely, Pro rejects the `7 + 7` question, both fractional equal-copy models, and the
rectangle-versus-circle side comparison that Flash accepted. Both models reject the parity
question and the two time-interval solutions. Both accept the place-value comparison,
cents question, time-interval question, square-cell solution, and two other side comparisons.

The seven Pro failures contain ten rejected label checks: two `Base10`, two `SingleStep`,
two `IteratedOperation`, and one each of `EvenNumbers`, `Formalization`, `AdditiveCount`,
and `NumerationWithIntegers`. The repeated-operation banner on the `7 + 7` question also
fails Pro's `text_minimal` general check. The other **118 general checks pass**.

Semantic inconsistency remains observable in the responses. Pro accepts `Base10` for side
counts of 3 and 0 but rejects it for side counts of 4 and 0. It rejects `EvenNumbers` because
14 is hidden, while its `NumbersSmaller20` evidence explicitly includes that hidden result.
It requires a written repeated-addition expression for the fraction models despite the visible
equal-copy grouping. The recorded involvement statement does not explicitly require a
symbolic repeated-addition expression. These disagreements should not be resolved by simply
accepting whichever model passes each sample.

## Additional review candidates

Pro raised three label objections that neither the original cache nor Flash/high rejected,
plus one general-check objection. These are preserved as **unconfirmed review candidates**,
not automatically classified as defects or waived as evaluator disagreements:

| Image | New objection | Review needed |
| --- | --- | --- |
| `2.OA.C.3-even-equal-addends~88f610cb`, train question | `Formalization` | Pro requires adapting informal notes or presenting an argument, which are illustrative examples rather than exhaustive requirements. Separately check whether completing an already formal equation demonstrates the intended formal-expression capability. |
| Same equal-addend question | `text_minimal` | Pro considers the repeated-addition banner redundant with `7 + 7`. The leaf checklist already recognizes repeated operands as the witness; review whether the caption contributes necessary information under the global text-economy criterion. |
| `2.OA.C.3-object-group-parity~d636d951`, train question | `AdditiveCount` | The task supplies a total of three and asks for an odd/even classification. Review whether countable objects alone establish successive accumulation, as opposed to a counting process actually required or represented by the task. |
| Same parity question | `NumerationWithIntegers` | Pro sees no sequence, order, or magnitude comparison; Flash accepted the collection's integer magnitude. Review the intended boundary between an integer quantity and the numeration competency. |

The unchanged images were inspected during the Flash trial; the new Pro objections were
compared with those images, exact supplied definitions, and both checklists. No generator,
view, target, ontology definition, or checklist was changed in response to this test.
The original cache findings retain their existing classifications, while these additional
candidate objections remain explicit in the experiment's follow-up record.

## Verification and next decision

Before/after hashes confirm unchanged CCSS metadata and all 1,968 images, both dataset
pointers, every CCSS and `test` cache file, and the earlier Flash experiment. Original findings
are preserved; only a separate pilot follow-up is appended. The strict offline audit still
fails solely on the 17 original cached verdicts, with no structural or stale-cache issues.
Documentation checks pass with the same four pre-existing external-reference fetch warnings.
No production code changed, so unit and coverage suites were not rerun for this experiment.

Neither pilot supports automatically treating a stronger model's pass as a final resolution.
The next useful step is to review the additional objections and make the general evaluation
boundaries explicit, then compare candidate evaluators on reviewed valid and invalid controls.
The single uncertain Pro pass should remain open if a later second stage requires affirmative
evidence to overturn a rejected label.
