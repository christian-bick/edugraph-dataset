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

        // Stable implementation packages are authored explicitly on each TODO.
        const grouped = new Map<string, typeof implementationTodos>();
        for (const target of implementationTodos) {
            if (!grouped.has(target.group)) {
                grouped.set(target.group, []);
            }
            grouped.get(target.group)!.push(target);
        }

        let idx = 1;
        for (const [group, targets] of grouped.entries()) {
            const definitions = new Map<string, typeof targets>();
            for (const target of targets) {
                const prefix = getTargetPrefix(target.id);
                if (!definitions.has(prefix)) definitions.set(prefix, []);
                definitions.get(prefix)!.push(target);
            }
            console.log(`--------------------------------------------------`);
            console.log(`${idx++}. Group: ${group} (${definitions.size} definition(s), ${targets.length} permutation(s))`);
            for (const [prefix, definitionTargets] of definitions) {
                const first = definitionTargets[0];
                console.log(`   - ${prefix} (${definitionTargets.length} permutation(s))`);
                if (first.explanation) console.log(`     💡 Reason/Gap: ${first.explanation}`);
                console.log(`     Labels (sample): [${first.labels.map(shortenLabel).join(', ')}]`);
            }
        }

        console.log(`\n========================================`);
        console.log(`Total Implementation Groups: ${grouped.size}`);
        console.log(`Total Permutations:  ${implementationTodos.length}`);
        console.log(`========================================\n`);
    } catch (e) {
        console.error(`❌ Error loading implementation TODOs for spec "${specName}":`, e instanceof Error ? e.message : e);
        process.exit(1);
    }
}

main();
