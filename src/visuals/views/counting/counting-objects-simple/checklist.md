### Counting Objects Simple View Checklist

#### Visual Layout & Rendering Requirements
1. **Instruction:**
   - The question text "How many objects are there?" must be clearly visible above the canvas.
2. **Object Container & Placement:**
   - A box representing the canvas must be centered.
   - The objects rendered within the container must correspond to the correct SVG icon selected from the list (circle, square, triangle, etc.).
   - The visual layout must render exactly `numObjects` count of these icons.
   - Objects must be arranged according to the target config arrangement (linear, circular, scattered) without overlapping or clipping container bounds.
3. **Solution/Answer Box:**
   - A distinct answer box must be displayed underneath the canvas.
   - In **Question Mode (`_mode-Q`)**, the answer box must be completely empty.
   - In **Solution Mode (`_mode-S`)**, the answer box must render the count (`numObjects`) in forestgreen color.
