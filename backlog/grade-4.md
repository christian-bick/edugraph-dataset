# Grade 4 Curriculum Mapping Task Backlog

This document contains the detailed backlog of tasks for the Grade 4 leaf standards that are uncovered in the dataset but covered in the ontology.

---

## 4.OA.A.3 - Multistep Word Problems
* **CCSS Text:** Solve multistep word problems posed with whole numbers and having whole-number answers using the four operations, including problems in which remainders must be interpreted. Represent these problems using equations with a letter standing for the unknown quantity. Assess the reasonableness of answers using mental computation and estimation strategies including rounding.
* **Ontology Reference:** Matched Areas: `Area.ArithmeticEvaluation`, `Area.Modulo`, `Area.Estimation`, `Area.DecimalRounding`, Scopes: `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding a new mode `multistep-word-problems`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Division word problems requiring remainder interpretation (e.g. rounding up quotient, drops remainder, remainder is answer).
     * Labels: `Area.Modulo`, `Area.ArithmeticEvaluation`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     * Parameters: `type: "division-remainder"`, `dividendRange: [20, 100]`, `divisorRange: [3, 9]`, `remainderInterpretation: "round-up"`
     * Sample question: `"A school bus can hold 8 students. If 35 students are going on a trip, how many buses are needed?"`
  2. **Permutation B:** Write a multistep equation using a variable for an unknown quantity.
     * Labels: `Area.ArithmeticEvaluation`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     * Parameters: `type: "equation-representation"`, `variable: "c"`, `operationSequence: ["multiply", "subtract"]`
     * Sample question: `"A baker made 6 batches of 10 muffins. She sold 15 muffins. Write an equation using m to represent the muffins left."`
  3. **Permutation C:** Mental math estimation and checking reasonableness using rounding.
     * Labels: `Area.Estimation`, `Area.DecimalRounding`, `Scope.IntegersWithoutNegatives`, `Ability.PlausibilityEvaluation`
     * Parameters: `type: "estimation-reasonableness"`, `roundingPlace: 100`
     * Sample question: `"Estimate 289 + 412 by rounding each to the nearest hundred. Is 700 a reasonable estimate? (Yes/No)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `operations-word-problem`.
* **UI Layout details:** Simple card displaying the word problem text prominently. Below the text, render either a grid of multiple choice options (for equations) or a structured text field with fraction/whole layout. Highly readable fonts and mobile-friendly input boxes.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to `src/generators/arithmetic/config.ts`.
- [ ] Implement the word problem generation templates and division/remainder logic in `src/generators/arithmetic/index.ts`.
- [ ] Add permutations to `src/generators/arithmetic/permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (e.g. dividends [10, 100], divisors [2, 10]).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.OA.B.4 - Factors, Multiples, and Prime/Composite
* **CCSS Text:** Find all factor pairs for a whole number in the range 1–100. Recognize that a whole number is a multiple of each of its factors. Determine whether a given whole number in the range 1–100 is a multiple of a given one-digit number. Determine whether a given whole number in the range 1–100 is prime or composite.
* **Ontology Reference:** Matched Areas: `Area.FactorsAndMultiples`, `Area.PrimeNumbers`, `Area.Factorization`, Scopes: `Scope.IntegerNumbers`, `Scope.NumbersSmaller100`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding a new mode `factors-multiples`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Find all factor pairs of a number under 100.
     * Labels: `Area.Factorization`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     * Parameters: `type: "factor-pairs"`, `range: [10, 100]`
     * Sample question: `"Find all factor pairs for 18. (List them like 1x18, 2x9, 3x6)"`
  2. **Permutation B:** Determine if a whole number under 100 is a multiple of a single-digit number.
     * Labels: `Area.FactorsAndMultiples`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     * Parameters: `type: "is-multiple"`, `numberRange: [10, 100]`, `divisorRange: [2, 9]`
     * Sample question: `"Is 54 a multiple of 6? (Yes/No)"`
  3. **Permutation C:** Classify a number as prime or composite.
     * Labels: `Area.PrimeNumbers`, `Scope.NumbersSmaller100`, `Ability.ConceptSpecification`
     * Parameters: `type: "prime-composite"`, `range: [2, 100]`
     * Sample question: `"Is 29 a prime number or composite number?"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `factors-selection`.
* **UI Layout details:** A large central block displaying the target number. Below it, an interactive grid of candidate number chips. The user taps chips to select factor pairs or multiples. Supports touch drag-and-drop on mobile.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement factor finding, prime checking, and multiple checking algorithms in generator helpers.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (range [1, 100]).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.OA.C.5 - Generating and Analyzing Patterns
* **CCSS Text:** Generate a number or shape pattern that follows a given rule. Identify apparent features of the pattern that were not explicit in the rule itself. For example, given the rule “Add 3” and the starting number 1, generate terms in the resulting sequence and observe that the terms appear to alternate between odd and even numbers. Explain informally why the numbers will continue to alternate in this way.
* **Ontology Reference:** Matched Areas: `Area.PatternRecognition`, `Area.IntuitiveMathematics`, Scopes: `Scope.IntegerNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `counting` generator by adding a new mode `pattern-rules`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Generate next terms of a number pattern given a rule and starting value.
     * Labels: `Area.PatternRecognition`, `Scope.IntegerNumbers`, `Ability.ProcedureExecution`
     * Parameters: `ruleType: "arithmetic"`, `startValue: 2`, `rule: "+4"`, `termsToFill: 3`
     * Sample question: `"Given the rule 'Add 4' and start number 2, complete the pattern: 2, 6, _, _, _"`
  2. **Permutation B:** Identify implicit properties of a generated pattern (e.g. odd/even alternation, final digit repetition).
     * Labels: `Area.PatternRecognition`, `Scope.IntegerNumbers`, `Ability.InductiveReasoning`
     * Parameters: `ruleType: "alternating"`, `startValue: 1`, `rule: "+3"`, `propertyQuestion: "odd-even"`
     * Sample question: `"Given the rule 'Add 3' and start 1, the pattern is 1, 4, 7, 10, 13... What feature is true about the terms? (Options: They alternate odd/even, they are all even, they are all odd)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `pattern-grid`.
* **UI Layout details:** A horizontal sequence of boxes displaying current numbers with empty input fields for target values. Below, a radio-button selection panel for implicit property questions. Fully responsive, wraps boxes nicely on small screens.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the counting generator config.
- [ ] Implement the sequence math generator and property detection in `src/generators/counting/index.ts`.
- [ ] Add permutations to `src/generators/counting/permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `counting.tests.js`.
- [ ] Validate question generation boundary values (limit sequence values under 200).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NBT.A.1 - Multi-digit Place Value Relationships
* **CCSS Text:** Recognize that in a multi-digit whole number, a digit in one place represents ten times what it represents in the place to its right. For example, recognize that 700 ÷ 70 = 10 by applying concepts of place value and division. Grade 4 expectations in this domain are limited to whole numbers less than or equal to 1,000,000.
* **Ontology Reference:** Matched Areas: `Area.PlaceValue`, `Area.IntegerNotation`, Scopes: `Scope.Base10`, `Scope.IntegerNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `writing` generator by adding a new mode `place-value-relations`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Identify that a digit in one place is 10 times the value of the digit to its right.
     * Labels: `Area.PlaceValue`, `Scope.Base10`, `Ability.Understanding`
     * Parameters: `type: "digit-value-comparison"`, `digitValue: 5`, `number: 5500`
     * Sample question: `"In the number 5,500, the 5 in the thousands place is how many times the value of the 5 in the hundreds place?"`
  2. **Permutation B:** division equations demonstrating place value (e.g. 8000 / 800 = 10).
     * Labels: `Area.PlaceValue`, `Scope.IntegerNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "division-place-value"`, `digit: 7`, `dividendPlace: 1000`, `divisorPlace: 100`
     * Sample question: `"Find the value: 7,000 ÷ 70 = _"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `place-value-chart`.
* **UI Layout details:** Displays a horizontal place value board (Millions, Hundred Thousands, Ten Thousands, Thousands, Hundreds, Tens, Ones) highlighting two adjacent columns with arrows indicating the 10x relationship. Below, a numeric or text input field. High-contrast colors, fits narrow mobile screens by scrolling the chart horizontally.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the writing config.
- [ ] Implement the comparison questions generator and division math in writing generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `writing.tests.js`.
- [ ] Validate question generation boundary values (range up to 1,000,000).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NBT.A.2 - Read, Write, and Compare Multi-digit Whole Numbers
* **CCSS Text:** Read and write multi-digit whole numbers using base-ten numerals, number names, and expanded form. Compare two multi-digit numbers based on meanings of the digits in each place, using >, =, and < symbols to record the results of comparisons. Grade 4 expectations in this domain are limited to whole numbers less than or equal to 1,000,000.
* **Ontology Reference:** Matched Areas: `Area.IntegerNotation`, `Area.NumericComparison`, `Area.PlaceValue`, Scopes: `Scope.Base10`, `Scope.ArabicNumerals`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `writing` generator for notation conversions, and `comparison` generator for comparing large numbers.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Convert standard form <-> word name <-> expanded form.
     * Labels: `Area.IntegerNotation`, `Scope.ArabicNumerals`, `Ability.VisualArticulation`
     * Parameters: `type: "conversion"`, `fromFormat: "word"`, `toFormat: "expanded"`, `valueRange: [1000, 1000000]`
     * Sample question: `"Write 342,050 in expanded form: 300,000 + 40,000 + 2,000 + 50"`
  2. **Permutation B:** Compare two large numbers with highly similar digits (to test place value focus).
     * Labels: `Area.NumericComparison`, `Scope.Base10`, `Ability.ProcedureExecution`
     * Parameters: `type: "compare-large"`, `similarity: "high"`, `valueRange: [10000, 1000000]`
     * Sample question: `"Compare: 452,891 _ 452,981 (Choose <, >, or =)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numbers-write` (for conversion inputs) and `numbers-compare` (for comparisons).
* **UI Layout details:** The `numbers-compare` view displays the two large numbers in bold, with a large dropdown select field in the center. Completely responsive, aligns items vertically on extremely small screens to prevent clipping.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to both generators' configs.
- [ ] Implement word-name parser/generator for numbers up to 1,000,000 in `src/generators/writing/utils.ts`.
- [ ] Add permutations to `permutations.ts` in writing and comparison generators.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `writing.tests.js` and `comparison.tests.js`.
- [ ] Validate question generation boundary values (limit [0, 1,000,000]).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NBT.A.3 - Rounding Multi-digit Numbers
* **CCSS Text:** Use place value understanding to round multi-digit whole numbers to any place. Grade 4 expectations in this domain are limited to whole numbers less than or equal to 1,000,000.
* **Ontology Reference:** Matched Areas: `Area.PlaceValue`, `Area.IntegerRounding`, Scopes: `Scope.IntegerNumbers`, `Scope.NumbersLarger1000`, `Scope.Base10`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding a new mode `rounding`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Round a multi-digit number to a specified place (thousands, ten-thousands, etc.).
     * Labels: `Area.PlaceValue`, `Area.IntegerRounding`, `Scope.NumbersLarger1000`, `Ability.ProcedureExecution`
     * Parameters: `range: [10000, 1000000]`, `roundToPlace: "ten-thousands"`
     * Sample question: `"Round 382,905 to the nearest ten thousand: _"`
  2. **Permutation B:** Identify numbers that would round to a target multiple (conceptual rounding).
     * Labels: `Area.PlaceValue`, `Area.IntegerRounding`, `Scope.Base10`, `Ability.ProcedureExecution`
     * Parameters: `type: "target-rounding"`, `target: 50000`, `roundToPlace: 10000`
     * Sample question: `"Which of the following numbers round to 50,000 when rounded to the nearest ten thousand? Select all that apply. (Options: 48,200, 54,900, 44,999, 55,200)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `rounding-numberline`.
* **UI Layout details:** A horizontal number line illustrating the target interval (e.g. 30,000 to 40,000) with a marked midpoint. An interactive pin marks the number to be rounded, helping the student visualize the closest multiple. Fully interactive, scales fluidly across device widths.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the rounding check algorithms and target options generator in arithmetic code.
- [ ] Register rounding permutations.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (limit [0, 1,000,000]).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NBT.B.5 - Multi-digit Multiplication
* **CCSS Text:** Multiply a whole number of up to four digits by a one-digit whole number, and multiply two two-digit numbers, using strategies based on place value and the properties of operations. Illustrate and explain the calculation by using equations, rectangular arrays, and/or area models. Grade 4 expectations in this domain are limited to whole numbers less than or equal to 1,000,000.
* **Ontology Reference:** Matched Areas: `Area.Multiplication`, `Area.PlaceValue`, `Area.DistributiveLaw`, Scopes: `Scope.IntegerNumbers`, `Scope.Base10`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding parameters for multi-digit multiplication.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Standard multi-digit multiplication (4-digit by 1-digit or 2-digit by 2-digit).
     * Labels: `Area.Multiplication`, `Scope.IntegerNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "multiplication"`, `digitsLeft: [2, 4]`, `digitsRight: [1, 2]`
     * Sample question: `"Calculate: 3,452 × 8 = _"`
  2. **Permutation B:** Complete partial products using the distributive law/area model representation.
     * Labels: `Area.DistributiveLaw`, `Area.PlaceValue`, `Scope.Base10`, `Ability.VisualArticulation`
     * Parameters: `type: "area-model-partial"`, `digitsLeft: 2`, `digitsRight: 2`
     * Sample question: `"For 25 × 14, complete the partial products: 20 × 10 = 200, 20 × 4 = 80, 5 × 10 = _, 5 × 4 = _"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-vertical` for standard vertical multiplication. Propose a new view `operations-area-model` for distributive visual representations.
* **UI Layout details:** A split grid representing a rectangular area model (e.g. 2x2 grid for 2-digit multiplication) showing factors labeled on headers. Input boxes reside inside grid cells for students to compute partial products. Clear margins, touch-responsive grid cells.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the arithmetic generator config.
- [ ] Implement the area model partial product calculator logic in `src/generators/arithmetic/index.ts`.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (products must not exceed 1,000,000).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NBT.B.6 - Multi-digit Division
* **CCSS Text:** Find whole-number quotients and remainders with up to four-digit dividends and one-digit divisors, using strategies based on place value, the properties of operations, and/or the relationship between multiplication and division. Illustrate and explain the calculation by using equations, rectangular arrays, and/or area models. Grade 4 expectations in this domain are limited to whole numbers less than or equal to 1,000,000.
* **Ontology Reference:** Matched Areas: `Area.Division`, `Area.Modulo`, `Area.PlaceValue`, Scopes: `Scope.IntegerNumbers`, `Scope.Base10`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding multi-digit division parameters.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Division returning both quotient and remainder.
     * Labels: `Area.Division`, `Area.Modulo`, `Scope.IntegerNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "division-with-remainder"`, `dividendDigits: [2, 4]`, `divisorDigits: 1`
     * Sample question: `"Find the quotient and remainder: 3,456 ÷ 5 = _ R _"`
  2. **Permutation B:** Complete partition equations using place-value division strategies.
     * Labels: `Area.PlaceValue`, `Scope.Base10`, `Ability.ProcedureExecution`
     * Parameters: `type: "partition-division"`, `dividendDigits: 3`, `divisorDigits: 1`
     * Sample question: `"Divide 639 ÷ 3 by partitioning: 600 ÷ 3 = 200, 30 ÷ 3 = _, 9 ÷ 3 = _"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `operations-partial-quotients`.
* **UI Layout details:** Display a vertical partial quotients bracket or partitioned boxes. User enters values step-by-step. Features a side panel detailing helper multiples. Optimized to scale on vertical screen orientations.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement partition list generation math in division engine.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (divisors must not be 0 or 1, dividends up to 9,999).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.A.1 - Visual and Numerical Equivalent Fractions
* **CCSS Text:** Explain why a fraction a/b is equivalent to a fraction (n × a)/(n × b) by using visual fraction models, with attention to how the number and size of the parts differ even though the two fractions themselves are the same size. Use this principle to recognize and generate equivalent fractions. Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionEquivalence`, `Area.FractionNotation`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `comparison` generator to support equivalent fractions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Identify equivalence of two visual fraction diagrams.
     * Labels: `Area.FractionNotation`, `Scope.VisualNumbers`, `Ability.VisualArticulation`
     * Parameters: `type: "visual-equivalence"`, `denominators: [2, 3, 4, 5, 6, 8, 10, 12]`
     * Sample question: `"Look at the shaded regions. Are the fractions 2/3 and 4/6 equivalent? (Yes/No)"`
  2. **Permutation B:** Generate numerical equivalent fraction equations (find the missing numerator or denominator).
     * Labels: `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "numerical-equivalence"`, `denominators: [2, 3, 4, 5, 6, 8, 10, 12, 100]`
     * Sample question: `"Find the missing number: 2/5 = _/10"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `fractions-visual`.
* **UI Layout details:** SVG rendering of circles, rectangles, or fraction bars divided into segments, with colored/shaded areas representing the fractions. Places two visual components next to each other, with clean input fields. SVG shapes adapt automatically to mobile layout widths.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement fraction mapping, reduction, and verification logic in code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `comparison.tests.js`.
- [ ] Validate question generation boundary values (denominators restricted to CCSS subset: {2, 3, 4, 5, 6, 8, 10, 12, 100}).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.A.2 - Comparing Fractions with Different Denominators
* **CCSS Text:** Compare two fractions with different numerators and different denominators, e.g., by creating common denominators or numerators, or by comparing to a benchmark fraction such as 1/2. Recognize that comparisons are valid only when the two fractions refer to the same whole. Record the results of comparisons with symbols >, =, or <, and justify the conclusions, e.g., by using a visual fraction model. Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionEquivalence`, `Area.NumericComparison`, `Area.LowestCommonDenominator`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `comparison` generator by adding fraction comparison mode.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Compare fractions with unequal numerators/denominators using common denominators.
     * Labels: `Area.NumericComparison`, `Area.LowestCommonDenominator`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "fraction-comparison"`, `denominators: [2, 3, 4, 5, 6, 8, 10, 12]`
     * Sample question: `"Compare: 3/5 _ 4/8 (Choose <, >, or =)"`
  2. **Permutation B:** Compare fractions using 1/2 as a benchmark (one is greater than 1/2, the other is less).
     * Labels: `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.DeductiveReasoning`
     * Parameters: `type: "compare-benchmark"`, `benchmark: 0.5`
     * Sample question: `"Which of the following is larger than 1/2? (Options: 3/8, 4/10, 5/8, 2/6)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numbers-compare` view.
* **UI Layout details:** The numbers-compare view should be updated to render fractional elements vertically (numerator, division line, denominator) side-by-side with a comparison button set in between. Centered alignment, scales text size on small viewports.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to `comparison` generator.
- [ ] Implement LCM and benchmark comparison helper logic.
- [ ] Add permutations to `permutations.ts`.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `comparison.tests.js`.
- [ ] Validate question generation boundary values (ensure denominators belong to CCSS subset).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.B.3a - Understanding Fraction Addition and Subtraction
* **CCSS Text:** Understand addition and subtraction of fractions as joining and separating parts referring to the same whole. Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionArithmetic`, `Area.Addition`, `Area.Subtraction`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator to support conceptual fraction addition/subtraction.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Visual representation of fraction addition (joining sectors/blocks).
     * Labels: `Area.FractionArithmetic`, `Area.Addition`, `Scope.VisualNumbers`, `Ability.Understanding`
     * Parameters: `type: "visual-addition"`, `denominator: [3, 4, 5, 6, 8]`
     * Sample question: `"Grid A has 1/6 shaded. Grid B has 3/6 shaded. Combining them, what fraction is shaded in total? _/_"`
  2. **Permutation B:** Visual representation of fraction subtraction (separating segments).
     * Labels: `Area.FractionArithmetic`, `Area.Subtraction`, `Scope.VisualNumbers`, `Ability.ProcedureUnderstanding`
     * Parameters: `type: "visual-subtraction"`, `denominator: [3, 4, 5, 6, 8]`
     * Sample question: `"A pie has 5/8 of its slices left. If you remove 2/8, what fraction of the pie is left? _/_"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `fractions-visual` view.
* **UI Layout details:** SVG pie charts or grid bars showing distinct color codings (e.g. blue segments for addend 1, green segments for addend 2) to illustrate merging. Display text input underneath. Responsive SVG scaling.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the arithmetic generator config.
- [ ] Implement visual fraction sectors builder helper function in generator utilities.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (fractions must not exceed 1).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.B.3b - Decomposing Fractions
* **CCSS Text:** Decompose a fraction into a sum of fractions with the same denominator in more than one way, recording each decomposition by an equation. Justify decompositions, e.g., by using a visual fraction model. Examples: 3/8 = 1/8 + 1/8 + 1/8 ; 3/8 = 1/8 + 2/8 ; 2 1/8 = 1 + 1 + 1/8 = 8/8 + 8/8 + 1/8. Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionArithmetic`, `Area.Addition`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding a new mode `fraction-decomposition`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Decompose proper fractions into sum equations (e.g. 5/8 = 2/8 + _/8).
     * Labels: `Area.FractionArithmetic`, `Area.Addition`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "proper-decomposition"`, `denominator: [4, 6, 8, 10]`, `numeratorRange: [3, 9]`
     * Sample question: `"Fill in the missing numerator: 5/8 = 2/8 + _/8"`
  2. **Permutation B:** Decompose mixed numbers into sums of whole units and proper parts (e.g. 1 2/5 = 5/5 + _/5).
     * Labels: `Area.FractionArithmetic`, `Area.Addition`, `Scope.FractionNumbers`, `Ability.DeductiveReasoning`
     * Parameters: `type: "mixed-decomposition"`, `denominator: [3, 4, 5, 6, 8]`
     * Sample question: `"Complete the decomposition: 1 2/5 = 5/5 + _/5"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view (configured for fractions) or `fractions-visual` view.
* **UI Layout details:** Display the equation inline. Render input fields for numerators. Below the equation, render a segmented rectangle bar showing color splits matching the decomposition. Responsive margins.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement decomposition generator helper functions in arithmetic code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (ensure denominator limits).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.B.3c - Mixed Numbers Addition and Subtraction
* **CCSS Text:** Add and subtract mixed numbers with like denominators, e.g., by replacing each mixed number with an equivalent fraction, and/or by using properties of operations and the relationship between addition and subtraction. Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionArithmetic`, `Area.FractionEquivalence`, Scopes: `Scope.FractionNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding mixed numbers addition/subtraction mode.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Addition of mixed numbers with like denominators.
     * Labels: `Area.FractionArithmetic`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `operation: "addition"`, `denominator: [3, 4, 5, 6, 8, 10, 12]`, `wholePartRange: [1, 4]`
     * Sample question: `"Calculate: 2 1/5 + 1 3/5 = _ _/_"`
  2. **Permutation B:** Subtraction of mixed numbers with like denominators, requiring borrowing/regrouping (e.g. 3 1/5 - 1 4/5).
     * Labels: `Area.FractionArithmetic`, `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `operation: "subtraction"`, `regroupingRequired: true`, `denominator: [4, 6, 8, 10]`
     * Sample question: `"Calculate: 3 1/6 - 1 4/6 = _ _/_"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `mixed-numbers-input`.
* **UI Layout details:** Main math problem displayed horizontally. The response element has three input fields: a whole number box, followed by vertical numerator/denominator fraction boxes. Supports responsive tab order.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Code mixed numbers math parser, fraction reduction, and borrowing calculations in generator.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (ensure no negative results).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.B.3d - Fraction Addition and Subtraction Word Problems
* **CCSS Text:** Solve word problems involving addition and subtraction of fractions referring to the same whole and having like denominators, e.g., by using visual fraction models and equations to represent the problem. Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionArithmetic`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator to support fraction word problems.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Addition word problem with like denominators.
     * Labels: `Area.FractionArithmetic`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "fraction-word-add"`, `denominator: [4, 6, 8, 10]`
     * Sample question: `"Jane ran 3/10 of a mile in the morning and 4/10 of a mile in the evening. How far did she run in total? _/_ miles"`
  2. **Permutation B:** Subtraction word problem with like denominators.
     * Labels: `Area.FractionArithmetic`, `Scope.FractionNumbers`, `Ability.AnalyticalCapability`
     * Parameters: `type: "fraction-word-sub"`, `denominator: [4, 6, 8, 10]`
     * Sample question: `"A recipe requires 7/8 cups of milk. Leo has 3/8 cups of milk. How much more milk does he need? _/_ cups"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-word-problem` view.
* **UI Layout details:** Display word problem card containing fraction input text boxes. Ensure layout doesn't overlap text with inputs on narrow screens.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Add fraction addition/subtraction word problem templates to generator index.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (limit values up to 1).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.B.4a - Understanding Fraction Multiplication Concepts
* **CCSS Text:** Understand a fraction a/b as a multiple of 1/b. For example, use a visual fraction model to represent 5/4 as the product 5 × (1/4), recording the conclusion by the equation 5/4 = 5 × (1/4). Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionArithmetic`, `Area.Multiplication`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding fraction multiplication concepts.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Match proper fraction to unit fraction product equation (e.g. 5/8 = _ × 1/8).
     * Labels: `Area.FractionArithmetic`, `Area.Multiplication`, `Scope.FractionNumbers`, `Ability.Understanding`
     * Parameters: `type: "unit-multiplier"`, `denominator: [3, 4, 5, 6, 8, 10]`
     * Sample question: `"Fill in the missing factor: 4/5 = _ × 1/5"`
  2. **Permutation B:** Match visual fraction multiple models to multiplication equation.
     * Labels: `Area.FractionArithmetic`, `Area.Multiplication`, `Scope.VisualNumbers`, `Ability.ProcedureUnderstanding`
     * Parameters: `type: "visual-unit-multiply"`, `denominator: [3, 4, 5, 6]`
     * Sample question: `"Look at the 3 shapes. Each has 1/4 shaded. What is the total shaded area as a product? _ × 1/4 = _/_"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `fractions-visual` view or `operations-boxes` view.
* **UI Layout details:** Display multiple separate fraction bars side-by-side (representing copies of 1/b). Below, place the numerical formula input fields. Responsive, handles wide SVGs on mobile devices.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement visual array rendering logic for multiple fraction bars.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (ensure denominator limits).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.B.4b - Multiplying Fractions by Whole Numbers
* **CCSS Text:** Understand a multiple of a/b as a multiple of 1/b, and use this understanding to multiply a fraction by a whole number. For example, use a visual fraction model to express 3 × (2/5) as 6 × (1/5), recognizing this product as 6/5. (In general, n × (a/b) = (n × a)/b.) Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionArithmetic`, `Area.Multiplication`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding fraction multiplication logic.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Compute product of whole number by proper fraction.
     * Labels: `Area.FractionArithmetic`, `Area.Multiplication`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "fraction-multiply-numeric"`, `multiplierRange: [2, 6]`, `denominatorRange: [2, 10]`
     * Sample question: `"Calculate: 3 × 2/7 = _/_"`
  2. **Permutation B:** Convert product representation: n × a/b = (n × a) × 1/b (e.g. 4 × 2/5 = 8 × 1/5).
     * Labels: `Area.FractionArithmetic`, `Area.Multiplication`, `Scope.FractionNumbers`, `Ability.Understanding`
     * Parameters: `type: "multiply-representation-conversion"`, `multiplier: 3`, `numerator: 3`, `denominator: 8`
     * Sample question: `"Rewrite: 3 × 3/8 = _ × 1/8"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view (configured for fraction outputs).
* **UI Layout details:** Display mathematical formula with numerator/denominator input grid. High contrast layout.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement fraction product math and representation rewrite logic.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (ensure denominator limits).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.B.4c - Word Problems Involving Multiplying Fractions by Whole Numbers
* **CCSS Text:** Solve word problems involving multiplication of a fraction by a whole number, e.g., by using visual fraction models and equations to represent the problem. For example, if each person at a party will eat 3/8 of a pound of roast beef, and there will be 5 people at the party, how many pounds of roast beef will be needed? Between what two whole numbers does your answer lie? Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionArithmetic`, `Area.Multiplication`, Scopes: `Scope.FractionNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator to support fraction multiplication word problems.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Multiplication word problems yielding total values.
     * Labels: `Area.FractionArithmetic`, `Area.Multiplication`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "word-multiply"`, `multiplierRange: [3, 8]`, `denominator: [4, 6, 8]`
     * Sample question: `"If each person at a party eats 3/8 of a pound of beef, how many pounds are needed for 5 people? _ _/_"`
  2. **Permutation B:** Identify bounding whole numbers for fraction products (e.g. 15/8 is between 1 and 2).
     * Labels: `Area.FractionArithmetic`, `Area.Multiplication`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "fraction-bounds-word"`, `multiplier: 5`, `numerator: 3`, `denominator: 8`
     * Sample question: `"A collection has 5 cups containing 3/4 liters of water each. The total water is 15/4 liters. Between which two whole numbers does 15/4 lie? (Options: 3 and 4, 4 and 5, 2 and 3)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-word-problem` view.
* **UI Layout details:** Display word problem text on card, with multiple-choice buttons (for bounding numbers) or mixed-number text boxes (for final product). Clean design.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Add fraction multiplication templates and boundary number check algorithms.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (ensure denominator limits).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.C.5 - Adding Tenths and Hundredths
* **CCSS Text:** Express a fraction with denominator 10 as an equivalent fraction with denominator 100, and use this technique to add two fractions with respective denominators 10 and 100. For example, express 3/10 as 30/100, and add 3/10 + 4/100 = 34/100. Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.FractionEquivalence`, `Area.FractionArithmetic`, Scopes: `Scope.FractionNumbers`, `Scope.Base10`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator by adding a new mode `tenths-hundredths`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Convert fraction with denominator 10 to equivalent with denominator 100 (e.g. 4/10 = _/100).
     * Labels: `Area.FractionEquivalence`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "conversion"`, `numeratorRange: [1, 9]`
     * Sample question: `"Convert: 6/10 = _/100"`
  2. **Permutation B:** Add a fraction with denominator 10 to a fraction with denominator 100 (e.g. 3/10 + 15/100 = _/100).
     * Labels: `Area.FractionArithmetic`, `Scope.Base10`, `Ability.ProcedureExecution`
     * Parameters: `type: "addition"`, `numTenths: [1, 9]`, `numHundredths: [1, 95]`
     * Sample question: `"Calculate: 4/10 + 23/100 = _/100"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view.
* **UI Layout details:** Display mathematical expressions horizontally with fraction structures. Response box targets numerator of solution.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement equivalence scaling and fraction addition in arithmetic generator.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `arithmetic.tests.js`.
- [ ] Validate question generation boundary values (ensure final numerator is under 100).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.C.6 - Decimal Notation for Tenths and Hundredths
* **CCSS Text:** Use decimal notation for fractions with denominators 10 or 100. For example, rewrite 0.62 as 62/100; describe a length as 0.62 meters; locate 0.62 on a number line diagram. Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.DecimalNotation`, `Area.DecimalEquivalence`, `Area.FractionNotation`, Scopes: `Scope.DecimalNumbers`, `Scope.FractionNumbers`, `Scope.Numberline`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `writing` generator by adding a new mode `decimal-fractions`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Convert fraction (10 or 100 denominator) to decimal.
     * Labels: `Area.DecimalNotation`, `Scope.DecimalNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "fraction-to-decimal"`, `denominator: [10, 100]`
     * Sample question: `"Write 73/100 as a decimal: _"`
  2. **Permutation B:** Convert decimal to fraction (denominator 10 or 100).
     * Labels: `Area.FractionNotation`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "decimal-to-fraction"`
     * Sample question: `"Write 0.6 as a fraction: _/_"`
  3. **Permutation C:** Identify decimal position on a number line diagram.
     * Labels: `Area.DecimalEquivalence`, `Scope.Numberline`, `Ability.ProcedureExecution`
     * Parameters: `type: "numberline-decimal"`
     * Sample question: `"Which letter represents 0.3 on the number line? (Options: A, B, C)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numbers-write` (for conversions). Propose a new view `numberline-interactive` for positioning.
* **UI Layout details:** A horizontal number line marked from 0 to 1 with tick marks at intervals of 0.1 or 0.01. Key intervals are labeled with letter tags. User selects the letter matching the decimal target. Touch-friendly tick indicators.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the writing config.
- [ ] Code decimal conversion math and numberline coordinate generation.
- [ ] Create `numberline-interactive` view component.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `writing.tests.js`.
- [ ] Validate question generation boundary values (limit values to tenths/hundredths in [0, 1]).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.NF.C.7 - Comparing Decimals
* **CCSS Text:** Compare two decimals to hundredths by reasoning about their size. Recognize that comparisons are valid only when the two decimals refer to the same whole. Record the results of comparisons with the symbols >, =, or <, and justify the conclusions, e.g., by using a visual model. Grade 4 expectations in this domain are limited to fractions with denominators 2, 3, 4, 5, 6, 8, 10, 12, and 100.
* **Ontology Reference:** Matched Areas: `Area.NumericComparison`, `Area.DecimalArithmetic`, Scopes: `Scope.DecimalNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `comparison` generator to support comparing decimals.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Compare two decimals with different number of places (e.g. 0.4 vs 0.38) using >, <, or =.
     * Labels: `Area.NumericComparison`, `Scope.DecimalNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "decimal-comparison"`, `range: [0, 1]`
     * Sample question: `"Compare: 0.6 _ 0.59 (Choose <, >, or =)"`
  2. **Permutation B:** Compare two decimals with visual grids representation (10x10 grids).
     * Labels: `Area.NumericComparison`, `Scope.VisualNumbers`, `Ability.LogicalReasoning`
     * Parameters: `type: "visual-decimal-comparison"`, `value1: 0.3, value2: 0.27`
     * Sample question: `"Look at the two shaded 10x10 grids. Grid A is 0.3 shaded, and Grid B is 0.35 shaded. Which is larger? (Grid A / Grid B)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numbers-compare` view. Propose a new view `decimal-grids`.
* **UI Layout details:** Two side-by-side grids containing 10x10 blocks, colored dynamically to represent the decimal values. Users tap the corresponding comparison operators. Displays vertically stacked on small mobile viewports.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the comparison config.
- [ ] Code decimal comparison logic and grid layout calculations.
- [ ] Create `decimal-grids` view template.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `comparison.tests.js`.
- [ ] Validate question generation boundary values (values limited to hundredths in [0, 1]).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.MD.A.1 - Relative Sizes and Conversions of Measurement Units
* **CCSS Text:** Know relative sizes of measurement units within one system of units including km, m, cm; kg, g; lb, oz.; l, ml; hr, min, sec. Within a single system of measurement, express measurements in a larger unit in terms of a smaller unit. Record measurement equivalents in a two column table. For example, know that 1 ft is 12 times as long as 1 in. Express the length of a 4 ft snake as 48 in. Generate a conversion table for feet and inches listing the number pairs (1, 12), (2, 24), (3, 36), ...
* **Ontology Reference:** Matched Areas: `Area.Measurement`, `Area.ProportionAbstraction`, `Area.RatioInterpretation`, Scopes: `Scope.MetricScale`, `Scope.KilometerScale`, `Scope.MeterScale`, `Scope.CentimeterScale`, `Scope.KilogramScale`, `Scope.GramScale`, `Scope.LiterScale`, `Scope.MilliliterScale`, `Scope.HourIntervals`, `Scope.MinuteIntervals`, `Scope.SecondIntervals`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to support conversion tables and relative scale conversions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Convert a measurement from a larger unit to a smaller unit.
     * Labels: `Area.Measurement`, `Scope.MetricScale`, `Ability.ProcedureExecution`
     * Parameters: `type: "unit-conversion"`, `fromUnit: "km"`, `toUnit: "m"`, `valueRange: [1, 10]`
     * Sample question: `"Convert: 4 kilometers = _ meters"`
  2. **Permutation B:** Generate values to complete a two-column conversion table.
     * Labels: `Area.ProportionAbstraction`, `Area.RatioInterpretation`, `Scope.HourIntervals`, `Ability.ProcedureExecution`
     * Parameters: `type: "conversion-table"`, `fromUnit: "hours"`, `toUnit: "minutes"`, `multiplier: 60`
     * Sample question: `"Complete the table: Hours | Minutes | 1 | 60 | 2 | _ | 3 | 180 | 4 | _"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `measurement-table`.
* **UI Layout details:** A structured HTML table representing a conversion record with clean header columns and input cells for missing values. Clean borders, padding optimized for tap accuracy.

### Subtask 3: Developer Implementation Checklist
- [ ] Add conversion tables and unit systems coefficients configuration to measurement generator.
- [ ] Implement table fill generation and value checks in generator code.
- [ ] Create `measurement-table` view.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (limit multipliers to whole numbers).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.MD.A.2 - Measurement Word Problems with Four Operations
* **CCSS Text:** Use the four operations to solve word problems involving distances, intervals of time, liquid volumes, masses of objects, and money, including problems involving simple fractions or decimals, and problems that require expressing measurements given in a larger unit in terms of a smaller unit. Represent measurement quantities using diagrams such as number line diagrams that feature a measurement scale.
* **Ontology Reference:** Matched Areas: `Area.BaseOperations`, `Area.Arithmetic`, `Area.FractionArithmetic`, `Area.DecimalArithmetic`, Scopes: `Scope.DistanceAbstraction`, `Scope.TimeAbstraction`, `Scope.VolumeAbstraction`, `Scope.WeightAbstraction`, `Scope.Numberline`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to support multi-operation word problems.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Word problem with conversion (e.g. converting m to cm before adding/subtracting).
     * Labels: `Area.Arithmetic`, `Scope.DistanceAbstraction`, `Ability.ProcedureExecution`
     * Parameters: `type: "word-problem-conversion"`, `dimension: "length"`
     * Sample question: `"A spool has 3 meters of ribbon. Amy uses 80 centimeters. How many centimeters of ribbon are left? _"`
  2. **Permutation B:** Word problem containing decimal/fractional measurements.
     * Labels: `Area.DecimalArithmetic`, `Scope.VolumeAbstraction`, `Ability.ProcedureExecution`
     * Parameters: `type: "word-problem-decimal"`, `dimension: "money"`
     * Sample question: `"Kevin spent $4.50 on a notepad and $1.75 on a pen. How much change does he get from a $10 bill? _"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-word-problem` view.
* **UI Layout details:** Display word problem card. If scale representation is required, show a horizontal scale/ruler SVG segment marking intermediate values.

### Subtask 3: Developer Implementation Checklist
- [ ] Add measurement word problem templates to generator config.
- [ ] Implement arithmetic checking (handling integer/decimal conversions).
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (ensure no negative results).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.MD.A.3 - Area and Perimeter Formulas for Rectangles
* **CCSS Text:** Apply the area and perimeter formulas for rectangles in real world and mathematical problems. For example, find the width of a rectangular room given the area of the flooring and the length, by viewing the area formula as a multiplication equation with an unknown factor.
* **Ontology Reference:** Matched Areas: `Area.AreaCalculation`, `Area.PerimeterCalculation`, `Area.Rectangle`, Scopes: `Scope.TwoDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator by adding a `rectangle-geometry` mode.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Calculate area or perimeter of a rectangle given length and width.
     * Labels: `Area.AreaCalculation`, `Area.Rectangle`, `Scope.TwoDimensional`, `Ability.ProcedureExecution`
     * Parameters: `task: "calculate"`, `lengthRange: [4, 15]`, `widthRange: [4, 15]`
     * Sample question: `"A rectangular poster is 9 inches long and 6 inches wide. What is its area in square inches? _"`
  2. **Permutation B:** Find unknown dimension given area/perimeter and one side length.
     * Labels: `Area.PerimeterCalculation`, `Area.Rectangle`, `Scope.TwoDimensional`, `Ability.ProcedureExecution`
     * Parameters: `task: "unknown-dimension"`, `given: "perimeter"`
     * Sample question: `"The perimeter of a rectangular rug is 24 feet. The width is 4 feet. What is the length of the rug? _"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `geometry-rectangle`.
* **UI Layout details:** Centered SVG rectangle displaying lengths on sides (or variables). Colored background area. Response inputs sit below the rectangle image. Responsive scaling.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Code rectangle perimeter and area math solvers.
- [ ] Create `geometry-rectangle` view template.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (dimensions must be non-zero integers).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.MD.B.4 - Line Plots with Fractions
* **CCSS Text:** Make a line plot to display a data set of measurements in fractions of a unit (1/2, 1/4, 1/8). Solve problems involving addition and subtraction of fractions by using information presented in line plots. For example, from a line plot find and interpret the difference in length between the longest and shortest specimens in an insect collection.
* **Ontology Reference:** Matched Areas: `Area.FractionArithmetic`, `Area.Addition`, `Area.Subtraction`, `Area.Statistics`, Scopes: `Scope.FractionNumbers`, `Scope.Numberline`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to cover statistics and line plots.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Find difference between maximum and minimum values in a line plot (fractional data).
     * Labels: `Area.FractionArithmetic`, `Area.Subtraction`, `Scope.Numberline`, `Ability.ProcedureExecution`
     * Parameters: `type: "range-difference"`, `fractionStep: 8`
     * Sample question: `"Look at the line plot. What is the difference in length between the longest insect (5/8 inch) and the shortest insect (1/8 inch)? _/_"`
  2. **Permutation B:** Find sum of select items in plot (e.g. combined length of three shortest items).
     * Labels: `Area.FractionArithmetic`, `Area.Addition`, `Scope.FractionNumbers`, `Ability.ProcedureExecution`
     * Parameters: `type: "sum-points"`, `fractionStep: 4`
     * Sample question: `"A line plot lists sticks. Two sticks are 1/4 inches and one stick is 2/4 inches. What is their total combined length? _ _/_"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `data-line-plot`.
* **UI Layout details:** SVG rendering showing a horizontal axis labeled in fraction increments (e.g. 0, 1/8, 2/8... 1). Values are plotted using stacked "X" markers. The text and response field are displayed below. Adapts beautifully to mobile viewports.

### Subtask 3: Developer Implementation Checklist
- [ ] Add line plot options to measurement generator config.
- [ ] Code SVG rendering logic for X plot counts.
- [ ] Create `data-line-plot` view component.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (denominators {2, 4, 8}).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.MD.C.5a - Angle Measurements and Circular Arc Fractions
* **CCSS Text:** An angle is measured with reference to a circle with its center at the common endpoint of the rays, by considering the fraction of the circular arc between the points where the two rays intersect the circle. An angle that turns through 1/360 of a circle is called a “one-degree angle,” and can be used to measure angles.
* **Ontology Reference:** Matched Areas: `Area.AngleConcept`, `Area.ArchConcept`, `Area.Circle`, Scopes: `Scope.DegreeScale`, `Scope.TwoDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator by adding angle-circle concepts.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Determine angle degrees as a fraction of a 360-degree circle (e.g., 90/360 turns = 90 degrees).
     * Labels: `Area.AngleConcept`, `Area.Circle`, `Scope.DegreeScale`, `Ability.Understanding`
     * Parameters: `type: "circle-fraction-degrees"`, `angle: [90, 180, 270]`
     * Sample question: `"An angle turns through 1/4 of a circle. How many degrees does it measure? _ degrees"`
  2. **Permutation B:** Relate degrees to sum of one-degree turns.
     * Labels: `Area.AngleConcept`, `Scope.DegreeScale`, `Ability.Understanding`
     * Parameters: `type: "one-degree-turns"`, `angle: 60`
     * Sample question: `"An angle turns through 60 one-degree angles. What is its measure in degrees? _"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `geometry-angle-circle`.
* **UI Layout details:** Draw a circle containing two rays extending from the center point, with the arc between shaded. Highlights the 360-division concept. Text and inputs sit below. Fully responsive.

### Subtask 3: Developer Implementation Checklist
- [ ] Add angle-circle parameters to the generator config.
- [ ] Implement angle fractional conversion math.
- [ ] Create `geometry-angle-circle` view.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (angles must be multiples of 10 or 45).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.MD.C.5b - Angle Measures of n Degrees
* **CCSS Text:** An angle that turns through n one-degree angles is said to have an angle measure of n degrees.
* **Ontology Reference:** Matched Areas: `Area.AngleConcept`, Scopes: `Scope.DegreeScale`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator by adding degree measures.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Convert degree measure to count of one-degree angles.
     * Labels: `Area.AngleConcept`, `Scope.DegreeScale`, `Ability.Understanding`
     * Parameters: `type: "degrees-to-turns-count"`, `angle: 120`
     * Sample question: `"An angle has a measure of 120 degrees. It turns through how many one-degree angles? _"`
  2. **Permutation B:** Convert count of one-degree angles to degree measure.
     * Labels: `Area.AngleConcept`, `Scope.DegreeScale`, `Ability.Understanding`
     * Parameters: `type: "turns-count-to-degrees"`, `turns: 85`
     * Sample question: `"An angle that turns through 85 one-degree angles has an angle measure of _ degrees."`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view or `geometry-angle-circle` view.
* **UI Layout details:** Text question box with simple input fields. Minimal layout.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator.
- [ ] Register permutations.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (angles [1, 360]).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.MD.C.6 - Measuring and Sketching Angles with a Protractor
* **CCSS Text:** Measure angles in whole-number degrees using a protractor. Sketch angles of specified measure.
* **Ontology Reference:** Matched Areas: `Area.AngleConcept`, Scopes: `Scope.Protractor`, `Scope.DegreeScale`, `Scope.AngleMeasurement`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator by adding protractor angle measuring.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Read the angle shown on a protractor scale.
     * Labels: `Area.AngleConcept`, `Scope.Protractor`, `Scope.AngleMeasurement`, `Ability.ProcedureExecution`
     * Parameters: `type: "measure-protractor"`, `angle: [30, 45, 60, 90, 120, 135, 150]`
     * Sample question: `"What is the measure of the angle shown on the protractor? _ degrees"`
  2. **Permutation B:** Identify the correct angle sketch matching a given degree value.
     * Labels: `Area.AngleConcept`, `Scope.AngleMeasurement`, `Ability.ProcedureExecution`
     * Parameters: `type: "match-angle-degrees"`, `target: 45`
     * Sample question: `"Which of the following angles measures 45 degrees? (Options: Angle A, Angle B, Angle C)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `geometry-protractor`.
* **UI Layout details:** Render an SVG protractor with an angle centered on the origin. The baseline aligns with 0, and the second ray points to the target angle division. Clean lines and tick numbers, scales automatically on mobile screens.

### Subtask 3: Developer Implementation Checklist
- [ ] Add protractor measuring configurations to the generator config.
- [ ] Code ray placement and angle calculation helpers.
- [ ] Create `geometry-protractor` view component.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (angles restricted to whole numbers [10, 170] in steps of 5).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.MD.C.7 - Solving Unknown Adjacent Angles
* **CCSS Text:** Recognize angle measure as additive. When an angle is decomposed into non-overlapping parts, the angle measure of the whole is the sum of the angle measures of the parts. Solve addition and subtraction problems to find unknown angles on a diagram in real world and mathematical problems, e.g., by using an equation with a symbol for the unknown angle measure.
* **Ontology Reference:** Matched Areas: `Area.AngleRelations`, `Area.Addition`, `Area.Subtraction`, `Area.AdjacentAngles`, Scopes: `Scope.DegreeScale`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to support adjacent angle calculations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Find total combined angle given two adjacent parts.
     * Labels: `Area.AngleRelations`, `Area.Addition`, `Area.AdjacentAngles`, `Scope.DegreeScale`, `Ability.ProcedureExecution`
     * Parameters: `type: "add-angles"`, `partA: 30`, `partB: 60`
     * Sample question: `"Two adjacent angles are 30 degrees and 60 degrees. What is the total angle? _"`
  2. **Permutation B:** Find unknown adjacent angle given total and one known part (e.g. complementary/supplementary or generic whole).
     * Labels: `Area.AngleRelations`, `Area.Subtraction`, `Area.AdjacentAngles`, `Scope.DegreeScale`, `Ability.ProcedureExecution`
     * Parameters: `type: "solve-unknown"`, `total: 90`, `known: 40`
     * Sample question: `"The total angle measures 90 degrees. One of the non-overlapping parts is 40 degrees. Solve for x: _"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `geometry-adjacent-angles`.
* **UI Layout details:** SVG drawing of two adjacent angles sharing a common inner ray. Dimension brackets and numeric tags label the parts (or variables like `x`). Clean line rendering, mobile-responsive layout.

### Subtask 3: Developer Implementation Checklist
- [ ] Add adjacent angle logic to generator config.
- [ ] Implement ray coordinates and label placement math.
- [ ] Create `geometry-adjacent-angles` view.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (ensure sum of parts doesn't exceed 180 degrees).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.G.A.1 - Drawing and Identifying Lines, Rays, and Angles
* **CCSS Text:** Draw points, lines, line segments, rays, angles (right, acute, obtuse), and perpendicular and parallel lines. Identify these in two-dimensional figures.
* **Ontology Reference:** Matched Areas: `Area.PointConcept`, `Area.LineConcept`, `Area.LineSegment`, `Area.RayConcept`, `Area.AngleConcept`, `Area.RightAngle`, `Area.AcuteAngle`, `Area.ObtuseAngle`, `Area.PerpendicularityRelation`, `Area.ParallelismRelation`, Scopes: `Scope.TwoDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to support basic geometric feature identification.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Identify lines, segments, rays, and points.
     * Labels: `Area.RayConcept`, `Area.LineConcept`, `Area.LineSegment`, `Scope.TwoDimensional`, `Ability.VisualRecognition`
     * Parameters: `type: "identify-element"`, `element: ["line", "ray", "segment", "point"]`
     * Sample question: `"Which of the following figures represents a line segment? (Options: A, B, C)"`
  2. **Permutation B:** Identify angle types (acute, obtuse, right).
     * Labels: `Area.RightAngle`, `Area.AcuteAngle`, `Area.ObtuseAngle`, `Scope.TwoDimensional`, `Ability.VisualRecognition`
     * Parameters: `type: "identify-angle-type"`
     * Sample question: `"Classify the angle in the diagram: (Options: Acute, Right, Obtuse)"`
  3. **Permutation C:** Identify parallel and perpendicular lines.
     * Labels: `Area.ParallelismRelation`, `Area.PerpendicularityRelation`, `Scope.TwoDimensional`, `Ability.VisualRecognition`
     * Parameters: `type: "identify-line-relation"`
     * Sample question: `"Are the two lines shown parallel, perpendicular, or intersecting? (Options: Parallel, Perpendicular, Intersecting)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `geometry-shapes-viewer`.
* **UI Layout details:** Display high-quality SVG drawings of geometric elements (lines with arrows, segments with end-dots, intersecting grids). Selection options are laid out as large, easy-to-tap cards below. Responsive flex-layout.

### Subtask 3: Developer Implementation Checklist
- [ ] Add geometric elements config parameters to measurement config.
- [ ] Implement SVG generators for line segments, rays, parallel and perpendicular lines.
- [ ] Create `geometry-shapes-viewer` view.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (ensure distinct and unambiguous visual shapes).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.G.A.2 - Classifying 2D Figures
* **CCSS Text:** Classify two-dimensional figures based on the presence or absence of parallel or perpendicular lines, or the presence or absence of angles of a specified size. Recognize right triangles as a category, and identify right triangles.
* **Ontology Reference:** Matched Areas: `Area.Quadrilateral`, `Area.Triangle`, `Area.RightTriangle`, `Area.ParallelismRelation`, `Area.PerpendicularityRelation`, Scopes: `Scope.TwoDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to support polygon classifications.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Classify quadrilaterals based on side relations (parallel/perpendicular).
     * Labels: `Area.Quadrilateral`, `Area.ParallelismRelation`, `Area.PerpendicularityRelation`, `Scope.TwoDimensional`, `Ability.ConceptClassification`
     * Parameters: `type: "classify-polygon"`, `quad: ["parallelogram", "trapezoid", "rectangle", "square"]`
     * Sample question: `"Which term describes a quadrilateral with exactly one pair of parallel sides? (Options: Trapezoid, Parallelogram, Rhombus)"`
  2. **Permutation B:** Identify and classify right triangles in a group.
     * Labels: `Area.Triangle`, `Area.RightTriangle`, `Scope.TwoDimensional`, `Ability.VisualRecognition`
     * Parameters: `type: "identify-right-triangle"`
     * Sample question: `"Identify the right triangle from the shapes below: (Options: Triangle A, Triangle B, Triangle C)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `geometry-shapes-viewer` view.
* **UI Layout details:** Display multiple SVG polygons side-by-side. Support angle indicators (square corner markers) and parallel arrows to visually indicate properties. Responsive layout grids.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the polygon classification parameters to measurement config.
- [ ] Code shape coordinates logic for right/acute/obtuse triangles and quadrilaterals.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (ensure clear visual cues).
- [ ] Manually preview exercises using standard visualizer.

---

## 4.G.A.3 - Lines of Symmetry
* **CCSS Text:** Recognize a line of symmetry for a two-dimensional figure as a line across the figure such that the figure can be folded along the line into matching parts. Identify line-symmetric figures and draw lines of symmetry.
* **Ontology Reference:** Matched Areas: `Area.ShapeReflection`, `Area.SymmetryRelation`, Scopes: `Scope.TwoDimensional`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator to support lines of symmetry.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Identify if a given line is a line of symmetry for a shape.
     * Labels: `Area.SymmetryRelation`, `Scope.VisualGeometry`, `Ability.VisualRecognition`
     * Parameters: `type: "is-symmetry-line"`, `shapes: ["heart", "star", "rectangle", "trapezoid"]`
     * Sample question: `"Does the dashed line show a line of symmetry for the heart shape? (Yes/No)"`
  2. **Permutation B:** Choose the shape that contains a valid line of symmetry.
     * Labels: `Area.ShapeReflection`, `Scope.TwoDimensional`, `Ability.VisualRecognition`
     * Parameters: `type: "find-symmetric"`
     * Sample question: `"Which of the following figures has a line of symmetry? (Options: Figure A, Figure B, Figure C)"`

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `geometry-symmetry`.
* **UI Layout details:** Render an SVG shape with a dashed line passing through it at various angles (horizontal, vertical, diagonal). User selects Yes/No or chooses from shape cards. Touch-friendly target options.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement SVG coordinate generation for symmetric and asymmetric polygons.
- [ ] Create `geometry-symmetry` view.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] (If new view) Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `measurement.tests.js`.
- [ ] Validate question generation boundary values (check asymmetric distractor shapes).
- [ ] Manually preview exercises using standard visualizer.
