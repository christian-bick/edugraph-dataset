import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {FractionNumberLineGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('FractionNumberLineGenerator spec integration', () => {
    const generator = new FractionNumberLineGenerator();

    it('declares exactly the invariant fraction numeration capabilities', () => {
        expect(spec).toEqual({
            generatorId: 'fraction-number-line',
            generalLabels: [
                Area.NumerationWithFractions,
                Area.FractionNotation
            ]
        });
    });

    it.each([
        Scope.UnitFractions,
        Scope.NonUnitFractions,
        Scope.ImproperFractions
    ] as const)('resolves %s as the mathematical fraction type', fractionType => {
        setSeed(fractionType);
        const stub = generateWithLabels(generator, [
            Area.NumerationWithFractions,
            Area.FractionNotation,
            fractionType
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.tags).toContain(fractionType);
        if (fractionType === Scope.UnitFractions) {
            expect(stub!.data.numerator).toBe(1);
        } else if (fractionType === Scope.NonUnitFractions) {
            expect(stub!.data.numerator).toBeGreaterThan(1);
            expect(stub!.data.numerator).toBeLessThan(stub!.data.denominator);
        } else {
            expect(stub!.data.numerator).toBeGreaterThan(stub!.data.denominator);
            expect(stub!.data.numerator).toBeLessThan(2 * stub!.data.denominator);
        }
    });
});
