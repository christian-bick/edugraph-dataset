### Comparison Generator Pedagogical Checklist

#### Abstract Pedagogical Requirements
1. **Mathematical Structure:**
   - The comparison numbers `num1` and `num2` must fall strictly within the resolved range bounds (minimum to maximum).
   - If the relation is `'equal'`, `num1` must equal `num2`.
   - If the relation is `'greater'`, `num1` must be strictly greater than `num2`.
   - If the relation is `'less'`, `num1` must be strictly less than `num2`.
   - The `answer` property must mathematically evaluate to `>` for greater, `<` for less, and `=` for equal.
2. **Pedagogical Constraints:**
   - A valid problem must be rejected (return `null`) if the range constraints cannot support the requested relation (e.g. asking for `less` with a range of `[5, 5]`).
3. **Identity Stability:**
   - The generated problem ID must uniquely map to the problem numbers and relation to prevent duplicate images (e.g., `compare-{num1}-{num2}-{relation}`).
