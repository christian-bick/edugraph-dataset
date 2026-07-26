---
name: create-spec-from-standard
description: "/create-spec-from-standard {standardId|gradeFile} - Autonomous orchestrator skill to translate educational standard leaf nodes into valid target specs, categorizing expressible matching targets into spec, expressible gaps into implementationTodos, and missing ontology concepts into ontologyTodos."
---

Orchestrate generating a valid competency target spec file for a new grade or educational standard module under `src/spec/[<module>/]{gradeFile}.ts` (e.g., `src/spec/ccss/grade-02.ts` or target standards file).

Use `public/coverage/ccss-tree.json` (or standard tree source) as the starting hypothesis for standard hierarchy (Grade $\rightarrow$ Domain $\rightarrow$ Cluster $\rightarrow$ Standard / SubStandard leaf nodes).

Study existing grade target specs in `src/spec/ccss/` (such as `kindergarten.ts` and `grade-01.ts`) for exact structure and patterns.

---

### Step-by-Step Orchestrator Workflow:

#### Step 1: Analyze Standard Leaf Nodes
- Traverse the standard tree (`public/coverage/ccss-tree.json`) down to individual leaf nodes.
- For each leaf node standard, identify the distinct mathematical competencies required. Create one `DatasetPermutationBuilder` per competency.

#### Step 2: Express Competencies via Ontology Labels
- Translate each competency's requirements into EduGraph ontology labels (`edugraph-ts` `Area`, `Scope`, `Ability`).
- Follow `TSPEC-6` in `docs/target-spec.md`: declare the most specific ontology label that is a *true statement* about what the standard demands, and never stretch or invent label combinations to force a match with existing generators/views.

#### Step 3: Run Matching Probes
- Run matching probe using the pre-approved npm script:
  ```bash
  npm run show:matching -- --spec=<specModule>
  ```
- Evaluate how the proposed permutations map against current generator and view catalogs.

#### Step 4: Categorize Targets into Exports
Sort every competency into exactly one export, following the export contract and the decision table in `docs/target-spec.md` (`TSPEC-1`, `TSPEC-7`): `spec` for permutations with both a matching generator and a compatible view, `implementationTodos` for those expressible in the ontology but lacking module support, `ontologyTodos` for those the ontology cannot express at all.

Build all of them per `TSPEC-3`/`TSPEC-4` (one builder per competency, mapped through `toTargets`). If two definitions turn out to be deliberately indistinguishable, declare it in `equivalentTargets` per `TSPEC-8`.

#### Step 5: Validate Target Specs
Run the validation gate from `TSPEC-9`:
```bash
npm run check:standards-spec -- --spec=<specModule>
```
And run repository-wide checks:
```bash
npm run check -- --spec=<specModule>
```

#### Step 6: Summary & Output
- Present a clear summary report of the generated spec file:
  - Total active targets in `spec`
  - Total implementation gaps in `implementationTodos`
  - Total missing ontology concepts in `ontologyTodos`
- **DO NOT automatically trigger follow-up loops.** Present the findings to the user and stop so the user can manually decide when to trigger `/implement-spec` or `/update-ontology`.
