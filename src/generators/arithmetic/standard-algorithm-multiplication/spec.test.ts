import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {StandardAlgorithmMultiplicationGenerator} from './generator.ts';
import {spec, StandardAlgorithmMultiplicationGeneratorSchema} from './spec.ts';

describe('StandardAlgorithmMultiplicationGenerator spec', () => {
    it('owns the invariant algorithm and multi-digit whole-number constraints', () => {
        expect(spec.generalLabels).toEqual([
            Area.MultiplicationStandardAlgorithm,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.MultipleDigitSmallestOperand,
            Scope.NumbersWithZero
        ]);
        expect(findSchemaFallbackContractIssues(StandardAlgorithmMultiplicationGeneratorSchema)).toEqual([]);
    });

    it('keeps all four finite bands and overflow inspectable on the unqualified target', () => {
        const alternatives = normalizeSchemaChoices(StandardAlgorithmMultiplicationGeneratorSchema,
            [Area.MultiplicationStandardAlgorithm], 'generator')[0]!.alternatives;
        expect(new Set(alternatives.map(alternative => JSON.stringify(alternative.labels)))).toEqual(new Set([
            [], [Scope.NumbersSmaller1000], [Scope.NumbersSmaller10000],
            [Scope.NumbersSmaller100000], [Scope.NumbersSmaller1000000]
        ].map(labels => JSON.stringify(labels))));
        expect(StandardAlgorithmMultiplicationGeneratorSchema.range[1]([])).toBe(false);
        expect(extractConfig(StandardAlgorithmMultiplicationGeneratorSchema, []).config).toEqual({range: false});
        for (const alternative of alternatives) {
            const planned = resolveSchemaChoices(StandardAlgorithmMultiplicationGeneratorSchema,
                [Area.MultiplicationStandardAlgorithm], {range: alternative.labels});
            expect(planned.config.range).toEqual(alternative.labels.length
                ? StandardAlgorithmMultiplicationGeneratorSchema.range[1]([...alternative.labels]) : false);
        }
    });

    it.each([
        [Scope.NumbersSmaller1000, 1000], [Scope.NumbersSmaller10000, 10000],
        [Scope.NumbersSmaller100000, 100000], [Scope.NumbersSmaller1000000, 1000000]
    ] as const)('resolves explicit %s identically through direct and planned configuration', (label, upper) => {
        const target = [Area.MultiplicationStandardAlgorithm, label];
        const direct = extractConfig(StandardAlgorithmMultiplicationGeneratorSchema, target);
        const alternatives = normalizeSchemaChoices(StandardAlgorithmMultiplicationGeneratorSchema, target, 'generator')[0]!.alternatives;
        expect(alternatives.map(alternative => alternative.labels)).toEqual([[label]]);
        const planned = resolveSchemaChoices(StandardAlgorithmMultiplicationGeneratorSchema, target, {range: [label]});
        expect(planned.config).toEqual({range: createCanonicalNumericRange(upper)});
        expect(planned.config).toEqual(direct.config);
        expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
        setSeed(label);
        const stub = generateWithLabels(new StandardAlgorithmMultiplicationGenerator(), target)!;
        expect(stub.labels).toEqual([label]);
        expect(stub.data.product).toBeGreaterThan(createCanonicalNumericRange(upper).maximumAbove);
        expect(stub.data.product).toBeLessThanOrEqual(upper);
    });

    it('resolves the Grade 5 target to its exact mathematical witness', () => {
        setSeed('standard-algorithm-multiplication-spec');
        const stub = generateWithLabels(new StandardAlgorithmMultiplicationGenerator(), [
            Area.MultiplicationStandardAlgorithm,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.MultipleDigitSmallestOperand
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.labels).toEqual([]);
        expect(stub!.data.product).toBeGreaterThan(1000000);
        expect(stub!.data.partialRows).toHaveLength(String(stub!.data.multiplier).length);
        expect(stub!.data.partialRows.reduce((sum, row) => sum + row.alignedProduct, 0))
            .toBe(stub!.data.product);
        expect(stub!.data.partialRows.some(row => row.shiftPlaces > 0 && row.alignedProduct % 10 === 0)).toBe(true);
    });
});
