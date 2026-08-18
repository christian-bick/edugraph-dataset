import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {IntegerAddSubtractStrategiesGenerator} from './generator.ts';
import {spec} from './spec.ts';

const invariantLabels = [
    Scope.TwoOperands,
    Scope.IntegerNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersWithoutZero
];

describe('IntegerAddSubtractStrategiesGenerator spec integration', () => {
    const generator = new IntegerAddSubtractStrategiesGenerator();

    it('declares only invariant mathematical capabilities as general labels', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining(invariantLabels));
        expect(spec.generalLabels).not.toContain(Area.AdditionCompensation);
        expect(spec.generalLabels).not.toContain(Area.SubtractionCompensation);
        expect(spec.generalLabels).not.toContain(Area.SubtractionMakeTen);
        expect(spec.generalLabels).not.toContain(Area.SubtractionThinkAddition);
    });

    it.each([
        [Area.AdditionCompensation, 'addition-compensation'],
        [Area.SubtractionCompensation, 'subtraction-compensation'],
        [Area.SubtractionMakeTen, 'subtraction-make-ten'],
        [Area.SubtractionThinkAddition, 'subtraction-think-addition']
    ] as const)('resolves %s within 1000', (strategyLabel, strategy) => {
        setSeed(strategy);
        const stub = generateWithLabels(generator, [
            strategyLabel,
            ...invariantLabels,
            Scope.ArabicNumerals,
            Scope.NumbersSmaller1000
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.strategy).toBe(strategy);
        expect(stub!.data.leftOperand).toBeLessThan(1000);
        expect(stub!.data.rightOperand).toBeLessThan(1000);
        expect(stub!.data.answer).toBeLessThan(1000);
        expect(stub!.tags).toEqual(expect.arrayContaining([
            strategyLabel,
            Scope.NumbersSmaller1000
        ]));
    });
});
