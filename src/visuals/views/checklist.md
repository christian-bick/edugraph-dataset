### Global Visual Views Checklist

#### 1. General UI Integrity:
- **NO overlapping components** (e.g. text on top of borders, symbols colliding).
- **NO broken text placeholders** (strictly search for: "NaN", "undefined", "null", "[object]").
- **Sane Panning/Padding**: No elements and texts touching, nothing clipped at the edges.

#### 2. Instruction & Mode Rules:
- **Question Mode (`_mode-Q`) (`isSolutionView: false`):**
  - Must display an instruction text header when necessary for task clarity. Self-explaining exercises may omit the header or keep it minimal. Whether a specific view requires a header, and its exact wording, is defined in that view's leaf checklist.
  - MUST NOT contain any green text, borders, or solution backgrounds.

- **Solution Mode (`_mode-S`) (`isSolutionView: true`):**
  - **MUST NEVER contain instruction text headers**, regardless of what Question Mode requires for the same view — unless a view's leaf checklist explicitly documents an exception (e.g. because the solution is ambiguous without restating the question).
  - Must render only the visual problem elements and solution highlights/answers in forestgreen/emerald green.
