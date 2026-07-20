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
*   **Execution**: `npm run generate:dataset [moduleName] [--training-only]`
*   **Function**: Bootstraps Playwright, dynamically loads all generators and views by scanning their directories, loads target specifications from the CCSS specs (`config/spec/ccss/`), filters compatible targets using the ontology solver (`doesGeneratorSupportCompetency`), and captures screenshots headlessly.
*   **Decoupled Seeding & Proportional Split**: 
    - **Training Set**: Uses the base random seed (`seed`) to generate problems.
    - **Validation Set**: Generates validation problems proportionally based on the split ratio (using a validation seed offset).
    - **Dynamic View Matching**: Automatically queries compatible views for each problem by matching standard targets and generated problem dimensions using view spec constraints and label taxonomy.
*   **`--training-only` Flag**: If specified, skips validation problem generation, validation image rendering, and validation metadata writing.
*   **Clearing Logic**: If no module is specified, it wipes the entire `out/dataset/` directory. If a specific module is provided, it clears only `out/dataset/train/<module>` and `out/dataset/validation/<module>`.

### `src/scripts/generate-coverage-report.ts`
*   **Execution**: `npm run report:coverage`
*   **Function**: Scans all `meta.json` files in the generated dataset. It outputs a markdown report (`out/dataset/coverage-report.md`) detailing absolute frequencies of individual labels and the percentage breakdown of unique label combinations.

### `src/scripts/validate-dataset.ts`
*   **Execution**: `npx vite-node src/scripts/validate-dataset.ts [moduleName]`
*   **Function**: An automated Visual QA pipeline. It uses the Gemini API to analyze a representative random selection of Q/A image pairs from the dataset against rules defined in `global-checklist.md` and module-specific `checklist.md` files.

## 4. Module Structure Breakdown

Adding content means creating two interconnected directories: a Generator and a Renderer. Both strictly decouple pedagogical label resolution from core business logic using schemas and resolvers.

### The Generator Module (`src/generators/<module>/`)
*   **`generator.ts`**: Implements `ProblemGenerator<TData, TConfig>`. It contains **no label parsing logic**. It is a pure mathematical function that takes a strongly-typed `config` object and returns a `ProblemStub` or `null`.
*   **`spec.ts`**: The bridge to pedagogy. Exports `spec: GeneratorSpec` (broad matching capabilities), `GeneratorSchema` (defining how to map ontology labels to the typed `config` object using functional resolvers), and `Config` (the extracted type of the schema).
*   **`generator.test.ts`**: A Vitest suite. Deeply tests edge cases of the generator by passing explicit `config` mocks.
*   **`checklist.md`**: (Optional) Visual QA LLM instructions.

#### Generator Design Guidelines
1. **Purely Mathematical**: The generated problem data payload (`data`) must contain only raw mathematical attributes.
2. **Schema-Driven Resolvers & Strict Parameterization**: Pedagogical mapping is declarative. Total supported labels for a module are calculated dynamically by unionizing the general capabilities declared in `spec.generalLabels` and the parameterized capabilities extracted from the schema properties. 
    - Schemas (`ConfigSchema`) accept values as: simple arrays of labels (`readonly string[]`), tuples binding constraints to a resolver (`[readonly string[], ResolverFn]`), or pure functions that execute at runtime without binding capability labels (`ResolverFn`).
    - **Do NOT** duplicate schema-bound constraints (e.g., specific ranges, object arrangements) in `spec.generalLabels`. Keep `generalLabels` strictly for general capabilities (e.g., `Area.Numeration`, `Scope.IntegerNumbers`).

### The Visual Renderer (`src/visuals/`)
*   **`src/visuals/views/<renderer>/`**:
    - **`view.html`**: The base HTML template containing a mount point for React.
    - **`view.tsx`**: Exports the React component wrapped in `withConfig(ViewSchema, Component)`. The core component itself (`<Name>Core`) is a pure stateless function taking `{ config, payload }`. It does not parse labels.
    - **`spec.ts`**: Exports `spec: ViewSpec` (matching capabilities), `ViewSchema` (defining mapping to visual config), and `ViewConfig`.
*   **`src/visuals/components/`**: Reusable shared React elements (such as `TenFrame.tsx`).
*   **`src/visuals/helpers/`**: Shared layout rendering calculations (such as `counting-helpers.ts`).

## 5. How to Enrich the Dataset (Step-by-Step Guide)

To add a new mathematical concept or visual style to the dataset, follow this step-by-step workflow:

### Step 1: Define the Pedagogy
Add the target specifications representing the CCSS curriculum standards (e.g. `1.G.A.3-fraction-halves`) to the appropriate grade level file in `config/spec/ccss/` (like `kindergarten.ts` or `grade-01.ts`).

### Step 2: Analyze Matchings
Run `npx vite-node src/scripts/show-matching-stats.ts` to see if the new targets map to any existing generator or views.

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

### Step 8: Final Verification
1. Run `npx vite-node src/scripts/show-matching-stats.ts` to confirm that the ontology dynamically binds your targets to your generator and views.
2. Run `npm run generate:dataset [moduleName]` to test local dataset generation.
