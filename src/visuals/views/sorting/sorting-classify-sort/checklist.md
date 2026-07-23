### Sorting Classify Sort Visual Checklist

#### Visual and Layout Requirements
1. **Interactive and Static Elements:**
   - Display a prompt question text header (e.g. "Which shape has the most number of items?") in both Question Mode (_mode-Q) and Solution Mode (_mode-S) so question context is clear. This is a documented exception to the global Instruction & Mode Rules: the highlighted answer box alone does not convey which attribute or relation ("most"/"least") was asked, so the prompt is required in both modes.
   - Render a container displaying scattered shapes of different shapes/colors.
   - Objects must be spaced appropriately using deterministic positions so they do not overlap.
2. **Options and Selection Layout:**
   - Render the categories ('A', 'B', 'C') mapped to their visual traits as selectable boxes at the bottom.
   - Each option box must display the respective category shape/color and the label text (capitalized).
3. **Solution Highlighting:**
   - In Solution Mode (`isSolutionView: true`), the correct option box must be visually highlighted with a green border and background (`border-green-600`, `bg-green-50`, `text-green-700`).
   - In Question Mode (`isSolutionView: false`), NO option box should be highlighted (they should all have neutral borders and backgrounds). (Note: Do not confuse a green-colored shape inside the option box for a green highlighted border).
