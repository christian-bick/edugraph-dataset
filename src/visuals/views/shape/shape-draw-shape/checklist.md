### Shape Draw Shape Visual Checklist

## Rendering Requirements
- **Clear Prompt**: The instruction prompt must ask to "Trace the {shape}." (e.g. "Trace the circle.").
- **SVG Canvas**: The outline of the shape (circle, triangle, or square) must be rendered clearly inside the drawing canvas.

## Layout & Styling
- **Dotted Path**: In both question and solution modes, the trace path is outlined in a light-grey dotted line.
- **Solution Mode Visuals**: In solution mode (`isSolutionView: true`), a solid red line must overlay the dotted path. In question mode, only the dotted line must be present.
