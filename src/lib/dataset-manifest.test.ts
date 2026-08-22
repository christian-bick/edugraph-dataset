import { describe, expect, it } from 'vitest';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
    DATASET_MANIFEST_SCHEMA_VERSION,
    DatasetManifest,
    DatasetManifestEntry,
    affectedDatasetPairKeys,
    buildDatasetManifest,
    datasetGlobalSourceHash,
    datasetFreshnessIssues,
    datasetExternalSemanticIssues,
    datasetRendererIssues,
    updateDatasetManifest
} from './dataset-manifest.ts';
import { currentRendererEnvironment } from './render-environment.ts';
import {
    DEPENDENCY_NODE_KINDS,
    createDependencyGraphSnapshot,
    planDependencyDelta,
    type DependencyGraphSnapshot
} from './dependency-planner.ts';
import {buildOntologySemanticSnapshot} from './external-semantics.ts';
import type {OntologyProvenance} from './coverage-identity.ts';

const dependencyGraph = createDependencyGraphSnapshot([]);
const cleanPlan = planDependencyDelta(null, dependencyGraph);
const {reusable_outputs: _outputs, ...lastExecution} = cleanPlan;

const entry: DatasetManifestEntry = {
    generator: 'writing',
    view: 'numbers-write-standard',
    renderer_environment: currentRendererEnvironment(),
    input_hash: 'input-a',
    content_hash: 'content-a',
    sample_counts: { train: 2, val: 0 },
    generated_splits: ['train', 'val'],
    execution_nodes: [],
    render_nodes: [],
    validation_nodes: []
};

function manifest(overrides: Partial<DatasetManifest> = {}): DatasetManifest {
    return {
        schema_version: DATASET_MANIFEST_SCHEMA_VERSION,
        planner_epoch: dependencyGraph.planner_epoch,
        complete: true,
        spec: 'ccss',
        ontology_dependency: 'ontology-v1',
        generated_at: '2026-01-01T00:00:00.000Z',
        dependency_graph: dependencyGraph,
        last_execution: lastExecution,
        entries: { 'writing#numbers-write-standard': entry },
        ...overrides
    };
}

function build(
    entries: Record<string, DatasetManifestEntry>,
    graph: DependencyGraphSnapshot = dependencyGraph
) {
    return {
        entries,
        dependency_graph: graph,
        source_stats: {directories_read: 0, files_read: 0, bytes_read: 0},
        external_semantics: {
            trusted: true,
            diagnostics: [],
            standards_records: 0,
            ontology_entities: 0,
            ontology_relations: 0
        }
    };
}

describe('datasetFreshnessIssues', () => {
    it('accepts matching pair inputs and metadata counts', () => {
        expect(datasetFreshnessIssues(manifest(), 'ccss', build({
            'writing#numbers-write-standard': entry
        }))).toEqual([]);
    });

    it('requires a manifest', () => {
        expect(datasetFreshnessIssues(null, 'ccss', build({}))).toEqual([
            'manifest.json is missing; regenerate this dataset.'
        ]);
    });

    it('reports stale, missing, removed, and count-shifted pairs', () => {
        const current = {
            'writing#numbers-write-standard': { ...entry, input_hash: 'input-b' },
            'writing#numbers-write-stroke': {
                ...entry,
                view: 'numbers-write-stroke',
                sample_counts: { train: 4, val: 0 }
            }
        };
        const issues = datasetFreshnessIssues(manifest(), 'ccss', build(current));
        expect(issues).toContain(
            'writing#numbers-write-standard is stale: generation source, target, or ontology inputs changed.'
        );
        expect(issues).toContain('writing#numbers-write-stroke is missing from the manifest.');
    });

    it('reports entries that no longer match', () => {
        expect(datasetFreshnessIssues(manifest(), 'ccss', build({}))).toContain(
            'writing#numbers-write-standard remains in the manifest but no longer matches the current spec.'
        );
    });

    it('reports changed generated content or task fingerprints', () => {
        const current = {
            'writing#numbers-write-standard': { ...entry, content_hash: 'content-b' }
        };
        expect(datasetFreshnessIssues(manifest(), 'ccss', build(current))).toContain(
            'writing#numbers-write-standard content or task fingerprints changed since generation.'
        );
    });
});

describe('external semantic generation gate', () => {
    it('accepts exact installed ontology semantics and rejects mixed package state', () => {
        const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-semantic-gate-'));
        const dependency = 'https://example.test/ontology.tgz';
        const provenance: OntologyProvenance = {
            package: 'edugraph-ts',
            version: 'v1.0.0',
            dependency,
            resolved: dependency,
            integrity: 'sha512-exact'
        };
        mkdirSync(resolve(projectRoot, 'config', 'external-semantics'), {recursive: true});
        writeFileSync(resolve(projectRoot, 'package.json'), JSON.stringify({
            dependencies: {'edugraph-ts': dependency}
        }));
        writeFileSync(resolve(projectRoot, 'package-lock.json'), JSON.stringify({
            packages: {
                'node_modules/edugraph-ts': {
                    version: '1.0.0',
                    resolved: dependency,
                    integrity: provenance.integrity
                }
            }
        }));
        const snapshotPath = resolve(projectRoot, 'config', 'external-semantics', 'ontology.json');
        try {
            writeFileSync(snapshotPath, JSON.stringify(buildOntologySemanticSnapshot({provenance})));
            expect(datasetExternalSemanticIssues(projectRoot, 'test')).toEqual([]);

            writeFileSync(snapshotPath, JSON.stringify(buildOntologySemanticSnapshot({
                provenance,
                entityRelations: {}
            })));
            expect(datasetExternalSemanticIssues(projectRoot, 'test')).toEqual([
                expect.stringContaining('Installed ontology semantics differ')
            ]);
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });
});

describe('datasetRendererIssues', () => {
    it('requires every generated pair to use the expected renderer', () => {
        expect(datasetRendererIssues(manifest(), currentRendererEnvironment())).toEqual([]);
        expect(datasetRendererIssues(manifest(), 'canonical')).toEqual([
            `writing#numbers-write-standard was rendered by "${currentRendererEnvironment()}" instead of "canonical".`
        ]);
    });
});

describe('datasetGlobalSourceHash', () => {
    it('ignores generated public outputs but retains renderer assets', () => {
        const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-render-inputs-'));
        mkdirSync(resolve(projectRoot, 'public', 'coverage'), {recursive: true});
        mkdirSync(resolve(projectRoot, 'public', 'icons'), {recursive: true});
        writeFileSync(resolve(projectRoot, 'vite.config.js'), 'export default {base: "/"};');
        writeFileSync(resolve(projectRoot, 'public', 'coverage', 'ccss-coverage.json'), 'first');
        writeFileSync(resolve(projectRoot, 'public', 'favicon.png'), 'first');
        writeFileSync(resolve(projectRoot, 'public', 'icons', 'counter.svg'), 'first');

        try {
            const initial = datasetGlobalSourceHash(projectRoot);
            writeFileSync(resolve(projectRoot, 'public', 'coverage', 'ccss-coverage.json'), 'changed');
            writeFileSync(resolve(projectRoot, 'public', 'favicon.png'), 'changed');
            expect(datasetGlobalSourceHash(projectRoot)).toBe(initial);

            writeFileSync(resolve(projectRoot, 'vite.config.js'), 'export default {base: "/changed"};');
            expect(datasetGlobalSourceHash(projectRoot)).not.toBe(initial);

            const changedConfig = datasetGlobalSourceHash(projectRoot);
            writeFileSync(resolve(projectRoot, 'public', 'icons', 'counter.svg'), 'changed');
            expect(datasetGlobalSourceHash(projectRoot)).not.toBe(changedConfig);
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });
});

describe('updateDatasetManifest', () => {
    it('does not schedule pixel generation for a validation-only ontology definition delta', () => {
        const graph = (definitionHash: string) => createDependencyGraphSnapshot([
            {id: 'ontology:Addition', kind: 'ontology-entity', input_hash: 'identity', dependencies: []},
            {
                id: 'ontology-definition:Addition',
                kind: 'ontology-entity',
                input_hash: definitionHash,
                dependencies: ['ontology:Addition']
            },
            {id: 'pair:demo#view', kind: 'generator-view-pair', input_hash: 'pair', dependencies: []},
            {
                id: 'vqa:sample',
                kind: 'vqa-record',
                input_hash: 'vqa',
                dependencies: ['pair:demo#view', 'ontology-definition:Addition']
            }
        ]);
        const previousGraph = graph('before');
        const currentGraph = graph('after');
        const pairEntry: DatasetManifestEntry = {
            ...entry,
            generator: 'demo',
            view: 'view',
            execution_nodes: ['pair:demo#view', 'vqa:sample'],
            render_nodes: ['pair:demo#view'],
            validation_nodes: ['vqa:sample']
        };
        const plan = planDependencyDelta(previousGraph, currentGraph);

        expect(plan.affected_nodes).toContain('vqa:sample');
        expect(affectedDatasetPairKeys(
            plan,
            build({'demo#view': pairEntry}, currentGraph),
            manifest({dependency_graph: previousGraph, entries: {'demo#view': pairEntry}})
        )).toEqual([]);
    });

    it('selects exact current and removed pairs from a delta', () => {
        const graph = (sourceHash: string, pair: string) => createDependencyGraphSnapshot([
            {id: 'source:module', kind: 'source-file', input_hash: sourceHash, dependencies: []},
            {id: `pair:${pair}`, kind: 'generator-view-pair', input_hash: pair, dependencies: ['source:module']}
        ]);
        const previousGraph = graph('before', 'writing#old-view');
        const currentGraph = graph('after', 'writing#new-view');
        const plan = planDependencyDelta(previousGraph, currentGraph);
        const oldEntry = {
            ...entry,
            view: 'old-view',
            execution_nodes: ['pair:writing#old-view'],
            render_nodes: ['pair:writing#old-view']
        };
        const newEntry = {
            ...entry,
            view: 'new-view',
            execution_nodes: ['pair:writing#new-view'],
            render_nodes: ['pair:writing#new-view']
        };

        expect(affectedDatasetPairKeys(
            plan,
            build({'writing#new-view': newEntry}, currentGraph),
            manifest({dependency_graph: previousGraph, entries: {'writing#old-view': oldEntry}})
        )).toEqual(['writing#new-view', 'writing#old-view']);
    });

    it('replaces only entries inside a scoped generation transaction', () => {
        const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-manifest-'));
        const datasetDir = resolve(projectRoot, 'out', 'dataset-ccss');
        mkdirSync(datasetDir, { recursive: true });
        writeFileSync(resolve(projectRoot, 'package.json'), JSON.stringify({
            dependencies: { 'edugraph-ts': 'ontology-v1' }
        }));
        writeFileSync(resolve(datasetDir, 'manifest.json'), JSON.stringify(manifest({
            entries: {
                'writing#numbers-write-standard': entry,
                'comparison#numbers-compare': {
                    ...entry,
                    generator: 'comparison',
                    view: 'numbers-compare'
                }
            }
        })));

        try {
            updateDatasetManifest({
                projectRoot,
                datasetDir,
                specName: 'ccss',
                build: build({
                    'writing#numbers-write-standard': {...entry, input_hash: 'input-new'},
                    'comparison#numbers-compare': {
                        ...entry,
                        generator: 'comparison',
                        view: 'numbers-compare'
                    }
                }),
                scope: {
                    fullDataset: false,
                    generatorIds: ['writing'],
                    viewIds: ['numbers-write-standard']
                }
            });

            const saved = JSON.parse(readFileSync(resolve(datasetDir, 'manifest.json'), 'utf-8'));
            expect(saved.entries['writing#numbers-write-standard'].input_hash).toBe('input-new');
            expect(saved.entries['comparison#numbers-compare'].input_hash).toBe('input-a');
        } finally {
            rmSync(projectRoot, { recursive: true, force: true });
        }
    });

    it('rejects a scoped update when a changed dependency also reaches an unselected pair', () => {
        const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-manifest-scope-'));
        const datasetDir = resolve(projectRoot, 'out', 'dataset-ccss');
        mkdirSync(datasetDir, {recursive: true});
        writeFileSync(resolve(projectRoot, 'package.json'), JSON.stringify({
            dependencies: {'edugraph-ts': 'ontology-v1'}
        }));
        const graph = (sourceHash: string) => createDependencyGraphSnapshot([
            {
                id: 'source:shared',
                kind: 'source-file',
                input_hash: sourceHash,
                dependencies: []
            },
            {
                id: 'pair:writing#numbers-write-standard',
                kind: 'generator-view-pair',
                input_hash: 'pair-a',
                dependencies: ['source:shared']
            },
            {
                id: 'pair:comparison#numbers-compare',
                kind: 'generator-view-pair',
                input_hash: 'pair-b',
                dependencies: ['source:shared']
            }
        ]);
        const previousGraph = graph('before');
        const previousPlan = planDependencyDelta(null, previousGraph);
        const {reusable_outputs: _previousOutputs, ...previousExecution} = previousPlan;
        const comparison = {
            ...entry,
            generator: 'comparison',
            view: 'numbers-compare',
            execution_nodes: ['pair:comparison#numbers-compare'],
            render_nodes: ['pair:comparison#numbers-compare']
        };
        const writing = {
            ...entry,
            execution_nodes: ['pair:writing#numbers-write-standard'],
            render_nodes: ['pair:writing#numbers-write-standard']
        };
        writeFileSync(resolve(datasetDir, 'manifest.json'), JSON.stringify(manifest({
            dependency_graph: previousGraph,
            last_execution: previousExecution,
            entries: {
                'writing#numbers-write-standard': writing,
                'comparison#numbers-compare': comparison
            }
        })));

        try {
            expect(() => updateDatasetManifest({
                projectRoot,
                datasetDir,
                specName: 'ccss',
                build: build({
                    'writing#numbers-write-standard': writing,
                    'comparison#numbers-compare': comparison
                }, graph('after')),
                scope: {
                    fullDataset: false,
                    generatorIds: ['writing'],
                    viewIds: ['numbers-write-standard']
                }
            })).toThrow('outside its selection');
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });
});

describe('buildDatasetManifest', () => {
    it('builds every artifact kind and hashes overlapping source inputs once', () => {
        const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-manifest-build-'));
        const datasetDir = resolve(projectRoot, 'out', 'dataset-ccss');
        const generatorDir = resolve(projectRoot, 'src', 'generators', 'demo');
        const viewDir = resolve(projectRoot, 'src', 'visuals', 'views', 'demo-view');
        mkdirSync(resolve(datasetDir, 'train', 'demo'), {recursive: true});
        mkdirSync(generatorDir, {recursive: true});
        mkdirSync(viewDir, {recursive: true});
        writeFileSync(resolve(projectRoot, 'package.json'), JSON.stringify({
            dependencies: {'edugraph-ts': 'ontology-v1'}
        }));
        writeFileSync(resolve(generatorDir, 'spec.ts'), 'generator-source');
        writeFileSync(resolve(viewDir, 'spec.ts'), 'view-source');
        writeFileSync(resolve(viewDir, 'checklist.md'), 'leaf-checklist');
        mkdirSync(resolve(projectRoot, 'src', 'visuals', 'views'), {recursive: true});
        writeFileSync(resolve(projectRoot, 'src', 'visuals', 'views', 'checklist.md'), 'root-checklist');
        const imageName = 'demo/sample.png';
        writeFileSync(resolve(datasetDir, 'train', imageName), 'png-bytes');
        writeFileSync(resolve(datasetDir, 'train', 'metadata.jsonl'), `${JSON.stringify({
            file_name: imageName,
            sample_key: 'target#demo#demo-view#train#question#inst:0',
            generator: 'demo',
            view: 'demo-view',
            target_id: 'target',
            content_fingerprint: 'content',
            task_fingerprint: 'task',
            tags: ['Area.Demo'],
            target_associations: [{spec: 'ccss', target_id: 'target'}]
        })}\n`);

        const generator = {
            generatorId: 'demo',
            labels: ['Area.Demo'],
            problemType: 'arithmetic',
            module: {
                id: 'demo',
                relativePath: 'demo',
                absolutePath: generatorDir,
                category: null
            },
            spec: {},
            generator: {}
        } as any;
        const view = {
            viewId: 'demo-view',
            supportedLabels: ['Ability.Demo'],
            problemType: 'arithmetic',
            module: {
                id: 'demo-view',
                relativePath: 'demo-view',
                absolutePath: viewDir,
                category: null
            },
            spec: {},
            schema: {}
        } as any;
        const target = {
            id: 'target',
            labels: [
                'http://edugraph.io/edu/Addition',
                'http://edugraph.io/edu/ProcedureExecution'
            ]
        };

        try {
            const result = buildDatasetManifest({
                projectRoot,
                datasetDir,
                specName: 'ccss',
                targets: [target],
                generators: [generator],
                views: [view],
                generatedSplits: ['train'],
                rendererEnvironment: 'canonical',
                tuples: [{target, generatorId: 'demo', viewId: 'demo-view'}]
            });
            const kinds = new Set(Object.values(result.dependency_graph.nodes).map(node => node.kind));
            expect(kinds).toEqual(new Set(DEPENDENCY_NODE_KINDS));
            expect(result.entries['demo#demo-view'].sample_counts).toEqual({train: 1, val: 0});
            expect(result.entries['demo#demo-view'].execution_nodes).toEqual(expect.arrayContaining([
                'pair:demo#demo-view',
                'image:target#demo#demo-view#train#question#inst:0',
                'vqa:target#demo#demo-view#train#question#inst:0',
                'shard:demo#demo-view#train'
            ]));
            expect(result.source_stats.files_read).toBeGreaterThan(0);
            expect(result.source_stats.files_read).toBeLessThanOrEqual(
                Object.values(result.dependency_graph.nodes).filter(node => node.kind === 'source-file').length
            );
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });
});
