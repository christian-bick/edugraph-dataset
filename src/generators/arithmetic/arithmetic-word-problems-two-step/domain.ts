import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {ArithmeticOperation, ArithmeticWordProblemTwoStep} from '../../../types/problems.ts';

type Operations = readonly [ArithmeticOperation, ArithmeticOperation];
type Interval = readonly [number, number];
export interface TwoStepRow {
    readonly num1: number;
    readonly num2: number;
    readonly intermediate: number;
    readonly thirds: readonly Interval[];
    readonly count: number;
    readonly end: number;
}
export interface TwoStepDomain {
    readonly rows: readonly TwoStepRow[];
    readonly count: number;
}
export const twoStepQuantities = (data: ArithmeticWordProblemTwoStep): number[] =>
    [data.num1, data.num2, data.num3, data.intermediate, data.answer];

const apply = (left: number, right: number, operation: ArithmeticOperation): number => operation === 'addition'
    ? left + right : operation === 'subtraction' ? left - right : operation === 'multiplication' ? left * right : left / right;

const interval = (low: number, high: number): Interval[] => low <= high ? [[low, high]] : [];
const merge = (intervals: Interval[]): Interval[] => {
    const result: [number, number][] = [];
    for (const [low, high] of intervals.sort((a, b) => a[0] - b[0])) {
        const previous = result.at(-1);
        if (previous && low <= previous[1] + 1) previous[1] = Math.max(previous[1], high);
        else result.push([low, high]);
    }
    return result;
};

function thirdIntervals(operation: ArithmeticOperation, intermediate: number, fixedMinimum: number, fixedMaximum: number,
    range: CanonicalNumericRange): Interval[] {
    const minimum = Math.max(1, range.min);
    const requireLowerWitness = fixedMinimum >= range.minimumBelow;
    if (operation === 'addition' || operation === 'multiplication') {
        const low = fixedMaximum > range.maximumAbove ? minimum : Math.max(minimum, operation === 'addition'
            ? range.maximumAbove - intermediate + 1 : Math.floor(range.maximumAbove / intermediate) + 1);
        const high = Math.min(operation === 'addition' ? range.max - intermediate : Math.floor(range.max / intermediate),
            requireLowerWitness ? range.minimumBelow - 1 : range.max);
        return interval(low, high);
    }
    // A positive difference or exact quotient cannot exceed its given intermediate.
    if (fixedMaximum <= range.maximumAbove) return [];
    if (operation === 'subtraction') {
        const high = intermediate - minimum;
        return requireLowerWitness ? merge([
            ...interval(minimum, Math.min(high, range.minimumBelow - 1)),
            ...interval(Math.max(minimum, intermediate - range.minimumBelow + 1), high)
        ]) : interval(minimum, high);
    }
    return merge(Array.from({length: Math.max(0, Math.floor(intermediate / minimum) - minimum + 1)}, (_, index) => index + minimum)
        .filter(third => intermediate % third === 0 && (!requireLowerWitness
            || Math.min(third, intermediate / third) < range.minimumBelow))
        .map(third => [third, third] as const));
}

const domains = new Map<string, TwoStepDomain>();

/** Compact intervals cover every positive integral two-step relation within the reviewed ceiling. */
export function twoStepDomain(operations: Operations, range: CanonicalNumericRange): TwoStepDomain {
    const supported = ['addition', 'subtraction', 'multiplication', 'division'];
    if (!operations || operations.length !== 2 || operations.some(operation => !supported.includes(operation))
        || !range || ![5, 10, 20, 100].includes(range.max) || ![0, 5, 10, 20].includes(range.min) || range.min >= range.max) {
        throw new GeneratorValidationError('arithmetic-word-problems-two-step', 'Expected supported operations and reviewed canonical numeric bounds.');
    }
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('arithmetic-word-problems-two-step', 'Canonical range witnesses are missing or inconsistent.');
    }
    const key = `${operations.join(':')}:${range.min}:${range.max}`;
    if (!domains.has(key)) {
        const rows: TwoStepRow[] = [];
        let count = 0;
        const minimum = Math.max(1, range.min);
        for (let num1 = minimum; num1 <= range.max; num1++) for (let num2 = minimum; num2 <= range.max; num2++) {
            const intermediate = apply(num1, num2, operations[0]);
            if (!Number.isInteger(intermediate) || intermediate < minimum || intermediate > range.max) continue;
            const thirds = thirdIntervals(operations[1], intermediate, Math.min(num1, num2, intermediate),
                Math.max(num1, num2, intermediate), range);
            const rowCount = thirds.reduce((sum, [low, high]) => sum + high - low + 1, 0);
            if (rowCount) rows.push({num1, num2, intermediate, thirds, count: rowCount, end: count += rowCount});
        }
        domains.set(key, {rows, count});
    }
    return domains.get(key)!;
}

/** One uniform index gives every admitted concrete operand triple equal probability. */
export function twoStepFrame(domain: TwoStepDomain, operations: Operations, index: number): ArithmeticWordProblemTwoStep {
    if (!Number.isSafeInteger(index) || index < 0 || index >= domain.count) {
        throw new GeneratorValidationError('arithmetic-word-problems-two-step', 'Expected an admitted finite-domain index.');
    }
    let low = 0, high = domain.rows.length - 1;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (index < domain.rows[middle]!.end) high = middle;
        else low = middle + 1;
    }
    const row = domain.rows[low]!;
    let remaining = index - row.end + row.count;
    for (const [first, last] of row.thirds) {
        if (remaining <= last - first) {
            const num3 = first + remaining;
            return {kind: 'two-step', num1: row.num1, num2: row.num2, num3, intermediate: row.intermediate,
                answer: apply(row.intermediate, num3, operations[1]), operations: [...operations]};
        }
        remaining -= last - first + 1;
    }
    throw new GeneratorValidationError('arithmetic-word-problems-two-step', 'Finite-domain row did not contain its admitted index.');
}
