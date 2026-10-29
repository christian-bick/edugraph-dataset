import type {StandardDivisionProblem} from '../../../types/problems.ts';

/** Numerical zero in the required division work, excluding numeral digits and initialization. */
export const standardDivisionHasZero = (data: StandardDivisionProblem): boolean => [
    data.dividend, data.divisor, data.quotient, data.remainder,
    ...data.steps.flatMap(step => [step.partialDividend, step.product, step.remainder])
].some(value => value === 0);
