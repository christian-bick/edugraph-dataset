import type {
    DecimalAddSubtractColumnStep,
    DecimalAddSubtractModelStep,
    DecimalAddSubtractNumber,
    DecimalAddSubtractPlace,
    DecimalAddSubtractProblem,
    DecimalAddSubtractUnitCounts
} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const PLACES: readonly DecimalAddSubtractPlace[] = ['hundredths', 'tenths', 'ones'];
const COUNT_PLACES = ['ones', 'tenths', 'hundredths'] as const;

export function exactDecimalNumeral(valueInHundredths: number): string {
    const ones = Math.floor(valueInHundredths / 100);
    const fraction = valueInHundredths % 100;
    if (fraction === 0) return String(ones);
    return fraction % 10 === 0
        ? `${ones}.${Math.floor(fraction / 10)}`
        : `${ones}.${String(fraction).padStart(2, '0')}`;
}

function validNumber(value: DecimalAddSubtractNumber): boolean {
    if (!value || !Number.isInteger(value.valueInHundredths) ||
        value.valueInHundredths < 0 || value.valueInHundredths > 999 ||
        !Array.isArray(value.alignedDigits) || value.alignedDigits.length !== 3 ||
        value.alignedDigits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9)) return false;
    const [ones, tenths, hundredths] = value.alignedDigits;
    return value.valueInHundredths === ones * 100 + tenths * 10 + hundredths &&
        value.canonicalNumeral === exactDecimalNumeral(value.valueInHundredths);
}

export function numberUnitCounts(value: DecimalAddSubtractNumber): DecimalAddSubtractUnitCounts {
    const [ones, tenths, hundredths] = value.alignedDigits;
    return {ones, tenths, hundredths};
}

function validCounts(counts: DecimalAddSubtractUnitCounts, max: number): boolean {
    return Boolean(counts) && COUNT_PLACES.every(place =>
        Number.isInteger(counts[place]) && counts[place] >= 0 && counts[place] <= max
    );
}

function sameCounts(a: DecimalAddSubtractUnitCounts, b: DecimalAddSubtractUnitCounts): boolean {
    return COUNT_PLACES.every(place => a[place] === b[place]);
}

function validColumn(
    step: DecimalAddSubtractColumnStep,
    place: DecimalAddSubtractPlace,
    firstDigit: number,
    secondDigit: number,
    resultDigit: number,
    regroupIn: 0 | 1,
    operation: DecimalAddSubtractProblem['operation']
): boolean {
    if (!step || step.place !== place || step.firstDigit !== firstDigit ||
        step.secondDigit !== secondDigit || step.resultDigit !== resultDigit ||
        step.regroupIn !== regroupIn || ![0, 1].includes(step.regroupOut)) return false;
    if (operation === 'addition') {
        const working = firstDigit + secondDigit + regroupIn;
        return step.workingUnits === working && step.resultDigit === working % 10 &&
            step.regroupOut === (working >= 10 ? 1 : 0);
    }
    const working = firstDigit - regroupIn + 10 * step.regroupOut;
    return step.workingUnits === working && working >= secondDigit &&
        step.resultDigit === working - secondDigit &&
        step.regroupOut === (firstDigit - regroupIn < secondDigit ? 1 : 0);
}

function validTransition(
    step: DecimalAddSubtractModelStep,
    second: DecimalAddSubtractUnitCounts,
    operation: DecimalAddSubtractProblem['operation']
): boolean {
    const {before, after} = step;
    if (!validCounts(before, 19) || !validCounts(after, 19)) return false;
    if (step.kind === 'join-second') {
        return operation === 'addition' && COUNT_PLACES.every(place => after[place] === before[place] + second[place]);
    }
    if (step.kind === 'remove-second') {
        return operation === 'subtraction' && COUNT_PLACES.every(place => after[place] === before[place] - second[place]);
    }
    if (step.kind !== 'compose-ten' && step.kind !== 'decompose-one') return false;
    if (step.lowerPlace !== 'hundredths' && step.lowerPlace !== 'tenths') return false;
    const lower = step.lowerPlace;
    const higher = lower === 'hundredths' ? 'tenths' : 'ones';
    const other = lower === 'hundredths' ? 'ones' : 'hundredths';
    if (step.kind === 'compose-ten') {
        return operation === 'addition' && before[lower] >= 10 &&
            after[lower] === before[lower] - 10 && after[higher] === before[higher] + 1 &&
            after[other] === before[other];
    }
    return operation === 'subtraction' && before[higher] >= 1 &&
        after[lower] === before[lower] + 10 && after[higher] === before[higher] - 1 &&
        after[other] === before[other];
}

export function assertDecimalAddSubtract(viewId: string, data: DecimalAddSubtractProblem): void {
    if (data?.kind !== 'decimal-add-subtract' || data.base !== 10 || data.scale !== 100 ||
        !['addition', 'subtraction'].includes(data.operation) ||
        !validNumber(data.first) || !validNumber(data.second) || !validNumber(data.result)) {
        throw new ViewValidationError(viewId, 'Expected exact base-ten decimals through hundredths.');
    }
    const arithmeticResult = data.operation === 'addition'
        ? data.first.valueInHundredths + data.second.valueInHundredths
        : data.first.valueInHundredths - data.second.valueInHundredths;
    if (arithmeticResult !== data.result.valueInHundredths ||
        !Array.isArray(data.columns) || data.columns.length !== 3) {
        throw new ViewValidationError(viewId, 'The operation, result, and three written columns must agree.');
    }
    let incoming: 0 | 1 = 0;
    for (let index = 0; index < 3; index++) {
        const digitIndex = 2 - index;
        const column = data.columns[index];
        if (!validColumn(column, PLACES[index], data.first.alignedDigits[digitIndex],
            data.second.alignedDigits[digitIndex], data.result.alignedDigits[digitIndex],
            incoming, data.operation)) {
            throw new ViewValidationError(viewId, 'The written place-value steps are inconsistent.');
        }
        incoming = column.regroupOut;
    }
    if (incoming !== 0) throw new ViewValidationError(viewId, 'The final written column cannot regroup beyond ones.');

    const first = numberUnitCounts(data.first);
    const second = numberUnitCounts(data.second);
    const result = numberUnitCounts(data.result);
    const model = data.model;
    if (!model || !validCounts(model.initial, 9) || !sameCounts(model.initial, first) ||
        !validCounts(model.final, 9) || !sameCounts(model.final, result) ||
        !Array.isArray(model.steps) || model.steps.length < 1 || model.steps.length > 3) {
        throw new ViewValidationError(viewId, 'The drawable model must start and end at the exact operands and result.');
    }
    const steps = model.steps;
    if (!steps[0] || !steps[steps.length - 1] ||
        (data.operation === 'addition' && steps[0].kind !== 'join-second') ||
        (data.operation === 'subtraction' && steps[steps.length - 1].kind !== 'remove-second')) {
        throw new ViewValidationError(viewId, 'The model join or removal is out of order.');
    }
    let current = model.initial;
    const exchanges: string[] = [];
    for (let index = 0; index < steps.length; index++) {
        const step = steps[index];
        if (!step || !sameCounts(step.before, current) || !validTransition(step, second, data.operation)) {
            throw new ViewValidationError(viewId, 'The model has an invalid or disconnected unit exchange.');
        }
        if (step.kind === 'join-second' && index !== 0 ||
            step.kind === 'remove-second' && index !== steps.length - 1 ||
            step.kind === 'compose-ten' && data.operation !== 'addition' ||
            step.kind === 'decompose-one' && data.operation !== 'subtraction') {
            throw new ViewValidationError(viewId, 'The model steps have an invalid order.');
        }
        if (step.kind === 'compose-ten' || step.kind === 'decompose-one') {
            if (exchanges.includes(step.lowerPlace)) {
                throw new ViewValidationError(viewId, 'The model repeats an exchange at one place.');
            }
            exchanges.push(step.lowerPlace);
        }
        current = step.after;
    }
    if (!sameCounts(current, model.final)) {
        throw new ViewValidationError(viewId, 'The model must reach the exact normalized result.');
    }
}

export function operationSymbol(operation: DecimalAddSubtractProblem['operation']): '+' | '−' {
    return operation === 'addition' ? '+' : '−';
}
