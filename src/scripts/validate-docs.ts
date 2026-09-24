import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parseDocsSections, validateDocs, validateExternalDocuments, type DocsValidationResult } from '../lib/docs-validator.ts';
import {collectDocumentation} from '../lib/docs-discovery.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

export async function runDocsValidation(): Promise<DocsValidationResult> {
    const files = collectDocumentation(PROJECT_ROOT);
    const result = validateDocs({
        files,
        docsSections: parseDocsSections(files.get('DOCS.md') ?? ''),
        exists: (relativePath: string) => existsSync(join(PROJECT_ROOT, relativePath)),
    });
    result.warnings.push(...await validateExternalDocuments(files));
    return result;
}

async function main(): Promise<void> {
    console.log(`\n=== Validating Documentation References ===`);

    const result = await runDocsValidation();

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

await main();
