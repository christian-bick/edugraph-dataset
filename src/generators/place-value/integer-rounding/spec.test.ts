import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {IntegerRoundingGenerator} from './generator.ts';

describe('IntegerRoundingGenerator spec integration', () => {
    const generator = new IntegerRoundingGenerator();

    it.each([Scope.StepsOf10, Scope.StepsOf100])('resolves %s', roundingMagnitude => {
        const stub = generateWithLabels(generator, [
            Scope.NumbersSmaller1000,
            roundingMagnitude
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Scope.NumbersSmaller1000,
            roundingMagnitude
        ]));
    });

    it.each([
        Scope.StepsOf10,
        Scope.StepsOf100,
        Scope.StepsOf1000,
        Scope.StepsOf10000,
        Scope.StepsOf100000
    ])('resolves the Grade 4 %s target labels', roundingMagnitude => {
        const stub = generateWithLabels(generator, [
            Area.IntegerRounding,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller1000000,
            Ability.ProcedureExecution,
            roundingMagnitude
        ]);

        expect(stub).not.toBeNull();
        expect('task' in stub!.data && stub!.data.task).toBe('multi-digit-integer-rounding');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Scope.NumbersSmaller1000000,
            roundingMagnitude
        ]));
    });
});
