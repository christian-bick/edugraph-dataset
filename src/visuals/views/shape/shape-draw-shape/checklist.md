### Shape Draw Shape Visual Checklist

## Rendering Requirements
- **Clear Prompt**: In Question Mode, the instruction prompt must ask to "Trace the {shape}." (e.g. "Trace the circle."). Per the global Instruction & Mode Rules, this prompt must be absent in Solution Mode.
- **SVG Canvas**: The outline of the shape (circle, triangle, or square) must be rendered clearly inside the drawing canvas.

## Layout & Styling
- **Dotted Path**: In both question and solution modes, the trace path is outlined in a light-grey dotted line.
- **Solution Mode Visuals**: In solution mode (`isSolutionView: true`), a solid green line (`forestgreen`) must overlay the dotted path. In question mode, only the dotted line must be present.
