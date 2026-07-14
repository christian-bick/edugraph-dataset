# Kindergarten Leaf Standards Backlog

This backlog outlines the tasks required to cover all uncovered Kindergarten leaf standards that have ontology coverage but no dataset representation.

## K.CC.A.3 - Write numbers from 0 to 20; represent a count of objects
* **CCSS Text:** Write numbers from 0 to 20. Represent a number of objects with a written numeral 0-20 (with 0 representing a count of no objects).
* **Ontology Reference:** Matched Areas: `Area.DigitNotation`, `Area.ZeroConcept`, `Area.Numeration`, Scopes: `Scope.NumbersSmaller20`, `Scope.ArabicNumerals`, `Scope.IntegersWithZero`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the existing `writing` generator. Add constraints `min: 0`, `max: 20` and support parameters for `mode` (`'stroke'` or `'count-objects'`).
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Numeral Stroke Practice):**
     - Labels: `Area.DigitNotation`, `Scope.ArabicNumerals`, `Scope.NumbersSmaller20`, `Scope.IntegersWithZero`, `Ability.ProcedureExecution`
     - Parameters: `mode: "stroke"`, `number` range `[0, 20]`
     - Sample question: "Write the number 15" (renders dotted tracing boxes and writing guidelines).
  2. **Permutation B (Count and Represent Objects):**
     - Labels: `Area.Numeration`, `Scope.ArabicNumerals`, `Scope.NumbersSmaller20`, `Scope.IntegersWithZero`, `Scope.PhysicalNumbers`, `Ability.ProcedureExecution`
     - Parameters: `mode: "count-objects"`, `number` range `[0, 20]`
     - Sample question: "Count the objects and write the number" (renders N objects, including 0 objects for count 0).

### Subtask 2: View & UI Design
* **Reuse or New View:** Extend `numbers-write` view.
* **UI Layout details:**
  - For `mode: "stroke"`, display the large digit to write with directional tracing arrows in the first box, then two empty boxes. In solution view, the empty boxes are filled with the correct number.
  - For `mode: "count-objects"`, display double ten-frames (to support counts up to 20) with colorful circles. For count 0, show an empty ten-frame or blank space. A label "Count: [ ]" is provided with a blank box, filled in the solution view.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `mode` and number bounds `[0, 20]` to `src/generators/writing/generator.ts`.
- [ ] Add permutations to `src/generators/writing/permutations.ts` using the new parameters.
- [ ] Update `src/views/numbers-write/view.ts` to render double ten-frames for numbers 11-20, and support empty states.
- [ ] Support tracing arrows and dotted numbers in CSS.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/writing/generator.test.ts`.
- [ ] Validate question generation boundary values (especially 0, 10, 11, 20).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.CC.B.4a - One-to-one correspondence when counting objects
* **CCSS Text:** When counting objects, say the number names in the standard order, pairing each object with one and only one number name and each number name with one and only one object.
* **Ontology Reference:** Matched Areas: `Area.Numeration`, Scopes: `Scope.AdditiveCount`, `Scope.PhysicalNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `counting` generator by adding a `oneToOne` correspondence tag and mode.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Linear ordered correspondence):**
     - Labels: `Area.Numeration`, `Scope.AdditiveCount`, `Scope.PhysicalNumbers`, `Scope.NumbersSmaller10`, `Ability.ProcedureExecution`
     - Parameters: `layout: "linear"`, `mode: "one-to-one"`, `count` range `[1, 10]`
     - Sample question: Displays a row of 6 blocks, each paired with consecutive counting numbers 1-6 underneath.
  2. **Permutation B (Scattered correspondence mapping):**
     - Labels: `Area.Numeration`, `Scope.AdditiveCount`, `Scope.PhysicalNumbers`, `Scope.NumbersSmaller20`, `Ability.ProcedureExecution`
     - Parameters: `layout: "scattered"`, `mode: "one-to-one"`, `count` range `[11, 20]`
     - Sample question: Displays scattered apples, each labeled with a counting number badge representing the sequence.

### Subtask 2: View & UI Design
* **Reuse or New View:** Extend `counting-objects` view.
* **UI Layout details:**
  - Objects are placed either in a neat horizontal line or scattered with safe spacing.
  - Below each object, render an empty circle/box placeholder in question view.
  - In solution view, these placeholders are filled with sequential numbers (1, 2, 3... N) to show explicit one-to-one correspondence.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `mode: "one-to-one"` to the `counting` generator config.
- [ ] Update `src/generators/counting/generator.ts` to output index keys for each item.
- [ ] Add permutations to `src/generators/counting/permutations.ts`.
- [ ] Update `src/views/counting-objects/view.ts` to render matching sequence badges when `mode` is `"one-to-one"`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/counting/generator.test.ts`.
- [ ] Validate question generation boundary values (counts [1, 20]).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.CC.B.4b - Cardinality and conservation of number
* **CCSS Text:** Understand that the last number name said tells the number of objects counted. The number of objects is the same regardless of their arrangement or the order in which they were counted.
* **Ontology Reference:** Matched Areas: `Area.Numeration`, `Area.NumericIdentity`, Scopes: `Scope.AdditiveCount`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `counting` generator by adding arrangement comparison parameters.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Cardinality verification):**
     - Labels: `Area.Numeration`, `Scope.AdditiveCount`, `Ability.ProcedureUnderstanding`
     - Parameters: `mode: "cardinality"`, `count` range `[1, 10]`
     - Sample question: "The items are counted: 1, 2, 3, 4, 5. How many are there in total?" (Focuses on understanding that the last number is the answer).
  2. **Permutation B (Conservation of number):**
     - Labels: `Area.Numeration`, `Area.NumericIdentity`, `Scope.AdditiveCount`, `Ability.DirectUnderstanding`
     - Parameters: `mode: "conservation"`, `count` range `[5, 12]`
     - Sample question: Renders Group A (5 dots close together) and Group B (5 dots spaced far apart). "Are there more dots in A, B, or are they the same?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `counting-conservation`.
* **UI Layout details:**
  - For Cardinality: Show items with numbers 1, 2... N overlaid. Highlights the final item/number.
  - For Conservation: Show two rows. Row 1 has N items closely packed; Row 2 has N items widely spaced. Underneath, show three buttons: "Group A", "Group B", "They are the same". In solution view, highlight "They are the same".

### Subtask 3: Developer Implementation Checklist
- [ ] Add `mode: "cardinality"` and `mode: "conservation"` to the `counting` generator config.
- [ ] Implement layout distribution logic in `src/generators/counting/generator.ts`.
- [ ] Add permutations to `src/generators/counting/permutations.ts`.
- [ ] Create `src/views/counting-conservation/` (HTML, SCSS, TS) to render two-row spatial comparisons.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/counting/generator.test.ts`.
- [ ] Validate question generation boundary values (ensure Row 1 and Row 2 have identical counts).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.CC.B.5 - Count to tell "how many?" up to 20 objects
* **CCSS Text:** Count to answer “how many?” questions about as many as 20 things arranged in a line, a rectangular array, or a circle, or as many as 10 things in a scattered configuration; given a number from 1–20, count out that many objects.
* **Ontology Reference:** Matched Areas: `Area.Numeration`, Scopes: `Scope.NumbersSmaller20`, `Scope.PhysicalNumbers`, `Scope.AdditiveCount`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `counting` generator.
* **Competency Breakdowns (3 combinations):**
  1. **Permutation A (Structured arrangements up to 20):**
     - Labels: `Area.Numeration`, `Scope.NumbersSmaller20`, `Scope.PhysicalNumbers`, `Scope.AdditiveCount`, `Ability.ProcedureExecution`
     - Parameters: `mode: "how-many"`, `count` range `[1, 20]`, `arrangement: "line" | "array" | "circle"`
     - Sample question: 18 circles arranged in a circular ring. "How many circles are there?"
  2. **Permutation B (Scattered arrangement up to 10):**
     - Labels: `Area.Numeration`, `Scope.NumbersSmaller10`, `Scope.PhysicalNumbers`, `Scope.AdditiveCount`, `Ability.ProcedureExecution`
     - Parameters: `mode: "how-many"`, `count` range `[1, 10]`, `arrangement: "scattered"`
     - Sample question: 8 stars scattered randomly. "How many stars are there?"
  3. **Permutation C (Count out subset):**
     - Labels: `Area.Numeration`, `Scope.NumbersSmaller20`, `Scope.PhysicalNumbers`, `Scope.AdditiveCount`, `Ability.ProcedureExecution`
     - Parameters: `mode: "count-out"`, `count` range `[1, 20]`, `totalCount` range `[count, 20]`
     - Sample question: "Color 7 apples out of 10." (Renders 10 grey apples; in solution view, 7 are colored red).

### Subtask 2: View & UI Design
* **Reuse or New View:** Extend `counting-objects` view.
* **UI Layout details:**
  - For circular layout, place items using polar coordinates (`cos(θ)`, `sin(θ)`) relative to a center point.
  - For scattered layout, generate coordinate pairs with a distance check (`dist > minDistance`) to prevent visual overlap.
  - For "count-out" mode, render checkboxes or outline boxes. In solution view, exactly `count` items are checked/colored.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `arrangement` and `mode: "how-many" | "count-out"` parameters to the generator config.
- [ ] Implement polar coordinates and scattered collision avoidance logic in `src/views/counting-objects/view.ts`.
- [ ] Add the permutations to `src/generators/counting/permutations.ts`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/counting/generator.test.ts`.
- [ ] Validate question generation boundary values (counts up to 20, scattered up to 10).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.CC.C.6 - Compare objects in two groups up to 10
* **CCSS Text:** Identify whether the number of objects in one group is greater than, less than, or equal to the number of objects in another group, e.g., by using matching and counting strategies (include groups with up to ten objects).
* **Ontology Reference:** Matched Areas: `Area.NumericComparison`, `Area.SetComparison`, Scopes: `Scope.NumbersSmaller10`, `Scope.PhysicalNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `comparison` generator.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Compare counts via matching/one-to-one lines):**
     - Labels: `Area.NumericComparison`, `Area.SetComparison`, `Scope.NumbersSmaller10`, `Scope.PhysicalNumbers`, `Ability.ProcedureExecution`
     - Parameters: `mode: "matching"`, `group1` range `[1, 10]`, `group2` range `[1, 10]`
     - Sample question: A group of 5 triangles and 4 circles. Question: "Are there more triangles or circles?" (Draws matching lines between shapes).
  2. **Permutation B (Identify greater/less/equal by counting):**
     - Labels: `Area.NumericComparison`, `Scope.NumbersSmaller10`, `Scope.PhysicalNumbers`, `Ability.ProcedureExecution`
     - Parameters: `mode: "count-compare"`, `comparisonType: "greater" | "less" | "equal"`, `group1` range `[1, 10]`, `group2` range `[1, 10]`
     - Sample question: Group A has 8 apples. Group B has 6 apples. "Which group has fewer?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `numbers-compare-groups`.
* **UI Layout details:**
  - Group 1 on the left side, Group 2 on the right side.
  - In `matching` mode, render SVGs connecting elements of Group 1 to Group 2. Unmatched items in the larger group are highlighted in a red box in the solution.
  - Below, provide three choices: "Group A is more", "Group B is more", "They are equal".

### Subtask 3: Developer Implementation Checklist
- [ ] Add Group 1 and Group 2 counts to `src/generators/comparison/generator.ts`.
- [ ] Implement permutations in `src/generators/comparison/permutations.ts`.
- [ ] Create `src/views/numbers-compare-groups/` (HTML, SCSS, TS) to render side-by-side collections.
- [ ] Add SVG-connector rendering logic using layout coordinates.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/comparison/generator.test.ts`.
- [ ] Validate question generation boundary values (counts strictly <= 10).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.OA.A.1 - Represent addition and subtraction with objects, fingers, drawings, equations
* **CCSS Text:** Represent addition and subtraction with objects, fingers, mental images, drawings (Drawings need not show details, but should show the mathematics in the problem. (This applies wherever drawings are mentioned in the Standards.)), sounds (e.g., claps), acting out situations, verbal explanations, expressions, or equations.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, Scopes: `Scope.PhysicalNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Addition representation with distinct object groups):**
     - Labels: `Area.Addition`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`, `Ability.Visualization`
     - Parameters: `operation: "addition"`, `term1` range `[1, 9]`, `term2` range `[1, 9]`, `sum` <= 10
     - Sample question: 3 blue circles and 5 yellow circles. Write the matching addition: 3 + 5 = 8.
  2. **Permutation B (Subtraction representation with crossed-out objects):**
     - Labels: `Area.Subtraction`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`, `Ability.Visualization`
     - Parameters: `operation: "subtraction"`, `minuend` range `[1, 10]`, `subtrahend` range `[1, minuend]`, `difference` range `[0, 9]`
     - Sample question: 7 apples are shown, 4 are crossed out with a red X. Write the matching subtraction: 7 - 4 = 3.

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `operations-representation`.
* **UI Layout details:**
  - Render a grid of objects. For addition, render `term1` in color A, `term2` in color B.
  - For subtraction, render `minuend` items, placing a clear red "X" overlay on the last `subtrahend` items.
  - Render input boxes: `[ ] + [ ] = [ ]` (or subtraction). Filled in solution view.

### Subtask 3: Developer Implementation Checklist
- [ ] Add support for generating addition/subtraction operands with visual tags to `src/generators/arithmetic/generator.ts`.
- [ ] Add permutations to `src/generators/arithmetic/permutations.ts`.
- [ ] Create `src/views/operations-representation/` HTML, SCSS, and TS files.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/arithmetic/generator.test.ts`.
- [ ] Validate question generation boundary values (totals strictly <= 10).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.OA.A.2 - Solve addition/subtraction word problems within 10
* **CCSS Text:** Solve addition and subtraction word problems, and add and subtract within 10, e.g., by using objects or drawings to represent the problem.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Subtraction`, Scopes: `Scope.NumbersSmaller10`, `Scope.IntegersWithoutNegatives`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator. Add a template system for early-grade word problems.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Word problems with visual aid - Addition):**
     - Labels: `Area.Addition`, `Scope.NumbersSmaller10`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`, `Ability.ProcedureExecution`
     - Parameters: `mode: "word-problem"`, `operation: "addition"`, `sum` <= 10
     - Sample question: "Maya has 5 stickers. She gets 3 more. How many does she have now?" (Renders 5 + 3 stickers).
  2. **Permutation B (Word problems with visual aid - Subtraction):**
     - Labels: `Area.Subtraction`, `Scope.NumbersSmaller10`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`, `Ability.ProcedureExecution`
     - Parameters: `mode: "word-problem"`, `operation: "subtraction"`, `minuend` <= 10
     - Sample question: "There were 8 birds. 3 fly away. How many birds are left?" (Renders 8 birds, 3 crossed out).

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `operations-representation` view but add a text panel.
* **UI Layout details:**
  - Top section: Large text display of the word problem scenario.
  - Middle section: Visual object representations (added or crossed out).
  - Bottom section: Equation line or single box: "Total: [ ]" (filled in solution view).

### Subtask 3: Developer Implementation Checklist
- [ ] Implement a string template system with variable names/nouns in `src/generators/arithmetic/generator.ts`.
- [ ] Define permutations in `src/generators/arithmetic/permutations.ts`.
- [ ] Update `src/views/operations-representation/` to display text scenarios dynamically from problem data.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/arithmetic/generator.test.ts`.
- [ ] Validate question generation boundary values (operands and results strictly within `[0, 10]`).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.OA.A.3 - Decompose numbers less than or equal to 10
* **CCSS Text:** Decompose numbers less than or equal to 10 into pairs in more than one way, e.g., by using objects or drawings, and record each decomposition by a drawing or equation (e.g., 5 = 2 + 3 and 5 = 4 + 1).
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Sum`, Scopes: `Scope.NumbersSmaller10`, `Scope.IntegersWithoutNegatives`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator. Add decomposition mode.
* **Competency Breakdowns (1 combination):**
  1. **Permutation A (Decompose target N into distinct pairs):**
     - Labels: `Area.Addition`, `Area.Sum`, `Scope.NumbersSmaller10`, `Scope.PhysicalNumbers`, `Ability.ProcedureExecution`
     - Parameters: `mode: "decompose"`, `targetNumber` range `[3, 10]`
     - Sample question: "Decompose 6 in two different ways." (Outputs stub with target: 6, pair1: [2, 4], pair2: [1, 5]).

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `operations-decompose`.
* **UI Layout details:**
  - Display the target number (e.g. 6) in a top circle.
  - Below, draw two split paths. Path 1 shows 6 circles split into two colors (e.g., 2 red, 4 yellow). Path 2 shows 6 circles split into (1 red, 5 yellow).
  - Provide fill-in equation blanks: `6 = [ ] + [ ]` and `6 = [ ] + [ ]`.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `decompose` mode to `src/generators/arithmetic/generator.ts`.
- [ ] Generate two mathematically unique splits for a target number.
- [ ] Add permutations to `src/generators/arithmetic/permutations.ts`.
- [ ] Create `src/views/operations-decompose/` HTML, SCSS, and TS files.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/arithmetic/generator.test.ts`.
- [ ] Validate question generation boundary values (ensure target is <= 10 and splits are unique).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.OA.A.4 - Find the number that makes 10 when added to a given number (1-9)
* **CCSS Text:** For any number from 1 to 9, find the number that makes 10 when added to the given number, e.g., by using objects or drawings, and record the answer with a drawing or equation.
* **Ontology Reference:** Matched Areas: `Area.Addition`, `Area.Sum`, Scopes: `Scope.NumbersSmaller10`, `Scope.IntegersWithoutNegatives`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator. Add a `make-ten` missing addend mode.
* **Competency Breakdowns (1 combination):**
  1. **Permutation A (Ten-frame missing addend to make 10):**
     - Labels: `Area.Addition`, `Area.Sum`, `Scope.NumbersSmaller10`, `Scope.PhysicalNumbers`, `Ability.ProcedureExecution`
     - Parameters: `mode: "make-ten"`, `givenNumber` range `[1, 9]`, `missingNumber` is `10 - givenNumber`
     - Sample question: 6 dots are in a ten-frame. How many more do you need to make 10?

### Subtask 2: View & UI Design
* **Reuse or New View:** Reuse `numbers-write` ten-frame visualizer or create a focused ten-frame card.
* **UI Layout details:**
  - Render a 2x5 grid (ten-frame).
  - Fill `givenNumber` boxes with blue dots. The other boxes are empty.
  - In solution view, fill the remaining boxes with red dots.
  - Question text: `givenNumber + [ ] = 10`.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement `make-ten` mode inside `src/generators/arithmetic/generator.ts`.
- [ ] Add the permutations to `src/generators/arithmetic/permutations.ts`.
- [ ] Support double-color rendering in the ten-frame component in `src/views/numbers-write/view.ts`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/arithmetic/generator.test.ts`.
- [ ] Validate question generation boundary values (givenNumber between 1 and 9, sum always equals 10).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.NBT.A.1 - Compose and decompose numbers 11-19 into ten ones and further ones
* **CCSS Text:** Compose and decompose numbers from 11 to 19 into ten ones and some further ones, e.g., by using objects or drawings, and record each composition or decomposition by a drawing or equation (e.g., 18 = 10 + 8); understand that these numbers are composed of ten ones and one, two, three, four, five, six, seven, eight, or nine ones.
* **Ontology Reference:** Matched Areas: `Area.PlaceValue`, `Area.Addition`, `Area.Numeration`, Scopes: `Scope.NumbersSmaller20`, `Scope.NumbersLarger10`, `Scope.IntegersWithoutNegatives`, `Scope.PhysicalNumbers`, `Scope.VisualNumbers`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `arithmetic` generator. Add `mode: "place-value-teen"`.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Compose 10 + N into Teen Number):**
     - Labels: `Area.PlaceValue`, `Area.Addition`, `Scope.NumbersSmaller20`, `Scope.NumbersLarger10`, `Scope.PhysicalNumbers`, `Ability.ProcedureExecution`
     - Parameters: `mode: "compose-teen"`, `ones` range `[1, 9]`, `target` is `10 + ones`
     - Sample question: 10 + 4 = [ ]. (Renders 1 full ten-frame and 4 separate counters).
  2. **Permutation B (Decompose Teen Number into 10 + N):**
     - Labels: `Area.PlaceValue`, `Area.Numeration`, `Scope.NumbersSmaller20`, `Scope.NumbersLarger10`, `Scope.PhysicalNumbers`, `Ability.DirectUnderstanding`
     - Parameters: `mode: "decompose-teen"`, `target` range `[11, 19]`, `ones` is `target - 10`
     - Sample question: 17 = 10 + [ ].

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `numbers-place-value`.
* **UI Layout details:**
  - Render one full ten-frame (10 red dots) and a second ten-frame containing `ones` yellow dots.
  - Below, render the equation: `target = 10 + [ ]` (or `10 + [ ] = target`), leaving the appropriate box empty.
  - Fill the blank box in solution view.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `compose-teen` and `decompose-teen` to `src/generators/arithmetic/generator.ts`.
- [ ] Add configurations to `src/generators/arithmetic/permutations.ts`.
- [ ] Create `src/views/numbers-place-value/` (HTML, SCSS, TS) to render place value blocks or double ten-frames.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/arithmetic/generator.test.ts`.
- [ ] Validate question generation boundary values (targets strictly in `[11, 19]`).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.MD.A.1 - Describe measurable attributes of objects (length, weight)
* **CCSS Text:** Describe measurable attributes of objects, such as length or weight. Describe several measurable attributes of a single object.
* **Ontology Reference:** Matched Areas: `Area.Measurement`, `Area.MeasuringObjects`, Scopes: `Scope.LengthMeasurement`, `Scope.WeightMeasurement`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Identify length/height attributes):**
     - Labels: `Area.Measurement`, `Area.MeasuringObjects`, `Scope.LengthMeasurement`, `Ability.ConceptSpecification`
     - Parameters: `mode: "attribute-type"`, `attribute: "length" | "height"`
     - Sample question: A drawing of a stick. "Which arrow measures how long the stick is?"
  2. **Permutation B (Identify weight attributes):**
     - Labels: `Area.Measurement`, `Area.MeasuringObjects`, `Scope.WeightMeasurement`, `Ability.ConceptSpecification`
     - Parameters: `mode: "attribute-type"`, `attribute: "weight"`
     - Sample question: An apple on a scale. "What are we measuring with this scale?" (options: Length, Weight).

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `measure-attributes`.
* **UI Layout details:**
  - Render simple SVG objects (e.g., a pencil with horizontal measuring line, a tree with vertical height line, or a box sitting on a dial scale).
  - Multiple choice buttons below.
  - In solution view, highlight the correct choice in green.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `attribute-type` mode to `src/generators/measurement/generator.ts`.
- [ ] Define permutations in `src/generators/measurement/permutations.ts`.
- [ ] Create `src/views/measure-attributes/` HTML, SCSS, and TS.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/measurement/generator.test.ts`.
- [ ] Validate question generation boundary values (correct key maps to correct attribute string).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.MD.A.2 - Directly compare two objects with a common measurable attribute
* **CCSS Text:** Directly compare two objects with a measurable attribute in common, to see which object has “more of”/“less of” the attribute, and describe the difference. For example, directly compare the heights of two children and describe one child as taller/shorter.
* **Ontology Reference:** Matched Areas: `Area.Measurement`, `Area.MeasuringObjects`, `Area.Difference`, Scopes: `Scope.LengthMeasurement`, `Scope.WeightMeasurement`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `measurement` generator.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Direct length comparison):**
     - Labels: `Area.Measurement`, `Area.MeasuringObjects`, `Area.Difference`, `Scope.LengthMeasurement`, `Ability.ProcedureExecution`
     - Parameters: `mode: "direct-compare"`, `attribute: "length"`, `relation: "longer" | "shorter"`
     - Sample question: Renders two ribbons of different lengths aligned at the left margin. "Which ribbon is longer?"
  2. **Permutation B (Direct weight comparison):**
     - Labels: `Area.Measurement`, `Area.MeasuringObjects`, `Area.Difference`, `Scope.WeightMeasurement`, `Ability.ProcedureExecution`
     - Parameters: `mode: "direct-compare"`, `attribute: "weight"`, `relation: "heavier" | "lighter"`
     - Sample question: Renders a balance scale tilted right (a ball on the left, a block on the right). "Which item is lighter?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `measure-compare`.
* **UI Layout details:**
  - Length: Render two horizontal SVGs aligned at `x = 10%`.
  - Weight: Render a balance scale tilted left or right based on relative weights.
  - Multi-choice buttons: "Item A" or "Item B". Correct option highlighted in solution view.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement `direct-compare` logic in `src/generators/measurement/generator.ts`.
- [ ] Add the comparative configurations in `src/generators/measurement/permutations.ts`.
- [ ] Create `src/views/measure-compare/` HTML, SCSS, and TS.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/measurement/generator.test.ts`.
- [ ] Validate question generation boundary values (ensure lengths and scale tilts match the generated relation).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.MD.B.3 - Classify objects, count them, and sort categories by count
* **CCSS Text:** Classify objects into given categories; count the numbers of objects in each category and sort the categories by count. (Limit category counts to be less than or equal to 10.)
* **Ontology Reference:** Matched Areas: `Area.ObjectSorting`, `Area.CollectionSense`, `Area.Numeration`, `Area.NumericOrder`, Scopes: `Scope.NumbersSmaller10`, `Scope.QuantityMeasurement`, `Scope.AdditiveCount`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `counting` generator by adding category classification parameters.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Classify and Count):**
     - Labels: `Area.ObjectSorting`, `Area.CollectionSense`, `Area.Numeration`, `Scope.NumbersSmaller10`, `Ability.ConceptClassification`
     - Parameters: `mode: "classify-count"`, `types: ["color", "shape"]`
     - Sample question: A mix of red apples, green apples, and yellow bananas. "How many apples are there? How many bananas are there?"
  2. **Permutation B (Sort classified categories):**
     - Labels: `Area.ObjectSorting`, `Area.NumericOrder`, `Scope.NumbersSmaller10`, `Ability.ProcedureExecution`
     - Parameters: `mode: "classify-sort"`, `relation: "most" | "least"`
     - Sample question: After classifying 4 circles, 6 squares, and 3 triangles. "Which shape has the least number of items?"

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `sorting-classify`.
* **UI Layout details:**
  - Render a main box containing a mixed collection of simple stylized shapes (e.g. circles, triangles, stars in different colors).
  - Below, show a table or category cards with blank spaces: "Shapes: [ ]", "Stars: [ ]".
  - In solution view, fill in the correct counts.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `classify-count` and `classify-sort` modes to `src/generators/counting/generator.ts`.
- [ ] Add permutations to `src/generators/counting/permutations.ts`.
- [ ] Create `src/views/sorting-classify/` (HTML, SCSS, TS).

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/counting/generator.test.ts`.
- [ ] Validate question generation boundary values (counts strictly <= 10).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.G.A.1 - Describe objects in the environment using shape names and relative positions
* **CCSS Text:** Describe objects in the environment using names of shapes, and describe the relative positions of these objects using terms such as above, below, beside, in front of, behind, and next to.
* **Ontology Reference:** Matched Areas: `Area.ShapeRecognition`, `Area.PositionalRelations`, `Area.GeometricRelations`, Scopes: `Scope.VisualGeometry`, `Scope.PhysicalGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Create a new generator module `geometry` to handle shape properties, dimensions, and positions.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Identify relative positions):**
     - Labels: `Area.PositionalRelations`, `Area.GeometricRelations`, `Scope.VisualGeometry`, `Ability.ConceptSpecification`
     - Parameters: `mode: "position"`, `relation: "above" | "below" | "beside" | "nextTo"`
     - Sample question: A ball next to a box. "Where is the ball?" (options: Above the box, Next to the box).
  2. **Permutation B (Environmental shapes and positions):**
     - Labels: `Area.ShapeRecognition`, `Area.PositionalRelations`, `Scope.VisualGeometry`, `Ability.ConceptSpecification`
     - Parameters: `mode: "env-shapes"`, `target: "clock" | "window" | "table"`
     - Sample question: A circular clock on the wall above a rectangular desk. "What shape is the clock above the desk?" (options: Circle, Triangle).

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `geometry-positions`.
* **UI Layout details:**
  - Render simple, high-contrast SVG scenes representing an indoor environment (e.g. desk, chair, wall clock, window, floor ball).
  - Highlight key objects. Text prompt: "Where is the ball?"
  - In solution view, circle the correct option in green.

### Subtask 3: Developer Implementation Checklist
- [ ] Create the new generator module in `src/generators/geometry/generator.ts`.
- [ ] Add positional parameters to permutations configuration in `src/generators/geometry/permutations.ts`.
- [ ] Create `src/views/geometry-positions/` HTML, SCSS, and TS.
- [ ] Register `geometry` generator in dynamic imports of `generate-dataset.ts`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/geometry/generator.test.ts`.
- [ ] Validate question generation boundary values (ensure coordinates match spatial relations).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.G.A.2 - Correctly name shapes regardless of their orientations or overall size
* **CCSS Text:** Correctly name shapes regardless of their orientations or overall size.
* **Ontology Reference:** Matched Areas: `Area.ShapeRecognition`, `Area.ShapeIdentity`, `Area.ShapeRotation`, `Area.ShapeResizing`, Scopes: `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the new `geometry` generator.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Name 2D shapes with size/rotation variations):**
     - Labels: `Area.ShapeRecognition`, `Area.ShapeIdentity`, `Area.ShapeRotation`, `Area.ShapeResizing`, `Scope.VisualGeometry`, `Ability.VisualRecognition`
     - Parameters: `mode: "name-2d"`, `shape: "square" | "circle" | "triangle" | "rectangle" | "hexagon"`, `rotation` range `[0, 360]`, `scale` range `[0.5, 1.5]`
     - Sample question: Renders a tilted triangle. "What shape is this?" (options: Triangle, Rectangle, Square).
  2. **Permutation B (Name 3D shapes with perspective/size variations):**
     - Labels: `Area.ShapeRecognition`, `Area.ShapeIdentity`, `Area.ShapeRotation`, `Area.ShapeResizing`, `Scope.VisualGeometry`, `Ability.VisualRecognition`
     - Parameters: `mode: "name-3d"`, `shape: "cube" | "cone" | "cylinder" | "sphere"`, `rotation` range `[0, 360]`, `scale` range `[0.5, 1.5]`
     - Sample question: Renders a cylinder tilted sideways. "What shape is this?" (options: Cylinder, Sphere, Cone).

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `geometry-shapes-name`.
* **UI Layout details:**
  - Center a single SVG shape. Apply rotation (`transform: rotate(Xdeg)`) and scale transformation in CSS.
  - Render 3D shapes using isometric projections or 3D shading techniques.
  - Multi-choice buttons. Correct button is filled in solution view.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement `name-2d` and `name-3d` modes in `src/generators/geometry/generator.ts`.
- [ ] Add the shape configurations to `src/generators/geometry/permutations.ts`.
- [ ] Create `src/views/geometry-shapes-name/` HTML, SCSS, and TS.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/geometry/generator.test.ts`.
- [ ] Validate question generation boundary values (rotation in degrees `[0, 360]`, scale within safe boundaries).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.G.A.3 - Identify shapes as two-dimensional (lying in a plane, “flat”) or three-dimensional (“solid”)
* **CCSS Text:** Identify shapes as two-dimensional (lying in a plane, “flat”) or three-dimensional (“solid”).
* **Ontology Reference:** Matched Areas: `Area.ShapeRecognition`, Scopes: `Scope.TwoDimensional`, `Scope.ThreeDimensional`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the `geometry` generator.
* **Competency Breakdowns (1 combination):**
  1. **Permutation A (Identify flat vs solid shapes):**
     - Labels: `Area.ShapeRecognition`, `Scope.TwoDimensional`, `Scope.ThreeDimensional`, `Scope.VisualGeometry`, `Ability.ConceptClassification`
     - Parameters: `mode: "classify-dim"`, `shapeType: "2d" | "3d"`
     - Sample question: Renders a cube. "Is this shape flat (2D) or solid (3D)?" (options: Flat, Solid).

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `geometry-dimension`.
* **UI Layout details:**
  - Center a clean SVG representing the shape.
  - Display question text: "Is this shape flat (two-dimensional) or solid (three-dimensional)?"
  - Two buttons: "Flat (2D)" and "Solid (3D)". Highlight correct option in solution view.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `classify-dim` mode to `src/generators/geometry/generator.ts`.
- [ ] Add configurations to `src/generators/geometry/permutations.ts`.
- [ ] Create `src/views/geometry-dimension/` (HTML, SCSS, TS).

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/geometry/generator.test.ts`.
- [ ] Validate question generation boundary values (ensure 2D shapes are labeled as Flat and 3D shapes as Solid).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.G.B.4 - Analyze and compare two- and three-dimensional shapes
* **CCSS Text:** Analyze and compare two- and three-dimensional shapes, in different sizes and orientations, using informal language to describe their similarities, differences, parts (e.g., number of sides and vertices/“corners”) and other attributes (e.g., having sides of equal length).
* **Ontology Reference:** Matched Areas: `Area.ShapeRecognition`, `Area.ShapeEquivalenceRelations`, `Area.GeometricRelations`, Scopes: `Scope.TwoDimensional`, `Scope.ThreeDimensional`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `geometry` generator.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Compare counts of parts - sides/corners):**
     - Labels: `Area.ShapeRecognition`, `Area.ShapeEquivalenceRelations`, `Area.GeometricRelations`, `Scope.TwoDimensional`, `Ability.ConceptSpecification`
     - Parameters: `mode: "compare-attributes"`, `attribute: "sides" | "corners"`, `shape1: string`, `shape2: string`
     - Sample question: Renders a triangle and a rectangle. "Which shape has more corners?"
  2. **Permutation B (Identify attributes - roll or stack):**
     - Labels: `Area.ShapeRecognition`, `Area.ShapeEquivalenceRelations`, `Scope.TwoDimensional`, `Scope.ThreeDimensional`, `Ability.ConceptSpecification`
     - Parameters: `mode: "same-attribute"`, `attribute: "can-roll" | "can-stack" | "flat-faces"`
     - Sample question: Renders a sphere, a cube, and a cone. "Which of these shapes has no flat faces?" (options: Sphere, Cube, Cone).

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `geometry-compare-shapes`.
* **UI Layout details:**
  - Render multiple shapes side-by-side.
  - Use visual highlight dots on the vertices/sides to assist the user.
  - Multi-choice layout. Correct choice outlined in green in solution view.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement comparative attribute math in `src/generators/geometry/generator.ts`.
- [ ] Define permutations in `src/generators/geometry/permutations.ts`.
- [ ] Create `src/views/geometry-compare-shapes/` (HTML, SCSS, TS).

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/geometry/generator.test.ts`.
- [ ] Validate question generation boundary values (verify correct counts of vertices and sides for standard shapes).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.G.B.5 - Model shapes in the world (build/draw shapes)
* **CCSS Text:** Model shapes in the world by building shapes from components (e.g., sticks and clay balls) and drawing shapes.
* **Ontology Reference:** Matched Areas: `Area.SpatialModelling`, `Area.LinearShapeDrawing`, `Area.CircularShapeDrawing`, Scopes: `Scope.PhysicalGeometry`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `geometry` generator.
* **Competency Breakdowns (2 combinations):**
  1. **Permutation A (Model shape components):**
     - Labels: `Area.SpatialModelling`, `Scope.PhysicalGeometry`, `Ability.SpatialGeneration`
     - Parameters: `mode: "build-shape"`, `target: "triangle" | "square" | "rectangle"`
     - Sample question: "To build a triangle, how many sticks (sides) and clay balls (corners) do you need?" (options: 3 sticks, 3 balls).
  2. **Permutation B (Trace/Draw linear or circular shapes):**
     - Labels: `Area.LinearShapeDrawing`, `Area.CircularShapeDrawing`, `Scope.VisualGeometry`, `Ability.SpatialGeneration`
     - Parameters: `mode: "draw-shape"`, `target: "circle" | "triangle" | "square"`
     - Sample question: "Trace the circle." (Renders a dashed circle).

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `geometry-model-shapes`.
* **UI Layout details:**
  - For `build-shape` mode, show drawings of sticks and balls. Ask: "Sticks needed: [ ]", "Balls needed: [ ]" (filled in solution view).
  - For `draw-shape` mode, display the target shape using a dotted outline. In solution view, overlay a solid red line tracing the dots.

### Subtask 3: Developer Implementation Checklist
- [ ] Add `build-shape` and `draw-shape` to `src/generators/geometry/generator.ts`.
- [ ] Add permutations to `src/generators/geometry/permutations.ts`.
- [ ] Create `src/views/geometry-model-shapes/` (HTML, SCSS, TS) view files.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/geometry/generator.test.ts`.
- [ ] Validate question generation boundary values (ensure sticks/balls counts map to actual geometric sides/vertices).
- [ ] Manually preview exercises using the standard visualizer.

---

## K.G.B.6 - Compose simple shapes to form larger shapes
* **CCSS Text:** Compose simple shapes to form larger shapes. For example, “Can you join these two triangles with full sides touching to make a rectangle?”
* **Ontology Reference:** Matched Areas: `Area.SpatialModelling`, `Area.ShapeRecognition`, Scopes: `Scope.PhysicalGeometry`, `Scope.VisualGeometry`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend `geometry` generator.
* **Competency Breakdowns (1 combination):**
  1. **Permutation A (Compose simple shapes to make a target shape):**
     - Labels: `Area.SpatialModelling`, `Area.ShapeRecognition`, `Scope.VisualGeometry`, `Ability.SpatialGeneration`
     - Parameters: `mode: "compose-shapes"`, `target: "rectangle" | "square"`, `components: ["triangles" | "rectangles"]`
     - Sample question: "Which two shapes can you join to make a rectangle?" (options: Two triangles, two circles).

### Subtask 2: View & UI Design
* **Reuse or New View:** Create a new view `geometry-compose`.
* **UI Layout details:**
  - Left panel: Target outline shape (e.g. rectangle).
  - Right panel: Pairs of candidate component shapes (e.g. Option A: two triangles, Option B: two circles).
  - In solution view, draw the target shape on the left with a dashed dividing line showing the two triangles joined together, and highlight Option A.

### Subtask 3: Developer Implementation Checklist
- [ ] Implement `compose-shapes` logic in `src/generators/geometry/generator.ts`.
- [ ] Define permutations in `src/generators/geometry/permutations.ts`.
- [ ] Create `src/views/geometry-compose/` (HTML, SCSS, TS).

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `src/generators/geometry/generator.test.ts`.
- [ ] Validate question generation boundary values (ensure valid options match geometric principles).
- [ ] Manually preview exercises using the standard visualizer.
