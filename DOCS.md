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
*   `config`: The `RenderConfig` containing `viewId` and `visualParams`.
*   `isSolutionView`: A boolean instructing the renderer to display the problem with or without the solution filled in.

To ensure end-to-end type safety between problem generators (which run in Node.js) and the React views (which run in the browser headlessly), the system utilizes:
1. **`ViewTypeMap`** (defined in [problems.ts](file:///c:/Users/silen/Documents/EduGraph/edugraph-content/src/types/problems.ts)): A central contract mapping visual view identifiers (like `'operations-vertical'`) to their expected mathematical data structure (like `ArithmeticStandardProblem`).
2. **`ViewRenderPayload<TViewId>`** (defined in [ml-engine.ts](file:///c:/Users/silen/Documents/EduGraph/edugraph-content/src/types/ml-engine.ts)): A utility type that automatically resolves to the correct type-safe `RenderPayload` for a specific view ID, eliminating the need for manual type assertions (`as ...`) within the view components.

**Environment Separation & Mapping:**
Because the Node orchestrator and generator configurations do not statically import the React view files (which are dynamically bundled by Vite and loaded headlessly inside Playwright via URLs), TypeScript cannot automatically inspect `window.renderView` in the browser code from the Node side. `ViewTypeMap` serves as a shared bridge, allowing the compiler to statically verify that generators specify view names compatible with the data structures the views expect to render.

### Determinism
### Determinism
To ensure that the Question (`_mode-Q`) and Solution (`_mode-S`) renderings match exactly (especially when visual parameters dictate randomized placement, like scattering counting objects), the system relies on global seeded randomness via `src/lib/random.ts`. The renderer typically seeds the RNG using the `problem.id`.

## 3. Directory & Script Reference

### `src/scripts/generate-dataset.ts`
The primary pipeline orchestrator.
*   **Execution**: `npm run generate:dataset [moduleName] [--training-only]`
*   **Function**: Bootstraps Playwright, loads the specified generator(s) and their configuration from `DatasetConfig`, runs the decoupled training and validation generation phases, serves the `src/visuals/views/` renderers via Vite, and captures headless screenshots.
*   **Decoupled Seeding & Proportional Split**: 
    - **Training Set**: Uses the base random seed (`seed`) to generate `countPerPermutation` problems per permutation.
    - **Validation Set**: Uses a validation seed offset (`seed + 10000`) and generates validation problems proportionally based on the split ratio (generating a validation problem for every Nth training problem).
    - **Shifted Visual Cycling**: Problems are mapped to a single view by cycling through the `visualDistribution` list (ensuring smaller dataset sizes). The validation cycle is shifted by an index offset of `1`, guaranteeing that validation tests a different layout than training for each permutation standard.
*   **`--training-only` Flag**: If specified, skips validation problem generation, validation image rendering, and validation metadata writing.
*   **Clearing Logic**: If no module is specified, it wipes the entire `out/dataset/` directory. If a specific module is provided, it clears only `out/dataset/train/<module>` and `out/dataset/validation/<module>`.

### `src/scripts/generate-coverage-report.ts`
*   **Execution**: `npm run report:coverage`
*   **Function**: Scans all `meta.json` files in the generated dataset. It outputs a markdown report (`out/dataset/coverage-report.md`) detailing absolute frequencies of individual labels and the percentage breakdown of unique label combinations.

### `src/scripts/validate-dataset.ts`
*   **Execution**: `npx vite-node src/scripts/validate-dataset.ts [moduleName]`
*   **Function**: An automated Visual QA pipeline. It uses the Gemini API to analyze a representative random selection of Q/A image pairs from the dataset against rules defined in `global-checklist.md` and module-specific `checklist.md` files.

### `src/lib/dataset-permutation-builder.ts`
A fluent API used in permutation files to generate exhaustive configurations. It allows developers to cleanly multiply arrays of semantic labels with visual parameters (e.g., generating instances that apply `Area.Addition` across three different `blankPart` configurations).

## 4. Module Structure Breakdown

Adding content means creating two interconnected directories: a Generator and a Renderer.

### The Generator Module (`src/generators/<module>/`)
*   **`generator.ts`**: Implements `ProblemGenerator`. It takes a `GeneratorInput` (labels and constraints) and returns a `ProblemStub` or `null`. Returning `null` (e.g., if a constraint cannot be mathematically satisfied) triggers an automatic retry in the orchestrator.
*   **`permutations.ts`**: Exports `generationConfig: DatasetGenerationConfig` (defining the seed, count, and mathematical permutations list). It contains **zero** details about split ratios or visual renderers.
*   **`generator.test.ts`**: A Vitest suite. Must deeply test edge cases (e.g., digit boundaries, non-negative constraints) to ensure the constraint satisfier behaves correctly.
*   **`checklist.md`**: (Optional) Specific instructions for the Visual QA LLM regarding how this specific module should visually render.

### The Visual Renderer (`src/visuals/`)
*   **`src/visuals/views/<renderer>/`**:
    - **`view.html`**: The base HTML template containing a mount point for React.
    - **`view.tsx`**: React entry point implementing `window.renderView = (payload: RenderPayload) => { ... }`. It uses React to render components into the DOM.
*   **`src/visuals/components/`**: Reusable shared React elements (such as `TenFrame.tsx`) that help keep visual views DRY.
*   **`src/visuals/helpers/`**: Shared layout rendering calculations (such as `counting-helpers.ts`).

## 5. How to Enrich the Dataset (Step-by-Step Guide)

To add a new mathematical concept or visual style to the dataset:

### Step 1: Scaffolding
1. Create a new directory in `src/generators/` (e.g., `src/generators/fractions`).
2. Create a corresponding renderer directory in `src/visuals/views/` (e.g., `src/visuals/views/fractions-pie`).

### Step 2: Defining the Pedagogy (`permutations.ts`)
Write the `permutations.ts` file to export the mathematical `generationConfig` specifying permutations generated using `DatasetPermutationBuilder`.

### Step 3: Writing the Generator (`generator.ts`)
Implement the mathematical logic. Ensure that the properties of the generated problem strictly adhere to the requested labels. If a label requests `Area.Addition`, the problem must use addition.

### Step 4: Writing Tests (`generator.test.ts`)
Write robust unit tests verifying that the generator outputs correct math and respects bounds (e.g., resulting fractions do not exceed 1 if constrained). Run `npm run test` to verify.

### Step 5: Visual Implementation (`view.*`)
Implement the component logic in `src/visuals/views/<renderer>/view.tsx`.
*   Ensure that `isSolutionView: false` visually hides the answer (or renders an empty box/placeholder).
*   Ensure that `isSolutionView: true` renders the exact same layout but with the answer visible.
*   Use `setSeed(problem.id)` before making randomized layout decisions.

### Step 6: Registration
1.  Add a link to your new renderer in `src/index.html` for easy debugging.
2.  Open [src/config/dataset.config.ts](file:///c:/Users/silen/Documents/EduGraph/edugraph-content/src/config/dataset.config.ts) and register the new module under `DatasetConfig.modules` with its generator class, splits ratio, and visual distribution mapping of views and parameters.
3. Run `npm run generate:dataset fractions` to test the pipeline locally.
