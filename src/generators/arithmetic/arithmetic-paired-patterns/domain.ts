import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {ArithmeticPairedPatternCorrespondence} from '../../../types/problems.ts';

export interface PairedPatternFrame {
    readonly firstStart: number;
    readonly firstIncrement: number;
    readonly secondStart: number;
    readonly secondIncrement: number;
    readonly correspondence?: ArithmeticPairedPatternCorrespondence;
    readonly weight: number;
}

const independentFrames: PairedPatternFrame[] = [];
for (let firstStart = 0; firstStart <= 6; firstStart++) for (let firstIncrement = 2; firstIncrement <= 7; firstIncrement++) {
    for (let secondStart = 0; secondStart <= 6; secondStart++) for (let secondIncrement = 2; secondIncrement <= 7; secondIncrement++) {
        const sourceExample = firstStart === 0 && firstIncrement === 3 && secondStart === 0 && secondIncrement === 6;
        independentFrames.push({firstStart, firstIncrement, secondStart, secondIncrement,
            weight: 0.8 / (42 * 42) + (sourceExample ? 0.2 : 0)});
    }
}

const correspondenceFrames: PairedPatternFrame[] = [];
for (let factor = 2; factor <= 3; factor++) for (let firstStart = 0; firstStart <= 4; firstStart++) {
    for (let firstIncrement = 2; firstIncrement <= 5; firstIncrement++) {
        correspondenceFrames.push({firstStart, firstIncrement, secondStart: factor * firstStart,
            secondIncrement: factor * firstIncrement, correspondence: {kind: 'multiplicative', factor}, weight: 0.6 / 40});
    }
}
for (let firstStart = 0; firstStart <= 6; firstStart++) for (let increment = 2; increment <= 7; increment++) {
    for (let difference = 2; difference <= 9; difference++) {
        correspondenceFrames.push({firstStart, firstIncrement: increment, secondStart: firstStart + difference,
            secondIncrement: increment, correspondence: {kind: 'additive', difference}, weight: 0.4 / 336});
    }
}

/** Alignment positions are recurrence inputs in these tasks, not incidental table decoration. */
const quantities = (frame: PairedPatternFrame): number[] => [0, 1, 2, 3, 4, 5,
    frame.firstIncrement, frame.secondIncrement,
    ...Array.from({length: 6}, (_, index) => frame.firstStart + index * frame.firstIncrement),
    ...Array.from({length: 6}, (_, index) => frame.secondStart + index * frame.secondIncrement),
    ...(frame.correspondence ? [frame.correspondence.kind === 'multiplicative'
        ? frame.correspondence.factor : frame.correspondence.difference] : [])];

const domains = new Map<string, readonly PairedPatternFrame[]>();

/** Keep the original mixture law conditional on an ordinary pre-generation numeric band. */
export function pairedPatternDomain(hasCorrespondence: boolean, range: CanonicalNumericRange): readonly PairedPatternFrame[] {
    if (typeof hasCorrespondence !== 'boolean' || !range || range.min !== 0 || ![10, 20, 100].includes(range.max)) {
        throw new GeneratorValidationError('arithmetic-paired-patterns', 'Expected a correspondence flag and reviewed canonical upper band without a positive lower.');
    }
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('arithmetic-paired-patterns', 'Canonical range witnesses are missing or inconsistent.');
    }
    const key = `${hasCorrespondence}:${range.max}`;
    if (!domains.has(key)) {
        domains.set(key, (hasCorrespondence ? correspondenceFrames : independentFrames)
            .filter(frame => hasCanonicalRangeWitness(quantities(frame), range)));
    }
    return domains.get(key)!;
}
