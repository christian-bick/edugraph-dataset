import { describe, expect, it } from 'vitest';
import { analyzeTargetDistinctness, renderTargetDistinctnessMarkdown } from './target-distinctness.ts';

const target = (id: string, labels: string[]) => ({ id, labels });

describe('target distinctness analysis', () => {
    it('classifies identical, contained, overlapping, and adjacent definitions', () => {
        const findings = analyzeTargetDistinctness([
            target('a~1', ['A']),
            target('a~2', ['B']),
            target('b~1', ['A']),
            target('b~2', ['B']),
            target('b~3', ['C']),
            target('c~1', ['B']),
            target('c~2', ['D']),
            target('d~1', ['A', 'X'])
        ]);
        expect(findings.find(finding => finding.left === 'a' && finding.right === 'b')?.relation).toBe('contained');
        expect(findings.find(finding => finding.left === 'a' && finding.right === 'c')?.relation).toBe('overlapping');
        const adjacent = findings.find(finding => finding.left === 'a' && finding.right === 'd');
        expect(adjacent?.relation).toBe('adjacent');
        expect(adjacent?.rightStableDiscriminators).toEqual(['X']);
    });

    it('marks deliberate equivalence and reports stable discriminators', () => {
        const targets = [target('a~1', ['A', 'Shared']), target('b~1', ['B', 'Shared'])];
        const findings = analyzeTargetDistinctness(targets, [{ targets: ['a', 'b'], reason: 'same evidence' }]);
        expect(findings).toHaveLength(0);

        const identical = analyzeTargetDistinctness(
            [target('x~1', ['Shared']), target('y~1', ['Shared'])],
            [{ targets: ['x', 'y'], reason: 'same evidence' }]
        );
        expect(identical[0].declaredEquivalent).toBe(true);
        expect(renderTargetDistinctnessMarkdown('demo', targets, findings)).toContain('advisory');
    });

    it('omits semantically distant definitions', () => {
        expect(analyzeTargetDistinctness([
            target('a~1', ['A', 'B']),
            target('b~1', ['C', 'D'])
        ])).toEqual([]);
    });
});
