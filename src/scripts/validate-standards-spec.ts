import { normalizeAndValidateSpec } from '../lib/spec-validator.ts';
import { getCliOption } from '../lib/cli.ts';

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
        const result = await normalizeAndValidateSpec(specName);

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
            console.log(`\n✅ Spec validation succeeded for "${specName}"! No errors detected.`);
        }
    } catch (e) {
        console.error(`❌ Fatal error validating spec "${specName}":`, e instanceof Error ? e.message : e);
        process.exit(1);
    }
}

main();
