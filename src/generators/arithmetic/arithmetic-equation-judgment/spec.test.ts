import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticEquationJudgmentGenerator} from './generator.ts';

describe('ArithmeticEquationJudgmentGenerator spec integration', () => {
    const generator = new ArithmeticEquationJudgmentGenerator();

    it('resolves both supported operations and range labels', () => {
        for (const operation of [Area.Addition, Area.Subtraction] as const) {
            const stub = generateWithLabels(generator, [
                operation,
                Ability.PlausibilityEvaluation,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.operation).toBe(operation === Area.Addition ? 'addition' : 'subtraction');
            expect(stub!.tags).toEqual(expect.arrayContaining([operation, Scope.NumbersSmaller20]));
        }
    });
});
