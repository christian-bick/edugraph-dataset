import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {MultiplicativeComparisonProblem} from '../../../types/problems.ts';
import {
    presentMultiplicativeComparison,
    selectMultiplicativeComparisonUnknown,
    validateMultiplicativeComparison
} from './multiplicative-comparison-presentation.ts';

const comparison: MultiplicativeComparisonProblem = {
    referenceQuantity: 4,
    scaleFactor: 3,
    comparedQuantity: 12,
    operation: 'multiplication'
};

describe('multiplicative comparison presentation', () => {
    it('validates the neutral multiplicative relation', () => {
        expect(() => validateMultiplicativeComparison('test-view', comparison)).not.toThrow();
        expect(() => validateMultiplicativeComparison('test-view', {
            ...comparison,
            comparedQuantity: 13
        })).toThrow(/do not form/);
    });

    it('derives each unknown-role projection from one relation', () => {
        expect(presentMultiplicativeComparison(comparison, 'compared')).toMatchObject({
            answer: 12,
            givenEquation: '4 × 3 = ?',
            solutionEquation: '4 × 3 = 12'
        });
        const division = {...comparison, operation: 'division'} as const;
        expect(presentMultiplicativeComparison(division, 'reference')).toMatchObject({
            answer: 4,
            givenEquation: '12 ÷ 3 = ?',
            solutionEquation: '12 ÷ 3 = 4'
        });
        expect(presentMultiplicativeComparison(division, 'scale-factor')).toMatchObject({
            answer: 3,
            givenEquation: '12 ÷ 4 = ?',
            solutionEquation: '12 ÷ 4 = 3'
        });
        expect(() => presentMultiplicativeComparison(division, 'compared'))
            .toThrow(/does not support/);
    });

    it('fixes multiplication to the compared quantity and seeds division variation', () => {
        expect(selectMultiplicativeComparisonUnknown('multiplication')).toBe('compared');

        const roles = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            roles.add(selectMultiplicativeComparisonUnknown('division'));
        }
        expect(roles).toEqual(new Set(['reference', 'scale-factor']));
    });
});
