### Shape Same Attribute Visual Checklist

## Rendering Requirements
- **Prompt Text**: The prompt must correspond to the target attribute:
  - `'rollable'`: "Which of these shapes rolls easily?"
  - `'stackable'`: "Which of these shapes is best for stacking?"
  - `'foldable'`: "Which of these shapes can be folded?"
- **Visual Options**: The SVG container must display three shapes: Sphere, Cube, and Rectangle, each with their corresponding label text beneath them.

## Layout & Styling
- **Layout Integrity**: The three shape icons (Sphere, Cube, Rectangle) must align horizontally inside the slate-50 canvas.
- **Multiple Choice Options**: Below the canvas, three option buttons ('Sphere', 'Cube', 'Rectangle') must be rendered.
- **Solution Highlight**: In Solution Mode (`isSolutionView: true`), the correct button (Sphere, Cube, or Rectangle depending on prompt) must have a green border, green background, and bold green text. In Question Mode, all option buttons must look identical and unselected.
