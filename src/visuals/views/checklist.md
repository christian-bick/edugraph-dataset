### Global Visual Views Checklist

#### 1. General UI Integrity:
- **NO overlapping components** (e.g. text on top of borders, symbols colliding).
- **NO broken text placeholders** (strictly search for: "NaN", "undefined", "null", "[object]").
- **Sane Panning/Padding**: No elements and texts touching, nothing clipped at the edges.

#### 2. Instruction & Mode Rules:
- **Question Mode (`_mode-Q`) (`isSolutionView: false`):**
  - Must display an instruction text header when necessary for task clarity (e.g. specifying ordering direction like ascending/descending, target comparison attribute, shape naming, or sorting rule).
  - For visually self-contained arithmetic (e.g. vertical column addition/subtraction or standard equation boxes), instruction headers should be omitted or kept minimal.
  - MUST NOT contain any green text, borders, or solution backgrounds.

- **Solution Mode (`_mode-S`) (`isSolutionView: true`):**
  - **MUST NEVER contain instruction text headers.**
  - Must render only the visual problem elements and solution highlights/answers in forestgreen/emerald green.
