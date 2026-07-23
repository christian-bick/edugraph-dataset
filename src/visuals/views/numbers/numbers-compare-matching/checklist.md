### Numbers Compare Matching View Checklist

#### Visual Layout & Rendering Requirements
1. **Instruction:**
   - In Question Mode, the question text must be clearly visible. It must say "Which group has fewer items?" if the relation is `'less'`, and "Which group has more items?" otherwise. Per the global Instruction & Mode Rules, this text must be absent in Solution Mode.
2. **Object Representation & Matching Lines:**
   - Two columns labeled "Group A" and "Group B" must display the correct number of items.
   - SVG icons must be aligned horizontally so that the matching relationship between items of Group A and Group B is clear.
   - Dotted/dashed lines must connect matching pairs between the columns.
   - In **Solution Mode (`_mode-S`)**, any unmatched items (extra items in the larger group) must be highlighted with a red dashed border and a light red background to show why one group is larger.
3. **Solution/Answer Options:**
   - Three buttons must be displayed at the bottom: "Group A", "Group B", and "They are equal".
   - In **Question Mode (`_mode-Q`)**, all buttons must remain in their default neutral styles.
   - In **Solution Mode (`_mode-S`)**, the correct button must highlight in green.
