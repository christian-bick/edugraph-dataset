import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MultiplicativeComparisonGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('MultiplicativeComparisonGenerator spec integration', () => {
    const generator = new MultiplicativeComparisonGenerator();

    it('declares the invariant multiplicative-comparison mathematics', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.ProportionalScaling,
            Scope.SingleStep,
            Scope.TwoOperands,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]));
    });

    it.each([
        [Area.Multiplication, 'multiplication', 'compared'],
        [Area.Division, 'division', undefined]
    ] as const)('resolves %s into the required operation', (label, operation, unknownRole) => {
        setSeed(7);
        const stub = generateWithLabels(generator, [
            label,
            Area.ProportionalScaling,
            Scope.SingleStep,
            Scope.TwoOperands,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        if (unknownRole) expect(stub!.data.unknownRole).toBe(unknownRole);
        else expect(['reference', 'scale-factor']).toContain(stub!.data.unknownRole);
        expect(stub!.tags).toContain(label);
    });
});
