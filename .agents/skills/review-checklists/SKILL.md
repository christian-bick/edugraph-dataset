---
name: review-checklists
description: "/review-checklists [{moduleName}] - Review checklist.md files in generators and views (for a specific module, or all modules if omitted) to ensure separation of concerns."
---

Review the `checklist.md` files for the specified generator or view module (or across all modules if `{moduleName}` is omitted). The goal is to enforce a clean separation of concerns by ensuring that:
1. **Generators' checklists** specify *only* abstract mathematical and logic rules.
2. **Views' checklists** specify *only* visual layout, rendering, and interaction rules.

## Scope Resolution
- **Specific Leaf Module**: If `{moduleName}` matches a specific leaf module ID (e.g., `/review-checklists arithmetic-ops-pairs` or `/review-checklists operations-vertical`), restrict the review strictly to that leaf module and its category parent checklist.
- **Parent Category Module**: If `{moduleName}` matches a parent category directory name (e.g., `/review-checklists arithmetic` or `/review-checklists shape`), review the parent category `checklist.md` and all leaf module checklists under that category folder.
- **All Modules**: If `{moduleName}` is omitted (e.g., `/review-checklists`), discover and review all modules across `src/generators/` and `src/visuals/views/`.

Follow these instructions strictly during the review:

## 1. General Principles

- **Do Not Touch What Is Not Broken:** Keep your edits minimal. Do not rewrite, restructure, or remove checklist items that already comply with these guidelines. Only touch items that violate the separation of concerns.
- **Conciseness:** Focus on the most important logical or visual validation aspects. Do not include excessive edge cases.
- **Unaware of Parameterization:** Assume that the validation mechanism is unaware of parameterization (internal config flags like `isReverse` are invisible to it). Do NOT include conditional validation aspects (e.g., "If configuration parameter X is true, then..."). `_mode-Q` / `_mode-S` is the one exception — it IS given to the validator as explicit context, so mode-conditional rules are fine. A view with multiple valid internal configurations should be described as alternative *observable* layouts ("Layout A: ...; Layout B: ...; exactly one applies per image"), not as branches on the driving config value.
- **Hierarchical Organization (Tree Generalization):** `checklist.md` files are concatenated as one flat text block and loaded hierarchically across **three** levels, in this order:
  1. **Root `checklist.md`** (`src/generators/checklist.md` / `src/visuals/views/checklist.md`) — applies to **every** module unconditionally. `src/visuals/views/checklist.md` already states the global rule that Solution Mode must never show instruction text headers (Question Mode may omit it for self-explaining exercises). Never restate this at category or leaf level.
  2. Parent Category `checklist.md` (e.g., `src/generators/arithmetic/checklist.md` or `src/visuals/views/numbers/checklist.md` - applies to all sub-modules under that category).
  3. Leaf Module `checklist.md` (e.g., `src/generators/arithmetic/arithmetic-ops-pairs/checklist.md` or `src/visuals/views/numbers/numbers-compare/checklist.md` - applies specifically to that leaf module).

  Because all three levels get concatenated into one block for the validator, an unscoped rule at any level reads as a specific override rather than an addition. Check redundancy across **all three levels**, not just leaf-vs-category — a category "Visual Quality Rules" section that just restates root's general UI-integrity/coloring rules with different nouns substituted in is redundant and should be deleted, not kept for readability. Root and category checklists must also never bake in concrete examples (e.g. "(e.g. ordering direction, shape naming, sorting rule)") — a specific example at a general level can silently drift out of sync with what a real leaf checklist later requires; push all concrete specifics down to leaf checklists only.
- **Mode-Scoping Requirements (the most common real bug found in this codebase):** Any leaf rule that requires prompt/instruction text — even implicitly, e.g. "Verify the prompt text is correct: '...'" — must explicitly scope it to Question Mode (e.g. "In Question Mode, the prompt must read X. Per the global Instruction & Mode Rules, this text is absent in Solution Mode."). An unscoped requirement reads as an unconditional override of the root rule and causes the validator to fail correctly-implemented views that hide the prompt in Solution Mode as intended. **When reviewing any leaf checklist, always check: does it state a text/instruction requirement without saying "in Question Mode"?** This exact bug shipped in over a dozen leaf checklists in this codebase before being caught by a full-dataset revalidation — treat it as the default hypothesis to check for, not an edge case.
- **Documented Exceptions to Global Rules:** A view may legitimately need to violate a global rule (e.g. a Solution image that's ambiguous without repeating the question, so the prompt must stay visible in both modes — see `sorting-classify-sort/checklist.md`). Such an exception must be stated explicitly in the leaf checklist, name the global rule it deviates from, and give the concrete reason. An undocumented deviation is indistinguishable from a bug.

---

## 2. Reviewing Generators' checklists

Generator modules reside under `src/generators/<moduleName>/`. Their `checklist.md` files must act as the checklist for the abstract mathematical brain.

### Clean Up Actions:
- **Remove all layout/visual criteria:** Delete any mention of how the problem is displayed, positions, coordinates, shapes, colors, SVGs, buttons, ruler bands, CSS styling, or answer box highlights.
- **Retain and refine mathematical criteria:** Only keep requirements that define the abstract mathematical properties of the generated problem payload (e.g. ranges of numbers, correct mathematical answers, relation between generated variables, or compliance with semantic labels).

### Example of Bad vs. Good for Generators:
- 🛑 **Bad (Visual/Layout):** *"The problem must display a ruler with a start point of 0 and a colored band aligned above it."*
- 🟢 **Good (Mathematical/Logical):** *"The generated measurement value must be within the bounds defined by the target range."*

---

## 3. Reviewing Views' checklists

View modules reside under `src/visuals/views/<viewName>/`. Their `checklist.md` files must act as the checklist for the visual body.

### Clean Up Actions:
- **Remove all abstract logic criteria:** Delete any mention of mathematical generation algorithms, how the random numbers are selected, or ontology/tag resolution.
- **Retain and refine visual/rendering criteria:** Keep and describe visual layout, interaction, and rendering requirements:
  - Presence and visibility of specific text instructions or questions.
  - DOM structure, relative positioning, and SVG representations.
  - Interactive elements and their visual styles (e.g. button styling, hover states).
  - Clear distinction between **Question Mode (`_mode-Q`)** (where answers are blank, inputs are empty, or elements are unselected) and **Solution Mode (`_mode-S`)** (where the correct answer is filled in, highlighted green/yellow, or selected).

### Example of Bad vs. Good for Views:
- 🛑 **Bad (Logic/Generation):** *"The random generator must select a teen number between 11 and 19."*
- 🟢 **Good (Visual/Layout):** *"In Question Mode (`_mode-Q`), the answer box at the bottom must be blank. In Solution Mode (`_mode-S`), the answer box must render the correct value highlighted in green."*
