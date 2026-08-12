import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
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
            Scope.TwoOperands,
            Scope.Coins,
            denomination,
            Area.Addition,
            Ability.TextualReception
        ])!;

        expect(problem.data.amounts.flatMap(amount => amount.items).every(item => item.denominationCents === cents)).toBe(true);
        expect(problem.tags).toEqual(expect.arrayContaining([Scope.Coins, denomination, Area.Addition]));
    });

    it('resolves a banknote-only subtraction without inventing a coin denomination', () => {
        setSeed(7);
        const problem = generateWithLabels(new CurrencyArithmeticGenerator(), [
            Scope.Dollar,
            Scope.TwoOperands,
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
            expect(problem.tags).not.toContain(denomination);
        }
    });
});
