import { describe, expect, it } from 'vitest';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
    DATASET_MANIFEST_SCHEMA_VERSION,
    DatasetManifest,
    DatasetManifestBuild,
    DatasetManifestEntry,
    affectedDatasetPairKeys,
    buildDatasetManifest,
    createDatasetManifest,
    dependencyGraphVqaCacheKey,
    datasetFreshnessIssues,
    datasetRendererIssues,
    mergeObservedDatasetBuild,
    planObservedDatasetSourceDelta,
    resolveDatasetGenerationBaseline
} from './dataset-manifest.ts';
import { currentRendererEnvironment } from './render-environment.ts';
import {
    DEPENDENCY_NODE_KINDS,
    createDependencyGraphSnapshot,
    planDependencyDelta,
    type DependencyGraphSnapshot
} from './dependency-planner.ts';
import {buildVqaValidationContext} from './vqa-cache.ts';
import {createWorkCounters} from './work-counters.ts';
import {beginDatasetStoreTransaction} from './dataset-store.ts';

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
        ontology_provenance_hash: 'ontology-provenance-v1',
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
        ontology_semantics: {
            ontology_entities: 0,
            ontology_relations: 0
        }
    };
}

describe('resolveDatasetGenerationBaseline', () => {
    it('ignores a pointerless layout only for a complete replacement', () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-generation-baseline-'));
        const datasetDir = resolve(root, 'dataset');
        mkdirSync(resolve(datasetDir, 'train'), {recursive: true});
        writeFileSync(resolve(datasetDir, 'manifest.json'), JSON.stringify({schema_version: 2}));

        try {
            const replacement = resolveDatasetGenerationBaseline(datasetDir, true);
            expect(replacement.previousManifest).toBeNull();
            expect(replacement.datasetSnapshot?.rows('train')).toEqual([]);

            expect(() => resolveDatasetGenerationBaseline(datasetDir, false))
                .toThrow('has no current.json pointer');
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });
});

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

    it('rejects ontology provenance that differs from the reconstructed graph inputs', () => {
        const current = build({'writing#numbers-write-standard': entry}) as DatasetManifestBuild;
        current.ontology_semantics.dependency = 'ontology-v2';
        current.ontology_semantics.provenance_hash = 'ontology-provenance-v2';
        expect(datasetFreshnessIssues(manifest(), 'ccss', current)).toContain(
            'manifest ontology provenance differs from the exact installed ontology.'
        );
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

describe('datasetRendererIssues', () => {
    it('requires every generated pair to use the expected renderer', () => {
        expect(datasetRendererIssues(manifest(), currentRendererEnvironment())).toEqual([]);
        expect(datasetRendererIssues(manifest(), 'canonical')).toEqual([
            `writing#numbers-write-standard was rendered by "${currentRendererEnvironment()}" instead of "canonical".`
        ]);
    });
});

describe('updateDatasetManifest', () => {
    it('plans an exact pair from a persisted authored-source ownership edge', () => {
        const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-observed-plan-'));
        const sourcePath = resolve(projectRoot, 'src', 'generators', 'demo', 'generator.ts');
        mkdirSync(resolve(sourcePath, '..'), {recursive: true});
        writeFileSync(sourcePath, 'export const version = 2;\n');
        const previousGraph = createDependencyGraphSnapshot([
            {
                id: 'source:src/generators/demo/generator.ts',
                kind: 'source-file',
                input_hash: 'before',
                dependencies: [],
                output: {content_hash: 'before', bytes: 26}
            },
            {
                id: 'generator:demo',
                kind: 'generator-module',
                input_hash: 'demo',
                dependencies: ['source:src/generators/demo/generator.ts']
            },
            {
                id: 'pair:demo#view',
                kind: 'generation-pair',
                input_hash: 'pair',
                dependencies: ['generator:demo']
            }
        ]);
        const pairEntry: DatasetManifestEntry = {
            ...entry,
            generator: 'demo',
            view: 'view',
            execution_nodes: ['pair:demo#view'],
            render_nodes: ['pair:demo#view']
        };

        try {
            const result = planObservedDatasetSourceDelta({
                projectRoot,
                previous: manifest({
                    dependency_graph: previousGraph,
                    entries: {'demo#view': pairEntry}
                }),
                changedFiles: ['src/generators/demo/generator.ts'],
                candidateNodes: ['generator:demo']
            });

            expect(result?.pairKeys).toEqual(['demo#view']);
            expect(result?.plan.changed_roots).toEqual([
                'source:src/generators/demo/generator.ts'
            ]);
            expect(result?.plan.affected_nodes).toContain('pair:demo#view');
            expect(planObservedDatasetSourceDelta({
                projectRoot,
                previous: manifest({
                    dependency_graph: previousGraph,
                    entries: {'demo#view': pairEntry}
                }),
                changedFiles: [
                    'src/generators/demo/generator.ts',
                    'src/spec/ccss/targets.ts'
                ],
                candidateNodes: ['generator:demo']
            })).toBeNull();
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });

    it('merges a rebuilt pair subgraph without replacing unrelated entries', () => {
        const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-observed-merge-'));
        const previousGraph = createDependencyGraphSnapshot([
            {id: 'pair:demo#view', kind: 'generation-pair', input_hash: 'old', dependencies: []},
            {id: 'image:demo-sample', kind: 'image', input_hash: 'old', dependencies: ['pair:demo#view']},
            {id: 'pair:other#view', kind: 'generation-pair', input_hash: 'other', dependencies: []},
            {id: 'image:other-sample', kind: 'image', input_hash: 'other', dependencies: ['pair:other#view']},
            {
                id: 'asset-index:ccss:target',
                kind: 'asset-index-record',
                input_hash: 'asset',
                dependencies: ['image:demo-sample', 'image:other-sample']
            }
        ], undefined, {
            target_ids_by_label: {},
            targets_without_ontology_labels: [],
            matched_pair_keys_by_target: {target: ['demo#view', 'other#view']}
        });
        const partialGraph = createDependencyGraphSnapshot([
            {id: 'pair:demo#view', kind: 'generation-pair', input_hash: 'new', dependencies: []},
            {id: 'image:demo-sample', kind: 'image', input_hash: 'new', dependencies: ['pair:demo#view']},
            {
                id: 'asset-index:ccss:target',
                kind: 'asset-index-record',
                input_hash: 'asset',
                dependencies: ['image:demo-sample']
            }
        ]);
        const demoEntry: DatasetManifestEntry = {
            ...entry,
            generator: 'demo',
            view: 'view',
            execution_nodes: ['pair:demo#view', 'image:demo-sample'],
            render_nodes: ['pair:demo#view', 'image:demo-sample']
        };
        const otherEntry: DatasetManifestEntry = {
            ...entry,
            generator: 'other',
            view: 'view',
            execution_nodes: ['pair:other#view', 'image:other-sample'],
            render_nodes: ['pair:other#view', 'image:other-sample']
        };

        try {
            const result = mergeObservedDatasetBuild({
                projectRoot,
                specName: 'ccss',
                previous: manifest({
                    dependency_graph: previousGraph,
                    entries: {'demo#view': demoEntry, 'other#view': otherEntry}
                }),
                partial: build({
                    'demo#view': {...demoEntry, input_hash: 'new'}
                }, partialGraph),
                pairKeys: ['demo#view']
            });

            expect(result.entries['demo#view'].input_hash).toBe('new');
            expect(result.entries['other#view']).toEqual(otherEntry);
            expect(result.dependency_graph.nodes['pair:demo#view'].input_hash).toBe('new');
            expect(result.dependency_graph.nodes['pair:other#view'].input_hash).toBe('other');
            expect(result.dependency_graph.nodes['asset-index:ccss:target'].dependencies)
                .toEqual(['image:demo-sample', 'image:other-sample']);
            expect(result.dependency_graph.matching_index)
                .toEqual(previousGraph.matching_index);
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });

    it('does not schedule pixel generation for a validation-only ontology definition delta', () => {
        const graph = (definitionHash: string) => createDependencyGraphSnapshot([
            {id: 'ontology:Addition', kind: 'ontology-entity', input_hash: 'identity', dependencies: []},
            {
                id: 'ontology-definition:Addition',
                kind: 'ontology-entity',
                input_hash: definitionHash,
                dependencies: ['ontology:Addition']
            },
            {id: 'pair:demo#view', kind: 'generation-pair', input_hash: 'pair', dependencies: []},
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
            {id: `pair:${pair}`, kind: 'generation-pair', input_hash: pair, dependencies: ['source:module']}
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

    it('rejects a scoped update when a changed dependency also reaches an unselected pair', () => {
        const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-manifest-scope-'));
        const ontologyDependency = 'https://example.test/ontology-v1.tgz';
        writeFileSync(resolve(projectRoot, 'package.json'), JSON.stringify({
            dependencies: {'edugraph-ts': ontologyDependency}
        }));
        writeFileSync(resolve(projectRoot, 'package-lock.json'), JSON.stringify({
            packages: {
                'node_modules/edugraph-ts': {
                    version: '1.0.0',
                    resolved: ontologyDependency,
                    integrity: 'sha512-v1'
                }
            }
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
                kind: 'generation-pair',
                input_hash: 'pair-a',
                dependencies: ['source:shared']
            },
            {
                id: 'pair:comparison#numbers-compare',
                kind: 'generation-pair',
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
        const previous = manifest({
            dependency_graph: previousGraph,
            last_execution: previousExecution,
            entries: {
                'writing#numbers-write-standard': writing,
                'comparison#numbers-compare': comparison
            }
        });

        try {
            expect(() => createDatasetManifest({
                projectRoot,
                specName: 'ccss',
                build: build({
                    'writing#numbers-write-standard': writing,
                    'comparison#numbers-compare': comparison
                }, graph('after')),
                scope: {
                    fullDataset: false,
                    generatorIds: ['writing'],
                    viewIds: ['numbers-write-standard']
                },
                previous
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
        mkdirSync(generatorDir, {recursive: true});
        mkdirSync(viewDir, {recursive: true});
        mkdirSync(resolve(projectRoot, 'src', 'validation', 'vqa'), {recursive: true});
        mkdirSync(resolve(projectRoot, 'src', 'lib'), {recursive: true});
        const ontologyDependency = 'https://example.test/ontology-v1.tgz';
        writeFileSync(resolve(projectRoot, 'package.json'), JSON.stringify({
            dependencies: {'edugraph-ts': ontologyDependency}
        }));
        writeFileSync(resolve(projectRoot, 'package-lock.json'), JSON.stringify({
            packages: {
                'node_modules/edugraph-ts': {
                    version: '1.0.0',
                    resolved: ontologyDependency,
                    integrity: 'sha512-v1'
                }
            }
        }));
        writeFileSync(resolve(generatorDir, 'spec.ts'), 'generator-source');
        writeFileSync(resolve(viewDir, 'spec.ts'), 'view-source');
        writeFileSync(resolve(viewDir, 'checklist.md'), 'leaf-checklist');
        writeFileSync(
            resolve(projectRoot, 'src', 'validation', 'vqa', 'system-instruction.md'),
            'validation policy'
        );
        writeFileSync(resolve(projectRoot, 'src', 'lib', 'vqa-policy.ts'), 'policy code');
        mkdirSync(resolve(projectRoot, 'src', 'visuals', 'views'), {recursive: true});
        writeFileSync(resolve(projectRoot, 'src', 'visuals', 'views', 'checklist.md'), 'root-checklist');
        const imageName = 'demo/sample.png';
        const dataset = beginDatasetStoreTransaction(datasetDir, {
            fullDataset: true,
            generatorIds: ['demo']
        }, 'manifest-fixture');
        mkdirSync(resolve(dataset.stagingDir, 'train', 'demo'), {recursive: true});
        writeFileSync(resolve(dataset.stagingDir, 'train', imageName), 'png-bytes');
        writeFileSync(resolve(dataset.stagingDir, 'train', 'metadata.jsonl'), `${JSON.stringify({
            file_name: imageName,
            sample_key: 'target#demo#demo-view#train#question#inst:0',
            generator: 'demo',
            view: 'demo-view',
            target_id: 'target',
            content_fingerprint: 'content',
            task_fingerprint: 'task',
            tags: [
                'http://edugraph.io/edu/Addition',
                'http://edugraph.io/edu/ProcedureExecution'
            ],
            target_associations: [{spec: 'ccss', target_id: 'target'}]
        })}\n`);
        dataset.commit(null);

        const generator = {
            generatorId: 'demo',
            labels: ['http://edugraph.io/edu/Addition'],
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
            supportedLabels: ['http://edugraph.io/edu/ProcedureExecution'],
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

            const sampleKey = 'target#demo#demo-view#train#question#inst:0';
            const imageNode = result.dependency_graph.nodes[`image:${sampleKey}`];
            const vqaNode = result.dependency_graph.nodes[`vqa:${sampleKey}`];
            const matchNodeId = 'match:ccss:target#demo#demo-view';
            expect(result.dependency_graph.nodes[matchNodeId].dependencies).toEqual([
                'module-pair:demo#demo-view',
                'target-capability:ccss:target'
            ]);
            expect(result.dependency_graph.nodes['pair:demo#demo-view'].dependencies)
                .toContain(matchNodeId);
            expect(imageNode.dependencies).toEqual(expect.arrayContaining([
                'pair:demo#demo-view',
                matchNodeId
            ]));
            const expectedVqaKey = buildVqaValidationContext(
                imageNode.output!.content_hash,
                [
                    resolve(projectRoot, 'src', 'visuals', 'views', 'checklist.md'),
                    resolve(viewDir, 'checklist.md')
                ],
                target.labels,
                result.dependency_graph.nodes['validation-policy:vqa'].input_hash
            ).validationCacheKey;
            expect(dependencyGraphVqaCacheKey(result.dependency_graph, sampleKey))
                .toBe(expectedVqaKey);
            expect(vqaNode.dependencies).toEqual(expect.arrayContaining([
                `image:${sampleKey}`,
                'validation-policy:vqa',
                'ontology-definition:Addition',
                'ontology-definition:ProcedureExecution'
            ]));

            const rebuiltCounters = createWorkCounters();
            const rebuilt = buildDatasetManifest({
                projectRoot,
                datasetDir,
                specName: 'ccss',
                targets: [target],
                generators: [generator],
                views: [view],
                generatedSplits: ['train'],
                rendererEnvironment: 'canonical',
                tuples: [{target, generatorId: 'demo', viewId: 'demo-view'}],
                counters: rebuiltCounters
            });
            expect(dependencyGraphVqaCacheKey(rebuilt.dependency_graph, sampleKey))
                .toBe(expectedVqaKey);
            expect(rebuiltCounters.get('vqa.graph_key_recomputes')).toBe(1);
            expect(rebuiltCounters.get('vqa.validation_contexts')).toBe(1);

            writeFileSync(resolve(viewDir, 'checklist.md'), 'changed-leaf-checklist');
            const changed = buildDatasetManifest({
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
            const checklistPlan = planDependencyDelta(
                result.dependency_graph,
                changed.dependency_graph
            );
            expect(checklistPlan.affected_nodes).toContain(`vqa:${sampleKey}`);
            expect(checklistPlan.affected_nodes).not.toContain(`image:${sampleKey}`);
            expect(dependencyGraphVqaCacheKey(changed.dependency_graph, sampleKey))
                .not.toBe(expectedVqaKey);

            writeFileSync(
                resolve(projectRoot, 'src', 'validation', 'vqa', 'system-instruction.md'),
                'changed validation policy'
            );
            const changedPolicy = buildDatasetManifest({
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
            const policyPlan = planDependencyDelta(
                changed.dependency_graph,
                changedPolicy.dependency_graph
            );
            expect(policyPlan.affected_nodes).toContain(`vqa:${sampleKey}`);
            expect(policyPlan.affected_nodes).not.toContain(`image:${sampleKey}`);
            expect(dependencyGraphVqaCacheKey(changedPolicy.dependency_graph, sampleKey))
                .not.toBe(dependencyGraphVqaCacheKey(changed.dependency_graph, sampleKey));
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });
});
