import { loadSpecTodos } from '../lib/generation.ts';
import { getCliOption } from '../lib/cli.ts';
import { shortenLabel } from '../lib/utils.ts';
import { getTargetPrefix } from '../lib/spec-validator.ts';
import { Implementation, ModuleImplementation } from '../types/ml-engine.ts';

const formatModules = (modules: readonly ModuleImplementation[]) =>
    modules.map(({ module, strategy }) => `${strategy}: ${module}`).join(', ');

async function main() {
    const args = process.argv.slice(2);
    const specName = getCliOption(args, 'spec') || 'ccss';

    console.log(`\n========================================`);
    console.log(`  IMPLEMENTATION TODOS: "${specName}"`);
    console.log(`========================================\n`);

    try {
        const { implementationTodos } = await loadSpecTodos(specName);

        if (implementationTodos.length === 0) {
            console.log(`✅ No implementation TODOs found for spec "${specName}"!`);
            return;
        }

        console.log(`Found ${implementationTodos.length} target permutation(s) in implementationTodos.\n`);

        const grouped = new Map<string, { implementation: Implementation; targets: typeof implementationTodos }>();
        for (const target of implementationTodos) {
            const { implementation } = target;
            if (!grouped.has(implementation.id)) {
                grouped.set(implementation.id, { implementation, targets: [] });
            }
            grouped.get(implementation.id)!.targets.push(target);
        }

        let idx = 1;
        for (const { implementation, targets } of grouped.values()) {
            const definitions = new Map<string, typeof targets>();
            for (const target of targets) {
                const prefix = getTargetPrefix(target.id);
                if (!definitions.has(prefix)) definitions.set(prefix, []);
                definitions.get(prefix)!.push(target);
            }
            console.log(`--------------------------------------------------`);
            console.log(`${idx++}. Implementation: ${implementation.id} (${definitions.size} definition(s), ${targets.length} permutation(s))`);
            console.log(`   ${implementation.description}`);
            console.log(`   Generators: ${formatModules(implementation.generators)}`);
            console.log(`   Views:      ${formatModules(implementation.views)}`);
            for (const [prefix, definitionTargets] of definitions) {
                const first = definitionTargets[0];
                console.log(`   - ${prefix} (${definitionTargets.length} permutation(s))`);
                if (first.explanation) console.log(`     💡 Reason/Gap: ${first.explanation}`);
                console.log(`     Labels (sample): [${first.labels.map(shortenLabel).join(', ')}]`);
            }
        }

        console.log(`\n========================================`);
        console.log(`Total Implementations: ${grouped.size}`);
        console.log(`Total Permutations:  ${implementationTodos.length}`);
        console.log(`========================================\n`);
    } catch (e) {
        console.error(`❌ Error loading implementation TODOs for spec "${specName}":`, e instanceof Error ? e.message : e);
        process.exit(1);
    }
}

main();
