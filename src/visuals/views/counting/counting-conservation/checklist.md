### Counting Conservation View Checklist

#### Visual Layout & Rendering Requirements
1. **Instruction:**
   - In Question Mode, the question text "Are there more items in Group A, Group B, or are they the same?" must be clearly visible above the groups. Per the global Instruction & Mode Rules, this text must be absent in Solution Mode.
2. **Conservation of Number Representation:**
   - Group A (close spacing) and Group B (wide spacing) must display the exact same number of items (`numObjects`).
   - The same SVG icon must be used for both groups.
3. **Solution/Answer Options:**
   - Three buttons must be displayed at the bottom: "Group A has more", "Group B has more", and "They are the same".
   - In **Question Mode (`_mode-Q`)**, all three buttons must have a neutral, unselected styling.
   - In **Solution Mode (`_mode-S`)**, the button "They are the same" must be highlighted with a green border and background.
