import type {DecimalDivisionOperand, DecimalDivisionProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const PLACES = ['ones', 'tenths', 'hundredths', 'thousandths', 'ten-thousandths'] as const;

function scaledNumeral(value: number, scale: 100 | 10000): string {
    const width = scale === 100 ? 2 : 4;
    const whole = Math.floor(value / scale);
    const fraction = String(value % scale).padStart(width, '0').replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : String(whole);
}

function validOperand(operand: DecimalDivisionOperand): boolean {
    if (!operand || !Number.isInteger(operand.valueInHundredths) ||
        operand.valueInHundredths < 0 || operand.valueInHundredths > 999 ||
        !Array.isArray(operand.alignedDigits) || operand.alignedDigits.length !== 3 ||
        operand.alignedDigits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9)) return false;
    const [ones, tenths, hundredths] = operand.alignedDigits;
    return operand.valueInHundredths === ones * 100 + tenths * 10 + hundredths &&
        operand.canonicalNumeral === scaledNumeral(operand.valueInHundredths, 100);
}

function validQuotient(data: DecimalDivisionProblem): boolean {
    const quotient = data.quotient;
    if (!quotient || !Number.isInteger(quotient.valueInTenThousandths) ||
        quotient.valueInTenThousandths < 0 || quotient.valueInTenThousandths > 49999 ||
        ![0, 1, 2, 3, 4].includes(quotient.precision) ||
        !Array.isArray(quotient.alignedDigits) || quotient.alignedDigits.length !== 5 ||
        quotient.alignedDigits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9)) return false;
    const [ones, tenths, hundredths, thousandths, tenThousandths] = quotient.alignedDigits;
    const value = ones * 10000 + tenths * 1000 + hundredths * 100 + thousandths * 10 + tenThousandths;
    const fractionalDigits = String(value % 10000).padStart(4, '0').replace(/0+$/, '');
    return value === quotient.valueInTenThousandths &&
        quotient.canonicalNumeral === scaledNumeral(value, 10000) &&
        quotient.precision === fractionalDigits.length;
}

export function assertDecimalDivision(viewId: string, data: DecimalDivisionProblem): void {
    if (data?.kind !== 'decimal-division-model' || data.base !== 10 ||
        data.operandScale !== 100 || data.quotientScale !== 10000 ||
        !validOperand(data.dividend) || !validOperand(data.divisor) || !validQuotient(data) ||
        data.divisor.valueInHundredths < 1 || data.divisor.valueInHundredths > 16 ||
        data.dividend.valueInHundredths > 80) {
        throw new ViewValidationError(viewId, 'Expected bounded exact decimal division through hundredth-unit cells.');
    }
    const dividend = data.dividend.valueInHundredths;
    const divisor = data.divisor.valueInHundredths;
    const quotient = data.quotient.valueInTenThousandths;
    if (dividend * 10000 !== divisor * quotient) {
        throw new ViewValidationError(viewId, 'The decimal quotient must be exact through ten-thousandths.');
    }
    const group = data.grouping;
    const full = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    const expectedBars = full + (remainder > 0 ? 1 : 0);
    if (!group || group.unitValueInHundredths !== 1 || group.cellsPerGroup !== divisor ||
        group.fullGroupCount !== full || full > 4 || group.remainderCells !== remainder ||
        !Array.isArray(group.bars) || group.bars.length !== expectedBars) {
        throw new ViewValidationError(viewId, 'The grouping must partition the dividend into bounded divisor-sized bars.');
    }
    let filledTotal = 0;
    let contributionTotal = 0;
    for (let index = 0; index < group.bars.length; index++) {
        const bar = group.bars[index];
        const isFull = index < full;
        const filled = isFull ? divisor : remainder;
        const contribution = filled * 10000 / divisor;
        if (!bar || bar.index !== index || bar.kind !== (isFull ? 'full' : 'partial') ||
            bar.capacityCells !== divisor || bar.filledCells !== filled ||
            !Number.isInteger(contribution) || bar.quotientContributionInTenThousandths !== contribution) {
            throw new ViewValidationError(viewId, 'Each grouping bar must show its exact filled cells and quotient contribution.');
        }
        filledTotal += bar.filledCells;
        contributionTotal += bar.quotientContributionInTenThousandths;
    }
    if (filledTotal !== dividend || contributionTotal !== quotient) {
        throw new ViewValidationError(viewId, 'Grouping bars must reconstruct the dividend and quotient exactly.');
    }

    const trace = data.divisionTrace;
    if (!trace || trace.dividendUnitCount !== dividend || trace.divisorUnitCount !== divisor ||
        !Array.isArray(trace.steps) || trace.steps.length !== data.quotient.precision + 1) {
        throw new ViewValidationError(viewId, 'The written quotient trace must include every required place.');
    }
    let previousRemainder = 0;
    for (let index = 0; index < trace.steps.length; index++) {
        const step = trace.steps[index];
        const partial = index === 0 ? dividend : previousRemainder * 10;
        if (!step || step.place !== PLACES[index] || step.partialDividend !== partial ||
            step.quotientDigit !== data.quotient.alignedDigits[index] ||
            step.subtrahend !== divisor * step.quotientDigit ||
            step.remainder !== partial - step.subtrahend ||
            !Number.isInteger(step.remainder) || step.remainder < 0 || step.remainder >= divisor ||
            (index < trace.steps.length - 1 && step.remainder === 0)) {
            throw new ViewValidationError(viewId, 'The ordered place-value division trace is inconsistent.');
        }
        previousRemainder = step.remainder;
    }
    if (previousRemainder !== 0) {
        throw new ViewValidationError(viewId, 'An exact decimal quotient must finish with zero remainder.');
    }
    const inverse = data.inverse;
    const dividendInMillionths = dividend * 10000;
    if (!inverse || inverse.divisorTimesQuotientInMillionths !== divisor * quotient ||
        inverse.dividendInMillionths !== dividendInMillionths ||
        inverse.divisorTimesQuotientInMillionths !== inverse.dividendInMillionths) {
        throw new ViewValidationError(viewId, 'The inverse multiplication must reconstruct the dividend exactly.');
    }
}
