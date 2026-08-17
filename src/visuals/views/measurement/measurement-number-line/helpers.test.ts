import {describe, expect, it} from 'vitest';
import {MeasurementNumberLineGenerator} from '../../../../generators/measurement/measurement-number-line/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {
    MeasurementNumberLineKind,
    MeasurementNumberLineProblem
} from '../../../../types/problems.ts';
import {
    getMeasurementPointLabelX,
    isValidMeasurementNumberLineProblem
} from './helpers.ts';

const generator = new MeasurementNumberLineGenerator();
const measurementKinds: readonly MeasurementNumberLineKind[] = [
    'length',
    'time',
    'liquid-volume',
    'weight',
    'money'
];
const numberKinds = ['fraction', 'decimal'] as const;

const problemFor = (
    measurementKind: MeasurementNumberLineKind,
    numberKind: typeof numberKinds[number],
    seed = `${measurementKind}-${numberKind}`
): MeasurementNumberLineProblem => {
    setSeed(seed);
    return generator.generate({
        measurementKind,
        physicalMeasurement: measurementKind !== 'money',
        numberKind
    }).data;
};

const variants = measurementKinds.flatMap(measurementKind =>
    numberKinds.map(numberKind => [measurementKind, numberKind] as const)
);

describe('measurement-number-line validation', () => {
    it.each(variants)('accepts generated %s / %s scales', (measurementKind, numberKind) => {
        for (let seed = 0; seed < 30; seed++) {
            expect(isValidMeasurementNumberLineProblem(
                problemFor(measurementKind, numberKind, `${measurementKind}-${numberKind}-${seed}`)
            )).toBe(true);
        }
    });

    it('accepts both bounded fraction capacities and the 11-tick decimal capacity', () => {
        const fractionCounts = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            fractionCounts.add(problemFor('length', 'fraction', `fraction-count-${seed}`).tickCount);
        }
        expect(fractionCounts).toEqual(new Set([4, 8]));
        expect(problemFor('money', 'decimal').tickCount).toBe(10);
        expect(problemFor('money', 'decimal').ticks).toHaveLength(11);
    });

    it('clamps wide target labels inside the scale without moving central labels', () => {
        expect(getMeasurementPointLabelX(62)).toBe(187);
        expect(getMeasurementPointLabelX(420)).toBe(420);
        expect(getMeasurementPointLabelX(778)).toBe(653);
    });

    it.each([
        ['wrong task', () => ({...problemFor('length', 'fraction'), task: 'other'})],
        ['wrong unit identity', () => {
            const problem = problemFor('weight', 'decimal');
            return {...problem, unit: {...problem.unit, symbol: 'g'}};
        }],
        ['wrong tick count for decimal', () => ({...problemFor('time', 'decimal'), tickCount: 8})],
        ['incomplete ticks', () => {
            const problem = problemFor('money', 'decimal');
            return {...problem, ticks: problem.ticks.slice(0, -1)};
        }],
        ['misindexed tick', () => {
            const problem = problemFor('length', 'fraction');
            return {...problem, ticks: problem.ticks.map((tick, index) => index === 2 ? {...tick, index: 3} : tick)};
        }],
        ['unequal interval', () => {
            const problem = problemFor('liquid-volume', 'fraction');
            const tick = problem.ticks[2]!;
            return {
                ...problem,
                ticks: problem.ticks.map((item, index) => index === 2
                    ? {...tick, value: {...tick.value, numerator: tick.value.numerator + 1}}
                    : item)
            };
        }],
        ['wrong reference labels', () => ({...problemFor('money', 'fraction'), labeledTickIndices: [0, 2, 4]})],
        ['labeled target', () => {
            const problem = problemFor('time', 'fraction');
            return {...problem, labeledTickIndices: [0, problem.target.index, problem.tickCount]};
        }],
        ['wrong decimal trailing precision', () => {
            const problem = problemFor('money', 'decimal');
            const target = {...problem.target, value: {...problem.target.value, display: '0.5'}};
            return {...problem, target};
        }],
        ['wrong physical singular endpoint', () => {
            const problem = problemFor('length', 'decimal');
            return {...problem, end: {...problem.end, quantityText: '1.0 meters'}};
        }],
        ['wrong fraction-dollar wording', () => {
            const problem = problemFor('money', 'fraction');
            return {...problem, target: {...problem.target, value: {...problem.target.value, quantityText: '$1/2'}}};
        }],
        ['wrong prompt', () => ({...problemFor('weight', 'fraction'), prompt: 'Plot the value.'})],
        ['wrong scale statement', () => ({...problemFor('time', 'decimal'), scaleStatement: 'Use equal intervals.'})],
        ['wrong answer statement', () => ({...problemFor('money', 'decimal'), answerStatement: 'The point is shown.'})],
        ['wrong explanation', () => ({...problemFor('liquid-volume', 'fraction'), explanation: 'Count intervals.'})],
        ['missing target', () => ({...problemFor('length', 'decimal'), target: undefined})]
    ])('rejects %s', (_description, build) => {
        expect(isValidMeasurementNumberLineProblem(
            build() as MeasurementNumberLineProblem
        )).toBe(false);
    });
});
