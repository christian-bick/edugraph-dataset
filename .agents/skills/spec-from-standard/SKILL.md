---
name: create-spec-from-standard
description: "/create-spec-from-standard {grade} - Two-pass workflow that first creates a reviewable competency plan, then translates approved standard leaf nodes into valid target specs with matching-diff and distinctness reports."
---

Create or extend a competency target spec under `src/spec/[<module>/]{grade}.ts` from educational-standard leaf nodes. This is deliberately a **two-pass workflow with a user review boundary**: Pass 1 produces analysis artifacts only; Pass 2 edits the target spec only after the user explicitly approves that plan.

Use `public/coverage/ccss-tree.json` (or the relevant standard tree) as the starting hypothesis for the hierarchy. Study existing target specs in the same module and follow `docs/target-spec.md` throughout.

## Stable plan workspace

Choose a short plan name from the target file without its extension, such as `grade-02`. Keep every intermediate artifact under:

```text
temp/spec-plans/<specModule>/<planName>/
├── plan.md
├── matching-before.json
├── matching-after.json
├── matching-diff.md
└── target-distinctness.md
```

`temp/` is gitignored. The plan directory is review state, not a committed source of truth.

## Pass 1 — Analyze and stop for review

### 1. Establish the source scope

- Traverse the standard tree to the exact leaf nodes covered by the requested grade/file.
- Quote the source text needed to justify each competency.
- Study neighboring grade files for established builder, naming, and disposition patterns.
- Do **not** edit `src/spec/` during this pass.

### 2. Capture the matching baseline

Before changing target definitions, record the current matching state: production-normalized active targets plus any implementation TODOs and their dispositions.

```bash
npm run report:matching-diff -- --spec=<specModule> --plan=<planName> --capture-before
```

Do not replace an existing baseline unless restarting that plan intentionally; replacement requires `--force`.

### 3. Author `plan.md`

Create `temp/spec-plans/<specModule>/<planName>/plan.md` with:

- source scope and relevant standard quotations;
- one row per distinct competency covered by leaf node in the start, not merely one row per node;
- proposed builder dimensions and most-specific truthful ontology labels (`TSPEC-3`, `TSPEC-4`, `TSPEC-6`);
- proposed disposition: `spec`, `implementationTodos`, `ontologyTodos`, or `beyondScope` (`TSPEC-7`);
- expected generator/view matches and any matches that would be semantically suspicious;
- proposed `equivalentTargets` declarations, if any (`TSPEC-8`);
- a stable `group` string for every proposed implementation TODO package;
- ontology questions and other decisions requiring user review.

The plan may show illustrative TypeScript fragments, but it must not create a temporary executable spec file.

### 4. Review boundary

Present the plan path and a concise disposition/package summary to the user, then **stop**. Do not begin Pass 2, edit the target spec, create ontology issues, or trigger implementation work without explicit approval.

## Pass 2 — Implement the approved plan

Resume only after the user approves Pass 1, incorporating any requested changes.

### 1. Author the target file

- Create one `DatasetPermutationBuilder` per competency and map it with `toTargets`.
- Use `toImplementationTodos(prefix, builder, group, explanation)` for implementation gaps; `group` is the stable implementation-package identity.
- Export only the five target-spec contract names with their exact types (`TSPEC-1`, `TSPEC-2`).
- Never stretch labels to force a match (`TSPEC-6`).

### 2. Validate and inspect matching

```bash
npm run check:standards-spec -- --spec=<specModule>
npm run show:matching -- --spec=<specModule>
npm run analyze:target-distinctness -- --spec=<specModule> --plan=<planName>
npm run report:matching-diff -- --spec=<specModule> --plan=<planName>
```

The distinctness report is advisory. Review identical, contained, overlapping, and one-label-adjacent definitions; an entry is not automatically a defect. The matching diff is also advisory, but every added or removed generator-view pair must be explained by the approved plan.

If either report reveals an unapproved semantic change, correct the target definitions and regenerate both reports before proceeding.

### 3. Run the repository gate

```bash
npm run check -- --spec=<specModule>
```

### 4. Summarize and stop

Report:

- active target and permutation counts;
- implementation groups and permutation counts;
- ontology gaps and beyond-scope competencies;
- intentional equivalences;
- matching pairs added/removed;
- distinctness findings reviewed and their disposition;
- paths to `plan.md`, `matching-diff.md`, and `target-distinctness.md`.

Do **not** automatically trigger `/implement-spec` or `/update-ontology`. The user decides when those follow-up workflows begin.
