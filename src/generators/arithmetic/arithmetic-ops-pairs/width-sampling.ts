import {random} from '../../../lib/random.ts';

interface WeightedPair {
    readonly operands: readonly [number, number];
    readonly weight: number;
}

/** The original sequential sampler's probability, restricted to one operand width. */
export function additionWidthPairs(digits: 1 | 2): WeightedPair[] {
    const pairs: WeightedPair[] = [];
    for (let first = 1; first < 20; first++) {
        for (let second = 1; second <= 20 - first; second++) {
            if ((Math.max(first, second) < 10 ? 1 : 2) === digits) {
                pairs.push({operands: [first, second], weight: 1 / (19 * (20 - first))});
            }
        }
    }
    return pairs;
}

/** Select inside the chosen profile without retries that could change its mixture. */
export function sampleAdditionWidthPair(digits: 1 | 2): readonly [number, number] {
    const pairs = additionWidthPairs(digits);
    let remaining = random() * pairs.reduce((total, pair) => total + pair.weight, 0);
    for (const pair of pairs) {
        remaining -= pair.weight;
        if (remaining < 0) return pair.operands;
    }
    return pairs[pairs.length - 1].operands;
}
