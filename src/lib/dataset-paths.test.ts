import { describe, expect, it } from 'vitest';
import {
    UNION_DATASET_DIR,
    UNION_SPEC,
    datasetDirForSpec,
    datasetOutDir,
    isUnionSpec,
    resolveDatasetDir,
    specFromDatasetDir,
    vqaCacheRelDir,
} from './dataset-paths.ts';

describe('datasetDirForSpec', () => {
    it('prefixes a spec name', () => {
        expect(datasetDirForSpec('ccss')).toBe('dataset-ccss');
        expect(datasetDirForSpec('test')).toBe('dataset-test');
    });

    it('rejects an empty spec name', () => {
        expect(() => datasetDirForSpec('')).toThrow();
    });

    it('rejects a folder name passed where a spec was expected', () => {
        expect(() => datasetDirForSpec('dataset-ccss')).toThrow(/dataset folder name/);
    });

    it('rejects the reserved union name, which owns no spec folder', () => {
        expect(() => datasetDirForSpec(UNION_SPEC)).toThrow(/not a spec module/);
    });
});

describe('specFromDatasetDir', () => {
    it('inverts datasetDirForSpec', () => {
        expect(specFromDatasetDir('dataset-ccss')).toBe('ccss');
    });

    it('returns null for the union folder', () => {
        expect(specFromDatasetDir(UNION_DATASET_DIR)).toBeNull();
    });
});

describe('resolveDatasetDir', () => {
    it('derives the folder from a spec', () => {
        expect(resolveDatasetDir('ccss')).toBe('dataset-ccss');
        expect(resolveDatasetDir('test')).toBe('dataset-test');
    });

    it('resolves the reserved union name to the merged folder', () => {
        expect(resolveDatasetDir(UNION_SPEC)).toBe(UNION_DATASET_DIR);
    });

    it('requires a value', () => {
        expect(() => resolveDatasetDir('')).toThrow(/requires a spec name/);
    });

    it('agrees with datasetDirForSpec for every real spec', () => {
        // Regression: `--spec=ccss` used to resolve to a nonexistent `dataset-ccss`
        // in validate/churn while generation wrote to `dataset`. Both now agree.
        expect(resolveDatasetDir('ccss')).toBe(datasetDirForSpec('ccss'));
    });
});

describe('isUnionSpec', () => {
    it('recognises only the reserved name', () => {
        expect(isUnionSpec(UNION_SPEC)).toBe(true);
        expect(isUnionSpec('ccss')).toBe(false);
        expect(isUnionSpec('dataset')).toBe(false);
    });
});

describe('path builders', () => {
    it('builds the output path under out/', () => {
        // `resolve` is platform-dependent (Windows prepends a drive), so assert the suffix.
        expect(datasetOutDir('/repo', 'dataset-ccss').replace(/\\/g, '/')).toMatch(/\/repo\/out\/dataset-ccss$/);
    });

    it('builds the repo-relative cache path', () => {
        expect(vqaCacheRelDir('dataset-ccss')).toBe('cache/vqa-validation/dataset-ccss');
    });
});
