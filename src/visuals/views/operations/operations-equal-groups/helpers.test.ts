import {describe, expect, it} from 'vitest';
import {equalGroupTitle} from './helpers.ts';

describe('equalGroupTitle', () => {
    it('withholds the requested group count in quotative question mode', () => {
        expect(equalGroupTitle('quotative-division', 2, false)).toBe('Group');
    });

    it('may number groups when the count is given or the solution is visible', () => {
        expect(equalGroupTitle('multiplication', 2, false)).toBe('Group 3');
        expect(equalGroupTitle('partitive-division', 2, false)).toBe('Group 3');
        expect(equalGroupTitle('quotative-division', 2, true)).toBe('Group 3');
    });
});
