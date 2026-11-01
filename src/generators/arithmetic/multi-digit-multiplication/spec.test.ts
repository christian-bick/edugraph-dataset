import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {multiplicationDomain} from './domain.ts';
import {MultiDigitMultiplicationGenerator} from './generator.ts';
import {spec, MultiDigitMultiplicationGeneratorSchema as schema} from './spec.ts';

const profiles = [
    [Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand, 1, 1],
    [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand, 1, 2],
    [Scope.SingleDigitSmallestOperand, Scope.ThreeDigitLargestOperand, 1, 3],
    [Scope.SingleDigitSmallestOperand, Scope.FourDigitLargestOperand, 1, 4],
    [Scope.TwoDigitSmallestOperand, Scope.TwoDigitLargestOperand, 2, 2]
] as const;

describe('MultiDigitMultiplicationGenerator spec integration', () => {
    const generator = new MultiDigitMultiplicationGenerator();

    it('keeps direct and planned ranges equivalent for every feasible width/band cell', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        let feasible = 0;
        for (const [index, profile] of profiles.entries()) for (const labels of schema.range[2]) {
            const widths = [profile[0], profile[1]];
            const target = [...widths, ...labels];
            const range = resolveCanonicalRangeFromLabels(labels)!;
            const id = ['one-by-one', 'one-by-two', 'one-by-three', 'one-by-four', 'two-by-two'][index] as Parameters<typeof multiplicationDomain>[0];
            if (!multiplicationDomain(id, range).length) {
                expect(() => extractConfig(schema, target)).toThrow();
                continue;
            }
            const direct = extractConfig(schema, target);
            const bindings = Object.fromEntries(normalizeSchemaChoices(schema, target, 'generator')
                .map(field => [field.field, field.alternatives[0]!.labels]));
            bindings.range = labels;
            const planned = resolveSchemaChoices(schema, target, bindings);
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            feasible++;
        }
        expect(feasible).toBe(25);
    });

    it('declares the invariant two-positive-integer multiplication structure', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.MultiplicationPartialProducts,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]));
    });

    it.each(profiles)('resolves %s with %s', (
        smallestLabel,
        largestLabel,
        smallestOperandDigits,
        largestOperandDigits
    ) => {
        setSeed(`${smallestLabel}-${largestLabel}`);
        const stub = generateWithLabels(generator, [
            Area.MultiplicationPartialProducts,
            Scope.IntegerNumbers,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.TwoOperands,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding,
            smallestLabel,
            largestLabel
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.smallestOperandDigits).toBe(smallestOperandDigits);
        expect(stub!.data.largestOperandDigits).toBe(largestOperandDigits);
        expect(stub!.labels).toEqual(expect.arrayContaining([smallestLabel, largestLabel]));
    });

    it('rejects an unauthored operand profile combination', () => {
        expect(() => generateWithLabels(generator, [
            Area.Multiplication,
            Scope.TwoOperands,
            Scope.TwoDigitSmallestOperand,
            Scope.FourDigitLargestOperand
        ])).toThrow();
    });

    it('resolves a complete valid operand profile when the target is broad', () => {
        setSeed('operand-profile-fallback');
        const stub = generateWithLabels(generator, [Area.MultiplicationPartialProducts]);

        expect(stub).not.toBeNull();
        expect(profiles.some(([smallest, largest]) =>
            stub!.labels.includes(smallest) && stub!.labels.includes(largest)
        )).toBe(true);
    });
});
