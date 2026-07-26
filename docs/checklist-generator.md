# Checklist Rules — Generator

Rules specific to generator `checklist.md` files: the validation criteria for the abstract
mathematical data.

**Applies to:** every `checklist.md` under `src/generators/` — root, category and leaf.
**Read with:** [checklist-general.md](checklist-general.md) — all `CHK-n` rules apply here too.
**Verify with:** `npm run validate:dataset -- --generator=X --dataset=test`

---

## Rules

### CHK-G1 — Purpose

A generator checklist is a pedagogical/mathematical verification list. It acts as the
validation criteria for the **abstract mathematical data** the generator produces.

### CHK-G2 — Abstract math and logic only

Generator checklists specify *only* abstract mathematical and logic rules.

They **must not** contain any visual layout, coordinates, styles, colors, or CSS
parameters. Remove all layout/visual criteria — coordinates, shapes, colors, SVGs, button
states, ruler bands, CSS styling, answer box highlights.

Keep and refine only requirements that define the abstract mathematical properties of the
generated problem payload: ranges of numbers, correct mathematical answers, the relation
between generated variables, compliance with semantic labels.

#### Example

- 🛑 **Bad (visual/layout):** *"The problem must display a ruler with a start point of 0 and
  a colored band aligned above it."*
- 🟢 **Good (mathematical/logical):** *"The generated measurement value must be within the
  bounds defined by the target range."*

### CHK-G3 — Read the root generator checklist before adding a rule

`src/generators/checklist.md` states the global mathematical integrity rules that apply to
every generator unconditionally. Read it before adding anything at category or leaf level,
and never restate it
([CHK-2](checklist-general.md#chk-2--an-unscoped-lower-level-rule-reads-as-an-override-not-an-addition)).

---

## Audit

- [ ] **CHK-G1** — every rule is a verifiable claim about the generated mathematical data.
- [ ] **CHK-G2** — no coordinates, shapes, colors, SVGs, button states, CSS, or highlight criteria appear anywhere in the file.
- [ ] **CHK-G3** — nothing already stated in `src/generators/checklist.md` is restated here.
- [ ] All general rules in [checklist-general.md](checklist-general.md#audit) pass.
