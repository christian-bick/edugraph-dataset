# Grade 6 CCSS Backlog

This backlog lists the Grade 6 leaf standards that need implementation coverage. For each standard, it specifies the problem generator extensions, competency breakdowns, view/UI layouts, implementation checklists, and validation plans.

## [6.RP.A.1] - Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities.
* **CCSS Text:** Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities. For example, “The ratio of wings to beaks in the bird house at the zoo was 2:1, because for every 2 wings there was 1 beak.” “For every vote candidate A received, candidate C received nearly three votes.”
* **Ontology Reference:** Matched Areas: `[RatioInterpretation, RatioNotation, ProportionAbstraction]`, Scopes: `[RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'counting' generator. Add a 'ratio' mode with constraints for visual object ratio comparison and textual ratio notation representation.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.RatioInterpretation, Scope.IntegersWithoutNegatives, Scope.VisualNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ ratioMode: 'visual', countA: [2, 9], countB: [2, 9] }`
     - **Sample:** A grid displays 3 blue circles and 5 red stars. Prompt: 'What is the ratio of blue circles to red stars?' -> Answer: '3:5' or '3 to 5'.
  2. **Permutation B:**
     - **Labels:** `[Area.RatioNotation, Scope.ArabicNumerals, Ability.TextualArticulation]`
     - **Parameters:** `{ ratioMode: 'text', valA: [1, 20], valB: [1, 20] }`
     - **Sample:** 'In a classroom, there are 12 boys and 15 girls. Write the ratio of boys to girls in the simplest form A:B.' -> Answer: '4:5'.

### Subtask 2: View & UI Design
* **Reuse or New View:** counting-objects
* **UI Layout details:** Extend `counting-objects` view to render groups of distinct objects (different SVG shapes/colors like stars, circles, triangles) in a structured or scattered grid, with customizable text input for ratios.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.RP.A.2] - Understand the concept of a unit rate a/b associated with a ratio a:b with b ≠0, and use rate language in the context of a ratio relationship.
* **CCSS Text:** Understand the concept of a unit rate a/b associated with a ratio a:b with b ≠0, and use rate language in the context of a ratio relationship. For example, “This recipe has a ratio of 3 cups of flour to 4 cups of sugar, so there is 3/4 cup of flour for each cup of sugar.” “We paid $75 for 15 hamburgers, which is a rate of $5 per hamburger.” (Expectations for unit rates in this grade are limited to non-complex fractions.)
* **Ontology Reference:** Matched Areas: `[RatioInterpretation, ProportionAbstraction, FractionNotation]`, Scopes: `[RationalNumbers, FractionNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'arithmetic' generator by adding a 'unit-rate' operator and word problem configurations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.ProportionAbstraction, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'unit-rate', divisorRange: [2, 10], quotientRange: [2, 12] }`
     - **Sample:** 'If 24 apples are distributed evenly into 6 baskets, what is the rate of apples per basket?' -> Answer: '4'.
  2. **Permutation B:**
     - **Labels:** `[Area.RatioInterpretation, Scope.ArabicNumerals, Ability.TextualArticulation]`
     - **Parameters:** `{ mode: 'unit-rate', rateType: 'speed', timeRange: [2, 5], speedRange: [30, 80] }`
     - **Sample:** 'A truck travels 150 miles in 3 hours. What is the unit rate of speed in miles per hour?' -> Answer: '50'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` view. Render standard word problems with an inline numeric input box representing the unit rate and units (e.g. '___ miles per hour').

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.RP.A.3a] - Make tables of equivalent ratios relating quantities with whole number measurements, find missing values in the tables, and plot the pairs of values on the coordinate plane.
* **CCSS Text:** Make tables of equivalent ratios relating quantities with whole number measurements, find missing values in the tables, and plot the pairs of values on the coordinate plane. Use tables to compare ratios.
* **Ontology Reference:** Matched Areas: `[RatioEquivalence, ProportionManipulation, PointPlotting, CartesianPlane]`, Scopes: `[CartesianCoordinateSystem, RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'ordering' or 'arithmetic' generator to support equivalent ratio sequence generation.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.RatioEquivalence, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'ratio-table', ratio: [1, 5], missingCell: 'random' }`
     - **Sample:** A table has columns X and Y. Row 1: (2, 3), Row 2: (4, 6), Row 3: (?, 9). Find the missing value. -> Answer: '6'.
  2. **Permutation B:**
     - **Labels:** `[Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation]`
     - **Parameters:** `{ mode: 'ratio-plot', ratio: [1, 2], count: 3 }`
     - **Sample:** 'Plot the coordinates (1,2), (2,4), (3,6) from the ratio table on the grid.'

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: ratio-table-graph
* **UI Layout details:** Design a new view `ratio-table-graph` with a split panel: a formatted HTML table displaying coordinates, and an interactive coordinate plane (SVG grid) where the user clicks to plot points. The view must support touch inputs and provide responsive coordinate hover effects.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `ratio-table-graph`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.RP.A.3b] - Solve unit rate problems including those involving unit pricing and constant speed.
* **CCSS Text:** Solve unit rate problems including those involving unit pricing and constant speed. For example, if it took 7 hours to mow 4 lawns, then at that rate, how many lawns could be mowed in 35 hours? At what rate were lawns being mowed?
* **Ontology Reference:** Matched Areas: `[ProportionInteraction, ProportionManipulation, RatioInterpretation]`, Scopes: `[RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'arithmetic' generator with a unit rate word problem template.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.ProportionAbstraction, Scope.Dollar, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'unit-pricing', decimals: true, count: [2, 10] }`
     - **Sample:** 'A box of 8 cupcakes costs $12.00. What is the price per cupcake?' -> Answer: '1.50'.
  2. **Permutation B:**
     - **Labels:** `[Area.ArithmeticOperations, Scope.RationalNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'constant-speed', time: [2, 6], speed: [10, 60] }`
     - **Sample:** 'If you run at a constant speed of 8 miles per hour, how far will you run in 2.5 hours?' -> Answer: '20'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` with a textual description box, clear layout hierarchy, and responsive text inputs for decimal pricing values.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.RP.A.3c] - Find a percent of a quantity as a rate per 100 (e.
* **CCSS Text:** Find a percent of a quantity as a rate per 100 (e.g., 30% of a quantity means 30/100 times the quantity); solve problems involving finding the whole, given a part and the percent.
* **Ontology Reference:** Matched Areas: `[PercentageArithmetic, PercentageNotation, ProportionInteraction]`, Scopes: `[RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'arithmetic' generator to support percent operations, specifying base, percentage, and value parts.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.PercentageArithmetic, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'percent-of-quantity', whole: [10, 200], percent: [5, 10, 20, 25, 50, 75] }`
     - **Sample:** 'What is 20% of 80?' -> Answer: '16'.
  2. **Permutation B:**
     - **Labels:** `[Area.PercentageArithmetic, Scope.Base10, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'find-whole', part: [5, 50], percent: [10, 25, 50] }`
     - **Sample:** '15 is 25% of what number?' -> Answer: '60'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` showing horizontal equation layouts, e.g., '15 = 25% of [ ]' or '25% of 60 = [ ]'.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.RP.A.3d] - Use ratio reasoning to convert measurement units; manipulate and transform units appropriately when multiplying or dividing quantities.
* **CCSS Text:** Use ratio reasoning to convert measurement units; manipulate and transform units appropriately when multiplying or dividing quantities.
* **Ontology Reference:** Matched Areas: `[ProportionManipulation, ProportionInteraction, Multiplication, Division]`, Scopes: `[RationalNumbers, MeasurementScope]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' or 'arithmetic' generator to support unit conversion factors.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Measurement, Scope.MeasurementScope, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'convert-units', system: 'imperial', units: ['inches', 'feet'] }`
     - **Sample:** 'Convert 48 inches to feet.' -> Answer: '4'.
  2. **Permutation B:**
     - **Labels:** `[Area.ProportionAbstraction, Scope.RationalNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'convert-units', system: 'metric', units: ['meters', 'centimeters'] }`
     - **Sample:** 'A ribbon is 3.5 meters long. How long is it in centimeters?' -> Answer: '350'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` with a text label next to the input field indicating target units (e.g. 'ft' or 'cm').

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.A.1] - Interpret and compute quotients of fractions, and solve word problems involving division of fractions by fractions, e.
* **CCSS Text:** Interpret and compute quotients of fractions, and solve word problems involving division of fractions by fractions, e.g., by using visual fraction models and equations to represent the problem. For example, create a story context for (2/3) ÷ (3/4) and use a visual fraction model to show the quotient; use the relationship between multiplication and division to explain that (2/3) ÷ (3/4) = 8/9 because 3/4 of 8/9 is 2/3. (In general, (a/b) ÷ (c/d) = ad/bc.) How much chocolate will each person get if 3 people share 1/2 lb of chocolate equally? How many 3/4-cup servings are in 2/3 of a cup of yogurt? How wide is a rectangular strip of land with length 3/4 mi and area 1/2 square mi?
* **Ontology Reference:** Matched Areas: `[FractionArithmetic, Division]`, Scopes: `[FractionNumbers, RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support fraction division calculations and fraction word problems.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.FractionArithmetic, Scope.FractionNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'fraction-division', numRange: [1, 9], denRange: [2, 10] }`
     - **Sample:** '(2/3) / (3/4) = ?' -> Answer: '8/9'.
  2. **Permutation B:**
     - **Labels:** `[Area.Division, Scope.ArabicNumerals, Ability.ResultInterpretation]`
     - **Parameters:** `{ mode: 'fraction-division-word', context: 'sharing' }`
     - **Sample:** 'How many 3/4-cup servings are in 6 cups of juice?' -> Answer: '8'.

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: operations-fractions
* **UI Layout details:** Create a new view `operations-fractions` displaying math fraction stacks (numerator over denominator) in both question and input areas, ensuring proper vertical spacing and readable font sizes.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `operations-fractions`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.B.3] - Fluently add, subtract, multiply, and divide multi-digit decimals using the standard algorithm for each operation.
* **CCSS Text:** Fluently add, subtract, multiply, and divide multi-digit decimals using the standard algorithm for each operation.
* **Ontology Reference:** Matched Areas: `[DecimalArithmetic, BaseOperations]`, Scopes: `[DecimalNumbers, Base10]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support multi-digit decimal operations with alignment rules.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.DecimalPointAlignment, Scope.DecimalNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'decimal-arithmetic', op: ['add', 'subtract'], digitsNum1: [3, 4], digitsNum2: [2, 3] }`
     - **Sample:** '14.25 + 3.8 = ?' -> Answer: '18.05'.
  2. **Permutation B:**
     - **Labels:** `[Area.DecimalArithmetic, Scope.ArabicNumerals, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'decimal-arithmetic', op: ['multiply', 'divide'], scaleNum1: 2, scaleNum2: 1 }`
     - **Sample:** '2.4 * 0.15 = ?' -> Answer: '0.36'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-vertical
* **UI Layout details:** Reuse `operations-vertical` to display decimals vertically aligned by their decimal points, with gridlines helping students verify alignment during manual checking.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.B.4] - Find the greatest common factor of two whole numbers less than or equal to 100 and the least common multiple of two whole numbers less than or equal to 12.
* **CCSS Text:** Find the greatest common factor of two whole numbers less than or equal to 100 and the least common multiple of two whole numbers less than or equal to 12. Use the distributive property to express a sum of two whole numbers 1–100 with a common factor as a multiple of a sum of two whole numbers with no common factor. For example, express 36 + 8 as 4 (9 + 2).
* **Ontology Reference:** Matched Areas: `[FactorsAndMultiples, DistributiveLaw, Factorization]`, Scopes: `[NumbersSmaller100, IntegersWithoutNegatives]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to include GCF, LCM, and distributive factoring operations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.FactorsAndMultiples, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'gcf-lcm', op: 'gcf', maxVal1: 100, maxVal2: 12 }`
     - **Sample:** 'Find the greatest common factor (GCF) of 24 and 36.' -> Answer: '12'.
  2. **Permutation B:**
     - **Labels:** `[Area.DistributiveLaw, Scope.Base10, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'distributive-factoring', valRange: [10, 100] }`
     - **Sample:** 'Express 24 + 36 as a common factor times a sum of two whole numbers: A*(B + C).' -> Answer: '12*(2 + 3)'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` view, providing text boxes that parse parenthesis structures for the distributive expression.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.C.5] - Understand that positive and negative numbers are used together to describe quantities having opposite directions or values (e.
* **CCSS Text:** Understand that positive and negative numbers are used together to describe quantities having opposite directions or values (e.g., temperature above/below zero, elevation above/below sea level, credits/debits, positive/negative electric charge); use positive and negative numbers to represent quantities in real-world contexts, explaining the meaning of 0 in each situation.
* **Ontology Reference:** Matched Areas: `[IntegerSigns, ZeroConcept, IntegerArithmetic]`, Scopes: `[IntegersWithNegatives, IntegersWithZero]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'writing' generator to handle conversion between verbal description of opposite situations and positive/negative integers.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.IntegerNotation, Scope.IntegersWithNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'signed-contexts', contexts: ['elevation', 'temperature', 'finance'] }`
     - **Sample:** 'Represent a debt of $45 as an integer.' -> Answer: '-45'.
  2. **Permutation B:**
     - **Labels:** `[Area.ZeroConcept, Scope.Thermometer, Ability.ConceptSpecification]`
     - **Parameters:** `{ mode: 'zero-interpretation', context: 'elevation' }`
     - **Sample:** 'In elevation, if positive numbers represent feet above sea level, what does 0 represent?' -> Answer: 'Sea level'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view. Render contextual sentences and prompt students to write the corresponding integer (e.g. including a minus sign) or concept name.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.C.6a] - Recognize opposite signs of numbers as indicating locations on opposite sides of 0 on the number line; recognize that the opposite of the opposite of a number is the number itself, e.
* **CCSS Text:** Recognize opposite signs of numbers as indicating locations on opposite sides of 0 on the number line; recognize that the opposite of the opposite of a number is the number itself, e.g., –(–3) = 3, and that 0 is its own opposite.
* **Ontology Reference:** Matched Areas: `[IntegerSigns, ZeroConcept, Numeration]`, Scopes: `[IntegersWithNegatives, Numberline]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' or 'writing' generator with opposite operations (opposite of opposite).
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.IntegerSigns, Scope.IntegersWithNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'opposite', depth: 2 }`
     - **Sample:** 'What is the value of -(-8)?' -> Answer: '8'.
  2. **Permutation B:**
     - **Labels:** `[Area.NumerationWithIntegers, Scope.Numberline, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'opposite', depth: 1, val: 0 }`
     - **Sample:** 'What is the opposite of 0?' -> Answer: '0'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view or use a new number line view to highlight opposite symmetry.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.C.6b] - Understand signs of numbers in ordered pairs as indicating locations in quadrants of the coordinate plane; recognize that when two ordered pairs differ only by signs, the locations of the points are related by reflections across one or both axes.
* **CCSS Text:** Understand signs of numbers in ordered pairs as indicating locations in quadrants of the coordinate plane; recognize that when two ordered pairs differ only by signs, the locations of the points are related by reflections across one or both axes.
* **Ontology Reference:** Matched Areas: `[Quadrants, CartesianPlane, PointPlotting, Reflection]`, Scopes: `[CartesianCoordinateSystem, TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' or 'writing' generator to generate ordered pairs and coordinate reflection problems.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Quadrants, Scope.CartesianCoordinateSystem, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'coordinate-quadrants' }`
     - **Sample:** 'In which quadrant does the point (-2, 5) lie?' -> Answer: 'Quadrant II'.
  2. **Permutation B:**
     - **Labels:** `[Area.ShapeReflection, Scope.TwoDimensional, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'coordinate-reflection', axis: ['x', 'y'] }`
     - **Sample:** 'Find the reflection of the point (-3, -4) across the y-axis.' -> Answer: '(3, -4)'.

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: coordinate-plane-view
* **UI Layout details:** Design a new view `coordinate-plane-view` which displays a standard Cartesian plane (all four quadrants, with labeled axes and grid numbers). The view should support showing points and reflections with grid indicators.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `coordinate-plane-view`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.C.6c] - Find and position integers and other rational numbers on a horizontal or vertical number line diagram; find and position pairs of integers and other rational numbers on a coordinate plane.
* **CCSS Text:** Find and position integers and other rational numbers on a horizontal or vertical number line diagram; find and position pairs of integers and other rational numbers on a coordinate plane.
* **Ontology Reference:** Matched Areas: `[PointPlotting, CartesianPlane, Numeration]`, Scopes: `[Numberline, CartesianCoordinateSystem, RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'counting' or 'writing' generator to generate coordinate pairs and decimal/fraction values for plotting.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.NumerationWithIntervals, Scope.Numberline, Ability.VisualArticulation]`
     - **Parameters:** `{ mode: 'plot-numberline', rationalType: 'decimal' }`
     - **Sample:** 'Plot the number -1.75 on the number line.'
  2. **Permutation B:**
     - **Labels:** `[Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation]`
     - **Parameters:** `{ mode: 'plot-coordinate', rationalType: 'fraction' }`
     - **Sample:** 'Plot the point (0.5, -2.25) on the coordinate plane.'

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: coordinate-plane-view
* **UI Layout details:** Design the new `coordinate-plane-view` and a new `number-line-view`. The views must enable interactive dragging/clicking to place markers at fractions/decimals with snap-to-grid support.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `coordinate-plane-view`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.C.7a] - Interpret statements of inequality as statements about the relative position of two numbers on a number line diagram.
* **CCSS Text:** Interpret statements of inequality as statements about the relative position of two numbers on a number line diagram. For example, interpret –3 > –7 as a statement that –3 is located to the right of –7 on a number line oriented from left to right.
* **Ontology Reference:** Matched Areas: `[NumericComparison, NumericOrder, Numeration]`, Scopes: `[Numberline, IntegersWithNegatives]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to evaluate relative position of integers on a number line.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.NumericComparison, Scope.Numberline, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'position-inequality', minVal: -15, maxVal: 15 }`
     - **Sample:** 'Compare -9 and -4. Write the correct symbol (< or >) and explain: -9 is to the [left/right] of -4 on a number line.' -> Answer: '<'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-compare
* **UI Layout details:** Reuse `numbers-compare` view. Render an interactive or static number line above the numbers, illustrating their left/right order.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.C.7b] - Write, interpret, and explain statements of order for rational numbers in real-world contexts.
* **CCSS Text:** Write, interpret, and explain statements of order for rational numbers in real-world contexts. For example, write –3 ^(o)C > –7 ^(o)C to express the fact that –3 ^(o)C is warmer than –7 ^(o)C.
* **Ontology Reference:** Matched Areas: `[NumericOrder, NumericComparison]`, Scopes: `[RationalNumbers, IntegersWithNegatives, TemperatureAbstraction]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'ordering' generator to support sorting rational numbers with real-world contexts.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.NumericOrder, Scope.IntegersWithNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'context-order', type: ['decimal', 'fraction'], context: ['temperature', 'elevation', 'debt'] }`
     - **Sample:** 'Sort the elevations from lowest to highest: -2.3m, 1.5m, -4.8m, 0m.' -> Answer: '-4.8m, -2.3m, 0m, 1.5m'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-order
* **UI Layout details:** Reuse `numbers-order` view. Support drag-and-drop ordering blocks with labels representing metric units, ensuring proper sizing for mobile screens.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.C.7c] - Understand the absolute value of a rational number as its distance from 0 on the number line; interpret absolute value as magnitude for a positive or negative quantity in a real-world situation.
* **CCSS Text:** Understand the absolute value of a rational number as its distance from 0 on the number line; interpret absolute value as magnitude for a positive or negative quantity in a real-world situation. For example, for an account balance of –30 dollars, write |–30| = 30 to describe the size of the debt in dollars
* **Ontology Reference:** Matched Areas: `[ZeroConcept, DistanceCalculation]`, Scopes: `[RationalNumbers, Numberline, IntegersWithNegatives]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to support absolute value operations and magnitude representation.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.AbsoluteValue, Scope.RationalNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'absolute-value-calc', valType: 'rational' }`
     - **Sample:** 'Evaluate: |-3.75|' -> Answer: '3.75'.
  2. **Permutation B:**
     - **Labels:** `[Area.DistanceCalculation, Scope.Numberline, Ability.ResultInterpretation]`
     - **Parameters:** `{ mode: 'absolute-value-context' }`
     - **Sample:** 'A diver is at -15 meters. What is the magnitude of the distance of the diver from sea level?' -> Answer: '15'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` view, rendering vertical absolute value brackets correctly (e.g. `|x|`).

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.C.7d] - Distinguish comparisons of absolute value from statements about order.
* **CCSS Text:** Distinguish comparisons of absolute value from statements about order. For example, recognize that an account balance less than –30 dollars represents a debt greater than 30 dollars.
* **Ontology Reference:** Matched Areas: `[NumericComparison, NumericOrder]`, Scopes: `[RationalNumbers, IntegersWithNegatives]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to compare absolute value sizes vs actual order of negative numbers.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.AbsoluteValue, Scope.IntegersWithNegatives, Ability.LogicalReasoning]`
     - **Parameters:** `{ mode: 'compare-absolute-vs-order' }`
     - **Sample:** 'Compare the order of -10 and -5, and the comparison of their absolute values. |-10| [ ] |-5|' -> Answer: '>'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-compare
* **UI Layout details:** Reuse `numbers-compare` view. Render comparison inputs with absolute value bars in a clear layout.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.NS.C.8] - Solve real-world and mathematical problems by graphing points in all four quadrants of the coordinate plane.
* **CCSS Text:** Solve real-world and mathematical problems by graphing points in all four quadrants of the coordinate plane. Include use of coordinates and absolute value to find distances between points with the same first coordinate or the same second coordinate.
* **Ontology Reference:** Matched Areas: `[PointPlotting, CartesianPlane, Quadrants, CoordinateDistance]`, Scopes: `[CartesianCoordinateSystem, TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' or 'arithmetic' generator to find grid distance between coordinates sharing an axis.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.CoordinateDistance, Scope.CartesianCoordinateSystem, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'coordinate-distance' }`
     - **Sample:** 'Find the distance between (4, -3) and (4, 5) on the coordinate plane.' -> Answer: '8'.

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: coordinate-plane-view
* **UI Layout details:** Design the new `coordinate-plane-view` to display the coordinates, draw a highlighted line segment between them, and show absolute value calculations (e.g. |-3| + |5| = 8).

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `coordinate-plane-view`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.A.1] - Write and evaluate numerical expressions involving whole-number exponents.
* **CCSS Text:** Write and evaluate numerical expressions involving whole-number exponents.
* **Ontology Reference:** Matched Areas: `[Exponentiation, ArithmeticEvaluation, PowerOperations]`, Scopes: `[IntegersWithoutNegatives]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator with whole-number exponent calculations and expressions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Exponentiation, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'exponent-calc', baseRange: [2, 10], expRange: [2, 4] }`
     - **Sample:** 'Evaluate: 2^4' -> Answer: '16'.
  2. **Permutation B:**
     - **Labels:** `[Area.ArithmeticEvaluation, Scope.Base10, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'exponent-expr', op: ['add', 'subtract', 'multiply'] }`
     - **Sample:** 'Evaluate: 3^2 * 5 - 4' -> Answer: '41'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` view, rendering exponents in superscript format (e.g. `x<sup>y</sup>`).

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.A.2a] - Write expressions that record operations with numbers and with letters standing for numbers.
* **CCSS Text:** Write expressions that record operations with numbers and with letters standing for numbers. For example, express the calculation “Subtract y from 5” as 5 – y.
* **Ontology Reference:** Matched Areas: `[Algebra, ArithmeticEvaluation]`, Scopes: `[NumericAbstraction]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'writing' generator to translate verbal algebraic descriptions to expressions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Algebra, Scope.ArabicNumerals, Ability.TextualArticulation]`
     - **Parameters:** `{ mode: 'word-to-expression' }`
     - **Sample:** 'Write an algebraic expression for: 5 less than the product of 3 and y.' -> Answer: '3y - 5'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view. Prompt for keyboard input of algebraic letters and operations, using clear styling.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.A.2b] - Identify parts of an expression using mathematical terms (sum, term, product, factor, quotient, coefficient); view one or more parts of an expression as a single entity.
* **CCSS Text:** Identify parts of an expression using mathematical terms (sum, term, product, factor, quotient, coefficient); view one or more parts of an expression as a single entity. For example, describe the expression 2 (8 + 7) as a product of two factors; view (8 + 7) as both a single entity and a sum of two terms.
* **Ontology Reference:** Matched Areas: `[Algebra, ArithmeticEvaluation]`, Scopes: `[NumericAbstraction]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'writing' generator to identify parts of algebraic expressions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Algebra, Scope.ArabicNumerals, Ability.ConceptSpecification]`
     - **Parameters:** `{ mode: 'identify-parts', targets: ['coefficient', 'term', 'constant'] }`
     - **Sample:** 'In the expression 4x + 7, what is the coefficient of x?' -> Answer: '4'.
  2. **Permutation B:**
     - **Labels:** `[Area.Analysis, Scope.NumericAbstraction, Ability.ConceptSpecification]`
     - **Parameters:** `{ mode: 'identify-parts', targets: ['factor', 'product'] }`
     - **Sample:** 'In the expression 2(x + 5), the quantity (x + 5) is viewed as a single...' -> Answer: 'factor'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view with custom validation for text and algebraic variable entries.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.A.2c] - Evaluate expressions at specific values of their variables.
* **CCSS Text:** Evaluate expressions at specific values of their variables. Include expressions that arise from formulas used in real-world problems. Perform arithmetic operations, including those involving whole number exponents, in the conventional order when there are no parentheses to specify a particular order (Order of Operations). For example, use the formulas V = s^(3) and A = 6 s^(2) to find the volume and surface area of a cube with sides of length s = 1/2.
* **Ontology Reference:** Matched Areas: `[Algebra, ArithmeticEvaluation, OrderOfOperations, VolumeCalculation, SurfaceAreaCalculation, Cube]`, Scopes: `[RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'arithmetic' generator to evaluate formulas and multi-step expressions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.ArithmeticEvaluation, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'eval-variable', varCount: [1, 2] }`
     - **Sample:** 'Evaluate 2x^2 - 3y when x = 3 and y = 4.' -> Answer: '6'.
  2. **Permutation B:**
     - **Labels:** `[Area.OrderOfOperations, Scope.Base10, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'order-of-operations', hasParentheses: true }`
     - **Sample:** 'Evaluate: 24 / (2 * 3) + 2^3' -> Answer: '12'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` view, rendering exponents and parentheses clearly.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.A.3] - Apply the properties of operations to generate equivalent expressions.
* **CCSS Text:** Apply the properties of operations to generate equivalent expressions. For example, apply the distributive property to the expression 3 (2 + x) to produce the equivalent expression 6 + 3x; apply the distributive property to the expression 24x + 18y to produce the equivalent expression 6 (4x + 3y); apply properties of operations to y + y + y to produce the equivalent expression 3y.
* **Ontology Reference:** Matched Areas: `[Algebra, DistributiveLaw, CommutativeLaw, AssociativeLaw, ArithmeticLaws]`, Scopes: `[NumericAbstraction]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'writing' or 'comparison' generator to evaluate and generate equivalent properties of operations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.DistributiveLaw, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'equivalence-properties', property: 'distributive' }`
     - **Sample:** 'Apply the distributive property to find an equivalent expression for 4(3x + 2).' -> Answer: '12x + 8'.
  2. **Permutation B:**
     - **Labels:** `[Area.CommutativeLaw, Scope.ArabicNumerals, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'equivalence-properties', property: 'combine-like-terms' }`
     - **Sample:** 'Simplify the expression: 3x + x + 5x' -> Answer: '9x'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view. Format mathematical characters clearly.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.A.4] - Identify when two expressions are equivalent (i.
* **CCSS Text:** Identify when two expressions are equivalent (i.e., when the two expressions name the same number regardless of which value is substituted into them). For example, the expressions y + y + y and 3y are equivalent because they name the same number regardless of which number y stands for.
* **Ontology Reference:** Matched Areas: `[Algebra, NumericIdentity]`, Scopes: `[NumericAbstraction]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'comparison' generator to verify expression equivalence.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Algebra, Scope.IntegersWithoutNegatives, Ability.LogicalReasoning]`
     - **Parameters:** `{ mode: 'expression-equivalence' }`
     - **Sample:** 'Are the expressions 3(x + 2) and 3x + 6 equivalent? (yes/no)' -> Answer: 'yes'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-compare
* **UI Layout details:** Reuse `numbers-compare` view. Center both expressions with a select/input element between them.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.B.5] - Understand solving an equation or inequality as a process of answering a question: which values from a specified set, if any, make the equation or inequality true? Use substitution to determine whether a given number in a specified set makes an equation or inequality true.
* **CCSS Text:** Understand solving an equation or inequality as a process of answering a question: which values from a specified set, if any, make the equation or inequality true? Use substitution to determine whether a given number in a specified set makes an equation or inequality true.
* **Ontology Reference:** Matched Areas: `[Algebra, ArithmeticEvaluation]`, Scopes: `[RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to test values of equations and inequalities by substitution.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Algebra, Scope.ArabicNumerals, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'substitution-truth', type: 'equation' }`
     - **Sample:** 'Which number from the set {2, 5, 8} makes the equation 3x - 4 = 11 true?' -> Answer: '5'.
  2. **Permutation B:**
     - **Labels:** `[Area.NumericComparison, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'substitution-truth', type: 'inequality' }`
     - **Sample:** 'Does x = 4 make the inequality 2x + 1 < 9 true? (yes/no)' -> Answer: 'no'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-compare
* **UI Layout details:** Reuse `numbers-compare` view or multiple-choice view. Show substituted values clearly.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.B.6] - Use variables to represent numbers and write expressions when solving a real-world or mathematical problem; understand that a variable can represent an unknown number, or, depending on the purpose at hand, any number in a specified set.
* **CCSS Text:** Use variables to represent numbers and write expressions when solving a real-world or mathematical problem; understand that a variable can represent an unknown number, or, depending on the purpose at hand, any number in a specified set.
* **Ontology Reference:** Matched Areas: `[Algebra]`, Scopes: `[RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'writing' generator to write expressions with variables for real-world scenarios.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Algebra, Scope.ArabicNumerals, Ability.TextualArticulation]`
     - **Parameters:** `{ mode: 'real-world-variable' }`
     - **Sample:** 'An apple costs $0.75. Write an expression for the total cost of a apples.' -> Answer: '0.75a'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view with real-world context descriptions and styled letter inputs.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.B.7] - Solve real-world and mathematical problems by writing and solving equations of the form x + p = q and px = q for cases in which p, q and x are all nonnegative rational numbers.
* **CCSS Text:** Solve real-world and mathematical problems by writing and solving equations of the form x + p = q and px = q for cases in which p, q and x are all nonnegative rational numbers.
* **Ontology Reference:** Matched Areas: `[Algebra, Addition, Multiplication]`, Scopes: `[RationalNumbers, IntegersWithoutNegatives]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'arithmetic' generator to solve one-step addition/multiplication equations with non-negative rational coefficients.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.IntegerArithmetic, Scope.ArabicNumerals, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'solve-equation', op: 'add', coefficient: 'integer' }`
     - **Sample:** 'Solve: x + 15 = 42' -> Answer: '27'.
  2. **Permutation B:**
     - **Labels:** `[Area.RationalArithmetic, Scope.RationalNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'solve-equation', op: 'multiply', coefficient: 'decimal' }`
     - **Sample:** 'Solve: 2.5x = 10' -> Answer: '4'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` view. Present standard vertical or horizontal equation solving layouts.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.B.8] - Write an inequality of the form x > c or x < c to represent a constraint or condition in a real-world or mathematical problem.
* **CCSS Text:** Write an inequality of the form x > c or x < c to represent a constraint or condition in a real-world or mathematical problem. Recognize that inequalities of the form x > c or x < c have infinitely many solutions; represent solutions of such inequalities on number line diagrams.
* **Ontology Reference:** Matched Areas: `[Algebra, NumericComparison]`, Scopes: `[Numberline, RationalNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'writing' generator to represent constraints with inequalities and show their number line graph.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.NumericComparison, Scope.IntegersWithNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'write-inequality' }`
     - **Sample:** 'Write an inequality for: The height h must be at least 48 inches.' -> Answer: 'h >= 48'.
  2. **Permutation B:**
     - **Labels:** `[Area.PointPlotting, Scope.Numberline, Ability.VisualArticulation]`
     - **Parameters:** `{ mode: 'plot-inequality' }`
     - **Sample:** 'Graph the inequality x < 3 on the number line.'

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: number-line-view
* **UI Layout details:** Design the new `number-line-view` which renders a horizontal slider/axis. To graph an inequality, the user taps to place an open or closed circle at the boundary, and drags a handle to color the left or right arrow. Fully responsive and keyboard accessible.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `number-line-view`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.EE.C.9] - Use variables to represent two quantities in a real-world problem that change in relationship to one another; write an equation to express one quantity, thought of as the dependent variable, in terms of the other quantity, thought of as the independent variable.
* **CCSS Text:** Use variables to represent two quantities in a real-world problem that change in relationship to one another; write an equation to express one quantity, thought of as the dependent variable, in terms of the other quantity, thought of as the independent variable. Analyze the relationship between the dependent and independent variables using graphs and tables, and relate these to the equation. For example, in a problem involving motion at constant speed, list and graph ordered pairs of distances and times, and write the equation d = 65t to represent the relationship between distance and time.
* **Ontology Reference:** Matched Areas: `[Algebra, LineGraphing, CoordinateAxes]`, Scopes: `[CartesianCoordinateSystem, TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'writing' generator to define dependent/independent variables and write their relational equations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Algebra, Scope.ArabicNumerals, Ability.TextualArticulation]`
     - **Parameters:** `{ mode: 'independent-dependent' }`
     - **Sample:** 'If you earn $15 per hour, write an equation for earnings (e) in terms of hours worked (h).' -> Answer: 'e = 15h'.

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: ratio-table-graph
* **UI Layout details:** Reuse the new `ratio-table-graph` view to display a table showing x and y coordinates, an equation editor, and a graph panel demonstrating the linear trend.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `ratio-table-graph`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.G.A.1] - Find the area of right triangles, other triangles, special quadrilaterals, and polygons by composing into rectangles or decomposing into triangles and other shapes; apply these techniques in the context of solving real-world and mathematical problems.
* **CCSS Text:** Find the area of right triangles, other triangles, special quadrilaterals, and polygons by composing into rectangles or decomposing into triangles and other shapes; apply these techniques in the context of solving real-world and mathematical problems.
* **Ontology Reference:** Matched Areas: `[AreaCalculation, Triangle, RightTriangle, Quadrilateral, Rectangle, Polygon]`, Scopes: `[TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'measurement' generator to compute area of triangles, quadrilaterals, and polygons.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.AreaCalculation, Scope.TwoDimensional, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'area-calc', shape: ['triangle', 'parallelogram', 'trapezoid'] }`
     - **Sample:** 'Find the area of a triangle with base 12 cm and height 5 cm.' -> Answer: '30'.
  2. **Permutation B:**
     - **Labels:** `[Area.GeometricCalculations, Scope.TwoDimensional, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'area-decomposition', shape: 'polygon' }`
     - **Sample:** 'Calculate the area of the polygon by decomposing it into rectangles and triangles.'

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: geometry-visualizer
* **UI Layout details:** Design a new view `geometry-visualizer` that renders 2D shapes (rectangles, triangles, parallelograms, trapezoids, complex polygons) using vector SVGs. Standard dimensions must be labeled clearly outside the shape. Layout must automatically scale on narrow viewports.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `geometry-visualizer`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.G.A.2] - Find the volume of a right rectangular prism with fractional edge lengths by packing it with unit cubes of the appropriate unit fraction edge lengths, and show that the volume is the same as would be found by multiplying the edge lengths of the prism.
* **CCSS Text:** Find the volume of a right rectangular prism with fractional edge lengths by packing it with unit cubes of the appropriate unit fraction edge lengths, and show that the volume is the same as would be found by multiplying the edge lengths of the prism. Apply the formulas V = l w h and V = b h to find volumes of right rectangular prisms with fractional edge lengths in the context of solving real-world and mathematical problems.
* **Ontology Reference:** Matched Areas: `[VolumeCalculation, RectangularPrism, FractionArithmetic]`, Scopes: `[ThreeDimensional, FractionNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator to compute volume of prisms with fractional dimensions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.VolumeCalculation, Scope.FractionNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'volume-prism', fractionalDimensions: true }`
     - **Sample:** 'Find the volume of a right rectangular prism with dimensions 1/2 m, 3/4 m, and 4 m.' -> Answer: '1.5' or '3/2'.

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: geometry-visualizer
* **UI Layout details:** Design the new `geometry-visualizer` view to render a 3D rectangular prism wireframe (with customizable length, width, height) using orthographic projection. Add an optional overlay demonstrating unit fraction packing cubes.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `geometry-visualizer`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.G.A.3] - Draw polygons in the coordinate plane given coordinates for the vertices; use coordinates to find the length of a side joining points with the same first coordinate or the same second coordinate.
* **CCSS Text:** Draw polygons in the coordinate plane given coordinates for the vertices; use coordinates to find the length of a side joining points with the same first coordinate or the same second coordinate. Apply these techniques in the context of solving real-world and mathematical problems.
* **Ontology Reference:** Matched Areas: `[ShapePlotting, CoordinateDistance, Polygon]`, Scopes: `[CartesianCoordinateSystem, TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' or 'ordering' generator to output polygon vertices and distance calculations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.ShapePlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation]`
     - **Parameters:** `{ mode: 'coordinate-polygon' }`
     - **Sample:** 'Draw the rectangle with vertices (1, 2), (1, 6), (5, 6), and (5, 2) on the plane.'
  2. **Permutation B:**
     - **Labels:** `[Area.LengthCalculation, Scope.TwoDimensional, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'coordinate-side-length' }`
     - **Sample:** 'What is the length of the side joining (1, 2) and (1, 6) in the coordinate plane?' -> Answer: '4'.

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: coordinate-plane-view
* **UI Layout details:** Design the new `coordinate-plane-view` to support multi-point polygon drawings. Users tap coordinates on the grid to create vertices, and lines are dynamically drawn between them to form a closed polygon.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `coordinate-plane-view`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.G.A.4] - Represent three-dimensional figures using nets made up of rectangles and triangles, and use the nets to find the surface area of these figures.
* **CCSS Text:** Represent three-dimensional figures using nets made up of rectangles and triangles, and use the nets to find the surface area of these figures. Apply these techniques in the context of solving real-world and mathematical problems.
* **Ontology Reference:** Matched Areas: `[SurfaceAreaCalculation, ThreeDimensionalObjects, Rectangle, Triangle]`, Scopes: `[ThreeDimensional, TwoDimensional]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'measurement' generator to generate 3D shape dimensions and their corresponding flat nets.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.SurfaceAreaCalculation, Scope.TwoDimensional, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'surface-area-net', netType: ['rectangular_prism', 'triangular_prism', 'square_pyramid'] }`
     - **Sample:** 'Find the surface area of the triangular prism whose net has bases with height 4 and sides 3, 4, 5, and prism length 10.'

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: geometry-visualizer
* **UI Layout details:** Design the new `geometry-visualizer` view to display flat 2D nets of prisms and pyramids. Labeled dimensions are positioned clearly near corresponding faces. Render with SVG for high-quality printing and scaling.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `geometry-visualizer`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.SP.A.1] - Recognize a statistical question as one that anticipates variability in the data related to the question and accounts for it in the answers.
* **CCSS Text:** Recognize a statistical question as one that anticipates variability in the data related to the question and accounts for it in the answers. For example, “How old am I?” is not a statistical question, but “How old are the students in my school?” is a statistical question because one anticipates variability in students’ ages.
* **Ontology Reference:** Matched Areas: `[Statistics]`, Scopes: `[NumericAbstraction]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend the 'comparison' generator to distinguish statistical questions from non-statistical ones.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Statistics, Scope.NumericAbstraction, Ability.ConceptSpecification]`
     - **Parameters:** `{ mode: 'statistical-question' }`
     - **Sample:** 'Is the question: "How many hours of sleep did students in my class get last night?" a statistical question? (yes/no)' -> Answer: 'yes'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view or use a multiple-choice selection box for Yes/No options.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.SP.A.2] - Understand that a set of data collected to answer a statistical question has a distribution which can be described by its center, spread, and overall shape.
* **CCSS Text:** Understand that a set of data collected to answer a statistical question has a distribution which can be described by its center, spread, and overall shape.
* **Ontology Reference:** Matched Areas: `[Statistics]`, Scopes: `[RealNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to analyze and describe shapes of statistical distributions.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Statistics, Scope.RealNumbers, Ability.ConceptGeneralization]`
     - **Parameters:** `{ mode: 'distribution-shape', shape: ['symmetric', 'skewed_left', 'skewed_right'] }`
     - **Sample:** 'Describe the distribution shown in the dot plot: symmetric, skewed left, or skewed right.' -> Answer: 'symmetric'.

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: statistics-plot
* **UI Layout details:** Design a new view `statistics-plot` that renders dot plots, histograms, and box plots using SVGs, with clean axes, tick marks, and customizable label alignments.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `statistics-plot`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.SP.A.3] - Recognize that a measure of center for a numerical data set summarizes all of its values with a single number, while a measure of variation describes how its values vary with a single number.
* **CCSS Text:** Recognize that a measure of center for a numerical data set summarizes all of its values with a single number, while a measure of variation describes how its values vary with a single number.
* **Ontology Reference:** Matched Areas: `[Statistics]`, Scopes: `[RealNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to distinguish measures of center from measures of variation.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Statistics, Scope.RealNumbers, Ability.ConceptSpecification]`
     - **Parameters:** `{ mode: 'center-vs-variation' }`
     - **Sample:** 'Is the interquartile range (IQR) a measure of center or a measure of variation?' -> Answer: 'measure of variation'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view or multiple choice selectors.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.SP.B.4] - Display numerical data in plots on a number line, including dot plots, histograms, and box plots.
* **CCSS Text:** Display numerical data in plots on a number line, including dot plots, histograms, and box plots.
* **Ontology Reference:** Matched Areas: `[Statistics]`, Scopes: `[Numberline, RealNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'counting' or 'writing' generator to produce numerical datasets for plot representation.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Statistics, Scope.Numberline, Ability.VisualArticulation]`
     - **Parameters:** `{ mode: 'dataset-plotting', plotType: ['dotplot', 'histogram', 'boxplot'] }`
     - **Sample:** 'Plot the following data values on the dot plot: [4, 5, 5, 6, 7, 7, 7, 8].'

### Subtask 2: View & UI Design
* **Reuse or New View:** new view: statistics-plot
* **UI Layout details:** Design the new `statistics-plot` view with an interactive SVG number line. Tapping places dot markers, dragging adjusts histogram bin heights, or dragging handles adjusts box plot quartiles (min, Q1, median, Q3, max).

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.
- [ ] Create view template and wire up to views engine for `statistics-plot`.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.SP.B.5a] - Reporting the number of observations.
* **CCSS Text:** Reporting the number of observations.
* **Ontology Reference:** Matched Areas: `[Statistics, Numeration]`, Scopes: `[IntegersWithoutNegatives]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'counting' generator to count list sizes for observations.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Statistics, Scope.IntegersWithoutNegatives, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'count-observations', dataSize: [5, 15] }`
     - **Sample:** 'Find the number of observations in the dataset: [12, 15, 12, 18, 20].' -> Answer: '5'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` view.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.SP.B.5b] - Describing the nature of the attribute under investigation, including how it was measured and its units of measurement.
* **CCSS Text:** Describing the nature of the attribute under investigation, including how it was measured and its units of measurement.
* **Ontology Reference:** Matched Areas: `[Statistics, Measurement]`, Scopes: `[MeasurementScope]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'writing' generator to identify measurement attributes and units from text scenarios.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Statistics, Scope.MeasurementScope, Ability.ConceptSpecification]`
     - **Parameters:** `{ mode: 'describe-attribute' }`
     - **Sample:** 'If you record the daily high temperatures in a city over a week, what is the attribute under investigation?' -> Answer: 'temperature'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.SP.B.5c] - Giving quantitative measures of center (median and/or mean) and variability (interquartile range and/or mean absolute deviation), as well as describing any overall pattern and any striking deviations from the overall pattern with reference to the context in which the data were gathered.
* **CCSS Text:** Giving quantitative measures of center (median and/or mean) and variability (interquartile range and/or mean absolute deviation), as well as describing any overall pattern and any striking deviations from the overall pattern with reference to the context in which the data were gathered.
* **Ontology Reference:** Matched Areas: `[Statistics]`, Scopes: `[RealNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'arithmetic' generator to compute statistical metric centers and spreads.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Statistics, Scope.RealNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'calc-stats', metric: ['mean', 'median'], size: [4, 8] }`
     - **Sample:** 'Calculate the mean of the data values: [4, 8, 12, 16].' -> Answer: '10'.
  2. **Permutation B:**
     - **Labels:** `[Area.Statistics, Scope.RealNumbers, Ability.ProcedureExecution]`
     - **Parameters:** `{ mode: 'calc-stats', metric: ['range', 'iqr', 'mad'], size: [4, 6] }`
     - **Sample:** 'Find the interquartile range (IQR) of: [1, 3, 5, 7, 9, 11].' -> Answer: '6'.

### Subtask 2: View & UI Design
* **Reuse or New View:** operations-boxes
* **UI Layout details:** Reuse `operations-boxes` view.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

## [6.SP.B.5d] - Relating the choice of measures of center and variability to the shape of the data distribution and the context in which the data were gathered.
* **CCSS Text:** Relating the choice of measures of center and variability to the shape of the data distribution and the context in which the data were gathered.
* **Ontology Reference:** Matched Areas: `[Statistics]`, Scopes: `[RealNumbers]`

### Subtask 1: Problem Generator Specifications
* **Extension/New module:** Extend 'comparison' generator to evaluate choices of statistical metrics based on data shape.
* **Competency Breakdowns (2-3 combinations):**
  1. **Permutation A:**
     - **Labels:** `[Area.Statistics, Scope.RealNumbers, Ability.ResultInterpretation]`
     - **Parameters:** `{ mode: 'choose-metric' }`
     - **Sample:** 'A dataset of test scores has many low scores and a single perfect score of 100. Which measure of center describes the typical score better: mean or median?' -> Answer: 'median'.

### Subtask 2: View & UI Design
* **Reuse or New View:** numbers-write
* **UI Layout details:** Reuse `numbers-write` view.

### Subtask 3: Developer Implementation Checklist
- [ ] Add the new configuration parameters to the generator config.
- [ ] Implement the math logic for the permutations in generator code.
- [ ] Add permutations to `permutations.ts` with matching labels.

### Subtask 4: Validation Plan
- [ ] Write unit tests verifying generated parameters in `generator.test.ts`.
- [ ] Validate question generation boundary values (e.g. range [0, 20]).
- [ ] Manually preview exercises using standard visualizer.

