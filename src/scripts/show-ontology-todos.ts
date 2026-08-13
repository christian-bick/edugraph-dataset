import { loadSpecTodos } from '../lib/generation.ts';
import { getCliOption } from '../lib/cli.ts';
import { groupOntologyTodos } from '../lib/ontology-todo.ts';

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

        const grouped = groupOntologyTodos(ontologyTodos);

        console.log(`Found ${grouped.length} ontology package(s) covering ${ontologyTodos.length} leaf TODO(s).\n`);

        let idx = 1;
        for (const { ontology, todos } of grouped) {
            console.log(`--------------------------------------------------`);
            console.log(`${idx++}. Ontology Package: ${ontology.id} (${todos.length} leaf TODO(s))`);
            console.log(`   💡 ${ontology.description}`);
            for (const change of ontology.changes) {
                console.log(`   ${change.dimension}: ${change.entities.join(', ')}`);
            }
            for (const todo of todos) {
                console.log(`   - ${todo.standardId} — ${todo.title}: ${todo.description}`);
            }
        }

        console.log(`\n========================================`);
        console.log(`Total Ontology Packages: ${grouped.length}`);
        console.log(`Total Leaf TODOs:        ${ontologyTodos.length}`);
        console.log(`========================================\n`);
    } catch (e) {
        console.error(`❌ Error loading ontology TODOs for spec "${specName}":`, e instanceof Error ? e.message : e);
        process.exit(1);
    }
}

main();
