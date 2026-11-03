import {GeneratorValidationError} from '../../lib/errors.ts';
import type {NumericalPowerExpressionSyntaxProblem} from '../../types/problems.ts';
import {isCoordinateNotation} from '../coordinate/coordinate-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';

const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const identifier = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0 && value.trim() === value;
const keys = (value: Record<string, unknown>, allowed: readonly string[]) =>
    Object.keys(value).every(key => allowed.includes(key));

/** Validates literal syntax without evaluating a power or requiring calculated metadata. */
export function isNumericalPowerExpressionSyntaxProblem(value: unknown): value is NumericalPowerExpressionSyntaxProblem {
    try {
        if (!record(value) || !keys(value, ['kind', 'expression']) || value.kind !== 'numerical-power-expression-syntax'
            || !record(value.expression)) return false;
        const expression = value.expression;
        if (!keys(expression, ['id', 'kind', 'base', 'exponent']) || expression.kind !== 'power' || !identifier(expression.id) || !record(expression.base)
            || typeof expression.exponent !== 'number' || !Number.isSafeInteger(expression.exponent)
            || expression.exponent < 0 || Object.is(expression.exponent, -0)) return false;
        const base = expression.base;
        return keys(base, ['id', 'kind', 'value', 'notation']) && base.kind === 'number' && identifier(base.id) && base.id !== expression.id
            && isCanonicalSignedRational(base.value) && isCoordinateNotation(base.value, base.notation)
            && !(base.value.numerator === 0 && expression.exponent === 0);
    } catch {
        return false;
    }
}

export function buildNumericalPowerExpressionSyntaxProblem(
    expression: NumericalPowerExpressionSyntaxProblem['expression']
): NumericalPowerExpressionSyntaxProblem {
    const data = {kind: 'numerical-power-expression-syntax', expression} as const;
    if (!isNumericalPowerExpressionSyntaxProblem(data)) {
        throw new GeneratorValidationError('numerical-power-expression-syntax', 'A literal power needs valid exact notation and a nonnegative exponent; 0^0 is undefined.');
    }
    return data;
}
