import {describe, expect, it} from 'vitest';
import {getPatternTaskIdentity, hasConsistentRuleTerms} from './helpers.ts';

describe('getPatternTaskIdentity', () => {
    it('names classification tasks as classification while keeping generation distinct', () => {
        expect(getPatternTaskIdentity(undefined)).toEqual({
            eyebrow: 'Classify the table pattern',
            instruction: 'Choose the pattern-rule category that classifies the highlighted row.'
        });
        expect(getPatternTaskIdentity('identify-feature')).toEqual({
            eyebrow: 'Classify the number pattern',
            instruction: 'Choose the pattern-feature category supported by the generated terms.'
        });
        expect(getPatternTaskIdentity('generate').eyebrow).toBe('Number pattern');
    });
});

describe('hasConsistentRuleTerms', () => {
    it('accepts supplied addition and multiplication recurrences', () => {
        expect(hasConsistentRuleTerms(3, 'add', 4, [3, 7, 11, 15, 19])).toBe(true);
        expect(hasConsistentRuleTerms(2, 'multiply', 3, [2, 6, 18, 54])).toBe(true);
        expect(hasConsistentRuleTerms(0, 'multiply-position', 3, [0, 3, 6, 9, 12])).toBe(true);
    });

    it('rejects missing, reordered, or inconsistent terms', () => {
        expect(hasConsistentRuleTerms(3, 'add', 4, [3, 7, 15, 11])).toBe(false);
        expect(hasConsistentRuleTerms(2, 'multiply', 3, [2, 6, 17, 51])).toBe(false);
        expect(hasConsistentRuleTerms(2, 'multiply', 3, [2, 6, 18])).toBe(false);
        expect(hasConsistentRuleTerms(0, 'multiply-position', 3, [0, 3, 9, 12])).toBe(false);
        expect(hasConsistentRuleTerms(2, 'multiply-position', 3, [2, 3, 6, 9])).toBe(false);
    });
});
