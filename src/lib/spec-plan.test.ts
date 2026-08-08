import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { specPlanPaths } from './spec-plan.ts';

describe('specPlanPaths', () => {
    it('keeps each review package in a stable spec/plan directory', () => {
        const paths = specPlanPaths('C:\\repo', 'ccss', 'grade-02');
        expect(paths.directory).toBe(resolve('C:\\repo', 'temp', 'spec-plans', 'ccss', 'grade-02'));
        expect(paths.matchingBefore).toBe(resolve(paths.directory, 'matching-before.json'));
        expect(paths.targetDistinctness).toBe(resolve(paths.directory, 'target-distinctness.md'));
    });

    it('rejects path traversal and path separators', () => {
        expect(() => specPlanPaths('C:\\repo', '../ccss', 'grade-02')).toThrow(/Spec name/);
        expect(() => specPlanPaths('C:\\repo', 'ccss', 'grade/02')).toThrow(/Plan name/);
    });
});
