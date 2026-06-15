# EduGraph Content: Technical Documentation

This document provides a comprehensive technical overview of the EduGraph Content ML Dataset Generator. It is designed to guide developers and AI agents in understanding the system architecture, script orchestration, and the process for adding new educational content modules.

## 1. Architecture Overview

### Label-Driven Generation
The core philosophy of this system is **Label-Driven Generation**. Pedagogical labels (derived from the EduGraph ontology, e.g., `Scope.IntegersWithZero`, `Area.Addition`) strictly dictate the mathematical properties of the generated problems. The system does not generate a problem and *then* label it; rather, it receives a set of constraints (labels) and acts as a constraint satisfier to generate a math problem that mathematically proves those labels.

### The Three Pillars
The architecture is divided into three distinct layers:
1.  **The Brain (`src/generators/`)**: Handles the abstract mathematical logic, permutation definition, and label constraint satisfaction. It has no knowledge of how a problem is visualized.
2.  **The Body (`src/exercises/`)**: HTML/CSS/TS renderers that run in the browser. They receive abstract problem data and convert it into a visual DOM representation.
3.  **The Heart (`src/scripts/`)**: Node.js scripts orchestrating Playwright (headless browser). These scripts unite the Brain and the Body, generating problems, injecting them into the renderers, taking screenshots, and compiling the metadata.

## 2. Core Concepts & Types

### `AbstractProblem` & `ProblemStub`
Defined in `src/types/ml-engine.ts`, these types represent the JSON structure of a math problem.
*   **`ProblemStub`**: The raw output of a Generator (`{ id, data }`).
*   **`AbstractProblem`**: The fully realized object injected into the dataset, containing the `ProblemStub`, the `type`, and the resolved array of `tags` (labels).

### `RenderPayload`
The data contract passed from the Playwright orchestrator into the browser's `window.renderExercise(payload)`. It contains:
*   `problem`: The `AbstractProblem`.
*   `config.visualParams`: Rendering instructions (e.g., `{ blankPart: 'answer', colors: 'vibrant' }`).
*   `isAnswerView`: A boolean instructing the renderer to display the problem with or without the solution filled in.

### Determinism
To ensure that the Question (`_mode-Q`) and Answer (`_mode-A`) renderings match exactly (especially when visual parameters dictate randomized placement, like scattering counting objects), the system relies on global seeded randomness via `src/lib/random.ts`. 
The renderer typically seeds the RNG using the `problem.id`.

## 3. Directory & Script Reference

### `src/scripts/generate-dataset.ts`
The primary pipeline orchestrator.
*   **Execution**: `npm run generate:dataset [moduleName]`
*   **Function**: Bootstraps Playwright, loads the specified generator(s), generates abstract problems according to the permutations config, serves the `src/exercises/` renderers via Vite, and captures headless screenshots.
*   **Clearing Logic**: If no module is specified, it wipes the entire `out/dataset/` directory. If a specific module is provided, it performs a surgical wipe of only `out/dataset/train/<module>` and `out/dataset/val/<module>`.

### `src/scripts/generate-coverage-report.ts`
*   **Execution**: `npm run report:coverage`
*   **Function**: Scans all `meta.json` files in the generated dataset. It outputs a markdown report (`out/dataset/coverage-report.md`) detailing absolute frequencies of individual labels and the percentage breakdown of unique label combinations.

### `src/scripts/validate-dataset.ts`
*   **Execution**: `npm run test:vqa [moduleName]` (Implicit execution via Node)
*   **Function**: An automated Visual QA pipeline. It uses the Gemini API to analyze a representative random selection of Q/A image pairs from the dataset against rules defined in `global-checklist.md` and module-specific `checklist.md` files.

### `src/lib/dataset-permutation-builder.ts`
A fluent API used in permutation files to generate exhaustive configurations. It allows developers to cleanly multiply arrays of semantic labels with visual parameters (e.g., generating instances that apply `Area.Addition` across three different `blankPart` configurations).

## 4. Module Structure Breakdown

Adding content means creating two interconnected directories: a Generator and a Renderer.

### The Generator Module (`src/generators/<module>/`)
*   **`generator.ts`**: Implements `ProblemGenerator`. It takes a `GeneratorInput` (labels and constraints) and returns a `ProblemStub` or `null`. Returning `null` (e.g., if a constraint cannot be mathematically satisfied) triggers an automatic retry in the orchestrator.
*   **`permutations.ts`**: Exports the configuration defining the dataset splits, the number of instances per permutation, and uses the `DatasetPermutationBuilder` to map ontology labels to required visual variations.
*   **`generator.test.ts`**: A Vitest suite. Must deeply test edge cases (e.g., digit boundaries, non-negative constraints) to ensure the constraint satisfier behaves correctly.
*   **`checklist.md`**: (Optional) Specific instructions for the Visual QA LLM regarding how this specific module should visually render.

### The Visual Renderer (`src/exercises/<renderer>/`)
*   **`exercise.html`**: The base DOM. Must include `<div id="exercise"></div>` (the target for the Playwright screenshot).
*   **`exercise.scss`**: Styling. Must `@import "../shared.scss"` to inherit base font and reset styles.
*   **`exercise.ts`**: Implements `window.renderExercise = (payload: RenderPayload) => { ... }`. Responsible for reading `payload.isAnswerView` and toggling visibility of the solution.

## 5. How to Enrich the Dataset (Step-by-Step Guide)

To add a new mathematical concept or visual style to the dataset:

### Step 1: Scaffolding
1. Create a new directory in `src/generators/` (e.g., `src/generators/fractions`).
2. Create a corresponding renderer directory in `src/exercises/` (e.g., `src/exercises/fractions-pie`).

### Step 2: Defining the Pedagogy (`permutations.ts`)
Write the `permutations.ts` file. Determine which labels from `edugraph-ts` apply. Use the `DatasetPermutationBuilder` to cross-multiply labels with visual parameters. All permutations MUST include `Ability.ProcedureExecution`.
```typescript
// Example snippet
new DatasetPermutationBuilder()
    .addLabels([Ability.ProcedureExecution, Scope.Fractions])
    .applyLabelVariants('Area', [Area.Addition, Area.Subtraction])
    .applyConstraintVariants('denominator', [2, 4, 8])
    .buildVisuals('fractions-pie', { pieColors: ['blue', 'red'] })
```

### Step 3: Writing the Generator (`generator.ts`)
Implement the mathematical logic. Ensure that the properties of the generated problem strictly adhere to the requested labels. If a label requests `Area.Addition`, the problem must use addition.

### Step 4: Writing Tests (`generator.test.ts`)
Write robust unit tests verifying that the generator outputs correct math and respects bounds (e.g., resulting fractions do not exceed 1 if constrained). Run `npm run test` to verify.

### Step 5: Visual Implementation (`exercise.*`)
Implement the DOM logic in `src/exercises/<renderer>/exercise.ts`.
*   Ensure that `isAnswerView: false` visually hides the answer (or renders an empty box/placeholder).
*   Ensure that `isAnswerView: true` renders the exact same layout but with the answer visible.
*   Use `setSeed(problem.id)` before making randomized layout decisions.

### Step 6: Registration
1.  Add a link to your new renderer in `src/index.html` for easy debugging.
2.  Open `src/scripts/generate-dataset.ts` and add your new generator to the `runModulePipeline` dynamic import mapping:
    ```typescript
    else if (moduleName === 'fractions') GeneratorClass = (await import(`../generators/${moduleName}/generator.ts`)).FractionsGenerator;
    ```
3. Run `npm run generate:dataset fractions` to test the pipeline locally.
