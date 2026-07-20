---
name: update-gen
description: "/update-gen {moduleName} - Update the generator module src/generators/{moduleName} to match its spec, create/update its spec.test.ts, adopt consuming views, and validate."
---

Update the generator module "src/generators/{moduleName}" as follows: 

- Consider spec.ts as the source of truth for the intended behavior
- Create a spec.test.ts that using "generateWithLabels" from "utils.ts" if missing
- Adopt the behavior of the generator to match the specification if necessary

If the interface for the generated problem needed to be changed to fulfill the generator requirements then:

- find views that consume that generator's problems
- adopt them to properly render these new problems

For validation:

- review and update the "/src/specs/test" spec module if needed to ensure you will have generation examples
- run the "src/scripts/generate-dataset.ts" script using the respective "--spec", "--generator" and "--view" settings
- review the generation results and fix remaining issues if needed

For reference: You can visit the neighboring "arithmetic" module and treat it as a reference implementation.

IMPORTANT: 

- SOLELY focus on the generators and views
- Do NOT update code outside the views and generators without user confirmation
- Do NOT care about matching of competencies with the ccs standard for now
- Do NOT assume the need for backward compatibility with legacy code
- Do NOT modify spec.ts without user confirmation
