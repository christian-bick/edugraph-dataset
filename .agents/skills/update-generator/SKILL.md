---
name: update-gen
description: "/update-gen {moduleName} - Update the generator module src/generators/{moduleName} to match its spec, create/update its spec.test.ts, adopt consuming views, and validate."
---

Update the generator module "src/generators/{moduleName}" as follows: 

- Consider spec.ts as the source of truth for the intended behavior
- Add a spec.test.ts that makes use of "generateWithLabels" from "utils.ts" if missing
- Update generator.test.ts if necessary or make sure to cover edge-cases there
- Adopt the behavior of the generator to match the specification if necessary
- Update the checklist.md to match with items that cover the specification 

If the interface for the generated problem needed to be changed to fulfill the generator requirements then:

- find views that consume that generator's problems
- adopt them to properly render these new problems

For validation:

- review and update the "/src/specs/test" spec module if needed to ensure you will have generation examples
- run the "src/scripts/generate-dataset.ts" script using the respective "--spec", "--generator" and "--view" settings
- review the generation results and fix remaining issues if needed

For the checklists.md:

- Only include use abstract mathematical criteria - do NOT include any visual aspects
- Assume that the validation mechanism is unaware of parameterization - do NOT include conditional validation aspects
- Be concise and focus on the most important logical validation aspects - do NOT include edge cases

Reference examples: 

- You can visit the neighboring "arithmetic" module for guidance on numeric aspects
- You can visit the neighboring "geometry-build-shape" for guidance on geometric aspects

IMPORTANT: 

- Do NOT update code outside views, generators and the "test" spec without user confirmation
- Do NOT care about matching of competencies with specs other than "test"
- Do NOT assume the need for backward compatibility with legacy code
- Do NOT modify spec.ts without user confirmation
