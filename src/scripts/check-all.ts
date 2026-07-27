import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { normalizeAndValidateSpec } from '../lib/spec-validator.ts';
import { listSpecModules } from '../lib/generation.ts';
import { getCliOption } from '../lib/cli.ts';
import { datasetDirForSpec, datasetOutDir } from '../lib/dataset-paths.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

async function main() {
    const args = process.argv.slice(2);
    const requestedSpec = getCliOption(args, 'spec');

    let hasError = false;

    console.log(`========================================`);
    console.log(`        RUNNING ALL REPOSITORY CHECKS   `);
    console.log(`========================================`);

    // 1. TypeScript Type Check
    console.log(`\n--- [1/6] TypeScript Type Check ---`);
    try {
        execSync('npx tsc --noEmit', { cwd: PROJECT_ROOT, stdio: 'inherit' });
        console.log(`✅ Type check passed.`);
    } catch {
        console.error(`❌ Type check failed.`);
        hasError = true;
    }

    // 2. Generator & View Spec Audit
    console.log(`\n--- [2/6] Generator & View Spec Audit ---`);
    try {
        execSync('npx vite-node src/scripts/validate-generator-view-specs.ts', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    } catch {
        console.error(`❌ Generator & View spec audit failed.`);
        hasError = true;
    }

    // 3. Label Usage Audit
    console.log(`\n--- [3/6] Label Usage Audit ---`);
    try {
        execSync('npx vite-node src/scripts/check-labels.ts', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    } catch {
        console.error(`❌ Label usage audit failed.`);
        hasError = true;
    }

    // 4. Documentation Reference Validation
    console.log(`\n--- [4/6] Documentation Reference Validation ---`);
    try {
        execSync('npx vite-node src/scripts/validate-docs.ts', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    } catch {
        console.error(`❌ Documentation reference validation failed.`);
        hasError = true;
    }

    // 5. Standards Spec Validation
    console.log(`\n--- [5/6] Standards Spec Validation ---`);
    const specDir = resolve(PROJECT_ROOT, 'src', 'spec');
    let specsToValidate: string[] = [];

    specsToValidate = requestedSpec ? [requestedSpec] : listSpecModules(specDir);

    console.log(`Validating spec(s): [${specsToValidate.join(', ')}]`);

    for (const specName of specsToValidate) {
        console.log(`\nChecking spec module: "${specName}"...`);
        try {
            const result = await normalizeAndValidateSpec(specName);

            console.log(`  Targets: ${result.stats.totalTargets} total | ${result.stats.uniqueTargets} unique | ${result.stats.deduplicatedCount} deduplicated`);

            if (result.equivalences.length > 0) {
                console.log(`  Intentional equivalences: ${result.equivalences.length}`);
                for (const eq of result.equivalences) {
                    console.log(`🔗 [${eq.targets.join(' ≡ ')}]`);
                }
            }

            if (result.warnings.length > 0) {
                console.log(`  Warnings: ${result.warnings.length}`);
                for (const warning of result.warnings) {
                    console.warn(`⚠️ ${warning}`);
                }
            }

            if (result.errors.length > 0) {
                console.error(`  Errors: ${result.errors.length}`);
                for (const err of result.errors) {
                    console.error(`❌ ${err}`);
                }
                hasError = true;
            } else {
                console.log(`✅ Spec "${specName}" valid.`);
            }
        } catch (e) {
            console.error(`❌ Failed to validate spec "${specName}":`, e instanceof Error ? e.message : e);
            hasError = true;
        }
    }

    // 6. Split Integrity — only for specs whose dataset has been generated,
    // so a fresh clone still passes every static check.
    console.log(`\n--- [6/6] Dataset Split Integrity ---`);
    const generatedSpecs = specsToValidate.filter(specName =>
        existsSync(resolve(datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName)), 'train', 'metadata.jsonl')));

    if (generatedSpecs.length === 0) {
        console.log(`ℹ️ No generated dataset found for [${specsToValidate.join(', ')}] — skipping.`);
    }
    for (const specName of generatedSpecs) {
        try {
            execSync(`npx vite-node src/scripts/report-splits.ts --spec=${specName}`, { cwd: PROJECT_ROOT, stdio: 'inherit' });
        } catch {
            console.error(`❌ Split integrity failed for "${specName}".`);
            hasError = true;
        }
    }

    console.log(`\n========================================`);
    if (hasError) {
        console.error(`❌ ALL CHECKS FAILED: One or more checks reported errors.`);
        process.exit(1);
    } else {
        console.log(`✅ ALL CHECKS PASSED SUCCESSFULLY!`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
