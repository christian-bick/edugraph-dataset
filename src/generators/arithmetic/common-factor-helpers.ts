import {GeneratorValidationError} from '../../lib/errors.ts';

/** Complete positive common divisors of whole inputs 0..100 that are not both zero. */
export function commonPositiveDivisors(first: number, second: number): number[] {
    if (![first, second].every(value => Number.isSafeInteger(value) && value >= 0 && value <= 100 && !Object.is(value, -0))
        || first === 0 && second === 0) {
        throw new GeneratorValidationError('common-factor-relations', 'Finite common divisors require whole inputs 0..100 that are not both zero.');
    }
    const maximum = first === 0 ? second : second === 0 ? first : Math.min(first, second);
    const divisors: number[] = [];
    for (let candidate = 1; candidate <= maximum; candidate++) {
        if (first % candidate === 0 && second % candidate === 0) divisors.push(candidate);
    }
    return divisors;
}
