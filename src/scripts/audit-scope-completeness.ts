import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getCliOption} from '../lib/cli.ts';
import {datasetDirForSpec, datasetOutDir} from '../lib/dataset-paths.ts';
import {readDatasetManifest} from '../lib/dataset-manifest.ts';
import {reuseAuditTuplesFromGraph} from '../lib/label-architecture-audit.ts';
import {
    buildCompatibleModulePairIndex,
    matchTargets
} from '../lib/matching.ts';
import {
    loadGeneratorModelCatalog,
    loadViewModelCatalog
} from '../lib/model-catalog.ts';
import {
    buildScopeCompletenessInventory,
    type ScopeCompletenessInventory
} from '../lib/scope-completeness.ts';
import {loadMatchingTargets} from '../lib/spec-validator.ts';
import {shortenLabel} from '../lib/utils.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function markdown(options: {
    spec: string;
    source: string;
    reason: string;
    inventory: ScopeCompletenessInventory;
}): string {
    const {inventory} = options;
    const lines = [
        `# Scope-completeness inventory: ${options.spec}`,
        '',
        `- Matching source: \`${options.source}\``,
        `- Matching detail: ${options.reason}`,
        `- Matched tuples inspected: ${inventory.tuples}`,
        `- Missing co-resolving Scope candidates: ${inventory.missing_candidates.length}`,
        '',
        '## Missing candidates',
        ''
    ];
    if (inventory.missing_candidates.length === 0) {
        lines.push('No active tuple has an unresolved co-resolving Scope candidate.', '');
    } else {
        lines.push('| Role | Module | Parameter | Resolved value | Co-resolving labels | Missing Scopes | Tuples |');
        lines.push('|---|---|---|---|---|---|---:|');
        for (const candidate of inventory.missing_candidates) {
            lines.push(
                `| ${candidate.role} | \`${candidate.module_id}\` | \`${candidate.parameter}\` `
                + `| \`${JSON.stringify(candidate.resolved_value)}\` `
                + `| ${candidate.co_resolving_labels.map(shortenLabel).join(', ')} `
                + `| ${candidate.missing_scope_labels.map(shortenLabel).join(', ')} `
                + `| ${candidate.affected_tuples.length} |`
            );
        }
        lines.push('');
    }
    lines.push('## Additional pair-derived Scopes not required by the target', '');
    if (inventory.additional_scopes.length === 0) lines.push('None.', '');
    else {
        lines.push('| Scope | Tuples |', '|---|---:|');
        for (const entry of inventory.additional_scopes) {
            lines.push(`| ${shortenLabel(entry.label)} | ${entry.tuple_count} |`);
        }
        lines.push('');
    }
    lines.push('## More-specific realizations of target Scopes', '');
    if (inventory.specialized_target_scopes.length === 0) lines.push('None.', '');
    else {
        lines.push('| Scope | Tuples |', '|---|---:|');
        for (const entry of inventory.specialized_target_scopes) {
            lines.push(`| ${shortenLabel(entry.label)} | ${entry.tuple_count} |`);
        }
        lines.push('');
    }
    lines.push(
        'This inventory is a deterministic review surface, not an observability oracle. ',
        'A co-resolving group is a candidate conjunction until its rendered semantics are reviewed.'
    );
    return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const spec = getCliOption(args, 'spec');
    if (!spec) {
        throw new Error(
            'The --spec parameter is required. Usage: npm run audit:scope-completeness -- --spec=ccss'
        );
    }
    const outputDir = resolve(
        PROJECT_ROOT,
        getCliOption(args, 'output-dir') ?? `temp/scope-completeness/${spec}`
    );
    const [targets, generators, views] = await Promise.all([
        loadMatchingTargets(spec),
        loadGeneratorModelCatalog(),
        loadViewModelCatalog()
    ]);
    const pairIndex = buildCompatibleModulePairIndex(generators, views);
    const datasetDir = datasetOutDir(PROJECT_ROOT, datasetDirForSpec(spec));
    const manifest = readDatasetManifest(datasetDir);
    const reused = reuseAuditTuplesFromGraph({
        specName: spec,
        targets,
        generators,
        views,
        pairIndex,
        graph: manifest?.spec === spec ? manifest.dependency_graph : null
    });
    const tuples = reused.tuples ?? matchTargets(targets, generators, views, {pairIndex}).tuples;
    const source = reused.tuples ? 'persisted-graph' : 'fresh-indexed-match';
    const reason = reused.tuples
        ? reused.reason
        : `fresh indexed matching required: ${reused.reason}`;
    const inventory = buildScopeCompletenessInventory({tuples, generators, views});
    const report = {schema_version: 1, spec, matching: {source, reason}, ...inventory};
    mkdirSync(outputDir, {recursive: true});
    const jsonPath = resolve(outputDir, 'inventory.json');
    const markdownPath = resolve(outputDir, 'inventory.md');
    writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(markdownPath, markdown({spec, source, reason, inventory}));

    console.log('=== Scope Completeness Inventory ===');
    console.log(`Spec: ${spec}`);
    console.log(`Matching: ${source} (${reason})`);
    console.log(`Matched tuples inspected: ${inventory.tuples}`);
    console.log(`Missing co-resolving Scope candidates: ${inventory.missing_candidates.length}`);
    console.log(`Additional pair-derived Scopes: ${inventory.additional_scopes.length}`);
    console.log(`More-specific target Scope realizations: ${inventory.specialized_target_scopes.length}`);
    console.log(`Markdown: ${markdownPath}`);
    console.log(`JSON: ${jsonPath}`);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
