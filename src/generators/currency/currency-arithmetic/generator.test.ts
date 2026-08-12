import {Area, Scope} from 'edugraph-ts';
import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {CurrencyArithmeticGenerator} from './generator.ts';

describe('CurrencyArithmeticGenerator', () => {
    const generator = new CurrencyArithmeticGenerator();

    beforeEach(() => setSeed(42));

    const config = {
        operation: Area.Addition,
        useCoins: true,
        useBanknotes: false,
        coinDenomination: Scope.QuarterDenomination
    } as const;

    it('generates denomination-consistent coin amounts', () => {
        const problem = generator.generate(config)!;

        expect(problem.data.amounts.flatMap(amount => amount.items)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({kind: 'coin', denominationCents: 25})
            ])
        );
        expect(problem.data.answerCents).toBe(
            problem.data.amounts[0].totalCents + problem.data.amounts[1].totalCents
        );
    });

    it('generates mixed amounts with both representations in each operand', () => {
        const problem = generator.generate({
            ...config,
            useBanknotes: true,
            coinDenomination: Scope.TwentiethDenomination
        })!;

        for (const amount of problem.data.amounts) {
            expect(amount.items.map(item => item.kind).sort()).toEqual(['banknote', 'coin']);
            expect(amount.totalCents).toBe(
                amount.items.reduce((sum, item) => sum + item.denominationCents * item.count, 0)
            );
        }
    });

    it('orders subtraction amounts to produce a positive difference', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const problem = generator.generate({...config, operation: Area.Subtraction});
            if (!problem) continue;
            const [first, second] = problem.data.amounts;
            expect(first.totalCents).toBeGreaterThan(second.totalCents);
            expect(problem.data.answerCents).toBe(first.totalCents - second.totalCents);
        }
    });

    it('generates banknote-only operands in whole dollars', () => {
        const problem = generator.generate({
            operation: Area.Addition,
            useCoins: false,
            useBanknotes: true,
            coinDenomination: 'none'
        })!;

        expect(problem.data.amounts.every(amount => amount.totalCents % 100 === 0)).toBe(true);
        expect(problem.data.amounts.flatMap(amount => amount.items).every(item => item.kind === 'banknote')).toBe(true);
    });

    it('rejects incomplete or contradictory configurations', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({...config, useCoins: false, useBanknotes: false, coinDenomination: 'none'})).toThrow();
        expect(() => generator.generate({...config, coinDenomination: 'none'})).toThrow();
        expect(() => generator.generate({...config, useCoins: false, useBanknotes: true})).toThrow();
    });
});
