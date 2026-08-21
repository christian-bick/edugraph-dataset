import {normalizeAndValidateSpec} from '../lib/spec-validator.ts';
import {getCliOption} from '../lib/cli.ts';
import {
    loadGeneratorCatalog,
    loadViewCatalog,
    findGeneratorsWithoutTestPath,
    findTargetsWithoutMatch,
    loadSpecTodos,
    type GeneratorCatalogEntry,
    type ViewCatalogEntry
} from '../lib/generation.ts';
import {shortenLabel} from '../lib/utils.ts';
import {radixSortUtf8} from '../lib/content-identity.ts';

async function validateSpec(
    specName: string,
    generatorCatalog: GeneratorCatalogEntry[],
    viewCatalog: ViewCatalogEntry[]
): Promise<boolean> {
    console.log(`\n=== Validating Standards Spec: "${specName}" ===`);
    try {
        const [result] = await Promise.all([
            normalizeAndValidateSpec(specName),
            loadSpecTodos(specName)
        ]);

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

        const unmatchedTargets = findTargetsWithoutMatch(result.targets, generatorCatalog, viewCatalog);
        if (unmatchedTargets.length > 0) {
            console.error(`\n--- Unmatched Active Targets (${unmatchedTargets.length}) ---`);
            for (const target of unmatchedTargets) {
                console.error(`❌ ${target.id} [${target.labels.map(shortenLabel).join(', ')}]`);
            }
            console.error(`\n❌ Spec contains ${unmatchedTargets.length} active target(s) without a compatible generator/view path.`);
            return false;
        }
        console.log(`\n✅ All ${result.targets.length} active targets have a compatible generator/view path.`);

        if (specName === 'test') {
            const uncovered = findGeneratorsWithoutTestPath(result.targets, generatorCatalog, viewCatalog);
            if (uncovered.length > 0) {
                console.error(`\n❌ Test spec has no generatable target/view path for: ${uncovered.join(', ')}`);
                return false;
            }
            console.log(`\n✅ Test spec covers all ${generatorCatalog.length} generator modules.`);
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
