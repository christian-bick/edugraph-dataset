# Shape Compose Shapes - Visual & Rendering Checklist

- Verify that a dashed border target shape container is rendered with the label "Target: [RECTANGLE/SQUARE]".
- In Question Mode, verify that the prompt text is correct: "Which two shapes can you join to make a [target]?". Per the global Instruction & Mode Rules, this prompt must be absent in Solution Mode.
- Verify that two option buttons are rendered: "Two triangles" and "Two circles".
- In solution view (`isSolutionView: true`):
  - The correct option button ("Two triangles") must be highlighted in green (green outline, light green background, bold green label, shadow).
  - For `'rectangle'` targets, a diagonal dashed red line must be drawn across the target shape container to show the composition of two triangles.
- In question view (`isSolutionView: false`), both option buttons must be styled identically with neutral outlines and white backgrounds, and no diagonal dashed line should be present inside the target container.
- Ensure all text and visual assets are fully visible and do not overlap.
