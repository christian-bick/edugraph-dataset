import {describe, expect, it} from 'vitest';
import {
    ConstructFractionLinePlotProblem,
    FractionLinePlotArithmeticProblem,
    FractionLinePlotValue,
    LegacyMeasurementDataProblem,
    MeasurementObservation
} from '../../../../types/problems.ts';
import {
    isMeasurementLinePlotTaskConfigCompatible,
    isValidGrade4FractionLinePlotProblem
} from './helpers.ts';

const objects: MeasurementObservation['object'][] = ['pencil', 'crayon', 'ribbon', 'key', 'brush', 'block'];

const gcd = (left: number, right: number): number => right === 0
    ? Math.abs(left)
    : gcd(right, left % right);

const value = (eighths: number): FractionLinePlotValue => {
    const divisor = gcd(eighths, 8);
    const numerator = eighths / divisor;
    const denominator = (8 / divisor) as FractionLinePlotValue['denominator'];
    const whole = Math.floor(eighths / 8);
    const remainder = eighths % 8;
    const remainderDivisor = gcd(remainder, 8);
    const display = remainder === 0
        ? String(whole)
        : whole === 0
            ? `${numerator}/${denominator}`
            : `${whole} ${remainder / remainderDivisor}/${8 / remainderDivisor}`;
    const quantityDisplay = display.includes(' ')
        ? display.replace(' ', ' and ')
        : display;
    return {eighths, numerator, denominator, display, quantityText: `${quantityDisplay} ${eighths === 8 ? 'inch' : 'inches'}`};
};

const measurementEighths = [9, 10, 16, 16, 23, 24];
const axisTicks = Array.from({length: 17}, (_, index) => ({index, value: value(8 + index)}));
const common = {
    unit: 'in' as const,
    subdivisions: 8 as const,
    observations: objects.map((object, index) => ({object, length: measurementEighths[index]! / 8})),
    fractionObservations: objects.map((object, index) => ({object, value: value(measurementEighths[index]!)})),
    axisStart: value(8),
    axisEnd: value(24),
    interval: value(1),
    axisTicks,
    frequencies: axisTicks.map(({value: tickValue}) => ({
        value: tickValue,
        count: measurementEighths.filter(eighths => eighths === tickValue.eighths).length
    })),
    scaleStatement: 'Each tick mark represents 1/8 inch.'
};

const construct: ConstructFractionLinePlotProblem = {
    ...common,
    task: 'construct-fraction-line-plot',
    prompt: 'Construct a line plot for these six object lengths.',
    answerStatement: 'The completed line plot contains 6 X marks.',
    explanation: 'Place one X above the matching tick for each object length. A repeated measurement receives one X for each object.'
};

const arithmetic = (operation: 'addition' | 'subtraction'): FractionLinePlotArithmeticProblem => {
    const addition = operation === 'addition';
    const shortest = value(9);
    const longest = value(24);
    const answer = value(addition ? 33 : 15);
    return {
        ...common,
        task: 'fraction-line-plot-arithmetic',
        operation,
        shortest,
        longest,
        leftOperand: addition ? shortest : longest,
        rightOperand: addition ? longest : shortest,
        answer,
        prompt: addition
            ? 'What is the combined length of the shortest and longest measurements?'
            : 'How much longer is the longest measurement than the shortest measurement?',
        questionEquation: addition ? 'shortest + longest = ?' : 'longest − shortest = ?',
        solutionEquation: addition ? '1 1/8 + 3 = 4 1/8' : '3 − 1 1/8 = 1 7/8',
        answerStatement: `${addition ? 'The combined length' : 'The difference'} is ${answer.quantityText}.`,
        explanation: addition
            ? 'The shortest measurement is 1 and 1/8 inches, and the longest is 3 inches. Add them to get 4 and 1/8 inches.'
            : 'The longest measurement is 3 inches, and the shortest is 1 and 1/8 inches. Subtract to get 1 and 7/8 inches.'
    };
};

describe('Grade 4 fractional line-plot validation', () => {
    it('accepts max-capacity construction and both arithmetic operations', () => {
        expect(isValidGrade4FractionLinePlotProblem(construct)).toBe(true);
        expect(isValidGrade4FractionLinePlotProblem(arithmetic('addition'))).toBe(true);
        expect(isValidGrade4FractionLinePlotProblem(arithmetic('subtraction'))).toBe(true);
    });

    it('rejects incomplete ticks, bad frequency multisets, and incoherent observations', () => {
        expect(isValidGrade4FractionLinePlotProblem({...construct, axisTicks: axisTicks.slice(1)})).toBe(false);
        expect(isValidGrade4FractionLinePlotProblem({
            ...construct,
            frequencies: construct.frequencies.map((entry, index) => index === 1 ? {...entry, count: 0} : entry)
        })).toBe(false);
        expect(isValidGrade4FractionLinePlotProblem({
            ...construct,
            observations: construct.observations.map((entry, index) => index === 0 ? {...entry, length: 2} : entry)
        })).toBe(false);
    });

    it('rejects answer-bearing arithmetic inconsistencies', () => {
        const addition = arithmetic('addition');
        expect(isValidGrade4FractionLinePlotProblem({...addition, answer: value(32)})).toBe(false);
        expect(isValidGrade4FractionLinePlotProblem({...addition, questionEquation: '1 1/8 + 3 = ?'})).toBe(false);
        expect(isValidGrade4FractionLinePlotProblem({...addition, solutionEquation: '1 1/8 + 3 = 4'})).toBe(false);
    });
});

describe('legacy line-plot task compatibility', () => {
    const legacyObservations: LegacyMeasurementDataProblem['observations'] = objects.map((object, index) => ({
        object,
        length: index + 2
    }));

    it.each([
        {unit: 'cm' as const, subdivisions: 1 as const, observations: legacyObservations},
        {
            unit: 'in' as const,
            subdivisions: 4 as const,
            observations: legacyObservations.map(({object, length}) => ({object, length: length + 0.25}))
        }
    ])('accepts legacy $unit data in procedure mode without construction capability', data => {
        expect(isMeasurementLinePlotTaskConfigCompatible(data, {
            constructPlot: false,
            executeProcedure: true
        })).toBe(true);
    });
});
