import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCliOption } from '../lib/cli.ts';
import { loadSpecEquivalences, loadSpecTodos, loadTargets } from '../lib/generation.ts';
import { analyzeTargetDistinctness, renderTargetDistinctnessMarkdown } from '../lib/target-distinctness.ts';
import { specPlanPaths } from '../lib/spec-plan.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const specName = getCliOption(args, 'spec');
    const planName = getCliOption(args, 'plan');
    if (!specName) {
        throw new Error('Usage: npm run analyze:target-distinctness -- --spec=<spec> [--plan=<plan>]');
    }

    const [targets, todos, equivalences] = await Promise.all([
        loadTargets(specName),
        loadSpecTodos(specName),
        loadSpecEquivalences(specName)
    ]);
    const allTargets = [...targets, ...todos.implementationTodos];
    const findings = analyzeTargetDistinctness(allTargets, equivalences);
    const report = renderTargetDistinctnessMarkdown(specName, allTargets, findings);
    if (!planName) {
        console.log(report);
        return;
    }

    const paths = specPlanPaths(PROJECT_ROOT, specName, planName);
    mkdirSync(paths.directory, { recursive: true });
    writeFileSync(paths.targetDistinctness, report, 'utf-8');
    console.log(`Target distinctness report written to: ${paths.targetDistinctness}`);
    console.log(`Advisory findings: ${findings.length}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
