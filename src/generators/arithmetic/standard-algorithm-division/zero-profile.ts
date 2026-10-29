import type {StandardDivisionProblem} from '../../../types/problems.ts';

/** Positional work includes each required quotient, product and remainder digit. */
export const standardDivisionHasZero = (data: StandardDivisionProblem): boolean => [
    data.dividend, data.divisor, data.quotient, data.remainder,
    ...data.steps.flatMap(step => [step.partialDividend, step.product, step.remainder])
].some(value => String(value).includes('0'));
