# Grade 5 Curriculum Backlog

This document outlines the detailed backlog and technical specifications for generating and rendering practice exercises covering the CCSS Grade 5 leaf standards.

## 5.OA.A.1 - Order of Operations with Parentheses, Brackets, and Braces
* **CCSS Text:** Use parentheses, brackets, or braces in numerical expressions, and evaluate expressions with these symbols.
* **Ontology Reference:** Matched Areas: `[Area.ParenthesesUsage, Area.OrderOfOperations, Area.ArithmeticEvaluation]`, Scopes: `[Scope.IntegerNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator by adding 'expressionType' parameter and parentheses logic.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.ParenthesesUsage, Area.OrderOfOperations, Scope.IntegersWithoutNegatives, Scope.Base10, Ability.ProcedureExecution], Parameters: { expressionType: 'parentheses', maxNum: 50 }, Sample: "(4 + 5) * 3 = ?"
  2. **Permutation B:** Labels: [Area.ParenthesesUsage, Area.OrderOfOperations, Scope.IntegersWithoutNegatives, Scope.Base10, Ability.ProcedureExecution], Parameters: { expressionType: 'brackets', maxNum: 100 }, Sample: "[2 * (6 - 3)] + 8 = ?"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'operations-boxes' view.
* **UI Layout details:** A horizontal display of the expression with brackets/parentheses using standard mathematical typography. The answer input box appears at the end of the expression, supporting a clean layout.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.OA.A.2 - Write and Interpret Simple Numerical Expressions
* **CCSS Text:** Write simple expressions that record calculations with numbers, and interpret numerical expressions without evaluating them. For example, express the calculation “add 8 and 7, then multiply by 2” as 2 × (8 + 7). Recognize that 3 × (18932 + 921) is three times as large as 18932 + 921, without having to calculate the indicated sum or product.
* **Ontology Reference:** Matched Areas: `[Area.ArithmeticEvaluation, Area.ArithmeticOperations]`, Scopes: `[Scope.IntegerNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'writing' generator by adding 'writingMode: "wordToExpression" | "expressionInterpretation"' parameters.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.ParenthesesUsage, Area.Algebra, Scope.IntegersWithoutNegatives, Scope.Base10, Ability.ProcedureExecution], Parameters: { writingMode: 'wordToExpression' }, Sample: "Translate 'add 8 and 7, then multiply by 2' -> 2 * (8 + 7)"
  2. **Permutation B:** Labels: [Area.Multiplication, Area.Algebra, Scope.IntegersWithoutNegatives, Scope.Base10, Ability.AnalyticalReasoning], Parameters: { writingMode: 'expressionInterpretation' }, Sample: "How many times larger is 3 * (18932 + 921) than 18932 + 921? -> 3"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'operations-boxes' view.
* **UI Layout details:** Displays the verbal prompt in a text box. In Permutation A, provides sub-boxes or an equation builder for the expression. In Permutation B, provides a text input for the scaling factor.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.OA.B.3 - Generate Numerical Patterns, Identify Relationships, and Graph Ordered Pairs
* **CCSS Text:** Generate two numerical patterns using two given rules. Identify apparent relationships between corresponding terms. Form ordered pairs consisting of corresponding terms from the two patterns, and graph the ordered pairs on a coordinate plane. For example, given the rule “Add 3” and the starting number 0, and given the rule “Add 6” and the starting number 0, generate terms in the resulting sequences, and observe that the terms in one sequence are twice the corresponding terms in the other sequence. Explain informally why this is so.
* **Ontology Reference:** Matched Areas: `[Area.PatternRecognition, Area.PointPlotting, Area.CartesianPlane]`, Scopes: `[Scope.CartesianCoordinateSystem, Scope.TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'counting' generator by adding dual-sequence rule parameters.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.PatternRecognition, Area.NumerationWithIntegers, Scope.IntegersWithZero, Scope.Base10, Ability.LogicalReasoning], Parameters: { sequenceA: '+3', sequenceB: '+6', start: 0, steps: 5 }, Sample: "Generate pairs (x,y) where x starts at 0 (add 3) and y starts at 0 (add 6). What is y when x=9? -> 18"
  2. **Permutation B:** Labels: [Area.PointPlotting, Area.CoordinateAxes, Scope.CartesianCoordinateSystem, Scope.TwoDimensional, Ability.ProcedureExecution], Parameters: { plotPairs: [[0,0], [3,6], [6,12]] }, Sample: "Plot the generated points on the coordinate grid."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'coordinate-patterns'.
* **UI Layout details:** Left pane: A tabular view showing terms for Pattern X and Pattern Y side-by-side with fill-in-the-blank inputs. Right pane: A first-quadrant grid (0-20 scale) where students click to plot coordinate points corresponding to the table rows. Responsive layout drops grid below table on mobile devices.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NBT.A.1 - Understand Multi-Digit Place Value Relationships (10x and 1/10x)
* **CCSS Text:** Recognize that in a multi-digit number, a digit in one place represents 10 times as much as it represents in the place to its right and 1/10 of what it represents in the place to its left.
* **Ontology Reference:** Matched Areas: `[Area.PlaceValue, Area.IntegerNotation]`, Scopes: `[Scope.Base10]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'writing' generator by adding 'placeValueRelation' mode.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.PlaceValue, Area.DigitNotation, Scope.Base10, Scope.IntegersWithoutNegatives, Ability.ProcedureUnderstanding], Parameters: { relation: 'tenTimes', digit: 5, number: 5520 }, Sample: "In the number 5,520, the 5 in the thousands place is how many times the value of the 5 in the hundreds place? -> 10"
  2. **Permutation B:** Labels: [Area.PlaceValue, Area.DigitNotation, Scope.Base10, Scope.IntegersWithoutNegatives, Ability.ProcedureUnderstanding], Parameters: { relation: 'oneTenth', digit: 4, number: 4480 }, Sample: "In the number 4,480, the 4 in the hundreds place is what fraction of the 4 in the thousands place? -> 1/10"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'numbers-write' view.
* **UI Layout details:** Displays the prompt text with the focus number underlined. Below the text, a horizontal place-value grid displays columns (Thousands, Hundreds, Tens, Ones) to help the student visualize the shift of digits.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NBT.A.2 - Multiplying and Dividing Decimals by Powers of 10
* **CCSS Text:** Explain patterns in the number of zeros of the product when multiplying a number by powers of 10, and explain patterns in the placement of the decimal point when a decimal is multiplied or divided by a power of 10. Use whole-number exponents to denote powers of 10.
* **Ontology Reference:** Matched Areas: `[Area.Exponentiation, Area.DecimalPointAlignment, Area.Multiplication, Area.Division]`, Scopes: `[Scope.DecimalNumbers, Scope.Base10]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support exponents and base-10 powers.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.Exponentiation, Area.Multiplication, Area.Division, Scope.Base10, Scope.IntegersWithZero, Ability.ProcedureExecution], Parameters: { operator: 'multiply', base: 10, exponent: 3, num: 45 }, Sample: "45 * 10^3 = ? -> 45000"
  2. **Permutation B:** Labels: [Area.DecimalPointAlignment, Area.Exponentiation, Area.Multiplication, Area.Division, Scope.DecimalNumbers, Scope.Base10, Ability.ProcedureExecution], Parameters: { operator: 'divide', base: 10, exponent: 2, num: 45.2 }, Sample: "45.2 / 10^2 = ? -> 0.452"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'operations-boxes' view.
* **UI Layout details:** Displays standard horizontal mathematical expressions with superscript exponents (e.g., 10³). A text input box is aligned horizontally at the end of the equation.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NBT.A.3a - Read and Write Decimals in Standard, Expanded, and Word Form
* **CCSS Text:** Read and write decimals to thousandths using base-ten numerals, number names, and expanded form, e.g., 347.392 = 3 × 100 + 4 × 10 + 7 × 1 + 3 × (1/10) + 9 × (1/100) + 2 × (1/1000).
* **Ontology Reference:** Matched Areas: `[Area.DecimalNotation, Area.PlaceValue]`, Scopes: `[Scope.DecimalNumbers, Scope.Base10]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'writing' generator to support decimal base-ten names and expanded form.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.DecimalPrecission, Area.PlaceValue, Scope.DecimalNumbers, Scope.Base10, Ability.ProcedureExecution], Parameters: { decimalMode: 'expanded', num: 347.392 }, Sample: "Write 347.392 in expanded form -> 3 * 100 + 4 * 10 + 7 * 1 + 3 * (1/10) + 9 * (1/100) + 2 * (1/1000)"
  2. **Permutation B:** Labels: [Area.DecimalPrecission, Area.PlaceValue, Scope.DecimalNumbers, Scope.Base10, Ability.ProcedureExecution], Parameters: { decimalMode: 'wordToStandard' }, Sample: "Write 'three hundred forty-seven and three hundred ninety-two thousandths' as a decimal -> 347.392"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'numbers-write' view.
* **UI Layout details:** Displays the prompt (either written words or standard form) centered on the screen. Below is a text input field, or split input boxes corresponding to each place value column.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NBT.A.3b - Compare Decimals to Thousandths
* **CCSS Text:** Compare two decimals to thousandths based on meanings of the digits in each place, using >, =, and < symbols to record the results of comparisons.
* **Ontology Reference:** Matched Areas: `[Area.NumericComparison, Area.PlaceValue]`, Scopes: `[Scope.DecimalNumbers, Scope.Base10]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to support decimal comparisons up to 3 decimal places.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.NumericComparison, Area.PlaceValue, Scope.DecimalNumbers, Scope.Base10, Ability.ProcedureExecution], Parameters: { val1: 0.347, val2: 0.349 }, Sample: "Compare: 0.347 [ ] 0.349 -> '<'"
  2. **Permutation B:** Labels: [Area.NumericComparison, Area.PlaceValue, Scope.DecimalNumbers, Scope.Base10, Ability.ProcedureExecution], Parameters: { val1: 0.3, val2: 0.298 }, Sample: "Compare: 0.3 [ ] 0.298 -> '>'"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'numbers-compare' view.
* **UI Layout details:** Displays the two numbers on the left and right sides with a central drop-down selector or clickable buttons containing comparison symbols (<, =, >).

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NBT.A.4 - Round Decimals to Any Place Value
* **CCSS Text:** Use place value understanding to round decimals to any place.
* **Ontology Reference:** Matched Areas: `[Area.DecimalRounding, Area.PlaceValue]`, Scopes: `[Scope.DecimalNumbers, Scope.Base10]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'writing' generator by adding 'roundDecimal' mode and 'roundTo' parameter.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.DecimalRounding, Area.PlaceValue, Scope.DecimalNumbers, Scope.Base10, Ability.ProcedureExecution], Parameters: { num: 14.382, roundTo: 'tenths' }, Sample: "Round 14.382 to the nearest tenth -> 14.4"
  2. **Permutation B:** Labels: [Area.DecimalRounding, Area.PlaceValue, Scope.DecimalNumbers, Scope.Base10, Ability.ProcedureExecution], Parameters: { num: 0.294, roundTo: 'hundredths' }, Sample: "Round 0.294 to the nearest hundredth -> 0.29"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'numbers-write' view.
* **UI Layout details:** Displays the rounding query in a large font. A highlighted horizontal scale/number line is rendered below to help visualize the nearest boundary value.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NBT.B.6 - Division with Multi-Digit Dividends and Divisors
* **CCSS Text:** Find whole-number quotients of whole numbers with up to four-digit dividends and two-digit divisors, using strategies based on place value, the properties of operations, and/or the relationship between multiplication and division. Illustrate and explain the calculation by using equations, rectangular arrays, and/or area models.
* **Ontology Reference:** Matched Areas: `[Area.Division, Area.PlaceValue, Area.Multiplication, Area.BaseOperations]`, Scopes: `[Scope.IntegersWithZero, Scope.Base10, Scope.NumbersLarger1000]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support up to 4-digit dividends and 2-digit divisors.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.Division, Area.PlaceValue, Scope.IntegersWithZero, Scope.Base10, Scope.NumbersLarger1000, Ability.ProcedureExecution], Parameters: { dividend: 2340, divisor: 15 }, Sample: "2340 / 15 = ? -> 156"
  2. **Permutation B:** Labels: [Area.Division, Area.PlaceValue, Scope.IntegersWithZero, Scope.Base10, Scope.NumbersLarger1000, Ability.ProcedureExecution], Parameters: { dividend: 4832, divisor: 12, remainderMode: true }, Sample: "4832 / 12 = ? -> 402 R 8"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'operations-vertical' view.
* **UI Layout details:** Displays standard long division boxes or vertical division layouts. Input boxes are provided for the quotient and the remainder if applicable.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NBT.B.7 - Arithmetic Operations with Decimals to Hundredths
* **CCSS Text:** Add, subtract, multiply, and divide decimals to hundredths, using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between addition and subtraction; relate the strategy to a written method and explain the reasoning used.
* **Ontology Reference:** Matched Areas: `[Area.DecimalArithmetic, Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division, Area.PlaceValue]`, Scopes: `[Scope.DecimalNumbers, Scope.Base10]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support decimals and aligned operators.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.DecimalPointAlignment, Area.Addition, Area.Subtraction, Scope.DecimalNumbers, Scope.Base10, Ability.ProcedureExecution], Parameters: { op: 'add', num1: 45.23, num2: 9.87 }, Sample: "45.23 + 9.87 = ? -> 55.10"
  2. **Permutation B:** Labels: [Area.Multiplication, Area.Division, Scope.DecimalNumbers, Scope.Base10, Ability.ProcedureExecution], Parameters: { op: 'multiply', num1: 2.5, num2: 1.4 }, Sample: "2.5 * 1.4 = ? -> 3.5"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'operations-vertical' (for aligned column addition/subtraction) and 'operations-boxes' views.
* **UI Layout details:** Vertical grid columns aligned by decimal points for addition/subtraction, with empty input boxes for carrying/borrowing indicators and digit entries.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.A.1 - Add and Subtract Fractions with Unlike Denominators
* **CCSS Text:** Add and subtract fractions with unlike denominators (including mixed numbers) by replacing given fractions with equivalent fractions in such a way as to produce an equivalent sum or difference of fractions with like denominators. For example, 2/3 + 5/4 = 8/12 + 15/12 = 23/12. (In general, a/b + c/d = (ad + bc)/bd.)
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.FractionEquivalence, Area.LowestCommonDenominator, Area.Addition, Area.Subtraction]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support fraction operations with LCD calculations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.FractionArithmetic, Area.LowestCommonDenominator, Area.Addition, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { fractionOp: 'add', type: 'unlikeProper' }, Sample: "2/3 + 1/4 = ? -> 11/12"
  2. **Permutation B:** Labels: [Area.FractionArithmetic, Area.LowestCommonDenominator, Area.Subtraction, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { fractionOp: 'subtract', type: 'mixedNumbers' }, Sample: "2 1/2 - 1 1/3 = ? -> 1 1/6"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'fraction-operations'.
* **UI Layout details:** Renders mathematical fractions vertically (numerator over denominator separated by a fraction bar). In solution views, displays intermediate equivalence steps (e.g., 2/3 becomes 8/12).

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.A.2 - Solve Fraction Word Problems and Estimate sum/difference
* **CCSS Text:** Solve word problems involving addition and subtraction of fractions referring to the same whole, including cases of unlike denominators, e.g., by using visual fraction models or equations to represent the problem. Use benchmark fractions and number sense of fractions to estimate mentally and assess the reasonableness of answers. For example, recognize an incorrect result 2/5 + 1/2 = 3/7, by observing that 3/7 < 1/2.
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.Estimation, Area.NumericComparison, Area.FractionEquivalence]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator by adding fraction word problems and estimation parameters.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.FractionArithmetic, Area.Addition, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { wordProblem: true, type: 'unlike' }, Sample: "Mary ate 1/3 of a pizza, John ate 1/2. How much pizza did they eat? -> 5/6"
  2. **Permutation B:** Labels: [Area.Estimation, Area.NumericComparison, Scope.FractionNumbers, Ability.PlausibilityEvaluation], Parameters: { estimationOnly: true }, Sample: "Estimate: Is 2/5 + 1/2 greater or less than 1? -> 'less'"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'operations-boxes' view.
* **UI Layout details:** Text box at the top displaying the word problem scenario. Input fields below allow entering numerators and denominators for the final fraction answer.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.B.3 - Interpret Fraction as Division and Solve Sharing Word Problems
* **CCSS Text:** Interpret a fraction as division of the numerator by the denominator (a/b = a ÷ b). Solve word problems involving division of whole numbers leading to answers in the form of fractions or mixed numbers, e.g., by using visual fraction models or equations to represent the problem. For example, interpret 3/4 as the result of dividing 3 by 4, noting that 3/4 multiplied by 4 equals 3, and that when 3 wholes are shared equally among 4 people each person has a share of size 3/4. If 9 people want to share a 50-pound sack of rice equally by weight, how many pounds of rice should each person get? Between what two whole numbers does your answer lie?
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.Division, Area.RatioInterpretation]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers, Scope.IntegerNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support fraction-division equivalence.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.Division, Area.RatioInterpretation, Scope.FractionNumbers, Ability.ProcedureUnderstanding], Parameters: { format: 'interpret' }, Sample: "Interpret 3/4 as division: 3 ÷ 4"
  2. **Permutation B:** Labels: [Area.Division, Area.RatioInterpretation, Scope.FractionNumbers, Scope.IntegersWithZero, Ability.ProcedureExecution], Parameters: { format: 'sharingWordProblem' }, Sample: "If 9 people share a 50-pound sack of rice equally, how many pounds does each get? -> 5 5/9"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'operations-boxes' view.
* **UI Layout details:** Presents the word problem with clear visual prompts. Provides separate boxes for mixed numbers (whole, numerator, denominator) for answers.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.B.4a - Multiply Fractions by Whole Numbers and Fractions
* **CCSS Text:** Interpret the product (a/b) × q as a parts of a partition of q into b equal parts; equivalently, as the result of a sequence of operations a × q ÷ b. For example, use a visual fraction model to show (2/3) × 4 = 8/3, and create a story context for this equation. Do the same with (2/3) × (4/5) = 8/15. (In general, (a/b) × (c/d) = ac/bd.)
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.Multiplication, Area.Division, Area.RatioInterpretation]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support fraction multiplication.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.FractionArithmetic, Area.Multiplication, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { type: 'fractionByWhole' }, Sample: "(2/3) * 4 = ? -> 8/3"
  2. **Permutation B:** Labels: [Area.FractionArithmetic, Area.Multiplication, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { type: 'fractionByFraction' }, Sample: "(2/3) * (4/5) = ? -> 8/15"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'fraction-multiplication-visual'.
* **UI Layout details:** Left: A grid visual representation of multiplication where rows are partitioned by the first fraction and columns by the second fraction, creating a cross-shaded area. Right: Standard vertical fraction boxes.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.B.4b - Find Rectangular Area with Fractional Sides by Tiling
* **CCSS Text:** Find the area of a rectangle with fractional side lengths by tiling it with unit squares of the appropriate unit fraction side lengths, and show that the area is the same as would be found by multiplying the side lengths. Multiply fractional side lengths to find areas of rectangles, and represent fraction products as rectangular areas.
* **Ontology Reference:** Matched Areas: `[Area.AreaCalculation, Area.Rectangle, Area.FractionArithmetic, Area.Multiplication]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers, Scope.TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator by adding rectangular tiling area with fractional sides.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.AreaCalculation, Area.Rectangle, Scope.FractionNumbers, Scope.TwoDimensional, Ability.VisualArticulation], Parameters: { tileMode: true, width: '3/2', height: '5/4' }, Sample: "Tile a 3/2 by 5/4 rectangle with 1/4 unit squares. How many tiles fit? -> 15"
  2. **Permutation B:** Labels: [Area.AreaCalculation, Area.Rectangle, Area.Multiplication, Scope.FractionNumbers, Scope.TwoDimensional, Ability.ProcedureExecution], Parameters: { tileMode: false, width: '2/3', height: '4/5' }, Sample: "Find the area of a rectangle with sides 2/3 m and 4/5 m. -> 8/15 sq m"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'fractional-tiling'.
* **UI Layout details:** A main rectangular box representing the area. In tileMode, displays grid lines representing the unit fractions, allowing students to count individual tiles and compare them to the calculated product.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.B.5a - Conceptual Comparison of Product to Factors
* **CCSS Text:** Comparing the size of a product to the size of one factor on the basis of the size of the other factor, without performing the indicated multiplication.
* **Ontology Reference:** Matched Areas: `[Area.NumericComparison, Area.Multiplication, Area.FractionArithmetic]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to support fraction scaling comparison.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.NumericComparison, Area.Multiplication, Scope.FractionNumbers, Ability.LogicalReasoning], Parameters: { compareMode: 'lessThanOne' }, Sample: "Compare: 7 * 4/5 [ ] 7 -> '<'"
  2. **Permutation B:** Labels: [Area.NumericComparison, Area.Multiplication, Scope.FractionNumbers, Ability.LogicalReasoning], Parameters: { compareMode: 'greaterThanOne' }, Sample: "Compare: 7 * 1 1/3 [ ] 7 -> '>'"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'numbers-compare' view.
* **UI Layout details:** Left side displays expression (e.g. 7 * 4/5), right side displays reference value (7), with a comparison dropdown (<, =, >) in the middle.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.B.5b - Explain and Justify Fraction Scaling Principles
* **CCSS Text:** Explaining why multiplying a given number by a fraction greater than 1 results in a product greater than the given number (recognizing multiplication by whole numbers greater than 1 as a familiar case); explaining why multiplying a given number by a fraction less than 1 results in a product smaller than the given number; and relating the principle of fraction equivalence a/b = (n×a)/(n×b) to the effect of multiplying a/b by 1.
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.FractionEquivalence, Area.Multiplication, Area.NumericComparison]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to output multiple-choice explanations for scaling.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.FractionArithmetic, Area.Multiplication, Scope.FractionNumbers, Ability.LogicalReasoning], Parameters: { explanationMode: 'scaling' }, Sample: "Explain why 5 * 2/3 is smaller than 5 -> Multiple choice option indicating multiplying by a value < 1 reduces magnitude."
  2. **Permutation B:** Labels: [Area.FractionEquivalence, Area.Multiplication, Scope.FractionNumbers, Ability.LogicalReasoning], Parameters: { explanationMode: 'identity' }, Sample: "Explain why (2/3) * (4/4) equals 8/12 -> Multiple choice indicating multiplying by 4/4 is equivalent to multiplying by 1."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'numbers-compare' view.
* **UI Layout details:** Displays the equation at the top. Below, a set of 3-4 text-based multiple-choice options are laid out as clickable cards.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.B.6 - Real World Word Problems involving Fraction Multiplication
* **CCSS Text:** Solve real world problems involving multiplication of fractions and mixed numbers, e.g., by using visual fraction models or equations to represent the problem.
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.Multiplication]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support fraction multiplication word problems.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.FractionArithmetic, Area.Multiplication, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { wordProblemType: 'mixed' }, Sample: "A recipe calls for 2 1/2 cups of flour. If you make 1 1/2 batches, how many cups of flour are needed? -> 3 3/4"
  2. **Permutation B:** Labels: [Area.FractionArithmetic, Area.Multiplication, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { wordProblemType: 'proper' }, Sample: "A park is 3/4 lawn. 1/3 of the lawn is mowed. What fraction of the park is mowed? -> 1/4"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'operations-boxes' view.
* **UI Layout details:** Displays the contextual story problem. Empty fraction inputs are provided below for the final mixed number or proper fraction answer.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.B.7a - Divide Unit Fractions by Whole Numbers
* **CCSS Text:** Interpret division of a unit fraction by a non-zero whole number, and compute such quotients. For example, create a story context for (1/3) ÷ 4, and use a visual fraction model to show the quotient. Use the relationship between multiplication and division to explain that (1/3) ÷ 4 = 1/12 because (1/12) × 4 = 1/3.
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.Division]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support fraction-whole division.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.FractionArithmetic, Area.Division, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { divType: 'fractionByWhole' }, Sample: "(1/3) ÷ 4 = ? -> 1/12"
  2. **Permutation B:** Labels: [Area.FractionArithmetic, Area.Division, Scope.FractionNumbers, Ability.VisualArticulation], Parameters: { divType: 'fractionByWholeVisual' }, Sample: "Show partitioning of 1/3 of a bar into 4 equal parts."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'fraction-division-visual'.
* **UI Layout details:** Renders fraction bars: first bar shows the unit fraction (e.g. 1/3 highlighted), the second bar shows each segment divided into N parts (e.g., 12 total), showing that each slice is 1/12.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.B.7b - Divide Whole Numbers by Unit Fractions
* **CCSS Text:** Interpret division of a whole number by a unit fraction, and compute such quotients. For example, create a story context for 4 ÷ (1/5), and use a visual fraction model to show the quotient. Use the relationship between multiplication and division to explain that 4 ÷ (1/5) = 20 because 20 × (1/5) = 4.
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.Division]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support whole-fraction division.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.FractionArithmetic, Area.Division, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { divType: 'wholeByFraction' }, Sample: "4 ÷ (1/5) = ? -> 20"
  2. **Permutation B:** Labels: [Area.FractionArithmetic, Area.Division, Scope.FractionNumbers, Ability.VisualArticulation], Parameters: { divType: 'wholeByFractionVisual' }, Sample: "Count total number of fifths across 4 whole blocks."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'fraction-division-visual'.
* **UI Layout details:** Renders N separate whole blocks, each divided into unit fractions (e.g., 4 circles split into fifths). Students count the total number of partitions (20).

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.NF.B.7c - Solve Real-World Word Problems with Fraction Division
* **CCSS Text:** Solve real world problems involving division of unit fractions by non-zero whole numbers and division of whole numbers by unit fractions, e.g., by using visual fraction models and equations to represent the problem. For example, how much chocolate will each person get if 3 people share 1/2 lb of chocolate equally? How many 1/3-cup servings are in 2 cups of raisins?
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.Division]`, Scopes: `[Scope.FractionNumbers, Scope.RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support division word problems.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.FractionArithmetic, Area.Division, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { wordProblemType: 'fractionByWhole' }, Sample: "3 people share 1/2 pound of chocolate. How much does each person get? -> 1/6"
  2. **Permutation B:** Labels: [Area.FractionArithmetic, Area.Division, Scope.FractionNumbers, Ability.ProcedureExecution], Parameters: { wordProblemType: 'wholeByFraction' }, Sample: "How many 1/3-cup servings are in 2 cups of raisins? -> 6"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'operations-boxes' view.
* **UI Layout details:** Renders the word problem text. Standard input box is provided for the resulting whole number or fraction.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.MD.A.1 - Convert Units within Measurement System
* **CCSS Text:** Convert among different-sized standard measurement units within a given measurement system (e.g., convert 5 cm to 0.05 m), and use these conversions in solving multi-step, real world problems.
* **Ontology Reference:** Matched Areas: `[Area.Measurement, Area.MeasuringObjects, Area.DecimalArithmetic]`, Scopes: `[Scope.MetricScale, Scope.CentimeterScale, Scope.MeterScale]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator to support unit conversions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.MeasuringObjects, Area.DecimalRounding, Scope.CentimeterScale, Scope.MeterScale, Scope.MetricScale], Parameters: { system: 'metric', type: 'length' }, Sample: "Convert 5 cm to meters -> 0.05 m"
  2. **Permutation B:** Labels: [Area.MeasuringObjects, Area.Multiplication, Scope.IntegersWithoutNegatives], Parameters: { system: 'customary', type: 'length' }, Sample: "Convert 3 feet to inches -> 36 inches"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'unit-conversion'.
* **UI Layout details:** Displays the starting measurement on the left (e.g., 5 cm), an equivalence arrow, and an input box followed by the target unit (e.g., meters). Includes a reference conversion chart option.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.MD.B.2 - Line Plots with Fractions and Redistribution (Fair Share)
* **CCSS Text:** Make a line plot to display a data set of measurements in fractions of a unit (1/2, 1/4, 1/8). Use operations on fractions for this grade to solve problems involving information presented in line plots. For example, given different measurements of liquid in identical beakers, find the amount of liquid each beaker would contain if the total amount in all the beakers were redistributed equally.
* **Ontology Reference:** Matched Areas: `[Area.FractionArithmetic, Area.LineGraphing, Area.PointPlotting]`, Scopes: `[Scope.FractionNumbers, Scope.Numberline]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'ordering' generator to handle line plot fraction distributions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.PointPlotting, Area.LineGraphing, Scope.FractionNumbers, Scope.Numberline, Ability.VisualArticulation], Parameters: { plotMode: 'generatePoints', data: [0.25, 0.5, 0.25, 0.125, 0.5] }, Sample: "Plot the fractional measurements on the line plot."
  2. **Permutation B:** Labels: [Area.FractionArithmetic, Area.Addition, Area.Division, Scope.FractionNumbers, Scope.Numberline, Ability.ProcedureExecution], Parameters: { plotMode: 'redistribute' }, Sample: "Find the fair share amount if the total liquid was distributed equally among the 5 beakers -> 13/40"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'line-plot-view'.
* **UI Layout details:** Top: Interactive number line calibrated in eighths (1/8, 1/4, 3/8, 1/2, etc.). Students drag 'X' marks to plot points. Bottom: Formula and inputs for sum and division to calculate redistribution.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.MD.C.3a - Understand Unit Cube and Cubic Unit Concepts
* **CCSS Text:** A cube with side length 1 unit, called a “unit cube,” is said to have “one cubic unit” of volume, and can be used to measure volume.
* **Ontology Reference:** Matched Areas: `[Area.VolumeCalculation, Area.SpaceConcept, Area.Cube]`, Scopes: `[Scope.ThreeDimensional, Scope.VolumeAbstraction]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator to support volume concept questions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.VolumeCalculation, Area.Cube, Area.SpaceConcept, Scope.ThreeDimensional, Ability.ConceptRecall], Parameters: { concept: 'unitCube' }, Sample: "What is the volume of a cube with side length 1 cm? -> 1 cubic cm"
  2. **Permutation B:** Labels: [Area.VolumeCalculation, Area.Cube, Area.SpaceConcept, Scope.ThreeDimensional, Ability.ConceptRecall], Parameters: { concept: 'stackedVolume' }, Sample: "A figure made of 5 unit cubes has what volume? -> 5 cubic units"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'volume-cubes'.
* **UI Layout details:** Displays isometric 3D illustrations of unit cubes. Text input is provided for the volume number and dropdown for the units.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.MD.C.3b - Volume as Packing without Gaps
* **CCSS Text:** A solid figure which can be packed without gaps or overlaps using n unit cubes is said to have a volume of n cubic units.
* **Ontology Reference:** Matched Areas: `[Area.VolumeCalculation, Area.SpaceConcept, Area.Cube]`, Scopes: `[Scope.ThreeDimensional, Scope.VolumeAbstraction]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator to cover packed cube volume concepts.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.VolumeCalculation, Area.Cube, Area.SpaceConcept, Scope.ThreeDimensional, Ability.ConceptRecall], Parameters: { concept: 'gaplessPacking' }, Sample: "If a box is packed with 12 unit cubes without gaps, what is its volume? -> 12 cubic units"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'volume-cubes'.
* **UI Layout details:** Draws a transparent box filled with individual unit cubes in an isometric projection. The student must select or write the total volume based on the count.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.MD.C.4 - Measure Volume by Counting Unit Cubes
* **CCSS Text:** Measure volumes by counting unit cubes, using cubic cm, cubic in, cubic ft, and improvised units.
* **Ontology Reference:** Matched Areas: `[Area.VolumeCalculation, Area.MeasuringObjects]`, Scopes: `[Scope.ThreeDimensional, Scope.VolumeAbstraction, Scope.LinkingCubes]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator to support cube counting in custom 3D shapes.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.VolumeCalculation, Area.MeasuringObjects, Scope.ThreeDimensional, Scope.LinkingCubes, Ability.ProcedureExecution], Parameters: { prismType: 'regular', dims: [3, 2, 2] }, Sample: "Count unit cubes to find volume -> 12 cubic cm"
  2. **Permutation B:** Labels: [Area.VolumeCalculation, Area.MeasuringObjects, Scope.ThreeDimensional, Scope.LinkingCubes, Ability.ProcedureExecution], Parameters: { prismType: 'irregular' }, Sample: "Count unit cubes in the irregular shape -> 9 cubic units"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'volume-cubes'.
* **UI Layout details:** Interactive 3D isometric grid where users can rotate the figure (using orbit controls) to count hidden cubes. Answers are inputted in text field.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.MD.C.5a - Volume of rectangular prism by packing and multiplication
* **CCSS Text:** Find the volume of a right rectangular prism with whole-number side lengths by packing it with unit cubes, and show that the volume is the same as would be found by multiplying the edge lengths, equivalently by multiplying the height by the area of the base. Represent threefold whole-number products as volumes, e.g., to represent the associative property of multiplication.
* **Ontology Reference:** Matched Areas: `[Area.VolumeCalculation, Area.RectangularPrism, Area.Multiplication, Area.AssociativeLaw]`, Scopes: `[Scope.ThreeDimensional, Scope.VolumeAbstraction, Scope.IntegerNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator to support volume packing comparisons.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.VolumeCalculation, Area.Cube, Area.Multiplication, Scope.ThreeDimensional, Scope.LinkingCubes, Ability.ProcedureUnderstanding], Parameters: { dims: [4, 3, 2] }, Sample: "Compare counting 24 cubes to multiplying 4 * 3 * 2. Are they equal? -> Yes"
  2. **Permutation B:** Labels: [Area.VolumeCalculation, Area.AssociativeLaw, Area.Multiplication, Scope.ThreeDimensional, Ability.LogicalReasoning], Parameters: { associativeProof: true }, Sample: "Show that (4 * 3) * 2 matches 4 * (3 * 2) as volume layers."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'volume-cubes'.
* **UI Layout details:** Displays layers of unit cubes separating to demonstrate associative grouping (e.g. 2 layers of 12 cubes vs 4 slices of 6 cubes). Labeled inputs are provided for each term.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.MD.C.5b - Apply Volume Formulas to Rectangular Prisms
* **CCSS Text:** Apply the formulas V = l × w × h and V = b × h for rectangular prisms to find volumes of right rectangular prisms with whole number edge lengths in the context of solving real world and mathematical problems.
* **Ontology Reference:** Matched Areas: `[Area.VolumeCalculation, Area.RectangularPrism, Area.Multiplication]`, Scopes: `[Scope.ThreeDimensional, Scope.VolumeAbstraction, Scope.IntegerNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator to apply volume formulas.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.VolumeCalculation, Area.Multiplication, Scope.ThreeDimensional, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution], Parameters: { formula: 'lwh', dims: [5, 3, 4] }, Sample: "Use V = l * w * h to find volume of 5x3x4 prism -> 60"
  2. **Permutation B:** Labels: [Area.VolumeCalculation, Area.Multiplication, Scope.ThreeDimensional, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution], Parameters: { formula: 'Bh', baseArea: 15, height: 4 }, Sample: "Use V = B * h to find volume -> 60"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'volume-cubes'.
* **UI Layout details:** Draws a right rectangular prism with dimension lines. Includes formula selection tabs and input boxes for variables and output.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.MD.C.5c - Additive Volume of Composite 3D Figures
* **CCSS Text:** Recognize volume as additive. Find volumes of solid figures composed of two non-overlapping right rectangular prisms by adding the volumes of the non-overlapping parts, applying this technique to solve real world problems.
* **Ontology Reference:** Matched Areas: `[Area.VolumeCalculation, Area.RectangularPrism, Area.Addition]`, Scopes: `[Scope.ThreeDimensional, Scope.VolumeAbstraction]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator to support additive composite volumes.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.VolumeCalculation, Area.Addition, Scope.ThreeDimensional, Ability.ProcedureExecution], Parameters: { compositeType: 'twoPrisms', dims1: [3, 2, 2], dims2: [2, 2, 4] }, Sample: "Find total volume of the two non-overlapping prisms -> 12 + 16 = 28"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'volume-cubes'.
* **UI Layout details:** Displays a composite solid composed of two colored right rectangular prisms. Dimension labels are printed for each prism. Students enter both separate volumes and the total.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.G.A.1 - Understand the Cartesian Coordinate System
* **CCSS Text:** Use a pair of perpendicular number lines, called axes, to define a coordinate system, with the intersection of the lines (the origin) arranged to coincide with the 0 on each line and a given point in the plane located by using an ordered pair of numbers, called its coordinates. Understand that the first number indicates how far to travel from the origin in the direction of one axis, and the second number indicates how far to travel in the direction of the second axis, with the convention that the names of the two axes and the coordinates correspond (e.g., x-axis and x-coordinate, y-axis and y-coordinate).
* **Ontology Reference:** Matched Areas: `[Area.CoordinateAxes, Area.CartesianPlane, Area.Origin, Area.PointPlotting]`, Scopes: `[Scope.CartesianCoordinateSystem, Scope.TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'writing' generator to support coordinate definitions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.CoordinateAxes, Area.Origin, Scope.CartesianCoordinateSystem, Scope.TwoDimensional, Ability.ConceptRecall], Parameters: { questionType: 'origin' }, Sample: "What is the ordered pair of the origin? -> (0,0)"
  2. **Permutation B:** Labels: [Area.CoordinateAxes, Area.PlaneConcept, Scope.CartesianCoordinateSystem, Scope.TwoDimensional, Ability.ConceptRecall], Parameters: { questionType: 'axesMovement' }, Sample: "In (4, 7), which coordinate indicates horizontal travel from the origin? -> 4"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'coordinate-graph'.
* **UI Layout details:** Displays a full first-quadrant grid with labeled X-axis and Y-axis, arrows, and origin. Questions are printed alongside the coordinate graph.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.G.A.2 - Graph Points in the First Quadrant and Interpret Context
* **CCSS Text:** Represent real world and mathematical problems by graphing points in the first quadrant of the coordinate plane, and interpret coordinate values of points in the context of the situation.
* **Ontology Reference:** Matched Areas: `[Area.PointPlotting, Area.Quadrants, Area.CartesianPlane]`, Scopes: `[Scope.CartesianCoordinateSystem, Scope.TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'ordering' or 'counting' generator to support coordinate graphing.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.PointPlotting, Area.CoordinateAxes, Scope.CartesianCoordinateSystem, Scope.TwoDimensional, Ability.ProcedureExecution], Parameters: { plotMode: 'singlePoint', target: [3, 5] }, Sample: "Graph the point (3, 5) on the coordinate plane."
  2. **Permutation B:** Labels: [Area.PointPlotting, Area.CoordinateAxes, Scope.CartesianCoordinateSystem, Scope.TwoDimensional, Ability.Interpretation], Parameters: { plotMode: 'interpretPoint', data: [4, 40] }, Sample: "Point (4, 40) shows hours worked and earnings. What does 40 represent? -> Earnings ($)"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'coordinate-graph'.
* **UI Layout details:** A 10x10 grid with gridlines, numbers, axis labels. Students tap coordinates to place dots. The coordinates update in real time in a text label.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.G.B.3 - Deduce Class and Subclass Shape Properties
* **CCSS Text:** Understand that attributes belonging to a category of two-dimensional figures also belong to all subcategories of that category. For example, all rectangles have four right angles and squares are rectangles, so all squares have four right angles.
* **Ontology Reference:** Matched Areas: `[Area.TwoDimensionalObjects, Area.Rectangle, Area.Square, Area.RightAngle]`, Scopes: `[Scope.TwoDimensional, Scope.VisualGeometry]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to support shape hierarchies.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.Square, Area.Rectangle, Area.RightAngle, Scope.TwoDimensional, Ability.LogicalReasoning], Parameters: { hierarchyMode: 'inheritance' }, Sample: "All rectangles have four right angles. Squares are rectangles. Do squares have four right angles? -> 'yes'"
  2. **Permutation B:** Labels: [Area.Square, Area.Rhombus, Scope.TwoDimensional, Ability.LogicalReasoning], Parameters: { hierarchyMode: 'rhombusInheritance' }, Sample: "All rhombuses have four equal sides. A square is a rhombus. Therefore, all squares have four equal sides. -> True/False"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse 'numbers-compare' view.
* **UI Layout details:** Presents the deductive syllogism in a clear readable block. Multiple-choice answer buttons (Yes/No, True/False) are aligned underneath.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Verify view compatibility with the new parameters.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## 5.G.B.4 - Classify Two-Dimensional Figures in a Hierarchy
* **CCSS Text:** Classify two-dimensional figures in a hierarchy based on properties.
* **Ontology Reference:** Matched Areas: `[Area.TwoDimensionalObjects, Area.Polygon, Area.Quadrilateral, Area.Triangle]`, Scopes: `[Scope.TwoDimensional, Scope.VisualGeometry]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to support shape classifications.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Labels: [Area.Square, Area.Rectangle, Area.Rhombus, Scope.TwoDimensional, Ability.LogicalReasoning], Parameters: { classifyMode: 'overlap' }, Sample: "Which shape is both a rectangle and a rhombus? -> Square"
  2. **Permutation B:** Labels: [Area.Square, Area.Rectangle, Area.Trapezoid, Scope.TwoDimensional, Ability.LogicalReasoning], Parameters: { classifyMode: 'hierarchyTree' }, Sample: "Drag figures into hierarchy order (Polygon -> Quadrilateral -> Parallelogram -> Rectangle -> Square)"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Propose new view 'shape-hierarchy-classifier'.
* **UI Layout details:** A drag-and-drop tree view representing geometric shapes. Students drag shape labels into their corresponding nested classifications. Fully touch-responsive on mobile devices.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `{filename}.tests.js`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

