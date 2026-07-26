# EduGraph Reference Library

Normative rules for authoring the three artifacts of a generator or view module: its
`spec.ts`, its `checklist.md`, and its implementation (`generator.ts` / `view.tsx`).

[DOCS.md](../DOCS.md) remains the entry point for architecture, the script reference, and
end-to-end workflows. This library holds the *rules* those workflows enforce.

## The matrix

|                    | General (both roles)                                     | Generator                                                      | View                                                 |
|--------------------|----------------------------------------------------------|----------------------------------------------------------------|------------------------------------------------------|
| **`spec.ts`**      | [spec-general.md](spec-general.md)                       | [spec-generator.md](spec-generator.md)                         | [spec-view.md](spec-view.md)                         |
| **`checklist.md`** | [checklist-general.md](checklist-general.md)             | [checklist-generator.md](checklist-generator.md)               | [checklist-view.md](checklist-view.md)               |
| **Implementation** | [implementation-general.md](implementation-general.md)   | [implementation-generator.md](implementation-generator.md)     | [implementation-view.md](implementation-view.md)     |

Every "specific" reference assumes its "general" companion. Read the general file first;
the specific file states only what differs or is additional for that role.

Standing outside the matrix, because it describes standards rather than modules:

- [target-spec.md](target-spec.md) — authoring competency targets under `src/spec/`.

## Which files to load

| Task                                          | Load                                                              |
|-----------------------------------------------|-------------------------------------------------------------------|
| Authoring competency targets in `src/spec/`   | `target-spec.md`                                                  |
| Auditing or writing a generator `spec.ts`     | `spec-general.md` + `spec-generator.md`                           |
| Auditing or writing a view `spec.ts`          | `spec-general.md` + `spec-view.md`                                |
| Auditing or writing a generator `checklist.md`| `checklist-general.md` + `checklist-generator.md`                 |
| Auditing or writing a view `checklist.md`     | `checklist-general.md` + `checklist-view.md`                      |
| Writing or reviewing `generator.ts`           | `implementation-general.md` + `implementation-generator.md`       |
| Writing or reviewing `view.tsx`               | `implementation-general.md` + `implementation-view.md`            |
| Full review of one generator module           | the three generator files + their three general companions        |
| Full review of one view module                | the three view files + their three general companions             |
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
| `CHK-n`   | `checklist.md`, both roles               |
| `CHK-Gn`  | `checklist.md`, generators only          |
| `CHK-Vn`  | `checklist.md`, views only               |
| `IMPL-n`  | module structure, both roles             |
| `IMPL-Gn` | `generator.ts` and its tests             |
| `IMPL-Vn` | `view.html` / `view.tsx`                 |

IDs are append-only. If a rule is retired, leave its ID unused rather than renumbering.

Each file ends with an **Audit** section: the same rules restated as imperative,
verifiable checks. Reviews work from the Audit section; authors work from the Rules
section above it.
