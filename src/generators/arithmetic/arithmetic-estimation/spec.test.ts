import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticEstimationGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ArithmeticEstimationGenerator spec integration', () => {
    const generator = new ArithmeticEstimationGenerator();

    it('declares estimation and integer rounding as invariant mathematics', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.Estimation,
            Area.IntegerRounding,
            Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives
        ]));
    });

    it('resolves every reviewed operation within 1000', () => {
        for (const operation of [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division]) {
            const stub = generateWithLabels(generator, [operation, Scope.NumbersSmaller1000]);
            expect(stub).not.toBeNull();
            expect(stub!.tags).toEqual(expect.arrayContaining([operation, Scope.NumbersSmaller1000]));
        }
    });
});
