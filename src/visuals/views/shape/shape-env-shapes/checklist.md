# Shape Env Shapes - Visual & Rendering Checklist

- Verify that a representation of the real-world object (clock, window, or table) is rendered centered inside the container.
- In Question Mode, verify that the prompt text is correct: "What shape is this [target]?" (e.g. "What shape is this clock?"). Per the global Instruction & Mode Rules, this prompt must be absent in Solution Mode.
- Verify that three option buttons are rendered: "Circle", "Square", and "Rectangle" (capitalized).
- In question view (`isSolutionView: false`), all three buttons must be styled with default neutral borders (slate) and white backgrounds.
- In solution view (`isSolutionView: true`), the correct shape button (matching the answer) must be highlighted in green (green outline, light green background, bold green label, shadow), while the other buttons remain neutral.
- Ensure all text, icons/shapes, and buttons are fully visible and do not overlap.
