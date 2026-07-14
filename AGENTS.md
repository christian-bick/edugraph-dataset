# Instructions for Coding Agents

When starting a new session, confirm that you have read this document as well as all other documents named here.

## 1. Interactions

- **Respect Questions:** When asked questions, answer the question and make helpful suggestions. Never start coding without explicit confirmation when asked questions.
- **Provide Summaries:** When performing coding tasks, always provide a brief summary and explanation of your changes. Highlight key findings and decisions you have made autonomously on the way.
- **Ask for Help:** When you keep failing on a task, stop and explain your issue. Ask for human expert opinion to collaboratively solve particularly hard tasks.

## 2. Coding

- **Planning:** Make a plan and weigh options before starting larger codings tasks.
- **Design Principles:** Prefer loose coupling, high composability and statelessness. 
- **Refactoring:** When encountering large code blocks, split them into small chainable functions before touching the existing code.
- **Tests:** Generate and execute unit tests for all code in `scripts`, `lib`, and generator modules using the `{filename}.tests.js` (or `{filename}.test.ts`) convention in the same directory. Unit tests must achieve high coverage, which should be verified by running `npm run test:coverage`.
- **Validation Checklists:** A `checklist.md` for visual and structural validation must be added for every generator module (detailing abstract pedagogical requirements) and view module (detailing visual layout, interactive, and rendering requirements).
- **Visual Dataset Validation:** Perform visual and schema dataset validation for each touched module by running: `npx vite-node src/scripts/validate-dataset.ts {module_name}`.

## 3. Project Context

Before executing any tasks always make yourself familiar with the project:

- **Read the README.md** to make yourself familiar with the usage and general project structure
- **Read the DOCS.md** to make yourself familiar with the technical documentation

Update these documents after making larger changes to the project.