# Grade 1 Backlog: Uncovered CCSS Standards

This backlog contains the implementation specifications for all Grade 1 Common Core State Standards (CCSS) leaf nodes that are currently covered by the EduGraph ontology (`ontology_covered === true`) but not yet covered by the dataset (`dataset_covered === false`).

---

## 1.OA.A.1 - Word Problems with Addition and Subtraction within 20
* **CCSS Text:** Use addition and subtraction within 20 to solve word problems involving situations of adding to, taking from, putting together, taking apart, and comparing, with unknowns in all positions, e.g., by using objects, drawings, and equations with a symbol for the unknown number to represent the problem.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, `Area.Difference`, `Area.Sum`, Scopes: `Scope.NumbersSmaller20`, `Scope.IntegersWithoutNegatives`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator by adding parameters `wordProblemType` ('addTo' | 'takeFrom' | 'putTogether' | 'takeApart' | 'compare') and `unknownPosition` ('result' | 'change' | 'start').
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Add to / Take from with result/change unknown.
     - **Labels:** `Area.Addition`, `Area.Subtraction`, `Scope.NumbersSmaller20`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'word-problem', type: 'add-take', range: [0, 20], unknownPosition: 'result' }`
     - **Sample question:** "There were 12 apples in a basket. 5 more were added. How many apples are there now?"
  2. **Permutation B:** Put together / Take apart with addend unknown.
     - **Labels:** `Area.Sum`, `Area.Difference`, `Scope.NumbersSmaller20`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'word-problem', type: 'put-take-apart', range: [0, 20], unknownPosition: 'change' }`
     - **Sample question:** "There are 15 balloons. 9 are red and the rest are blue. How many balloons are blue?"
  3. **Permutation C:** Compare with difference unknown.
     - **Labels:** `Area.Difference`, `Scope.NumbersSmaller20`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'word-problem', type: 'compare', range: [0, 20], unknownPosition: 'result' }`
     - **Sample question:** "Ben has 14 books. Anna has 6 books. How many more books does Ben have than Anna?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Design a new view `operations-word-problems`.
* **UI Layout details:** Displays a stylized word problem card. The card features a clear, large text block containing the scenario. Below the text, a visual display zone renders side-by-side collections of SVG icons matching the scenario elements (e.g., apples, books, balloons) using seeded randomness to arrange them neatly. At the bottom, a horizontal equation is shown with the unknown position highlighted as a dashed border box. The design must be fully responsive, switching to a single-column layout on smaller viewports.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `wordProblemType` and `unknownPosition` parameters to `arithmetic` generator config.
- [ ] Implement the math logic and text templates for word scenarios in `src/generators/arithmetic/generator.ts`.
- [ ] Add the permutations to `src/generators/arithmetic/permutations.ts` with matching labels.
- [ ] Create the new view directory `src/views/operations-word-problems/` and implement `exercise.html`, `exercise.scss`, and `exercise.ts`.
- [ ] Register `operations-word-problems` view in `src/index.html` and generator pipeline.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated word problems and their mathematical solutions in `src/generators/arithmetic/generator.test.ts`.
- [ ] Validate question generation boundary values to ensure the sum never exceeds 20 and differences are non-negative.
- [ ] Manually preview exercises using the standard visualizer to check rendering alignment of icons.

---

## 1.OA.A.2 - Three-Addend Addition Word Problems (Sum <= 20)
* **CCSS Text:** Solve word problems that call for addition of three whole numbers whose sum is less than or equal to 20, e.g., by using objects, drawings, and equations with a symbol for the unknown number to represent the problem.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Sum`, Scopes: `Scope.NumbersSmaller20`, `Scope.IntegersWithoutNegatives`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator to support `numAddends: 3` and `maxSum: 20` parameters.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Horizontal three-addend equation.
     - **Labels:** `Area.Addition`, `Scope.NumbersSmaller20`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     - **Parameters:** `{ numAddends: 3, maxSum: 20, blankPosition: 'sum', mode: 'equation' }`
     - **Sample question:** "7 + 5 + 4 = [ ? ]"
  2. **Permutation B:** Three-addend word problem with visual groups.
     - **Labels:** `Area.Sum`, `Scope.NumbersSmaller20`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     - **Parameters:** `{ numAddends: 3, maxSum: 20, blankPosition: 'sum', mode: 'word-problem' }`
     - **Sample question:** "Sam has 4 red apples, 5 green apples, and 3 yellow apples. How many apples does he have in total?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view and extend it.
* **UI Layout details:** Aligns three addend boxes horizontally (e.g. `[Box 1] + [Box 2] + [Box 3] = [Box 4]`). In word-problem mode, it displays the scenario text at the top. The visual section displays three groups of colored circles, stars, or fruit SVGs representing the three addends. The answer box has a dashed border. Fully responsive scaling.

### Subtask 3: Developer Implementation Checklist
- [ ] Support `numAddends: 3` parameter in the `arithmetic` generator logic.
- [ ] Implement three-part scenario builder inside `src/generators/arithmetic/generator.ts`.
- [ ] Add three-addend configurations to `src/generators/arithmetic/permutations.ts`.
- [ ] Modify `src/views/operations-boxes/view.ts` to conditionally render three horizontal inputs instead of two.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that three addends are correctly generated and their sum never exceeds 20.
- [ ] Validate edge cases where one of the addends is 0 to ensure compliance with integers with zero.
- [ ] Preview the generated three-part boxes using the local Vite server.

---

## 1.OA.B.3 - Apply Properties of Operations (Commutative/Associative)
* **CCSS Text:** Apply properties of operations as strategies to add and subtract. (Students need not use formal terms for these properties.) Examples: If 8 + 3 = 11 is known, then 3 + 8 = 11 is also known. (Commutative property of addition.) To add 2 + 6 + 4, the second two numbers can be added to make a ten, so 2 + 6 + 4 = 2 + 10 = 12. (Associative property of addition.)
* **Ontology Reference:** Matched Areas: `Area.CommutativeLaw`, `Area.AssociativeLaw`, `Area.Addition`, `Area.Subtraction`, Scopes: `Scope.NumbersSmaller20`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator by adding parameters `propertyType` ('commutative' | 'associative') and `blankPart` ('missing-number' | 'intermediate-step').
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Commutative property fill-in.
     - **Labels:** `Area.CommutativeLaw`, `Area.Addition`, `Scope.NumbersSmaller20`, `Ability.ProcedureApplication`
     - **Parameters:** `{ propertyType: 'commutative', range: [0, 20] }`
     - **Sample question:** "If 8 + 3 = 11, then 3 + [ ? ] = 11"
  2. **Permutation B:** Associative property (making ten step).
     - **Labels:** `Area.AssociativeLaw`, `Area.Addition`, `Scope.NumbersSmaller20`, `Ability.ProcedureApplication`
     - **Parameters:** `{ propertyType: 'associative', makeTen: true, range: [0, 20] }`
     - **Sample question:** "To solve 2 + 6 + 4, we can do 2 + [ ? ] = 12"

### Subtask 2: View & UI Design
* **Reuse or New View:** Design a new view `operations-properties`.
* **UI Layout details:** Presents paired equations in a vertically stacked layout.
  - Commutative layout: Displays a "given" equation at the top with a subtle colored background border (e.g. "If 8 + 3 = 11"), and directly below it the query equation (e.g., "Then 3 + [ ? ] = 11") where the target input is highlighted.
  - Associative layout: Displays a three-number equation with a curved line grouping two terms that make ten, pointing to an intermediate fill-in-the-blank step. Responsive text scaling.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `propertyType` and associative grouping parameters to `arithmetic` generator options.
- [ ] Implement algebraic pairing logic in `src/generators/arithmetic/generator.ts`.
- [ ] Register new permutations in `src/generators/arithmetic/permutations.ts`.
- [ ] Create `src/views/operations-properties/` directory and implement HTML/SCSS/TS files.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that properties questions have valid corresponding values (e.g., matching the commutative swap).
- [ ] Verify that associative tasks strictly choose two addends that sum to 10.
- [ ] Review properties rendering in Vite development sandbox.

---

## 1.OA.D.7 - Meaning of the Equal Sign (True/False Equations)
* **CCSS Text:** Understand the meaning of the equal sign, and determine if equations involving addition and subtraction are true or false. For example, which of the following equations are true and which are false? 6 = 6, 7 = 8 – 1, 5 + 2 = 2 + 5, 4 + 1 = 5 + 2.
* **Ontology Reference:** Matched Areas: `Area.ArithmeticEvaluation`, `Area.Addition`, `Area.Subtraction`, `Area.NumericIdentity`, Scopes: `Scope.IntegersWithoutNegatives`, `Scope.Base10`, `Scope.NumbersSmaller20`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator to output true/false evaluation problems with formats `A = B`, `A + B = C`, or `A + B = C + D`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Identity equations evaluation.
     - **Labels:** `Area.NumericIdentity`, `Area.ArithmeticEvaluation`, `Scope.NumbersSmaller20`, `Ability.PlausibilityEvaluation`
     - **Parameters:** `{ evaluationMode: 'true-false', structure: 'identity', range: [0, 20] }`
     - **Sample question:** "Is 6 = 6 true or false? Is 7 = 8 - 1 true or false?"
  2. **Permutation B:** Equivalent expression equations evaluation.
     - **Labels:** `Area.Addition`, `Area.Subtraction`, `Area.ArithmeticEvaluation`, `Scope.NumbersSmaller20`, `Ability.PlausibilityEvaluation`
     - **Parameters:** `{ evaluationMode: 'true-false', structure: 'expression-equivalence', range: [0, 20] }`
     - **Sample question:** "Is 5 + 2 = 2 + 5 true or false? Is 4 + 1 = 5 + 2 true or false?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view, extending it with a toggle control.
* **UI Layout details:** The equation is displayed centered in a very large font (e.g. `4 + 1 = 5 + 2`). Below the equation, there are two distinct interactive buttons: "True" (with a green styling) and "False" (with a red styling). In answer view, the correct button is highlighted with an active border, and an icon checkmark/cross is displayed next to the equation. Fully responsive.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `evaluationMode` and equation structure variables to generator parameters.
- [ ] Implement true/false equation generation math in `src/generators/arithmetic/generator.ts`.
- [ ] Add permutations to `src/generators/arithmetic/permutations.ts`.
- [ ] Implement button UI and validation logic in `src/views/operations-boxes/view.ts`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying correctness of the `isTrue` flag for all generated equations.
- [ ] Validate bounds to ensure subtraction equations never produce negative numbers and values are within [0, 20].
- [ ] Test button scaling and responsiveness across different resolution presets.

---

## 1.OA.D.8 - Unknown Whole Numbers in Addition and Subtraction Equations
* **CCSS Text:** Determine the unknown whole number in an addition or subtraction equation relating to three whole numbers. For example, determine the unknown number that makes the equation true in each of the equations 8 + ? = 11, 5 = [] – 3, 6 + 6 = [].
* **Ontology Reference:** Matched Areas: `Area.ArithmeticEvaluation`, `Area.Addition`, `Area.Subtraction`, `Area.Algebra`, Scopes: `Scope.IntegersWithoutNegatives`, `Scope.Base10`, `Scope.NumbersSmaller20`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator to place the blank at any position in the equation (`A + B = C`, `C = A + B`, `A - B = C`, `C = A - B`).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Standard format with start/change unknown.
     - **Labels:** `Area.Algebra`, `Area.Addition`, `Area.Subtraction`, `Scope.NumbersSmaller20`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'unknown-solving', format: 'standard', blankPart: 'addend' }`
     - **Sample question:** "8 + [ ? ] = 11"
  2. **Permutation B:** Reversed format with start unknown.
     - **Labels:** `Area.Algebra`, `Area.Addition`, `Area.Subtraction`, `Scope.NumbersSmaller20`, `Ability.LogicalInference`
     - **Parameters:** `{ mode: 'unknown-solving', format: 'reversed', blankPart: 'minuend' }`
     - **Sample question:** "5 = [ ? ] - 3"

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view.
* **UI Layout details:** The three-number equation is displayed centered. The unknown parameter is replaced by a square input box with a dashed border containing a question mark (e.g. `8 + [ ? ] = 11`). The placement of the blank box changes dynamically depending on the generator input. In solution view, the correct value is filled inside the box with a highlighted background.

### Subtask 3: Developer Implementation Checklist
- [ ] Update `arithmetic` generator logic to permit variable blank positions.
- [ ] Implement algebraic relation constraint satisfaction in `src/generators/arithmetic/generator.ts`.
- [ ] Register permutations in `src/generators/arithmetic/permutations.ts`.
- [ ] Ensure `operations-boxes` supports the variable blank parameter correctly.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that solving the unknown yields the exact matching value to satisfy the equation.
- [ ] Validate that all numbers fall within the [0, 20] range.
- [ ] Preview different blank positions in browser visualizer.

---

## 1.NBT.B.2a - Ten as a Bundle of Ten Ones
* **CCSS Text:** 10 can be thought of as a bundle of ten ones — called a "ten."
* **Ontology Reference:** Matched Areas: `Area.PlaceValue`, `Area.Numeration`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller20`, `Scope.BaseTenBlocks`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `writing` generator by adding place value representations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Bundling 10 ones.
     - **Labels:** `Area.PlaceValue`, `Scope.Base10`, `Scope.BaseTenBlocks`, `Ability.ConceptSpecification`
     - **Parameters:** `{ concept: 'ones-to-ten-bundling' }`
     - **Sample question:** "10 ones = [ ? ] ten"

### Subtask 2: View & UI Design
* **Reuse or New View:** Design a new view `place-value-blocks`.
* **UI Layout details:** The screen displays 10 individual unit cubes on the left side, grouped loosely. A bold transition arrow points to the right side, showing a single place-value rod (ten block). Below the visual, the text statement `10 ones = [ ? ] ten` is shown. In solution view, the correct answer `1` is filled into the dashed box. Fully responsive, adapting visually to horizontal or vertical layouts.

### Subtask 3: Developer Implementation Checklist
- [ ] Add place-value bundling options to `writing` generator config.
- [ ] Implement static bundling problem stub in `src/generators/writing/generator.ts`.
- [ ] Add the permutation in `src/generators/writing/permutations.ts`.
- [ ] Create `src/views/place-value-blocks/` directory and write HTML, SCSS, and TS.
- [ ] Register view in local vite configuration.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying correct output parameters for the bundling concept in `src/generators/writing/generator.test.ts`.
- [ ] Verify that the answers match exactly 1 ten and 10 ones.
- [ ] Visually verify rod and block representation alignment in Chrome viewport.

---

## 1.NBT.B.2b - Teen Numbers Composition (11-19)
* **CCSS Text:** The numbers from 11 to 19 are composed of a ten and one, two, three, four, five, six, seven, eight, or nine ones.
* **Ontology Reference:** Matched Areas: `Area.PlaceValue`, `Area.Numeration`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller20`, `Scope.NumbersLarger10`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `writing` generator to support teen number decomposition.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Decompose teen number.
     - **Labels:** `Area.PlaceValue`, `Scope.NumbersSmaller20`, `Scope.NumbersLarger10`, `Ability.DirectUnderstanding`
     - **Parameters:** `{ concept: 'teen-decomposition', target: 'tens-ones', range: [11, 19] }`
     - **Sample question:** "14 = [ ? ] ten and [ ? ] ones"
  2. **Permutation B:** Assemble teen number.
     - **Labels:** `Area.PlaceValue`, `Scope.NumbersSmaller20`, `Scope.NumbersLarger10`, `Ability.DirectUnderstanding`
     - **Parameters:** `{ concept: 'teen-decomposition', target: 'number', range: [11, 19] }`
     - **Sample question:** "1 ten and 7 ones = [ ? ]"

### Subtask 2: View & UI Design
* **Reuse or New View:** Design a new view `place-value-decompositions` or reuse `place-value-blocks`.
* **UI Layout details:** Shows a base-ten representation on the left: 1 ten-rod (rod) and a grid of unit blocks (e.g. 4 cubes). On the right, it displays the text decomposition equation with empty boxes: `14 = [ ? ] ten and [ ? ] ones`. The interface is clean, color-coded (tens in blue, ones in orange), and scales down dynamically for mobile displays.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement teen number logic in `src/generators/writing/generator.ts` to output target values and text components.
- [ ] Add permutations to `src/generators/writing/permutations.ts`.
- [ ] Implement `place-value-decompositions` view logic to support block renderings and fill-in boxes.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that teen decomposition correctly outputs 1 ten and [1-9] ones.
- [ ] Validate question generation boundary values (numbers 11 to 19 inclusive).
- [ ] Manually preview exercises on Vite dev server to verify block spacing.

---

## 1.NBT.B.2c - Decade Numbers Composition (10-90)
* **CCSS Text:** The numbers 10, 20, 30, 40, 50, 60, 70, 80, 90 refer to one, two, three, four, five, six, seven, eight, or nine tens (and 0 ones).
* **Ontology Reference:** Matched Areas: `Area.PlaceValue`, `Area.Numeration`, `Area.ZeroConcept`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller100`, `Scope.IntegersWithZero`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `writing` generator to include decade number configurations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Decompose decade numbers.
     - **Labels:** `Area.PlaceValue`, `Area.ZeroConcept`, `Scope.NumbersSmaller100`, `Ability.DirectUnderstanding`
     - **Parameters:** `{ concept: 'decade-decomposition', target: 'tens-ones', range: [10, 90] }`
     - **Sample question:** "40 = [ ? ] tens and [ ? ] ones"
  2. **Permutation B:** Assemble decade numbers from tens.
     - **Labels:** `Area.PlaceValue`, `Scope.NumbersSmaller100`, `Ability.DirectUnderstanding`
     - **Parameters:** `{ concept: 'decade-decomposition', target: 'number', range: [10, 90] }`
     - **Sample question:** "7 tens = [ ? ]"

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `place-value-decompositions` view.
* **UI Layout details:** Renders decade base-ten rods (e.g. 4 rods for 40) vertically on the left. The right side features a fill-in text card showing `40 = [ ? ] tens and [ ? ] ones` or `7 tens = [ ? ]`. Large typography, clear contrasting backgrounds, and responsive layout.

### Subtask 3: Developer Implementation Checklist
- [ ] Add decade decomposition math to `src/generators/writing/generator.ts`.
- [ ] Add permutations to `src/generators/writing/permutations.ts`.
- [ ] Support decade block rendering (no ones units) in `place-value-decompositions` view.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that decade numbers (10, 20, ..., 90) map to [1-9] tens and strictly 0 ones.
- [ ] Ensure that no other numbers (e.g. 45) are generated in this mode.
- [ ] Review layout on multiple screen sizes.

---

## 1.NBT.B.3 - Comparing Two-Digit Numbers
* **CCSS Text:** Compare two two-digit numbers based on meanings of the tens and ones digits, recording the results of comparisons with the symbols >, =, and <.
* **Ontology Reference:** Matched Areas: `Area.NumericComparison`, `Area.PlaceValue`, `Area.NumericOrder`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller100`, `Scope.ArabicNumerals`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `comparison` generator by adding parameters `matchTens` (boolean) and `range: 'two-digits'`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Compare numbers with different tens.
     - **Labels:** `Area.NumericComparison`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     - **Parameters:** `{ min: 10, max: 99, matchTens: false }`
     - **Sample question:** "42 [ ? ] 38"
  2. **Permutation B:** Compare numbers with same tens.
     - **Labels:** `Area.NumericComparison`, `Area.PlaceValue`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     - **Parameters:** `{ min: 10, max: 99, matchTens: true }`
     - **Sample question:** "57 [ ? ] 54"

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numbers-compare` view and enrich it.
* **UI Layout details:** The numbers are rendered side-by-side in large circles or cards. Below each number, a representation of base-ten rods and unit blocks corresponding to the value is drawn. Between the numbers, a central dashed box is rendered for the comparison symbol. In solution view, the correct symbol (`<`, `>`, `=`) is displayed inside the central box. Fully responsive.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `matchTens` constraint logic to `comparison` generator in `src/generators/comparison/generator.ts`.
- [ ] Add two-digit permutations to `src/generators/comparison/permutations.ts`.
- [ ] Update `src/views/numbers-compare/view.ts` to render base-ten blocks below the comparison numbers.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that `matchTens: true` generates values with identical tens digits (e.g. 64 and 68).
- [ ] Validate that all generated values are between 10 and 99.
- [ ] Manually check block visual alignment inside the comparison boxes.

---

## 1.NBT.C.4 - Addition within 100 (2-Digit + 1-Digit / 2-Digit + Multiple of 10)
* **CCSS Text:** Add within 100, including adding a two-digit number and a one-digit number, and adding a two-digit number and a multiple of 10, using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between addition and subtraction; relate the strategy to a written method and explain the reasoning used. Understand that in adding two-digit numbers, one adds tens and tens, ones and ones; and sometimes it is necessary to compose a ten.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.PlaceValue`, `Area.IntegerRegrouping`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller100`, `Scope.BaseTenBlocks`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator by adding parameters `additionType` ('2d-plus-1d' | '2d-plus-multiple-10') and `regrouping` (boolean).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** 2-digit + 1-digit with regrouping.
     - **Labels:** `Area.Addition`, `Area.IntegerRegrouping`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     - **Parameters:** `{ additionType: '2d-plus-1d', regrouping: true }`
     - **Sample question:** "45 + 7 = [ ? ]"
  2. **Permutation B:** 2-digit + multiple of 10.
     - **Labels:** `Area.Addition`, `Area.PlaceValue`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     - **Parameters:** `{ additionType: '2d-plus-multiple-10', regrouping: false }`
     - **Sample question:** "34 + 40 = [ ? ]"

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-vertical` or `operations-boxes` view, adding block displays.
* **UI Layout details:** The sum is rendered vertically in standard column addition format. Next to the column arithmetic block, a panel shows the place-value blocks (rods and units) for both addends. For regrouping, a dotted line loops 10 unit blocks together showing an arrow indicating their conversion into a new ten-rod. Clean, color-coded, and responsive.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `additionType` and `regrouping` parameters to generator config.
- [ ] Write arithmetic logic in `src/generators/arithmetic/generator.ts` to satisfy regrouping and decade criteria.
- [ ] Add configurations to `src/generators/arithmetic/permutations.ts`.
- [ ] Modify `src/views/operations-vertical/view.ts` to render visual base-ten blocks alongside standard vertical columns.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that regrouping mode generates problems where the sum of the ones exceeds 9.
- [ ] Ensure that sums are strictly less than 100.
- [ ] Verify alignment of base-ten rods and unit block SVGs on the vertical view template.

---

## 1.NBT.C.5 - Mentally Find 10 More or 10 Less
* **CCSS Text:** Given a two-digit number, mentally find 10 more or 10 less than the number, without having to count; explain the reasoning used.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, `Area.PlaceValue`, `Area.Increment`, `Area.Decrement`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller100`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator by adding parameters `mentalMode` ('ten-more' | 'ten-less') and `range: 'two-digits'`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Find 10 more.
     - **Labels:** `Area.Increment`, `Area.Addition`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mentalMode: 'ten-more', range: [10, 89] }`
     - **Sample question:** "What is 10 more than 43? [ ? ]"
  2. **Permutation B:** Find 10 less.
     - **Labels:** `Area.Decrement`, `Area.Subtraction`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mentalMode: 'ten-less', range: [20, 99] }`
     - **Sample question:** "What is 10 less than 72? [ ? ]"

### Subtask 2: View & UI Design
* **Reuse or New View:** Design a new view `mental-increment-decrement`.
* **UI Layout details:** Features a friendly dialog card: "What is 10 more/less than [Number]?". Below the question, a clean blank answer box `[ ? ]` is displayed. An optional 100-chart fragment centered on the target number is displayed with the adjacent vertical numbers hidden to highlight place-value jump concepts. Responsive, with large numbers and cards.

### Subtask 3: Developer Implementation Checklist
- [ ] Support `mentalMode` parameter in the `arithmetic` generator.
- [ ] Implement value generator restricting boundaries to range [10, 89] for addition and [20, 99] for subtraction.
- [ ] Create permutations config in `src/generators/arithmetic/permutations.ts`.
- [ ] Implement `src/views/mental-increment-decrement/` HTML, SCSS, and TS.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that 10 more adds exactly 10, and 10 less subtracts exactly 10 from the original value.
- [ ] Verify that all inputs generated are valid two-digit numbers.
- [ ] Preview layout and typography resizing.

---

## 1.NBT.C.6 - Subtract Multiples of 10 (Range 10-90)
* **CCSS Text:** Subtract multiples of 10 in the range 10-90 from multiples of 10 in the range 10-90 (positive or zero differences), using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between addition and subtraction; relate the strategy to a written method and explain the reasoning used.
* **Ontology Reference:** Matched Areas: `Area.Subtraction`, `Area.PlaceValue`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller100`, `Scope.BaseTenBlocks`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator by adding parameter `subtractionType: 'multiples-of-10'`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Subtract multiples of ten.
     - **Labels:** `Area.Subtraction`, `Area.PlaceValue`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     - **Parameters:** `{ subtractionType: 'multiples-of-10', range: [10, 90] }`
     - **Sample question:** "70 - 30 = [ ? ]"

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-boxes` view, displaying decade block visuals.
* **UI Layout details:** Displays the horizontal equation `70 - 30 = [ ? ]`. Above the equation, 7 base-ten rods are rendered. 3 of the rods are crossed out with a red X to represent subtraction, illustrating that 7 tens minus 3 tens equals 4 tens. Highly readable and fully responsive.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `subtractionType` options to generator logic.
- [ ] Write math code in `src/generators/arithmetic/generator.ts` ensuring operands are multiples of 10 and difference is non-negative.
- [ ] Add permutations to `src/generators/arithmetic/permutations.ts`.
- [ ] Extend `operations-boxes` view to render crossed-out decade rods when the multiples-of-10 flag is passed.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that all operands are multiples of 10, the difference is non-negative, and values are between 10 and 90.
- [ ] Ensure that no fractional or decimal parts are produced.
- [ ] Preview rods and crossing-out animations/borders on standard viewports.

---

## 1.MD.A.1 - Order Three Objects by Length and Indirect Comparison
* **CCSS Text:** Order three objects by length; compare the lengths of two objects indirectly by using a third object.
* **Ontology Reference:** Matched Areas: `Area.Measurement`, `Area.NumericComparison`, `Area.NumericOrder`, Scopes: `Scope.LengthMeasurement`, `Scope.OneDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `measurement` generator to produce ordering and indirect comparison tasks.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Order three objects by length.
     - **Labels:** `Area.Measurement`, `Area.NumericOrder`, `Scope.LengthMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ task: 'order-three-lengths', orderDirection: 'shortest-to-longest' }`
     - **Sample question:** "Order the lines from shortest to longest."
  2. **Permutation B:** Indirect comparison word problems.
     - **Labels:** `Area.Measurement`, `Area.NumericComparison`, `Scope.LengthMeasurement`, `Ability.LogicalReasoning`
     - **Parameters:** `{ task: 'indirect-comparison-word-problem' }`
     - **Sample question:** "Pencil A is longer than Pencil B. Pencil B is longer than Pencil C. Which is longer: Pencil A or Pencil C?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `measure-compare-lengths`.
* **UI Layout details:**
  - For ordering: Renders three objects (e.g. crayons, pencils, or paintbrushes) vertically aligned at their left edge. Each object has a distinct length. Next to or below them are empty ordering slots (marked 1, 2, 3).
  - For indirect comparison: Renders a structured word problem card with accompanying illustrative SVGs showing relative alignments of the objects. Clean, colored borders, and mobile responsive.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `task` and `orderDirection` parameters to `measurement` generator.
- [ ] Implement ordering and indirect comparison logic in `src/generators/measurement/generator.ts`.
- [ ] Register new permutations in `src/generators/measurement/permutations.ts`.
- [ ] Create `src/views/measure-compare-lengths/` and implement layout rendering.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that three distinct lengths are always generated (no duplicates) and indirect comparisons are logically solvable.
- [ ] Validate that lengths stay within acceptable visual ratios.
- [ ] Verify responsiveness of object scales on mobile screen sizes.

---

## 1.MD.A.2 - Measuring Length by Iterating Shorter Units
* **CCSS Text:** Express the length of an object as a whole number of length units, by laying multiple copies of a shorter object (the length unit) end to end; understand that the length measurement of an object is the number of same-size length units that span it with no gaps or overlaps. Limit to contexts where the object being measured is spanned by a whole number of length units with no gaps or overlaps.
* **Ontology Reference:** Matched Areas: `Area.Measurement`, `Area.MeasuringObjects`, `Area.Numeration`, Scopes: `Scope.LengthMeasurement`, `Scope.PhysicalNumbers`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `measurement` generator by adding parameters `unitType` ('blocks' | 'paperclips') and `objectLength` (integer).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Measure with non-standard units.
     - **Labels:** `Area.MeasuringObjects`, `Scope.LengthMeasurement`, `Scope.PhysicalNumbers`, `Ability.ProcedureExecution`
     - **Parameters:** `{ task: 'measure-iterated', unitType: 'paperclips', objectLengthRange: [3, 10] }`
     - **Sample question:** "How many paperclips long is the crayon? [ ? ] paperclips."

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `measure-length` view and modify it.
* **UI Layout details:** The main panel displays an item (e.g. toothbrush, paintbrush, key). Directly underneath it, a contiguous row of identical, non-standard unit SVGs (like small colorful blocks or metal paperclips) are rendered starting precisely at the left edge of the object and ending at the right edge, without gaps or overlaps. Below, a box asks: "How many [units] long is the [object]?" with an answer field. Fully responsive.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement the iterated units logic inside `src/generators/measurement/generator.ts`.
- [ ] Register non-standard unit permutations in `src/generators/measurement/permutations.ts`.
- [ ] Adapt `src/views/measure-length/view.ts` to support rendering discrete unit tiles instead of a continuous ruler scale.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that the number of units matches the length exactly, with no fractional values.
- [ ] Validate boundaries to keep object lengths within 3 to 10 units.
- [ ] Manually check alignment of non-standard units to the zero mark.

---

## 1.MD.B.3 - Telling Time in Hours and Half-Hours
* **CCSS Text:** Tell and write time in hours and half-hours using analog and digital clocks.
* **Ontology Reference:** Matched Areas: `Area.MeasuringTime`, Scopes: `Scope.AnalogClock`, `Scope.DigitalClock`, `Scope.HourIntervals`, `Scope.MinuteIntervals`, `Scope.TimeMeasurement`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `time` generator by adding a parameter `precision: 'half-hour'` and `mode` ('analog-to-digital' | 'digital-to-analog').
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Tell time from analog clock.
     - **Labels:** `Area.MeasuringTime`, `Scope.AnalogClock`, `Scope.HourIntervals`, `Scope.MinuteIntervals`, `Ability.ProcedureExecution`
     - **Parameters:** `{ format: 'analog-to-digital', precision: 'half-hour' }`
     - **Sample question:** "Read the clock and write the time: [ ? ] : [ ? ]"
  2. **Permutation B:** Select correct analog clock for digital time.
     - **Labels:** `Area.MeasuringTime`, `Scope.DigitalClock`, `Scope.HourIntervals`, `Scope.MinuteIntervals`, `Ability.ProcedureExecution`
     - **Parameters:** `{ format: 'digital-to-analog', precision: 'half-hour' }`
     - **Sample question:** "Match the clock that shows 4:30."

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `time-analog` view.
* **UI Layout details:** Renders an elegant SVG analog clock face with clear hour numbers (1-12), a long minute hand, and a short hour hand. In `analog-to-digital` mode, the student fills in a digital clock input block `[ ? ] : [ ? ]` below it. The layout is optimized to look crisp on both desktop and mobile viewports.

### Subtask 3: Developer Implementation Checklist
- [ ] Support `precision: 'half-hour'` in `time` generator to generate times ending in `:00` or `:30`.
- [ ] Add permutations to `src/generators/time/permutations.ts`.
- [ ] Adapt `src/views/time-analog/view.ts` to display a digital input/solution box below the clock face.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that all generated minutes are either 0 or 30 and hour values are between 1 and 12.
- [ ] Verify that the hour hand is rendered halfway between the numbers when the minutes are 30.
- [ ] Validate layout scaling on various device widths.

---

## 1.MD.C.4 - Categorical Data Organization and Interpretation (Up to 3 Categories)
* **CCSS Text:** Organize, represent, and interpret data with up to three categories; ask and answer questions about the total number of data points, how many in each category, and how many more or less are in one category than in another.
* **Ontology Reference:** Matched Areas: `Area.Statistics`, `Area.ObjectSorting`, `Area.Difference`, Scopes: `Scope.QuantityMeasurement`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `counting` generator (or create a new `statistics` module) to output category lists, tally charts, and comparison questions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Find category count from chart.
     - **Labels:** `Area.ObjectSorting`, `Area.Statistics`, `Scope.QuantityMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'statistics', questionType: 'category-count', numCategories: 3 }`
     - **Sample question:** "How many apples are shown in the chart?"
  2. **Permutation B:** Compare categories (how many more/less).
     - **Labels:** `Area.Difference`, `Area.Statistics`, `Scope.QuantityMeasurement`, `Ability.ResultInterpretation`
     - **Parameters:** `{ mode: 'statistics', questionType: 'category-difference', numCategories: 3 }`
     - **Sample question:** "How many more apples are there than bananas?"
  3. **Permutation C:** Total sum of data points.
     - **Labels:** `Area.Statistics`, `Scope.QuantityMeasurement`, `Ability.ResultInterpretation`
     - **Parameters:** `{ mode: 'statistics', questionType: 'total-sum', numCategories: 3 }`
     - **Sample question:** "How many fruits are there in total?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `statistics-charts`.
* **UI Layout details:** A card displays a simple picture graph or tally chart with up to 3 columns/rows representing different categories (e.g. Apples, Bananas, Oranges). Each category displays count using simple SVG icons or tick marks. Below the chart, a question prompt is displayed next to an answer input field. Fully responsive grid layout.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement data generation, categories, and question templates in generator code.
- [ ] Add configurations to `permutations.ts`.
- [ ] Create new view directory `src/views/statistics-charts/` and code the HTML/SCSS/TS files.
- [ ] Register the new view.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that all questions (count, difference, total) are mathematically correct.
- [ ] Ensure that total counts do not exceed 20 to align with grade-level math.
- [ ] Check chart item layouts for overlap issues.

---

## 1.G.A.1 - Shape Recognition by Defining Attributes
* **CCSS Text:** Distinguish between defining attributes (e.g., triangles are closed and three-sided) versus non-defining attributes (e.g., color, orientation, overall size); build and draw shapes to possess defining attributes.
* **Ontology Reference:** Matched Areas: `Area.ShapeRecognition`, `Area.GeometricConcepts`, `Area.LinearShapeDrawing`, Scopes: `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Create a new generator module `geometry` to define geometric shapes, attributes, and classification tasks.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Identify shape by defining attributes.
     - **Labels:** `Area.ShapeRecognition`, `Area.GeometricConcepts`, `Scope.VisualGeometry`, `Ability.ConceptClassification`
     - **Parameters:** `{ task: 'attribute-identification', shapeType: 'triangle' }`
     - **Sample question:** "Which shape has 3 straight sides and is closed?"
  2. **Permutation B:** Classify shapes ignoring non-defining attributes.
     - **Labels:** `Area.ShapeRecognition`, `Scope.VisualGeometry`, `Ability.ConceptClassification`
     - **Parameters:** `{ task: 'classify-by-shape', matchShape: 'square' }`
     - **Sample question:** "Find all squares."

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `geometry-shapes`.
* **UI Layout details:** A clean, grid-based card showing 4 candidate shapes rendered as high-quality SVGs. The shapes have randomized colors (red, blue, green), sizes (small, medium, large), and orientations (rotated by 30, 45, 90 degrees). One shape is the correct target matching the defining attribute, while others are distractors (e.g. open shapes or shapes with wrong side count). Checkbox indicators are placed below each shape.

### Subtask 3: Developer Implementation Checklist
- [ ] Create new generator directory `src/generators/geometry/`.
- [ ] Implement `generator.ts` with shape generation and attribute descriptions.
- [ ] Register generator configuration in `permutations.ts`.
- [ ] Create new view directory `src/views/geometry-shapes/` and implement code.
- [ ] Register new generator and view in the dataset orchestration script.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that target shape attributes match the requested type.
- [ ] Validate distractors to ensure they are distinct from the correct shape.
- [ ] Preview SVG scaling and anti-aliasing in Vite.

---

## 1.G.A.2 - Composing 2D and 3D Shapes
* **CCSS Text:** Compose two-dimensional shapes (rectangles, squares, trapezoids, triangles, half-circles, and quarter-circles) or three-dimensional shapes (cubes, right rectangular prisms, right circular cones, and right circular cylinders) to create a composite shape, and compose new shapes from the composite shape.
* **Ontology Reference:** Matched Areas: `Area.TwoDimensionalObjects`, `Area.ThreeDimensionalObjects`, `Area.Rectangle`, `Area.Square`, `Area.Trapezoid`, `Area.Triangle`, `Area.Cube`, `Area.RectangularPrism`, `Area.Cone`, `Area.Cylinder`, Scopes: `Scope.TwoDimensional`, `Scope.ThreeDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the new `geometry` generator module to define spatial composition parameters.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** 2D shape composition (e.g. two triangles to make a rectangle).
     - **Labels:** `Area.TwoDimensionalObjects`, `Area.Triangle`, `Area.Rectangle`, `Scope.TwoDimensional`, `Ability.SpatialImagination`
     - **Parameters:** `{ task: 'compose-2d', compositeShape: 'rectangle', partShape: 'triangle' }`
     - **Sample question:** "Which shapes can join to form this rectangle?"
  2. **Permutation B:** 3D shape block counting.
     - **Labels:** `Area.ThreeDimensionalObjects`, `Area.Cube`, `Area.RectangularPrism`, `Scope.ThreeDimensional`, `Ability.SpatialGeneration`
     - **Parameters:** `{ task: 'compose-3d', countCubes: true }`
     - **Sample question:** "How many small cubes make up this rectangular prism?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `geometry-composition`.
* **UI Layout details:**
  - For 2D: Displays a target shape outline on the left and a grid of potential part shapes on the right. Dotted lines illustrate division lines on candidate pieces.
  - For 3D: Renders a beautiful isometric 3D drawing of stacked cubes forming a composite prism. The student inputs the number of cubes. Responsive canvas.

### Subtask 3: Developer Implementation Checklist
- [ ] Write 2D composition layout definitions in `src/generators/geometry/generator.ts`.
- [ ] Add isometric 3D block-grid calculation formulas to the generator.
- [ ] Register composition permutations in `permutations.ts`.
- [ ] Create `src/views/geometry-composition/` directory and code files.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying that 2D assembly choices mathematically sum to the target shape area, and 3D cube counts match the volume equation.
- [ ] Validate boundaries (e.g. keeping total 3D blocks <= 12 to suit first graders).
- [ ] Check isometric perspective overlap in rendering.

---

## 1.G.A.3 - Partitioning Circles and Rectangles (Halves and Fourths)
* **CCSS Text:** Partition circles and rectangles into two and four equal shares, describe the shares using the words halves, fourths, and quarters, and use the phrases half of, fourth of, and quarter of. Describe the whole as two of, or four of the shares. Understand for these examples that decomposing into more equal shares creates smaller shares.
* **Ontology Reference:** Matched Areas: `Area.Circle`, `Area.Rectangle`, `Area.ProportionSense`, `Area.ProportionAbstraction`, Scopes: `Scope.FractionNumbers`, `Scope.TwoDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the new `geometry` generator module to define shape partitioning rules.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:** Identify partitioned equal shares.
     - **Labels:** `Area.Circle`, `Area.Rectangle`, `Area.ProportionSense`, `Scope.FractionNumbers`, `Ability.ConceptSpecification`
     - **Parameters:** `{ task: 'identify-partition', numShares: [2, 4], checkEquality: true }`
     - **Sample question:** "Which rectangle is cut into equal halves?"
  2. **Permutation B:** Relative share size comparison.
     - **Labels:** `Area.ProportionAbstraction`, `Scope.FractionNumbers`, `Ability.ConceptSpecification`
     - **Parameters:** `{ task: 'compare-share-sizes' }`
     - **Sample question:** "Which share is smaller: a half of a circle or a fourth of a circle?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Propose a new view `geometry-partitions`.
* **UI Layout details:** Displays three SVGs of circles/rectangles. One shape is split into equal halves/fourths, one is split unequally, and one is unsplit. Shaded portions highlight individual shares. The text prompt asks the student to choose the correctly partitioned shape or compare fractions. Completely responsive design.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement partitioning and shading calculation logic in `src/generators/geometry/generator.ts`.
- [ ] Add partitioning permutations to `src/generators/geometry/permutations.ts`.
- [ ] Create `src/views/geometry-partitions/` HTML/SCSS/TS files.
- [ ] Verify views hookup and registration.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying equal partitioning points and coordinates on circle and rectangle elements.
- [ ] Validate boundary limits (only halves and fourths, no other fraction sizes).
- [ ] Check rendering of lines and shaded areas.
