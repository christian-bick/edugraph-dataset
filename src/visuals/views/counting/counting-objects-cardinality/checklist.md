### Counting Objects Cardinality View Checklist

#### Visual Layout & Rendering Requirements
1. **Instruction:**
   - The question text "Count the objects. What is the total number?" must be clearly visible above the canvas.
2. **Cardinality & Highlighting:**
   - In **Question Mode (`_mode-Q`)**, no counting badges should be rendered on the objects.
   - In **Solution Mode (`_mode-S`)**, counting badges (1 to `numObjects`) must be displayed on top of each object.
   - The final counting badge representing the cardinality (number `numObjects`) must be visually highlighted (e.g. using a yellow border/background/shadow) to indicate that this represents the total set size.
3. **Answer Box:**
   - Answer box at the bottom must be blank in Question Mode, and filled with the total count (`numObjects`) in Solution Mode.
