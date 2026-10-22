import {describe, expect, it} from 'vitest';
import {buildCommonFactorMultipleProblem} from '../../generators/arithmetic/common-factor-multiple-relations/generator.ts';
import {commonPairLargeOracle, commonPairOneZeroOracle, commonPairOracle, commonPairZeroOracle, fullFactorMaximumOracle, fullFactorOracle} from './common-factor-fixtures.ts';
import {isCommonFactorMultiple, isFullCommonFactorDistribution} from './common-factor-helpers.ts';

describe('common-factor mathematical witness validation', () => {
    it('accepts independent full-extraction, zero, coprime and larger LCM oracles', () => {
        expect(isFullCommonFactorDistribution(fullFactorOracle)).toBe(true);
        expect(isFullCommonFactorDistribution(fullFactorMaximumOracle)).toBe(true);
        for (const data of [commonPairOracle, commonPairLargeOracle, commonPairZeroOracle, commonPairOneZeroOracle]) expect(isCommonFactorMultiple(data)).toBe(true);
    });

    it('rejects partial extraction even when its distributive equality is true', () => {
        expect(isFullCommonFactorDistribution({...fullFactorOracle, gcd: 2, residualAddends: [18, 4], residualSum: 22,
            residualCommonDivisors: [1, 2]})).toBe(false);
        expect(isFullCommonFactorDistribution({...fullFactorOracle, commonDivisors: [1, 4]})).toBe(false);
        expect(isFullCommonFactorDistribution({...fullFactorOracle, distributedProducts: [8, 36]})).toBe(false);
        expect(isFullCommonFactorDistribution({...fullFactorOracle, residualAddends: [2, 9]})).toBe(false);
        expect(isFullCommonFactorDistribution({...fullFactorOracle, sum: 45})).toBe(false);
        expect(isFullCommonFactorDistribution({...fullFactorOracle, addends: [0, 8]})).toBe(false);
        expect(isFullCommonFactorDistribution({...fullFactorOracle, addends: [101, 8]})).toBe(false);
    });

    it('requires complete maximal-divisor and coprime-cofactor evidence, not just plausible products', () => {
        const data = commonPairOracle;
        expect(isCommonFactorMultiple({...data, gcd: {kind: 'defined', value: 2, commonDivisors: [1, 2], cofactors: [4, 6], cofactorCommonDivisors: [1, 2]}})).toBe(false);
        expect(isCommonFactorMultiple({...data, gcd: {kind: 'defined', value: 4, commonDivisors: [1, 4], cofactors: [2, 3], cofactorCommonDivisors: [1]}})).toBe(false);
        expect(isCommonFactorMultiple({...data, gcd: {kind: 'undefined-zero-pair'}})).toBe(false);
        expect(isCommonFactorMultiple({...data, lcm: {kind: 'positive', value: 48, commonMultipliers: [6, 4], commonProducts: [48, 48]}})).toBe(false);
        expect(isCommonFactorMultiple({...data, lcm: {kind: 'positive', value: 24, commonMultipliers: [2, 3], commonProducts: [24, 24]}})).toBe(false);
        expect(isCommonFactorMultiple({...data, lcm: {kind: 'positive', value: 24, commonMultipliers: [3, 2], commonProducts: [24, 25]}})).toBe(false);
    });

    it('distinguishes undefined all-zero GCD from the LCM zero extension without fake finite evidence', () => {
        const data = commonPairZeroOracle;
        expect(isCommonFactorMultiple({...data, gcd: {kind: 'defined', value: 0, commonDivisors: [], cofactors: [0, 0], cofactorCommonDivisors: [1]}})).toBe(false);
        expect(isCommonFactorMultiple({...data, gcd: {kind: 'undefined-zero-pair', value: 0}})).toBe(false);
        expect(isCommonFactorMultiple({...data, lcm: {kind: 'zero-extension', value: 0, zeroInputIndices: [0], zeroProducts: [0, 0]}})).toBe(false);
        expect(isCommonFactorMultiple({...data, lcm: {kind: 'zero-extension', value: 0, zeroInputIndices: [0, 1], zeroProducts: [0, 1]}})).toBe(false);
        expect(isCommonFactorMultiple({...commonPairOracle, lcm: data.lcm})).toBe(false);
        for (const invalid of [undefined, {}, {...data, inputs: [-0, 0]}, {...data, inputs: [0.5, 0]}, {...data, inputs: [101, 0]}, {...data, lcm: null}]) expect(isCommonFactorMultiple(invalid)).toBe(false);
    });

    it('accepts every producer pair in the complete shared 0..100 domain, including all zero orientations', () => {
        for (let first = 0; first <= 100; first++) {
            for (let second = 0; second <= 100; second++) expect(isCommonFactorMultiple(buildCommonFactorMultipleProblem(first, second))).toBe(true);
        }
    });
});
