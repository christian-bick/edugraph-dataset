# Checklist Rules — View

Rules for the visual QA contract formed by the central view checklist and one checklist for
each view.

**Applies to:** `src/visuals/views/checklist.md` and every view `checklist.md`.
**Verify with:** `npm run validate:dataset -- --view=Y --spec=test`

---

## Rules

### CHK-V6 — Keep one minimal, observable contract per view

Visual QA loads exactly two files: the central checklist and the selected view's checklist.
There are no category or generator checklists.

Both files contain checklist criteria only. A view checklist has no title or headings; the
evaluator adds the generic `## View-specific checklist` heading, inserts the view criteria,
then appends the central checklist under its existing H2. It adds no wrapper text or
implementation metadata.

The central checklist is written for a first-time observer and owns broad rules that apply
to every rendered exercise: task identifiability, separate Question and Solution mode
requirements, text economy, mathematical coherence, ontology-label support, layout
integrity, and rendering integrity. Validation policy belongs here rather than in the
unhashed evaluator prompt. Its label policy distinguishes a rendered witness from text that
merely names or asserts the claimed object, representation, relation, method, or structure.

Every view must have one heading-free `checklist.md` containing:

- **Identity:** the shortest observable description that distinguishes the intended task;
- **Modes:** what Question Mode withholds and what Solution Mode reveals, including any
  mode-specific instruction needed to make that image understandable on its own;
- optionally, **Essential specifics:** only a visual defect unique to that view that the
  central checklist and the first two bullets would not let an evaluator detect.

View criteria describe only observable rendered results. They do not mention payload or
configuration fields, RNG, identifiers, implementation classes, CSS details, or behavior
already established by deterministic unit tests.

Apply one review question to every sentence: **if it were removed, could a capable visual
evaluator still distinguish a valid image from the defect this sentence protects against?**
If yes, remove it. If no, keep the shortest version that makes the distinction reliable.
A view may make a central rule concrete for its view, but cannot weaken the central rule.

---

## Audit

- [ ] **CHK-V6** — the central checklist contains only checks both standalone task identity and observable support for every supplied label, rejects names or assertions as substitutes for required structural evidence, and owns the label-verdict policy; every leaf view has exactly one checklist with concise **Identity** and **Modes** criteria; any additional criterion passes the removal question, concerns only observable pixels, and does not weaken a central rule.
