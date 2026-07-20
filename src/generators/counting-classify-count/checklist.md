# Counting Classify Count Pedagogical Checklist

## Structural Requirements
- **Valid Object Counts**: The total number of items must be within the resolved range bounds (minimum of 1, up to the maximum limit).
- **Correct Category Mapping**: Every item in the generated `items` array must correspond to one of the abstract categories ('A', 'B', 'C') present in the `categories` record.
- **Consistent Totals**: The sum of the counts for all categories in the `categories` record must exactly equal the total number of items (`items.length` and `numObjects`).
- **Standard Constraints**: Avoid negative counts, floating-point numbers, or empty category lists.
