import {describe, expect, it} from 'vitest';
import {MeasurementNumberLineGenerator} from '../../../../generators/measurement/measurement-number-line/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {
    MeasurementNumberLineKind,
    MeasurementNumberLineProblem
} from '../../../../types/problems.ts';
import {
    formatMeasurementNumberLineValue,
    formatMeasurementQuantity,
    getMeasurementNumberLinePresentation,
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
        numberKind
    }).data;
};

const variants = measurementKinds.flatMap(measurementKind =>
    numberKinds.map(numberKind => [measurementKind, numberKind] as const)
);

describe('measurement-number-line validation and presentation', () => {
    it.each(variants)('accepts generated %s / %s scales', (measurementKind, numberKind) => {
        for (let seed = 0; seed < 30; seed++) {
            expect(isValidMeasurementNumberLineProblem(
                problemFor(measurementKind, numberKind, `${measurementKind}-${numberKind}-${seed}`)
            )).toBe(true);
        }
    });

    it('accepts both bounded fraction capacities and the 11-value decimal capacity', () => {
        const fractionCounts = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            fractionCounts.add(
                problemFor('length', 'fraction', `fraction-count-${seed}`).tickValues.length - 1
            );
        }
        expect(fractionCounts).toEqual(new Set([4, 8]));
        expect(problemFor('money', 'decimal').tickValues).toHaveLength(11);
    });

    it('derives fraction, decimal, unit, and task wording from canonical values', () => {
        for (const measurementKind of measurementKinds.filter(kind => kind !== 'money')) {
            const fraction = problemFor(measurementKind, 'fraction', `${measurementKind}-fraction`);
            const target = fraction.tickValues[fraction.targetIndex]!;
            const display = formatMeasurementNumberLineValue(target, 'fraction');
            const quantity = `${display} of ${measurementKind === 'time' ? 'an' : 'a'} ${fraction.unitId}`;
            const presentation = getMeasurementNumberLinePresentation(fraction);
            const intervalQuantity = formatMeasurementQuantity(
                fraction.tickValues[1]!,
                'fraction',
                fraction.unitId
            );
            expect(formatMeasurementQuantity(target, 'fraction', fraction.unitId)).toBe(quantity);
            expect(presentation.prompt).toBe(`Plot ${quantity} on the number line.`);
            expect(presentation.scaleStatement)
                .toBe(`Each equal interval represents ${intervalQuantity}.`);
            expect(presentation.answerStatement)
                .toBe(`${quantity} belongs at tick ${fraction.targetIndex} after zero.`);
            expect(presentation.explanation)
                .toBe(`Starting at zero, count ${fraction.targetIndex} equal intervals of ${intervalQuantity}. The point lands at ${quantity}.`);

            const decimal = problemFor(measurementKind, 'decimal', `${measurementKind}-decimal`);
            const end = decimal.tickValues.at(-1)!;
            expect(formatMeasurementNumberLineValue(end, 'decimal')).toBe('1.0');
            expect(formatMeasurementQuantity(end, 'decimal', decimal.unitId))
                .toBe(`1.0 ${getMeasurementNumberLinePresentation(decimal).unit.singular}`);
        }

        const moneyDecimal = problemFor('money', 'decimal');
        const moneyTarget = moneyDecimal.tickValues[moneyDecimal.targetIndex]!;
        expect(formatMeasurementQuantity(moneyTarget, 'decimal', 'dollar')).toMatch(/^\$0\.\d0$/);

        const moneyFraction = problemFor('money', 'fraction');
        const fractionTarget = moneyFraction.tickValues[moneyFraction.targetIndex]!;
        expect(formatMeasurementQuantity(fractionTarget, 'fraction', 'dollar'))
            .toBe(`${formatMeasurementNumberLineValue(fractionTarget, 'fraction')} of a dollar`);
    });

    it('formats zero and whole endpoints without payload display aliases', () => {
        expect(formatMeasurementNumberLineValue({numerator: 0, denominator: 1}, 'fraction')).toBe('0');
        expect(formatMeasurementNumberLineValue({numerator: 1, denominator: 1}, 'fraction')).toBe('1');
        expect(formatMeasurementQuantity({numerator: 0, denominator: 1}, 'fraction', 'meter'))
            .toBe('0 meters');
        expect(formatMeasurementQuantity({numerator: 1, denominator: 1}, 'fraction', 'hour'))
            .toBe('1 hour');
        expect(formatMeasurementQuantity({numerator: 0, denominator: 1}, 'fraction', 'dollar'))
            .toBe('0 dollars');
        expect(formatMeasurementQuantity({numerator: 1, denominator: 1}, 'fraction', 'dollar'))
            .toBe('1 dollar');
    });

    it('clamps wide target labels inside the scale without moving central labels', () => {
        expect(getMeasurementPointLabelX(62)).toBe(187);
        expect(getMeasurementPointLabelX(420)).toBe(420);
        expect(getMeasurementPointLabelX(778)).toBe(653);
    });

    it.each([
        ['wrong unit identity', () => ({...problemFor('weight', 'decimal'), unitId: 'gram'})],
        ['wrong fraction value count', () => {
            const problem = problemFor('length', 'fraction');
            return {...problem, tickValues: problem.tickValues.slice(0, -1)};
        }],
        ['wrong decimal value count', () => {
            const problem = problemFor('time', 'decimal');
            return {...problem, tickValues: problem.tickValues.slice(0, -1)};
        }],
        ['unequal interval', () => {
            const problem = problemFor('liquid-volume', 'fraction');
            return {
                ...problem,
                tickValues: problem.tickValues.map((value, index) => index === 2
                    ? {...value, numerator: value.numerator + 1}
                    : value)
            };
        }],
        ['unreduced fraction', () => {
            const problem = problemFor('money', 'fraction');
            return {
                ...problem,
                tickValues: problem.tickValues.map((value, index) => index === 2
                    ? {numerator: value.numerator * 2, denominator: value.denominator * 2}
                    : value)
            };
        }],
        ['wrong decimal denominator', () => {
            const problem = problemFor('money', 'decimal');
            return {
                ...problem,
                tickValues: problem.tickValues.map((value, index) => index === 2
                    ? {...value, denominator: 10}
                    : value)
            };
        }],
        ['negative value', () => {
            const problem = problemFor('length', 'fraction');
            return {...problem, tickValues: [{numerator: -1, denominator: 1}, ...problem.tickValues.slice(1)]};
        }],
        ['target on first reference tick', () => ({...problemFor('time', 'fraction'), targetIndex: 1})],
        ['target on endpoint', () => {
            const problem = problemFor('time', 'decimal');
            return {...problem, targetIndex: problem.tickValues.length - 1};
        }],
        ['missing target index', () => ({...problemFor('length', 'decimal'), targetIndex: undefined})],
        ['missing tick values', () => ({...problemFor('length', 'decimal'), tickValues: undefined})]
    ])('rejects %s', (_description, build) => {
        expect(isValidMeasurementNumberLineProblem(
            build() as MeasurementNumberLineProblem
        )).toBe(false);
    });
});
