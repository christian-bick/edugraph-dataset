import { Area, Scope } from 'edugraph-ts';
import { describe, expect, it } from 'vitest';
import { setSeed } from '../../../lib/random.ts';
import { extractConfig, generateWithLabels } from '../../../lib/utils.ts';
import { resolveSchemaChoices } from '../../../lib/schema-choices.ts';
import { createCanonicalNumericRange, hasCanonicalRangeWitness } from '../../../lib/canonical-numeric-range.ts';
import { FractionNumberLineGenerator } from './generator.ts';
import { spec, FractionNumberLineGeneratorSchema as schema } from './spec.ts';
describe('FractionNumberLineGenerator spec integration', () => {
    const generator = new FractionNumberLineGenerator();
    it('declares exactly the invariant fraction numeration capabilities', () => {
        expect(spec.generatorId).toBe('fraction-number-line');
        expect(spec.generalLabels).toEqual([
            Area.NumerationWithFractions,
            Scope.NumbersWithoutNegatives
        ]);
    });
    it.each([
        Scope.UnitFractions,
        Scope.NonUnitFractions,
        Scope.ImproperFractions
    ] as const)('resolves %s as the mathematical fraction type', fractionType => {
        setSeed(fractionType);
        const stub = generateWithLabels(generator, [
            Area.NumerationWithFractions,
            fractionType
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.labels).toContain(fractionType);
        if (fractionType === Scope.UnitFractions) {
            expect(stub!.data.numerator).toBe(1);
        }
        else if (fractionType === Scope.NonUnitFractions) {
            expect(stub!.data.numerator).toBeGreaterThan(1);
            expect(stub!.data.numerator).toBeLessThan(stub!.data.denominator);
        }
        else {
            expect(stub!.data.numerator).toBeGreaterThan(stub!.data.denominator);
            expect(stub!.data.numerator).toBeLessThan(2 * stub!.data.denominator);
        }
    });
    it('resolves every feasible count band through both paths and rejects upper20 for proper fractions', () => {
        for (const [label, kind] of [[Scope.UnitFractions, 'unit'], [Scope.NonUnitFractions, 'nonunit'], [Scope.ImproperFractions, 'improper']] as const)
            for (const [bound, upper] of [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20]] as const) {
                const labels = [label, bound];
                if (kind !== 'improper' && upper === 20) {
                    expect(() => extractConfig(schema, labels)).toThrow();
                    continue;
                }
                const direct = extractConfig(schema, labels);
                const planned = resolveSchemaChoices(schema, labels, { fractionType: [label], range: [bound] });
                expect(direct.config).toEqual(planned.config);
                expect(new Set(direct.resolvedLabels)).toEqual(new Set(planned.resolvedLabels));
                expect(direct.config).toEqual({ fractionType: kind, range: createCanonicalNumericRange(upper) });
                const { data } = generator.generate(direct.config);
                expect(hasCanonicalRangeWitness([0, data.numerator, data.denominator, data.numerator / data.denominator], direct.config.range!)).toBe(true);
            }
    });
});
