import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {StandardAlgorithmAddSubtractGenerator} from './generator.ts';
import {spec} from './spec.ts';

const invariantLabels = [
    Scope.TwoOperands,
    Scope.IntegerNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersWithoutZero
];

describe('StandardAlgorithmAddSubtractGenerator spec integration', () => {
    const generator = new StandardAlgorithmAddSubtractGenerator();

    it('declares only invariant mathematical capabilities as general labels', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining(invariantLabels));
        expect(spec.generalLabels).not.toContain(Area.AdditionStandardAlgorithm);
        expect(spec.generalLabels).not.toContain(Area.SubtractionStandardAlgorithm);
    });

    it.each([
        [Area.AdditionStandardAlgorithm, 'addition'],
        [Area.SubtractionStandardAlgorithm, 'subtraction']
    ] as const)('resolves %s and the authored Grade 4 range', (operationLabel, operation) => {
        setSeed(operation);
        const stub = generateWithLabels(generator, [
            operationLabel,
            ...invariantLabels,
            Scope.ArabicNumerals,
            Scope.NumbersLarger1000,
            Scope.NumbersSmaller1000000
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.data.topValue).toBeGreaterThanOrEqual(1000);
        expect(stub!.data.topValue).toBeLessThanOrEqual(999999);
        expect(stub!.tags).toEqual(expect.arrayContaining([
            operationLabel,
            Scope.NumbersLarger1000,
            Scope.NumbersSmaller1000000
        ]));
    });
});
