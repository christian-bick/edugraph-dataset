import {random} from '../../../lib/random.ts';

interface WeightedPair {
    readonly operands: readonly [number, number];
    readonly weight: number;
}

/** The original sequential sampler's probability, restricted to one operand width. */
export function operandWidthPairs(operation: 'addition' | 'subtraction', digits: 1 | 2): WeightedPair[] {
    const pairs: WeightedPair[] = [];
    for (let first = 1; first < 20; first++) {
        for (let second = 1; second <= 20 - first; second++) {
            const operands: [number, number] = operation === 'addition'
                ? [first, second] : [first + second, first];
            if ((Math.max(...operands) < 10 ? 1 : 2) === digits) {
                pairs.push({operands, weight: 1 / (19 * (20 - first))});
            }
        }
    }
    return pairs;
}

/** Select inside the chosen profile without retries that could change its mixture. */
export function sampleOperandWidthPair(operation: 'addition' | 'subtraction', digits: 1 | 2): readonly [number, number] {
    const pairs = operandWidthPairs(operation, digits);
    let remaining = random() * pairs.reduce((total, pair) => total + pair.weight, 0);
    for (const pair of pairs) {
        remaining -= pair.weight;
        if (remaining < 0) return pair.operands;
    }
    return pairs[pairs.length - 1].operands;
}

type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
interface WidthRow {
    readonly first: number;
    readonly low: number;
    readonly high: number;
    readonly weight: number;
}

/** Compress each original first draw into its contiguous admissible second draws. */
export function boundedOperandWidthRows(operation: Operation, digits: number, bound: number): WidthRow[] {
    const rows: WidthRow[] = [];
    const lower = 10 ** (digits - 1), upper = 10 ** digits - 1;
    const additive = operation === 'addition' || operation === 'subtraction';
    const firstCount = additive ? bound - 1 : bound;
    for (let first = 1; first <= firstCount; first++) {
        const secondCount = additive ? bound - first : Math.floor(bound / first);
        let low = 1, high = secondCount;
        if (operation === 'subtraction') {
            low = Math.max(low, lower - first);
            high = Math.min(high, upper - first);
        } else if (operation === 'division') {
            low = Math.max(low, Math.ceil(lower / first));
            high = Math.min(high, Math.floor(upper / first));
        } else {
            if (first > upper) continue;
            if (first < lower) low = lower;
            high = Math.min(high, upper);
        }
        if (low <= high) rows.push({first, low, high, weight: (high - low + 1) / (firstCount * secondCount)});
    }
    return rows;
}

/** Bounded conditional sampling uses O(bound) rows, rather than O(bound²) pairs. */
export function sampleBoundedOperandWidthPair(operation: Operation, digits: number, bound: number): readonly [number, number] | null {
    const rows = boundedOperandWidthRows(operation, digits, bound);
    if (!rows.length) return null;
    let remaining = random() * rows.reduce((sum, row) => sum + row.weight, 0);
    const row = rows.find(candidate => (remaining -= candidate.weight) < 0) ?? rows[rows.length - 1]!;
    const second = row.low + Math.floor(random() * (row.high - row.low + 1));
    if (operation === 'subtraction') return [row.first + second, row.first];
    if (operation === 'division') return [row.first * second, row.first];
    return [row.first, second];
}
