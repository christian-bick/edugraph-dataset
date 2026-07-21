### Shape Naming Visual Checklist

## Rendering Requirements
- **Clear Prompt**: The instruction prompt must ask "What shape is this?".
- **SVG shape**: The target shape (circle, square, rectangle, triangle, hexagon, cube, cone, cylinder, or sphere) must be clearly rendered in the center of the viewport with a blue fill and dark blue stroke.
- **Transformed Shape**: The shape can have a rotation and scale applied deterministically based on `problem.id`.

## Layout & Styling
- **Multiple Choice Buttons**: Options for shapes (either all 2D options or all 3D options depending on target shape) must be displayed below the shape container.
- **Solution Mode Visuals**: In solution mode (`isSolutionView: true`), the correct option must be highlighted with a green border, green background, and bold green text. In question mode, all option buttons must look identical and unselected.
