/**
 * Structural validation for the reference library under `docs/`.
 *
 * The library is the single source of truth for module authoring rules, and
 * everything else (DOCS.md, AGENTS.md, the skills) points into it by stable
 * rule ID. None of that is enforced by the type system, so this validator
 * checks the wiring: that every cited rule exists, every link resolves, and
 * every reference file keeps the structure the review skills navigate by.
 */

/** Prefixes of the rule ID taxonomy. `TSPEC` must precede `SPEC` in the alternation. */
const RULE_ID_PATTERN = String.raw`(?:TSPEC|SPEC|CHK|IMPL)-[GV]?\d+`;

const RULE_ID = new RegExp(String.raw`\b${RULE_ID_PATTERN}\b`, 'g');
const RULE_HEADING = new RegExp(String.raw`^###\s+(${RULE_ID_PATTERN})\b`, 'gm');
const HEADING = /^#{1,6} (.+)$/gm;
const MARKDOWN_LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;
const DOCS_SECTION_REF = /DOCS\.md\s*§\s*([0-9]+[a-z]?)/g;
const DOCS_PATH_REF = /docs\/([a-z0-9-]+\.md)/g;
const PROTOCOL = /^[a-z][a-z0-9+.-]*:/i;

export const REFERENCE_DIR = 'docs/';
export const REFERENCE_INDEX = 'docs/README.md';
export const AUDIT_HEADING = '## Audit';

export interface DocsValidationStats {
    referenceFiles: number;
    filesScanned: number;
    rulesDefined: number;
    rulesCited: number;
}

export interface DocsValidationResult {
    errors: string[];
    warnings: string[];
    stats: DocsValidationStats;
}

export interface DocsValidationInput {
    /** Every participating markdown file, keyed by repo-relative path with forward slashes. */
    files: Map<string, string>;
    /** Section identifiers defined in DOCS.md (e.g. "4", "4b"). */
    docsSections: Set<string>;
    /** Existence predicate for link targets outside `files`, given a repo-relative path. */
    exists: (repoRelativePath: string) => boolean;
}

/** A reference file is any library file other than the index. */
export function isReferenceFile(path: string): boolean {
    return path.startsWith(REFERENCE_DIR) && path !== REFERENCE_INDEX;
}

/** Reproduces GitHub's heading-to-anchor slug: strip punctuation, spaces to hyphens. */
export function slugifyHeading(heading: string): string {
    return heading
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 \-_]/g, '')
        .replace(/ /g, '-');
}

/** Resolves a relative markdown link target against the linking file's directory. */
export function resolveRelative(fromFile: string, target: string): string {
    const segments = fromFile.split('/').slice(0, -1).concat(target.split('/'));
    const out: string[] = [];
    for (const segment of segments) {
        if (segment === '' || segment === '.') continue;
        if (segment === '..') out.pop();
        else out.push(segment);
    }
    return out.join('/');
}

const matchAll = (content: string, re: RegExp): RegExpMatchArray[] =>
    [...content.matchAll(new RegExp(re.source, re.flags))];

/** Maps each defined rule ID to the reference files defining it. */
export function collectRuleDefinitions(files: Map<string, string>): Map<string, string[]> {
    const definitions = new Map<string, string[]>();
    for (const [path, content] of files) {
        if (!isReferenceFile(path)) continue;
        for (const match of matchAll(content, RULE_HEADING)) {
            const id = match[1];
            if (!definitions.has(id)) definitions.set(id, []);
            definitions.get(id)!.push(path);
        }
    }
    return definitions;
}

/** Extracts the trailing `## Audit` section of a reference file, or null if absent. */
export function extractAuditSection(content: string): string | null {
    const start = content.indexOf(AUDIT_HEADING);
    if (start < 0) return null;
    const rest = content.slice(start + AUDIT_HEADING.length);
    const next = rest.search(/^## /m);
    return next < 0 ? rest : rest.slice(0, next);
}

function validateLinks(
    path: string,
    content: string,
    input: DocsValidationInput,
    anchorsByFile: Map<string, Set<string>>,
    errors: string[],
    warnings: string[]
): void {
    for (const match of matchAll(content, MARKDOWN_LINK)) {
        const target = match[1];
        if (target.startsWith('#')) {
            const anchors = anchorsByFile.get(path)!;
            if (!anchors.has(target.slice(1))) {
                errors.push(`${path}: link to unknown anchor "${target}" in this file.`);
            }
            continue;
        }
        if (PROTOCOL.test(target)) {
            if (target.startsWith('file:')) {
                warnings.push(`${path}: machine-specific absolute link "${target}" — use a repo-relative path.`);
            }
            continue;
        }

        const [rawPath, anchor] = target.split('#');
        const resolved = resolveRelative(path, rawPath);
        if (!input.files.has(resolved) && !input.exists(resolved)) {
            errors.push(`${path}: link target "${target}" does not exist (resolved to ${resolved}).`);
            continue;
        }
        if (anchor && anchorsByFile.has(resolved) && !anchorsByFile.get(resolved)!.has(anchor)) {
            errors.push(`${path}: link to unknown anchor "#${anchor}" in ${resolved}.`);
        }
    }
}

/**
 * Validates rule ID wiring, link integrity and reference file structure across
 * the documentation set. Errors are contract violations that break navigation;
 * warnings are drift that a human should look at but that still resolves.
 */
export function validateDocs(input: DocsValidationInput): DocsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const definitions = collectRuleDefinitions(input.files);
    const cited = new Set<string>();

    for (const [id, paths] of definitions) {
        if (paths.length > 1) {
            errors.push(`Rule ${id} is defined in multiple files: ${paths.join(', ')}. Rule IDs must be unique.`);
        }
    }

    const anchorsByFile = new Map<string, Set<string>>();
    for (const [path, content] of input.files) {
        anchorsByFile.set(path, new Set(matchAll(content, HEADING).map(m => slugifyHeading(m[1]))));
    }

    for (const [path, content] of input.files) {
        for (const match of matchAll(content, RULE_ID)) {
            const id = match[0];
            cited.add(id);
            if (!definitions.has(id)) {
                errors.push(`${path}: cites rule ${id}, which is not defined in ${REFERENCE_DIR}.`);
            }
        }

        for (const match of matchAll(content, DOCS_PATH_REF)) {
            const referenced = `${REFERENCE_DIR}${match[1]}`;
            if (!input.files.has(referenced)) {
                errors.push(`${path}: references "${referenced}", which does not exist.`);
            }
        }

        for (const match of matchAll(content, DOCS_SECTION_REF)) {
            if (!input.docsSections.has(match[1])) {
                errors.push(`${path}: references DOCS.md § ${match[1]}, which is not a section of DOCS.md.`);
            }
        }

        validateLinks(path, content, input, anchorsByFile, errors, warnings);
    }

    const index = input.files.get(REFERENCE_INDEX);
    for (const [path, content] of input.files) {
        if (!isReferenceFile(path)) continue;

        const audit = extractAuditSection(content);
        if (audit === null) {
            errors.push(`${path}: has no "${AUDIT_HEADING}" section. Review skills navigate to it by heading.`);
        } else {
            const uncovered = [...definitions]
                .filter(([, paths]) => paths.includes(path))
                .map(([id]) => id)
                .filter(id => !new RegExp(String.raw`\b${id}\b`).test(audit));
            if (uncovered.length > 0) {
                warnings.push(`${path}: rule(s) ${uncovered.join(', ')} defined but absent from its Audit section.`);
            }
        }

        if (index !== undefined && !index.includes(path.slice(REFERENCE_DIR.length))) {
            warnings.push(`${path}: not linked from ${REFERENCE_INDEX}.`);
        }
    }

    return {
        errors,
        warnings,
        stats: {
            referenceFiles: [...input.files.keys()].filter(isReferenceFile).length,
            filesScanned: input.files.size,
            rulesDefined: definitions.size,
            rulesCited: cited.size,
        },
    };
}

/** Parses the section identifiers of DOCS.md from its `## <id>. <title>` headings. */
export function parseDocsSections(docsContent: string): Set<string> {
    return new Set(
        matchAll(docsContent, /^## ([0-9]+[a-z]?)\./gm).map(m => m[1])
    );
}
