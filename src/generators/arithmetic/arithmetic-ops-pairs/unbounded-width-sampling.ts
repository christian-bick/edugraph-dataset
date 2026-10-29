import {random} from '../../../lib/random.ts';

export type UnboundedOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type UnboundedOperandWidth = 'single' | 'multiple';
interface SingleDigitRow {
    readonly first: number;
    readonly high: number;
    readonly weight: number;
}

const factorLimit = (bound: number, first: number): number => Number(BigInt(bound) / BigInt(first));

/** The single-digit subset has at most nine rows, even at MAX_SAFE_INTEGER. */
export function unboundedSingleDigitRows(operation: UnboundedOperation, bound = Number.MAX_SAFE_INTEGER): SingleDigitRow[] {
    if (!Number.isSafeInteger(bound) || bound < 2) return [];
    const additive = operation === 'addition' || operation === 'subtraction';
    const firstCount = additive ? bound - 1 : bound;
    const rows: SingleDigitRow[] = [];
    for (let first = 1; first <= Math.min(9, firstCount); first++) {
        const secondCount = additive ? bound - first : factorLimit(bound, first);
        const high = Math.min(secondCount, operation === 'subtraction' ? 9 - first
            : operation === 'division' ? Math.floor(9 / first) : 9);
        if (high > 0) rows.push({first, high, weight: high / firstCount / secondCount});
    }
    return rows;
}

const integerThrough = (maximum: number): number => 1 + Math.floor(random() * maximum);

/** Exact integer products prevent a boundary rounding from admitting an unsafe payload. */
const primaryOperands = (operation: UnboundedOperation, first: number, second: number): readonly [number, number] =>
    operation === 'subtraction' ? [first + second, first]
        : operation === 'division' ? [Number(BigInt(first) * BigInt(second)), first] : [first, second];

/**
 * Condition the original sequential law on a finite single-digit subset or its complement.
 * Complement rejection keeps constant memory and preserves every accepted pair's conditional
 * probability. Its rejected mass is tiny at the unspecified safe-integer bound; a finite
 * attempt limit returns null for pathological RNG streams instead of hanging generation.
 */
export function sampleUnboundedOperandWidthPair(
    operation: UnboundedOperation, width: UnboundedOperandWidth, bound = Number.MAX_SAFE_INTEGER
): readonly [number, number] | null {
    if (!Number.isSafeInteger(bound) || bound < 2) return null;
    if (width === 'single') {
        const rows = unboundedSingleDigitRows(operation, bound);
        if (!rows.length) return null;
        let position = random() * rows.reduce((sum, row) => sum + row.weight, 0);
        const row = rows.find(candidate => (position -= candidate.weight) < 0) ?? rows.at(-1)!;
        return primaryOperands(operation, row.first, integerThrough(row.high));
    }
    const additive = operation === 'addition' || operation === 'subtraction';
    for (let attempt = 0; attempt < 32; attempt++) {
        const first = integerThrough(additive ? bound - 1 : bound);
        const second = integerThrough(additive ? bound - first : factorLimit(bound, first));
        const pair = primaryOperands(operation, first, second);
        if (Math.max(...pair) >= 10) return pair;
    }
    return null;
}
