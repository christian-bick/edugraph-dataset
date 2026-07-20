### Counting Objects Count Out View Checklist

#### Visual Layout & Rendering Requirements
1. **Instruction:**
   - The question text "Color exactly {numObjects} objects." must be clearly visible above the canvas.
2. **Count Out Representation & Coloring:**
   - A total number of objects (larger than `numObjects`) must be displayed.
   - In **Question Mode (`_mode-Q`)**, all objects must be styled identically (e.g. grayscale and partially transparent, representing uncolored/unmarked state).
   - In **Solution Mode (`_mode-S`)**, exactly `numObjects` of the objects must be rendered in full color and shadow (representing the colored/selected state), while the remaining extra objects stay grayscale/transparent.
3. **Answer Box:**
   - Answer box at the bottom must be blank in Question Mode, and show "Colored: {numObjects}" in Solution Mode.
