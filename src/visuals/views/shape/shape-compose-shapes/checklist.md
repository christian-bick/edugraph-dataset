# Shape Compose Shapes - Visual & Rendering Checklist

- Verify that the labeled target diagram visibly has the requested 2D or 3D form: rectangle, square, triangle, hexagon, trapezoid, half circle, quarter circle, cube, rectangular prism, cone, or cylinder.
- In Question Mode, verify that the prompt text is correct: "Which pieces can you join to make a [target]?". Per the global Instruction & Mode Rules, this prompt must be absent in Solution Mode.
- Verify that two option buttons are rendered and that their wording includes both the piece count and piece name supplied by the problem.
- In solution view (`isSolutionView: true`):
  - The correct option button must be highlighted in green (green outline, light green background, bold green label, shadow).
  - Dashed red seam lines must partition the target diagram into the stated component pieces.
- In question view (`isSolutionView: false`), both option buttons must be styled identically with neutral outlines and white backgrounds, and no red composition seams may appear.
- Ensure all text and visual assets are fully visible and do not overlap.
