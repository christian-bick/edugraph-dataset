# Checklist Rules — General

Rules for authoring `checklist.md` files at any level, in both generators and views. These
files drive the automated Visual QA validator (`npm run validate:dataset`) as well as
manual checks.

**Applies to:** every `checklist.md` under `src/generators/` and `src/visuals/views/` — root, category and leaf.
**Read with:** [checklist-generator.md](checklist-generator.md), [checklist-view.md](checklist-view.md)
**Verify with:** `npm run validate:dataset -- --generator=X --view=Y --spec=test`

---

## Rules

### CHK-1 — Three levels, concatenated into one flat block

Checklists are concatenated as one flat text block and evaluated together, across **three**
levels, in this order:

1. **Root** (`src/generators/checklist.md` / `src/visuals/views/checklist.md`) — applies to
   **every** generator or view unconditionally.
2. **Parent category** (e.g. `src/generators/arithmetic/checklist.md`) — applies to all
   sub-modules under that category.
3. **Leaf module** (e.g. `src/generators/arithmetic/arithmetic-ops-pairs/checklist.md`) —
   applies specifically to that leaf module.

### CHK-2 — An unscoped lower-level rule reads as an override, not an addition

Because the LLM validator sees root + category + leaf as one undifferentiated block, a leaf
(or category) rule that does not scope itself reads as a *specific override* of a general
rule rather than an addition to it.

Before adding a rule anywhere, check whether root or the category checklist already states
it. A rule repeated verbatim at a lower level with different nouns substituted in is
redundant and should be **deleted, not kept "for clarity."**

**Why:** this is a real, previously-shipped bug class, not a theoretical risk — see
[CHK-V4](checklist-view.md#chk-v4--any-rule-requiring-prompt-text-must-be-scoped-to-question-mode).

### CHK-3 — Separation of concerns between generator and view checklists

- **Generator checklists** specify *only* abstract mathematical and logic rules.
- **View checklists** specify *only* visual layout, rendering, and interaction rules.

The role-specific inclusion/exclusion lists live in
[checklist-generator.md](checklist-generator.md) and [checklist-view.md](checklist-view.md).

### CHK-4 — Be concise

Focus on the most important validation aspects. Do not include excessive edge cases.

### CHK-5 — No concrete examples in root or category checklists

Root and category checklists must state only abstract principles — never bake in concrete
examples (e.g. "(e.g. ordering direction, shape naming, or sorting rule)").

**Why:** a concrete example at a general level is a specific claim that can silently drift
out of sync with, or contradict, what an actual leaf checklist later requires for a
similarly-shaped view. Concrete specifics belong exclusively in leaf checklists, where they
describe one real, verifiable view.

### CHK-6 — Assume the validator is unaware of parameterization

The validation mechanism cannot see internal config flags (e.g. `isReverse`). Do not phrase
rules conditionally on them ("If `config.isReverse` is true, then…").

Mode is the one exception: `_mode-Q` / `_mode-S` is given to the validator explicitly as
context, so rules may condition on Question vs. Solution Mode
([CHK-V3](checklist-view.md#chk-v3--distinguish-question-mode-from-solution-mode)).

If a view has multiple valid internal configurations, describe them as alternative
*observable* layouts the rendered image can match — "Layout A: … Layout B: …; exactly one
applies per image" — not as branches on the config value driving them. See
`src/visuals/views/time/time-analog/checklist.md` for a worked example.

### CHK-7 — Document every exception to a global rule

A module may legitimately need to violate a global rule. State the exception explicitly in
the leaf checklist, **name the global rule it deviates from**, and give the concrete
reason.

**Why:** an undocumented deviation is indistinguishable from a bug to both the validator
and the next person reading the checklist. See
`src/visuals/views/sorting/sorting-classify-sort/checklist.md` for a worked example.

---

## Audit

- [ ] **CHK-1** — the rule sits at the correct level for its scope (root = universal, category = all siblings, leaf = this module only).
- [ ] **CHK-2** — no rule restates or narrows a rule already present at root or category level.
- [ ] **CHK-3** — the file contains only criteria of its own role's concern.
- [ ] **CHK-4** — no excessive edge cases; only the important validation aspects.
- [ ] **CHK-5** — root and category files contain no concrete examples.
- [ ] **CHK-6** — no rule conditions on an internal config flag; multi-configuration views are described as alternative observable layouts.
- [ ] **CHK-7** — every deviation from a global rule names the rule and gives its reason.
