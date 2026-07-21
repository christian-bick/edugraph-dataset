---
name: review-generators
description: "/review-generators [{moduleName}] - Review generator.ts files (for a specific generator module, or all modules if omitted) to ensure standard configuration validation."
---

Review the `generator.ts` files for the specified generator module (or across all generator modules if `{moduleName}` is omitted). The goal is to enforce the centralized validation strategy and correct tag propagation:

## Scope Resolution
- **Specific Leaf Module**: If `{moduleName}` matches a specific leaf module ID (e.g., `/review-generators arithmetic-ops-pairs`), restrict the review strictly to that leaf module.
- **Parent Category Module**: If `{moduleName}` matches a parent category directory name (e.g., `/review-generators arithmetic` or `/review-generators shape`), review all leaf modules under that category folder.
- **All Modules**: If `{moduleName}` is omitted (e.g., `/review-generators`), discover and review all generator modules across `src/generators/`.

1. **Centralized Configuration Validation**:
   - Ensure `validateConfigFields` is imported from `../../lib/errors.ts` (with correct relative path).
   - Ensure it is called at the beginning of `generate(config)` with the required configuration parameters as defined in the spec.ts schema.
   - Ensure all silent internal fallback defaults for required config fields are removed. Generators must throw a `GeneratorValidationError` if executed with missing/empty configurations.

2. **Test Assertions**:
   - Check the corresponding `generator.test.ts` or `spec.test.ts`.
   - Ensure they include a test asserting that calling `generate` with an empty config throws an exception (e.g., `expect(() => generator.generate({})).toThrow()`).
   - Verify tests cover math boundaries and edge-cases that could cause crashes or logical contradictions (e.g., division by zero, invalid target ranges, or subtraction yielding negative/zero values under non-negative constraints).

3. **Ontology Tag Propagation**:
   - Ensure that any runtime choices representing competencies (e.g., specific shape chosen, relation chosen) are properly captured and returned in the `tags` array of `ProblemStub` so they are not lost.
   - Do NOT duplicate any tags or parameters that are already provided as part of the configuration parameters (as those are already automatically captured in `consumedLabels` by the ontology mapping layer).

4. **Code Generalization & Shared Helpers**:
   - Generator modules are organized into 1-level category sub-directories (e.g., `src/generators/arithmetic/arithmetic-ops-pairs`).
   - Shared mathematical algorithms, data structures, or helper routines used by multiple sibling modules under a category should be generalized up the tree into a parent `helpers.ts` file (e.g., `src/generators/arithmetic/helpers.ts`).
   - Leaf generator modules import from parent category helpers using relative paths (e.g. `import { helperFn } from '../helpers.ts'`).
   - Ensure imports from root `types/` or `lib/` use the 3-level relative path (`../../../types/` or `../../../lib/`).

5. **Verification**:
   - Run vitest via `npm run test`.
   - Verify unit test coverage by running `npm run test:coverage`.

Follow these instructions strictly during the review:

## 1. General Principles

- **Do Not Touch What Is Not Broken:** Keep your edits minimal. Do not rewrite or restructure generator code that already complies with validation patterns.
- **Paths**: Keep imports relative and clean (`../../../lib/` for 2-level deep leaf generators).
