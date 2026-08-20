# Implementation Rules — Generator

Rules for `generator.ts` and its test suites: the abstract math engine.

**Applies to:** `src/generators/[<category>/]<module>/generator.ts`, `generator.test.ts`, `spec.test.ts`
**Read with:** [implementation-general.md](implementation-general.md), [spec-generator.md](spec-generator.md)
**Verify with:** `npm run test`, `npm run check:types`

---

## Rules

### IMPL-G1 — A pure mathematical function, with no label parsing

`generator.ts` implements `ProblemGenerator<TData, TConfig>`. It is a **pure mathematical
function** that takes a strongly-typed `config` object and returns a `ProblemStub` or
`null`. It contains **no label parsing logic** — the ontology has already been resolved into
`config` by the schema ([SPEC-G1](spec-generator.md#spec-g1--export-contract)).

Returning `null` is a legitimate outcome: the pipeline retries with the next `attempt`,
which deterministically yields a different draw.

### IMPL-G2 — Validate configuration strictly

Import `validateConfigFields` from `../../../lib/errors.ts` — with the correct relative
depth matching the sub-directory structure — and call it at the **beginning** of
`generate(config)` with the required configuration parameters.

It must throw a `GeneratorValidationError` when executed with missing or empty
configuration. **Do not use silent internal fallbacks.**

### IMPL-G3 — Propagate runtime ontology choices as tags

Any runtime choices representing competencies (e.g. the specific shape chosen, the relation
chosen) must be returned in the `tags` array of `ProblemStub`, so they are not lost.

Do **not** duplicate any tags or parameters already provided as configuration parameters —
those are automatically captured in `consumedLabels` by the ontology mapping layer.

### IMPL-G4 — The math must prove the labels

The properties of the generated problem must strictly adhere to the requested labels. If a
label requests `Area.Addition`, the problem must use addition.

**Why:** this is the core guarantee of the whole dataset — the system is a constraint
satisfier, not a labeller of arbitrary output.

### IMPL-G5 — Test suites

- **`generator.test.ts`** — deeply tests edge cases by passing explicit `config` mocks. It
  must cover mathematical boundaries and edge cases: division by zero, invalid target
  ranges, subtraction yielding negative/zero values under non-negative constraints.
- **`spec.test.ts`** — verifies tag resolution using `generateWithLabels` from
  `../../../lib/utils.ts`.
- **Both or either** must include a test asserting that calling `generate` with an empty
  config throws — e.g. `expect(() => generator.generate({})).toThrow()`
  ([IMPL-G2](#impl-g2--validate-configuration-strictly)).

Run `npm run test` to verify everything, or scope it to the module during iteration:

```bash
npm run test -- src/generators/[<category>/]<module>/
```

### IMPL-G6 — A payload contract change is a two-module change

The `ProblemStub` data a generator returns is a contract with every view that renders it.
When that contract changes — a renamed field, a new required field, a changed shape — the
change is not complete until the consuming views are adopted:

1. Find the consuming views and inspect rejection reasons:
   `npm run show:matching -- --spec=<real-standard>` for the actual consumers. Use
   `--spec=test` for the isolated smoke path and add `--raw` only when diagnosing
   pre-deduplication source definitions.
2. Adopt each matched view to render the updated payload fields.

**Why:** views consume `problem.data` directly and validate it strictly
([IMPL-V2](implementation-view.md#impl-v2--validate-the-payload-strictly)). A silently
renamed field surfaces as a `ViewValidationError` error card in the dataset, not as a type
error at build time.

### IMPL-G7 — Extend capabilities within a stable payload contract

Prefer extending an existing generator when the new capability preserves the meaning and
structure of its problem payload. Supporting negative values or another operation through
the same `num1`, `num2` and `answer` fields is a capability extension.

Strongly prefer a new generator when the capability requires a materially different
payload shape. A third operand is not a clean extension of a structurally binary payload
whose operands are fixed as `num1` and `num2`; changing those fields to an array or adding
arity-specific fields changes the generator-view contract. A capability from an unrelated
ontology branch is an additional warning that the module is crossing task-family
boundaries.

Separate generators may still share a view when their concrete payload types form a small,
structurally distinguishable union. The established arithmetic pattern is
`ArithmeticPairProblem | ArithmeticTripleProblem` in `ViewTypeMap`: the shared view narrows
the union through `num3`, validates the corresponding fields, and reuses the common layout.

### IMPL-G8 — Payloads are Ability-neutral mathematical models

A generator payload contains the mathematical objects, relations, evidence, and semantic
context needed by its consumers. It does not preselect the learner action: no unknown or
blank position, instruction, prompt direction, requested explanation, hint, or
Ability-specific answer prose. Those decisions belong to the leaf view under
[SPEC-V5](spec-view.md#spec-v5--abilities-are-exclusively-view-owned).

Canonical does not mean flattened. Preserve the structure that proves generator-owned labels:
law applications, equivalent relations, physical-object identity, graph scale, intermediate
steps, or other mathematical witnesses must remain available to every consuming view. A view
cannot preserve evidence it never receives.

Ability neutrality applies to both declarations and the data contract: fields such as
`blankPart`, `question`, or `explanation` must not encode a learner-action decision. If
multiple views need the same mathematical relation, expose that relation canonically and
let each view derive its observable task. Ontology-irrelevant variation belongs to the
view and is derived from `payload.seed`.

---

## Audit

- [ ] **IMPL-G1** — `generate` is a pure function of `config`; no ontology label is read, parsed, or string-matched inside it.
- [ ] **IMPL-G2** — `validateConfigFields` is imported at the correct relative depth and called first in `generate`; no silent fallback substitutes for a missing config value.
- [ ] **IMPL-G3** — every runtime competency choice appears in `ProblemStub.tags`, and no configured label is duplicated there.
- [ ] **IMPL-G4** — the generated math provably satisfies every label the config encodes.
- [ ] **IMPL-G5** — `generator.test.ts` covers the mathematical boundaries; `spec.test.ts` covers tag resolution; an empty-config throw is asserted.
- [ ] **IMPL-G6** — if the payload contract changed, every consuming view found against the real standard via `npm run show:matching` renders the new fields; the test spec also retains a smoke path.
- [ ] **IMPL-G7** — capability extensions preserve the payload contract; structurally different problem shapes use a separate generator and share a typed-union view where rendering remains simple.
- [ ] **IMPL-G8** — the payload preserves the structured witnesses for its mathematical labels and semantic context, but contains no Ability-specific prompt, blank, hint, requested reasoning, or answer prose.
- [ ] `npm run test` and `npm run check:types` pass.
