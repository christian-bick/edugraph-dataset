import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticEstimationGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ArithmeticEstimationGenerator spec integration', () => {
    const generator = new ArithmeticEstimationGenerator();

    it('declares formal integer rounding as invariant mathematics', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.IntegerRounding,
            Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives
        ]));
        expect(spec.generalLabels).not.toContain(Area.Estimation);
    });

    it('resolves every reviewed operation within 1000', () => {
        for (const operation of [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division]) {
            const stub = generateWithLabels(generator, [operation, Scope.NumbersSmaller1000]);
            expect(stub).not.toBeNull();
            expect(stub!.tags).toEqual(expect.arrayContaining([operation, Scope.NumbersSmaller1000]));
        }
    });
});
