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
- **Unaware of Parameterization:** Assume that the validation mechanism is unaware of parameterization. Do NOT include conditional validation aspects (e.g., "If configuration parameter X is true, then...").
- **Hierarchical Organization (Tree Generalization):** `checklist.md` files are loaded hierarchically across levels:
  1. Parent Category `checklist.md` (e.g., `src/generators/arithmetic/checklist.md` or `src/visuals/views/numbers/checklist.md` - applies to all sub-modules under that category).
  2. Leaf Module `checklist.md` (e.g., `src/generators/arithmetic/arithmetic-ops-pairs/checklist.md` or `src/visuals/views/numbers/numbers-compare/checklist.md` - applies specifically to that leaf module).
  When reviewing checklists, generalize shared rules up to parent category `checklist.md` files where applicable to eliminate redundancy across sibling modules.

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
