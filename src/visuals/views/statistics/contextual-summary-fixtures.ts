import {summaryScalar as q} from './summary-meaning-fixtures.ts';

/** Independent row-by-row oracle for2,2,3,3,3,4,4,15 about its mean9/2. */
export const contextualMadOracle = {
    mean: q(9, 2), absoluteSum: q(21), mad: q(21, 8),
    differences: [q(-5, 2), q(-5, 2), q(-3, 2), q(-3, 2), q(-3, 2), q(-1, 2), q(-1, 2), q(21, 2)],
    absolute: [q(5, 2), q(5, 2), q(3, 2), q(3, 2), q(3, 2), q(1, 2), q(1, 2), q(21, 2)]
} as const;

/** Signed Celsius oracle: -3/2,-1,-1/2,0,5/2; mean-1/10, absolute sum27/5. */
export const contextualCelsiusOracle = {
    mean: q(-1, 10), absoluteSum: q(27, 5), mad: q(27, 25),
    differences: [q(-7, 5), q(-9, 10), q(-2, 5), q(1, 10), q(13, 5)],
    absolute: [q(7, 5), q(9, 10), q(2, 5), q(1, 10), q(13, 5)]
} as const;
