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

    it.each([
        [1, false, '1¢'],
        [99, false, '99¢'],
        [100, false, '$1'],
        [101, false, '$1.01'],
        [1, true, '$0.01'],
        [99, true, '$0.99'],
        [100, true, '$1'],
        [101, true, '$1.01'],
        [200, true, '$2']
    ] as const)('preserves %i cents in Arabic decimal notation (force dollars: %s)', (cents, forceDollars, display) => {
        const formatted = formatCurrency(cents, forceDollars);
        expect(formatted).toBe(display);
        const recoveredCents = formatted.endsWith('¢')
            ? Number(formatted.slice(0, -1)) : Math.round(Number(formatted.slice(1)) * 100);
        expect(recoveredCents).toBe(cents);
        expect(recoveredCents).toBeGreaterThan(0);
    });

    it('builds a story whose values match the operands', () => {
        expect(currencyStory(problem)).toContain('50¢');
        expect(currencyStory(problem)).toContain('25¢');
        expect(currencyStory({...problem, operation: 'subtraction'})).toContain('spends');
    });

    it('uses the same dollar convention for both story operands when a banknote is present', () => {
        const mixed: CurrencyArithmeticProblem = {...problem,
            amounts: [{items: [{kind: 'banknote', denominationCents: 100, count: 1}], totalCents: 100},
                {items: [{kind: 'coin', denominationCents: 25, count: 1}], totalCents: 25}],
            answerCents: 125};
        expect(currencyStory(mixed)).toContain('$1');
        expect(currencyStory(mixed)).toContain('$0.25');
        expect(currencyStory(mixed)).not.toContain('25¢');
    });
});
