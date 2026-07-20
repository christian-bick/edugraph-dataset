### Counting Generator Checklist

#### Abstract Pedagogical Requirements
1. **Mathematical Structure:**
   - The generated number of objects (`numObjects`) must be a positive integer matching the resolved range min and max.
   - The generated value of `simpleAnswer` must be mathematically equal to `numObjects`.
2. **Pedagogical Constraints:**
   - Zero objects must never be generated (`Scope.NumbersWithoutZero`).
   - The generator does not support negative numbers.
3. **Identity stability:**
   - The generated problem ID must uniquely map to the problem configuration to avoid duplicates (e.g. `count-N`).
