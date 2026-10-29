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

    it.each([Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand])(
        'honors the matching-capable division width %s', width => {
            for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [Area.Division, width]);
                expect(stub).not.toBeNull();
                expect(stub!.labels).toContain(width);
                expect(stub!.data.operation).toBe('division');
                expect(stub!.data.comparedQuantity < 10).toBe(width === Scope.SingleDigitLargestOperand);
            }
        }
    );

    it.each([
        [Area.Multiplication, 'multiplication'],
        [Area.Division, 'division']
    ] as const)('resolves %s into the required operation', (label, operation) => {
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
        expect(stub!.labels).toContain(label);
    });
});
