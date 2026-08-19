import {describe, expect, it} from 'vitest';
import {PositiveFactorEvidence} from '../../../../types/problems.ts';
import {hasCompletePositiveFactorEvidence} from '../factors-multiples-helpers.ts';

const completeEvidence: PositiveFactorEvidence = {
    number: 36,
    factors: [1, 2, 3, 4, 6, 9, 12, 18, 36],
    factorCount: 9,
    factorPairs: [
        {lowerFactor: 1, upperFactor: 36, equation: '1 × 36 = 36'},
        {lowerFactor: 2, upperFactor: 18, equation: '2 × 18 = 36'},
        {lowerFactor: 3, upperFactor: 12, equation: '3 × 12 = 36'},
        {lowerFactor: 4, upperFactor: 9, equation: '4 × 9 = 36'},
        {lowerFactor: 6, upperFactor: 6, equation: '6 × 6 = 36'}
    ]
};

describe('hasCompletePositiveFactorEvidence', () => {
    it('accepts an exhaustive ascending factor list with each unique pair once', () => {
        expect(hasCompletePositiveFactorEvidence(completeEvidence)).toBe(true);
    });

    it('rejects omitted factors and duplicated or malformed pairs', () => {
        expect(hasCompletePositiveFactorEvidence({...completeEvidence, factors: [1, 2, 18, 36]})).toBe(false);
        expect(hasCompletePositiveFactorEvidence({
            ...completeEvidence,
            factorPairs: [...completeEvidence.factorPairs, completeEvidence.factorPairs[0]]
        })).toBe(false);
        expect(hasCompletePositiveFactorEvidence({
            ...completeEvidence,
            factorPairs: completeEvidence.factorPairs.map((pair, index) => (
                index === 0 ? {...pair, equation: '36 = 1 × 36'} : pair
            ))
        })).toBe(false);
    });
});
