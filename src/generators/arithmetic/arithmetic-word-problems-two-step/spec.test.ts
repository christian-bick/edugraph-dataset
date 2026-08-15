import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticWordProblemsTwoStepGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ArithmeticWordProblemsTwoStepGenerator spec integration', () => {
    const generator = new ArithmeticWordProblemsTwoStepGenerator();

    it('declares invariant multi-step and sign constraints', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Scope.MultiStep,
            Scope.MultiLevelComposition,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]));
    });

    it('resolves all reviewed single-operation and mixed sequences', () => {
        const cases = [
            {labels: [Area.Addition], operations: ['addition', 'addition']},
            {labels: [Area.Subtraction], operations: ['subtraction', 'subtraction']},
            {labels: [Area.Multiplication], operations: ['multiplication', 'multiplication']},
            {labels: [Area.Division], operations: ['division', 'division']},
            {labels: [Area.Addition, Area.Subtraction], operations: ['addition', 'subtraction']},
            {labels: [Area.Addition, Area.Multiplication], operations: ['multiplication', 'addition']},
            {labels: [Area.Addition, Area.Division], operations: ['division', 'addition']},
            {labels: [Area.Subtraction, Area.Multiplication], operations: ['multiplication', 'subtraction']},
            {labels: [Area.Subtraction, Area.Division], operations: ['division', 'subtraction']},
            {labels: [Area.Multiplication, Area.Division], operations: ['multiplication', 'division']}
        ] as const;

        for (const entry of cases) {
            const stub = generateWithLabels(generator, [
                ...entry.labels,
                Scope.NumbersSmaller100,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersWithoutZero
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.operations).toEqual(entry.operations);
            expect(stub!.tags).toEqual(expect.arrayContaining([...entry.labels]));
        }
    });
});
