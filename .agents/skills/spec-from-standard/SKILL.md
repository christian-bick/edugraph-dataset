---
name: create-spec-from-standard
description: "/create-spec-from-standard {grade} - Two-pass workflow that first creates a reviewable competency plan, then translates approved standard leaf nodes into valid target specs with matching-diff and distinctness reports."
---

Create or extend a competency target spec under `src/spec/[<module>/]{grade}.ts` from educational-standard leaf nodes. This is deliberately a **two-pass workflow with a user review boundary**: Pass 1 produces analysis artifacts only; Pass 2 edits the target spec only after the user explicitly approves that plan.

Use `public/coverage/ccss-tree.json` (or the relevant standard tree) as the starting hypothesis for the hierarchy. Study existing target specs in the same module. Read and follow `docs/target-spec.md` and `docs/target-spec-plan-template.md` throughout.

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

Read `docs/target-spec-plan-template.md` completely. Copy its plan heading and table structure
from **Source Scope** through **Open Questions** into
`temp/spec-plans/<specModule>/<planName>/plan.md`, replace every placeholder, and use the
template's final **Audit** section as a checklist without copying it. Keep the plan section
order; write `None.` when a section is empty instead of inventing an alternative structure.

Complete the template with these constraints:

- Quote the source scope and create one disposition row per distinct competency, not merely
  one row per leaf (`TSPEC-3`).
- Put every competency in exactly one of `spec`, `implementationTodos`, `ontologyTodos`, or
  `beyondScope` (`TSPEC-7`).
- Give active and implementation targets their programmatic builder dimensions,
  most-specific truthful ontology labels, and visible or necessary textual evidence
  (`TSPEC-4`, `TSPEC-6`, `TSPEC-13`).
- Record expected active generator/view matches and suspicious boundaries. For every
  implementation TODO, give a stable `group` and identify generator/view ownership: bare id
  for reuse as-is, `△` for adopting an existing module, and `＋` for a proposed new module.
- Declare intentional equivalent definitions (`TSPEC-8`) and keep their count consistent with
  the disposition summary.
- Put accepted facts, rationale, matching expectations, and distinctness predictions under
  **Detailed Design Decisions**. Do not create a separate notes section.
- Put only unresolved, directly answerable decisions under **Open Questions**. Phrase every
  numbered item as a question ending in `?`.
- Keep counts only in **Disposition Summary**. Do not add an implementation-package summary
  or project permutation counts for ontology TODOs before valid builders exist.

The plan may show illustrative TypeScript fragments, but it must not create a temporary
executable spec file.

### 4. Review boundary

Present the plan path and a concise disposition/package summary to the user, then **stop**. Do not begin Pass 2, edit the target spec, create ontology issues, or trigger implementation work without explicit approval.

## Pass 2 — Implement the approved plan

Resume only after the user approves Pass 1, incorporating any requested changes.

### 1. Author the target file

- Create one `DatasetPermutationBuilder` per competency and map it with `toTargets`.
- Use `toImplementationTodos(prefix, builder, group, explanation)` for implementation gaps; `group` is the stable implementation-package identity.
- Export only the five target-spec contract names with their exact types (`TSPEC-1`, `TSPEC-2`).
- Never stretch labels to force a match. Every active label must also be reasonably identifiable and defendable from the expected rendered artifact, not merely from the source standard's prose (`TSPEC-6`, `TSPEC-13`).

### 2. Validate and inspect matching

```bash
npm run check:standards-spec -- --spec=<specModule>
npm run show:matching -- --spec=<specModule>
npm run analyze:target-distinctness -- --spec=<specModule> --plan=<planName>
npm run report:matching-diff -- --spec=<specModule> --plan=<planName>
```

The distinctness report is advisory. Review identical, contained, overlapping, and one-label-adjacent definitions; an entry is not automatically a defect. The matching diff is also advisory, but every added or removed generator-view pair must be explained by the approved plan. For each intended production match, inspect whether the rendered task can actually evidence its labels (`TSPEC-13`); semantic matching alone is insufficient.

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
