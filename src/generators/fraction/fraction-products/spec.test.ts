import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
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
        expect(spec.generalLabels).toEqual([Area.Multiplication]);
        for (const ability of Object.values(Ability)) {
            expect(spec.generalLabels).not.toContain(ability);
        }
    });

    it.each(cases)('resolves %s to the exact mathematical profile',
        (_target, requested, selected, productProfile) => {
            const resolved = extractConfig(FractionProductsGeneratorSchema, [...requested]);
            expect(resolved.config).toEqual({productProfile});
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set<string>(selected));

            const generated = generateWithLabels(new FractionProductsGenerator(), [...requested])!;
            expect(new Set(generated.labels)).toEqual(new Set<string>(selected));
            expect(generated.data.equationWitness !== undefined)
                .toBe(productProfile !== 'fraction-partition');
            expect(generated.data.operandForm === 'mixed-numbers')
                .toBe(productProfile === 'mixed-equation');
        });

    it('does not complete a fraction-form target with mixed original operands', () => {
        const resolved = extractConfig(FractionProductsGeneratorSchema, fractionEquationLabels);
        expect(resolved.config.productProfile).toBe('fraction-equation');
        expect(resolved.resolvedLabels).not.toContain(Scope.MixedNumbers);
        expect(spec.compatibility?.map(rule => rule.id))
            .toContain('fraction-product-original-operand-form');
    });
});
