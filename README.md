# EduGraph Content

## Introduction

EduGraph Content is a synthetic ML dataset generator for educational competencies. It leverages the EduGraph ontology to programmatically generate high-quality, labeled datasets for various math-related exercises, from basic counting to more complex arithmetic problems.

The primary goal of this project is to provide a robust framework for generating training data for AI models in the education sector, ensuring that every exercise is precisely labeled with its corresponding educational competencies.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (which includes npm)

### Installation

Install the dependencies with the packing manager of your choice:

```bash
npm install
```

## Usage

This project uses `vite` for development and `vite-node` to run generation scripts.

### Development Server

To start the development server and preview the generated exercises in your browser, run:

```bash
npm run dev
```

This will start a local server, and you can navigate to different exercise URLs to see them rendered live.

### Generating ML Datasets

To generate the dataset, use the `generate-dataset` script:

```bash
npm run generate:dataset
```

This will process the exercise generators and produce a dataset suitable for model training.

### Running Tests

To run the test suite, use the `test` script:

```bash
npm run test
```

## Project Structure

The project is organized into the following main directories:

*   `src/generators`: Contains the core logic for generating permutations and labels for different educational competencies.
*   `src/exercises`: Houses the HTML templates, styles, and TypeScript entry points for the visual representation of exercises.
*   `src/lib`: Contains core logic and helper functions, such as the `PermutationBuilder` and labeling utilities.
*   `src/scripts`: Houses scripts for dataset generation, validation, and other automation tasks.
*   `src/types`: TypeScript type definitions used across the project.

### Generator Modules

Each generator module within `src/generators` follows this general structure:

*   `generator.ts`: Exports functions to generate all permutations of an exercise, create a unique name for each permutation, and generate descriptive labels (metadata).
*   `permutations.ts`: Defines the possible variations and parameters for the exercises.
*   `generator.test.ts`: Unit tests for the generator logic.

## Metadata and Labeling

Each generator is responsible for producing not just the content of the exercise, but also a set of descriptive metadata. This is handled by the `generateLabels` function within each generator.

These labels are based on the [EduGraph ontology](https://github.com/christian-bick/edugraph-ontology) and provide a standardized way to describe the educational competencies addressed by each exercise.

This metadata can be used for:

*   Model training and fine-tuning for classification and reasoning models.
*   Generating embeddings for educational content.
*   Building searchable databases of educational materials.

## Contributing

Contributions are welcome! Adding new generators for additional educational competencies is a great way to help grow the available labeled training data for open-source AI education models.

For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the Apache 2.0 License. See the LICENSE file for details.
