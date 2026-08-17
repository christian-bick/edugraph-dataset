import {
    FractionLinePlotArithmeticProblem,
    FractionLinePlotValue,
    Grade4FractionLinePlotProblem,
    MeasurementDataProblem
} from '../../../../types/problems.ts';
import type {MeasurementLinePlotViewConfig} from './spec.ts';

const OBJECTS = ['pencil', 'crayon', 'ribbon', 'key', 'brush', 'block'] as const;

const gcd = (left: number, right: number): number => {
    let a = Math.abs(left);
    let b = Math.abs(right);
    while (b !== 0) {
        const remainder = a % b;
        a = b;
        b = remainder;
    }
    return a;
};

const expectedValue = (eighths: number): FractionLinePlotValue => {
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
    const quantityDisplay = whole > 0 && remainder !== 0
        ? display.replace(' ', ' and ')
        : display;
    return {
        eighths,
        numerator,
        denominator,
        display,
        quantityText: `${quantityDisplay} ${eighths === 8 ? 'inch' : 'inches'}`
    };
};

const sameValue = (
    actual: FractionLinePlotValue | null | undefined,
    expected: FractionLinePlotValue
): boolean => actual != null
    && typeof actual === 'object'
    && actual.eighths === expected.eighths
    && actual.numerator === expected.numerator
    && actual.denominator === expected.denominator
    && actual.display === expected.display
    && actual.quantityText === expected.quantityText;

const isExactValue = (value: FractionLinePlotValue | null | undefined): value is FractionLinePlotValue => {
    if (value == null
        || typeof value !== 'object'
        || !Number.isSafeInteger(value.eighths)
        || value.eighths <= 0) return false;
    return sameValue(value, expectedValue(value.eighths));
};

export const isGrade4FractionLinePlotProblem = (
    data: MeasurementDataProblem
): data is Grade4FractionLinePlotProblem => 'task' in data
    && (data.task === 'construct-fraction-line-plot'
        || data.task === 'fraction-line-plot-arithmetic');

const hasValidCommonEvidence = (data: Grade4FractionLinePlotProblem): boolean => {
    if (data.unit !== 'in'
        || data.subdivisions !== 8
        || !Array.isArray(data.observations)
        || data.observations.length !== OBJECTS.length
        || !Array.isArray(data.fractionObservations)
        || data.fractionObservations.length !== OBJECTS.length
        || !isExactValue(data.axisStart)
        || !isExactValue(data.axisEnd)
        || !isExactValue(data.interval)) return false;

    const intervalEighths = 1;
    const tickCount = 17;
    if (data.axisStart.eighths % 8 !== 0
        || data.axisStart.eighths < 8
        || data.axisStart.eighths > 16
        || data.axisEnd.eighths !== data.axisStart.eighths + 16
        || !sameValue(data.interval, expectedValue(intervalEighths))
        || !Array.isArray(data.axisTicks)
        || data.axisTicks.length !== tickCount
        || !Array.isArray(data.frequencies)
        || data.frequencies.length !== tickCount) return false;

    for (let index = 0; index < tickCount; index++) {
        const expectedTickValue = expectedValue(data.axisStart.eighths + index * intervalEighths);
        const tick = data.axisTicks[index];
        const frequency = data.frequencies[index];
        if (tick == null
            || typeof tick !== 'object'
            || tick.index !== index
            || !sameValue(tick.value, expectedTickValue)
            || frequency == null
            || typeof frequency !== 'object'
            || !sameValue(frequency.value, expectedTickValue)
            || !Number.isSafeInteger(frequency.count)
            || frequency.count < 0) return false;
    }

    const observedEighths: number[] = [];
    for (let index = 0; index < OBJECTS.length; index++) {
        const observation = data.observations[index];
        const fractionObservation = data.fractionObservations[index];
        if (observation == null
            || fractionObservation == null
            || observation.object !== OBJECTS[index]
            || fractionObservation.object !== OBJECTS[index]
            || !Number.isFinite(observation.length)
            || !isExactValue(fractionObservation.value)
            || observation.length * 8 !== fractionObservation.value.eighths
            || fractionObservation.value.eighths <= data.axisStart.eighths
            || fractionObservation.value.eighths > data.axisEnd.eighths
            || (fractionObservation.value.eighths - data.axisStart.eighths) % intervalEighths !== 0) return false;
        observedEighths.push(fractionObservation.value.eighths);
    }

    if (data.frequencies.some(({value, count}) => count
        !== observedEighths.filter(eighths => eighths === value.eighths).length)
        || data.frequencies.reduce((sum, {count}) => sum + count, 0) !== OBJECTS.length) return false;

    return data.scaleStatement === `Each tick mark represents ${data.interval.display} inch.`;
};

const isValidArithmetic = (data: FractionLinePlotArithmeticProblem): boolean => {
    if ((data.operation !== 'addition' && data.operation !== 'subtraction')
        || !isExactValue(data.shortest)
        || !isExactValue(data.longest)
        || !isExactValue(data.leftOperand)
        || !isExactValue(data.rightOperand)
        || !isExactValue(data.answer)) return false;

    const expectedShortest = data.fractionObservations.reduce(
        (minimum, {value}) => value.eighths < minimum.eighths ? value : minimum,
        data.fractionObservations[0]!.value
    );
    const expectedLongest = data.fractionObservations.reduce(
        (maximum, {value}) => value.eighths > maximum.eighths ? value : maximum,
        data.fractionObservations[0]!.value
    );
    const isAddition = data.operation === 'addition';
    const expectedLeft = isAddition ? expectedShortest : expectedLongest;
    const expectedRight = isAddition ? expectedLongest : expectedShortest;
    const answerEighths = isAddition
        ? expectedLeft.eighths + expectedRight.eighths
        : expectedLeft.eighths - expectedRight.eighths;
    if (!sameValue(data.shortest, expectedShortest)
        || !sameValue(data.longest, expectedLongest)
        || !sameValue(data.leftOperand, expectedLeft)
        || !sameValue(data.rightOperand, expectedRight)
        || !sameValue(data.answer, expectedValue(answerEighths))) return false;

    return data.prompt === (isAddition
        ? 'What is the combined length of the shortest and longest measurements?'
        : 'How much longer is the longest measurement than the shortest measurement?')
        && data.questionEquation === (isAddition
            ? 'shortest + longest = ?'
            : 'longest − shortest = ?')
        && data.solutionEquation
            === `${data.leftOperand.display} ${isAddition ? '+' : '−'} ${data.rightOperand.display} = ${data.answer.display}`
        && data.answerStatement
            === `${isAddition ? 'The combined length' : 'The difference'} is ${data.answer.quantityText}.`
        && data.explanation === (isAddition
            ? `The shortest measurement is ${data.shortest.quantityText}, and the longest is ${data.longest.quantityText}. Add them to get ${data.answer.quantityText}.`
            : `The longest measurement is ${data.longest.quantityText}, and the shortest is ${data.shortest.quantityText}. Subtract to get ${data.answer.quantityText}.`);
};

export const isValidGrade4FractionLinePlotProblem = (
    data: Grade4FractionLinePlotProblem
): boolean => {
    if (!hasValidCommonEvidence(data)) return false;
    if (data.task === 'construct-fraction-line-plot') {
        return data.prompt === 'Construct a line plot for these six object lengths.'
            && data.answerStatement === 'The completed line plot contains 6 X marks.'
            && data.explanation
                === 'Place one X above the matching tick for each object length. A repeated measurement receives one X for each object.';
    }
    return isValidArithmetic(data);
};

export const isMeasurementLinePlotTaskConfigCompatible = (
    data: MeasurementDataProblem,
    config: Pick<MeasurementLinePlotViewConfig, 'constructPlot' | 'executeProcedure'>
): boolean => {
    if (!isGrade4FractionLinePlotProblem(data)) return true;
    return data.task === 'construct-fraction-line-plot'
        ? config.constructPlot === true
        : config.executeProcedure === true && config.constructPlot !== true;
};
