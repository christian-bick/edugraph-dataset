# Shape Compose Shapes - Pedagogical Logic Checklist

- Verify that the recursive composition tree is geometrically valid: polygons use smaller polygons, circular parts use exact fractional-circle pieces, and solids use compatible solid parts.
- A single-level problem has depth 1 and only primitive inputs at its root; a multi-level problem has depth 2 and uses at least one composed intermediate as a root input.
- Verify that `target`, `components`, `compositionDepth` and the correct answer agree with the authoritative composition tree.
- Verify that `options` contains the correct answer and one geometrically invalid distractor.
