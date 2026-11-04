import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import type {CurrencyArithmeticProblem} from '../../../types/problems.ts';
import {buildCurrencyCoinProblem, currencyCoinTickets, currencyQuantities, pendingCurrencyRanges,
    pendingCurrencyTicketsForRange, selectCurrencyTicket, type CurrencyCountTicket} from './numeric-domain.ts';

const pendingCases = [
    {operation: 'addition', useBanknotes: false, denomination: 25, counts: [6, 3]},
    {operation: 'subtraction', useBanknotes: false, denomination: 25, counts: [1, 8]},
    {operation: 'addition', useBanknotes: false, denomination: 10, counts: [6, 30]},
    ...([25, 10, 5, 1] as const).flatMap(denomination => (['addition', 'subtraction'] as const).map(operation => ({
        operation, useBanknotes: true, denomination,
        counts: operation === 'addition' && denomination <= 5 ? [51, 30] : [81]
    })))
] as const;

function prefixProbes(tickets: readonly CurrencyCountTicket[], wanted: CurrencyCountTicket) {
    let candidates = tickets;
    return wanted.map((count, depth) => {
        const before = candidates.filter(ticket => ticket[depth]! < count).length;
        const matching = candidates.filter(ticket => ticket[depth] === count);
        const value = (before + matching.length / 2) / candidates.length;
        candidates = matching;
        return value;
    });
}

describe('currency mathematical domains', () => {
    it.each(pendingCases)('partitions every native path for $operation, banknotes=$useBanknotes, denomination=$denomination', ({operation, useBanknotes, denomination, counts}) => {
        const ranges = pendingCurrencyRanges(operation, useBanknotes, denomination);
        const native = currencyCoinTickets(useBanknotes, denomination);
        const cells = ranges.map(range => pendingCurrencyTicketsForRange(operation, useBanknotes, denomination, range));
        expect(cells.map(tickets => tickets.length)).toEqual(counts);
        expect(cells.flat().map(ticket => JSON.stringify(ticket)).sort()).toEqual(native.map(ticket => JSON.stringify(ticket)).sort());
        expect(new Set(cells.flat().map(ticket => JSON.stringify(ticket))).size).toBe(native.length);
        for (let cell = 0; cell < cells.length; cell++) {
            const tickets = cells[cell]!, range = ranges[cell]!;
            expect(pendingCurrencyTicketsForRange(operation, useBanknotes, denomination, {...range})).toBe(tickets);
            for (const wanted of tickets) {
                const values = prefixProbes(tickets, wanted), draw = vi.fn();
                for (const value of values) draw.mockReturnValueOnce(value);
                expect(selectCurrencyTicket(tickets, draw)).toEqual(wanted);
                expect(draw).toHaveBeenCalledTimes(useBanknotes ? 4 : 2);
                expect(hasCanonicalRangeWitness(currencyQuantities(buildCurrencyCoinProblem(operation,
                    useBanknotes, denomination, wanted)), range)).toBe(true);
            }
        }
    });

    it('retains all 702 pending tickets in sixteen cells', () => {
        expect(pendingCases).toHaveLength(11);
        expect(pendingCases.reduce((sum, profile) => sum + profile.counts.reduce((total, count) => total + count, 0), 0)).toBe(702);
        expect(pendingCases.reduce((sum, profile) => sum + profile.counts.length, 0)).toBe(16);
    });

    it('keeps the original lexicographic two/four count order and caches native ticket lists', () => {
        const coins = currencyCoinTickets(false, 25), mixed = currencyCoinTickets(true, 5);
        expect(coins).toEqual([[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3]]);
        expect(mixed.slice(0, 4)).toEqual([[1, 1, 1, 1], [1, 1, 1, 2], [1, 1, 1, 3], [1, 1, 2, 1]]);
        expect(mixed.at(-1)).toEqual([3, 3, 3, 3]);
        expect(currencyCoinTickets(false, 25)).toBe(coins);
        expect(currencyCoinTickets(true, 5)).toBe(mixed);
        expect(currencyCoinTickets(false, 1)).toHaveLength(36);
    });

    it('corrects equal totals by one first item before ordering subtraction and returns fresh payloads', () => {
        const coin = buildCurrencyCoinProblem('addition', false, 25, [3, 3]);
        expect(coin.amounts.map(amount => amount.totalCents)).toEqual([100, 75]);
        expect(coin.amounts[0].items[0]!.count).toBe(4);
        expect(coin.answerCents).toBe(175);
        const mixed = buildCurrencyCoinProblem('subtraction', true, 5, [1, 1, 1, 1]);
        expect(mixed.amounts.map(amount => amount.totalCents)).toEqual([205, 105]);
        expect(mixed.amounts[0].items.map(item => item.count)).toEqual([2, 1]);
        expect(mixed.answerCents).toBe(100);
        expect(buildCurrencyCoinProblem('subtraction', false, 25, [1, 3]).amounts.map(amount => amount.totalCents)).toEqual([75, 25]);
        coin.amounts[0].items[0]!.count = 99;
        expect(buildCurrencyCoinProblem('addition', false, 25, [3, 3]).amounts[0].items[0]!.count).toBe(4);
    });

    it('uses cents or dollars per actual card/equation display and includes the required answer', () => {
        const coins: CurrencyArithmeticProblem = {operation: 'addition', amounts: [
            {items: [{kind: 'coin', denominationCents: 25, count: 3}], totalCents: 75},
            {items: [{kind: 'coin', denominationCents: 25, count: 3}], totalCents: 75}
        ], answerCents: 150};
        expect(currencyQuantities(coins)).toEqual([25, 75, 75, 25, 75, 75, 1.5]);
        const asymmetric: CurrencyArithmeticProblem = {operation: 'subtraction', amounts: [
            {items: [{kind: 'banknote', denominationCents: 100, count: 1}], totalCents: 100},
            {items: [{kind: 'coin', denominationCents: 25, count: 3}], totalCents: 75}
        ], answerCents: 25};
        expect(currencyQuantities(asymmetric)).toEqual([1, 1, 1, 25, 75, 0.75, 0.25]);
        const mixed = buildCurrencyCoinProblem('addition', true, 5, [1, 3, 2, 1]);
        expect(currencyQuantities(mixed)).toEqual([1, 5, 1.15, 1.15, 1, 5, 2.05, 2.05, 3.2]);
        // Picture/card counts and the unused 100-cent conversion are not monetary operands.
        expect(currencyQuantities(mixed)).not.toContain(3);
        expect(currencyQuantities(mixed)).not.toContain(100);
    });

    it.each(pendingCases)('consumes the original number of PRNG calls for $operation/$useBanknotes/$denomination', ({operation, useBanknotes, denomination}) => {
        for (const range of pendingCurrencyRanges(operation, useBanknotes, denomination)) {
            const tickets = pendingCurrencyTicketsForRange(operation, useBanknotes, denomination, range);
            setSeed(`${operation}:${useBanknotes}:${denomination}:${range.min}:${range.max}`);
            const draws = Array.from({length: useBanknotes ? 4 : 2}, () => random());
            const continuation = getRandomState();
            setSeed(`${operation}:${useBanknotes}:${denomination}:${range.min}:${range.max}`);
            const selected = selectCurrencyTicket(tickets, random);
            expect(getRandomState()).toBe(continuation);
            expect(selected).toEqual(selectCurrencyTicket(tickets, (() => {
                let index = 0;
                return () => draws[index++]!;
            })()));
        }
    });

    it('leaves already adopted profiles with their existing samplers and rejects unsupported pending ranges', () => {
        expect(pendingCurrencyRanges('addition', false, 1)).toEqual([]);
        expect(pendingCurrencyRanges('subtraction', false, 10)).toEqual([]);
        expect(pendingCurrencyRanges('addition', true, 2)).toEqual([]);
        expect(() => pendingCurrencyTicketsForRange('addition', false, 25, createCanonicalNumericRange(20))).toThrow();
        expect(() => pendingCurrencyTicketsForRange('addition', false, 25,
            {...createCanonicalNumericRange(100), maximumAbove: 10})).toThrow();
    });

    it.each([0, 2, -1, NaN, Infinity])('rejects unsupported denomination %s', denomination => {
        expect(() => currencyCoinTickets(false, denomination)).toThrow();
    });

    it.each([-0.1, 1, Infinity, NaN])('rejects a draw outside the half-open unit interval: %s', value => {
        expect(() => selectCurrencyTicket([[1, 1]], () => value)).toThrow();
    });

    it('rejects an empty domain before consuming randomness', () => {
        const draw = vi.fn();
        expect(() => selectCurrencyTicket([], draw)).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
