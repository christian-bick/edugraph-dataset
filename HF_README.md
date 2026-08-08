---
pretty_name: EduGraph Exercises
license: apache-2.0
task_categories:
- visual-question-answering
- image-classification
language:
- en
tags:
- synthetic
- math
- education
- reasoning
size_categories:
- n<1K
configs:
- config_name: default
  data_files:
  - split: train
    path: "train/**"
  - split: validation
    path: "validation/**"
---

# EduGraph Exercises Dataset

**EduGraph Exercises** is a synthetic ML dataset of math-related visual problems, precisely labeled for training AI models in the education sector. 

Every image in this dataset is programmatically generated using the [EduGraph Ontology](https://github.com/christian-bick/edugraph-ontology) to ensure that visual features are mathematically bound to their pedagogical labels.

## Quick Links

- **Generation Engine:** [GitHub Repository](https://github.com/christian-bick/edugraph-content) (Contribute new generators or views!)
- **Ontology:** [EduGraph Ontology](https://github.com/christian-bick/edugraph-ontology) (Semantic definitions for all labels)
- **Coverage Explorer:** [coverage.edugraph.io](https://coverage.edugraph.io) (Explore standards coverage and generated tasks)

## Dataset Description

The dataset follows a **Label-Driven Generation** paradigm. Instead of labeling existing images, the system uses mathematical constraints to generate problems that satisfy specific educational goals.

### Example Modules
The dataset currently contains exercises for:
- **Arithmetic:** Addition, Subtraction, Multiplication, and Division (Vertical and Box layouts).
- **Counting:** Object counting with various shapes and symbols.
- **Comparison:** Greater than, less than, and equality of numbers.
- **Time:** Analog clock reading at various intervals.

## Structure & Metadata

### File Layout
The dataset is split into `train` and `validation` folders. Each split contains:
- `metadata.jsonl`: The primary entry point containing labels and image references.
- `[module]/`: Subdirectories containing the actual PNG images.

### Metadata Schema
Each entry in `metadata.jsonl` contains:
- `file_name`: Path to the image file (relative to the split root).
- `tags`: List of semantic labels from the EduGraph Ontology.
- `solution`: Boolean indicating whether the image shows a solved state.

## Versioning & Integrity

The dataset version (e.g., `v0.6.0-02`) is strictly tied to the version of the **EduGraph Ontology** it was generated with. This ensures that labels like `http://edugraph.io/edu/ArabicNumerals` have stable, mathematically consistent meanings across all training samples.

## License

This dataset is released under the **Apache 2.0 License**.
