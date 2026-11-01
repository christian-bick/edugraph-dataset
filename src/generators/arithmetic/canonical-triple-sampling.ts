import type {CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {random} from '../../lib/random.ts';
import type {ArithmeticTripleProblem} from '../../types/problems.ts';
import {canSampleCanonicalSum, sampleCanonicalSum, type CanonicalSumDomain} from './canonical-sum-sampling.ts';

export interface CanonicalTripleConfig {
    readonly operation: ArithmeticTripleProblem['operation'];
    readonly range: CanonicalNumericRange;
    readonly requireZero: boolean;
    readonly requireMultipleOf10: boolean;
    readonly requireTwoDigitOperands: boolean;
    readonly useCommutativeLaw: boolean;
    readonly useAssociativeLaw: boolean;
    readonly useDistributiveLaw: boolean;
}
interface ProductChoice {first: number; second: number; min: number; max: number; step: number}
interface TriplePlan {sum?: CanonicalSumDomain; products?: ProductChoice[]; distributive?: Array<{factor: number; sum: CanonicalSumDomain}>;
    zeroProducts?: ProductChoice[]; zeroMagnitude?: {min: number; max: number; step: number}}
const integer = (min: number, max: number): number => min + Math.floor(random() * (max - min + 1));

function triplePlan(config: CanonicalTripleConfig): TriplePlan | null {
    const {operation, range, requireZero, requireMultipleOf10, requireTwoDigitOperands,
        useCommutativeLaw, useAssociativeLaw, useDistributiveLaw} = config;
    if (!['addition', 'subtraction', 'multiplication', 'division'].includes(operation)
        || !range || ![range.min, range.max, range.maximumAbove, range.minimumBelow].every(Number.isFinite)
        || range.min >= range.max || range.min < 0 || range.max > 1000000
        || [useCommutativeLaw, useAssociativeLaw, useDistributiveLaw].filter(Boolean).length > 1
        || (useCommutativeLaw || useAssociativeLaw) && operation !== 'addition' && operation !== 'multiplication'
        || useDistributiveLaw && operation !== 'multiplication'
        || requireZero && range.min > 0
        || requireTwoDigitOperands && (operation !== 'addition' || requireZero || requireMultipleOf10
            || useCommutativeLaw || useAssociativeLaw || range.min < 10 || range.min >= 100)) return null;
    const step = requireMultipleOf10 ? 10 : 1;
    if (operation === 'addition' || operation === 'subtraction') {
        const sum: CanonicalSumDomain = {count: requireZero ? 2 : 3, range,
            minimumOperand: requireTwoDigitOperands ? 10 : 1,
            maximumOperand: requireTwoDigitOperands ? 99 : range.max,
            step, zeroWitness: requireZero, distinctOperands: useCommutativeLaw && !requireZero};
        return canSampleCanonicalSum(sum) ? {sum} : null;
    }
    if (useDistributiveLaw) {
        if (requireMultipleOf10) return null;
        const distributive: NonNullable<TriplePlan['distributive']> = [];
        for (let factor = requireZero ? 0 : Math.max(1, range.min); factor <= (requireZero ? 0 : 9); factor++) {
            const divisor = Math.max(1, factor);
            const sum: CanonicalSumDomain = {count: 2,
                range: {...range, max: Math.floor(range.max / divisor),
                    maximumAbove: Math.floor(range.maximumAbove / divisor)},
                minimumOperand: 1, maximumOperand: range.max, step: 1,
                zeroWitness: factor < range.minimumBelow};
            if (canSampleCanonicalSum(sum)) distributive.push({factor, sum});
        }
        return distributive.length ? {distributive} : null;
    }
    if (requireZero) {
        if (useCommutativeLaw || useAssociativeLaw) {
            // Associativity requires the parenthesized product; commutativity only exchanges operands.
            const zeroProducts: ProductChoice[] = [];
            for (let first = step; first <= Math.floor(Math.sqrt(range.max)); first += step) {
                const witnessFloor = useAssociativeLaw ? (range.maximumAbove + 1) / first : range.maximumAbove + 1;
                const min = Math.ceil(Math.max(first, witnessFloor) / step) * step;
                const max = Math.floor(range.max / first / step) * step;
                if (min <= max) zeroProducts.push({first, second: 0, min, max, step});
            }
            return zeroProducts.length ? {zeroProducts} : null;
        }
        const minimum = Math.ceil(Math.max(1, range.maximumAbove + 1, step) / step) * step;
        const maximum = Math.floor(range.max / step) * step;
        return minimum <= maximum ? {zeroMagnitude: {min: minimum, max: maximum, step}} : null;
    }
    const products: ProductChoice[] = [];
    const min = Math.ceil(Math.max(1, range.min) / step) * step;
    for (let first = min; first <= Math.min(Math.floor(Math.cbrt(range.max)), range.minimumBelow - 1); first += step) {
        for (let second = first; second <= Math.floor(Math.sqrt(range.max / first)); second += step) {
            const lastMin = Math.ceil(Math.max(second + (useCommutativeLaw && first === second ? step : 0),
                (range.maximumAbove + 1) / (first * second)) / step) * step;
            const lastMax = Math.floor(range.max / (first * second) / step) * step;
            if (lastMin <= lastMax) products.push({first, second, min: lastMin, max: lastMax, step});
        }
    }
    return products.length ? {products} : null;
}

export const canSampleCanonicalTriple = (config: CanonicalTripleConfig): boolean => triplePlan(config) !== null;

export function sampleCanonicalTriple(config: CanonicalTripleConfig): ArithmeticTripleProblem | null {
    const plan = triplePlan(config);
    if (!plan) return null;
    let num1: number, num2: number, num3: number, answer: number;
    if (plan.sum) {
        const parts = sampleCanonicalSum(plan.sum)!;
        if (config.operation === 'addition') {
            if (config.requireZero) parts.splice(integer(0, 2), 0, 0);
            [num1, num2, num3] = parts as [number, number, number];
            answer = num1 + num2 + num3;
        } else {
            [num2, num3] = parts as [number, number];
            answer = config.requireZero ? 0 : parts[2]!;
            num1 = num2 + num3 + answer;
        }
    } else if (plan.distributive) {
        const choice = plan.distributive[integer(0, plan.distributive.length - 1)]!;
        [num2, num3] = sampleCanonicalSum(choice.sum)! as [number, number];
        num1 = choice.factor;
        answer = num1 * (num2 + num3);
    } else if (plan.zeroProducts) {
        const choice = plan.zeroProducts[integer(0, plan.zeroProducts.length - 1)]!;
        const other = choice.min + choice.step * integer(0, (choice.max - choice.min) / choice.step);
        [num1, num2, num3, answer] = [0, choice.first, other, 0];
    } else if (plan.zeroMagnitude) {
        const {min, max, step} = plan.zeroMagnitude;
        const magnitude = min + step * integer(0, (max - min) / step);
        const other = step * integer(1, magnitude / step);
        [num1, num2, num3, answer] = random() < 0.5 ? [0, other, magnitude, 0] : [0, magnitude, other, 0];
    } else {
        const choice = plan.products![integer(0, plan.products!.length - 1)]!;
        const third = choice.min + choice.step * integer(0, (choice.max - choice.min) / choice.step);
        const factors = [choice.first, choice.second, third];
        for (let index = factors.length - 1; index > 0; index--) {
            const other = integer(0, index);
            [factors[index], factors[other]] = [factors[other]!, factors[index]!];
        }
        if (config.operation === 'multiplication') {
            [num1, num2, num3] = factors as [number, number, number];
            answer = num1 * num2 * num3;
        } else {
            [num2, num3, answer] = factors as [number, number, number];
            num1 = num2 * num3 * answer;
        }
    }
    const propertyLaw = config.useCommutativeLaw ? 'commutative' : config.useAssociativeLaw ? 'associative'
        : config.useDistributiveLaw ? 'distributive' : undefined;
    if (config.useCommutativeLaw && (num1 === num2 || num1 === num3)) {
        const operands = [num1, num2, num3];
        const distinct = operands.findIndex(value => operands.filter(other => other === value).length === 1);
        if (distinct < 0) throw new Error('A commutative profile must construct observably distinct operands.');
        [operands[0], operands[distinct]] = [operands[distinct]!, operands[0]!];
        [num1, num2, num3] = operands as [number, number, number];
    }
    return {num1, num2, num3, answer, operation: config.operation,
        ...(propertyLaw ? {propertyLaw} : {}),
        ...(config.useDistributiveLaw ? {combinedFactor: num2 + num3,
            partialProducts: [num1 * num2, num1 * num3] as [number, number]} : {})};
}
