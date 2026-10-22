import type {CommonFactorMultipleProblem, FullCommonFactorDistributionProblem} from '../../types/problems.ts';

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0);
const pair = (value: unknown): value is [number, number] => Array.isArray(value) && value.length === 2 && value.every(whole);
const equalList = (actual: unknown, expected: readonly number[]): actual is number[] => Array.isArray(actual)
    && actual.length === expected.length && actual.every((value: unknown, index: number) => whole(value) && value === expected[index]);

/** Finite complete divisor evidence; callers handle the all-zero undefined branch separately. */
function commonDivisors(first: number, second: number): number[] {
    return Array.from({length: Math.max(first, second)}, (_, index) => index + 1)
        .filter(value => first % value === 0 && second % value === 0);
}

export function isFullCommonFactorDistribution(data: unknown): data is FullCommonFactorDistributionProblem {
    if (!record(data) || data.kind !== 'full-common-factor-distribution' || !pair(data.addends)
        || !data.addends.every(value => value >= 1 && value <= 100)
        || !whole(data.sum) || data.sum !== data.addends[0] + data.addends[1]
        || !whole(data.gcd) || data.gcd <= 1 || !pair(data.residualAddends) || !whole(data.residualSum)
        || !pair(data.distributedProducts)) return false;
    const divisors = commonDivisors(data.addends[0], data.addends[1]);
    return equalList(data.commonDivisors, divisors) && data.gcd === divisors[divisors.length - 1]
        && data.residualAddends[0] > 0 && data.residualAddends[1] > 0
        && data.gcd * data.residualAddends[0] === data.addends[0]
        && data.gcd * data.residualAddends[1] === data.addends[1]
        && data.residualSum === data.residualAddends[0] + data.residualAddends[1]
        && data.gcd * data.residualSum === data.sum
        && equalList(data.residualCommonDivisors, [1])
        && equalList(data.residualCommonDivisors, commonDivisors(data.residualAddends[0], data.residualAddends[1]))
        && data.distributedProducts[0] === data.addends[0] && data.distributedProducts[1] === data.addends[1];
}

/** Checks both relations for every accepted pair, independent of which learner task consumes it. */
export function isCommonFactorMultiple(data: unknown): data is CommonFactorMultipleProblem {
    if (!record(data) || data.kind !== 'common-factor-multiple-relations' || !pair(data.inputs)
        || !data.inputs.every(value => value <= 100) || !record(data.gcd) || !record(data.lcm)) return false;
    const [first, second] = data.inputs;
    const gcd = data.gcd;
    const lcm = data.lcm;
    if (first === 0 && second === 0) {
        if (gcd.kind !== 'undefined-zero-pair' || 'value' in gcd || 'commonDivisors' in gcd
            || 'cofactors' in gcd || 'cofactorCommonDivisors' in gcd) return false;
    } else {
        const divisors = commonDivisors(first, second);
        if (gcd.kind !== 'defined' || !whole(gcd.value) || gcd.value === 0
            || gcd.value !== divisors[divisors.length - 1] || !equalList(gcd.commonDivisors, divisors)
            || !pair(gcd.cofactors) || gcd.value * gcd.cofactors[0] !== first || gcd.value * gcd.cofactors[1] !== second
            || !equalList(gcd.cofactorCommonDivisors, [1])
            || !equalList(gcd.cofactorCommonDivisors, commonDivisors(gcd.cofactors[0], gcd.cofactors[1]))) return false;
    }
    const zeroIndices = data.inputs.flatMap((value, index) => value === 0 ? [index] : []);
    if (zeroIndices.length > 0) {
        return lcm.kind === 'zero-extension' && whole(lcm.value) && lcm.value === 0
            && equalList(lcm.zeroInputIndices, zeroIndices) && equalList(lcm.zeroProducts, [0, 0]);
    }
    return gcd.kind === 'defined' && whole(gcd.value) && pair(gcd.cofactors)
        && lcm.kind === 'positive' && whole(lcm.value) && lcm.value > 0
        && pair(lcm.commonMultipliers) && equalList(lcm.commonMultipliers, [gcd.cofactors[1], gcd.cofactors[0]])
        && equalList(lcm.commonProducts, [lcm.value, lcm.value])
        && first * lcm.commonMultipliers[0] === lcm.value && second * lcm.commonMultipliers[1] === lcm.value
        && gcd.value * gcd.cofactors[0] * gcd.cofactors[1] === lcm.value;
}
