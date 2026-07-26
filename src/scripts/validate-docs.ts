import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parseDocsSections, validateDocs, type DocsValidationResult } from '../lib/docs-validator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

/** Files outside `docs/` that may cite rule IDs or link into the reference library. */
const CONSUMER_FILES = ['DOCS.md', 'AGENTS.md', 'README.md'];
const SKILLS_DIR = '.agents/skills';

function collectFiles(): Map<string, string> {
    const files = new Map<string, string>();

    const read = (relativePath: string) => {
        const absolute = join(PROJECT_ROOT, relativePath);
        if (existsSync(absolute)) files.set(relativePath, readFileSync(absolute, 'utf8'));
    };

    const docsDir = join(PROJECT_ROOT, 'docs');
    if (existsSync(docsDir)) {
        for (const entry of readdirSync(docsDir).filter(f => f.endsWith('.md')).sort()) {
            read(`docs/${entry}`);
        }
    }

    CONSUMER_FILES.forEach(read);

    const skillsDir = join(PROJECT_ROOT, SKILLS_DIR);
    if (existsSync(skillsDir)) {
        for (const skill of readdirSync(skillsDir).sort()) {
            read(`${SKILLS_DIR}/${skill}/SKILL.md`);
        }
    }

    return files;
}

export function runDocsValidation(): DocsValidationResult {
    const files = collectFiles();
    return validateDocs({
        files,
        docsSections: parseDocsSections(files.get('DOCS.md') ?? ''),
        exists: (relativePath: string) => existsSync(join(PROJECT_ROOT, relativePath)),
    });
}

function main(): void {
    console.log(`\n=== Validating Documentation References ===`);

    const result = runDocsValidation();

    console.log(`\n--- Statistics ---`);
    console.log(`Reference Files:   ${result.stats.referenceFiles}`);
    console.log(`Files Scanned:     ${result.stats.filesScanned}`);
    console.log(`Rule IDs Defined:  ${result.stats.rulesDefined}`);
    console.log(`Rule IDs Cited:    ${result.stats.rulesCited}`);

    if (result.warnings.length > 0) {
        console.log(`\n--- Warnings (${result.warnings.length}) ---`);
        for (const warning of result.warnings) {
            console.warn(`⚠️ ${warning}`);
        }
    }

    if (result.errors.length > 0) {
        console.error(`\n--- Errors (${result.errors.length}) ---`);
        for (const error of result.errors) {
            console.error(`❌ ${error}`);
        }
        console.error(`\n❌ Documentation validation failed with ${result.errors.length} error(s).`);
        process.exit(1);
    }

    console.log(`\n✅ Documentation references valid! No errors detected.`);
}

main();
