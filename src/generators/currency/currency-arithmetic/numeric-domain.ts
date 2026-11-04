import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {CurrencyAmount, CurrencyArithmeticProblem} from '../../../types/problems.ts';

type Operation = 'addition' | 'subtraction';
/** Retain original ordered count draws, including equal-count adjustment multiplicities. */
const countedRows = (operation: Operation, maximum: number) => Array.from({length: maximum}, (_, firstIndex) =>
    Array.from({length: maximum}, (_, secondIndex) => {
        let first = firstIndex + 1, second = secondIndex + 1;
        if (first === second) first++;
        if (operation === 'subtraction' && first < second) [first, second] = [second, first];
        return {first, second, answer: operation === 'addition' ? first + second : first - second};
    })
).flat();
const rows = {addition: countedRows('addition', 3), subtraction: countedRows('subtraction', 3)};
const pennyRows = {addition: countedRows('addition', 6), subtraction: countedRows('subtraction', 6)};
export const banknoteRangeProfiles = canonicalRangeProfiles.filter(profile => Object.values(rows).flat()
    .some(row => hasCanonicalRangeWitness([1, row.first, row.second, row.answer], profile.range)));
export const pennyRangeProfiles = canonicalRangeProfiles.filter(profile => Object.values(pennyRows).flat()
    .some(row => hasCanonicalRangeWitness([1, row.first, row.second, row.answer], profile.range)));
/** Nickel arithmetic and dime subtraction stay entirely in cents in the current question/solution formatter. */
export const centOnlyRangeProfiles = canonicalRangeProfiles.filter(profile =>
    (['addition', 'subtraction'] as const).some(operation => ([5, 10] as const).some(denomination =>
        !(denomination === 10 && operation === 'addition') && pennyRows[operation].some(row => hasCanonicalRangeWitness(
            [denomination, row.first * denomination, row.second * denomination, row.answer * denomination], profile.range)))));

export function banknoteRowsForRange(operation: Operation, range: CanonicalNumericRange) {
    const profile = banknoteRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    // All displayed banknotes are$1;100 cents is storage, not an assessed numerical amount.
    return profile ? rows[operation].filter(row =>
        hasCanonicalRangeWitness([1, row.first, row.second, row.answer], profile.range)) : [];
}

export function pennyRowsForRange(operation: Operation, range: CanonicalNumericRange) {
    const profile = pennyRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    // All amounts and answers remain below100 cents; the unchanged formatter explicitly displays cents.
    return profile ? pennyRows[operation].filter(row =>
        hasCanonicalRangeWitness([1, row.first, row.second, row.answer], profile.range)) : [];
}

export function centOnlyRowsForRange(operation: Operation, denomination: 5 | 10, range: CanonicalNumericRange) {
    if (denomination === 10 && operation === 'addition') return [];
    const profile = centOnlyRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    // The named coin face is an assessed monetary input; unasked picture cardinalities are not extra quantities.
    return profile ? pennyRows[operation].filter(row => hasCanonicalRangeWitness(
        [denomination, row.first * denomination, row.second * denomination, row.answer * denomination], profile.range)) : [];
}

export type CurrencyCountTicket = readonly [number, number] | readonly [number, number, number, number];
const nativeCoinTickets = new Map<string, readonly CurrencyCountTicket[]>();

/** Original independent count tickets, before equality correction and subtraction ordering. */
export function currencyCoinTickets(useBanknotes: boolean, denomination: number): readonly CurrencyCountTicket[] {
    if (![1, 5, 10, 25].includes(denomination))
        throw new GeneratorValidationError('currency-arithmetic', 'Choose a supported coin denomination.');
    const key = `${useBanknotes}:${denomination}`, cached = nativeCoinTickets.get(key);
    if (cached) return cached;
    const maximum = useBanknotes ? 3 : Math.max(2, Math.min(6, Math.floor(75 / denomination)));
    const counts = Array.from({length: maximum}, (_, index) => index + 1);
    const tickets: CurrencyCountTicket[] = useBanknotes
        ? [1, 2, 3].flatMap(firstNote => counts.flatMap(firstCoin => [1, 2, 3].flatMap(secondNote =>
            counts.map(secondCoin => [firstNote, firstCoin, secondNote, secondCoin] as const))))
        : counts.flatMap(first => counts.map(second => [first, second] as const));
    nativeCoinTickets.set(key, tickets);
    return tickets;
}

/** Fresh mathematical payload; equal totals add one first item without drawing again. */
export function buildCurrencyCoinProblem(operation: Operation, useBanknotes: boolean, denomination: number,
    ticket: CurrencyCountTicket): CurrencyArithmeticProblem {
    const amount = (notes: number, coins: number): CurrencyAmount => ({items: [
        ...(useBanknotes ? [{kind: 'banknote' as const, denominationCents: 100, count: notes}] : []),
        {kind: 'coin', denominationCents: denomination, count: coins}
    ], totalCents: notes * 100 + coins * denomination});
    let first = useBanknotes ? amount(ticket[0], ticket[1]) : amount(0, ticket[0]);
    let second = useBanknotes ? amount(ticket[2]!, ticket[3]!) : amount(0, ticket[1]);
    if (first.totalCents === second.totalCents) {
        first.items[0]!.count++;
        first.totalCents += first.items[0]!.denominationCents;
    }
    if (operation === 'subtraction' && first.totalCents < second.totalCents) [first, second] = [second, first];
    return {operation, amounts: [first, second], answerCents: operation === 'addition'
        ? first.totalCents + second.totalCents : first.totalCents - second.totalCents};
}

/** Monetary units shown by denomination faces, local cards, global equations and the required answer. */
export function currencyQuantities(problem: CurrencyArithmeticProblem): readonly number[] {
    const magnitude = (cents: number, dollars: boolean) => dollars || cents >= 100 ? cents / 100 : cents;
    const dollars = problem.amounts.some(amount => amount.items.some(item => item.kind === 'banknote'));
    return [...problem.amounts.flatMap(amount => [
        ...amount.items.map(item => magnitude(item.denominationCents, item.kind === 'banknote')),
        magnitude(amount.totalCents, amount.items.some(item => item.kind === 'banknote')),
        magnitude(amount.totalCents, dollars)
    ]), magnitude(problem.answerCents, dollars)];
}

const upper5 = createCanonicalNumericRange(5), upper10 = createCanonicalNumericRange(10), upper100 = createCanonicalNumericRange(100);
const lower10Upper100 = createCanonicalNumericRange(100, 10), lower20Upper100 = createCanonicalNumericRange(100, 20);

/** Static feasible cells for the newly adopted branches; no native pools are built during catalog loading. */
export function pendingCurrencyRanges(operation: Operation, useBanknotes: boolean, denomination: number): readonly CanonicalNumericRange[] {
    if (useBanknotes) {
        if (denomination === 25) return [upper100];
        if (denomination === 10) return [upper10];
        if (denomination === 5 || denomination === 1) return operation === 'addition' ? [upper5, upper10] : [upper5];
    } else {
        if (denomination === 25) return [upper100, lower20Upper100];
        if (denomination === 10 && operation === 'addition') return [upper100, lower10Upper100];
    }
    return [];
}

const rangedCoinTickets = new Map<string, readonly CurrencyCountTicket[]>();
export function pendingCurrencyTicketsForRange(operation: Operation, useBanknotes: boolean, denomination: number,
    range: CanonicalNumericRange): readonly CurrencyCountTicket[] {
    const canonical = pendingCurrencyRanges(operation, useBanknotes, denomination).find(candidate =>
        Object.entries(candidate).every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    if (!canonical) throw new GeneratorValidationError('currency-arithmetic', 'Choose a feasible canonical monetary range.');
    const key = `${operation}:${useBanknotes}:${denomination}:${canonical.min}:${canonical.max}`, cached = rangedCoinTickets.get(key);
    if (cached) return cached;
    const tickets = currencyCoinTickets(useBanknotes, denomination).filter(ticket =>
        hasCanonicalRangeWitness(currencyQuantities(buildCurrencyCoinProblem(operation, useBanknotes, denomination, ticket)), canonical));
    if (!tickets.length) throw new GeneratorValidationError('currency-arithmetic', 'The monetary range has no native support.');
    rangedCoinTickets.set(key, tickets);
    return tickets;
}

/** Preserve each original count draw, weighted by the feasible completions of its prefix. */
export function selectCurrencyTicket(tickets: readonly CurrencyCountTicket[], draw: () => number): CurrencyCountTicket {
    if (!tickets.length) throw new GeneratorValidationError('currency-arithmetic', 'A monetary domain must not be empty.');
    let candidates = tickets;
    for (let index = 0; index < tickets[0]!.length; index++) {
        const value = draw();
        if (!Number.isFinite(value) || value < 0 || value >= 1)
            throw new GeneratorValidationError('currency-arithmetic', 'A currency draw must lie in the half-open unit interval.');
        const count = candidates[Math.floor(value * candidates.length)]![index];
        candidates = candidates.filter(ticket => ticket[index] === count);
    }
    return candidates[0]!;
}
