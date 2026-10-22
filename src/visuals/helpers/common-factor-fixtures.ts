import type {CommonFactorMultipleProblem, FullCommonFactorDistributionProblem} from '../../types/problems.ts';

/** Literal arithmetic oracles, not generated through the producer under test. */
export const fullFactorOracle: FullCommonFactorDistributionProblem = {
    kind: 'full-common-factor-distribution', addends: [36, 8], sum: 44,
    commonDivisors: [1, 2, 4], gcd: 4, residualAddends: [9, 2], residualSum: 11,
    residualCommonDivisors: [1], distributedProducts: [36, 8]
};
export const fullFactorMaximumOracle: FullCommonFactorDistributionProblem = {
    kind: 'full-common-factor-distribution', addends: [100, 100], sum: 200,
    commonDivisors: [1, 2, 4, 5, 10, 20, 25, 50, 100], gcd: 100, residualAddends: [1, 1], residualSum: 2,
    residualCommonDivisors: [1], distributedProducts: [100, 100]
};
export const commonPairOracle: CommonFactorMultipleProblem = {
    kind: 'common-factor-multiple-relations', inputs: [8, 12],
    gcd: {kind: 'defined', value: 4, commonDivisors: [1, 2, 4], cofactors: [2, 3], cofactorCommonDivisors: [1]},
    lcm: {kind: 'positive', value: 24, commonMultipliers: [3, 2], commonProducts: [24, 24]}
};
export const commonPairLargeOracle: CommonFactorMultipleProblem = {
    kind: 'common-factor-multiple-relations', inputs: [99, 100],
    gcd: {kind: 'defined', value: 1, commonDivisors: [1], cofactors: [99, 100], cofactorCommonDivisors: [1]},
    lcm: {kind: 'positive', value: 9900, commonMultipliers: [100, 99], commonProducts: [9900, 9900]}
};
export const commonPairZeroOracle: CommonFactorMultipleProblem = {
    kind: 'common-factor-multiple-relations', inputs: [0, 0], gcd: {kind: 'undefined-zero-pair'},
    lcm: {kind: 'zero-extension', value: 0, zeroInputIndices: [0, 1], zeroProducts: [0, 0]}
};
export const commonPairOneZeroOracle: CommonFactorMultipleProblem = {
    kind: 'common-factor-multiple-relations', inputs: [0, 100],
    gcd: {kind: 'defined', value: 100, commonDivisors: [1, 2, 4, 5, 10, 20, 25, 50, 100], cofactors: [0, 1], cofactorCommonDivisors: [1]},
    lcm: {kind: 'zero-extension', value: 0, zeroInputIndices: [0], zeroProducts: [0, 0]}
};
