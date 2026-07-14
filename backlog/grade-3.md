# Grade 3 Common Core Backlog: Leaf Standards

This document outlines the detailed implementation backlog for the Grade 3 Common Core State Standards (CCSS) leaf nodes that are currently uncovered in the dataset generator.

---

## 3.OA.A.4 - Unknown whole numbers in multiplication/division
* **CCSS Text:** Determine the unknown whole number in a multiplication or division equation relating three whole numbers. For example, determine the unknown number that makes the equation true in each of the equations 8 × ? = 48, 5 = [] ÷ 3, 6 × 6 = ?.
* **Ontology Reference:** Matched Areas: `Area.Multiplication`, `Area.Division`, `Area.Algebra`, Scopes: `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator. Introduce a new parameter `blankPosition` (value: `'num1' | 'num2' | 'answer'`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Unknown Factor):** Multiplication facts where one of the factors is missing.
     * *Labels:* `Area.Multiplication`, `Area.Algebra`, `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     * *Parameters:* `operator: 'multiply'`, `blankPosition: 'num2'`, numbers in `[1, 10]`
     * *Sample Question:* `8 × _ = 48`
  2. **Permutation B (Unknown Dividend/Divisor):** Division facts where the dividend or divisor is missing.
     * *Labels:* `Area.Division`, `Area.Algebra`, `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     * *Parameters:* `operator: 'divide'`, `blankPosition: 'num1'`, numbers in `[1, 100]`
     * *Sample Question:* `_ ÷ 3 = 5`
  3. **Permutation C (Standard Equation):** Standard equations where the product or quotient is missing.
     * *Labels:* `Area.Multiplication`, `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     * *Parameters:* `operator: 'multiply'`, `blankPosition: 'answer'`, numbers in `[1, 10]`
     * *Sample Question:* `6 × 6 = _`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view.
* **UI Layout details:** Extend the horizontal flex layout to allow rendering an empty rectangular box representing the input field at the position specified by `blankPosition` (operand 1, operand 2, or answer). The font size should be large and centered, adapting dynamically to mobile viewport widths.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the `blankPosition` parameter to the generator configuration options.
- [ ] Implement algebraic blank placement logic within `ArithmeticGenerator.generate()`.
- [ ] Add permutations to `permutations.ts` for multiplication and division with missing terms.
- [ ] Update `operations-boxes` renderer to display the blank input block on the requested element.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js` to ensure equations evaluate correctly.
- [ ] Validate question generation boundary values (e.g. products do not exceed 100).
- [ ] Manually preview exercises using the standard visualizer.

---

## 3.OA.B.5 - Apply properties of operations to multiply and divide
* **CCSS Text:** Apply properties of operations as strategies to multiply and divide. (Students need not use formal terms for these properties.) Examples: If 6 × 4 = 24 is known, then 4 × 6 = 24 is also known. (Commutative property of multiplication.) 3 × 5 × 2 can be found by 3 × 5 = 15, then 15 × 2 = 30, or by 5 × 2 = 10, then 3 × 10 = 30. (Associative property of multiplication.) Knowing that 8 × 5 = 40 and 8 × 2 = 16, one can find 8 × 7 as 8 × (5 + 2) = (8 × 5) + (8 × 2) = 40 + 16 = 56. (Distributive property.)
* **Ontology Reference:** Matched Areas: `Area.CommutativeLaw`, `Area.AssociativeLaw`, `Area.DistributiveLaw`, `Area.Multiplication`, `Area.Division`, Scopes: `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `arithmetic` generator to output property-matching equations with missing elements.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Commutative):** Commutative property equations.
     * *Labels:* `Area.CommutativeLaw`, `Area.Multiplication`, `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`, `Ability.ProcedureApplication`
     * *Sample Question:* `7 × 4 = 4 × _`
  2. **Permutation B (Associative):** Associative property equations with three terms and grouping.
     * *Labels:* `Area.AssociativeLaw`, `Area.Multiplication`, `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`, `Ability.ProcedureApplication`
     * *Sample Question:* `(3 × 2) × 5 = 3 × (_ × 5)`
  3. **Permutation C (Distributive):** Distributive property equations showing product splits.
     * *Labels:* `Area.DistributiveLaw`, `Area.Multiplication`, `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`, `Ability.ProcedureApplication`
     * *Sample Question:* `8 × 7 = 8 × (5 + _)`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `operations-properties` or extend `operations-boxes`.
* **UI Layout details:** The view must support parentheses grouping visual styles. Render operators (`×`, `+`, `=`) and parentheses cleanly with uniform horizontal spacing. Highlight the blank box container to draw focus.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `propertyType` (`'commutative' | 'associative' | 'distributive'`) to generator parameters.
- [ ] Implement equation builders for each arithmetic property structure.
- [ ] Add permutations to `permutations.ts` using the new algebraic law area labels.
- [ ] Update view rendering engine to draw parentheses.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying both sides of the generated equation evaluate to equal values in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (factors in range `[1, 10]`, products <= 100).
- [ ] Manually preview exercises using the standard visualizer.

---

## 3.OA.B.6 - Division as an unknown-factor problem
* **CCSS Text:** Understand division as an unknown-factor problem. For example, find 32 ÷ 8 by finding the number that makes 32 when multiplied by 8.
* **Ontology Reference:** Matched Areas: `Area.Division`, `Area.Multiplication`, `Area.FactorsAndMultiples`, Scopes: `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `arithmetic` generator to output stacked multiplication and division fact pairs.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Inverse Matching):** Division problem paired with a matching multiplication sentence hint.
     * *Labels:* `Area.Division`, `Area.Multiplication`, `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`, `Ability.ProcedureUnderstanding`
     * *Sample Question:* `To find 32 ÷ 8, solve: 8 × _ = 32`
  2. **Permutation B (Missing Factor Relationship):** Finding the missing factor to complete a related division.
     * *Labels:* `Area.FactorsAndMultiples`, `Area.Division`, `Scope.IntegersWithoutNegatives`, `Scope.NumbersSmaller100`, `Ability.ProcedureUnderstanding`
     * *Sample Question:* `_ × 7 = 42 implies 42 ÷ 7 = _`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view with a stacked dual-equation layout.
* **UI Layout details:** Vertically stack the helper multiplication equation on top of the target division equation. Provide an arrow or colored line linking the unknown positions to emphasize the inverse mathematical relation.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement `division-as-multiplication` mode configuration parameters.
- [ ] Write logic returning matching equation pairs in `ArithmeticGenerator.generate()`.
- [ ] Add permutations with inverse operation labels to `permutations.ts`.
- [ ] Configure the layout template to support rendering multiple rows of equations.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying division quotient matches the missing multiplication factor.
- [ ] Validate range limits (factors in `[1, 10]`, products <= 100).
- [ ] Manually preview layout to ensure visual links do not overlap digits.

---

## 3.OA.C.7 - Fluently multiply and divide within 100
* **CCSS Text:** Fluently multiply and divide within 100, using strategies such as the relationship between multiplication and division (e.g., knowing that 8 × 5 = 40, one knows 40 ÷ 5 = 8) or properties of operations. By the end of Grade 3, know from memory all products of two one-digit numbers.
* **Ontology Reference:** Matched Areas: `Area.Multiplication`, `Area.Division`, `Area.BaseOperations`, `Area.FactorsAndMultiples`, Scopes: `Scope.NumbersSmaller100`, `Scope.IntegerNumbers`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `arithmetic` generator with strict bounds for single-digit multiplication and division facts.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Multiplication Fluency):** 1-digit multiplication facts.
     * *Labels:* `Area.Multiplication`, `Scope.NumbersSmaller100`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureMemorization`
     * *Sample Question:* `9 × 8 = _`
  2. **Permutation B (Division Fluency):** Whole number division facts within 100.
     * *Labels:* `Area.Division`, `Scope.NumbersSmaller100`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     * *Sample Question:* `54 ÷ 6 = _`
  3. **Permutation C (Fact Families):** Paired facts representing family relationships.
     * *Labels:* `Area.FactorsAndMultiples`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     * *Sample Question:* `7 × _ = 63` and `63 ÷ 7 = _`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` (horizontal layout) and `operations-vertical` (vertical calculation grid).
* **UI Layout details:** Clear vertical alignment of digits in vertical form multiplication. Responsive layout, supporting both horizontal standard math blocks and vertical column grids.

### Subtask 3: Developer Implementation Checklist
- [ ] Map parameters to restrict multiplication/division inputs strictly to single digits [0, 9] (and products <= 81).
- [ ] Add configurations to `permutations.ts` for memorization and execution fluency.
- [ ] Confirm both horizontal and vertical templates render these basic facts.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that arithmetic bounds strictly hold.
- [ ] Ensure division outputs always yield whole numbers.
- [ ] Verify vertical margins and spacing of grids.

---

## 3.OA.D.8 - Two-step word problems using the four operations
* **CCSS Text:** Solve two-step word problems using the four operations. Represent these problems using equations with a letter standing for the unknown quantity. Assess the reasonableness of answers using mental computation and estimation strategies including rounding.
* **Ontology Reference:** Matched Areas: `Area.BaseOperations`, `Area.OrderOfOperations`, `Area.Estimation`, `Area.NumericApproximation`, `Area.Algebra`, Scopes: `Scope.IntegerNumbers`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `arithmetic` generator to construct multi-operation expressions and template-based word questions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Two-Step Equation):** Solving a word problem by forming an equation with an unknown variable.
     * *Labels:* `Area.BaseOperations`, `Area.Algebra`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     * *Sample Question:* `"A carton holds 6 boxes of pencils. Each box has 8 pencils. Mark gives 5 pencils away. Write and solve for p: (6 × 8) - 5 = p"`
  2. **Permutation B (Estimation Check):** Rounded estimation word problems checking for reasonableness.
     * *Labels:* `Area.Estimation`, `Area.NumericApproximation`, `Scope.IntegersWithoutNegatives`, `Ability.PlausibilityEvaluation`
     * *Sample Question:* `"A shirt costs $29 and a hat costs $18. Estimate the total cost by rounding to the nearest ten: $30 + $20 = _"`
  3. **Permutation C (Order of Operations):** Simple multi-operator math evaluation.
     * *Labels:* `Area.OrderOfOperations`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     * *Sample Question:* `12 + 6 × 3 = _`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design a new view `word-problems`.
* **UI Layout details:** Display a clean text block describing the problem context in an outline card. Position the visual equation box at the bottom, centered, with high-contrast text sizing. Responsive layout wraps paragraphs cleanly on small viewports.

### Subtask 3: Developer Implementation Checklist
- [ ] Construct template strings for two-step arithmetic word problems (addition, subtraction, multiplication, division combinations).
- [ ] Implement algebraic equation output support (e.g. `num1 * num2 - num3 = x`).
- [ ] Add permutations to `permutations.ts` for two-step algebra and estimation.
- [ ] Wire up the `word-problems` view template.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying equation precedence math (e.g. correct execution of operator order).
- [ ] Validate story values (must not generate negative counts or fractional values for whole objects).
- [ ] Verify alignment of word wrapping in visual checks.

---

## 3.OA.D.9 - Identify and explain arithmetic patterns
* **CCSS Text:** Identify arithmetic patterns (including patterns in the addition table or multiplication table), and explain them using properties of operations. For example, observe that 4 times a number is always even, and explain why 4 times a number can be decomposed into two equal addends.
* **Ontology Reference:** Matched Areas: `Area.PatternRecognition`, `Area.ArithmeticLaws`, `Area.Multiplication`, `Area.Addition`, `Area.OddsAndEvens`, Scopes: `Scope.IntegerNumbers`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `ordering` generator (or construct a pattern mode).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Pattern Sequences):** Sequential patterns based on addition or multiplication rules.
     * *Labels:* `Area.PatternRecognition`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     * *Sample Question:* `3, 6, 9, 12, _, 18` (Rule: +3)
  2. **Permutation B (Odd/Even Multiplication Laws):** Logic checking odd/even multiplication and addition properties.
     * *Labels:* `Area.OddsAndEvens`, `Area.Multiplication`, `Scope.IntegersWithoutNegatives`, `Ability.InductiveReasoning`
     * *Sample Question:* `"Is the product of an even number and an odd number even or odd? [Even]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numbers-order` view or design `arithmetic-patterns`.
* **UI Layout details:** Draw a row of sequential cards with decorative borders. Leave one slot empty containing a dotted outline and question mark where the user inputs the value. Simple responsive styling fits up to 6 terms.

### Subtask 3: Developer Implementation Checklist
- [ ] Create pattern sequence parameters in the generator configuration.
- [ ] Write logic generating sequences based on steps.
- [ ] Add permutations to `permutations.ts` with pattern-matching ontology tags.
- [ ] Register views for arithmetic sequences.

### Subtask 4: Validation Plan
- [ ] Write unit tests to check sequence continuity (e.g. difference is constant).
- [ ] Validate bounds (maximum term value fits within 100).
- [ ] Preview screen wrapping of pattern cards.

---

## 3.NBT.A.1 - Round whole numbers to the nearest 10 or 100
* **CCSS Text:** Use place value understanding to round whole numbers to the nearest 10 or 100.
* **Ontology Reference:** Matched Areas: `Area.PlaceValue`, `Area.NumericApproximation`, `Area.Estimation`, `Area.Rounding`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`, `Scope.IntegerNumbers`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `writing` generator. Add parameters `roundingTarget` (value: `10 | 100`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Round to Tens):** Rounding 2 or 3 digit numbers to the nearest 10.
     * *Labels:* `Area.Rounding`, `Area.PlaceValue`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Round 438 to the nearest 10: [440]"`
  2. **Permutation B (Round to Hundreds):** Rounding 3 digit numbers to the nearest 100.
     * *Labels:* `Area.Rounding`, `Area.PlaceValue`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Round 438 to the nearest 100: [400]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numbers-write` view or design a new `numberline-rounding` view.
* **UI Layout details:** Display a horizontal number line featuring the target number and its nearest multiples of 10 or 100 as boundary markers. Mark the point to round with a colored dot, providing visual support for finding the closer multiple.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement rounding functions in `WritingGenerator.generate()`.
- [ ] Configure generator constraints for rounding bounds [0, 999].
- [ ] Add rounding permutations to `permutations.ts`.
- [ ] Set up visual template support for number-line diagrams.

### Subtask 4: Validation Plan
- [ ] Write unit tests validating mid-point rounding (e.g., numbers ending in 5 round up).
- [ ] Check values in range `[0, 1000]`.
- [ ] Verify number line endpoints align correctly.

---

## 3.NBT.A.2 - Fluently add and subtract within 1000
* **CCSS Text:** Fluently add and subtract within 1000 using strategies and algorithms based on place value, properties of operations, and/or the relationship between addition and subtraction.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, `Area.PlaceValue`, `Area.BaseOperations`, Scopes: `Scope.NumbersSmaller1000`, `Scope.IntegerNumbers`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `arithmetic` generator by allowing digits up to 3 (values up to 1000).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Addition):** Addition facts summing up to 1000.
     * *Labels:* `Area.Addition`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     * *Sample Question:* `458 + 387 = _`
  2. **Permutation B (Subtraction):** Subtraction facts within 1000.
     * *Labels:* `Area.Subtraction`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     * *Sample Question:* `713 - 256 = _`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-vertical` view.
* **UI Layout details:** Numbers are stacked vertically, with ones, tens, and hundreds places aligned. Draw carry/borrow grid indicator boxes above the digits to aid column calculation. Keep margins aligned and text readable.

### Subtask 3: Developer Implementation Checklist
- [ ] Extend `ArithmeticGenerator.generate()` bounds for 3-digit operands.
- [ ] Set up subtraction validation to prevent negative values in positive integer mode.
- [ ] Add 3-digit permutations to `permutations.ts`.
- [ ] Test alignment in `operations-vertical` view.

### Subtask 4: Validation Plan
- [ ] Unit tests verifying column-addition values in `arithmetic.tests.js`.
- [ ] Verify carrying and borrowing logic triggers correctly.
- [ ] Visually inspect column alignment on desktop and mobile viewports.

---

## 3.NBT.A.3 - Multiply 1-digit whole numbers by multiples of 10
* **CCSS Text:** Multiply one-digit whole numbers by multiples of 10 in the range 10–90 (e.g., 9 × 80, 5 × 60) using strategies based on place value and properties of operations.
* **Ontology Reference:** Matched Areas: `Area.Multiplication`, `Area.PlaceValue`, `Area.BaseOperations`, Scopes: `Scope.NumbersSmaller100`, `Scope.IntegerNumbers`, `Scope.IntegersWithoutNegatives`, `Scope.Base10`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `arithmetic` generator. Add constraints to generate one 1-digit factor and one multiple-of-ten factor.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Single × Multiple of 10):** 1-digit number first.
     * *Labels:* `Area.Multiplication`, `Area.PlaceValue`, `Scope.Base10`, `Ability.ProcedureExecution`
     * *Sample Question:* `6 × 70 = _`
  2. **Permutation B (Multiple of 10 × Single):** Multiple of 10 first.
     * *Labels:* `Area.Multiplication`, `Area.PlaceValue`, `Scope.Base10`, `Ability.ProcedureExecution`
     * *Sample Question:* `40 × 8 = _`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view.
* **UI Layout details:** Large font horizontal equation layout. Highlight the factor digits to draw a visual parallel to basic 1-digit fact families (e.g., `4 × 8` and `4 × 80`).

### Subtask 3: Developer Implementation Checklist
- [ ] Write logic generating factor multiples of 10 in `ArithmeticGenerator.generate()`.
- [ ] Configure permutations to use `Scope.Base10` constraint variant.
- [ ] Verify standard equation boxes support results up to 810.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that one of the factors is a multiple of 10 and the other is a single digit.
- [ ] Test bounds: maximum product is 810, minimum is 10.
- [ ] Inspect responsive spacing of elements.

---

## 3.NF.A.1 - Fractions as parts of a whole
* **CCSS Text:** Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts; understand a fraction a/b as the quantity formed by a parts of size 1/b.
* **Ontology Reference:** Matched Areas: `Area.FractionNotation`, `Area.NumerationWithFractions`, `Area.ProportionSense`, Scopes: `Scope.FractionNumbers`, `Scope.RationalNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `measurement` generator to support area fractions. Add parameters for partitions `b` (denominators: `[2, 3, 4, 6, 8]`) and shaded parts `a` (numerator: `[1, b]`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Unit Fractions):** Identifying unit fractions 1/b.
     * *Labels:* `Area.FractionNotation`, `Scope.FractionNumbers`, `Ability.ConceptSpecification`
     * *Sample Question:* `"What fraction of the shape is shaded? [1/4]"`
  2. **Permutation B (General Fractions):** Identifying non-unit fractions a/b.
     * *Labels:* `Area.FractionNotation`, `Scope.FractionNumbers`, `Ability.Understanding`
     * *Sample Question:* `"What fraction of the shape is shaded? [5/8]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Create new view `fractions-visual`.
* **UI Layout details:** Draw a geometric shape (circle, rectangle, or a set of blocks) partitioned into `b` equal segments using SVG. Fill `a` segments with a contrasting fill color. Position a vertical fraction input layout below.

### Subtask 3: Developer Implementation Checklist
- [ ] Write partitions mapping logic inside the generator.
- [ ] Ensure denominator variables are restricted to `[2, 3, 4, 6, 8]`.
- [ ] Create `fractions-visual` view using responsive SVG shape path formulas.
- [ ] Add fraction layout helper styles.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated fractions: numerator <= denominator.
- [ ] Validate denominator ranges conform to Grade 3 constraints.
- [ ] Confirm SVG paths divide shapes into mathematically identical areas.

---

## 3.NF.A.2a - Represent unit fractions on a number line
* **CCSS Text:** Represent a fraction 1/b on a number line diagram by defining the interval from 0 to 1 as the whole and partitioning it into b equal parts. Recognize that each part has size 1/b and that the endpoint of the part based at 0 locates the number 1/b on the number line.
* **Ontology Reference:** Matched Areas: `Area.FractionNotation`, `Area.NumerationWithFractions`, `Area.PointPlotting`, Scopes: `Scope.FractionNumbers`, `Scope.Numberline`, `Scope.SpatialNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `measurement` generator. Add parameter `numberLineMode` (value: `'unit' | 'general'`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Plot Value):** Identify unit fraction location 1/b.
     * *Labels:* `Area.PointPlotting`, `Scope.Numberline`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Identify the fraction at point A on the number line: [1/3]"`
  2. **Permutation B (Interval Measurement):** Understanding partition size.
     * *Labels:* `Area.FractionNotation`, `Scope.Numberline`, `Ability.VisualArticulation`
     * *Sample Question:* `"Partition this line into 4 parts and highlight the interval of size 1/4."`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `numberline-fraction`.
* **UI Layout details:** Draw a horizontal number line from 0 to 1. Ticks partition the line into `b` equal segments. Position a pin or label tag `A` on the tick corresponding to `1/b`.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement number line partitioning tick calculation logic.
- [ ] Set up permutations for unit fractions in `permutations.ts`.
- [ ] Create `numberline-fraction` view using SVG line elements.
- [ ] Highlight the segment from 0 to the target coordinate.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying tick counts match denominator value + 1.
- [ ] Validate fraction values inside range `(0, 1)`.
- [ ] Review tick label positioning to prevent text overlap.

---

## 3.NF.A.2b - Represent general fractions on a number line
* **CCSS Text:** Represent a fraction a/b on a number line diagram by marking off a lengths 1/b from 0. Recognize that the resulting interval has size a/b and that its endpoint locates the number a/b on the number line.
* **Ontology Reference:** Matched Areas: `Area.FractionNotation`, `Area.NumerationWithFractions`, `Area.PointPlotting`, Scopes: `Scope.FractionNumbers`, `Scope.Numberline`, `Scope.SpatialNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `measurement` generator to output general non-unit fraction parameters (numerator > 1).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Identify Point):** Find value of a point plotted at a/b.
     * *Labels:* `Area.PointPlotting`, `Scope.Numberline`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Identify the point on the number line: [5/6]"`
  2. **Permutation B (Greater than One):** Plotted points exceeding 1 (up to 2).
     * *Labels:* `Area.PointPlotting`, `Scope.Numberline`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Identify the point on the number line: [7/4]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numberline-fraction` view.
* **UI Layout details:** Highlight the interval from `0` to the plotted point `a/b` with a colored arch or highlighted bar, highlighting the concept of iteration (marking off `a` lengths of `1/b`).

### Subtask 3: Developer Implementation Checklist
- [ ] Configure non-unit fraction bounds (numerator `[1, 2b]`, denominator `[2, 3, 4, 6, 8]`).
- [ ] Add coordinate plotting calculations.
- [ ] Expand the `numberline-fraction` view template to render highlight arches.
- [ ] Configure dynamic viewport resizing.

### Subtask 4: Validation Plan
- [ ] Verify plotted coordinate aligns exactly to target tick.
- [ ] Test division arithmetic limits (e.g. proper and improper fractions up to 2).
- [ ] Confirm line colors are high-contrast.

---

## 3.NF.A.3a - Fraction equivalence via size/number line points
* **CCSS Text:** Understand two fractions as equivalent (equal) if they are the same size, or the same point on a number line.
* **Ontology Reference:** Matched Areas: `Area.FractionEquivalence`, `Area.NumerationWithFractions`, `Area.NumericIdentity`, Scopes: `Scope.FractionNumbers`, `Scope.Numberline`, `Scope.SpatialNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to compare number line and area locations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Stacked Lines):** Equivalent points on stacked number lines.
     * *Labels:* `Area.FractionEquivalence`, `Scope.Numberline`, `Ability.VisualRecognition`
     * *Sample Question:* `"Which point on the second number line is at the same location as 1/2? [2/4]"`
  2. **Permutation B (Area Match):** Matching areas on geometric layouts.
     * *Labels:* `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.Understanding`
     * *Sample Question:* `"Compare Model A (2/4 shaded) and Model B (1/2 shaded). Do they represent equivalent fractions? [Yes]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design view `fractions-equivalence-visual`.
* **UI Layout details:** Display two vertical stacked number lines (or adjacent shapes). Use aligned dotted lines to show how identical points or equal areas stack vertically.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement coordinates generator for dual comparative layouts.
- [ ] Setup equivalent fractions database (e.g. `[1/2, 2/4, 3/6, 4/8]`, `[1/3, 2/6]`).
- [ ] Build the `fractions-equivalence-visual` view.
- [ ] Standardize layout heights and widths.

### Subtask 4: Validation Plan
- [ ] Test that equivalent fractions resolve to equal values.
- [ ] Validate denominators constraints `[2, 3, 4, 6, 8]`.
- [ ] Verify vertical lines connecting stacked components are perfectly aligned.

---

## 3.NF.A.3b - Recognize and generate equivalent fractions
* **CCSS Text:** Recognize and generate simple equivalent fractions, e.g., 1/2 = 2/4, 4/6 = 2/3). Explain why the fractions are equivalent, e.g., by using a visual fraction model.
* **Ontology Reference:** Matched Areas: `Area.FractionEquivalence`, `Area.FractionNotation`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `comparison` generator to compare fractions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Generate Equivalent):** Missing term in equivalent fractions equations.
     * *Labels:* `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `3/4 = _/8`
  2. **Permutation B (Identify Equivalent):** Choose equivalent fractions.
     * *Labels:* `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.LogicalReasoning`
     * *Sample Question:* `"Select the equivalent fraction for 2/6: [1/3]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design `fractions-equivalence` view.
* **UI Layout details:** Display equation boxes next to visual circular partition pie charts showing shaded portions. Clear horizontal flow with high-contrast text.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement missing term equations in generator.
- [ ] Add equivalent fraction sets (limit values to Grade 3 constraints).
- [ ] Wire up SVG circle/pie chart renderer in view.
- [ ] Test styling layouts.

### Subtask 4: Validation Plan
- [ ] Test cross-multiplication of generated pairs to verify equivalence.
- [ ] Ensure denominators belong to `[2, 3, 4, 6, 8]`.
- [ ] Inspect mobile layout constraints.

---

## 3.NF.A.3c - Express whole numbers as fractions
* **CCSS Text:** Express whole numbers as fractions, and recognize fractions that are equivalent to whole numbers. Examples: Express 3 in the form 3 = 3/1; recognize that 6/1 = 6; locate 4/4 and 1 at the same point of a number line diagram.
* **Ontology Reference:** Matched Areas: `Area.FractionEquivalence`, `Area.NumerationWithFractions`, Scopes: `Scope.FractionNumbers`, `Scope.Numberline`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `writing` generator. Add parameter `wholeNumberMode` (value: `'denominator-1' | 'same-numerator-denominator' | 'multiple-division'`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Denominator 1):** Whole number to fraction with denominator 1.
     * *Labels:* `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `5 = _/1`
  2. **Permutation B (Equivalent to 1):** Fraction equivalent to 1.
     * *Labels:* `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `6/6 = _`
  3. **Permutation C (Whole Number Division):** Fraction division equivalent to integer.
     * *Labels:* `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `12/3 = _`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view.
* **UI Layout details:** Stack fraction numerals vertically, divided by a crisp horizontal fraction bar. Align the equal sign and whole number elements horizontally.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement whole-to-fraction algorithm in generator.
- [ ] Restrict denominators to `[1, 2, 3, 4, 6, 8]`.
- [ ] Adjust CSS formatting rules for aligned vertical fractions.
- [ ] Add permutations to config.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that the generated fraction values resolve to correct integer results.
- [ ] Check bounds: fractions evaluate to whole numbers in range `[1, 10]`.
- [ ] Visually verify spacing of vertical text blocks.

---

## 3.NF.A.3d - Compare fractions with same numerator/denominator
* **CCSS Text:** Compare two fractions with the same numerator or the same denominator by reasoning about their size. Recognize that comparisons are valid only when the two fractions refer to the same whole. Record the results of comparisons with the symbols >, =, or <, and justify the conclusions, e.g., by using a visual fraction model.
* **Ontology Reference:** Matched Areas: `Area.NumericComparison`, `Area.FractionNotation`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `comparison` generator.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Same Denominator):** Compare fractions sharing the same denominator.
     * *Labels:* `Area.NumericComparison`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `3/8 [?] 5/8` (expected: `<`)
  2. **Permutation B (Same Numerator):** Compare fractions sharing the same numerator.
     * *Labels:* `Area.NumericComparison`, `Scope.FractionNumbers`, `Ability.LogicalReasoning`
     * *Sample Question:* `3/4 [?] 3/6` (expected: `>`)

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numbers-compare` view.
* **UI Layout details:** Place the two fraction values side-by-side separated by the comparison bubble. Position two simple SVG bar models representing the quantities directly above each fraction to provide visual reasoning.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement fraction value compare generator logic.
- [ ] Ensure generator enforces either same-numerator or same-denominator constraints.
- [ ] Wire up comparison view configuration in pipeline.
- [ ] Draw comparative bar charts in template.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying comparison relation values evaluate correctly.
- [ ] Check constraints: numerator or denominator matches exactly.
- [ ] Verify comparison symbols align cleanly with values.

---

## 3.MD.A.1 - Tell time and solve elapsed time problems
* **CCSS Text:** Tell and write time to the nearest minute and measure time intervals in minutes. Solve word problems involving addition and subtraction of time intervals in minutes, e.g., by representing the problem on a number line diagram.
* **Ontology Reference:** Matched Areas: `Area.MeasuringTime`, `Area.Addition`, `Area.Subtraction`, Scopes: `Scope.TimeMeasurement`, `Scope.MinuteIntervals`, `Scope.Numberline`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `time` generator. Add parameter `minutePrecision` (value: `1 | 5 | 15`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Read Clock):** Tell time to nearest minute from analog clock.
     * *Labels:* `Area.MeasuringTime`, `Scope.TimeMeasurement`, `Scope.MinuteIntervals`, `Ability.ProcedureExecution`
     * *Sample Question:* Read analog clock showing 4:17.
  2. **Permutation B (Interval Addition/Subtraction):** Elapsed time calculations.
     * *Labels:* `Area.MeasuringTime`, `Scope.MinuteIntervals`, `Ability.ProcedureExecution`
     * *Sample Question:* `"A game starts at 3:15 PM and ends at 3:48 PM. How many minutes did it last? [33 minutes]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `time-analog` view for clock-reading, and design new number-line layout for elapsed time.
* **UI Layout details:** The clock face must display clear, distinct tick marks for each of the 60 minutes. The interval number-line view should show timeline jumps from start to end time with arc indicators.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement minute-level hand angle calculations in generator.
- [ ] Add interval arithmetic calculations.
- [ ] Register permutations in `permutations.ts`.
- [ ] Map number-line timeline diagrams in clock renderer.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying hand angles are mathematically correct (e.g. minute hand at `360/60 * min` degrees).
- [ ] Test elapsed time logic for correctness (within same hour, across hour boundaries).
- [ ] Review clock face numbers visibility.

---

## 3.MD.A.2 - Measure and estimate liquid volumes and masses
* **CCSS Text:** Measure and estimate liquid volumes and masses of objects using standard units of grams (g), kilograms (kg), and liters (l). (Excludes compound units such as cm^3 and finding the geometric volume of a container.) Add, subtract, multiply, or divide to solve one-step word problems involving masses or volumes that are given in the same units, e.g., by using drawings (such as a beaker with a measurement scale) to represent the problem.
* **Ontology Reference:** Matched Areas: `Area.Estimation`, `Area.Addition`, `Area.Subtraction`, `Area.Multiplication`, `Area.Division`, Scopes: `Scope.LiquidVolumes`, `Scope.WeightMeasurement`, `Scope.GramScale`, `Scope.KilogramScale`, `Scope.LiterScale`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator. Add parameters `measurementType` (`'volume' | 'mass'`) and `scaleUnit` (`'g' | 'kg' | 'l'`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Graduated Cylinder):** Liquid volume measurement scale reading.
     * *Labels:* `Area.Estimation`, `Scope.LiquidVolumes`, `Scope.LiterScale`, `Ability.ProcedureExecution`
     * *Sample Question:* `"How much liquid is in the beaker? [600 liters]"`
  2. **Permutation B (Balance Scale):** Mass reading from balance scales.
     * *Labels:* `Area.Estimation`, `Scope.WeightMeasurement`, `Scope.KilogramScale`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Find the mass of the package on the scale: [12 kilograms]"`
  3. **Permutation C (Measurement Word Problems):** Word problems using basic arithmetic operations.
     * *Labels:* `Area.Addition`, `Scope.GramScale`, `Ability.ProcedureExecution`
     * *Sample Question:* `"A recipe uses 250g of sugar and 180g of butter. What is the total mass? [430 grams]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `measure-volume-mass`.
* **UI Layout details:** Use SVG to draw a vertical beaker featuring horizontal measurement lines and labeled tick marks, filled with colored water representation. Balance scale drawing displays weights on a tray balanced with the target object.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement beaker level and weight sum math in generator.
- [ ] Add word problem templates for measurement arithmetic.
- [ ] Create `measure-volume-mass` view folder.
- [ ] Register new view layout in Vite config.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that fluid levels align precisely to grid tick marks.
- [ ] Validate bounds: arithmetic values within 1000.
- [ ] Visually inspect beaker volume levels.

---

## 3.MD.B.3 - Scaled picture and bar graphs
* **CCSS Text:** Draw a scaled picture graph and a scaled bar graph to represent a data set with several categories. Solve one- and two-step “how many more” and “how many less” problems using information presented in scaled bar graphs. For example, draw a bar graph in which each square in the bar graph might represent 5 pets.
* **Ontology Reference:** Matched Areas: `Area.Statistics`, `Area.Difference`, Scopes: `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `comparison` generator to output category frequencies. Add parameter `graphScale` (value: `2 | 5 | 10`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Scaled Bar Graph):** Category comparison in scaled bar charts.
     * *Labels:* `Area.Statistics`, `Area.Difference`, `Scope.VisualNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `"How many more votes did Apples get than Grapes? (Scale: 1 box = 5 votes)"`
  2. **Permutation B (Scaled Pictograph):** Interpreting item counts from pictograph symbols.
     * *Labels:* `Area.Statistics`, `Scope.VisualNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `"What is the total count of pets? (Key: 1 icon = 10 pets)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `graphs-scaled`.
* **UI Layout details:** Render standard SVG vertical bar charts (with labeled scales on the Y-axis) or pictographs displaying rows of repeated icons (e.g. apple shapes). Position a clear scale key at the bottom center.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement category/frequency data generator.
- [ ] Enforce frequency values to be multiples of scale (`graphScale`).
- [ ] Create `graphs-scaled` view template rendering bars and icons dynamically.
- [ ] Apply responsive viewport limits.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying frequency division matches integer chart coordinates.
- [ ] Validate bounds: categories counts <= 50.
- [ ] Confirm icon scaling is crisp and uniform.

---

## 3.MD.B.4 - Measure lengths to fractional inches and plot data
* **CCSS Text:** Generate measurement data by measuring lengths using rulers marked with halves and fourths of an inch. Show the data by making a line plot, where the horizontal scale is marked off in appropriate units— whole numbers, halves, or quarters.
* **Ontology Reference:** Matched Areas: `Area.LengthCalculation`, `Area.Statistics`, Scopes: `Scope.LengthMeasurement`, `Scope.PhysicalRuler`, `Scope.FractionNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator. Add parameter `rulerSubdivisions` (value: `'half' | 'quarter'`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Measure Nearest Fourth):** Measure object lengths to nearest 1/4 inch.
     * *Labels:* `Area.LengthCalculation`, `Scope.PhysicalRuler`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Measure the stick to the nearest 1/4 inch: [5 3/4]"`
  2. **Permutation B (Line Plot Reading):** Count observations from fractional line plots.
     * *Labels:* `Area.Statistics`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* `"How many sticks are 4 1/2 inches long? (Count Xs plotted over 4 1/2)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Extend `measure-length` ruler graphics, and create view `line-plots`.
* **UI Layout details:** The ruler must show distinct tick heights for whole, half, and quarter-inch intervals. Line plots display a horizontal axis with fractions (`1/4, 1/2, 3/4`) and vertical stacked 'X' markers.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement fraction coordinate tick math for the ruler.
- [ ] Add line plot rendering configuration to generator.
- [ ] Create `line-plots` view and register layout.
- [ ] Set up layout responsiveness.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying object bounds align exactly to division ticks.
- [ ] Validate fraction values are properly formatted as mixed numbers.
- [ ] Verify vertical margins of stacked plot Xs.

---

## 3.MD.C.5a - Concept of unit square and area
* **CCSS Text:** A square with side length 1 unit, called “a unit square,” is said to have “one square unit” of area, and can be used to measure area.
* **Ontology Reference:** Matched Areas: `Area.AreaCalculation`, `Area.Square`, Scopes: `Scope.TwoDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator. Add parameter `areaMode` (value: `'definition' | 'composite-counting'`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Unit Square Definition):** Identifying area of 1 unit square.
     * *Labels:* `Area.AreaCalculation`, `Area.Square`, `Scope.TwoDimensional`, `Ability.Understanding`
     * *Sample Question:* `"A square has side lengths of 1 unit. Its area is: [1] square unit"`
  2. **Permutation B (Count Area Units):** Finding area from count of square units.
     * *Labels:* `Area.AreaCalculation`, `Scope.TwoDimensional`, `Ability.Understanding`
     * *Sample Question:* `"This figure is made of unit squares. What is the area? [9]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `area-grids`.
* **UI Layout details:** Draw a grid of boxes, highlighting a single box (labeled "1 unit square") alongside a shape built from several highlighted grid boxes. Use solid border colors and high contrast.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement definitions and simple grid questions in generator.
- [ ] Configure permutations.
- [ ] Create `area-grids` view template.
- [ ] Test CSS styling rules.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying grid cell count matches target answer.
- [ ] Validate dimension arrays (e.g. ranges up to 25 squares).
- [ ] Confirm layout scales appropriately on mobile devices.

---

## 3.MD.C.5b - Covered plane figures area measurement
* **CCSS Text:** A plane figure which can be covered without gaps or overlaps by n unit squares is said to have an area of n square units.
* **Ontology Reference:** Matched Areas: `Area.AreaCalculation`, `Area.PlaneConcept`, Scopes: `Scope.TwoDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to build irregular grid outline shapes without gaps or overlaps.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Shaded Area Counting):** Finding the area of plane figures by counting shaded cells on a grid.
     * *Labels:* `Area.AreaCalculation`, `Scope.TwoDimensional`, `Ability.Understanding`
     * *Sample Question:* `"Find the area of the shape by counting the shaded unit squares: [14]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `area-grids` view.
* **UI Layout details:** Render a larger grid array (e.g. 6x6) with block coordinates shaded to construct simple irregular forms (e.g., stairs, L-shapes). Ensure borders between cells are visible to assist counting.

### Subtask 3: Developer Implementation Checklist
- [ ] Write logic generating irregular coordinate shapes in generator.
- [ ] Enforce coordinate sets to be contiguous and non-overlapping.
- [ ] Confirm rendering templates draw boundaries cleanly.

### Subtask 4: Validation Plan
- [ ] Test calculations for composite areas against manually checked shapes.
- [ ] Validate cells count in range `[1, 36]`.
- [ ] Verify that colored backgrounds have sufficient contrast against grids.

---

## 3.MD.C.6 - Measure areas by counting unit squares
* **CCSS Text:** Measure areas by counting unit squares (square cm, square m, square in, square ft, and improvised units).
* **Ontology Reference:** Matched Areas: `Area.AreaCalculation`, Scopes: `Scope.TwoDimensional`, `Scope.MeasurementScope`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator. Add parameter `areaUnit` (value: `'cm' | 'm' | 'in' | 'ft' | 'improvised'`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Standard Units):** Counting unit squares labeled with standard dimensions.
     * *Labels:* `Area.AreaCalculation`, `Scope.MeasurementScope`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Find the area of the shape in square centimeters: [12 square cm]"`
  2. **Permutation B (Improvised Units):** Improvised blocks counting.
     * *Labels:* `Area.AreaCalculation`, `Scope.MeasurementScope`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Each block is 1 square unit. Find the area: [16 blocks]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `area-grids` view.
* **UI Layout details:** Add a legend box displaying grid scale details (e.g. "1 square = 1 square inch"). Center the legend clearly above the main grid layout.

### Subtask 3: Developer Implementation Checklist
- [ ] Add unit configurations to generator.
- [ ] Add permutations to `permutations.ts` for each unit type.
- [ ] Support units text labels in the main template.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying correct unit text mappings in generated questions.
- [ ] Check areas within range `[1, 50]`.
- [ ] Check page layout alignment.

---

## 3.MD.C.7a - Rectangular area tiling vs side multiplication
* **CCSS Text:** Find the area of a rectangle with whole-number side lengths by tiling it, and show that the area is the same as would be found by multiplying the side lengths.
* **Ontology Reference:** Matched Areas: `Area.AreaCalculation`, `Area.Rectangle`, `Area.Multiplication`, Scopes: `Scope.TwoDimensional`, `Scope.IntegersWithoutNegatives`, `Scope.PhysicalGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator. Add parameter `tiled` (value: `true`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Tiling Identity):** Area equation verification comparing grid count to product.
     * *Labels:* `Area.AreaCalculation`, `Area.Multiplication`, `Scope.PhysicalGeometry`, `Ability.DeductiveReasoning`
     * *Sample Question:* `"This rectangle has 4 rows of 5 squares. Count the squares: [20]. Multiply the sides: 4 × 5 = [20]."`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `area-grids` view.
* **UI Layout details:** Render a rectangle with labeled dimensions along the top and left side. Overlay grid divisions inside the rectangle. Highlight the row-by-column structure.

### Subtask 3: Developer Implementation Checklist
- [ ] Add row/column parameters to generator.
- [ ] Setup permutations in `permutations.ts` mapping tiling properties.
- [ ] Configure side label annotations in the layout.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that product matches count parameters.
- [ ] Validate side bounds within `[1, 10]`.
- [ ] Confirm clean side label alignment.

---

## 3.MD.C.7b - Multiply side lengths to find rectangular areas
* **CCSS Text:** Multiply side lengths to find areas of rectangles with whole number side lengths in the context of solving real world and mathematical problems, and represent whole-number products as rectangular areas in mathematical reasoning.
* **Ontology Reference:** Matched Areas: `Area.AreaCalculation`, `Area.Rectangle`, `Area.Multiplication`, Scopes: `Scope.TwoDimensional`, `Scope.IntegersWithoutNegatives`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator. Add parameter `showGrid` (value: `false`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Mathematical Area):** Find area of non-tiled rectangle with side length dimensions.
     * *Labels:* `Area.AreaCalculation`, `Area.Rectangle`, `Scope.VisualGeometry`, `Ability.ProcedureExecution`
     * *Sample Question:* Rectangle with sides 8m and 6m. Area = [48] square meters.
  2. **Permutation B (Area Word Problem):** Real-world rectangular area word problems.
     * *Labels:* `Area.AreaCalculation`, `Area.Multiplication`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     * *Sample Question:* `"A rug is 7 feet long and 5 feet wide. What is its area? [35] square feet"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `measure-geometry`.
* **UI Layout details:** Draw an outline rectangle (no interior grid lines) with dimension markers and labels centered next to each side. Scale the rectangle aspect ratio dynamically.

### Subtask 3: Developer Implementation Checklist
- [ ] Write generator logic for rectangular side multiplication problems.
- [ ] Configure permutations configuration in `permutations.ts`.
- [ ] Implement side annotations in `measure-geometry` view.
- [ ] Set up layout responsive scaling.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying multiplication correctness.
- [ ] Validate side length values up to 20.
- [ ] Check dimension label readability.

---

## 3.MD.C.7c - Distributive property area models
* **CCSS Text:** Use tiling to show in a concrete case that the area of a rectangle with whole-number side lengths a and b + c is the sum of a × b and a × c. Use area models to represent the distributive property in mathematical reasoning.
* **Ontology Reference:** Matched Areas: `Area.AreaCalculation`, `Area.Rectangle`, `Area.DistributiveLaw`, `Area.Multiplication`, `Area.Addition`, Scopes: `Scope.TwoDimensional`, `Scope.IntegersWithoutNegatives`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator. Add parameters `a`, `b`, `c` for side splits.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Distributive Formula):** Complete distributive equation from visual model.
     * *Labels:* `Area.DistributiveLaw`, `Area.AreaCalculation`, `Scope.VisualGeometry`, `Ability.DeductiveReasoning`
     * *Sample Question:* `4 × (5 + 2) = 4 × 5 + 4 × _`
  2. **Permutation B (Area Model Shading):** Shaded area segments calculation.
     * *Labels:* `Area.DistributiveLaw`, `Scope.VisualGeometry`, `Ability.Visualization`
     * *Sample Question:* Fill in the areas of partitioned rectangles (e.g. left part: 6x5, right part: 6x2).

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `area-distributive`.
* **UI Layout details:** Draw a large rectangle split vertically into two sections shaded with different colors. Annotate the shared height `a` and widths `b` and `c` of the two partitioned sections.

### Subtask 3: Developer Implementation Checklist
- [ ] Add split parameters `a`, `b`, `c` to generator properties.
- [ ] Write logic constructing distributive expressions.
- [ ] Create `area-distributive` view template displaying partitioned blocks.
- [ ] Add layout color customization.

### Subtask 4: Validation Plan
- [ ] Write unit tests to check that sum of sub-areas equals total product.
- [ ] Validate side length bounds (all variables <= 10).
- [ ] Inspect visual alignment of height and width labels.

---

## 3.MD.C.7d - Area of rectilinear figures by decomposition
* **CCSS Text:** Recognize area as additive. Find areas of rectilinear figures by decomposing them into non-overlapping rectangles and adding the areas of the non-overlapping parts, applying this technique to solve real world problems.
* **Ontology Reference:** Matched Areas: `Area.AreaCalculation`, `Area.Rectangle`, `Area.Addition`, Scopes: `Scope.TwoDimensional`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to construct L-shaped or T-shaped rectilinear polygons.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Decomposed Area):** Finding the area of an L-shaped figure.
     * *Labels:* `Area.AreaCalculation`, `Scope.TwoDimensional`, `Ability.VisualDecomposition`
     * *Sample Question:* L-shaped figure with annotated outer side dimensions.
  2. **Permutation B (Sum of Rectangles):** Calculating sum of partitioned rectangle components.
     * *Labels:* `Area.AreaCalculation`, `Area.Addition`, `Scope.TwoDimensional`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Decompose the figure and find the total area: Area A (15) + Area B (8) = [23]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `rectilinear-area`.
* **UI Layout details:** Render an L-shaped or T-shaped polygon on an SVG canvas. Display annotated dimension strings next to outer edges. Optionally draw a dashed line showing the partition.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement irregular polygon coordinates builder in generator.
- [ ] Enforce consistent side calculations (e.g. left + right equals total width).
- [ ] Create `rectilinear-area` view displaying SVG paths.
- [ ] Test viewport responsive scaling.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that sum of partitioned rectangles matches total area calculations.
- [ ] Check values in range `[10, 100]`.
- [ ] Verify that coordinates generate polygons without self-intersection.

---

## 3.MD.D.8 - Perimeter of polygons and comparison with area
* **CCSS Text:** Solve real world and mathematical problems involving perimeters of polygons, including finding the perimeter given the side lengths, finding an unknown side length, and exhibiting rectangles with the same perimeter and different areas or with the same area and different perimeters.
* **Ontology Reference:** Matched Areas: `Area.PerimeterCalculation`, `Area.AreaCalculation`, `Area.Polygon`, `Area.Rectangle`, Scopes: `Scope.TwoDimensional`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator. Add parameter `geometryTarget` (value: `'perimeter' | 'unknown-side' | 'perimeter-vs-area'`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Find Perimeter):** Summing sides to find polygon perimeter.
     * *Labels:* `Area.PerimeterCalculation`, `Area.Polygon`, `Scope.TwoDimensional`, `Ability.ProcedureExecution`
     * *Sample Question:* Pentagon with sides 4cm, 5cm, 3cm, 6cm, 5cm. Perimeter = [23] cm.
  2. **Permutation B (Unknown Side):** Find missing side length given total perimeter.
     * *Labels:* `Area.PerimeterCalculation`, `Scope.TwoDimensional`, `Ability.ProcedureExecution`
     * *Sample Question:* Triangle with sides 6, 8, and x. Perimeter is 22. Solve for x: [8].
  3. **Permutation C (Perimeter vs Area):** Compare rectangles sharing same perimeter but different areas.
     * *Labels:* `Area.PerimeterCalculation`, `Area.AreaCalculation`, `Area.Rectangle`, `Ability.ProcedureExecution`
     * *Sample Question:* `"Rectangle A: 4x6 (perimeter 20), Rectangle B: 3x7 (perimeter 20). Which has larger area? [A]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `measure-perimeter`.
* **UI Layout details:** Draw custom SVG shapes (triangles, rectangles, pentagons, hexagons) with annotated side lengths along the outline. Position central prompt questions.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement polygon coordinates generator and perimeter sum logic.
- [ ] Add algebraic missing-side equations solver.
- [ ] Create `measure-perimeter` view.
- [ ] Add responsive sizing rules.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that sum of side values matches perimeter output.
- [ ] Validate side constraints (all side lengths > 0).
- [ ] Check label coordinates to prevent overlapping with line paths.

---

## 3.G.A.1 - Classify quadrilaterals by shared attributes
* **CCSS Text:** Understand that shapes in different categories (e.g., rhombuses, rectangles, and others) may share attributes (e.g., having four sides), and that the shared attributes can define a larger category (e.g., quadrilaterals). Recognize rhombuses, rectangles, and squares as examples of quadrilaterals, and draw examples of quadrilaterals that do not belong to any of these subcategories.
* **Ontology Reference:** Matched Areas: `Area.Quadrilateral`, `Area.Rhombus`, `Area.Rectangle`, `Area.Square`, Scopes: `Scope.TwoDimensional`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `writing` generator (attribute names classification). Add parameter `geometryMode` (value: `'identify-quadrilateral' | 'attribute-match'`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Classify Shape):** Match shape to category.
     * *Labels:* `Area.Quadrilateral`, `Scope.VisualGeometry`, `Ability.ConceptClassification`
     * *Sample Question:* `"Which of these shapes are quadrilaterals? [Rectangle, Rhombus]"`
  2. **Permutation B (Identify Attributes):** Match attributes definition to correct shape category.
     * *Labels:* `Area.Rectangle`, `Scope.VisualGeometry`, `Ability.ConceptSpecification`
     * *Sample Question:* `"Identify the shape: 4 equal sides, no right angles. [Rhombus]"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Design new view `shapes-classification`.
* **UI Layout details:** Display high-quality SVG shape outlines (rectangles, rhombuses, squares, trapezoids, general quadrilaterals). Position an interactive checkbox selection block for attribute matching below.

### Subtask 3: Developer Implementation Checklist
- [ ] Add shape classes and attribute tables to generator database.
- [ ] Configure permutations for quadrilaterals.
- [ ] Create `shapes-classification` view.
- [ ] Register new template configurations.

### Subtask 4: Validation Plan
- [ ] Test that correct attributes match selected shape types in unit tests.
- [ ] Validate shape drawings bounds (rhombuses must not render with 90-degree corners).
- [ ] Confirm clean page margins.

---

## 3.G.A.2 - Partition shapes into equal areas
* **CCSS Text:** Partition shapes into parts with equal areas. Express the area of each part as a unit fraction of the whole. For example, partition a shape into 4 parts with equal area, and describe the area of each part as 1/4 of the area of the shape.
* **Ontology Reference:** Matched Areas: `Area.AreaCalculation`, `Area.FractionNotation`, Scopes: `Scope.TwoDimensional`, `Scope.FractionNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator. Add parameter `partitionCount` (value: `2 | 3 | 4 | 6 | 8`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Partition Area):** Identify unit fraction of partitioned shapes.
     * *Labels:* `Area.AreaCalculation`, `Scope.TwoDimensional`, `Ability.Visualization`
     * *Sample Question:* `"A shape is split into 6 equal areas. Each part represents: [1/6]"`
  2. **Permutation B (Shading Matching):** Shaded partitions area representation.
     * *Labels:* `Area.FractionNotation`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * *Sample Question:* Rectangle partitioned into 3 parts, 1 shaded. Fraction = [1/3].

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `fractions-visual` view or design `partition-shapes`.
* **UI Layout details:** Display shape contours (circles, rectangles, hexagons) split into equal divisions with interactive shading options. Divider lines must be clearly visible.

### Subtask 3: Developer Implementation Checklist
- [ ] Write logic determining coordinate splits for basic shapes in generator.
- [ ] Register permutations.
- [ ] Wire up `partition-shapes` view template.
- [ ] Configure custom styles.

### Subtask 4: Validation Plan
- [ ] Write unit tests checking that divisions result in mathematically equal sub-areas.
- [ ] Validate partition count ranges `[2, 8]`.
- [ ] Inspect rendering of divider lines.
