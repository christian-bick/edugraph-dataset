import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {FractionProductsGenerator} from './generator.ts';
import {FractionProductsGeneratorSchema, spec} from './spec.ts';

const partitionLabels = [
    Area.Multiplication, Area.Division, Area.FractionNumeratorInterpretation,
    Area.FractionDenominatorInterpretation, Scope.FractionNumbers, Scope.EqualShares
];
const fractionEquationLabels = [
    Area.Multiplication, Area.Equation, Scope.FractionNumbers,
    Scope.SingleFrameOfReference
];
const mixedEquationLabels = [
    Area.Multiplication, Area.Equation, Scope.MixedNumbers,
    Scope.SingleFrameOfReference
];

const cases = [
    ['5.NF.B.4a-partition-product', [...partitionLabels, Ability.Interpretation],
        partitionLabels.slice(1), 'fraction-partition'],
    ['5.NF.B.4a-create-product-story', [...partitionLabels, Ability.TextualArticulation],
        partitionLabels.slice(1), 'fraction-partition'],
    ['5.NF.B.6-fraction-product-problems fractions',
        [...fractionEquationLabels, Ability.TextualReception, Ability.ProcedureExecution],
        fractionEquationLabels.slice(1), 'fraction-equation'],
    ['5.NF.B.6-fraction-product-problems mixed numbers',
        [...mixedEquationLabels, Ability.TextualReception, Ability.ProcedureExecution],
        mixedEquationLabels.slice(1), 'mixed-equation']
] as const;

describe('fraction-products schema integration', () => {
    it('owns invariant multiplication and leaves Abilities to the views', () => {
        expect(spec.generalLabels).toEqual([Area.Multiplication, Scope.NumbersWithoutNegatives]);
        for (const ability of Object.values(Ability)) {
            expect(spec.generalLabels).not.toContain(ability);
        }
    });

    it.each(cases)('resolves %s to the exact mathematical profile',
        (_target, requested, selected, productProfile) => {
            setSeed(17);
            const resolved = extractConfig(FractionProductsGeneratorSchema, [...requested]);
            const selectedProfile = resolved.config.productProfile!;
            expect(selectedProfile === 'mixed-equation' ? selectedProfile : selectedProfile.replace(/-(im)?proper$/, ''))
                .toBe(productProfile);
            const expectedLabels = [...selected, selectedProfile.endsWith('-proper')
                ? Scope.ProperFractions : Scope.ImproperFractions,
                Scope[`NumbersSmaller${resolved.config.range!.max}` as keyof typeof Scope]];
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set<string>(expectedLabels));

            setSeed(17);
            const generated = generateWithLabels(new FractionProductsGenerator(), [...requested])!;
            expect(new Set(generated.labels)).toEqual(new Set<string>(expectedLabels));
            expect(generated.data.equationWitness !== undefined)
                .toBe(productProfile !== 'fraction-partition');
            expect(generated.data.operandForm === 'mixed-numbers')
                .toBe(productProfile === 'mixed-equation');
        });

    it('does not complete a fraction-form target with mixed original operands', () => {
        const resolved = extractConfig(FractionProductsGeneratorSchema, fractionEquationLabels);
        expect(resolved.config.productProfile).toMatch(/^fraction-equation-(im)?proper$/);
        expect(resolved.resolvedLabels).not.toContain(Scope.MixedNumbers);
        expect(spec.compatibility?.map(rule => rule.id))
            .toContain('fraction-product-original-operand-form');
    });

    it.each([Scope.ProperFractions, Scope.ImproperFractions])(
        'makes the evidenced multiplier magnitude %s matching-capable in both fraction tasks', magnitude => {
            for (const labels of [partitionLabels, fractionEquationLabels]) {
                const generated = generateWithLabels(new FractionProductsGenerator(), [...labels, magnitude])!;
                expect(generated.labels).toContain(magnitude);
                expect(generated.data.operandForm).toBe('fractions');
                expect(generated.data.multiplierValue.numerator < generated.data.multiplierValue.denominator)
                    .toBe(magnitude === Scope.ProperFractions);
                expect(generated.labels).not.toContain(Scope.MixedNumbers);
            }
        }
    );
});
