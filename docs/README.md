# EduGraph Reference Library

Normative rules for authoring generator and view specifications and implementations, plus
the visual checklist required for every view.

[DOCS.md](../DOCS.md) remains the entry point for architecture, the script reference, and
end-to-end workflows. This library holds the *rules* those workflows enforce.

## The matrix

|                    | General (both roles)                                     | Generator                                                      | View                                                 |
|--------------------|----------------------------------------------------------|----------------------------------------------------------------|------------------------------------------------------|
| **`spec.ts`**      | [spec-general.md](spec-general.md)                       | [spec-generator.md](spec-generator.md)                         | [spec-view.md](spec-view.md)                         |
| **`checklist.md`** | —                                                        | —                                                              | [checklist-view.md](checklist-view.md)               |
| **Implementation** | [implementation-general.md](implementation-general.md)   | [implementation-generator.md](implementation-generator.md)     | [implementation-view.md](implementation-view.md)     |

Generator- and view-specific spec and implementation references assume their general
companion. The view checklist reference is standalone because generators have no VQA
checklist.

Standing outside the matrix, because it describes standards rather than modules:

- [target-spec.md](target-spec.md) — authoring competency targets under `src/spec/`.
- [target-spec-plan-template.md](target-spec-plan-template.md) — required Pass 1 structure for
  reviewable standard-to-target plans.

## Which files to load

| Task                                          | Load                                                              |
|-----------------------------------------------|-------------------------------------------------------------------|
| Planning competency targets from a standard  | `target-spec.md` + `target-spec-plan-template.md`                 |
| Authoring competency targets in `src/spec/`   | `target-spec.md`                                                  |
| Auditing or writing a generator `spec.ts`     | `spec-general.md` + `spec-generator.md`                           |
| Auditing or writing a view `spec.ts`          | `spec-general.md` + `spec-view.md`                                |
| Auditing or writing a view `checklist.md`     | `checklist-view.md`                                               |
| Writing or reviewing `generator.ts`           | `implementation-general.md` + `implementation-generator.md`       |
| Writing or reviewing `view.tsx`               | `implementation-general.md` + `implementation-view.md`            |
| Full review of one generator module           | its spec, implementation, and tests + their references            |
| Full review of one view module                | its spec, checklist, implementation + their references            |
| Creating a new module from scratch            | `implementation-general.md` first, then the role's spec + impl    |

## Rule IDs

Every rule carries a stable ID so skills, reviews and findings can cite it without
depending on document section numbers:

| Prefix    | Scope                                    |
|-----------|------------------------------------------|
| `TSPEC-n` | competency target specs (`src/spec/`)    |
| `SPEC-n`  | `spec.ts`, both roles                    |
| `SPEC-Gn` | `spec.ts`, generators only               |
| `SPEC-Vn` | `spec.ts`, views only                    |
| `CHK-Vn`  | `checklist.md`, views only               |
| `IMPL-n`  | module structure, both roles             |
| `IMPL-Gn` | `generator.ts` and its tests             |
| `IMPL-Vn` | `view.html` / `view.tsx`                 |

IDs are append-only. If a rule is retired, leave its ID unused rather than renumbering.

Each file ends with an **Audit** section: the same rules restated as imperative,
verifiable checks. Reviews work from the Audit section; authors work from the Rules
section above it.
