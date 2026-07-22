# EduGraph Content: Technical Documentation

This document provides a comprehensive technical overview of the EduGraph Content ML Dataset Generator. It is designed to guide developers and AI agents in understanding the system architecture, script orchestration, and the process for adding new educational content modules.

## 1. Architecture Overview

### Label-Driven Generation
The core philosophy of this system is **Label-Driven Generation**. Pedagogical labels (derived from the EduGraph ontology, e.g., `Scope.IntegersWithZero`, `Area.Addition`) strictly dictate the mathematical properties of the generated problems. The system does not generate a problem and *then* label it; rather, it receives a set of constraints (labels) and acts as a constraint satisfier to generate a math problem that mathematically proves those labels.

### The Three Pillars
The architecture is divided into three distinct layers:
1.  **The Brain (`src/generators/`)**: Handles the abstract mathematical logic, permutation definition, and label constraint satisfaction. It has no knowledge of how a problem is visualized.
2.  **The Body (`src/visuals/`)**: HTML/CSS/TS renderers that run in the browser. It is organized into `views/` (individual exercise layouts), `components/` (shared UI elements), and `helpers/` (shared layout/math algorithms).
3.  **The Heart (`src/scripts/`)**: Node.js scripts orchestrating Playwright (headless browser). These scripts unite the Brain and the Body, generating problems, injecting them into the renderers, taking screenshots, and compiling the metadata.

## 2. Core Concepts & Types

### `AbstractProblem` & `ProblemStub`
Defined in `src/types/ml-engine.ts`, these types represent the JSON structure of a math problem.
*   **`ProblemStub`**: The raw output of a Generator (`{ id, data }`).
*   **`AbstractProblem`**: The fully realized object injected into the dataset, containing the `ProblemStub`, the `type`, and the resolved array of `tags` (labels).

### `RenderPayload` & `ViewTypeMap`
The data contract passed from the Playwright orchestrator into the browser's `window.renderView(payload)`. It contains:
*   `problem`: The `AbstractProblem`.
*   `viewId`: The string identifier of the view.
*   `labels`: Raw pedagogical tags (used by the HOC wrapper, not the pure view).
*   `constraints`: Raw configuration constraints.
*   `isSolutionView`: A boolean instructing the renderer to display the problem with or without the solution filled in.

To ensure end-to-end type safety between problem generators (which run in Node.js) and the React views (which run in the browser headlessly), the system utilizes:
1. **`ViewTypeMap`** (defined in [problems.ts](file:///c:/Users/silen/Documents/EduGraph/edugraph-content/src/types/problems.ts)): A central contract mapping visual view identifiers (like `'operations-vertical'`) to their expected mathematical data structure (like `ArithmeticStandardProblem`).
2. **`ViewRenderPayload<TViewId>`** (defined in [ml-engine.ts](file:///c:/Users/silen/Documents/EduGraph/edugraph-content/src/types/ml-engine.ts)): A utility type that automatically resolves to the correct type-safe `RenderPayload` for a specific view ID, eliminating the need for manual type assertions (`as ...`) within the view components.

**Environment Separation & Mapping:**
Because the Node orchestrator and generator configurations do not statically import the React view files (which are dynamically bundled by Vite and loaded headlessly inside Playwright via URLs), TypeScript cannot automatically inspect `window.renderView` in the browser code from the Node side. `ViewTypeMap` serves as a shared bridge, allowing the compiler to statically verify that generators specify view names compatible with the data structures the views expect to render.

### Determinism
To ensure that the Question (`_mode-Q`) and Solution (`_mode-S`) renderings match exactly (especially when visual parameters dictate randomized placement, like scattering counting objects), the system relies on global seeded randomness via `src/lib/random.ts`. The renderer typically seeds the RNG using the `problem.id`.

## 3. Directory & Script Reference

#### `src/scripts/generate-dataset.ts`
The primary pipeline orchestrator.
*   **Execution**: `npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--training-only]`
*   **Function**: Bootstraps Playwright, dynamically loads all generators and views by scanning their directories, loads target specifications from the spec module (e.g. `src/spec/ccss/` or `src/spec/test/`), filters compatible targets using the ontology solver (`doesGeneratorSupportCompetency`), and captures screenshots headlessly.
*   **Decoupled Seeding & Proportional Split**: 
    - **Training Set**: Uses the base random seed (`seed`) to generate problems.
    - **Validation Set**: Generates validation problems proportionally based on the split ratio (using a validation seed offset).
    - **Dynamic View Matching**: Automatically queries compatible views for each problem by matching standard targets and generated problem dimensions using view spec constraints and label taxonomy.
*   **`--training-only` Flag**: If specified, skips validation problem generation, validation image rendering, and validation metadata writing.
*   **Clearing Logic**: If no module is specified, it wipes the entire `out/dataset/` directory. If a specific module is provided, it clears only `out/dataset/train/<module>` and `out/dataset/validation/<module>`.

### `src/scripts/generate-coverage-report.ts`
*   **Execution**: `npm run report:coverage -- [--spec=Z]`
*   **Function**: Scans all `metadata.jsonl` files in the generated dataset. It outputs a markdown report (`out/dataset/coverage-report.md` or `out/dataset-test/coverage-report.md`) detailing absolute frequencies of individual labels and the percentage breakdown of unique label combinations.

### `src/scripts/validate-dataset.ts`
*   **Execution**: `npx vite-node src/scripts/validate-dataset.ts --generator=X --view=Y [--dataset=Z] [--force]`
*   **Function**: An automated Visual QA pipeline. It uses the Gemini API to analyze Q/A image pairs from the dataset against rules defined in cascading `checklist.md` files across generator and view module directories. It dynamically reads from `out/dataset-test/` when `--dataset=test` is specified, or `out/dataset/` by default.

### `src/scripts/validate-specs.ts`
*   **Execution**: `npm run check:specs`
*   **Function**: An automated spec validation script. It checks all `spec.ts` files across both generators and views, flagging (1) overlapping General Labels / parameter queries, and (2) duplicate parameterizations where a view re-specifies variables already computed by its matching generator. Detailed logs are outputted to `temp/check_output.txt`.

### Type Checking (`npm run check:types`)
*   **Execution**: `npm run check:types` (or `npx tsc --noEmit`)
*   **Function**: Runs the TypeScript compiler in non-emitting mode (`tsc --noEmit`) to find and report type errors across all generators, renderers, scripts, schemas, and test suites.

## 4. Module Structure Breakdown

Adding content means creating two interconnected directories: a Generator and a Renderer. Generators and views are organized into a 1-level category sub-directory structure (e.g. `src/generators/arithmetic/arithmetic-ops-pairs` and `src/visuals/views/operations/operations-vertical`). A directory is considered a **leaf module** if and only if it contains a `spec.ts` file. Top-level single-purpose modules (such as `ordering` or `time`) reside directly at the top level of `src/generators/` or `src/visuals/views/`.

Leaf module directory names retain their full module prefix (e.g., `arithmetic-ops-pairs`, `operations-vertical`). Generic module discovery is performed dynamically up to 1-level deep via `findLeafModules` in `src/lib/module-resolver.ts`.

### The Generator Module (`src/generators/[<category>/]<module>/`)
*   **`generator.ts`**: Implements `ProblemGenerator<TData, TConfig>`. It contains **no label parsing logic**. It is a pure mathematical function that takes a strongly-typed `config` object and returns a `ProblemStub` or `null`.
    - **Configuration Validation**: Must import `validateConfigFields` from `../../../lib/errors.ts` (with correct relative depth matching the sub-directory structure) and call it at the beginning of `generate(config)` with the required configuration parameters. It must throw a `GeneratorValidationError` if executed with missing/empty configurations (do not use silent internal fallbacks).
    - **Ontology Tag Propagation**: Any runtime choices representing competencies (e.g. specific shape chosen, relation chosen) must be returned in the `tags` array of `ProblemStub` so they are not lost. Do NOT duplicate any tags or parameters that are already provided as part of the configuration parameters (as those are automatically captured in `consumedLabels` by the ontology mapping layer).
*   **`spec.ts`**: The bridge to pedagogy. Exports `spec: GeneratorSpec` (broad matching capabilities), `GeneratorSchema` (defining how to map ontology labels to the typed `config` object using functional resolvers), and `Config` (the extracted type of the schema).
*   **Parent Category `helpers.ts`**: Shared mathematical helpers or data structures common to sibling generator modules within a category can be placed in `src/generators/<category>/helpers.ts` and imported relatively (`import { ... } from '../helpers.ts'`).
*   **`generator.test.ts` / `spec.test.ts`**: Vitest suites to verify correctness.
    - `generator.test.ts` deeply tests edge cases of the generator by passing explicit `config` mocks. It must cover mathematical boundaries and edge-cases (e.g. division by zero, invalid target ranges, subtraction yielding negative/zero values under non-negative constraints).
    - `spec.test.ts` verifies tag resolution using `generateWithLabels` from `../../../lib/utils.ts`.
    - Both/either must include a test asserting that calling `generate` with an empty config throws an exception (e.g., `expect(() => generator.generate({})).toThrow()`).
*   **`checklist.md`**: Pedagogical/Mathematical verification list. Acts as the validation criteria for the abstract mathematical data. It **must not** contain any visual layout, coordinates, styles, colors, or CSS parameters. See the Checklist Design Rules section below for detailed formatting constraints.

### The Visual Renderer (`src/visuals/`)
*   **`src/visuals/views/[<category>/]<renderer>/`**:
    - **`view.html`**: The base HTML template containing a mount point for React.
    - **`view.tsx`**: Exports the React component wrapped in `withConfig(ViewSchema, Component)`. The core component itself (`<Name>Core`) is a pure stateless function taking `{ config, payload }`. It does not parse labels.
        - **Strict Payload Validation**: Must import `validateProblemData` from `../../../helpers/validation.ts` (with correct relative depth matching the sub-directory structure) and call it at the beginning of the view component with the specific list of required fields accessed from `problem.data`.
        - **Graceful Error Recovery**: If validation or range checks fail (e.g. coordinates or dimensions exceed visual limits), the view must throw a `ViewValidationError`. This is caught by the `ErrorBoundary` in the `withConfig` wrapper to display a standardized error card, preventing browser crashes, hangs, or infinite rendering loops during headless generation.
        - **No Silent Fallbacks**: Remove all local silent fallbacks (e.g. `data.shape || 'circle'`, `config.arrangement || 'scattered'`). Consume resolved configuration parameters directly from the `config` prop and `problem.data` directly, relying on `withConfig` to guarantee they resolve to non-null and correctly-typed values.
    - **`spec.ts`**: Exports `spec: ViewSpec` (matching capabilities), `ViewSchema` (defining mapping to visual config), and `ViewConfig`.
    - **Parent Category `helpers.ts` / Components**: Shared visual helpers or sub-components common to sibling views within a category can be placed at the category level (e.g. `src/visuals/views/operations/helpers.ts`) and imported relatively.
    - **`checklist.md`**: Visual layout, rendering, and interaction verification list. Used by Visual QA to check for elements positioning, SVG structures, rendering overflows, and Question (`_mode-Q`) vs. Solution (`_mode-S`) mode styling. It **must not** contain abstract mathematical generation logic. See the Checklist Design Rules section below for detailed formatting constraints.
*   **`src/visuals/components/`**: Reusable shared React elements across all view categories (such as `TenFrame.tsx`).
*   **`src/visuals/helpers/`**: Shared layout rendering calculations across all view categories (such as `counting-helpers.ts`).

## 4b. Specification Design Rules & Validation Checks

When designing or updating `spec.ts` files, you must strictly follow these rules:

1. **Separation of Concerns**:
   - **Generator Specs**: Map ontology labels **only** to abstract mathematical configurations (e.g. `range`, `includeZero`, `allowNegatives`, `useDecimals`, `attribute`, `relation`).
   - **View Specs**: Map ontology labels **only** to visual/layout configurations (e.g. `isReverse`, `arrangement`, `showTenFrame`).
2. **Resolver Reusability**:
   - All general resolver functions (such as `hasLabel`, `selectExactMatch`, `extractFirstMatch`) must be imported and reused from `src/lib/resolvers.ts`. Do not define custom resolvers inline.
   - Resolver functions must be passed as references (or output of curried factory functions) to the schema arrays, and not executed prematurely.
3. **General Labels vs. Parameter Labels Overlap**:
   - There must be zero overlap (including taxonomic ancestors via `partOf`) between the labels checked inside schema parameters and the spec's `generalLabels`. Specifically, when a label is declared as part of a schema parameter, it (and none of its ancestors) should appear in `generalLabels`.
4. **No Duplicate Parameterization**:
   - When a generator maps a label to configure the mathematical properties of a problem payload, that label (and none of its ancestors/descendants) should be queried in the schema of the matching view. The view must rely purely on the generated problem payload (e.g. `problem.data`) rather than querying the ontology itself.
5. **Prefer Simple Arrays for Schemas**:
   - When mapping a parameter to a set of compatible standard labels (e.g. arrangements), prefer defining a simple array (e.g. `arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]`) over using resolvers. Fallbacks for missing labels are generated generically already and don't require specific resolvers.

## 4c. Checklist Design Rules & Hierarchical Loading

When writing or updating `checklist.md` files (which are used by the automated visual QA or manual checks), you must strictly follow these rules:

1. **Hierarchical Organization**:
   Checklists are concatenated and evaluated across levels:
   - Parent Category `checklist.md` (e.g. `src/generators/arithmetic/checklist.md` - applies to all sub-modules under that category).
   - Leaf Module `checklist.md` (e.g. `src/generators/arithmetic/arithmetic-ops-pairs/checklist.md` - applies specifically to that leaf module).
   Shared rules across sibling modules should be generalized up to parent category checklists to prevent duplication.
2. **Separation of Concerns**:
   - **Generator Checklists**: Specify *only* abstract mathematical and logic rules. Remove all layout/visual criteria (e.g., coordinates, shapes, colors, SVGs, button states, ruler bands, CSS styling, or answer box highlights).
   - **View Checklists**: Specify *only* visual layout, rendering, and interaction rules. Remove all abstract logic criteria (e.g., mathematical generation algorithms, RNG selection logic, ontology/tag resolution).
3. **Conciseness**:
   - Focus on the most important validation aspects. Do not include excessive edge cases.
4. **Unaware of Parameterization**:
   - Assume that the validation mechanism is unaware of parameterization. Do not include conditional validation aspects (e.g., "If configuration parameter X is true, then...").
5. **Question Mode (`_mode-Q`) vs. Solution Mode (`_mode-S`)**:
   - View checklists must clearly distinguish between Question Mode (where answers are blank, inputs are empty, or elements are unselected) and Solution Mode (where correct answers are filled in, highlighted, or selected).

## 5. How to Enrich the Dataset (Step-by-Step Guide)

To add a new mathematical concept or visual style to the dataset, follow this step-by-step workflow:

### Step 1: Define the Pedagogy
Declare the target specifications in the appropriate grade level file in `src/spec/ccss/` (like `kindergarten.ts` or `grade-01.ts`) using the `DatasetPermutationBuilder`:

- Work from the **leaf nodes** of the CCSS tree (`public/coverage/ccss-tree.json`). A single leaf standard often bundles several competencies — create one builder per competency.
- Use `.addLabels([...])` for the label set shared by all permutations of a competency and `.applyLabelVariants([...])` for orthogonal dimensions (e.g. number ranges, `Scope.NumbersWithZero` vs. `Scope.NumbersWithoutZero`, shapes, relations). Map the builder to targets with the shared `toTargets('<CCSS-id>-<slug>', builder)` helper from `src/lib/dataset-permutation-builder.ts`, so ids read like `K.CC.B.5-how-many-0`.
- If a competency cannot be expressed (missing ontology label) or has no generator/view support, **do not stretch labels to force a match**. Instead, leave a `// TODO [<CCSS-id>]:` comment describing the gap together with a commented-out reference builder/permutation. See `src/spec/ccss/kindergarten.ts` for examples.

### Step 2: Analyze Matchings
Run `npx vite-node src/scripts/show-matching-stats.ts --spec=ccss` to see if the new targets map to any existing generator or views.

### Step 3: Decide Next Steps
- **Case A: Both Match (100% Match):** If the new targets already map to an existing generator and a compatible view, **nothing else needs to be done**! The dataset pipeline will automatically generate problems and render images for these targets.
- **Case B: No Matching Generator:** If the target matches no generator, you must create a new generator module under `src/generators/` (see Scaffolding & Implementation below).
- **Case C: No Matching View:** If the target matches no view, you must create a new view layout under `src/visuals/views/` (see Scaffolding & Implementation below).
- **Case D: Matches Exist but Lacks Capabilities:** If matching modules exist but do not support the target's specific labels, you must extend their `spec.ts` (supportedLabels/constraints) and logic to support them.

### Step 4: Scaffolding (If Needed)
If a new generator or view is required:
1. Create a directory in `src/generators/` (e.g., `src/generators/fractions`).
2. Create a corresponding renderer directory in `src/visuals/views/` (e.g., `src/visuals/views/fractions-pie`).
3. Add a link to your new renderer in `src/index.html` for easy browser preview.

### Step 5: Declaring Capabilities (`spec.ts`)
Create or update the `spec.ts` files for both your generator and visual view:
- The generator spec declares the broader labels and scopes it is capable of satisfying.
- The view spec declares the layout labels it supports, its physical bounds (like standard coordinate range constraints), and its zero behavior (`Scope.NumbersWithZero` vs. `Scope.NumbersWithoutZero`).

### Step 6: Implementation
- **Generator (`generator.ts`)**: Implement the mathematical logic. Ensure that the properties of the generated problem strictly adhere to the requested labels. If a label requests `Area.Addition`, the problem must use addition.
- **View (`view.tsx` / components)**: Implement the visual component logic in `src/visuals/views/<renderer>/view.tsx`.
  - Ensure that `isSolutionView: false` visually hides the answer (or renders an empty box/placeholder).
  - Ensure that `isSolutionView: true` renders the exact same layout but with the answer visible.
  - Use `setSeed(problem.id)` before making randomized layout decisions.

### Step 7: Tests (`generator.test.ts`)
Write robust unit tests verifying that the generator outputs correct math and respects bounds. Run `npm run test` to verify.

### Step 7b: Targeted Testing via Test Specs
To visually verify and test both your generator and view modules through the actual image-generation pipeline, you should use the `test` specs module:
1. **Extend Test Specs**: Add minimal test permutations for your module to the `test` specs directory (`src/spec/test/`). Use `DatasetPermutationBuilder` to build these permutations programmatically rather than manually writing static arrays.
2. **Run Targeted Dataset Generation**: Test combinations of `--spec`, `--generator`, and `--view` to generate and render only the specific views and problems you want to check:
   ```bash
   npm run generate:dataset -- --spec=test --generator=arithmetic --view=operations-vertical --training-only
   ```
   This allows you to quickly inspect the generated output under `out/dataset/train/` without running the entire dataset generation.

### Step 8: Final Verification
1. Run `npm run check:types` (or `npx tsc --noEmit`) to verify zero TypeScript typing errors across all generators, views, and scripts.
2. Run `npx vite-node src/scripts/show-matching-stats.ts --spec=ccss` (or `--spec=test`) to confirm that the ontology dynamically binds your targets to your generator and views.
3. Run `npm run generate:dataset -- --spec=ccss --generator=[moduleName]` to test local dataset generation.
