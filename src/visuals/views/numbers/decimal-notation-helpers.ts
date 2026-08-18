import {
    DecimalNotationProblem,
    DecimalNotationTask,
    DecimalNotationValue,
    DecimalScaleTick
} from '../../../types/problems.ts';
import {isValidTenthsHundredthsGrid} from '../../helpers/tenths-hundredths-grid.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const decimalString = (numerator: number, denominator: 10 | 100): string =>
    denominator === 10
        ? `0.${numerator}`
        : `0.${String(numerator).padStart(2, '0')}`;

const placeNames = (value: DecimalNotationValue): {
    placeName: 'tenths' | 'hundredths';
    countedPlaceName: 'tenth' | 'tenths' | 'hundredth' | 'hundredths';
} => {
    const placeName = value.denominator === 10 ? 'tenths' : 'hundredths';
    const countedPlaceName = value.numerator === 1
        ? value.denominator === 10 ? 'tenth' : 'hundredth'
        : placeName;
    return {placeName, countedPlaceName};
};

const validValue = (value: DecimalNotationValue): boolean => {
    if (!isRecord(value)
        || (value.denominator !== 10 && value.denominator !== 100)
        || !Number.isInteger(value.numerator)
        || value.numerator < 1
        || value.numerator >= value.denominator
        || (value.denominator === 100 && value.numerator % 10 === 0)) return false;
    const tenthsDigit = value.denominator === 10
        ? value.numerator
        : Math.floor(value.numerator / 10);
    const hundredthsDigit = value.denominator === 10 ? null : value.numerator % 10;
    return value.fractionNotation === `${value.numerator}/${value.denominator}`
        && value.decimalNotation === decimalString(value.numerator, value.denominator)
        && value.precision === (value.denominator === 10 ? 'tenths' : 'hundredths')
        && value.wholeDigit === 0
        && value.tenthsDigit === tenthsDigit
        && value.hundredthsDigit === hundredthsDigit
        && value.hundredthsNumerator === (value.denominator === 10
            ? value.numerator * 10
            : value.numerator);
};

const validTask = (
    task: DecimalNotationTask,
    value: DecimalNotationValue,
    unknown: 'decimal' | 'fraction'
): boolean => {
    if (!isRecord(task) || task.unknown !== unknown) return false;
    const {placeName, countedPlaceName} = placeNames(value);
    if (unknown === 'decimal') {
        return task.prompt === `Write ${value.fractionNotation} using decimal notation.`
            && task.questionEquation === `${value.fractionNotation} = ?`
            && task.solutionEquation === `${value.fractionNotation} = ${value.decimalNotation}`
            && task.answer === value.decimalNotation
            && task.answerStatement === `${value.fractionNotation} is ${value.decimalNotation} in decimal notation.`
            && task.explanation === `${value.fractionNotation} means ${value.numerator} ${countedPlaceName}, so its decimal notation is ${value.decimalNotation}.`;
    }
    return task.prompt === `Write ${value.decimalNotation} as a fraction with denominator ${value.denominator}.`
        && task.questionEquation === `${value.decimalNotation} = ?`
        && task.solutionEquation === `${value.decimalNotation} = ${value.fractionNotation}`
        && task.answer === value.fractionNotation
        && task.answerStatement === `${value.decimalNotation} is ${value.fractionNotation} in fraction notation.`
        && task.explanation === `${value.decimalNotation} has ${value.numerator} ${countedPlaceName}, so it is ${value.fractionNotation}.`
        && (placeName === 'tenths' || placeName === 'hundredths');
};

const tickLabel = (index: number, denominator: 10 | 100): string => {
    if (index === 0) return '0';
    if (index === denominator) return '1';
    if (denominator === 10) return `0.${index}`;
    return index % 10 === 0 ? `0.${index / 10}` : '';
};

const validTicks = (ticks: DecimalScaleTick[], denominator: 10 | 100): boolean =>
    Array.isArray(ticks)
    && ticks.length === denominator + 1
    && ticks.every((tick, index) => isRecord(tick)
        && tick.index === index
        && tick.xPercent === (denominator === 10 ? index * 10 : index)
        && tick.kind === (index === 0 || index === denominator
            ? 'endpoint'
            : denominator === 10 || index % 10 === 0 ? 'major' : 'minor')
        && tick.label === tickLabel(index, denominator));

export const isValidDecimalNotationProblem = (data: DecimalNotationProblem): boolean => {
    if (!isRecord(data)
        || data.task !== 'decimal-notation'
        || data.sharedWhole !== 1
        || data.relation !== 'equal'
        || !isRecord(data.value)
        || !isRecord(data.placeValue)
        || !Array.isArray(data.placeValue.columns)
        || !isRecord(data.models)
        || !isRecord(data.notationTasks)
        || !isRecord(data.numberLine)
        || !isRecord(data.numberLine.point)
        || !isRecord(data.measurement)
        || !isRecord(data.measurement.measuredEndpoint)) return false;

    const {value} = data;
    if (!validValue(value)) return false;
    const hundredthsDigit = value.hundredthsDigit ?? 0;
    const expectedColumns = [
        {place: 'ones', digit: 0, unitFraction: '1'},
        {place: 'tenths', digit: value.tenthsDigit, unitFraction: '1/10'},
        {place: 'hundredths', digit: hundredthsDigit, unitFraction: '1/100'}
    ];
    const expectedPlaceValueEquation = value.denominator === 10
        ? `${value.decimalNotation} = 0 × 1 + ${value.tenthsDigit} × 1/10`
        : `${value.decimalNotation} = 0 × 1 + ${value.tenthsDigit} × 1/10 + ${hundredthsDigit} × 1/100`;
    const columnsValid = data.placeValue.columns.length === 3
        && data.placeValue.columns.every((column, index) => {
            const expected = expectedColumns[index];
            return isRecord(column)
                && expected !== undefined
                && column.place === expected.place
                && column.digit === expected.digit
                && column.unitFraction === expected.unitFraction;
        });
    const fractionValue = {
        numerator: value.numerator,
        denominator: value.denominator,
        notation: value.fractionNotation
    };
    const hundredthsValue = {
        numerator: value.hundredthsNumerator,
        denominator: 100 as const,
        notation: `${value.hundredthsNumerator}/100`
    };
    if (data.equality !== `${value.fractionNotation} = ${value.decimalNotation}`
        || !columnsValid
        || data.placeValue.placeValueEquation !== expectedPlaceValueEquation
        || !isValidTenthsHundredthsGrid(data.models.fractionGrid, fractionValue)
        || !isValidTenthsHundredthsGrid(data.models.hundredthsGrid, hundredthsValue)
        || !validTask(data.notationTasks.fractionToDecimal, value, 'decimal')
        || !validTask(data.notationTasks.decimalToFraction, value, 'fraction')) return false;

    const {countedPlaceName} = placeNames(value);
    const expectedX = value.denominator === 10 ? value.numerator * 10 : value.numerator;
    const line = data.numberLine;
    if (line.prompt !== `Locate ${value.decimalNotation} on the number line from 0 to 1.`
        || line.start !== 0
        || line.end !== 1
        || line.subdivisionCount !== value.denominator
        || !validTicks(line.ticks, value.denominator)
        || line.point.tickIndex !== value.numerator
        || line.point.xPercent !== expectedX
        || line.point.label !== value.decimalNotation
        || line.answerStatement !== `${value.decimalNotation} is located at tick ${value.numerator} of ${value.denominator} equal parts between 0 and 1.`
        || line.explanation !== `The interval from 0 to 1 is divided into ${value.denominator} equal parts. Moving ${value.numerator} ${countedPlaceName} from 0 reaches ${value.decimalNotation}.`) return false;

    const measurement = data.measurement;
    const fractionalMeasure = `${value.fractionNotation} of a meter`;
    const decimalMeasure = `${value.decimalNotation} meters`;
    return measurement.prompt === 'Write the measured length using decimal notation.'
        && measurement.unit === 'meter'
        && measurement.unitSymbol === 'm'
        && measurement.start === 0
        && measurement.end === 1
        && measurement.subdivisionCount === value.denominator
        && validTicks(measurement.ticks, value.denominator)
        && measurement.measuredEndpoint.tickIndex === value.numerator
        && measurement.measuredEndpoint.xPercent === expectedX
        && measurement.fractionalMeasure === fractionalMeasure
        && measurement.decimalMeasure === decimalMeasure
        && measurement.questionEquation === `${fractionalMeasure} = ? meters`
        && measurement.solutionEquation === `${fractionalMeasure} = ${decimalMeasure}`
        && measurement.answer === decimalMeasure
        && measurement.answerStatement === `The measured length is ${decimalMeasure}.`
        && measurement.explanation === `${value.fractionNotation} of a meter is ${value.numerator} ${countedPlaceName} of one meter, which is ${decimalMeasure}.`;
};

export const pointLabelTransform = (xPercent: number): string =>
    xPercent <= 8 ? 'translateX(0)' : xPercent >= 92 ? 'translateX(-100%)' : 'translateX(-50%)';

export const validateDecimalNotationData = (
    viewId: string,
    data: DecimalNotationProblem
): void => {
    validateProblemData(viewId, data, [
        'task',
        'sharedWhole',
        'relation',
        'value',
        'equality',
        'placeValue',
        'models',
        'notationTasks',
        'numberLine',
        'measurement'
    ]);
    if (!isValidDecimalNotationProblem(data)) {
        throw new ViewValidationError(
            viewId,
            'Decimal notation data must contain one coherent fraction, decimal, place-value model, scale, and measurement.'
        );
    }
};
