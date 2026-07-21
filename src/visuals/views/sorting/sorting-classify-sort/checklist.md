### Sorting Classify Sort Visual Checklist

#### Visual and Layout Requirements
1. **Interactive and Static Elements:**
   - Display a prompt question text that dynamically incorporates the classification type (`shape` or `color`) and the relation (`least` or `most`).
   - Render a container displaying scattered shapes of different shapes/colors.
   - Objects must be spaced appropriately using deterministic random positions so they do not overlap.
2. **Options and Selection Layout:**
   - Render the categories ('A', 'B', 'C') mapped to their visual traits as selectable boxes at the bottom.
   - Each option box must display the respective category shape/color and the label text (capitalized).
3. **Solution Highlighting:**
   - In Solution Mode (`isSolutionView: true`), the correct option box must be visually highlighted with a green border and background (`border-green-600`, `bg-green-50`, `text-green-700`).
   - In Question Mode (`isSolutionView: false`), NO option box should be highlighted (they should all have neutral borders and backgrounds).
