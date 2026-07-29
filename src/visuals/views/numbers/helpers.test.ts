import {describe, expect, it} from 'vitest';
import {validatePictorialComparisonCounts} from './helpers.ts';

describe('numbers view helpers', () => {
    it('accepts counts at the pictorial comparison boundaries', () => {
        expect(() => validatePictorialComparisonCounts('test-view', 0, 10)).not.toThrow();
    });

    it.each([
        [-1, 5],
        [5, 11],
        [2.5, 5]
    ])('rejects counts outside the pictorial capacity: %s and %s', (num1, num2) => {
        expect(() => validatePictorialComparisonCounts('test-view', num1, num2))
            .toThrow(/must be an integer between 0 and 10/);
    });
});
