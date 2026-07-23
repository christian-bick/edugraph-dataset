import {describe, expect, it} from 'vitest';
import {getBlankPart} from './helpers.ts';

describe('operations-boxes helpers', () => {
    it('returns exact blank value if requestedBlank is specific', () => {
        expect(getBlankPart(1, 'num1')).toBe('num1');
        expect(getBlankPart(2, 'num2')).toBe('num2');
        expect(getBlankPart(3, 'solution')).toBe('solution');
        expect(getBlankPart(4, 'symbol')).toBe('symbol');
    });

    it('returns operator mapped to symbol', () => {
        expect(getBlankPart(5, 'operator')).toBe('symbol');
    });

    it('selects num1 or num2 deterministically for problem blank', () => {
        const choice1 = getBlankPart(1001, 'problem');
        const choice2 = getBlankPart(1001, 'problem');
        expect(choice1).toBe(choice2);
        expect(['num1', 'num2']).toContain(choice1);
    });

    it('selects num1, num2 or solution deterministically for problem-answer blank', () => {
        const choice1 = getBlankPart(1002, 'problem-answer');
        const choice2 = getBlankPart(1002, 'problem-answer');
        expect(choice1).toBe(choice2);
        expect(['num1', 'num2', 'solution']).toContain(choice1);
    });

    it('selects all parts deterministically for random blank', () => {
        const choice1 = getBlankPart(1003, 'random');
        const choice2 = getBlankPart(1003, 'random');
        expect(choice1).toBe(choice2);
        expect(['num1', 'num2', 'solution', 'symbol']).toContain(choice1);
    });
});
