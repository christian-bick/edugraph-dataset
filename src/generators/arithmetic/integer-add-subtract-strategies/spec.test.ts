import {spec as countingOnSpec} from '../integer-addition-counting-on/spec.ts';
import {spec as countingBackSpec} from '../integer-subtraction-counting-back/spec.ts';
import {IntegerAdditionCountingOnGenerator} from '../integer-addition-counting-on/generator.ts';
import {IntegerSubtractionCountingBackGenerator} from '../integer-subtraction-counting-back/generator.ts';
import {Area, Scope} from 'edugraph-ts';
import {IntegerAddSubtractStrategyProblem} from '../../../types/problems.ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {resolveInferredLabels} from '../../../lib/inferred-labels.ts';
import {IntegerAddSubtractStrategiesGenerator} from './generator.ts';
import {IntegerAddSubtractStrategiesGeneratorSchema, spec} from './spec.ts';

const invariantLabels = [
    Scope.TwoOperands,
    Scope.IntegerNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersWithoutZero
];

describe('IntegerAddSubtractStrategiesGenerator spec integration', () => {
    const generator = new IntegerAddSubtractStrategiesGenerator();

    it.each([Scope.NumbersSmaller10, Scope.NumbersSmaller20])(
        'infers the smallest-operand width for bounded near doubles: %s', rangeLabel => {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [Area.AdditionNearDoubles, rangeLabel]);
                expect(stub).not.toBeNull();
                expect(stub!.labels).toContain(Scope.SingleDigitSmallestOperand);
                expect(Math.min(stub!.data.leftOperand, stub!.data.rightOperand)).toBeLessThan(10);
                expect(stub!.labels.filter(label => label === Scope.SingleDigitSmallestOperand)).toHaveLength(1);
            }
        }
    );

    it('claims only the smaller operand at the 9 + 10 boundary', () => {
        const config = {strategy: 'addition-near-doubles', range: {min: 9, max: 20}} as const;
        const labels = resolveInferredLabels({spec, schema: IntegerAddSubtractStrategiesGeneratorSchema,
            config, labels: [], owner: 'generator'});
        const data = generator.generate(config)!.data;
        expect(labels).toEqual([Scope.SingleDigitSmallestOperand]);
        expect([data.leftOperand, data.rightOperand].sort((a, b) => a - b)).toEqual([9, 10]);
    });

    it.each([
        {strategy: 'addition-near-doubles', range: {min: 0, max: 21}},
        {strategy: 'addition-near-doubles', range: {min: 10, max: 22}},
        {strategy: 'addition-near-doubles', range: {min: 0, max: 1000}},
        {strategy: 'addition-near-doubles', range: undefined},
        {strategy: 'addition-compensation', range: {min: 0, max: 20}},
        {strategy: undefined, range: {min: 0, max: 20}}
    ] as const)('leaves wider, other-strategy and unresolved configurations unclaimed: %j', config => {
        expect(resolveInferredLabels({spec, schema: IntegerAddSubtractStrategiesGeneratorSchema,
            config, labels: [], owner: 'generator'})).toEqual([]);
    });

    it('supports two-digit near doubles outside the inferred range', () => {
        const data = generator.generate({strategy: 'addition-near-doubles', range: {min: 10, max: 22}})!.data;
        expect([data.leftOperand, data.rightOperand].sort((a, b) => a - b)).toEqual([10, 11]);
        const stub = generateWithLabels(generator, [Area.AdditionNearDoubles, Scope.NumbersSmaller1000]);
        expect(stub).not.toBeNull();
        expect(stub!.labels).not.toContain(Scope.SingleDigitSmallestOperand);
    });

    it('retains the existing matching-capable make-ten width declaration', () => {
        const stub = generateWithLabels(generator, [Area.AdditionMakeTen, Scope.NumbersSmaller20]);
        expect(stub).not.toBeNull();
        expect(stub!.labels.filter(label => label === Scope.SingleDigitSmallestOperand)).toHaveLength(1);
        expect(IntegerAddSubtractStrategiesGeneratorSchema.strategy[2]).toContainEqual([
            Area.AdditionMakeTen, Scope.SingleDigitSmallestOperand
        ]);
    });

    it('declares only invariant mathematical capabilities as general labels', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining(invariantLabels));
        expect(spec.generalLabels).not.toContain(Area.AdditionCountingOn);
        expect(spec.generalLabels).not.toContain(Area.SubtractionCountingBack);
        expect(spec.generalLabels).not.toContain(Area.AdditionMakeTen);
        expect(spec.generalLabels).not.toContain(Area.AdditionNearDoubles);
        expect(spec.generalLabels).not.toContain(Area.AdditionCompensation);
        expect(spec.generalLabels).not.toContain(Area.SubtractionCompensation);
        expect(spec.generalLabels).not.toContain(Area.SubtractionMakeTen);
        expect(spec.generalLabels).not.toContain(Area.SubtractionThinkAddition);
    });

    it.each([
        [Area.AdditionCountingOn, 'addition-counting-on'],
        [Area.SubtractionCountingBack, 'subtraction-counting-back'],
        [Area.AdditionMakeTen, 'addition-make-ten'],
        [Area.AdditionNearDoubles, 'addition-near-doubles'],
        [Area.AdditionCompensation, 'addition-compensation'],
        [Area.SubtractionCompensation, 'subtraction-compensation'],
        [Area.SubtractionMakeTen, 'subtraction-make-ten'],
        [Area.SubtractionThinkAddition, 'subtraction-think-addition']
    ] as const)('resolves %s within 1000', (strategyLabel, strategy) => {
        setSeed(strategy);
        const selected = strategy === 'addition-counting-on' ? new IntegerAdditionCountingOnGenerator()
            : strategy === 'subtraction-counting-back' ? new IntegerSubtractionCountingBackGenerator() : generator;
        const selectedSpec = strategy === 'addition-counting-on' ? countingOnSpec : strategy === 'subtraction-counting-back' ? countingBackSpec : spec;
        const stub = generateWithLabels<IntegerAddSubtractStrategyProblem>(selected, [
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
        expect([...selectedSpec.generalLabels, ...stub!.labels]).toEqual(expect.arrayContaining([
            strategyLabel,
            Scope.NumbersSmaller1000
        ]));
    });

    it.each([
        [Area.AdditionCountingOn, 'addition-counting-on', Scope.NumbersSmaller10],
        [Area.AdditionCountingOn, 'addition-counting-on', Scope.NumbersSmaller20],
        [Area.SubtractionCountingBack, 'subtraction-counting-back', Scope.NumbersSmaller10],
        [Area.SubtractionCountingBack, 'subtraction-counting-back', Scope.NumbersSmaller20],
        [Area.AdditionNearDoubles, 'addition-near-doubles', Scope.NumbersSmaller10],
        [Area.AdditionNearDoubles, 'addition-near-doubles', Scope.NumbersSmaller20],
        [Area.AdditionMakeTen, 'addition-make-ten', Scope.NumbersSmaller20],
        [Area.SubtractionMakeTen, 'subtraction-make-ten', Scope.NumbersSmaller20],
        [Area.SubtractionThinkAddition, 'subtraction-think-addition', Scope.NumbersSmaller20]
    ] as const)('resolves Grade 1 %s as %s for %s', (strategyLabel, strategy, rangeLabel) => {
        setSeed(`${strategy}-${rangeLabel}`);
        const selected = strategy === 'addition-counting-on' ? new IntegerAdditionCountingOnGenerator()
            : strategy === 'subtraction-counting-back' ? new IntegerSubtractionCountingBackGenerator() : generator;
        const selectedSpec = strategy === 'addition-counting-on' ? countingOnSpec : strategy === 'subtraction-counting-back' ? countingBackSpec : spec;
        const stub = generateWithLabels<IntegerAddSubtractStrategyProblem>(selected, [
            strategyLabel,
            ...invariantLabels,
            Scope.ArabicNumerals,
            rangeLabel
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.strategy).toBe(strategy);
        const upperBound = rangeLabel === Scope.NumbersSmaller10 ? 10 : 20;
        expect(stub!.data.leftOperand).toBeLessThan(upperBound);
        expect(stub!.data.rightOperand).toBeLessThan(upperBound);
        expect(stub!.data.answer).toBeLessThan(upperBound);
        expect([...selectedSpec.generalLabels, ...stub!.labels]).toEqual(expect.arrayContaining([strategyLabel, rangeLabel]));
    });
});
