import { loadSpecTodos } from '../lib/generation.ts';
import { getCliOption } from '../lib/cli.ts';

async function main() {
    const args = process.argv.slice(2);
    const specName = getCliOption(args, 'spec') || 'ccss';

    console.log(`\n========================================`);
    console.log(`  ONTOLOGY TODOS: "${specName}"`);
    console.log(`========================================\n`);

    try {
        const { ontologyTodos } = await loadSpecTodos(specName);

        if (ontologyTodos.length === 0) {
            console.log(`✅ No ontology TODOs found for spec "${specName}"!`);
            return;
        }

        console.log(`Found ${ontologyTodos.length} ontology TODO item(s).\n`);

        let idx = 1;
        for (const todo of ontologyTodos) {
            console.log(`--------------------------------------------------`);
            console.log(`${idx++}. Standard ID: ${todo.standardId}`);
            console.log(`   🏷️  Missing Concept/Title: ${todo.title}`);
            console.log(`   💡 Description:          ${todo.description}`);
        }

        console.log(`\n========================================`);
        console.log(`Total Ontology TODOs: ${ontologyTodos.length}`);
        console.log(`========================================\n`);
    } catch (e) {
        console.error(`❌ Error loading ontology TODOs for spec "${specName}":`, e instanceof Error ? e.message : e);
        process.exit(1);
    }
}

main();
