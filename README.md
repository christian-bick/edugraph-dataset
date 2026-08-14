# EduGraph Dataset

**EduGraph Dataset** is a synthetic ML dataset generator designed to produce highly controlled, precisely labeled training data for AI models in the education sector. 

By leveraging the [EduGraph Ontology](https://github.com/christian-bick/edugraph-ontology), this project programmatically generates math-related visual datasets—ranging from basic counting exercises to complex arithmetic procedures—where every generated image is mathematically bound to its educational labels.

## Dataset

The latest generated and released version of the dataset is available on Hugging Face:
👉 **[christian-bick/edugraph-exercises](https://huggingface.co/datasets/christian-bick/edugraph-exercises)**

Explore its standards coverage and generated tasks:
👉 **[EduGraph Coverage Explorer](https://coverage.edugraph.io)**

> **Version Alignment:** The dataset version is strictly tied to the version of the [EduGraph Ontology](https://github.com/christian-bick/edugraph-ontology) it was generated with. This ensures that the semantic labels stay consistent with the training data. For example v0.6.0-02 refers to the second dataset revision for ontology version 0.6.0. 

## General Concepts

The pipeline is built on a **Label-Driven Generation** paradigm. Instead of generating a math problem and attempting to label it, the system receives a set of constraints (e.g., "Must include zero", "Uses addition") and generates training artifacts that satisfy those labels and expose the visual or necessary textual clues a classifier needs to defend them.

The architecture is split into three main parts:
*   **The Brain (Generators):** Abstract mathematical constraint satisfiers.
*   **The Body (Views):** HTML/CSS renderers that turn abstract math into visual DOM elements.
*   **The Heart (Orchestrator):** A Playwright-powered Node.js pipeline that generates permutations, injects them into views, captures screenshots, and compiles the dataset metadata.

> **For a deep dive into the architecture, the dataset pipeline, and a step-by-step guide on how to add new generators and views, please read the [Technical Documentation (DOCS.md)](./DOCS.md).**

## First Steps

### Prerequisites

*   [Node.js](https://nodejs.org/) 24 LTS (the supported major is recorded in `.nvmrc`)
*   Docker Desktop or another compatible Docker runtime for canonical generation

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

Native generation is the fast implementation loop. Before creating or updating committed
VQA cache records, regenerate the relevant scope in the pinned canonical Linux renderer;
this command starts its own Vite server and requires only a running Docker engine:
```bash
npm run generate:dataset:container -- --spec=ccss
```
The same `--generator`, `--view`, `--training-only`, and `--concurrency` filters apply.
Container dependencies are isolated from host `node_modules` and reused while the lockfile
and canonical renderer image remain unchanged.

The isolated `test` spec is a prototyping, debugging, smoke, and retained-regression
surface. It intentionally keeps at least one generatable target/view path per generator,
but it is not an exhaustive curriculum or a substitute for validating real standard targets.

**1b. Merge the Union Dataset**
The released dataset at `out/dataset/` is the **union** of every education standard, deduplicated across them. Standards overlap heavily, so each one added contributes a shrinking delta — which the merge reports per standard.
Its public `metadata.jsonl` contains only the image path, ontology tags, and a `solution` flag; richer operational metadata remains in the per-standard datasets.
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

**2c. Audit the Committed VQA Cache**
Release validation is a strict offline, read-only check. It never calls Gemini or changes
the cache, and it requires exact passing coverage for canonical images:
```bash
npm run audit:dataset -- --spec=ccss
```
Live Gemini validation is deliberately separate: generate canonically, then run
`npm run validate:dataset -- --spec=ccss` on a development machine with
`GEMINI_API_KEY` configured. Checklist and ontology-context edits invalidate affected
records automatically. Because evaluator system instructions, response schema, and model
selection are intentionally outside the validation-context hash, follow changes to those
mechanics with a full `validate:dataset -- --spec=ccss --force` run.

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

The same server exposes the React-based Common Core coverage and task explorer at
[`/standards-explorer.html`](http://localhost:5173/standards-explorer.html). The explorer
shows the current working-tree specs during local development. Vite builds that coverage
in memory on the first request, reuses existing generated dataset metadata when resolving
implemented permutations, and invalidates it when specs, generators, views, ontology
version, or generated datasets change. No coverage snapshot needs to be regenerated or
written to disk for local preview.

The details sidebar also shows every released question and solution image for each
implemented label combination. Those independent samples are indexed from the merged
union dataset and loaded directly from the tag-pinned Hugging Face release. During local
development, `npm run dev` dynamically builds the equivalent index from the current
per-standard datasets under `out/`; no index-generation or union-merge command is needed.

On `localhost` or `127.0.0.1`, a **Released / Local** switch controls only the sample
images. Released uses the immutable published asset index; Local uses PNGs served from
the current per-standard dataset folders and can be opened at
[`/standards-explorer.html?assets=local`](http://localhost:5173/standards-explorer.html?assets=local).
The development renderer index links to this mode as well. Coverage and navigation state
do not change when the image source changes. Deployed explorers always use release-pinned
images and do not render the switch. The `generate:asset-index` and
`validate:asset-index` commands remain release/CI operations.

A dataset-covered leaf is labeled **Released** only when the released asset index has an
exact requested-label-set match for every implemented permutation. Otherwise it is
labeled **Ready** with the same green theme and an hourglass icon. Local samples never
change this publication status.

### Coverage Explorer Deployment

The production explorer shows the coverage snapshot regenerated from the exact validated
`main` commit being deployed and combines it with the latest released asset index. Every
successful push validation on `main` calls the reusable deployment workflow, while a
successful tagged dataset release publishes its immutable coverage snapshot after the
Hugging Face upload and dispatches the same workflow to promote its assets. The files are
served from the `edugraph-coverage` Firebase Hosting site, so the browser has no
cross-origin GitHub dependency. Google authentication uses
Workload Identity Federation from the trusted `main` workflow context and requires no
long-lived Firebase service-account secret. The hosted root redirects to the standards
explorer; the deployment can also be started manually with `workflow_dispatch`.
The same deployment downloads the latest release's `asset-index.json` to
`/dataset/asset-index.json`. The index contains references only; the PNG files remain
published exclusively in the Hugging Face dataset.

## Contributing

Contributions are welcome! Adding new generators and views is a great way to help grow the available labeled training data for open-source AI education models. Read [DOCS.md](./DOCS.md) to understand how to scaffold and register a new dataset module, and the reference library in [docs/](./docs/README.md) for the rules each module file must follow.

## License & Attributions

This project is licensed under the Apache 2.0 License. See the [LICENSE](./LICENSE) file for details.

### Third-Party Data Attributions

* **Common Core State Standards**: The educational standards mappings are aligned with the Common Core State Standards.
  * *Common Core State Standards © Copyright 2010. National Governors Association Center for Best Practices and Council of Chief State School Officers. All rights reserved.*
* **Achieve the Core Dataset**: Standards metadata is structured using dataset entries compiled from the [achieve-the-core](https://huggingface.co/datasets/allenai/achieve-the-core) database by the Allen Institute for AI, which is licensed under the Open Data Commons Attribution License ([ODC-By 1.0](https://opendatacommons.org/licenses/by/)).
* **Fonts**: Inter and Roboto Mono are self-hosted through Fontsource packages and licensed under the SIL Open Font License 1.1.
