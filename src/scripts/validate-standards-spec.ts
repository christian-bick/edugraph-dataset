import { normalizeAndValidateSpec } from '../lib/spec-validator.ts';
import { getCliOption } from '../lib/cli.ts';
import {
    loadGeneratorCatalog,
    loadViewCatalog,
    findGeneratorsWithoutTestPath,
    findTargetsWithoutMatch,
    loadSpecTodos
} from '../lib/generation.ts';
import {shortenLabel} from '../lib/utils.ts';

async function main() {
    const args = process.argv.slice(2);
    const specName = getCliOption(args, 'spec');

    if (!specName) {
        console.error('❌ Error: The --spec parameter is required.');
        console.error('Usage: npx vite-node src/scripts/validate-standards-spec.ts --spec=<spec_module>');
        console.error('Example: npm run validate:standards-spec -- --spec=ccss');
        console.error('Example: npm run validate:standards-spec -- --spec=test');
        process.exit(1);
    }

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
            for (const eq of result.equivalences) {
                console.log(`🔗 [${eq.targets.join(' ≡ ')}] — ${eq.reason}`);
            }
        }

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
            console.error(`\n❌ Validation failed with ${result.errors.length} error(s).`);
            process.exit(1);
        } else {
            const [generatorCatalog, viewCatalog] = await Promise.all([
                loadGeneratorCatalog(),
                loadViewCatalog()
            ]);
            const unmatchedTargets = findTargetsWithoutMatch(
                result.targets,
                generatorCatalog,
                viewCatalog
            );
            if (unmatchedTargets.length > 0) {
                console.error(`\n--- Unmatched Active Targets (${unmatchedTargets.length}) ---`);
                for (const target of unmatchedTargets) {
                    console.error(
                        `❌ ${target.id} [${target.labels.map(shortenLabel).join(', ')}]`
                    );
                }
                console.error(
                    `\n❌ Spec contains ${unmatchedTargets.length} active target(s) without a compatible generator/view path.`
                );
                process.exit(1);
            }
            console.log(`\n✅ All ${result.targets.length} active targets have a compatible generator/view path.`);

            if (specName === 'test') {
                const uncovered = findGeneratorsWithoutTestPath(
                    result.targets,
                    generatorCatalog,
                    viewCatalog
                );
                if (uncovered.length > 0) {
                    console.error(
                        `\n❌ Test spec has no generatable target/view path for: ${uncovered.join(', ')}`
                    );
                    process.exit(1);
                }
                console.log(`\n✅ Test spec covers all ${generatorCatalog.length} generator modules.`);
            }
            console.log(`\n✅ Spec validation succeeded for "${specName}"! No errors detected.`);
        }
    } catch (e) {
        console.error(`❌ Fatal error validating spec "${specName}":`, e instanceof Error ? e.message : e);
        process.exit(1);
    }
}

main();
