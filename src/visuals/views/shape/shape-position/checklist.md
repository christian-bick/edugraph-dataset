### Shape Position Visual Checklist

## Rendering Requirements
- **Clear Prompt**: The instruction prompt must ask "Where is the ball relative to the box?".
- **SVG Scene**: A slate box labelled "Box" must be rendered along with a rose/red ball labelled "Ball".
- **Positioning**: The ball's location (above, below, nextTo) relative to the box must correspond to the problem's relation parameter.

## Layout & Styling
- **Multiple Choice Buttons**: Three options ('Above the box', 'Below the box', 'Next to the box') must be displayed below the scene.
- **Solution Mode Visuals**: In solution mode (`isSolutionView: true`), the correct button must be highlighted with a green border, green background, and bold green text. In question mode, all option buttons must look identical and unselected.
