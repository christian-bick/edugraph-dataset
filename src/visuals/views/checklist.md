## Global Visual QA Checklist

### Exercise clarity

- **Task identifiable:** A first-time viewer can tell what the learner is expected to do and which visible clues matter. In Solution Mode, the original task remains recognizable and it is clear where the shown answer belongs.
- **Text economy:** Prefer visual clues. Instructions may appear in Question Mode, Solution Mode, both, or neither; include them in each mode only when that image would otherwise be ambiguous. Every label must add necessary information and must not merely repeat an unmistakable symbol, object, or adjacent option.

### Mode correctness

- **Question Mode:** The answer, completed selection, or other requested result is genuinely withheld. Nothing is marked with solution-only styling, and all clues needed to solve the task remain visible.
- **Solution Mode:** The correct answer or completed result is clearly shown with the established green solution styling. Enough task context and supporting visual evidence remain visible to understand what the answer refers to.

### Content correctness

- **Mathematical coherence:** Every visible value, equation, ordering, count, measurement, relation, and completed answer is internally correct.
- **Label support:** Evaluate every supplied ontology label against its definition. A label does not need to be uniquely determined.
  - `defendable`: the image provides reasonable visible evidence.
  - `uncertain`: the evidence is indirect or ambiguous, or the judgment is unsure.
  - `not_defendable`: the image clearly contradicts the definition or clearly lacks a required feature.
  - `defendable` and `uncertain` pass; `not_defendable` fails.

### Visual quality

- **Layout integrity:** Nothing overlaps, touches unintentionally, or clips at an edge; spacing and padding remain balanced and all essential content is legible.
- **Rendering integrity:** The image contains no broken placeholders such as `NaN`, `undefined`, `null`, or `[object Object]`.
