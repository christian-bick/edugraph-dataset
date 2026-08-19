import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
    DATASET_MANIFEST_SCHEMA_VERSION,
    DatasetManifest,
    DatasetManifestEntry,
    datasetFreshnessIssues,
    datasetRendererIssues,
    updateDatasetManifest
} from './dataset-manifest.ts';
import { currentRendererEnvironment } from './render-environment.ts';

const entry: DatasetManifestEntry = {
    generator: 'writing',
    view: 'numbers-write-standard',
    renderer_environment: currentRendererEnvironment(),
    input_hash: 'input-a',
    content_hash: 'content-a',
    sample_counts: { train: 2, val: 0 },
    generated_splits: ['train', 'val']
};

function manifest(overrides: Partial<DatasetManifest> = {}): DatasetManifest {
    return {
        schema_version: DATASET_MANIFEST_SCHEMA_VERSION,
        spec: 'ccss',
        ontology_dependency: 'ontology-v1',
        generated_at: '2026-01-01T00:00:00.000Z',
        entries: { 'writing#numbers-write-standard': entry },
        ...overrides
    };
}

describe('datasetFreshnessIssues', () => {
    it('accepts matching pair inputs and metadata counts', () => {
        expect(datasetFreshnessIssues(manifest(), 'ccss', {
            'writing#numbers-write-standard': entry
        })).toEqual([]);
    });

    it('requires a manifest', () => {
        expect(datasetFreshnessIssues(null, 'ccss', {})).toEqual([
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
        const issues = datasetFreshnessIssues(manifest(), 'ccss', current);
        expect(issues).toContain(
            'writing#numbers-write-standard is stale: generation source, target, or ontology inputs changed.'
        );
        expect(issues).toContain('writing#numbers-write-stroke is missing from the manifest.');
    });

    it('reports entries that no longer match', () => {
        expect(datasetFreshnessIssues(manifest(), 'ccss', {})).toContain(
            'writing#numbers-write-standard remains in the manifest but no longer matches the current spec.'
        );
    });

    it('reports changed generated content or task fingerprints', () => {
        const current = {
            'writing#numbers-write-standard': { ...entry, content_hash: 'content-b' }
        };
        expect(datasetFreshnessIssues(manifest(), 'ccss', current)).toContain(
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
                entries: {
                    'writing#numbers-write-standard': { ...entry, input_hash: 'input-new' }
                },
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
});
