import { Scope } from 'edugraph-ts/generated';
import type { GeneratorInput } from '../types/ml-engine.ts';

const RANGE_BOUNDS = [
    { value: 5, upper: Scope.NumbersSmaller5, lower: Scope.NumbersLarger5 },
    { value: 10, upper: Scope.NumbersSmaller10, lower: Scope.NumbersLarger10 },
    { value: 20, upper: Scope.NumbersSmaller20, lower: Scope.NumbersLarger20 },
    { value: 100, upper: Scope.NumbersSmaller100, lower: Scope.NumbersLarger100 },
    { value: 120, upper: Scope.NumbersSmaller120, lower: Scope.NumbersLarger120 },
    { value: 1000, upper: Scope.NumbersSmaller1000, lower: Scope.NumbersLarger1000 },
    { value: 10000, upper: Scope.NumbersSmaller10000, lower: Scope.NumbersLarger10000 },
    { value: 100000, upper: Scope.NumbersSmaller100000, lower: Scope.NumbersLarger100000 },
    { value: 1000000, upper: Scope.NumbersSmaller1000000, lower: Scope.NumbersLarger1000000 }
] as const;

export type UpperRangeBound = typeof RANGE_BOUNDS[number]['value'];

/** An explicitly reviewed contiguous sequence, or selected catalog bounds. */
export type ReviewedUpperRanges =
    | { through: UpperRangeBound; bands?: never }
    | { bands: readonly UpperRangeBound[]; through?: never };

function selectBounds(policy: ReviewedUpperRanges) {
    const hasThrough = policy.through !== undefined;
    const hasBands = policy.bands !== undefined;
    if (hasThrough === hasBands) {
        throw new Error('Select either reviewed upper bands or a through bound.');
    }
    const requested = hasThrough ? [policy.through!] : policy.bands!;
    if (requested.length === 0 || requested.some(value => !RANGE_BOUNDS.some(bound => bound.value === value))) {
        throw new Error('Reviewed upper ranges must name nonempty, supported catalog bounds.');
    }
    return RANGE_BOUNDS.filter(bound => hasThrough
        ? bound.value <= policy.through!
        : requested.includes(bound.value));
}

/**
 * Expands reviewed target bounds before target IDs are assigned. This authoring
 * shorthand neither establishes generator feasibility nor changes range matching.
 * Existing upper constraints cannot be widened; lower/upper singleton choices
 * fail explicitly under the canonical endpoint exclusion policy.
 */
export function expandUpperRangeVariants(
    permutations: readonly { readonly labels: readonly string[] }[],
    policy: ReviewedUpperRanges
): GeneratorInput[] {
    const bounds = selectBounds(policy);
    const unique = new Map<string, GeneratorInput>();
    for (const permutation of permutations) {
        const declaredUpper = RANGE_BOUNDS.filter(bound => permutation.labels.includes(bound.upper));
        const declaredLower = RANGE_BOUNDS.filter(bound => permutation.labels.includes(bound.lower));
        const ceiling = Math.min(...declaredUpper.map(bound => bound.value));
        const floor = Math.max(0, ...declaredLower.map(bound => bound.value));
        const retained = permutation.labels.filter(label =>
            label !== Scope.NumbersLargerZero && !RANGE_BOUNDS.some(bound => bound.upper === label));
        for (const bound of bounds) {
            if (bound.value > ceiling) {
                throw new Error(`Reviewed upper bound ${bound.value} would widen the existing ceiling ${ceiling}.`);
            }
            if (bound.value < floor) {
                throw new Error(`Reviewed upper bound ${bound.value} is below the existing lower bound ${floor}.`);
            }
            if (bound.value === floor) {
                throw new Error(`Equal lower/upper endpoint ${floor} is excluded by the canonical range policy.`);
            }
            const labels = [...new Set([...retained, bound.upper])];
            const key = JSON.stringify([...labels].sort());
            if (!unique.has(key)) unique.set(key, { ...permutation, labels });
        }
    }
    return [...unique.values()];
}
