import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {describe, expect, it, vi} from 'vitest';
import type {CoverageInputIdentity} from './coverage-identity.ts';
import {
    projectCoverageData,
    readCoverageCoreArtifact,
    resolveCoverageCore
} from './coverage-core.ts';
import {createWorkCounters} from './work-counters.ts';
import type {CoverageData, StandardsTreeData} from '../standards-explorer/types.ts';

const inputs = (ref = 'main'): CoverageInputIdentity => ({
    schema_version: 1,
    producer_epoch: 'standards-coverage-v1',
    repository: {ref, sha: 'a'.repeat(40), content_sha256: 'b'.repeat(64)},
    standards: {
        provider: 'huggingface',
        repository: 'example/standards',
        revision: 'c'.repeat(40),
        files: [
            {path: 'standards.jsonl', sha256: 'd'.repeat(64), bytes: 12},
            {path: 'domain_groups.json', sha256: 'e'.repeat(64), bytes: 34}
        ]
    },
    ontology: {
        package: 'edugraph-ts',
        version: 'v1.0.0',
        dependency: 'https://example.test/ontology.tgz',
        resolved: 'https://example.test/ontology.tgz',
        integrity: 'sha512-exact',
        semantic_usage_sha256: 'usage-a'
    },
    selection: {grade: null, exclude_high_school: false, known_assets_sha256: null}
});

const tree: StandardsTreeData = {tree: {}, standardsMap: {}};
const coverage: CoverageData = {
    metadata: {
        generated_at: 'first',
        ontology_version: 'v1.0.0',
        total_leaves_scanned: 0,
        spec_covered_count: 0,
        covered_count: 0,
        missing_generator_count: 0,
        missing_ontology_count: 0,
        analysis_needed_count: 0,
        beyond_scope_count: 0,
        fully_beyond_scope_count: 0
    },
    coverage: {},
    tasks: []
};

describe('coverage core artifact', () => {
    it('publishes once and reuses the same core across preview/release refs', async () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-coverage-core-'));
        const build = vi.fn(async () => ({tree, coverage}));
        const counters = createWorkCounters();
        try {
            const first = await resolveCoverageCore({root, inputs: inputs('main'), build, counters});
            const second = await resolveCoverageCore({root, inputs: inputs('v1.0.0'), build, counters});
            expect(first.reused).toBe(false);
            expect(second.reused).toBe(true);
            expect(second.artifact.core_input_key).toBe(first.artifact.core_input_key);
            expect(build).toHaveBeenCalledTimes(1);
            expect(counters.get('coverage_core.misses')).toBe(1);
            expect(counters.get('coverage_core.hits')).toBe(1);

            expect(projectCoverageData(second.artifact.coverage, 'release').metadata.generated_at)
                .toBe('release');
            expect(projectCoverageData(second.artifact.coverage, 'release', 'v2.0.0').metadata.ontology_version)
                .toBe('v2.0.0');
            expect(second.artifact.coverage.metadata).not.toHaveProperty('generated_at');
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });

    it('rejects a corrupt immutable artifact instead of silently recomputing it', async () => {
        const root = mkdtempSync(resolve(tmpdir(), 'edugraph-coverage-core-'));
        try {
            const result = await resolveCoverageCore({
                root,
                inputs: inputs(),
                build: async () => ({tree, coverage})
            });
            const corePath = resolve(result.directory, 'core.json');
            writeFileSync(corePath, `${readFileSync(corePath, 'utf-8')}corrupt`);
            expect(() => readCoverageCoreArtifact({
                root,
                key: result.artifact.core_input_key
            })).toThrow('failed manifest or content integrity verification');
            await expect(resolveCoverageCore({
                root,
                inputs: inputs(),
                build: vi.fn(async () => ({tree, coverage}))
            })).rejects.toThrow('failed manifest or content integrity verification');
        } finally {
            rmSync(root, {recursive: true, force: true});
        }
    });
});
