import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {CurrencyArithmeticGenerator} from './generator.ts';

describe('CurrencyArithmeticGenerator spec', () => {
    it.each([
        [Scope.QuarterDenomination, 25],
        [Scope.TenthDenomination, 10],
        [Scope.TwentiethDenomination, 5],
        [Scope.HundredthDenomination, 1]
    ] as const)('resolves %s coin values', (denomination, cents) => {
        setSeed(4);
        const problem = generateWithLabels(new CurrencyArithmeticGenerator(), [
            Scope.Dollar,
            Scope.SingleStep,
            Scope.Coins,
            denomination,
            Area.Addition,
            Ability.TextualReception
        ])!;

        expect(problem.data.amounts.flatMap(amount => amount.items).every(item => item.denominationCents === cents)).toBe(true);
        expect(problem.labels).toEqual(expect.arrayContaining([Scope.Coins, denomination, Area.Addition]));
    });

    it('resolves a banknote-only subtraction without inventing a coin denomination', () => {
        setSeed(7);
        const problem = generateWithLabels(new CurrencyArithmeticGenerator(), [
            Scope.Dollar,
            Scope.SingleStep,
            Scope.Banknotes,
            Scope.MajorDenomination,
            Area.Subtraction,
            Ability.TextualReception
        ])!;

        expect(problem.data.operation).toBe('subtraction');
        expect(problem.data.amounts.flatMap(amount => amount.items).every(item => item.kind === 'banknote')).toBe(true);
        for (const denomination of [
            Scope.QuarterDenomination,
            Scope.TenthDenomination,
            Scope.TwentiethDenomination,
            Scope.HundredthDenomination
        ]) {
            expect(problem.labels).not.toContain(denomination);
        }
    });

    it.each([Area.Addition, Area.Subtraction])('does not parameterize quantity invariants for %s', operation => {
        const labels = [Scope.Dollar, Scope.SingleStep, Scope.Coins, Scope.Banknotes,
            Scope.MajorDenomination, Scope.QuarterDenomination, operation, Ability.TextualReception];
        const generator = new CurrencyArithmeticGenerator();
        setSeed('currency-invariant-resolution');
        const original = generateWithLabels(generator, labels);
        const originalState = getRandomState();
        setSeed('currency-invariant-resolution');
        const explicit = generateWithLabels(generator, [...labels, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        expect(explicit).toEqual(original);
        expect(getRandomState()).toBe(originalState);
    });
});
