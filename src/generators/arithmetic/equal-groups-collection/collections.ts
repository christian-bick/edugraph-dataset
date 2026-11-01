import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

/** Every ordered collection in the preceding 2..6 groups × 2..6 members domain. */
export const equalGroupCollections = Array.from({length: 5}, (_, count) =>
    Array.from({length: 5}, (_, size) => ({groupCount: count + 2, groupSize: size + 2,
        total: (count + 2) * (size + 2)}))).flat();

export const equalGroupCollectionsWithin = (range: CanonicalNumericRange) => equalGroupCollections.filter(
    ({groupCount, groupSize, total}) => hasCanonicalRangeWitness([groupCount, groupSize, total], range)
);
