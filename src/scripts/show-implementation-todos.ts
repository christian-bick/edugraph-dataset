import { loadSpecTodos } from '../lib/generation.ts';
import { getCliOption } from '../lib/cli.ts';
import { shortenLabel } from '../lib/utils.ts';
import { getTargetPrefix } from '../lib/spec-validator.ts';

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

        // Group targets by definition prefix (e.g. "K.CC.A.1-count-to-100")
        const grouped = new Map<string, typeof implementationTodos>();
        for (const target of implementationTodos) {
            const prefix = getTargetPrefix(target.id);
            if (!grouped.has(prefix)) {
                grouped.set(prefix, []);
            }
            grouped.get(prefix)!.push(target);
        }

        let idx = 1;
        for (const [prefix, targets] of grouped.entries()) {
            const first = targets[0];
            console.log(`--------------------------------------------------`);
            console.log(`${idx++}. Target Definition: ${prefix} (${targets.length} permutation(s))`);
            if (first.explanation) {
                console.log(`   💡 Reason/Gap: ${first.explanation}`);
            }
            console.log(`   Labels (sample): [${first.labels.map(shortenLabel).join(', ')}]`);
        }

        console.log(`\n========================================`);
        console.log(`Total Target Groups: ${grouped.size}`);
        console.log(`Total Permutations:  ${implementationTodos.length}`);
        console.log(`========================================\n`);
    } catch (e) {
        console.error(`❌ Error loading implementation TODOs for spec "${specName}":`, e instanceof Error ? e.message : e);
        process.exit(1);
    }
}

main();
