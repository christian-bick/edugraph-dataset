import { describe, expect, it } from 'vitest';
import {
    collectRuleDefinitions,
    extractAuditSection,
    isReferenceFile,
    parseDocsSections,
    resolveRelative,
    slugifyHeading,
    validateDocs,
    type DocsValidationInput,
} from './docs-validator.ts';

const CLEAN_INDEX = `# EduGraph Reference Library

- [spec-general.md](spec-general.md)
`;

const CLEAN_REFERENCE = `# Spec Rules — General

### SPEC-1 — Matching is one-directional

Body text.

## Audit

- [ ] **SPEC-1** — capabilities are equal or more specific.
`;

const CLEAN_DOCS = `# Technical Documentation

## 1. Architecture Overview

Authoring rules live in [spec-general.md](docs/spec-general.md); see \`SPEC-1\`.
`;

function buildInput(overrides: Record<string, string | null> = {}): DocsValidationInput {
    const files = new Map<string, string>([
        ['docs/README.md', CLEAN_INDEX],
        ['docs/spec-general.md', CLEAN_REFERENCE],
        ['DOCS.md', CLEAN_DOCS],
    ]);
    for (const [path, content] of Object.entries(overrides)) {
        if (content === null) files.delete(path);
        else files.set(path, content);
    }
    return {
        files,
        docsSections: parseDocsSections(files.get('DOCS.md') ?? ''),
        exists: () => false,
    };
}

describe('slugifyHeading', () => {
    it('lowercases and hyphenates a plain heading', () => {
        expect(slugifyHeading('Audit')).toBe('audit');
        expect(slugifyHeading('Rules And Things')).toBe('rules-and-things');
    });

    it('drops punctuation, leaving a double hyphen where an em dash was', () => {
        expect(slugifyHeading('SPEC-1 — Matching is one-directional: the rule'))
            .toBe('spec-1--matching-is-one-directional-the-rule');
    });

    it('preserves existing hyphens and underscores', () => {
        expect(slugifyHeading('IMPL-V6 — payload_seed')).toBe('impl-v6--payload_seed');
    });
});

describe('resolveRelative', () => {
    it('resolves a sibling file', () => {
        expect(resolveRelative('docs/spec-general.md', 'spec-view.md')).toBe('docs/spec-view.md');
    });

    it('resolves a parent traversal', () => {
        expect(resolveRelative('docs/README.md', '../DOCS.md')).toBe('DOCS.md');
    });

    it('resolves an explicit current-directory prefix', () => {
        expect(resolveRelative('README.md', './docs/README.md')).toBe('docs/README.md');
    });

    it('resolves a descent from the repository root', () => {
        expect(resolveRelative('DOCS.md', 'docs/spec-view.md')).toBe('docs/spec-view.md');
    });
});

describe('isReferenceFile', () => {
    it('accepts library files but not the index or outside files', () => {
        expect(isReferenceFile('docs/spec-general.md')).toBe(true);
        expect(isReferenceFile('docs/README.md')).toBe(false);
        expect(isReferenceFile('DOCS.md')).toBe(false);
    });
});

describe('collectRuleDefinitions', () => {
    it('collects rule headings from reference files only', () => {
        const definitions = collectRuleDefinitions(new Map([
            ['docs/spec-general.md', '### SPEC-1 — A\n### SPEC-V2 — B\n'],
            ['docs/README.md', '### SPEC-9 — Not a definition\n'],
            ['DOCS.md', '### IMPL-G1 — Also not a definition\n'],
        ]));
        expect([...definitions.keys()]).toEqual(['SPEC-1', 'SPEC-V2']);
    });

    it('records every file defining the same id', () => {
        const definitions = collectRuleDefinitions(new Map([
            ['docs/a.md', '### CHK-1 — A\n'],
            ['docs/b.md', '### CHK-1 — B\n'],
        ]));
        expect(definitions.get('CHK-1')).toEqual(['docs/a.md', 'docs/b.md']);
    });

    it('distinguishes TSPEC from SPEC ids', () => {
        const definitions = collectRuleDefinitions(new Map([
            ['docs/target-spec.md', '### TSPEC-1 — Export contract\n'],
        ]));
        expect([...definitions.keys()]).toEqual(['TSPEC-1']);
    });
});

describe('extractAuditSection', () => {
    it('returns null when the section is absent', () => {
        expect(extractAuditSection('# Title\n\nBody.\n')).toBeNull();
    });

    it('returns the trailing audit body', () => {
        expect(extractAuditSection('# T\n\n## Audit\n\n- [ ] SPEC-1\n')).toContain('SPEC-1');
    });

    it('stops at the next second-level heading', () => {
        const audit = extractAuditSection('## Audit\n\n- [ ] CHK-1\n\n## Appendix\n\n- [ ] CHK-2\n');
        expect(audit).toContain('CHK-1');
        expect(audit).not.toContain('CHK-2');
    });
});

describe('parseDocsSections', () => {
    it('parses numbered and suffixed section ids', () => {
        expect(parseDocsSections('## 1. A\n## 4. B\n## 4b. C\n### 9. Not top level\n'))
            .toEqual(new Set(['1', '4', '4b']));
    });
});

describe('validateDocs', () => {
    it('reports no errors for a well-wired documentation set', () => {
        const result = validateDocs(buildInput());
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('reports accurate statistics', () => {
        const result = validateDocs(buildInput());
        expect(result.stats).toEqual({
            referenceFiles: 1,
            filesScanned: 3,
            rulesDefined: 1,
            rulesCited: 1,
        });
    });

    it('rejects a rule id defined in two files', () => {
        const result = validateDocs(buildInput({
            'docs/spec-view.md': '### SPEC-1 — Duplicate\n\n## Audit\n\n- [ ] SPEC-1\n',
            'docs/README.md': `${CLEAN_INDEX}- [spec-view.md](spec-view.md)\n`,
        }));
        expect(result.errors).toContainEqual(expect.stringContaining('defined in multiple files'));
    });

    it('rejects a citation of an undefined rule', () => {
        const result = validateDocs(buildInput({
            'DOCS.md': `${CLEAN_DOCS}\nAlso see \`IMPL-G9\`.\n`,
        }));
        expect(result.errors).toContainEqual(expect.stringContaining('cites rule IMPL-G9'));
    });

    it('rejects a reference to a missing library file', () => {
        const result = validateDocs(buildInput({
            'DOCS.md': `${CLEAN_DOCS}\nSee docs/checklist-view.md for more.\n`,
        }));
        expect(result.errors).toContainEqual(expect.stringContaining('docs/checklist-view.md'));
    });

    it('rejects a link whose target does not exist', () => {
        const result = validateDocs(buildInput({
            'docs/spec-general.md': `${CLEAN_REFERENCE}\n[gone](spec-gone.md)\n`,
        }));
        expect(result.errors).toContainEqual(expect.stringContaining('does not exist'));
    });

    it('accepts a link to a file that exists outside the scanned set', () => {
        const input = buildInput({
            'docs/spec-general.md': `${CLEAN_REFERENCE}\n[resolvers](../src/lib/resolvers.ts)\n`,
        });
        const result = validateDocs({ ...input, exists: path => path === 'src/lib/resolvers.ts' });
        expect(result.errors).toEqual([]);
    });

    it('rejects a link to an unknown anchor in another file', () => {
        const result = validateDocs(buildInput({
            'DOCS.md': `${CLEAN_DOCS}\n[rule](docs/spec-general.md#spec-99--nope)\n`,
        }));
        expect(result.errors).toContainEqual(expect.stringContaining('unknown anchor "#spec-99--nope"'));
    });

    it('accepts a link to a valid anchor in another file', () => {
        const result = validateDocs(buildInput({
            'DOCS.md': `${CLEAN_DOCS}\n[rule](docs/spec-general.md#spec-1--matching-is-one-directional)\n`,
        }));
        expect(result.errors).toEqual([]);
    });

    it('rejects a same-file anchor that matches no heading', () => {
        const result = validateDocs(buildInput({
            'docs/spec-general.md': `${CLEAN_REFERENCE}\n[jump](#nowhere)\n`,
        }));
        expect(result.errors).toContainEqual(expect.stringContaining('unknown anchor "#nowhere"'));
    });

    it('rejects a reference to a DOCS.md section that no longer exists', () => {
        const result = validateDocs(buildInput({
            '.agents/skills/review-gen/SKILL.md': 'Audit against `DOCS.md § 4b` rules.\n',
        }));
        expect(result.errors).toContainEqual(expect.stringContaining('DOCS.md § 4b'));
    });

    it('accepts a reference to a DOCS.md section that exists', () => {
        const result = validateDocs(buildInput({
            '.agents/skills/review-gen/SKILL.md': 'See `DOCS.md § 1` for architecture.\n',
        }));
        expect(result.errors).toEqual([]);
    });

    it('rejects a reference file without an Audit section', () => {
        const result = validateDocs(buildInput({
            'docs/spec-general.md': '# Spec Rules\n\n### SPEC-1 — A rule\n\nBody.\n',
        }));
        expect(result.errors).toContainEqual(expect.stringContaining('has no "## Audit" section'));
    });

    it('warns when a defined rule is missing from its Audit section', () => {
        const result = validateDocs(buildInput({
            'docs/spec-general.md': [
                '# Spec Rules — General',
                '',
                '### SPEC-1 — Matching is one-directional',
                '',
                '### SPEC-2 — Unaudited',
                '',
                '## Audit',
                '',
                '- [ ] **SPEC-1** — capabilities are equal or more specific.',
            ].join('\n'),
        }));
        expect(result.warnings).toContainEqual(expect.stringContaining('SPEC-2'));
        expect(result.errors).toEqual([]);
    });

    it('does not confuse a rule id with a longer id sharing its prefix', () => {
        const result = validateDocs(buildInput({
            'docs/spec-general.md': '### SPEC-1 — A\n### SPEC-11 — B\n\n## Audit\n\n- [ ] SPEC-11 only\n',
        }));
        expect(result.warnings).toContainEqual(expect.stringContaining('SPEC-1'));
    });

    it('warns when a reference file is not linked from the index', () => {
        const result = validateDocs(buildInput({
            'docs/spec-view.md': '### SPEC-V1 — A rule\n\n## Audit\n\n- [ ] SPEC-V1\n',
        }));
        expect(result.warnings).toContainEqual(expect.stringContaining('not linked from docs/README.md'));
    });

    it('warns about machine-specific absolute file links', () => {
        const result = validateDocs(buildInput({
            'DOCS.md': `${CLEAN_DOCS}\n[types](file:///c:/Users/someone/repo/src/types/problems.ts)\n`,
        }));
        expect(result.warnings).toContainEqual(expect.stringContaining('machine-specific absolute link'));
        expect(result.errors).toEqual([]);
    });

    it('ignores external http links', () => {
        const result = validateDocs(buildInput({
            'DOCS.md': `${CLEAN_DOCS}\n[ontology](https://github.com/christian-bick/edugraph-ontology)\n`,
        }));
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('tolerates a documentation set with no index', () => {
        const result = validateDocs(buildInput({ 'docs/README.md': null }));
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });
});
