# Shape Compare Attributes - Visual & Rendering Checklist

- Verify that two shape SVGs are rendered side by side inside the gray container, with their respective uppercase names displayed directly below each shape.
- Verify that the question prompt is clear: "Which shape has more [sides/corners]?"
- Verify that two option buttons are rendered below the container, each containing the name of one of the shapes (capitalized).
- In question view (`isSolutionView: false`), both buttons must be styled with default neutral borders (slate) and white backgrounds.
- In solution view (`isSolutionView: true`), the button corresponding to the correct answer (the shape with the higher count) must be highlighted in green with a bold green label and shadow, while the incorrect option remains neutral.
- Ensure all text and shape elements are fully visible and do not overlap.
