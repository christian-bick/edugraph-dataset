# EduGraph Dataset

**EduGraph Dataset** is a synthetic ML dataset generator designed to produce highly controlled, precisely labeled training data for AI models in the education sector. 

By leveraging the [EduGraph Ontology](https://github.com/christian-bick/edugraph-ontology), this project programmatically generates math-related visual datasets—ranging from basic counting exercises to complex arithmetic procedures—where every generated image is mathematically bound to its educational labels.

## Dataset

The latest generated and released version of the dataset is available on Hugging Face:
👉 **[christian-bick/edugraph-exercises](https://huggingface.co/datasets/christian-bick/edugraph-exercises)**

> **Version Alignment:** The dataset version is strictly tied to the version of the [EduGraph Ontology](https://github.com/christian-bick/edugraph-ontology) it was generated with. This ensures that the semantic labels stay consistent with the training data. For example v0.6.0-02 refers to the second dataset revision for ontology version 0.6.0. 

## General Concepts

The pipeline is built on a **Label-Driven Generation** paradigm. Instead of generating a math problem and attempting to label it, the system receives a set of constraints (e.g., "Must include zero", "Uses addition") and generates problems that mathematically satisfy those semantic labels.

The architecture is split into three main parts:
*   **The Brain (Generators):** Abstract mathematical constraint satisfiers.
*   **The Body (Views):** HTML/CSS renderers that turn abstract math into visual DOM elements.
*   **The Heart (Orchestrator):** A Playwright-powered Node.js pipeline that generates permutations, injects them into views, captures screenshots, and compiles the dataset metadata.

> **For a deep dive into the architecture, the dataset pipeline, and a step-by-step guide on how to add new generators and views, please read the [Technical Documentation (DOCS.md)](./DOCS.md).**

## First Steps

### Prerequisites

*   [Node.js](https://nodejs.org/) (v20+ recommended)

### Installation

```bash
npm install
# Install Playwright dependencies for headless image generation
npx playwright install --with-deps chromium
```

### Usage

**1. Generate the Dataset**
Generate the ML dataset (images + JSONL metadata). Each education standard generates into its own folder — `out/dataset-<spec>/` — so standards can be regenerated independently. Start the Vite renderer with `npm run dev` before generation; the pipeline preflights every selected view before touching the live dataset.
The `--spec` parameter must be specified to select the spec module.
```bash
# Generate using curriculum standards -> out/dataset-ccss/
npm run generate:dataset -- --spec=ccss

# Generate using test specifications -> out/dataset-test/
npm run generate:dataset -- --spec=test
```

The isolated `test` spec is a prototyping, debugging, smoke, and retained-regression
surface. It intentionally keeps at least one generatable target/view path per generator,
but it is not an exhaustive curriculum or a substitute for validating real standard targets.

**1b. Merge the Union Dataset**
The released dataset at `out/dataset/` is the **union** of every education standard, deduplicated across them. Standards overlap heavily, so each one added contributes a shrinking delta — which the merge reports per standard.
```bash
npm run merge:dataset
```
*(Tip: You can filter the generation using optional parameters:
*   `--generator=X`: Limit generation to a specific generator module (e.g., `--generator=arithmetic-ops-pairs`).
*   `--view=Y`: Limit generation to a specific visual view rendering (e.g., `--view=operations-vertical`).
*   `--training-only`: Skip validation set generation to speed up the process.
*   `--concurrency=N`: Set the bounded Playwright worker count (default: 8).)*

Scoped generation is transactional. A successful run replaces only the selected generator/view pairs; sibling views and unrelated generators remain unchanged. A preflight, generation, or render failure discards the staged output and leaves the previous dataset intact.

**2. Generate Coverage Report**
Analyze the generated dataset to ensure proper pedagogical label coverage and distribution.
```bash
# Generate report for curriculum standards
npm run report:coverage -- --spec=ccss

# Generate report for test specifications
npm run report:coverage -- --spec=test
```
The `--spec` parameter is required. Pass `--spec=union` to analyze the merged release dataset in `out/dataset/`.

**2b. Audit the Train/Validation Split**
Check that validation content is disjoint from train, free of duplicates, and covers the views and labels that training does.
```bash
npm run report:splits -- --spec=ccss
```

**3. Run Repository Checks**
Run TypeScript type checks, generator/view spec audits, label usage checks, and target standard spec validations.
```bash
# Run all repository checks across all specs
npm run check

# Run checks targeting a specific spec
npm run check -- --spec=ccss
```

**4. Run Tests**
Validate the mathematical logic, constraints, and edge cases of the generators and library modules.
```bash
# Fast unit-test loop; excludes *.it.test.ts
npm run test

# Catalog and end-to-end integration tests
npm run test:integration

# Complete test gate
npm run test:all
```

**5. Development / Debugging**
Start the local Vite server to interactively preview the HTML/CSS rendering of the views.
```bash
npm run dev
```

## Contributing

Contributions are welcome! Adding new generators and views is a great way to help grow the available labeled training data for open-source AI education models. Read [DOCS.md](./DOCS.md) to understand how to scaffold and register a new dataset module, and the reference library in [docs/](./docs/README.md) for the rules each module file must follow.

## License & Attributions

This project is licensed under the Apache 2.0 License. See the [LICENSE](./LICENSE) file for details.

### Third-Party Data Attributions

* **Common Core State Standards**: The educational standards mappings are aligned with the Common Core State Standards.
  * *Common Core State Standards © Copyright 2010. National Governors Association Center for Best Practices and Council of Chief State School Officers. All rights reserved.*
* **Achieve the Core Dataset**: Standards metadata is structured using dataset entries compiled from the [achieve-the-core](https://huggingface.co/datasets/allenai/achieve-the-core) database by the Allen Institute for AI, which is licensed under the Open Data Commons Attribution License ([ODC-By 1.0](https://opendatacommons.org/licenses/by/)).
