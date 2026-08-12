import {describe, expect, it} from 'vitest';
import {CurrencyArithmeticProblem} from '../../../../types/problems.ts';
import {currencyStory, formatCurrency} from './helpers.ts';

const problem: CurrencyArithmeticProblem = {
    operation: 'addition',
    amounts: [
        {items: [{kind: 'coin', denominationCents: 25, count: 2}], totalCents: 50},
        {items: [{kind: 'coin', denominationCents: 25, count: 1}], totalCents: 25}
    ],
    answerCents: 75
};

describe('currency word-problem helpers', () => {
    it('uses cent notation below one dollar and dollar notation otherwise', () => {
        expect(formatCurrency(75)).toBe('75¢');
        expect(formatCurrency(125)).toBe('$1.25');
        expect(formatCurrency(200)).toBe('$2');
    });

    it('builds a story whose values match the operands', () => {
        expect(currencyStory(problem)).toContain('50¢');
        expect(currencyStory(problem)).toContain('25¢');
        expect(currencyStory({...problem, operation: 'subtraction'})).toContain('spends');
    });
});
