import { partOf, Scope } from 'edugraph-ts';
import type { CompetencyDescriptor } from 'edugraph-ts';

export const DISTANCE_SCALE_LABELS = [
    Scope.CentimeterScale,
    Scope.MeterScale,
    Scope.InchScale,
    Scope.FootScale,
    Scope.SegmentScale
] as const;

export type DistanceScaleLabel = typeof DISTANCE_SCALE_LABELS[number];
export type DistanceScaleFamily = 'metric' | 'imperial' | 'abstract';

export interface DistanceScaleResolution {
    label: DistanceScaleLabel;
    family: DistanceScaleFamily;
}

const ancestorCache = new Map<string, ReadonlySet<string>>();

/** Returns a concept and its transitive taxonomic ancestors. */
export function getConceptAncestors(concept: string): ReadonlySet<string> {
    const cached = ancestorCache.get(concept);
    if (cached) return cached;

    const ancestors = new Set<string>();
    const queue: string[] = [concept];
    let cursor = 0;

    while (cursor < queue.length) {
        const current = queue[cursor++];
        if (ancestors.has(current)) continue;
        ancestors.add(current);

        try {
            for (const parent of partOf(current as CompetencyDescriptor) || []) {
                if (!ancestors.has(parent)) queue.push(parent);
            }
        } catch {
            // Unknown concepts have no known ancestors, but still include themselves.
        }
    }

    ancestorCache.set(concept, ancestors);
    return ancestors;
}

/**
 * Returns true if child is equal to parent, or if parent is a transitive
 * ancestor of child via the taxonomic partOf relation.
 */
export function isSubConceptOf(child: string, parent: string): boolean {
    return getConceptAncestors(child).has(parent);
}

/** Resolves an exact distance-scale label and classifies it through its ontology parent. */
export function resolveDistanceScale(
    labels: string[],
    supportedLabels: readonly string[] = DISTANCE_SCALE_LABELS
): DistanceScaleResolution | undefined {
    const label = DISTANCE_SCALE_LABELS.find(candidate =>
        supportedLabels.includes(candidate) && labels.includes(candidate));
    if (!label) return undefined;

    if (isSubConceptOf(label, Scope.MetricDistanceScale)) return {label, family: 'metric'};
    if (isSubConceptOf(label, Scope.ImperialDistanceScale)) return {label, family: 'imperial'};
    if (isSubConceptOf(label, Scope.DistanceAbstraction)) return {label, family: 'abstract'};
    return undefined;
}


/**
 * Resolves the numeric range boundary from a list of ontological labels.
 */
export function resolveRangeFromLabels(labels: string[]): { min: number; max: number } {
    let min = 0;
    let max = Number.MAX_SAFE_INTEGER;

    // 2. Resolve maximum boundary (SmallerThan scopes)
    if (labels.includes(Scope.NumbersSmaller5)) {
        max = 5;
    } else if (labels.includes(Scope.NumbersSmaller10)) {
        max = 10;
    } else if (labels.includes(Scope.NumbersSmaller20)) {
        max = 20;
    } else if (labels.includes(Scope.NumbersSmaller100)) {
        max = 100;
    } else if (labels.includes(Scope.NumbersSmaller120)) {
        max = 120;
    } else if (labels.includes(Scope.NumbersSmaller1000)) {
        max = 1000;
    } else if (labels.includes(Scope.NumbersSmaller10000)) {
        max = 10000;
    } else if (labels.includes(Scope.NumbersSmaller100000)) {
        max = 100000;
    } else if (labels.includes(Scope.NumbersSmaller1000000)) {
        max = 1000000;
    }

    // 3. Resolve minimum boundary from LargerThan scopes

    if (labels.includes(Scope.NumbersLarger1000000)) {
        min = 1000000;
    } else if (labels.includes(Scope.NumbersLarger100000)) {
        min = 100000;
    } else if (labels.includes(Scope.NumbersLarger10000)) {
        min = 10000;
    } else if (labels.includes(Scope.NumbersLarger1000)) {
        min = 1000;
    } else if (labels.includes(Scope.NumbersLarger120)) {
        min = 120;
    } else if (labels.includes(Scope.NumbersLarger100)) {
        min = 100;
    } else if (labels.includes(Scope.NumbersLarger20)) {
        min = 20;
    } else if (labels.includes(Scope.NumbersLarger10)) {
        min = 10;
    } else if (labels.includes(Scope.NumbersLarger5)) {
        min = 5;
    }

    return { min, max };
}
