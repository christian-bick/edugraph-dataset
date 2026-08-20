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
  `beyondScope` (`TSPEC-7`). Different competencies bundled in one leaf may have different
  dispositions, but never split one competency into a currently supported active slice and
  an unsupported TODO remainder.
- Give active and implementation targets their programmatic builder dimensions,
  most-specific truthful ontology labels, and visible or necessary textual evidence
  (`TSPEC-4`, `TSPEC-6`, `TSPEC-13`).
- For every Ability, identify the expected leaf-view task that makes it observable. Do not assign
  an Ability to a generator role or rely on a generator-authored blank, prompt, hint, or requested
  reasoning (`SPEC-V5`, `IMPL-G8`).
- Give every ontology TODO a stable ontology package id. Reuse that id across leaf entries
  when one coherent ontology change serves them; identify each proposed entity's dimension.
- Record expected active generator/view matches and suspicious boundaries. For every
  implementation TODO, give a stable implementation id and identify every generator/view
  role: bare id for `reuse`, `△` for `expand`, and `＋` for `new`.
- Declare an intentional equivalence only when the complete source leaf competencies are
  semantically indistinguishable: each means or implies 100% of the other (`TSPEC-8`). An
  identical current label/permutation set, production match, supported number range, or task
  slice is necessary for the declaration to validate but is not evidence of semantic
  equivalence. Partial overlap, containment, or an ontology/implementation gap must remain
  distinct and be refined or parked in the appropriate TODO instead. Keep the accepted
  declaration count consistent with the disposition summary.
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
- Define each reviewed package once with `defineImplementationPackage`, including its stable id,
  description, and `reuse`/`expand`/`new` generator and view modules. Pass that definition to
  `toImplementationTodos(prefix, builder, implementation, explanation)` directly where the
  `implementationTodos` export is assembled.
- Define each reviewed ontology package once with `defineOntologyPackage`, including its
  stable id, description, and dimension-specific entity groups. Create every exact-leaf
  reference with `toOntologyTodo` so related standards share authored package identity.
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

For every declared equivalence, reread both source leaf quotations and confirm mutual semantic
implication before accepting the validator result. Identical normalized permutations verify only
the declaration's structural consistency; they do not establish that the source competencies are
equivalent.

If either report reveals an unapproved semantic change, correct the target definitions and regenerate both reports before proceeding.

### 3. Run the repository gate

```bash
npm run check -- --spec=<specModule>
```

### 4. Summarize and stop

Report:

- active target and permutation counts;
- implementation definitions, module strategies, and permutation counts;
- ontology gaps and beyond-scope competencies;
- intentional equivalences;
- matching pairs added/removed;
- distinctness findings reviewed and their disposition;
- paths to `plan.md`, `matching-diff.md`, and `target-distinctness.md`.

Do **not** automatically trigger `/implement-spec` or `/update-ontology`. The user decides when those follow-up workflows begin.
