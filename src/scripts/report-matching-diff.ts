import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCliOption } from '../lib/cli.ts';
import { loadGeneratorCatalog, loadSpecTodos, loadViewCatalog } from '../lib/generation.ts';
import { loadMatchingTargets } from '../lib/spec-validator.ts';
import {
    createMatchingSnapshot,
    diffMatchingSnapshots,
    MatchingSnapshot,
    renderMatchingDiffMarkdown
} from '../lib/matching-diff.ts';
import { specPlanPaths } from '../lib/spec-plan.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const specName = getCliOption(args, 'spec');
    const planName = getCliOption(args, 'plan');
    const capture = args.includes('--capture-before');
    const force = args.includes('--force');
    if (!specName || !planName) {
        throw new Error('Usage: npm run report:matching-diff -- --spec=<spec> --plan=<plan> [--capture-before] [--force]');
    }

    const paths = specPlanPaths(PROJECT_ROOT, specName, planName);
    const [targets, todos, generators, views] = await Promise.all([
        loadMatchingTargets(specName),
        loadSpecTodos(specName),
        loadGeneratorCatalog(),
        loadViewCatalog()
    ]);
    const current = createMatchingSnapshot(specName, [
        ...targets.map(target => ({ target, disposition: 'spec' as const })),
        ...todos.implementationTodos.map(target => ({ target, disposition: 'implementationTodo' as const }))
    ], generators, views);
    mkdirSync(paths.directory, { recursive: true });

    if (capture) {
        if (existsSync(paths.matchingBefore) && !force) {
            throw new Error(`${paths.matchingBefore} already exists; pass --force to replace the review baseline.`);
        }
        writeFileSync(paths.matchingBefore, `${JSON.stringify(current, null, 2)}\n`, 'utf-8');
        console.log(`Captured matching baseline: ${paths.matchingBefore}`);
        return;
    }

    if (!existsSync(paths.matchingBefore)) {
        throw new Error(`Matching baseline not found: ${paths.matchingBefore}. Run again with --capture-before during pass 1.`);
    }
    const before = JSON.parse(readFileSync(paths.matchingBefore, 'utf-8')) as MatchingSnapshot;
    const diff = diffMatchingSnapshots(before, current);
    writeFileSync(paths.matchingAfter, `${JSON.stringify(current, null, 2)}\n`, 'utf-8');
    writeFileSync(paths.matchingDiff, renderMatchingDiffMarkdown(before, current, diff), 'utf-8');
    console.log(`Matching comparison written to: ${paths.matchingDiff}`);
    console.log(`Targets: +${diff.addedTargets.length} / -${diff.removedTargets.length}`);
    console.log(`Semantic pairs: +${diff.addedPairs.length} / -${diff.removedPairs.length}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
