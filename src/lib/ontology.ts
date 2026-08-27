import { Scope, specializesTransitive, structuresTransitive } from 'edugraph-ts';
import type { CompetencyDescriptor } from 'edugraph-ts';
import {compositionalResolver, exactResolver} from '../types/schema.ts';

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

const capabilityAncestorCache = new Map<string, ReadonlySet<string>>();
const structuralAncestorCache = new Map<string, ReadonlySet<string>>();

/** Returns a capability and every capability it transitively specializes, including itself. */
export function getCapabilityAncestors(concept: string): ReadonlySet<string> {
    const cached = capabilityAncestorCache.get(concept);
    if (cached) return cached;

    const ancestors = new Set<string>([concept]);
    try {
        for (const parent of specializesTransitive(concept as CompetencyDescriptor) || []) {
            ancestors.add(parent);
        }
    } catch {
        // Unknown capabilities have no known ancestors, but still include themselves.
    }

    capabilityAncestorCache.set(concept, ancestors);
    return ancestors;
}

/**
 * Returns true when `provided` is equal to `requested`, or specializes it.
 * This is capability substitution; structural `partOf` ancestry is deliberately excluded.
 */
export function capabilitySatisfies(provided: string, requested: string): boolean {
    return getCapabilityAncestors(provided).has(requested);
}

/** Returns a descriptor and its complete `structures` ancestry, including itself. */
export function getStructuralAncestors(concept: string): ReadonlySet<string> {
    const cached = structuralAncestorCache.get(concept);
    if (cached) return cached;

    const ancestors = new Set<string>([concept]);
    try {
        for (const parent of structuresTransitive(concept as CompetencyDescriptor) || []) {
            ancestors.add(parent);
        }
    } catch {
        // Unknown descriptors have no known ancestors, but still include themselves.
    }
    structuralAncestorCache.set(concept, ancestors);
    return ancestors;
}

/** Resolves an exact distance-scale label and classifies it through structural ancestry. */
export function resolveDistanceScale(
    labels: string[],
    supportedLabels: readonly string[] = DISTANCE_SCALE_LABELS
): DistanceScaleResolution | undefined {
    const matches = DISTANCE_SCALE_LABELS.filter(candidate =>
        supportedLabels.includes(candidate) && labels.includes(candidate));
    if (matches.length > 1) {
        throw new Error(`Ambiguous exact distance scale: ${matches.join(' + ')}`);
    }
    const label = matches[0];
    if (!label) return undefined;

    const ancestors = getStructuralAncestors(label);
    if (ancestors.has(Scope.MetricDistanceScale)) return {label, family: 'metric'};
    if (ancestors.has(Scope.ImperialDistanceScale)) return {label, family: 'imperial'};
    if (ancestors.has(Scope.DistanceAbstraction)) return {label, family: 'abstract'};
    return undefined;
}

exactResolver(resolveDistanceScale);


/**
 * Resolves the numeric range boundary from a list of ontological labels.
 */
export const resolveRangeFromLabels = compositionalResolver((labels: string[]): { min: number; max: number } => {
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
});
