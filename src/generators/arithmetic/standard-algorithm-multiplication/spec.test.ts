import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
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
            Scope.MultipleDigitSmallestOperand
        ]);
        expect(StandardAlgorithmMultiplicationGeneratorSchema).toEqual({});
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
        expect(stub!.data.partialRows).toHaveLength(String(stub!.data.multiplier).length);
        expect(stub!.data.partialRows.reduce((sum, row) => sum + row.alignedProduct, 0))
            .toBe(stub!.data.product);
    });
});
