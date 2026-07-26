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
*   `isSolutionView`: A boolean instructing the renderer to display the problem with or without the solution filled in.
*   `seed`: The deterministic render seed derived from the sample identity. Views must draw **all** of their entropy (icon choices, scatter positions, shuffles, rotations) from this seed — never from `Math.random()` or any other source. `problem.id` is present on the payload but is dead: no view reads it (see *Sample Identity & Determinism* below).

To ensure end-to-end type safety between problem generators (which run in Node.js) and the React views (which run in the browser headlessly), the system utilizes:
1. **`ViewTypeMap`** (defined in [problems.ts](file:///c:/Users/silen/Documents/EduGraph/edugraph-content/src/types/problems.ts)): A central contract mapping visual view identifiers (like `'operations-vertical'`) to their expected mathematical data structure (like `ArithmeticStandardProblem`).
2. **`ViewRenderPayload<TViewId>`** (defined in [ml-engine.ts](file:///c:/Users/silen/Documents/EduGraph/edugraph-content/src/types/ml-engine.ts)): A utility type that automatically resolves to the correct type-safe `RenderPayload` for a specific view ID, eliminating the need for manual type assertions (`as ...`) within the view components.

**Environment Separation & Mapping:**
Because the Node orchestrator and generator configurations do not statically import the React view files (which are dynamically bundled by Vite and loaded headlessly inside Playwright via URLs), TypeScript cannot automatically inspect `window.renderView` in the browser code from the Node side. `ViewTypeMap` serves as a shared bridge, allowing the compiler to statically verify that generators specify view names compatible with the data structures the views expect to render.

### Sample Identity & Determinism
Every dataset sample has a **structural identity**: the tuple `(target.id, generatorId, viewId, split, mode, instanceIdx)`, canonicalized as a *sample key* (e.g. `test-writing~fe4336da#writing#numbers-write-standard#train#question#inst:0`). Everything entropy-related is a pure function of this identity, implemented in `src/lib/generation.ts`:

*   **Generation seed**: `computeSampleSeed(sampleKey, attempt)`. The `attempt` counter is a retry salt — when a generator returns `null` or produces duplicate content, the pipeline retries with the next attempt, which deterministically yields a different draw. The *winning* attempt is recorded in metadata and the VQA cache, so any sample can be replayed in isolation.
*   **Render seed**: passed to the browser as `payload.seed`. The `withConfig` wrapper calls `setSeed(payload.seed)` before resolving the view config, and views derive all visual randomness from it.
*   **Filenames**: `computeSampleFilename(identity)` — stable and unique by construction, so filenames never shift when unrelated samples change.
*   **Content fingerprint**: `computeContentFingerprint(problem.data)` — an order-independent hash used for dedup instead of generator-authored id strings.
*   **Val split membership**: `isValTarget(target.id, ratio)` — a pure function of the target id, so val membership survives unrelated reorderings.

The consequence: a code change only invalidates the samples whose identity inputs it actually touches. `problem.id` carries the sample key for reference but has **no functional role** — do not derive anything from it.

## 3. Script Reference

#### `src/scripts/generate-dataset.ts`
The primary pipeline orchestrator.
*   **Execution**: `npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--training-only]`
*   **Function**: Loads targets and catalogs via `src/lib/generation.ts`, computes the matched `(target, generator, view)` tuples, generates one question and one solution sample per tuple with structural seeds, and renders them headlessly via Playwright (requires the vite dev server, `npm run dev`).
*   **Splits**: Train samples are generated for every tuple; validation samples for the ~25% of targets selected by `isValTarget`. Both use the same identity-based seeding with the split as a key component.
*   **Dedup**: Content fingerprints per (split, view); a collision triggers a deterministic retry on the next attempt. The winning attempt is recorded.
*   **Metadata**: Each image row records its full identity: `sample_key`, `spec`, `target_id`, `generator`, `view`, `mode`, `instance`, `attempt`, `seed`, `content_fingerprint`, plus `tags` and `parameters` (the full problem data — generators no longer author a separate descriptive id; identity is entirely structural).
*   **`--training-only` Flag**: If specified, skips validation sample generation, rendering, and metadata writing.
*   **Clearing Logic**: If no module is specified, it wipes the entire `out/dataset/` directory. If a specific module is provided, it clears only `out/dataset/train/<module>` and `out/dataset/validation/<module>`.

### `src/scripts/generate-coverage-report.ts`
*   **Execution**: `npm run report:coverage -- [--spec=Z]`
*   **Function**: Scans all `metadata.jsonl` files in the generated dataset. It outputs a markdown report (`out/dataset/coverage-report.md` or `out/dataset-test/coverage-report.md`) detailing absolute frequencies of individual labels and the percentage breakdown of unique label combinations.

### `src/scripts/validate-dataset.ts`
*   **Execution**: `npm run validate:dataset -- --generator=X --view=Y [--dataset=Z] [--force]`
*   **Function**: An automated Visual QA pipeline. It uses the Gemini API via `src/lib/vqa-evaluator.ts` to analyze Q/A image pairs from the dataset against rules defined in cascading `checklist.md` files across generator and view module directories. It defaults to reading from `out/dataset/`, but you can target smaller test runs by specifying `--dataset=test` (which dynamically reads from `out/dataset-test/`).
*   **Caching**: Results are cached in `cache/vqa-validation/<dataset>/<module>.jsonl`, keyed by `sha256(image bytes : checklist hash)` — an image is only re-validated when its pixels or its applicable checklists change. Each cache entry also records the sample's full identity (`sample_key`, `attempt`, `seed`, …) for debugging and churn analysis. Failures in the generated `validation-report.md` include a ready-to-run `test:sample` command.

### `src/scripts/report-cache-churn.ts`
*   **Execution**: `npm run report:churn -- [--dataset=test] [--ref=<git-ref>]`
*   **Function**: Compares the working-tree VQA cache against a git ref (default `HEAD`) by joining entries on their `sample_key`. Reports identities whose image hash changed, classified as *render/code change* (same seed and attempt), *attempt shift* (collision elsewhere or generator behavior change), or *seed scheme change* (should never happen). **Run this after every regeneration**: churn in samples your change should not have affected is a determinism regression.

### `src/scripts/test-sample.ts`
*   **Execution**: `npm run test:sample -- --sample="<sample_key>" --spec=<spec_module> [--no-render] [--no-validate]`
*   **Function**: Replays one exact sample draw from its identity, renders it to `out/retest/` (requires `npm run dev`), compares the image hash against the committed VQA cache, and performs live Gemini VQA validation by default (when `GEMINI_API_KEY` is present), automatically updating the local VQA cache on pass. Pass `--no-validate` to skip live VQA API calls, or `--no-render` to skip image rendering.

### `src/scripts/test-target.ts`
*   **Execution**: `npm run test:target -- --target=<target.id_or_prefix> --spec=<spec_module> [--render] [--validate]`
*   **Function**: Inspects one competency target end to end: supports full or prefix target IDs (e.g. `--target=test-writing`), which `(generator, view)` tuples it matches (with reasons for rejected pairs), the exact samples the pipeline would produce (keys, seeds, attempts, fingerprints, data), how they relate to the committed VQA cache, and — with `--render` — the actual images in `out/target-test/`. Pass `--validate` to run live Gemini VQA validation on rendered samples.

### `src/scripts/show-matching-stats.ts`
*   **Execution**: `npm run show:matching -- --spec=<spec_module>` (or `npx vite-node src/scripts/show-matching-stats.ts --spec=<spec_module>`)
*   **Function**: Prints the matched `(generator, view)` pairs for every target of a spec, probes actual generation with production sample keys, surfaces generation failures and `rejectedLabels` boundaries, and summarizes per-generator coverage. Shares its matching logic with the pipeline via `src/lib/generation.ts`.

### `src/scripts/show-implementation-todos.ts`
*   **Execution**: `npm run show:imp-todos -- [--spec=<spec_module>]`
*   **Function**: Inspects `implementationTodos` across target spec files. Groups missing capabilities by standard definition prefix and details missing generator or view functionality.

### `src/scripts/show-ontology-todos.ts`
*   **Execution**: `npm run show:ont-todos -- [--spec=<spec_module>]`
*   **Function**: Inspects `ontologyTodos` across target spec files. Groups missing ontological concepts, listing standard IDs, missing labels, and detailed descriptions.

### `src/scripts/check-all.ts`
*   **Execution**: `npm run check [-- --spec=<spec_module>]`
*   **Function**: The unified repository check script. Orchestrates TypeScript type checking (`tsc --noEmit`), generator/view spec audits (`validate-generator-view-specs.ts`), label usage audits (`check-labels.ts`), and competency standard spec validations (`normalizeAndValidateSpec`). If `--spec` is specified, restricts target spec validation to that module; otherwise validates all available specs (`test`, `ccss`).

### `src/scripts/validate-generator-view-specs.ts`
*   **Execution**: `npm run check:generator-view-specs`
*   **Function**: An automated generator and view spec validation script. It checks companion `spec.ts` files across both generators and views, flagging (1) overlapping General Labels / parameter queries, and (2) duplicate parameterizations where a view re-specifies variables already computed by its matching generator. Detailed logs are outputted to `temp/check_output.txt`.

### `src/scripts/validate-standards-spec.ts`
*   **Execution**: `npm run check:standards-spec -- --spec=<spec_module>`
*   **Function**: Validates competency target standard specs (e.g. `test`, `ccss`) using `normalizeAndValidateSpec` from `src/lib/spec-validator.ts`. All checks always run: target ID uniqueness (the sole gatekeeper — `loadTargets` itself is permissive), label set normalization, intra-target permutation uniqueness, and definition distinctness — no two target definitions may define an identical *set* of permutations, since such definitions are indistinguishable by the ontology. Definitions that merely *overlap* in some permutations are legitimate (related standards across grades); overlapping permutations are deduplicated to one representative target and reported as warnings, not errors.

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
        - **No Silent Fallbacks**: Must not use local silent fallbacks (e.g. `data.shape || 'circle'`, `config.arrangement || 'scattered'`). Consume resolved configuration parameters directly from the `config` prop and `problem.data` directly, relying on `withConfig` to guarantee they resolve to non-null and correctly-typed values.
    - **`spec.ts`**: Exports `spec: ViewSpec` (matching capabilities), `ViewSchema` (defining mapping to visual config), and `ViewConfig`.
        - **`rejectedLabels`**: Instead of declaring what a view *can* handle, view specs must use `rejectedLabels` to explicitly list the labels (or label arrays) they *cannot* handle. Its purpose is to narrow a view to a **subset of the problems its matched generator can produce** — the cases the view's layout physically cannot render (e.g., rejecting `Scope.NumbersWithZero`, or utilizing `...deductAdmitting([Scope.NumbersLarger20])` to automatically reject all targets that allow numbers larger than the physical rendering capacity of the view). It is **not** a general competency filter: do not use it to exclude abilities or to work around the matching direction — what a view *supports* belongs in the positive `generalLabels`/schema declarations (see §4b rule 1). Rule of thumb: capabilities are declared with `deductCompatible` (generator/view schemas), boundaries with `deductAdmitting` (rejection lists).
    - **Parent Category `helpers.ts` / Components**: Shared visual helpers or sub-components common to sibling views within a category can be placed at the category level (e.g. `src/visuals/views/operations/helpers.ts`) and imported relatively.
    - **`checklist.md`**: Visual layout, rendering, and interaction verification list. Used by Visual QA to check for elements positioning, SVG structures, rendering overflows, and Question (`_mode-Q`) vs. Solution (`_mode-S`) mode styling. It **must not** contain abstract mathematical generation logic. See the Checklist Design Rules section below for detailed formatting constraints.
*   **`src/visuals/components/`**: Reusable shared React elements across all view categories (such as `TenFrame.tsx`).
*   **`src/visuals/helpers/`**: Shared layout rendering calculations across all view categories (such as `counting-helpers.ts`).

## 4b. Specification Design Rules & Validation Checks

When designing or updating `spec.ts` files, you must strictly follow these rules:

1. **Declare the Most Specific *True* Label (Matching Direction)**:
   - Standards/targets (`src/spec/`) are deliberately broad; generators and views are **specific**. The matching predicate (`matchesTarget` in `src/lib/generation.ts`) satisfies a target label `T` with a generator/view capability label `L` **only when `L` is equal to or more specific than `T`** — `isSubConceptOf(L, T)`, i.e. `L partOf* T`. The reverse never matches: a specific target is *not* satisfied by a merely more-general capability. This one directionality holds for Area, Scope **and** Ability (abilities are matched against the view only — generators are pure math).
   - Therefore declare the **most specific ontology label that is still a true statement** about what the module produces or renders. A specific label automatically matches every broader standard that subsumes it, so **never also declare an ancestor** of a label you already declare: it cannot add any match and `validate-generator-view-specs` flags it as a redundant declaration. Conversely, declaring only an ancestor of what a target needs will silently fail to match it.
   - **"Most specific" does not mean "leaf."** Several ontology branches bottom out in *instruments* or *subtypes* rather than in refinements of the same claim — e.g. the only leaf under `Area.Rectangle` is `Area.Square`. A generator emitting rectangles must **not** claim `Square`.
   - Conversely, do not declare a capability **broader than what the module can do** (e.g. a generator specifically supporting Multiplication, Division and Modulo should not `Area.BaseOperations`). And even if a generator would support all members (e.g. all base arithmetic operations), as long as they are distinguishable through parameterization, we'd still list every single member.
2. **Separation of Concerns**:
   - **Generator Specs**: Map ontology labels **only** to abstract mathematical configurations (e.g. `range`, `includeZero`, `allowNegatives`, `useDecimals`, `attribute`, `relation`).
   - **View Specs**: Map ontology labels **only** to visual/layout configurations (e.g. `isReverse`, `arrangement`, `showTenFrame`).
3. **Resolver Reusability**:
   - All general resolver functions (such as `hasLabel`, `selectExactMatch`, `extractFirstMatch`) must be imported and reused from `src/lib/resolvers.ts`. Do not define custom resolvers inline.
   - Resolver functions must be passed as references (or output of curried factory functions) to the schema arrays, and not executed prematurely.
4. **General Labels vs. Parameter Labels Overlap**:
   - There must be zero overlap (including taxonomic ancestors via `partOf`) between the labels checked inside schema parameters and the spec's `generalLabels`. Specifically, when a label is declared as part of a schema parameter, it (and none of its ancestors) should appear in `generalLabels`.
5. **No Duplicate Parameterization**:
   - When a generator maps a label to configure the mathematical properties of a problem payload, that label (and none of its ancestors/descendants) should be queried in the schema of the matching view. The view must rely purely on the generated problem payload (e.g. `problem.data`) rather than querying the ontology itself.
6. **Prefer Simple Arrays for Schemas**:
   - When mapping a parameter to a set of compatible standard labels (e.g. arrangements), prefer defining a simple array (e.g. `arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]`) over using resolvers. Fallbacks for missing labels are generated generically already and don't require specific resolvers.

## 4c. Checklist Design Rules & Hierarchical Loading

When writing or updating `checklist.md` files (which are used by the automated visual QA or manual checks), you must strictly follow these rules:

1. **Hierarchical Organization**:
   Checklists are concatenated as one flat text block and evaluated together, across **three** levels, in this order:
   - **Root `checklist.md`** (`src/generators/checklist.md` / `src/visuals/views/checklist.md`) — applies to **every** generator or view unconditionally. In particular, `src/visuals/views/checklist.md` already states the global Question/Solution Mode instruction rules (see point 5) — do not restate them anywhere else.
   - **Parent Category `checklist.md`** (e.g. `src/generators/arithmetic/checklist.md`) — applies to all sub-modules under that category.
   - **Leaf Module `checklist.md`** (e.g. `src/generators/arithmetic/arithmetic-ops-pairs/checklist.md`) — applies specifically to that leaf module.

   Because the LLM validator sees root + category + leaf as one undifferentiated block, a leaf (or category) rule that doesn't scope itself reads as a specific override of a general rule, not an addition to it — this is a real, previously-shipped bug class (see point 6), not a theoretical risk. Before adding a rule anywhere, check whether root or the category checklist already states it; a rule repeated verbatim at a lower level with different nouns substituted in is redundant and should be deleted, not kept "for clarity."
2. **Separation of Concerns**:
   - **Generator Checklists**: Specify *only* abstract mathematical and logic rules. Remove all layout/visual criteria (e.g., coordinates, shapes, colors, SVGs, button states, ruler bands, CSS styling, or answer box highlights).
   - **View Checklists**: Specify *only* visual layout, rendering, and interaction rules. Remove all abstract logic criteria (e.g., mathematical generation algorithms, RNG selection logic, ontology/tag resolution).
3. **Conciseness, and No Concrete Examples in General Checklists**:
   - Focus on the most important validation aspects. Do not include excessive edge cases.
   - Root and category checklists must state only abstract principles — never bake in concrete examples (e.g. "(e.g. ordering direction, shape naming, or sorting rule)"). A concrete example at a general level is a specific claim that can silently drift out of sync with, or contradict, what an actual leaf checklist later requires for a similarly-shaped view. Concrete specifics belong exclusively in leaf checklists, where they describe one real, verifiable view.
4. **Unaware of Parameterization**:
   - Assume that the validation mechanism is unaware of parameterization (internal config flags, e.g. `isReverse`, are invisible to it) and do not phrase rules conditionally on them (e.g. "If `config.isReverse` is true, then..."). Mode is the one exception: `_mode-Q` / `_mode-S` is given to the validator explicitly as context, so rules may condition on Question vs. Solution Mode.
   - If a view has multiple valid internal configurations, describe them as alternative *observable* layouts the rendered image can match (e.g. "Layout A: ... Layout B: ...; exactly one applies per image"), not as branches on the config value driving them. See `time-analog/checklist.md` for a worked example.
5. **Question Mode (`_mode-Q`) vs. Solution Mode (`_mode-S`)**:
   - View checklists must clearly distinguish between Question Mode (where answers are blank, inputs are empty, or elements are unselected) and Solution Mode (where correct answers are filled in, highlighted, or selected).
   - The root checklist already states the global rule: Solution Mode must never display instruction text headers, and Question Mode may omit the header for self-explaining exercises. **Any leaf rule that requires prompt/instruction text must explicitly scope it to Question Mode** (e.g. "In Question Mode, the prompt must read X. Per the global Instruction & Mode Rules, this text is absent in Solution Mode."). An unscoped requirement ("the prompt text must read X") reads as an unconditional override of the global rule and will cause the validator to fail correctly-implemented views that hide the prompt in Solution Mode as intended — this exact bug shipped in over a dozen leaf checklists before being caught.
6. **Documented Exceptions to Global Rules**:
   - A view may legitimately need to violate a global rule (e.g. a view where the Solution image is ambiguous without repeating the question, so the prompt must stay visible in both modes — see `sorting-classify-sort/checklist.md`). State the exception explicitly in the leaf checklist, name the global rule it deviates from, and give the concrete reason. An undocumented deviation is indistinguishable from a bug to both the validator and the next person reading the checklist.

## 5. How to Enrich the Dataset (Step-by-Step Guide)

To add a new mathematical concept or visual style to the dataset, follow this step-by-step workflow:

### Step 1: Define the Pedagogy
Declare the target specifications in the appropriate grade level file in `src/spec/ccss/` (like `kindergarten.ts` or `grade-01.ts`) using the `DatasetPermutationBuilder`:

**The spec module export contract**: every file under `src/spec/<module>/` must export its competency targets as `export const spec: CompetencyTarget[] = [...]` — this is the *only* export `loadTargets` (`src/lib/generation.ts`) reads, by fixed name, no scanning or filtering. Do not export additional aliases of `spec` under other names (e.g. a grade-prefixed const) — dead aliases have caused duplicate-target bugs before; a target must be reachable via `spec` and nothing else.

- Work from the **leaf nodes** of the CCSS tree (`public/coverage/ccss-tree.json`). A single leaf standard often bundles several competencies — create one builder per competency.
- Use `.addLabels([...])` for the label set shared by all permutations of a competency and `.applyLabelVariants([...])` for orthogonal dimensions (e.g. number ranges, `Scope.NumbersWithZero` vs. `Scope.NumbersWithoutZero`, shapes, relations). Map the builder to targets with the shared `toTargets('<CCSS-id>-<slug>', builder)` helper from `src/lib/dataset-permutation-builder.ts`, so ids read like `K.CC.B.5-how-many~a3f91c2e` — the suffix after `~` is a content hash of the permutation's label set (`labelSetHash` in `src/lib/utils.ts`), not a position index.
- If a competency cannot be expressed (missing ontology label) or has no generator/view support, **do not stretch labels to force a match**. Instead, leave a `// TODO [<CCSS-id>]:` comment describing the gap together with a commented-out reference builder/permutation, or collect the parked targets in the sibling `implementationTodos: CompetencyTarget[]` / `ontologyTodos: OntologyTodo[]` exports (same file, kept alongside `spec` so agents can work through gaps in context). These two exports are for `map-standards.ts`'s coverage report only — `loadTargets` never reads them, so a todo target can never enter the pipeline, regardless of whether its labels would happen to match a generator/view pair. See `src/spec/ccss/kindergarten.ts` for examples.

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
- The generator spec declares the **specific labels and scopes** it produces mathematically. A specific capability matches every broader standard that subsumes it (see §4b rule 1), so declare the most specific label that is *actually true* of your output — never an ancestor of it, and never a leaf you do not really satisfy (ontology leaves are often instruments or subtypes; see §4b rule 1).
- The view spec declares the layout labels it supports in `generalLabels`. Crucially, it must explicitly reject unsupportable targets (like physical coordinate bounds or unsupported number formats) in `rejectedLabels`. Use `...deductAdmitting([<boundary>])` in the rejected list to logically expand a rejection boundary (e.g. `...deductAdmitting([Scope.NumbersLarger10])` rejects every scope admitting numbers beyond the view's physical capacity of 10). Never use `deductCompatible` for rejection lists — it is the dual operator for declaring capabilities in schemas.

### Step 6: Implementation
- **Generator (`generator.ts`)**: Implement the mathematical logic. Ensure that the properties of the generated problem strictly adhere to the requested labels. If a label requests `Area.Addition`, the problem must use addition.
- **View (`view.tsx` / components)**: Implement the visual component logic in `src/visuals/views/<renderer>/view.tsx`.
  - Ensure that `isSolutionView: false` visually hides the answer (or renders an empty box/placeholder).
  - Ensure that `isSolutionView: true` renders the exact same layout but with the answer visible.
  - Derive **all** randomized visual decisions from `payload.seed` (e.g. `payload.seed % ICONS.length`, or pass the seed into a helper that calls `setSeed(seed)` before drawing). Never derive anything from `problem.id` — it is dead, unread by any view — and never from `Math.random()` or unseeded `random()` calls. The `withConfig` wrapper seeds the global PRNG from `payload.seed` before config resolution; any other entropy source breaks render determinism and invalidates the VQA cache.

### Step 7: Tests (`generator.test.ts`)
Write robust unit tests verifying that the generator outputs correct math and respects bounds. Run `npm run test` to verify.

### Step 7b: Targeted Testing via Test Specs
To visually verify and test both your generator and view modules without overwriting the main dataset, you should use the `test` specs module:
1. **Extend Test Specs**: Add minimal test permutations for your module to the `test` specs directory (`src/spec/test/`). Use `DatasetPermutationBuilder` to build these permutations programmatically rather than manually writing static arrays. Export the result as `export const spec: CompetencyTarget[] = ...` — the same fixed contract as `src/spec/ccss/` (see Step 1).
2. **Run Targeted Dataset Generation**: Generate a smaller slice of the dataset exclusively to a `dataset-test` directory:
   ```bash
   npm run generate:dataset -- --generator=X --view=Y --spec=test
   ```
   This allows you to quickly inspect the generated output under `out/dataset-test/` without running the entire dataset generation pipeline.
3. **Run Targeted Validation**: Run automated Visual QA against your small test output:
   ```bash
   npm run validate:dataset -- --generator=X --view=Y --dataset=test
   ```

### Step 8: Final Verification
1. Run `npm run check` (or `npm run check:types`, `npm run check:generator-view-specs`, `npm run check:standards-spec`) to verify type safety, spec constraints, label usage, and target standard specs.
2. Run `npx vite-node src/scripts/show-matching-stats.ts --spec=ccss` (or `--spec=test`) to confirm that the ontology dynamically binds your targets to your generator and views.
3. Run `npm run generate:dataset -- --spec=ccss --generator=[moduleName]` to test local dataset generation.

## 6. Efficient Development & Debugging Iteration

The pipeline is built so that a code change only invalidates the samples it actually touches, and every sample can be reproduced in isolation. Use these workflows to keep iteration cheap:

### Debugging one target (new targets, matching issues, cache questions)
```bash
npm run test:target -- --target=K.CC.B.5-how-many~<hash> --spec=ccss --render
```
Shows the matched tuples, why near-miss pairs were rejected (`unsupported-label` / `rejected-label` with the offending label), the exact sample keys/seeds/data the pipeline would produce, their status in the VQA cache, and (with `--render` and `npm run dev` running) the rendered images in `out/target-test/`.

### Fixing a failed validation
Every failure in `validation-report.md` includes its sample identity and a ready-to-run command:
```bash
npm run test:sample -- --sample="<sample_key>" --spec=<spec>
```
After changing the generator or view, rerun it: `test:sample` re-renders the image and performs live Gemini VQA validation by default (updating the cache automatically on pass). If you only want an offline pixel/SHA256 check, pass `--no-validate`.

### Checking cache health after a regeneration
```bash
npm run report:churn -- --dataset=test        # compares working tree vs HEAD
```
The report joins old and new cache entries on `sample_key` and flags identities whose image changed. Expected: churn only in the modules/views you touched. **Churn in unrelated samples is a determinism regression** — the classification (render change vs. attempt shift vs. seed scheme change) tells you where to look.

### Rules that keep invalidation minimal
- **Batch pixel-affecting changes** (view code, shared components, checklists) and regenerate once — every regeneration+validation cycle costs LLM calls for all changed images.
- **Checklist edits cascade**: the checklist hash covers root + category + leaf `checklist.md` files, so editing a category checklist re-validates the whole category (images are unaffected, but all their cache keys change). Batch shared-checklist edits.
- **All view entropy comes from `payload.seed`** — an unseeded `random()` or `Math.random()` in a view makes renders order-dependent under the concurrent worker pool and poisons the cache non-deterministically.
- **No timing-dependent pixels**: the render harness disables CSS transitions/animations and waits for fonts and images before screenshotting (pages are reused across renders, so mid-transition captures and image-cache warmth would otherwise make pixels depend on render order). Don't rely on animation states in views, and keep new async resources (fonts, images) loadable — a broken image URL now fails the render wait instead of silently screenshotting a blank box.
- **Pin the Playwright/Chromium version**: cache keys are pixel hashes, so a browser upgrade re-rasterizes everything. Treat browser bumps as deliberate full-invalidation events.
- **Spec edits invalidate only what they change**: `target.id` embeds a content hash of the permutation's label set (`<prefix>~<labelSetHash>`), so inserting, reordering or removing variants in a builder never touches the ids — or seeds, or cached samples — of the other permutations. Changing a permutation's labels changes its id and regenerates exactly that permutation, which is correct: the competency itself changed. (Val-split membership is also id-derived, so a changed permutation may switch splits.)

## 7. Autonomous Agentic Loops & Orchestration Workflows

To support automated end-to-end dataset development, the repository provides three high-level **orchestrator skills** located in `.agents/skills/`:

### Loop 1: Standard Spec Generation (`/create-spec-from-standard`)
- **Skill**: `.agents/skills/create-spec-from-standard/SKILL.md`
- **Command**: `/create-spec-from-standard {standardId|gradeFile}`
- **Function**: Translates educational standard leaf nodes (`public/coverage/ccss-tree.json`) into `DatasetPermutationBuilder` target specs in `src/spec/<module>/<gradeFile>.ts`.
- **Tri-Export Contract**: Categorizes standard permutations into:
  1. `export const spec: CompetencyTarget[] = [...]`: Matched by existing generator AND view.
  2. `export const implementationTodos: CompetencyTarget[] = [...]`: Expressible in ontology, missing generator/view.
  3. `export const ontologyTodos: OntologyTodo[] = [...]`: Inexpressible due to missing ontology labels (`edugraph-ts`).
- **Validation**: Runs `npm run check:standards-spec -- --spec=<module>` and `npm run check`. Finishes by presenting matching statistics to the user (allowing manual trigger of follow-up loops).

### Loop 2: Spec Implementation & Error-Free Generation (`/implement-spec`)
- **Skill**: `.agents/skills/implement-spec/SKILL.md`
- **Command**: `/implement-spec [{specModule}]`
- **Function**: Resolves `implementationTodos` step-by-step to achieve 100% error-free problem generation and rendering.
- **Delegation & Module Reviews**: Delegates module-level implementation to `/update-gen {moduleName}` and `/update-view {viewName}`, and targeted audits to `/review-gen {moduleName}` and `/review-view {viewName}`.
- **Isolated Debugging**: Uses `npm run test:target -- --target=<id> --spec=test --render` and `npm run test:sample -- --sample="<sampleKey>" --spec=test` to isolate and fix failing samples.
- **Fast Scoped Regeneration**: Uses `npm run generate:dataset -- --spec=test --generator=<gen> --view=<view> [--training-only]` during iteration.
- **Completion Gate**: Promotes verified targets to `spec`, then runs a final full regeneration (`npm run generate:dataset -- --spec=<spec>`), full VQA validation (`npm run validate:dataset -- --spec=<spec>`), VQA cache churn check (`npm run report:churn -- --dataset=<spec>`), and full checks (`npm run check`).

### Loop 3: Ontological Todo Resolution (`/update-ontology`)
- **Skill**: `.agents/skills/update-ontology/SKILL.md`
- **Command**: `/update-ontology [{specModule}]`
- **Function**: Groups `ontologyTodos` and creates formal GitHub issues in `christian-bick/edugraph-ontology`.
- **Upfront Prerequisite Checks**:
  1. **Sibling Repository**: Checks presence of `../edugraph-ontology`. If missing, prints clone instructions and aborts.
  2. **GitHub CLI Auth**: Checks `gh auth status`. If missing/unauthenticated, prints `gh auth login` instructions and aborts.
- **Issue Creation**: Formulates structured issue titles, standard contexts, proposed Enum additions, `partOf` taxonomic relations, and TypeScript diffs, submitting them via `gh issue create`.

### Consolidated Module Review Skills
- **`/review-gen {moduleName}`** (`.agents/skills/review-generator/SKILL.md`): Audits all three generator module files (`spec.ts`, `checklist.md`, `generator.ts`) against a single unified checklist.
- **`/review-view {viewName}`** (`.agents/skills/review-view/SKILL.md`): Audits all three view module files (`spec.ts`, `checklist.md`, `view.tsx`) against a single unified checklist.

