# Grade 2 Curriculum Mapping & Task Backlog

This backlog specifies the problem generators, views, checklists, and validation plans for all Grade 2 leaf standards that are ontologically matched but not yet covered in the dataset (`dataset_covered === false` and `ontology_covered === true`).

---

## 2.OA.A.1 - One- and Two-Step Addition/Subtraction Word Problems within 100
* **CCSS Text:** Use addition and subtraction within 100 to solve one- and two-step word problems involving situations of adding to, taking from, putting together, taking apart, and comparing, with unknowns in all positions, e.g., by using drawings and equations with a symbol for the unknown number to represent the problem.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, `Area.Algebra`, Scopes: `Scope.NumbersSmaller100`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator to handle contextual word problems by adding parameter `mode: 'word-problem'`, `problemType: 'one-step' | 'two-step'`, and `unknownPosition: 'num1' | 'num2' | 'answer'`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (One-step Word Problems):** 
     - **Labels:** `Area.Addition`, `Area.Subtraction`, `Area.Algebra`, `Scope.NumbersSmaller100`, `Scope.IntegersWithoutNegatives`, `Ability.LogicalProcessing`
     - **Parameters:** `{ mode: 'word-problem', problemType: 'one-step', range: [0, 100] }`
     - **Sample Question:** "There are 45 birds on a tree. Some more birds join them. Now there are 82 birds. How many birds joined them?"
  2. **Permutation B (Two-step Word Problems):**
     - **Labels:** `Area.Addition`, `Area.Subtraction`, `Area.Algebra`, `Scope.NumbersSmaller100`, `Scope.IntegersWithoutNegatives`, `Ability.LogicalProcessing`
     - **Parameters:** `{ mode: 'word-problem', problemType: 'two-step', range: [0, 100] }`
     - **Sample Question:** "Mary has 90 stickers. She gives 25 stickers to Tom and 18 stickers to Anna. How many stickers does Mary have left?"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Create a new view `operations-word-problem` or extend `operations-boxes` with support for descriptive text display.
* **UI Layout details:** Display the word problem text in a clear readable block with adjustable font size. Underneath, render a grid layout containing the equation fields `[num1] [operator] [num2] = [answer]` (with the input box corresponding to `unknownPosition`) or a multi-box equation layout for two-step calculations. Include a digital scratchpad panel for drawings. Responsive layout must stack elements on smaller mobile viewports.

### Subtask 3: Developer Implementation Checklist
- [ ] Add word-problem text template database to the generator config.
- [ ] Implement logic to substitute random names and numbers within standard math boundaries.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Implement `operations-word` or extend `operations-boxes` with a `text` view model property.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. sums must not exceed 100, differences must not be negative).
- [ ] Manually preview word problem templates using standard visualizer.

---

## 2.OA.C.3 - Odd and Even Parity up to 20
* **CCSS Text:** Determine whether a group of objects (up to 20) has an odd or even number of members, e.g., by pairing objects or counting them by 2s; write an equation to express an even number as a sum of two equal addends.
* **Ontology Reference:** Matched Areas: `Area.OddsAndEvens`, `Area.Addition`, `Area.DivisibilityRules`, Scopes: `Scope.NumbersSmaller20`, `Scope.QuantityMeasurement`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `counting` generator by adding parameter `mode: 'identify-parity' | 'even-double'`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Parity Identification):**
     - **Labels:** `Area.OddsAndEvens`, `Area.DivisibilityRules`, `Scope.NumbersSmaller20`, `Scope.QuantityMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'identify-parity', maxCount: 20 }`
     - **Sample Question:** "Is the group of 14 stars odd or even? [Odd] [Even]"
  2. **Permutation B (Even Double Equation):**
     - **Labels:** `Area.OddsAndEvens`, `Area.Addition`, `Scope.NumbersSmaller20`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'even-double', maxCount: 20 }`
     - **Sample Question:** "Write an equation showing that 12 is even: 12 = [6] + [6]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `counting-objects` view for Permutation A and extend `operations-boxes` for Permutation B.
* **UI Layout details:** 
  - For Permutation A: Display a collection of icons (up to 20) grouped in pairs with a box outlining each pair, followed by selector buttons for "Odd" and "Even".
  - For Permutation B: Show a horizontal equation template `N = [input] + [input]` with a label prompting for equal numbers. Make the layout responsive by scaling icons to fit small screens.

### Subtask 3: Developer Implementation Checklist
- [ ] Update `counting` generator with `parity` configurations.
- [ ] Add pairings drawing logic to `counting-objects` view.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Implement validation logic checking that both inputs in the double-addition equation are equal and sum to the correct number.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [1, 20]).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.A.1a - Understanding 100 as Ten Tens
* **CCSS Text:** 100 can be thought of as a bundle of ten tens — called a "hundred."
* **Ontology Reference:** Matched Areas: `Area.PlaceValue`, `Area.IntegerNotation`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `writing` generator by adding parameter `mode: 'bundle-ten-tens'`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Visual Grouping):**
     - **Labels:** `Area.PlaceValue`, `Scope.Base10`, `Scope.NumbersSmaller1000`, `Ability.Understanding`
     - **Parameters:** `{ mode: 'bundle-ten-tens', representation: 'visual' }`
     - **Sample Question:** "Look at the 10 rods of ten blocks. They bundle together to make [1] hundred."
  2. **Permutation B (Numerical Equivalence):**
     - **Labels:** `Area.PlaceValue`, `Area.IntegerNotation`, `Scope.Base10`, `Ability.ConceptSpecification`
     - **Parameters:** `{ mode: 'bundle-ten-tens', representation: 'numeric' }`
     - **Sample Question:** "10 tens = [100]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Create a new view `place-value-blocks` or extend `counting-objects` to support Base-10 block visuals.
* **UI Layout details:** Display 10 vertical rods (representing 10 tens). Allow the user to press a button to bundle them into a single hundred-flat grid. Display a text input field below the animation. The interface must dynamically scale blocks to prevent overflow.

### Subtask 3: Developer Implementation Checklist
- [ ] Register new mode `bundle-ten-tens` in the `writing` generator.
- [ ] Create 2D SVG components for Base-10 units, rods, and flats.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Write logic in `place-value-blocks` to animate bundling rods to a flat.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (verify that exactly 10 tens are mapped to 100).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.A.1b - Representations of Multiples of 100 (100–900)
* **CCSS Text:** The numbers 100, 200, 300, 400, 500, 600, 700, 800, 900 refer to one, two, three, four, five, six, seven, eight, or nine hundreds (and 0 tens and 0 ones).
* **Ontology Reference:** Matched Areas: `Area.PlaceValue`, `Area.IntegerNotation`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `writing` generator by adding parameter `mode: 'multiples-of-100'`.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Decomposition):**
     - **Labels:** `Area.PlaceValue`, `Scope.Base10`, `Scope.NumbersSmaller1000`, `Ability.ConceptSpecification`
     - **Parameters:** `{ mode: 'multiples-of-100', direction: 'decomposed' }`
     - **Sample Question:** "700 = [7] hundreds, [0] tens, and [0] ones."
  2. **Permutation B (Recomposition):**
     - **Labels:** `Area.PlaceValue`, `Area.IntegerNotation`, `Scope.Base10`, `Ability.Understanding`
     - **Parameters:** `{ mode: 'multiples-of-100', direction: 'composed' }`
     - **Sample Question:** "4 hundreds, 0 tens, and 0 ones equals what number? [400]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `numbers-write` view.
* **UI Layout details:** Display a question statement with multiple inline text inputs for hundreds, tens, and ones. Ensure the input fields only accept digits and align correctly on mobile layouts.

### Subtask 3: Developer Implementation Checklist
- [ ] Update `writing` generator config with `multiples-of-100` mode.
- [ ] Implement decomposition string parsing in the generator logic.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Bind views to display correct inputs for multi-input fields.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (multiples of 100 between 100 and 900).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.A.2 - Counting and Skip-Counting within 1000
* **CCSS Text:** Count within 1000; skip-count by 5s, 10s, and 100s.
* **Ontology Reference:** Matched Areas: `Area.Numeration`, `Area.PatternRecognition`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `counting` or `ordering` generator to support skip-counting by 5, 10, and 100 up to 1000.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Forward Skip-Counting):**
     - **Labels:** `Area.Numeration`, `Scope.Base10`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'skip-count', interval: 5 | 10 | 100, direction: 'forward' }`
     - **Sample Question:** "Count forward by 5s: 345, 350, 355, [360], [365], [370]"
  2. **Permutation B (Backward Skip-Counting):**
     - **Labels:** `Area.Numeration`, `Scope.Base10`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'skip-count', interval: 5 | 10 | 100, direction: 'backward' }`
     - **Sample Question:** "Count backward by 10s: 820, 810, 800, [790], [780]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `numbers-order` or design/extend `numbers-write` for horizontal sequence display.
* **UI Layout details:** Display a sequence of boxes horizontally. Some boxes are filled, while others contain editable input fields. Add a focus effect to the active input box. The horizontal strip must wrap cleanly on vertical screens.

### Subtask 3: Developer Implementation Checklist
- [ ] Add skip-counting logic (5s, 10s, 100s) to the generator.
- [ ] Ensure boundary checks to prevent numbers exceeding 1000 or dropping below 0.
- [ ] Add new permutations to `permutations.ts` with matching labels.
- [ ] Implement keyboard navigation across input boxes.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (verifying cross-century skip-counting, e.g., 295 -> 300 -> 305).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.A.3 - Reading and Writing Numbers to 1000
* **CCSS Text:** Read and write numbers to 1000 using base-ten numerals, number names, and expanded form.
* **Ontology Reference:** Matched Areas: `Area.IntegerNotation`, `Area.PlaceValue`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`, `Scope.ArabicNumerals`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `writing` generator to support three-digit numbers and expanded form parameters.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Numeral/Name Conversion):**
     - **Labels:** `Area.IntegerNotation`, `Scope.NumbersSmaller1000`, `Scope.ArabicNumerals`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'number-names', direction: 'word-to-num' | 'num-to-word' }`
     - **Sample Question:** "Write 'four hundred sixty-two' as a number: [462]"
  2. **Permutation B (Expanded Form Conversion):**
     - **Labels:** `Area.PlaceValue`, `Scope.NumbersSmaller1000`, `Scope.ArabicNumerals`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'expanded-form', direction: 'num-to-exp' | 'exp-to-num' }`
     - **Sample Question:** "Write 706 in expanded form: [700] + [0] + [6]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `numbers-write` view.
* **UI Layout details:** Display the source text in a large typography card. Render input text boxes or select cards for writing standard numerals or expanded addition symbols. Maintain responsiveness with input fields auto-focusing on display.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement number-to-words parser in TypeScript helper file.
- [ ] Update `writing` generator config to include `number-names` and `expanded-form` modes.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Wire the multi-part input fields in `numbers-write` for expanded format equations.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (expanded form formatting with zeroes, e.g. 503 -> 500 + 0 + 3 or 500 + 3).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.A.4 - Comparing Two Three-Digit Numbers
* **CCSS Text:** Compare two three-digit numbers based on meanings of the hundreds, tens, and ones digits, using >, =, and < symbols to record the results of comparisons.
* **Ontology Reference:** Matched Areas: `Area.NumericComparison`, `Area.PlaceValue`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `comparison` generator to support comparing three-digit numbers.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Standard Comparison):**
     - **Labels:** `Area.NumericComparison`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'compare-three-digit', symbolOnly: true }`
     - **Sample Question:** "Compare the numbers: 345 [ < ] 354"
  2. **Permutation B (Place Value Analysis):**
     - **Labels:** `Area.PlaceValue`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'compare-three-digit', placeValueClue: true }`
     - **Sample Question:** "439 has more [tens] than 429, so 439 > 429."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `numbers-compare` view.
* **UI Layout details:** Render the two numbers side-by-side. Center a clickable bubble that opens a dropdown containing comparison operators (`<`, `=`, `>`). Optimize bubble sizes for comfortable touch-screen targets on mobile.

### Subtask 3: Developer Implementation Checklist
- [ ] Add three-digit limits to the standard `comparison` generator configuration.
- [ ] Implement clue generator logic for place-value comparison.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Configure `numbers-compare` to receive the new data schema.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. testing numbers with similar digits in different positions, like 237 vs 273).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.B.5 - Fluently Adding and Subtracting within 100
* **CCSS Text:** Fluently add and subtract within 100 using strategies based on place value, properties of operations, and/or the relationship between addition and subtraction.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, `Area.PlaceValue`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller100`, `Scope.IntegersWithoutNegatives`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator to handle addition and subtraction within 100, categorizing operations by strategy type.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Fluency Addition):**
     - **Labels:** `Area.Addition`, `Scope.NumbersSmaller100`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     - **Parameters:** `{ operator: 'add', maxVal: 100, regrouping: 'optional' }`
     - **Sample Question:** "36 + 48 = [84]"
  2. **Permutation B (Fluency Subtraction):**
     - **Labels:** `Area.Subtraction`, `Scope.NumbersSmaller100`, `Scope.IntegersWithoutNegatives`, `Ability.ProcedureExecution`
     - **Parameters:** `{ operator: 'subtract', maxVal: 100, regrouping: 'optional' }`
     - **Sample Question:** "72 - 35 = [37]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `operations-boxes` (horizontal layout) and `operations-vertical` (vertical column layout) views.
* **UI Layout details:** Display arithmetic problems with standard grids. For column operations, align digits precisely by place value (tens and ones). The virtual keyboard should display only numbers and clear keys.

### Subtask 3: Developer Implementation Checklist
- [ ] Update `arithmetic` generator logic to support 100-limit constraints.
- [ ] Implement option to force or prevent regrouping in generator parameters.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Ensure vertical view supports carry/borrow placeholders above numbers.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (validate that no sums exceed 100, and no differences yield negative values).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.B.6 - Adding up to Four Two-Digit Numbers
* **CCSS Text:** Add up to four two-digit numbers using strategies based on place value and properties of operations.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.PlaceValue`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator to handle multiple addends (3 or 4 numbers).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Three Addends):**
     - **Labels:** `Area.Addition`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     - **Parameters:** `{ numAddends: 3, digits: 2 }`
     - **Sample Question:** "Add: 23 + 45 + 12 = [80]"
  2. **Permutation B (Four Addends):**
     - **Labels:** `Area.Addition`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     - **Parameters:** `{ numAddends: 4, digits: 2 }`
     - **Sample Question:** "Add: 17 + 25 + 34 + 12 = [88]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `operations-vertical` view.
* **UI Layout details:** Stack the 3 or 4 two-digit numbers vertically, aligning tens and ones columns. Show a single long horizontal sum line with the input field underneath. Draw small carry indicators above the tens column.

### Subtask 3: Developer Implementation Checklist
- [ ] Add multi-addend generation support to the `arithmetic` generator.
- [ ] Implement carry-over logic for sums where units total 20 or more.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Extend `operations-vertical` templates to support arbitrary number of addend rows.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (confirming all addends are strictly two-digit numbers).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.B.7 - Adding/Subtracting within 1000 with Models
* **CCSS Text:** Add and subtract within 1000, using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between addition and subtraction; relate the strategy to a written method. Understand that in adding or subtracting three-digit numbers, one adds or subtracts hundreds and hundreds, tens and tens, ones and ones; and sometimes it is necessary to compose or decompose tens or hundreds.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, `Area.PlaceValue`, `Area.IntegerRegrouping`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator to handle three-digit arithmetic with place value modeling.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Addition with Regrouping):**
     - **Labels:** `Area.Addition`, `Area.IntegerRegrouping`, `Scope.NumbersSmaller1000`, `Scope.VisualNumbers`, `Ability.ProcedureExecution`
     - **Parameters:** `{ operator: 'add', digits: 3, regroupingRequired: true }`
     - **Sample Question:** "348 + 275 = [623]"
  2. **Permutation B (Subtraction with Regrouping):**
     - **Labels:** `Area.Subtraction`, `Area.IntegerRegrouping`, `Scope.NumbersSmaller1000`, `Scope.VisualNumbers`, `Ability.ProcedureExecution`
     - **Parameters:** `{ operator: 'subtract', digits: 3, regroupingRequired: true }`
     - **Sample Question:** "612 - 345 = [267]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `operations-vertical` and design a side-by-side or toggled place-value block display container.
* **UI Layout details:** Display the vertical math equation on one side of the layout. On the other side, render Base-10 block visuals (hundred-flats, ten-rods, one-units) representing each number. Selecting digits in the equation should highlight corresponding block bundles. Make the visual panel scrollable on smaller tablet displays.

### Subtask 3: Developer Implementation Checklist
- [ ] Add 3-digit constraint configuration options to `arithmetic` parameters.
- [ ] Implement specific regrouping type options ('ones-to-tens', 'tens-to-hundreds', 'both').
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Create interactive Base-10 blocks helper inside the view engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (verify that sums/differences do not exceed 999 or go below 100).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.B.8 - Mentally Adding or Subtracting 10 or 100
* **CCSS Text:** Mentally add 10 or 100 to a given number 100–900, and mentally subtract 10 or 100 from a given number 100–900.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, `Area.PlaceValue`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator to support mental +10, -10, +100, -100 operations on three-digit numbers.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Mental Ten Delta):**
     - **Labels:** `Area.Addition`, `Area.Subtraction`, `Area.PlaceValue`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'mental-delta', delta: 10, range: [100, 900] }`
     - **Sample Question:** "What is 10 more than 342? [352]"
  2. **Permutation B (Mental Hundred Delta):**
     - **Labels:** `Area.Addition`, `Area.Subtraction`, `Area.PlaceValue`, `Scope.NumbersSmaller1000`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'mental-delta', delta: 100, range: [100, 900] }`
     - **Sample Question:** "What is 100 less than 706? [606]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `operations-boxes` view.
* **UI Layout details:** Display a simple question sentence in bold text. Follow it with an equation template like `543 + 10 = [input]` or `608 - 100 = [input]`. Keep the visual styling minimal to reinforce that this is a mental math activity.

### Subtask 3: Developer Implementation Checklist
- [ ] Register `mental-delta` mode inside `arithmetic` generator.
- [ ] Write calculation constraints that generate numbers between 100 and 900.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Update tests to verify that delta matches either 10 or 100.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. 100 less than 100, 10 more than 890).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.NBT.B.9 - Explaining Addition and Subtraction Strategies
* **CCSS Text:** Explain why addition and subtraction strategies work, using place value and the properties of operations. (Explanations may be supported by drawings or objects.)
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, `Area.PlaceValue`, `Area.ArithmeticLaws`, Scopes: `Scope.Base10`, `Scope.NumbersSmaller1000`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `arithmetic` generator to generate conceptual explanations and properties questions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Regrouping Explanations):**
     - **Labels:** `Area.PlaceValue`, `Area.IntegerRegrouping`, `Ability.ProcedureUnderstanding`
     - **Parameters:** `{ mode: 'explain-strategy', strategy: 'regrouping' }`
     - **Sample Question:** "When adding 28 + 14, why do we write a 1 above the tens column? [Because 8 + 4 = 12, which is 1 ten and 2 ones]"
  2. **Permutation B (Properties Explanations):**
     - **Labels:** `Area.ArithmeticLaws`, `Ability.ProcedureUnderstanding`
     - **Parameters:** `{ mode: 'explain-strategy', strategy: 'properties' }`
     - **Sample Question:** "Why does 35 + 18 equal 35 + 10 + 8? [Because 18 can be decomposed into 10 + 8, and we add them sequentially]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Create a new view `operations-explanations`.
* **UI Layout details:** Display a mathematical assertion or equation. Below it, show multiple-choice answers or drag-and-drop tiles representing steps of the reasoning path. Ensure target lines are large enough for dragging gestures on mobile screens.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the explanation logic and multiple-choice database to the generator config.
- [ ] Create the view template `operations-explanations.hbs` or `.tsx`.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Wire dragging and sorting logic handlers in the views engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (ensuring wrong choices are plausible but mathematically incorrect).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.MD.A.1 - Measuring Length with Appropriate Tools
* **CCSS Text:** Measure the length of an object by selecting and using appropriate tools such as rulers, yardsticks, meter sticks, and measuring tapes.
* **Ontology Reference:** Matched Areas: `Area.MeasuringObjects`, `Area.Measurement`, Scopes: `Scope.LengthMeasurement`, `Scope.PhysicalRuler`, `Scope.Tapemeter`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `measurement` generator to support virtual tool selection and reading.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Tool Selection):**
     - **Labels:** `Area.Measurement`, `Scope.LengthMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'select-tool' }`
     - **Sample Question:** "Which tool is best to measure the length of a playground? [Measuring tape / Ruler / Yardstick]"
  2. **Permutation B (Ruler Measurement):**
     - **Labels:** `Area.MeasuringObjects`, `Scope.LengthMeasurement`, `Scope.PhysicalRuler`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'measure-object', tool: 'ruler' }`
     - **Sample Question:** "Align the ruler to measure the pencil. How long is the pencil? [8] centimeters."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse and extend the `measure-length` view.
* **UI Layout details:** Renders a virtual object (e.g., pencil, key, crayon) and a draggable ruler overlay. The user can drag the ruler horizontally to align the 0 mark with the edge of the object, then read the value. Standard scales (inches and centimeters) must be visually distinct.

### Subtask 3: Developer Implementation Checklist
- [ ] Update `measurement` generator config to include `select-tool` and `measure-object` modes.
- [ ] Implement draggable alignment logic on the virtual ruler element.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Update CSS styles to ensure high-contrast ticks on the rulers.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. objects lengths must map to exact integer values on the ruler scale).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.MD.A.2 - Measuring Length Twice with Different Units
* **CCSS Text:** Measure the length of an object twice, using length units of different lengths for the two measurements; describe how the two measurements relate to the size of the unit chosen.
* **Ontology Reference:** Matched Areas: `Area.MeasuringObjects`, `Area.Measurement`, Scopes: `Scope.LengthMeasurement`, `Scope.PhysicalRuler`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `measurement` generator to handle dual-unit measurements and comparison logic.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Dual Measurements):**
     - **Labels:** `Area.MeasuringObjects`, `Scope.LengthMeasurement`, `Scope.PhysicalRuler`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'double-measurement', units: ['inches', 'centimeters'] }`
     - **Sample Question:** "This book is [4] inches long. It is also [10] centimeters long."
  2. **Permutation B (Unit size relation):**
     - **Labels:** `Area.Measurement`, `Scope.LengthMeasurement`, `Ability.AnalyticalCapability`
     - **Parameters:** `{ mode: 'unit-comparison' }`
     - **Sample Question:** "Why does it take fewer inches than centimeters to measure a desk? [Because an inch is longer than a centimeter]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Extend `measure-length` view to support multiple rulers.
* **UI Layout details:** Display a virtual object. Directly below it, render two rulers stacked vertically (one marked in inches, the other in centimeters). Render input boxes for both measurements, followed by a multiple-choice question explaining the ratio difference.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `double-measurement` mode to the generator.
- [ ] Implement logic calculating integer conversions or close approximations for inches/cm pairs.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Render multiple SVGs for rulers in the `measure-length` layout.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. check standard unit size ratios like 1 inch = 2.54 cm to ensure reasonable values).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.MD.A.3 - Estimating Lengths in Standard Units
* **CCSS Text:** Estimate lengths using units of inches, feet, centimeters, and meters.
* **Ontology Reference:** Matched Areas: `Area.Estimation`, `Area.NumericApproximation`, `Area.Measurement`, Scopes: `Scope.LengthMeasurement`, `Scope.CentimeterScale`, `Scope.MeterScale`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `measurement` generator to support estimation.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Metric Estimation):**
     - **Labels:** `Area.Estimation`, `Scope.LengthMeasurement`, `Scope.CentimeterScale`, `Scope.MeterScale`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'estimate-length', unitGroup: 'metric' }`
     - **Sample Question:** "Estimate the length of a real toothbrush: [15 centimeters / 15 meters / 2 centimeters]"
  2. **Permutation B (Customary Estimation):**
     - **Labels:** `Area.Estimation`, `Scope.LengthMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'estimate-length', unitGroup: 'customary' }`
     - **Sample Question:** "Estimate the height of a real door: [7 feet / 7 inches / 70 feet]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `measure-length` view by presenting standard visual benchmarks instead of interactive rulers.
* **UI Layout details:** Display an illustration of a common object (e.g., table, door, coin) alongside a visual reference (like a hand or paperclip). Present 3 or 4 large radio option cards for the estimations. The options must scale cleanly on portrait phone screens.

### Subtask 3: Developer Implementation Checklist
- [ ] Create a dictionary of common objects with their typical real-world dimensions and units.
- [ ] Implement selection distractor logic generating plausible, but wildly off-scale incorrect options (e.g. 15 meters for a toothbrush).
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Wire the view to display illustrations mapped to objects.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (confirming distractors contain correct units but unrealistic magnitudes).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.MD.A.4 - Measuring to Compare Lengths
* **CCSS Text:** Measure to determine how much longer one object is than another, expressing the length difference in terms of a standard length unit.
* **Ontology Reference:** Matched Areas: `Area.MeasuringObjects`, `Area.Difference`, `Area.Subtraction`, Scopes: `Scope.LengthMeasurement`, `Scope.PhysicalRuler`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `measurement` generator to handle dual-object comparisons.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Comparing Visual Lengths):**
     - **Labels:** `Area.MeasuringObjects`, `Area.Difference`, `Scope.LengthMeasurement`, `Scope.PhysicalRuler`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'compare-measurements', units: 'cm' | 'in' }`
     - **Sample Question:** "Object A is 9 cm long. Object B is 6 cm long. How much longer is Object A than Object B? [3] cm."
  2. **Permutation B (Direct Measurement Difference):**
     - **Labels:** `Area.MeasuringObjects`, `Area.Subtraction`, `Scope.LengthMeasurement`, `Scope.PhysicalRuler`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'measure-difference' }`
     - **Sample Question:** "Measure both lines below. What is the difference in their lengths? [4] inches."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Extend `measure-length` view.
* **UI Layout details:** Render two lines/objects horizontally parallel to each other. Below them, display a standard ruler. Render input boxes next to labels: `Line A: [ ] cm`, `Line B: [ ] cm`, and `Difference: [ ] cm`. Align the vertical margins to ensure comparisons are easy to read.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `compare-measurements` and `measure-difference` parameters to `measurement` generator.
- [ ] Write math logic that generates two unequal lengths that both fit on the ruler scale.
- [ ] Add new permutations to `permutations.ts` with matching labels.
- [ ] Design the multi-input comparison layout in `measure-length.hbs` or `.tsx`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (differences must always be positive integers).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.MD.B.5 - Word Problems Involving Length within 100
* **CCSS Text:** Use addition and subtraction within 100 to solve word problems involving lengths that are given in the same units, e.g., by using drawings (such as drawings of rulers) and equations with a symbol for the unknown number to represent the problem.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, `Area.LengthCalculation`, Scopes: `Scope.NumbersSmaller100`, `Scope.LengthMeasurement`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `measurement` or `arithmetic` generator to handle length word problems.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Addition Length Word Problems):**
     - **Labels:** `Area.Addition`, `Area.LengthCalculation`, `Scope.NumbersSmaller100`, `Scope.LengthMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'length-word-problems', operator: 'add', maxCount: 100 }`
     - **Sample Question:** "A ribbon is 45 inches long. Sarah cuts another piece that is 20 inches long. What is the total length of the ribbons? [65] inches."
  2. **Permutation B (Subtraction Length Word Problems):**
     - **Labels:** `Area.Subtraction`, `Area.LengthCalculation`, `Scope.NumbersSmaller100`, `Scope.LengthMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'length-word-problems', operator: 'subtract', maxCount: 100 }`
     - **Sample Question:** "A rope is 80 meters long. Farmer John cuts off 35 meters. How much rope is left? [45] meters."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `operations-boxes` view and support a text rendering card.
* **UI Layout details:** Show the story context on a soft-shaded background panel. Render a visual illustration of a ruler or a ribbon matching the quantities described in the text. Underneath, show equation boxes where the user fills in the values.

### Subtask 3: Developer Implementation Checklist
- [ ] Write story templates for length situations (ribbons, paths, ropes) inside the generator configuration.
- [ ] Ensure logic handles unit uniformity (all numbers in a single problem must share the same units: inches, feet, cm, or meters).
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Bind templates in the render engine.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (sums under 100, non-negative differences).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.MD.B.6 - Representing Numbers and Operations on a Number Line
* **CCSS Text:** Represent whole numbers as lengths from 0 on a number line diagram with equally spaced points corresponding to the numbers 0, 1, 2, ..., and represent whole-number sums and differences within 100 on a number line diagram.
* **Ontology Reference:** Matched Areas: `Area.Numeration`, `Area.Addition`, `Area.Subtraction`, Scopes: `Scope.Numberline`, `Scope.NumbersSmaller100`, `Scope.IntegersWithZero`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `measurement` or `arithmetic` generator to output number line representations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Number Line Location):**
     - **Labels:** `Area.Numeration`, `Scope.Numberline`, `Scope.NumbersSmaller100`, `Scope.IntegersWithZero`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'number-line', subMode: 'locate', maxVal: 100 }`
     - **Sample Question:** "What number does point A represent on the number line? [45]"
  2. **Permutation B (Number Line Sums/Differences):**
     - **Labels:** `Area.Addition`, `Area.Subtraction`, `Scope.Numberline`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'number-line', subMode: 'operation', maxVal: 100 }`
     - **Sample Question:** "Which math problem is shown on the number line hops? [Options: 10 + 5 = 15, 10 + 10 = 20]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Create a new view `number-line`.
* **UI Layout details:** Draw an SVG horizontal axis with tick marks, customizable labels, and arrowheads. For operations, render curved hop lines above the number line, detailing steps. Make the SVG scale dynamically on high-resolution screens without loss of clarity.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement number line coordinates helper generating starting offsets and intervals.
- [ ] Update `measurement` generator to add `number-line` mode.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Build SVG rendering paths for hop arcs in `number-line` view.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (numbers must be whole integers within [0, 100]).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.MD.C.7 - Telling Time to the Nearest 5 Minutes
* **CCSS Text:** Tell and write time from analog and digital clocks to the nearest five minutes, using a.m. and p.m.
* **Ontology Reference:** Matched Areas: `Area.MeasuringTime`, `Area.Measurement`, Scopes: `Scope.AnalogClock`, `Scope.DigitalClock`, `Scope.TimeMeasurement`, `Scope.HourIntervals`, `Scope.MinuteIntervals`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `time` generator to support five-minute hand snap points and AM/PM activity contexts.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Analog to Digital):**
     - **Labels:** `Area.MeasuringTime`, `Scope.AnalogClock`, `Scope.TimeMeasurement`, `Scope.MinuteIntervals`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'read-clock', interval: 5 }`
     - **Sample Question:** "What time is shown on the clock? [10]:[35]"
  2. **Permutation B (AM/PM Contexts):**
     - **Labels:** `Area.MeasuringTime`, `Scope.DigitalClock`, `Scope.TimeMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'ampm-activity' }`
     - **Sample Question:** "You eat breakfast at 7:15 in the morning. Is this 7:15 AM or 7:15 PM? [AM]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Reuse `time-analog` view.
* **UI Layout details:** Display a circular clock face. Make hour and minute hands distinct in color and thickness. Show a toggle panel containing "AM" and "PM" choices. Ensure hand placement snaps precisely to 5-minute tick marks.

### Subtask 3: Developer Implementation Checklist
- [ ] Add 5-minute constraints configuration to `time` generator parameters.
- [ ] Implement AM/PM morning/evening activity text prompts.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Wire snap indicators on `time-analog` view components.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (minutes must end in 0 or 5, e.g. 10:00, 10:05, ..., 10:55).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.MD.D.9 - Line Plots for Length Measurement Data
* **CCSS Text:** Generate measurement data by measuring lengths of several objects to the nearest whole unit, or by making repeated measurements of the same object. Show the measurements by making a line plot, where the horizontal scale is marked off in whole-number units.
* **Ontology Reference:** Matched Areas: `Area.MeasuringObjects`, `Area.Statistics`, Scopes: `Scope.LengthMeasurement`, `Scope.PhysicalRuler`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Propose extending `measurement` generator to compile measurement tables and plot them.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Plot Generation):**
     - **Labels:** `Area.MeasuringObjects`, `Area.Statistics`, `Scope.LengthMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'line-plot-draw' }`
     - **Sample Question:** "Plot these pencil measurements on the line plot: 4, 5, 4, 6, 5 inches. Place 'X' marks above the numbers."
  2. **Permutation B (Plot Interpretation):**
     - **Labels:** `Area.Statistics`, `Scope.LengthMeasurement`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'line-plot-read' }`
     - **Sample Question:** "How many pencils are exactly 5 inches long according to the line plot? [2] pencils."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Create a new view `line-plot`.
* **UI Layout details:** Display a table showing raw object measurements on top. Below, render a horizontal axis with numbers. Allow users to click columns above each number to add or remove 'X' mark symbols. Keep spacing uniform and center labels under tick marks.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement line plot dataset generators generating clusters of random lengths.
- [ ] Create interactive template `line-plot.hbs` or `.tsx` that records 'X' click coordinates.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Write validation checking that 'X' count array matches generated data frequency.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (confirming all data values fall within axis min/max).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.MD.D.10 - Picture and Bar Graphs up to 4 Categories
* **CCSS Text:** Draw a picture graph and a bar graph (with single-unit scale) to represent a data set with up to four categories. Solve simple put-together, take-apart, and compare problems using information presented in a bar graph.
* **Ontology Reference:** Matched Areas: `Area.Statistics`, `Area.Addition`, `Area.Subtraction`, Scopes: `Scope.VisualNumbers`, `Scope.NumbersSmaller100`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `counting` or create a new 'statistics' generator module to output structured category counts.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Graph Construction):**
     - **Labels:** `Area.Statistics`, `Scope.VisualNumbers`, `Ability.VisualArticulation`
     - **Parameters:** `{ mode: 'draw-graph', graphType: 'bar' | 'picture', categories: 4 }`
     - **Sample Question:** "Use the table to complete the graph. Apples: 4, Bananas: 3, Cherries: 5."
  2. **Permutation B (Graph Analysis):**
     - **Labels:** `Area.Statistics`, `Area.Addition`, `Area.Subtraction`, `Scope.NumbersSmaller100`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'read-graph', graphType: 'bar' | 'picture' }`
     - **Sample Question:** "How many more cherries are there than bananas? [2]"

### Subtask 2: View & UI Design
* **Reuse or create new view:** Create a new view `data-graphs`.
* **UI Layout details:** 
  - For Bar Graph: Draw a vertical or horizontal chart. Grid lines indicate counts from 0 to 10. Columns are click-adjustable: clicking inside a grid cell fills that column up to the clicked height.
  - For Picture Graph: Render a column array. Clicking a category row adds icons (e.g. apple icon). 
  Make the design responsive by scaling grid size to fits mobile width.

### Subtask 3: Developer Implementation Checklist
- [ ] Write a data compiler generating counts up to 10 for up to 4 categories.
- [ ] Create `data-graphs` template with interactive cell-filling and icon-adding logic.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Wire up correct/incorrect comparison calculations for questions.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (categories limit <= 4, category values <= 10).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.G.A.1 - Recognizing and Drawing Shapes by Attributes
* **CCSS Text:** Recognize and draw shapes having specified attributes, such as a given number of angles or a given number of equal faces. (Sizes are compared directly or visually, not compared by measuring.) Identify triangles, quadrilaterals, pentagons, hexagons, and cubes.
* **Ontology Reference:** Matched Areas: `Area.ShapeRecognition`, `Area.Triangle`, `Area.Quadrilateral`, `Area.Pentagon`, `Area.Hexagon`, `Area.Cube`, Scopes: `Scope.TwoDimensional`, `Scope.ThreeDimensional`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Create a new generator module `geometry` to handle 2D and 3D shape identification and partition properties.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Shape Classification):**
     - **Labels:** `Area.ShapeRecognition`, `Scope.TwoDimensional`, `Scope.VisualGeometry`, `Ability.VisualRecognition`
     - **Parameters:** `{ mode: 'identify-shape', type: '2D' }`
     - **Sample Question:** "Identify the pentagon from the shapes below: [Options showing Triangle, Hexagon, Pentagon]"
  2. **Permutation B (Attribute Identification):**
     - **Labels:** `Area.Cube`, `Scope.ThreeDimensional`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'count-attributes', shape: 'cube' }`
     - **Sample Question:** "How many equal faces does a cube have? [6] faces."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Create a new view `geometry-viewer`.
* **UI Layout details:** Render standard geometry shapes (triangle, square, trapezoid, pentagon, hexagon) using SVGs. For 3D shapes (cubes), draw wireframe perspective lines. Make shapes interactive by highlighting vertices/edges/faces when tapped. Display select buttons on a side menu.

### Subtask 3: Developer Implementation Checklist
- [ ] Create geometry generator files under `src/generators/geometry/`.
- [ ] Define SVG schemas for 2D shapes and 3D wireframe coordinates.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Build interactive HTML templates for shape selection.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (attributes count must map exactly to shape properties).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.G.A.2 - Partitioning Rectangles into Grids
* **CCSS Text:** Partition a rectangle into rows and columns of same-size squares and count to find the total number of them.
* **Ontology Reference:** Matched Areas: `Area.Rectangle`, `Area.Square`, `Area.AreaCalculation`, Scopes: `Scope.TwoDimensional`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Include in the new `geometry` generator module.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Grid Partitioning):**
     - **Labels:** `Area.Rectangle`, `Area.Square`, `Scope.TwoDimensional`, `Ability.SpatialImagination`
     - **Parameters:** `{ mode: 'partition-grid', rows: 2..5, cols: 2..5 }`
     - **Sample Question:** "Divide the rectangle into 3 rows and 4 columns of same-size squares. How many squares did you make? [12]"
  2. **Permutation B (Grid Counting):**
     - **Labels:** `Area.Rectangle`, `Area.AreaCalculation`, `Scope.TwoDimensional`, `Ability.ProcedureExecution`
     - **Parameters:** `{ mode: 'count-partitions', rows: 2..5, cols: 2..5 }`
     - **Sample Question:** "A rectangle is divided into a grid of squares. Count the squares: [8] squares."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Create a new view `fractions-visual`.
* **UI Layout details:** Display an empty rectangle container. Render horizontal and vertical slice buttons. When clicked, slice lines divide the rectangle into rows and columns. Allow tapping squares to color them, tracking count. Center equation prompts dynamically.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `partition-grid` configuration parameters to `geometry` generator.
- [ ] Implement slice drawing calculation grid values inside the view canvas.
- [ ] Add new permutations to `permutations.ts` with matching labels.
- [ ] Wire tap-to-shade handlers on grid cells.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (grid rows/cols must stay between 2 and 5).
- [ ] Manually preview exercises using standard visualizer.

---

## 2.G.A.3 - Partitioning Circles and Rectangles into Shares
* **CCSS Text:** Partition circles and rectangles into two, three, or four equal shares, describe the shares using the words halves, thirds, half of, a third of, etc., and describe the whole as two halves, three thirds, four fourths. Recognize that equal shares of identical wholes need not have the same shape.
* **Ontology Reference:** Matched Areas: `Area.Circle`, `Area.Rectangle`, `Area.FractionNotation`, Scopes: `Scope.FractionNumbers`, `Scope.TwoDimensional`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Include in the new `geometry` generator module.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A (Equal Shares Identification):**
     - **Labels:** `Area.FractionNotation`, `Scope.FractionNumbers`, `Scope.TwoDimensional`, `Ability.ConceptSpecification`
     - **Parameters:** `{ mode: 'equal-shares', shape: 'circle' | 'rectangle' }`
     - **Sample Question:** "Is this circle divided into equal shares? [Yes] [No]"
  2. **Permutation B (Fractional Words):**
     - **Labels:** `Area.Circle`, `Area.FractionNotation`, `Scope.FractionNumbers`, `Ability.ConceptSpecification`
     - **Parameters:** `{ mode: 'fraction-labels', partitionCount: 2 | 3 | 4 }`
     - **Sample Question:** "This circle is divided into 4 equal shares. One share is a [fourth / half / third]."

### Subtask 2: View & UI Design
* **Reuse or create new view:** Extend `geometry-partition` view.
* **UI Layout details:** Display circle or rectangle shapes. Draw thin dividing lines (radial spokes for circle, columns/rows for rectangles). Render clickable shares that fill with color when clicked. Show text selections on the bottom panel.

### Subtask 3: Developer Implementation Checklist
- [ ] Add fraction configurations and labels to `geometry` generator parameters.
- [ ] Implement radial SVG coordinate calculations for circular partitions.
- [ ] Add the new permutations to `permutations.ts` with matching labels.
- [ ] Enable tap shading feedback on vector shapes.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (partitions limited strictly to 2, 3, or 4 equal shares).
- [ ] Manually preview exercises using standard visualizer.
