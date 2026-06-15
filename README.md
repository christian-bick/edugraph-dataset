---
configs:
- data_files:
  - split: train
    path: "train/**"
  - split: validation
    path: "validation/**"
---

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
Generate the full ML dataset (images + `meta.json`). The output will be saved in `out/dataset/`.
```bash
npm run generate:dataset
```
*(Tip: You can generate a specific module by appending its name, e.g., `npm run generate:dataset arithmetic`)*

**2. Generate Coverage Report**
Analyze the generated dataset to ensure proper pedagogical label coverage and distribution.
```bash
npm run report:coverage
```

**3. Run Tests**
Validate the mathematical logic, constraints, and edge cases of the generators.
```bash
npm run test
```

**4. Development / Debugging**
Start the local Vite server to interactively preview the HTML/CSS rendering of the views.
```bash
npm run dev
```

## Contributing

Contributions are welcome! Adding new generators and views is a great way to help grow the available labeled training data for open-source AI education models. Please read `DOCS.md` to understand how to scaffold and register a new dataset module.

## License

This project is licensed under the Apache 2.0 License. See the `LICENSE` file for details.