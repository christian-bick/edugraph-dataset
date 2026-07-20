# Sorting Classify Count Visual Checklist

## Rendering Requirements
- **Clear Prompt**: The instruction prompt must specify the classification trait (e.g., "Classify and count the objects by shape" or "Classify and count the objects by color").
- **SVG Items**: Objects (circles, squares, triangles) are rendered clearly with correct shapes and corresponding fill colors (red, blue, green).
- **Physical Scattering**: Objects are scattered within the canvas container using seeded deterministic coordinates without clipping or going outside container bounds.

## Layout & Styling
- **Input/Answer Boxes**: Each category is listed with a label and matching visual representation, along with an answer block.
- **Solution Mode Visuals**: In solution mode (`isSolutionView: true`), the correct count must be visible in a green border box with green bold text. In question mode (`isSolutionView: false`), the count box must be completely empty.
- **Tailwind styling**: Responsive design with rounded cards, clean margins, and consistent font sizes.
