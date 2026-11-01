import {Area, Scope} from 'edugraph-ts';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import * as randomSource from '../../../lib/random.ts';
import {setSeed} from '../../../lib/random.ts';
import {CurrencyArithmeticGenerator} from './generator.ts';
import {coinDenominations} from './spec.ts';
import {banknoteRangeProfiles, pennyRangeProfiles} from './numeric-domain.ts';

const representationProfiles = [
    {name: 'banknotes', useCoins: false, useBanknotes: true, coinDenomination: 'none' as const, range: banknoteRangeProfiles[0]!.range},
    ...coinDenominations.flatMap(coinDenomination => [
        {name: `coins ${coinDenomination}`, useCoins: true, useBanknotes: false, coinDenomination,
            ...(coinDenomination === Scope.HundredthDenomination ? {range: pennyRangeProfiles[0]!.range} : {})},
        {name: `mixed ${coinDenomination}`, useCoins: true, useBanknotes: true, coinDenomination}
    ])
];

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
            coinDenomination: 'none',
            range: banknoteRangeProfiles[0]!.range
        })!;

        expect(problem.data.amounts.every(amount => amount.totalCents % 100 === 0)).toBe(true);
        expect(problem.data.amounts.flatMap(amount => amount.items).every(item => item.kind === 'banknote')).toBe(true);
    });

    it.each(representationProfiles)('keeps every quantity strictly positive for $name in both operations', profile => {
        for (const operation of [Area.Addition, Area.Subtraction]) {
            for (let seed = 0; seed < 40; seed++) {
                setSeed(`${profile.name}-${operation}-${seed}`);
                const stub = generator.generate({...profile, operation});
                expect(stub).not.toBeNull();
                const {amounts, answerCents} = stub!.data;
                for (const amount of amounts) {
                    expect(amount.items.length).toBeGreaterThan(0);
                    for (const item of amount.items) {
                        expect(item.denominationCents).toBeGreaterThan(0);
                        expect(item.count).toBeGreaterThan(0);
                    }
                    expect(amount.totalCents).toBeGreaterThan(0);
                    expect(amount.totalCents).toBe(amount.items.reduce(
                        (total, item) => total + item.denominationCents * item.count, 0));
                }
                expect(answerCents).toBeGreaterThan(0);
                expect(answerCents).toBe(operation === Area.Addition
                    ? amounts[0].totalCents + amounts[1].totalCents
                    : amounts[0].totalCents - amounts[1].totalCents);
                expect(Object.keys(stub!)).toEqual(['data']);
            }
        }
    });

    it.each(representationProfiles)('avoids a zero difference when both sampled $name totals are equal', profile => {
        const random = vi.spyOn(randomSource, 'random').mockReturnValue(0);
        try {
            const {amounts, answerCents} = generator.generate({...profile, operation: Area.Subtraction})!.data;
            expect(amounts[0].totalCents).toBeGreaterThan(amounts[1].totalCents);
            expect(answerCents).toBe(amounts[0].items[0].denominationCents);
            for (const amount of amounts) expect(amount.totalCents).toBe(amount.items.reduce(
                (total, item) => total + item.denominationCents * item.count, 0));
        } finally {
            random.mockRestore();
        }
    });

    it.each([2, 6])('preserves positive subtraction for original ordered count ticket %s', ticket => {
        const random = vi.spyOn(randomSource, 'random').mockReturnValue((ticket + 0.5) / 9);
        try {
            const problem = generator.generate({operation: Area.Subtraction, useCoins: false,
                useBanknotes: true, coinDenomination: 'none', range: banknoteRangeProfiles[0]!.range})!.data;
            expect(problem.amounts.map(amount => amount.totalCents)).toEqual([300, 100]);
            expect(problem.answerCents).toBe(200);
        } finally {
            random.mockRestore();
        }
    });

    it('returns no problem for an unsupported operation', () => {
        expect(generator.generate({...config, operation: Area.Multiplication as typeof Area.Addition})).toBeNull();
    });

    it('rejects incomplete or contradictory configurations', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({...config, useCoins: false, useBanknotes: false, coinDenomination: 'none'})).toThrow();
        expect(() => generator.generate({...config, coinDenomination: 'none'})).toThrow();
        expect(() => generator.generate({...config, useCoins: false, useBanknotes: true})).toThrow();
    });
});
