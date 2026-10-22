import {GeneratorValidationError} from '../../lib/errors.ts';
import type {ExactDecimalValue} from '../../types/problems.ts';

const defaultGeneratorId = 'standard-decimal';

/** Every decimal power used in a canonical coefficient calculation stays exact. */
export function decimalPowerOfTen(scale: number, generatorId = defaultGeneratorId): number {
    if (!Number.isSafeInteger(scale) || scale < 0 || scale > 15) {
        throw new GeneratorValidationError(generatorId, 'Decimal scale must be an integer from 0 through 15.');
    }
    return 10 ** scale;
}

/** Format a supplied integer coefficient without floating-point decimal rounding. */
export function exactDecimal(coefficient: number, scale: number, generatorId = defaultGeneratorId): ExactDecimalValue {
    decimalPowerOfTen(scale, generatorId);
    if (!Number.isSafeInteger(coefficient) || coefficient < 0 || Object.is(coefficient, -0)) {
        throw new GeneratorValidationError(generatorId, 'Decimal coefficient must be a nonnegative safe integer.');
    }
    const digits = String(coefficient).padStart(scale + 1, '0');
    const numeral = scale === 0 ? digits : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
    return {coefficient, scale, numeral};
}

/** Parse the literal original form, retaining all supplied fractional zeros. */
export function parseExactDecimal(numeral: string, generatorId = defaultGeneratorId): ExactDecimalValue {
    if (typeof numeral !== 'string' || !/^(0|[1-9]\d*)(?:\.\d+)?$/.test(numeral)) {
        throw new GeneratorValidationError(generatorId, 'A decimal numeral must use canonical nonnegative positional notation.');
    }
    const [whole, fractional = ''] = numeral.split('.');
    return exactDecimal(Number(`${whole}${fractional}`), fractional.length, generatorId);
}

export function decimalDigits(coefficient: number, generatorId = defaultGeneratorId): number[] {
    return [...exactDecimal(coefficient, 0, generatorId).numeral].map(Number);
}

/** Append exact zeros to align a decimal to a scale at least as precise as its own. */
export function alignedDecimalCoefficient(value: ExactDecimalValue, scale: number, generatorId = defaultGeneratorId): number {
    if (value === null || typeof value !== 'object'
        || exactDecimal(value.coefficient, value.scale, generatorId).numeral !== value.numeral) {
        throw new GeneratorValidationError(generatorId, 'Decimal value and supplied numeral disagree.');
    }
    decimalPowerOfTen(scale, generatorId);
    const factor = decimalPowerOfTen(scale - value.scale, generatorId);
    const aligned = Number(BigInt(value.coefficient) * BigInt(factor));
    if (!Number.isSafeInteger(aligned)) {
        throw new GeneratorValidationError(generatorId, 'Aligned decimal coefficient exceeds safe integer arithmetic.');
    }
    return aligned;
}

/** Inclusive ontology magnitude bounds; unspecified magnitude has a finite local corpus. */
export function validateMagnitudeRange(range: unknown, generatorId: string): number {
    if (range === null || typeof range !== 'object' || !('min' in range) || !('max' in range)
        || range.min !== 0 || ![100000, 1000000, Number.MAX_SAFE_INTEGER].includes(range.max as number)) {
        throw new GeneratorValidationError(generatorId, 'Range needs minimum 0 and maximum 100000, 1000000, or the unbounded resolver sentinel.');
    }
    return range.max === Number.MAX_SAFE_INTEGER ? 999999 : range.max as number;
}
