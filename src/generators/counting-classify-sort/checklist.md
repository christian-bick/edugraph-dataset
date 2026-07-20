### Counting Classify Sort Pedagogical Checklist

#### Abstract Pedagogical Requirements
1. **Mathematical Structure:**
   - The total number of objects (`numObjects`) must match the resolved range min and max.
   - The `categories` record must map categories ('A', 'B', 'C') to their counts.
   - The sum of category counts must equal `numObjects`.
   - The size of `items` must equal `numObjects` and contain only the categories.
2. **Pedagogical Constraints:**
   - There must not be any ties for the target relation (`least` or `most`). If a tie occurs, the generator must filter it out (return `null`).
   - The `relation` property must correctly capture the target relation requested (`least` or `most`).
   - The `answer` property must accurately represent the category with the absolute minimum (`least`) or maximum (`most`) count.
3. **Identity Stability:**
   - The generated problem ID must uniquely map to the problem configuration to avoid duplicate image names (e.g. `classify-sort-{relation}-{total}`).
