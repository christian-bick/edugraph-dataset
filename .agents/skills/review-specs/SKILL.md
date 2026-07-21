---
name: review-specs
description: "/review-specs [{moduleName}] - Review spec.ts files in generators and views (for a specific module, or all modules if omitted) to ensure clean separation of concerns."
---

Review the `spec.ts` files for the specified generator or view module (or across all generator and view modules if `{moduleName}` is omitted). The goal is to enforce a clean separation of concerns by ensuring that:
1. **Generators' specs** contain *only* abstract mathematical and logical schemas.
2. **Views' specs** contain *only* visual layout and rendering configuration schemas.

## Scope Resolution
- **Specific Leaf Module**: If `{moduleName}` matches a specific leaf module ID (e.g., `/review-specs arithmetic-ops-pairs` or `/review-specs operations-vertical`), restrict the spec review strictly to that leaf module.
- **Parent Category Module**: If `{moduleName}` matches a parent category directory name (e.g., `/review-specs arithmetic` or `/review-specs shape`), review all spec files for leaf modules under that category folder.
- **All Modules**: If `{moduleName}` is omitted (e.g., `/review-specs`), discover and review all spec files across `src/generators/` and `src/visuals/views/`.

Spec validation (including parameter label vs. `generalLabels` overlap checking and duplicate parameterization checking) can be automatically executed by running the spec validation script:
`npm run check:specs` (running [validate-specs.ts](file:///c:/Users/silen/Documents/EduGraph/edugraph-content/src/scripts/validate-specs.ts), which dumps validation logs to the ignored file `temp/check_output.txt`).

Follow these instructions strictly during the review:

## 1. General Principles

- **Do Not Touch What Is Not Broken:** Keep your edits minimal. Do not rewrite, restructure, or remove spec configurations that already comply with these guidelines. Only edit configurations that violate the separation of concerns.
- **Resolver Reusability and Definition:** All ontology resolver helpers (e.g., `hasLabel`, `selectExactMatch`, `matchAllExactLabels `) must be imported and reused from [resolvers.ts](file:///c:/Users/silen/Documents/EduGraph/edugraph-content/src/lib/resolvers.ts). Do not declare ad-hoc resolvers locally in `spec.ts` files.
- **Passing Resolver Functions:** Ensure that resolver functions are passed as function references (e.g. `selectExactMatch` or curried factory outputs like `hasLabel(Scope.TenFrame)`) to the schema declaration arrays. They must **not** be executed prematurely (e.g. passing `selectExactMatch(...)` inside the schema array).
- **Cognitive Abilities (Abilities):** Both generators and views can contain mappings based on cognitive abilities (e.g., `Ability.ConceptualUnderstanding`, `Ability.VisualArticulation`, `Ability.ProcedureExecution`) depending on where the behavior is decided. For example, if an ability affects the underlying math logic, it should map in the generator spec; if it affects the visual mode or input interaction, it belongs in the view spec.
- **General Labels vs. Parameter Labels Overlap:** There must be zero overlap (including taxonomic ancestors via the `partOf` hierarchy) between the labels queried inside schema parameters and the spec's `generalLabels`. Specifically, when a label is declared as part of a schema parameter, it (and none of its ancestors) should appear in `generalLabels`.
- **No Duplicate Parameterization Between Generator and View:** When a generator maps a label to configure the mathematical properties of the generated problem payload, that label (and none of its ancestors/descendants) should be queried in the schema of the matching view. The view must rely purely on the generated problem payload (e.g. `problem.data`) rather than querying the ontology itself to determine parameters already processed by the generator.
- **Prefer Simple Arrays for Schemas**: When mapping a parameter to a set of compatible standard labels (e.g., arrangements), prefer defining a simple array (e.g., `arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]`) over using resolvers. Note that fallbacks for missing labels are generated generically already and don't require specific resolvers.

---

## 2. Reviewing Generators' specs

Generator specs reside under `src/generators/<moduleName>/spec.ts`. Their schema must define only the properties that parameterize the abstract math logic.

### Clean Up Actions:
- **Remove all visual/layout parameters:** Delete any configuration properties that influence visual representation or layout modes (e.g., `isReverse`, `layoutStyle`, `themeColor`).
- **Retain and refine mathematical parameters:** Only keep schema parameters that define the abstract mathematical properties of the problem:
  - `range` (resolved via `resolveRangeFromLabels`)
  - `includeZero` (resolved via `hasLabel(Scope.NumbersWithZero)`)
  - `allowNegatives` (resolved via `hasLabel(Scope.NumbersWithNegatives)`)
  - `useDecimals` (resolved via `hasLabel(Scope.NumbersWithDecimals)`)
  - `attribute` / `relation` (resolved via `selectExactMatch`)

### Examples of Bad vs. Good for Generators:

#### Example 1: Number Representation (Counting)
- 🛑 **Bad (Visual presentation parameter in generator spec):**
  ```typescript
  export const CountingSchema = {
      showTenFrame: [ [Scope.TenFrame], hasLabel(Scope.TenFrame) ], // Visual representation (ten frame vs digit) belongs in the view spec!
      range: [ ... ]
  };
  ```
- 🟢 **Good (Strictly mathematical parameters):**
  ```typescript
  export const CountingSchema = {
      range: [ ... ]
  };
  ```

#### Example 2: Shape Classification (Geometry)
- 🛑 **Bad (Visual parameter in generator spec):**
  ```typescript
  export const GeometryIdentitySchema = {
      useColor: [ [Scope.ColoredShapes], hasLabel(Scope.ColoredShapes) ], // Visual styling like color belongs in the view spec!
      shapeType: [ [Scope.Triangle, Scope.Square], selectExactMatch ]
  };
  ```
- 🟢 **Good (Strictly mathematical shape properties):**
  ```typescript
  export const GeometryIdentitySchema = {
      shapeType: [ [Scope.Triangle, Scope.Square], selectExactMatch ]
  };
  ```

---

## 3. Reviewing Views' specs

View specs reside under `src/visuals/views/<viewName>/spec.ts`. Their schema must define only the properties that parameterize visual representation or interactive layout.

### Clean Up Actions:
- **Remove all mathematical parameters:** Delete any schema properties that deal with number ranges (`range`), decimal formats (`useDecimals`), zero inclusion (`includeZero`), or mathematical operations.
- **Retain and refine visual/layout parameters:** Keep and describe visual layout configurations:
  - `isReverse` (to switch between reading/reception and drawing/articulation modes, e.g. drawing hands on a clock vs reading them).
  - Layout formats, styling modes, or button configurations.

### Examples of Bad vs. Good for Views:

#### Example 1: Number Representation (Counting)
- 🛑 **Bad (Math/range parameter in view spec):**
  ```typescript
  export const CountingViewSchema = {
      showTenFrame: [ ... ],
      range: [ ... ] // Range belongs in the generator spec!
  };
  ```
- 🟢 **Good (Strictly visual/representation parameters):**
  ```typescript
  export const CountingViewSchema = {
      showTenFrame: [ [Scope.TenFrame], hasLabel(Scope.TenFrame) ], // Visual representation layout flag
      arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement] // Visual layout/arrangement options
  };
  ```

#### Example 2: Shape Classification View (Geometry)
- 🛑 **Bad (Shape type selectors in view spec):**
  ```typescript
  export const GeometryIdentityViewSchema = {
      isReverse: [ ... ],
      shapeType: [ ... ] // Defining which shapes to generate belongs in the generator spec!
  };
  ```
- 🟢 **Good (Strictly visual rendering parameters):**
  ```typescript
  export const GeometryIdentityViewSchema = {
      isReverse: [ ... ] // Determines whether the student reads the label or draws/selects the shape
  };
  ```
