import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

type Operation = 'addition' | 'subtraction';
/** Retain all nine original ordered count draws, including equal-count adjustment multiplicities. */
const banknoteRows = (operation: Operation) => Array.from({length: 3}, (_, firstIndex) =>
    Array.from({length: 3}, (_, secondIndex) => {
        let first = firstIndex + 1, second = secondIndex + 1;
        if (first === second) first++;
        if (operation === 'subtraction' && first < second) [first, second] = [second, first];
        return {first, second, answer: operation === 'addition' ? first + second : first - second};
    })
).flat();
const rows = {addition: banknoteRows('addition'), subtraction: banknoteRows('subtraction')};
export const banknoteRangeProfiles = canonicalRangeProfiles.filter(profile => Object.values(rows).flat()
    .some(row => hasCanonicalRangeWitness([1, row.first, row.second, row.answer], profile.range)));

export function banknoteRowsForRange(operation: Operation, range: CanonicalNumericRange) {
    const profile = banknoteRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    // All displayed banknotes are$1;100 cents is storage, not an assessed numerical amount.
    return profile ? rows[operation].filter(row =>
        hasCanonicalRangeWitness([1, row.first, row.second, row.answer], profile.range)) : [];
}
