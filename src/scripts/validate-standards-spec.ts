import {validateStandardContracts} from '../lib/standards-validation.ts';
import {getCliOption} from '../lib/cli.ts';
import {
    loadGeneratorCatalog,
    loadViewCatalog,
    type GeneratorCatalogEntry,
    type ViewCatalogEntry
} from '../lib/generation.ts';
import {radixSortUtf8} from '../lib/content-identity.ts';
import {fileURLToPath} from 'node:url';

async function validateSpec(
    specName: string,
    generatorCatalog: GeneratorCatalogEntry[],
    viewCatalog: ViewCatalogEntry[]
): Promise<boolean> {
    console.log(`\n=== Validating Standards Spec: "${specName}" ===`);
    try {
        const result = await validateStandardContracts(specName, generatorCatalog, viewCatalog, undefined,
            process.argv.includes('--affected') && !process.argv.includes('--rebuild-graph')
                ? fileURLToPath(new URL('../..', import.meta.url)) : undefined);

        console.log(`\n--- Statistics ---`);
        console.log(`Total Targets Defined:      ${result.stats.totalTargets}`);
        console.log(`Unique Target Label Sets:   ${result.stats.uniqueTargets}`);
        console.log(`Deduplicated Target Count:  ${result.stats.deduplicatedCount}`);
        if (result.equivalences.length > 0) {
            console.log(`\n--- Intentional Equivalences (${result.equivalences.length}) ---`);
            for (const equivalence of result.equivalences) {
                console.log(`🔗 [${equivalence.targets.join(' ≡ ')}] — ${equivalence.reason}`);
            }
        }
        for (const warning of result.warnings) console.warn(`⚠️ ${warning}`);
        if (result.errors.length > 0) {
            for (const error of result.errors) console.error(`❌ ${error}`);
            console.error(`\n❌ Validation failed with ${result.errors.length} error(s).`);
            return false;
        }

        console.log(`\n✅ Spec validation succeeded for "${specName}"! No errors detected.`);
        return true;
    } catch (error) {
        console.error(`❌ Fatal error validating spec "${specName}":`, error instanceof Error ? error.message : error);
        return false;
    }
}

async function main(): Promise<void> {
    const selected = getCliOption(process.argv.slice(2), 'spec');
    if (!selected) {
        console.error('❌ Error: The --spec parameter is required.');
        console.error('Usage: npx vite-node src/scripts/validate-standards-spec.ts --spec=<module>[,<module>...]');
        process.exitCode = 1;
        return;
    }
    const specNames = radixSortUtf8([...new Set(selected.split(',').map(value => value.trim()).filter(Boolean))]);
    const [generatorCatalog, viewCatalog] = await Promise.all([
        loadGeneratorCatalog(),
        loadViewCatalog()
    ]);
    let passed = true;
    for (const specName of specNames) {
        if (!await validateSpec(specName, generatorCatalog, viewCatalog)) passed = false;
    }
    if (!passed) process.exitCode = 1;
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
