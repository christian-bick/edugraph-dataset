---
name: update-ontology
description: "/update-ontology [{specModule}] - Autonomous orchestrator skill to inspect ontologyTodos, perform upfront prerequisite checks (sibling repo & gh auth), group related gaps, and create formal GitHub issues in christian-bick/edugraph-ontology."
---

Orchestrate inspecting and resolving `ontologyTodos` for a spec module (default `--spec=ccss`) by grouping related missing ontological concepts and creating formal GitHub issues in the `christian-bick/edugraph-ontology` repository.

---

### Step-by-Step Orchestrator Workflow:

#### Step 1: Upfront Prerequisite Checks & Abort Safety

Before performing any analysis or issue generation, execute these two checks:

1. **Check A: Sibling Repository Presence**
   - Check if the sibling directory `../edugraph-ontology` exists and contains ontology source files (`core-areas-math.ttl`, `core-scopes-math.ttl`, etc.).
   - **If missing**: Stop execution, display the following error message, and **ABORT**:
     > `❌ Sibling repository '../edugraph-ontology' is missing.`  
     > `Instructions: Run 'git clone https://github.com/christian-bick/edugraph-ontology ../edugraph-ontology' in the parent directory to clone the ontology repository before running this skill.`

2. **Check B: GitHub CLI (`gh`) & Authentication Status**
   - Run `gh auth status`.
   - **If `gh` CLI is missing or unauthenticated**: Stop execution, display the following error message, and **ABORT**:
     > `❌ GitHub CLI ('gh') is not installed or unauthenticated.`  
     > `Instructions: Run 'gh auth login' in your terminal to authenticate with write permissions for 'christian-bick/edugraph-ontology' before running this skill.`

---

#### Step 2: Inspect & Group `ontologyTodos`
- Run the pre-approved npm script to list all pending ontology gaps:
  ```bash
  npm run show:ont-todos -- --spec=<specModule>
  ```
- Analyze the output. **Group logically related ontology TODOs within the same dimension** (e.g. missing numerical range scopes, missing operations, missing shape concepts) so they can be proposed as cohesive GitHub issues. Never combine `Scope`, `Area`, and `Ability` extensions in one issue; split cross-dimension gaps into separate issues.

#### Step 3: Inspect Sibling Ontology Repository (`../edugraph-ontology`)
- Inspect `core-schema.ttl` for a basic understanding of ontology types and relations.
- Inspect `core-areas-math.ttl` for a fitting extension of `Area`, `core-scopes-math.ttl` for `Scope` and `core-abilities` for abilities.
- Inspect taxonomy hierarchies to ensure the proposed additions fit cleanly into the ontology structure and do not duplicate existing work.

#### Step 4: Formulate & Submit GitHub Issue Proposals
For each previously grouped ontology gap, formulate a structured GitHub issue payload:
- **Title**: `[Ontology <Area|Scope|Ability>] <Clear Summary Title>`
- **Label**: Apply exactly one dimension label matching the ontology dimension extended by the issue: `dimension:Scope`, `dimension:Area`, or `dimension:Ability`. Every issue must carry one of these labels.
- **Body**:
  - **Context & Affected Standards**: CCSS standard IDs (e.g. `1.NBT.B.2c`, `K.OA.A.5`) and target definition references.
  - **Missing Concept Description**: Detailed explanation of why current ontology labels cannot express the standard's requirements.
  - **Taxonomic Placement**: `partOf` parent concept relationship.
  - **Other Relations**: if applicable suggestions for other relations like `expands` etc.
  - **Proposed Additions**: Concrete OWL diff for the specific `edugraph-ontology` file.
- Create the issue using the GitHub CLI:
  ```bash
  gh issue create --repo christian-bick/edugraph-ontology --title "[Ontology Scope] Add Scope.NumbersSmaller5" --label "dimension:Scope" --body "..."
  ```

#### Step 5: Summary Report
- Output a summary table of created GitHub issues with links and IDs.
