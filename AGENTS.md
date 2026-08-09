# Instructions for Coding Agents

## 1. Interaction with the User

- **Respect Questions:** When asked questions, answer the question and make helpful suggestions. Never start coding without explicit confirmation when asked questions.
- **Provide Summaries:** When performing coding tasks, always provide a brief summary and explanation of your changes. Highlight key findings and decisions you have made autonomously on the way.
- **Ask for Help:** When you keep failing on a task, stop and explain the issue. Ask for human expert opinion and collaboratively solve particularly hard tasks.

## 2. General Coding Instructions

- **Planning:** Make a plan and weigh options before starting larger codings tasks.
- **Code Organization:** Prefer loose coupling, high composability and clear separation of concerns.
- **Functional Style:** Prefer short, chainable and pure functions with well-scoped responsibilities.
- **Naming:** Prefer self-explaining and concise names. Add code docs to inherently complex functions and classes.
- **Tests:** Generate and execute unit tests for all code in `lib`, and generator modules using the `{filename}.test.ts` convention in the same directory. Unit tests must achieve high coverage, which should be verified by running `npm run test:coverage`.
- **Temporary Files:** Never write scratch files to the repository root. Captured command output, logs, intermediate data and any other throwaway artifact belongs in `./temp/` (gitignored) — e.g. `npm run check > temp/check-output.txt`, not `> check_output.txt`. Generated dataset artifacts are the exception and belong in `./out/`, written by the pipeline scripts rather than by hand. Clean up scratch files you no longer need.

## 3. Specific Project and Coding Documentation

Before executing any tasks always make yourself familiar with the project:

- **ALWAYS read the README.md** to make yourself familiar with the artifact usage and general project context
- **ALWAYS read the DOCS.md** to make yourself familiar with the architecture, the scripts, and the development workflows
- **ALWAYS load the relevant reference from `docs/`** before authoring or reviewing a `spec.ts`, a `checklist.md`, a generator/view implementation, or a competency target spec. `docs/README.md` indexes them and says which to load for which task. These references are the single source of truth for authoring rules, and every rule has a stable ID (`SPEC-3`, `CHK-V6`, `IMPL-G2`, `TSPEC-1`) — cite the ID when reporting a violation.

Update these documents after making larger changes to the project. A rule belongs in `docs/`; architecture, scripts and workflows belong in `DOCS.md`. Do not restate one in the other.
