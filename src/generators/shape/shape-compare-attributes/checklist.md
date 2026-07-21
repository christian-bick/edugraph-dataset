# Shape Compare Attributes - Pedagogical Logic Checklist

- Verify that two different shapes are selected for comparison (i.e. `shape1` is not equal to `shape2`).
- Verify that the attribute values (`val1` and `val2`) correspond to the correct side or corner counts for the respective shapes:
  - circle: 0, triangle: 3, square: 4, rectangle: 4, hexagon: 6.
- Verify that the two values are not equal (`val1` != `val2`) to ensure a non-ambiguous correct answer.
- Verify that the answer string matches the shape with the larger attribute count.
- Verify that the problem ID conforms to: `shape-compare-attr-[attribute]-[shape1]-[shape2]`.
