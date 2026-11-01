import type {CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {random} from '../../lib/random.ts';
import type {ArithmeticPairProblem} from '../../types/problems.ts';

export interface CanonicalPairConfig {
    readonly operation: ArithmeticPairProblem['operation'];
    readonly range: CanonicalNumericRange;
    readonly largestOperandDigits: 1 | 2 | 3 | 4 | 'multiple';
    readonly requireNegative: boolean;
    readonly requireZero: boolean;
    readonly requireMultipleOf10: boolean;
    readonly requireEqualAddends: boolean;
    readonly requireEvenResult: boolean;
}

interface Interval {min: number; max: number; step: number}
interface PairPlan {
    first: Interval;
    second: (first: number) => Interval;
    values: (first: number, second: number) => readonly [number, number, number];
}

const interval = (min: number, max: number, step = 1, residue = 0): Interval => ({
    min: Math.ceil((min - residue) / step) * step + residue,
    max: Math.floor((max - residue) / step) * step + residue,
    step
});
const nonempty = (value: Interval): boolean => value.min <= value.max;
const draw = (value: Interval): number => value.min + value.step
    * Math.floor(random() * (Math.floor((value.max - value.min) / value.step) + 1));
const fixed = (value: number): Interval => interval(value, value);

/** The broad multiple-digit alternative covers widths beyond the available exact profiles. */
export const canonicalOperandWidth = (digits: CanonicalPairConfig['largestOperandDigits']): readonly [number, number] =>
    digits === 'multiple' ? [10000, 1000000] : [10 ** (digits - 1), 10 ** digits - 1];

function pairPlans(config: CanonicalPairConfig): PairPlan[] {
    const {range, operation, largestOperandDigits, requireNegative, requireZero,
        requireMultipleOf10, requireEqualAddends, requireEvenResult} = config;
    if (!['addition', 'subtraction', 'multiplication', 'division'].includes(operation)
        || !range || ![range.min, range.max, range.maximumAbove, range.minimumBelow].every(Number.isFinite)
        || range.min < 0 || range.min >= range.max || range.max > 1000000
        || ![1, 2, 3, 4, 'multiple'].includes(largestOperandDigits)
        || requireEqualAddends && (operation !== 'addition' || requireNegative || requireZero)) return [];
    const [widthMin, widthMax] = canonicalOperandWidth(largestOperandDigits);
    const plans: PairPlan[] = [];
    const add = (plan: PairPlan) => {if (nonempty(plan.first)) plans.push(plan);};
    if (requireZero) {
        if (range.min !== 0) return [];
        const sign = requireNegative ? -1 : 1;
        const forms: Array<readonly [number, number, number]> = operation === 'addition'
            ? [[sign, 0, sign], ...(requireNegative ? [[-1, 1, 0] as const] : [])]
            : operation === 'subtraction'
                ? [[sign, sign, 0], [sign, 0, sign], ...(requireNegative ? [[0, 1, -1] as const] : [])]
                : [[0, sign, 0]];
        for (const form of forms) {
            const step = requireMultipleOf10 ? 10 : requireEvenResult && form[2] !== 0 ? 2 : 1;
            add({first: interval(Math.max(1, widthMin, range.maximumAbove + 1), Math.min(range.max, widthMax), step),
                second: () => fixed(0), values: value => form.map(coefficient => coefficient * value) as unknown as readonly [number, number, number]});
        }
        return plans;
    }
    const step = requireMultipleOf10 && operation !== 'multiplication' ? 10 : 1;
    const min = Math.max(1, Math.ceil(range.min / step));
    const smallMax = Math.ceil(range.minimumBelow / step) - 1;
    if (min > smallMax) return [];
    const max = Math.floor(range.max / step);
    const above = Math.floor(range.maximumAbove / step) + 1;
    const widthLow = Math.max(1, Math.ceil(widthMin / step));
    const widthHigh = Math.floor(widthMax / step);
    if (operation === 'addition') {
        if (requireEqualAddends) {
            add({first: interval(Math.max(min, widthLow, Math.ceil(above / 2)),
                Math.min(smallMax, widthHigh, Math.floor(max / 2))), second: () => fixed(0),
                values: value => [value * step, value * step, 2 * value * step]});
        } else {
            const capSmall = Math.min(smallMax, widthHigh);
            add({first: interval(Math.max(2 * min, above, widthLow + min),
                Math.min(max, 2 * widthHigh, widthHigh + capSmall), requireEvenResult && step % 2 ? 2 : 1),
                second: total => interval(Math.max(widthLow, Math.ceil(total / 2), total - capSmall),
                    Math.min(widthHigh, total - min)),
                values: (total, largest) => {
                    const sign = requireNegative ? -1 : 1;
                    return [sign * largest * step, sign * (total - largest) * step, sign * total * step];
                }});
        }
        return plans;
    }
    if (operation === 'subtraction') {
        const even = requireEvenResult && step % 2 !== 0;
        const totalMin = Math.max(min + (even ? min + min % 2 : min), above, widthLow);
        const parityFixed = even && smallMax === min;
        add({first: interval(totalMin, Math.min(max, widthHigh), parityFixed ? 2 : 1, parityFixed ? min % 2 : 0),
            second: total => interval(min, Math.min(smallMax, total - min), even ? 2 : 1, even ? total % 2 : 0),
            values: (total, part) => requireNegative
                ? [part * step, total * step, -(total - part) * step]
                : [total * step, part * step, (total - part) * step]});
        if (even) {
            const smallEven = min + min % 2;
            if (smallEven <= smallMax) add({first: interval(Math.max(min + smallEven, above, widthLow), Math.min(max, widthHigh)),
                second: total => interval(smallEven, Math.min(smallMax, total - min), 2),
                values: (total, part) => requireNegative
                    ? [(total - part) * step, total * step, -part * step]
                    : [total * step, (total - part) * step, part * step]});
        }
        return plans;
    }
    // Multiples-of-ten multiplication is the existing single-digit × whole-tens competency.
    if (operation === 'multiplication' && requireMultipleOf10) {
        for (let single = Math.max(1, range.min); single <= Math.min(9, range.minimumBelow - 1); single++) {
            const factors = interval(Math.max(10, widthMin, Math.ceil((range.maximumAbove + 1) / single)),
                Math.min(90, widthMax, Math.floor(range.max / single)), 10);
            add({first: factors, second: () => fixed(single), values: (tens, digit) => {
                const signed = requireNegative ? -digit : digit;
                return [signed, tens, signed * tens];
            }});
        }
        return plans;
    }
    const division = operation === 'division';
    const productMin = Math.max(1, range.maximumAbove + 1, division ? widthMin : 1);
    const productMax = Math.min(range.max, division ? widthMax : range.max);
    const factorMin = Math.ceil(Math.max(1, range.min) / step) * step;
    const firstMax = Math.min(Math.floor(Math.sqrt(productMax)), range.minimumBelow - 1,
        division ? productMax : widthMax);
    for (let first = factorMin; first <= firstMax; first += step) {
        const evenStep = requireEvenResult && (division || first % 2 !== 0) && step % 2 ? 2 : step;
        const second = interval(Math.max(first, factorMin, Math.ceil(productMin / first), division ? 1 : widthMin),
            Math.min(Math.floor(productMax / first), division ? productMax : widthMax), evenStep);
        add({first: second, second: () => fixed(first), values: (larger, smaller) => {
            const sign = requireNegative ? -1 : 1;
            return division ? [sign * smaller * larger, smaller, sign * larger]
                : [sign * smaller, larger, sign * smaller * larger];
        }});
        if (division && requireEvenResult && first % 2 === 0) {
            add({first: interval(Math.max(first, factorMin, Math.ceil(productMin / first)),
                Math.floor(productMax / first), step), second: () => fixed(first),
                values: (larger, smaller) => {
                    const sign = requireNegative ? -1 : 1;
                    return [sign * smaller * larger, larger, sign * smaller];
                }});
        }
    }
    return plans;
}

/** Pure, deterministic feasibility used by matching before any configuration or draw. */
export const canSampleCanonicalPair = (config: CanonicalPairConfig): boolean => pairPlans(config).length > 0;

/** Draw only from constructive feasible intervals; no rejection loop or post-draw relabeling. */
export function sampleCanonicalPair(config: CanonicalPairConfig): ArithmeticPairProblem | null {
    const plans = pairPlans(config);
    if (!plans.length) return null;
    const plan = plans[Math.floor(random() * plans.length)]!;
    const first = draw(plan.first);
    const secondRange = plan.second(first);
    if (!nonempty(secondRange)) throw new Error('Invalid canonical arithmetic sampling interval.');
    const values = plan.values(first, draw(secondRange));
    if (!hasCanonicalRangeWitness(values, config.range)) throw new Error('Canonical arithmetic range witness was not constructed.');
    let [num1, num2, answer] = values;
    if (config.operation === 'subtraction' && !config.requireZero && !config.requireEvenResult && random() < 0.5) {
        if (config.requireNegative) [num1, answer] = [-answer, -num1];
        else [num2, answer] = [answer, num2];
    }
    if (config.operation === 'division' && !config.requireZero && !config.requireEvenResult && random() < 0.5) {
        [num2, answer] = [Math.abs(answer), config.requireNegative ? -num2 : num2];
    }
    if (config.operation === 'multiplication' && config.requireNegative && !config.requireZero && random() < 0.5) {
        [num1, num2] = [-num1, -num2];
    }
    if ((config.operation === 'addition' || config.operation === 'multiplication') && random() < 0.5) [num1, num2] = [num2, num1];
    return {num1: num1 === 0 ? 0 : num1, num2: num2 === 0 ? 0 : num2,
        answer: answer === 0 ? 0 : answer, operation: config.operation};
}
