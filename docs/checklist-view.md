# Checklist Rules — View

Rules specific to view `checklist.md` files: the validation criteria for the rendered
image, consumed by the automated Visual QA pipeline.

**Applies to:** every `checklist.md` under `src/visuals/views/` — root, category and leaf.
**Read with:** [checklist-general.md](checklist-general.md) — all `CHK-n` rules apply here too.
**Verify with:** `npm run validate:dataset -- --view=Y --dataset=test`

---

## Rules

### CHK-V1 — Purpose

A view checklist is a visual layout, rendering, and interaction verification list. Visual
QA uses it to check element positioning, SVG structures, rendering overflows, and Question
(`_mode-Q`) vs. Solution (`_mode-S`) mode styling.

### CHK-V2 — Visual, rendering and interaction criteria only

View checklists specify *only* visual layout, rendering, and interaction rules.

They **must not** contain abstract mathematical generation logic. Remove all abstract logic
criteria — mathematical generation algorithms, RNG selection logic, ontology/tag
resolution.

Keep and refine:

- presence and visibility of specific text instructions or questions (mode-scoped, per
  [CHK-V4](#chk-v4--any-rule-requiring-prompt-text-must-be-scoped-to-question-mode));
- DOM structure, relative positioning, and SVG representations;
- interactive elements and their visual styles.

#### Example

- 🛑 **Bad (logic/generation):** *"The random generator must select a teen number between 11
  and 19."*
- 🟢 **Good (visual/layout):** *"In Question Mode (`_mode-Q`), the answer box at the bottom
  must be blank. In Solution Mode (`_mode-S`), the answer box must render the correct value
  highlighted in forestgreen."*

### CHK-V3 — Distinguish Question Mode from Solution Mode

View checklists must clearly distinguish between:

- **Question Mode (`_mode-Q`)** — answers are blank, inputs are empty, elements unselected.
- **Solution Mode (`_mode-S`)** — correct answers are filled in, highlighted, or selected.

Mode is the one form of conditionality the validator can evaluate
([CHK-6](checklist-general.md#chk-6--assume-the-validator-is-unaware-of-parameterization)).

The solution highlight color is **forestgreen/emerald green**, fixed globally by
`src/visuals/views/checklist.md`. Do not restate it in a leaf checklist, and do not
introduce a different color for a single view.

### CHK-V4 — Any rule requiring prompt text must be scoped to Question Mode

The root checklist (`src/visuals/views/checklist.md`) already states the global rule:
**Solution Mode must never display instruction text headers**, and Question Mode may omit
the header for self-explaining exercises. Do not restate it anywhere else
([CHK-2](checklist-general.md#chk-2--an-unscoped-lower-level-rule-reads-as-an-override-not-an-addition)).

**Any leaf rule that requires prompt/instruction text must explicitly scope it to Question
Mode** — e.g. "In Question Mode, the prompt must read X. Per the global Instruction & Mode
Rules, this text is absent in Solution Mode."

**Why:** an unscoped requirement ("the prompt text must read X") reads as an unconditional
override of the global rule, and causes the validator to fail correctly-implemented views
that hide the prompt in Solution Mode as intended. This exact bug shipped in over a dozen
leaf checklists before being caught.

### CHK-V5 — Documented exceptions to the mode rules

A view may legitimately need to violate a global mode rule — e.g. a view whose Solution
image is ambiguous without repeating the question, so the prompt must stay visible in both
modes. Document it per
[CHK-7](checklist-general.md#chk-7--document-every-exception-to-a-global-rule): state the
exception in the leaf checklist, name the global rule, give the concrete reason. See
`src/visuals/views/sorting/sorting-classify-sort/checklist.md`.

---

## Audit

- [ ] **CHK-V1** — every rule is a verifiable claim about the rendered image.
- [ ] **CHK-V2** — no generation algorithms, RNG logic, or ontology/tag resolution criteria appear anywhere in the file.
- [ ] **CHK-V3** — Question Mode and Solution Mode expectations are both stated and distinguishable.
- [ ] **CHK-V4** — **does the file state a text/instruction requirement without saying "in Question Mode"?** Every prompt-text rule is explicitly mode-scoped.
- [ ] **CHK-V5** — any view that keeps its prompt in Solution Mode documents the exception and its reason.
- [ ] All general rules in [checklist-general.md](checklist-general.md#audit) pass.
