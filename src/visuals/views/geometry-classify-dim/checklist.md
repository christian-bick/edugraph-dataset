# Geometry Classify Dim - Visual & Rendering Checklist

- Verify that the shape SVG is correctly centered inside its gray container.
- Verify that two option buttons are rendered below the shape container: "Flat (2D)" and "Solid (3D)".
- In question view (`isSolutionView: false`), both buttons must be styled identically with neutral outlines (slate/gray) and white backgrounds.
- In solution view (`isSolutionView: true`), the correct button (matching the answer) must be clearly highlighted with a green border, light green background, bold green text, and a subtle green shadow, while the incorrect button remains in its neutral state.
- Ensure all text (prompt, shape SVG, option buttons) is fully visible, readable, and does not overlap.
