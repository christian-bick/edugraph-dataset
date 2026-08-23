import {mkdirSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
    buildOntologySemanticSnapshot,
    diffOntologySemantics,
    ONTOLOGY_SEMANTICS_PATH,
    readOntologySemanticSnapshot,
    withOntologySemanticUsage
} from '../lib/external-semantics.ts';
import {resolveOntologyProvenance} from '../lib/coverage-identity.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../lib/model-catalog.ts';
import {loadTargets} from '../lib/spec-catalog.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const apply = process.argv.slice(2).includes('--apply');

function writeJsonAtomic(path: string, value: unknown): void {
    mkdirSync(dirname(path), {recursive: true});
    const partial = `${path}.partial-${process.pid}`;
    writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
    try {
        renameSync(partial, path);
    } finally {
        rmSync(partial, {force: true});
    }
}

const summarize = (name: string, values: readonly string[]): void => {
    console.log(`${name}: ${values.length}`);
    for (const id of values.slice(0, 20)) console.log(`  ${id}`);
    if (values.length > 20) console.log(`  … and ${values.length - 20} more`);
};

async function main(): Promise<void> {
    const provenance = resolveOntologyProvenance(projectRoot);
    const base = buildOntologySemanticSnapshot({provenance});
    const [generators, views, targets] = await Promise.all([
        loadGeneratorModelCatalog(),
        loadViewModelCatalog(),
        loadTargets('ccss')
    ]);
    const usedLabels = [
        ...generators.flatMap(generator => generator.labels),
        ...views.flatMap(view => [
            ...view.supportedLabels,
            ...(view.requiredLabels ?? []),
            ...(view.rejectedLabels ?? [])
        ]),
        ...targets.flatMap(target => target.labels)
    ];
    const candidate = withOntologySemanticUsage(base, 'ccss', usedLabels);
    const previous = readOntologySemanticSnapshot(projectRoot);
    const delta = diffOntologySemantics(previous, candidate);

    console.log(`Ontology semantic delta ${delta.from ?? '<none>'} -> ${delta.to}`);
    summarize('Added entities', delta.entities.added);
    summarize('Changed entities', delta.entities.changed);
    summarize('Removed entities', delta.entities.removed);
    summarize('Added relations', delta.relations.added);
    summarize('Changed relations', delta.relations.changed);
    summarize('Removed relations', delta.relations.removed);
    summarize('Added usages', delta.usages.added);
    summarize('Changed usages', delta.usages.changed);
    summarize('Removed usages', delta.usages.removed);
    console.log(`[Work counters] ${JSON.stringify(delta.work)}`);
    if (!apply) {
        console.log('Dry run only. Pass --apply after updating the pinned package to accept this semantic delta.');
        return;
    }

    writeJsonAtomic(resolve(projectRoot, ...ONTOLOGY_SEMANTICS_PATH), candidate);
    console.log(`Applied ontology semantic snapshot ${provenance.version}.`);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
