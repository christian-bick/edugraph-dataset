import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

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
