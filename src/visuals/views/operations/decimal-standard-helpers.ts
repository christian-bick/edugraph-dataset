import type {
    DecimalStandardAddSubtractProblem, DecimalStandardDivisionProblem,
    DecimalStandardMultiplicationProblem, ExactDecimalValue
} from '../../../types/problems.ts';

const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const digit = (value: unknown): value is number => whole(value) && value <= 9;
const bit = (value: unknown): value is 0 | 1 => value === 0 || value === 1;
const power = (exponent: number): bigint => 10n ** BigInt(exponent);
const digits = (value: number): number[] => [...String(value)].map(Number);
const equalDigits = (actual: unknown, expected: readonly number[]): actual is number[] =>
    Array.isArray(actual) && actual.length === expected.length
    && actual.every((value: unknown, index: number) => digit(value) && value === expected[index]);
const digitAt = (value: number, index: number): number => {
    const numeral = String(value);
    return index < numeral.length ? Number(numeral[numeral.length - 1 - index]) : 0;
};

/** Checks a supplied exact spelling directly, retaining precision and avoiding float conversion. */
export function isExactDecimalValue(value: unknown): value is ExactDecimalValue {
    if (!record(value) || !whole(value.coefficient) || Object.is(value.coefficient, -0)
        || !whole(value.scale) || !Number.isSafeInteger(10 ** value.scale) || typeof value.numeral !== 'string'
        || !/^(0|[1-9]\d*)(?:\.\d+)?$/.test(value.numeral)) return false;
    const point = value.numeral.indexOf('.');
    const scale = point === -1 ? 0 : value.numeral.length - point - 1;
    const coefficient = value.numeral.replace('.', '').replace(/^0+(?=\d)/, '');
    return scale === value.scale && coefficient === String(value.coefficient);
}

export function isValidDecimalStandardAddSubtract(data: unknown): data is DecimalStandardAddSubtractProblem {
    if (!record(data) || data.kind !== 'decimal-standard-add-subtract' || data.base !== 10
        || (data.operation !== 'addition' && data.operation !== 'subtraction')
        || !isExactDecimalValue(data.top) || !isExactDecimalValue(data.bottom) || !isExactDecimalValue(data.result)
        || !record(data.alignment) || !Array.isArray(data.columns)) return false;
    const {top, bottom, result, alignment} = data;
    const scale = Math.max(top.scale, bottom.scale);
    if (alignment.scale !== scale || result.scale !== scale
        || !whole(alignment.topCoefficient) || !whole(alignment.bottomCoefficient)
        || !isExactDecimalValue({coefficient: alignment.topCoefficient, scale, numeral: alignment.topNumeral})
        || !isExactDecimalValue({coefficient: alignment.bottomCoefficient, scale, numeral: alignment.bottomNumeral})
        || BigInt(alignment.topCoefficient) !== BigInt(top.coefficient) * power(scale - top.scale)
        || BigInt(alignment.bottomCoefficient) !== BigInt(bottom.coefficient) * power(scale - bottom.scale)) return false;
    const expected = data.operation === 'addition'
        ? BigInt(alignment.topCoefficient) + BigInt(alignment.bottomCoefficient)
        : BigInt(alignment.topCoefficient) - BigInt(alignment.bottomCoefficient);
    if (expected !== BigInt(result.coefficient)) return false;
    const count = Math.max(scale + 1, String(alignment.topCoefficient).length,
        String(alignment.bottomCoefficient).length, String(result.coefficient).length);
    if (data.columns.length !== count) return false;
    let regroup = 0;
    for (let index = 0; index < count; index++) {
        const column: unknown = data.columns[index];
        const topDigit = digitAt(alignment.topCoefficient, index);
        const bottomDigit = digitAt(alignment.bottomCoefficient, index);
        if (!record(column) || column.placeExponent !== index - scale || column.topDigit !== topDigit
            || column.bottomDigit !== bottomDigit || !bit(column.regroupIn) || !bit(column.regroupOut)
            || column.regroupIn !== regroup || !whole(column.workingValue) || !digit(column.resultDigit)) return false;
        const out = data.operation === 'addition' ? Math.floor((topDigit + bottomDigit + regroup) / 10)
            : topDigit - regroup < bottomDigit ? 1 : 0;
        const working = data.operation === 'addition' ? topDigit + bottomDigit + regroup : topDigit - regroup + 10 * out;
        const resultDigit = data.operation === 'addition' ? working % 10 : working - bottomDigit;
        if (column.regroupOut !== out || column.workingValue !== working || column.resultDigit !== resultDigit
            || column.resultDigit !== digitAt(result.coefficient, index)) return false;
        regroup = out;
    }
    return regroup === 0;
}

export function isValidDecimalStandardMultiplication(data: unknown): data is DecimalStandardMultiplicationProblem {
    if (!record(data) || data.kind !== 'decimal-standard-multiplication' || data.base !== 10
        || !isExactDecimalValue(data.multiplicand) || !isExactDecimalValue(data.multiplier) || !isExactDecimalValue(data.product)
        || !whole(data.unscaledProduct) || !record(data.decimalPlacement)
        || !Array.isArray(data.partialRows) || !Array.isArray(data.sumColumns)) return false;
    const {multiplicand, multiplier, product, decimalPlacement} = data;
    const topDigits = digits(multiplicand.coefficient);
    const bottomDigits = digits(multiplier.coefficient);
    if (!equalDigits(data.multiplicandDigits, topDigits) || !equalDigits(data.multiplierDigits, bottomDigits)
        || BigInt(data.unscaledProduct) !== BigInt(multiplicand.coefficient) * BigInt(multiplier.coefficient)
        || product.coefficient !== data.unscaledProduct || product.scale !== multiplicand.scale + multiplier.scale
        || data.partialRows.length !== bottomDigits.length
        || data.sumColumns.length !== String(data.unscaledProduct).length
        || decimalPlacement.totalScale !== product.scale
        || !equalDigits(decimalPlacement.coefficientDigits, digits(data.unscaledProduct))
        || !equalDigits(decimalPlacement.paddedDigits, [...product.numeral.replace('.', '')].map(Number))
        || decimalPlacement.decimalIndex !== product.numeral.length - (product.scale > 0 ? product.scale + 1 : 0)) return false;
    let total = 0n;
    for (let index = 0; index < bottomDigits.length; index++) {
        const row: unknown = data.partialRows[index];
        const multiplierDigit = bottomDigits[bottomDigits.length - 1 - index]!;
        if (!record(row) || row.shiftPlaces !== index || row.multiplierDigit !== multiplierDigit
            || !whole(row.leadingCarry) || !whole(row.unshiftedProduct) || !whole(row.alignedProduct)
            || !Array.isArray(row.columns) || row.columns.length !== topDigits.length) return false;
        let carry = 0;
        for (let place = 0; place < topDigits.length; place++) {
            const column: unknown = row.columns[place];
            const multiplicandDigit = topDigits[topDigits.length - 1 - place]!;
            const working = multiplicandDigit * multiplierDigit + carry;
            if (!record(column) || column.placeIndex !== place || column.multiplicandDigit !== multiplicandDigit
                || column.carryIn !== carry || column.workingValue !== working || column.resultDigit !== working % 10
                || column.carryOut !== Math.floor(working / 10)) return false;
            carry = Math.floor(working / 10);
        }
        if (row.leadingCarry !== carry || BigInt(row.unshiftedProduct) !== BigInt(multiplicand.coefficient) * BigInt(multiplierDigit)
            || BigInt(row.alignedProduct) !== BigInt(row.unshiftedProduct) * power(index)) return false;
        total += BigInt(row.alignedProduct);
    }
    if (total !== BigInt(data.unscaledProduct)) return false;
    let carry = 0;
    for (let place = 0; place < data.sumColumns.length; place++) {
        const column: unknown = data.sumColumns[place];
        const addends = data.partialRows.map(row => digitAt(row.alignedProduct, place));
        const working = addends.reduce((sum, value) => sum + value, carry);
        if (!record(column) || column.placeIndex !== place || !equalDigits(column.addendDigits, addends)
            || column.carryIn !== carry || column.workingValue !== working
            || column.resultDigit !== working % 10 || column.resultDigit !== digitAt(data.unscaledProduct, place)
            || column.carryOut !== Math.floor(working / 10)) return false;
        carry = Math.floor(working / 10);
    }
    return carry === 0;
}

export function isValidDecimalStandardDivision(data: unknown): data is DecimalStandardDivisionProblem {
    if (!record(data) || data.kind !== 'decimal-standard-division' || data.base !== 10
        || !isExactDecimalValue(data.dividend) || !isExactDecimalValue(data.divisor) || data.divisor.coefficient === 0
        || !isExactDecimalValue(data.quotient) || !record(data.normalization)
        || !isExactDecimalValue(data.normalization.dividend) || !whole(data.normalization.divisor)
        || !whole(data.normalization.powerOfTen) || data.normalization.powerOfTen === 0
        || !Array.isArray(data.steps) || data.steps.length === 0 || !whole(data.quotientStartColumn)) return false;
    const {dividend, divisor, quotient, normalization} = data;
    const normalizedDividend = normalization.dividend;
    const normalizedDivisor = normalization.divisor;
    if (!isExactDecimalValue(normalizedDividend)) return false;
    if (normalization.shiftPlaces !== divisor.scale || normalization.powerOfTen !== 10 ** divisor.scale
        || normalizedDivisor !== divisor.coefficient || normalizedDividend.scale !== Math.max(dividend.scale - divisor.scale, 0)
        || BigInt(normalizedDividend.coefficient) !== BigInt(dividend.coefficient) * power(Math.max(divisor.scale - dividend.scale, 0))
        || BigInt(dividend.coefficient) * power(divisor.scale + quotient.scale)
            !== BigInt(divisor.coefficient) * BigInt(quotient.coefficient) * power(dividend.scale)) return false;
    const sourceDigits = [...normalizedDividend.numeral.replace('.', '')].map(Number);
    const decimalIndex = normalizedDividend.numeral.indexOf('.') === -1 ? normalizedDividend.numeral.length : normalizedDividend.numeral.indexOf('.');
    const quotientDigits = [...quotient.numeral.replace('.', '')].map(Number);
    if (!equalDigits(data.sourceDigits, sourceDigits) || data.decimalIndex !== decimalIndex
        || !equalDigits(data.quotientDigits, quotientDigits) || data.steps.length !== quotientDigits.length) return false;
    let first = sourceDigits.slice(0, decimalIndex).findIndex((_, column) =>
        Number(sourceDigits.slice(0, column + 1).join('')) >= normalizedDivisor);
    if (first === -1) first = decimalIndex - 1;
    if (data.quotientStartColumn !== first) return false;
    let remainder = 0;
    for (let index = 0; index < data.steps.length; index++) {
        const step: unknown = data.steps[index];
        const column = first + index;
        const original = column < sourceDigits.length;
        const brought = index === 0 ? sourceDigits.slice(0, column + 1) : [original ? sourceDigits[column]! : 0];
        if (!record(step) || step.endColumnIndex !== column || step.quotientPlaceExponent !== decimalIndex - 1 - column
            || step.source !== (original ? 'original' : 'extension-zero') || !equalDigits(step.broughtDownDigits, brought)
            || step.previousRemainder !== remainder || (!original && remainder === 0)
            || !whole(step.partialDividend) || !digit(step.quotientDigit) || step.quotientDigit !== quotientDigits[index]
            || !whole(step.product) || !whole(step.remainder) || step.remainder >= normalizedDivisor
            || BigInt(step.partialDividend) !== BigInt(remainder) * power(brought.length) + BigInt(brought.join(''))
            || BigInt(step.product) !== BigInt(normalizedDivisor) * BigInt(step.quotientDigit)
            || BigInt(step.partialDividend) - BigInt(step.product) !== BigInt(step.remainder)) return false;
        remainder = step.remainder;
    }
    const lastColumn = first + data.steps.length - 1;
    return remainder === 0 && lastColumn >= sourceDigits.length - 1
        && quotient.scale === Math.max(lastColumn - decimalIndex + 1, 0);
}

/** Positional formatting only: align a supplied integer without calculating another value. */
export function alignedIntegerDigits(value: number, endColumn: number, width: number): readonly (number | null)[] {
    const written = digits(value);
    const start = endColumn + 1 - written.length;
    return Array.from({length: width}, (_, column) => column >= start && column <= endColumn ? written[column - start]! : null);
}

export function decimalDigitAt(value: ExactDecimalValue, exponent: number): number | null {
    const point = value.numeral.indexOf('.');
    const integerWidth = point === -1 ? value.numeral.length : point;
    if (exponent >= integerWidth || exponent < -value.scale) return null;
    const written = value.numeral.replace('.', '');
    return Number(written[integerWidth - 1 - exponent]);
}

export function decimalPartialDigits(data: DecimalStandardMultiplicationProblem, rowIndex: number, width: number): readonly (number | null)[] {
    const row = data.partialRows[rowIndex]!;
    const written = `${row.unshiftedProduct}${'0'.repeat(row.shiftPlaces)}`;
    return Array.from({length: width}, (_, column) => column >= width - written.length ? Number(written[column - width + written.length]) : null);
}
