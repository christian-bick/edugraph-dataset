import { createHash } from 'node:crypto';
import {
    existsSync,
    readFileSync,
    readdirSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import {
    GeneratorCatalogEntry,
    matchTargets,
    SampleSplit,
    SPLIT_DIRS,
    ViewCatalogEntry
} from './generation.ts';
import { CompetencyTarget } from '../types/ml-engine.ts';
import { currentRendererEnvironment } from './render-environment.ts';

export const DATASET_MANIFEST_SCHEMA_VERSION = 2;
const GENERATION_PIPELINE_VERSION = 'transactional-render-v1';

export interface DatasetManifestEntry {
    generator: string;
    view: string;
    renderer_environment: string;
    input_hash: string;
    content_hash: string;
    sample_counts: Record<SampleSplit, number>;
    generated_splits: SampleSplit[];
}

export interface DatasetManifest {
    schema_version: number;
    spec: string;
    ontology_dependency: string;
    generated_at: string;
    entries: Record<string, DatasetManifestEntry>;
}

export interface ManifestUpdateScope {
    fullDataset: boolean;
    generatorIds: string[];
    viewIds?: string[];
}

const SOURCE_EXTENSIONS = new Set(['.css', '.html', '.json', '.md', '.ts', '.tsx']);

function extension(path: string): string {
    const match = path.match(/(\.[^.\\/]+)$/);
    return match?.[1] ?? '';
}

function sourceFiles(path: string): string[] {
    if (!existsSync(path)) return [];
    if (!statSync(path).isDirectory()) return SOURCE_EXTENSIONS.has(extension(path)) ? [path] : [];
    return readdirSync(path, { withFileTypes: true })
        .flatMap(entry => sourceFiles(resolve(path, entry.name)))
        .filter(file =>
            !file.endsWith('.test.ts')
            && !file.endsWith('.test.tsx')
            && basename(file) !== 'checklist.md');
}

function hash(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function hashFiles(projectRoot: string, paths: string[]): string {
    const files = [...new Set(paths.flatMap(sourceFiles))].sort();
    const content = files.map(file =>
        `${relative(projectRoot, file).replace(/\\/g, '/')}\0${readFileSync(file)}`
    ).join('\0');
    return hash(content);
}

function pairKey(generator: string, view: string): string {
    return `${generator}#${view}`;
}

function ontologyDependency(projectRoot: string): string {
    const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf-8'));
    return packageJson.dependencies?.['edugraph-ts'] ?? 'unknown';
}

function globalSourceHash(projectRoot: string): string {
    return hashFiles(projectRoot, [
        resolve(projectRoot, 'package.json'),
        resolve(projectRoot, 'package-lock.json'),
        resolve(projectRoot, 'vite.config.js'),
        resolve(projectRoot, 'src', 'scripts', 'generate-dataset.ts'),
        resolve(projectRoot, 'src', 'lib', 'dataset-manifest.ts'),
        resolve(projectRoot, 'src', 'lib', 'dataset-output.ts'),
        resolve(projectRoot, 'src', 'lib', 'generation.ts'),
        resolve(projectRoot, 'src', 'lib', 'module-resolver.ts'),
        resolve(projectRoot, 'src', 'lib', 'random.ts'),
        resolve(projectRoot, 'src', 'lib', 'render-environment.ts'),
        resolve(projectRoot, 'src', 'lib', 'resolvers.ts'),
        resolve(projectRoot, 'src', 'lib', 'spec-validator.ts'),
        resolve(projectRoot, 'src', 'lib', 'type-parser.ts'),
        resolve(projectRoot, 'src', 'lib', 'utils.ts'),
        resolve(projectRoot, 'src', 'types'),
        resolve(projectRoot, 'src', 'visuals', 'components'),
        resolve(projectRoot, 'src', 'visuals', 'helpers'),
        resolve(projectRoot, 'src', 'visuals', 'withConfig.tsx'),
        resolve(projectRoot, 'src', 'partials'),
        resolve(projectRoot, 'src', 'fonts.css'),
        resolve(projectRoot, 'src', 'tailwind.css'),
        resolve(projectRoot, 'public')
    ]);
}

function moduleSourcePaths(
    projectRoot: string,
    generator: GeneratorCatalogEntry,
    view: ViewCatalogEntry
): string[] {
    return [
        generator.module.absolutePath,
        view.module.absolutePath,
        resolve(projectRoot, 'src', 'generators', 'helpers.ts'),
        resolve(projectRoot, 'src', 'generators', generator.module.category ?? '', 'helpers.ts'),
        resolve(projectRoot, 'src', 'visuals', 'views', 'helpers.ts'),
        resolve(projectRoot, 'src', 'visuals', 'views', view.module.category ?? '', 'helpers.ts'),
    ];
}

function readDatasetRows(datasetDir: string): any[] {
    const rows: any[] = [];
    for (const split of Object.keys(SPLIT_DIRS) as SampleSplit[]) {
        const metadataPath = resolve(datasetDir, SPLIT_DIRS[split], 'metadata.jsonl');
        if (!existsSync(metadataPath)) continue;
        rows.push(...readFileSync(metadataPath, 'utf-8')
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => ({ ...JSON.parse(line), _split: split })));
    }
    return rows;
}

export function buildDatasetManifestEntries(options: {
    projectRoot: string;
    datasetDir: string;
    targets: CompetencyTarget[];
    generators: GeneratorCatalogEntry[];
    views: ViewCatalogEntry[];
    generatedSplits: SampleSplit[];
    rendererEnvironment?: string;
}): Record<string, DatasetManifestEntry> {
    const {
        projectRoot,
        datasetDir,
        targets,
        generators,
        views,
        generatedSplits,
        rendererEnvironment = currentRendererEnvironment()
    } = options;
    const tuples = matchTargets(targets, generators, views).tuples;
    const targetsByPair = new Map<string, CompetencyTarget[]>();
    for (const tuple of tuples) {
        const key = pairKey(tuple.generatorId, tuple.viewId);
        if (!targetsByPair.has(key)) targetsByPair.set(key, []);
        targetsByPair.get(key)!.push(tuple.target);
    }

    const rowsByPair = new Map<string, any[]>();
    for (const row of readDatasetRows(datasetDir)) {
        const key = pairKey(row.generator, row.view);
        if (!rowsByPair.has(key)) rowsByPair.set(key, []);
        rowsByPair.get(key)!.push(row);
    }

    const globalHash = globalSourceHash(projectRoot);
    const ontology = ontologyDependency(projectRoot);
    const generatorById = new Map(generators.map(entry => [entry.generatorId, entry]));
    const viewById = new Map(views.map(entry => [entry.viewId, entry]));
    const entries: Record<string, DatasetManifestEntry> = {};

    for (const [key, pairTargets] of [...targetsByPair.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        const [generatorId, viewId] = key.split('#');
        const generator = generatorById.get(generatorId)!;
        const view = viewById.get(viewId)!;
        const localHash = hashFiles(projectRoot, moduleSourcePaths(projectRoot, generator, view));
        const pairRows = rowsByPair.get(key) ?? [];
        const sampleCounts: Record<SampleSplit, number> = { train: 0, val: 0 };
        for (const row of pairRows) sampleCounts[row._split as SampleSplit]++;
        const contentSignature = pairRows
            .map(row => ({
                sample_key: row.sample_key,
                content_fingerprint: row.content_fingerprint
            }))
            .sort((a, b) => a.sample_key.localeCompare(b.sample_key));
        const targetSignature = pairTargets
            .map(target => ({ id: target.id, labels: [...target.labels].sort() }))
            .sort((a, b) => a.id.localeCompare(b.id));
        entries[key] = {
            generator: generatorId,
            view: viewId,
            renderer_environment: rendererEnvironment,
            input_hash: hash(JSON.stringify({
                pipeline: GENERATION_PIPELINE_VERSION,
                ontology,
                globalHash,
                localHash,
                targets: targetSignature
            })),
            content_hash: hash(JSON.stringify(contentSignature)),
            sample_counts: sampleCounts,
            generated_splits: [...generatedSplits].sort()
        };
    }
    return entries;
}

export function readDatasetManifest(datasetDir: string): DatasetManifest | null {
    const path = resolve(datasetDir, 'manifest.json');
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8')) as DatasetManifest;
}

export function updateDatasetManifest(options: {
    projectRoot: string;
    datasetDir: string;
    specName: string;
    entries: Record<string, DatasetManifestEntry>;
    scope: ManifestUpdateScope;
}): DatasetManifest {
    const { projectRoot, datasetDir, specName, entries, scope } = options;
    const previous = scope.fullDataset ? null : readDatasetManifest(datasetDir);
    const merged = { ...(previous?.entries ?? {}) };
    const generators = new Set(scope.generatorIds);
    const views = scope.viewIds ? new Set(scope.viewIds) : null;

    for (const [key, entry] of Object.entries(merged)) {
        if (generators.has(entry.generator) && (!views || views.has(entry.view))) delete merged[key];
    }
    Object.assign(merged, entries);

    const manifest: DatasetManifest = {
        schema_version: DATASET_MANIFEST_SCHEMA_VERSION,
        spec: specName,
        ontology_dependency: ontologyDependency(projectRoot),
        generated_at: new Date().toISOString(),
        entries: Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)))
    };
    writeFileSync(resolve(datasetDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
    return manifest;
}

export function datasetFreshnessIssues(
    manifest: DatasetManifest | null,
    specName: string,
    currentEntries: Record<string, DatasetManifestEntry>
): string[] {
    if (!manifest) return ['manifest.json is missing; regenerate this dataset.'];
    const issues: string[] = [];
    if (manifest.schema_version !== DATASET_MANIFEST_SCHEMA_VERSION) {
        issues.push(`manifest schema ${manifest.schema_version} is not supported (expected ${DATASET_MANIFEST_SCHEMA_VERSION}).`);
    }
    if (manifest.spec !== specName) issues.push(`manifest belongs to spec "${manifest.spec}", not "${specName}".`);

    for (const [key, current] of Object.entries(currentEntries)) {
        const recorded = manifest.entries[key];
        if (!recorded) {
            issues.push(`${key} is missing from the manifest.`);
        } else if (recorded.input_hash !== current.input_hash) {
            issues.push(`${key} is stale: generation source, target, or ontology inputs changed.`);
        } else if (recorded.content_hash !== current.content_hash) {
            issues.push(`${key} content fingerprints changed since generation.`);
        } else if (JSON.stringify(recorded.sample_counts) !== JSON.stringify(current.sample_counts)) {
            issues.push(`${key} metadata counts changed since generation.`);
        }
    }
    for (const key of Object.keys(manifest.entries)) {
        if (!currentEntries[key]) issues.push(`${key} remains in the manifest but no longer matches the current spec.`);
    }
    return issues;
}

export function datasetRendererIssues(
    manifest: DatasetManifest | null,
    expectedRendererEnvironment: string
): string[] {
    if (!manifest) return ['manifest.json is missing; renderer environment cannot be verified.'];
    return Object.entries(manifest.entries)
        .filter(([, entry]) => entry.renderer_environment !== expectedRendererEnvironment)
        .map(([key, entry]) =>
            `${key} was rendered by "${entry.renderer_environment || 'unknown'}" instead of "${expectedRendererEnvironment}".`
        );
}
