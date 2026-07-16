import { CompetencyDescriptor, partOf, Scope } from 'edugraph-ts';

/**
 * Returns true if child is equal to parent, or if parent is a transitive 
 * ancestor of child via the taxonomic partOf relation.
 */
export function isSubConceptOf(child: string, parent: string): boolean {
    if (child === parent) return true;

    const visited = new Set<string>();
    const queue: string[] = [child];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === parent) return true;
        if (visited.has(current)) continue;
        visited.add(current);

        try {
            const parents = partOf(current as CompetencyDescriptor) || [];
            for (const p of parents) {
                if (!visited.has(p)) {
                    queue.push(p);
                }
            }
        } catch {
            // Handle cases where concept is not defined in edugraph-ts
        }
    }

    return false;
}

// Explicit inclusion map using Scope enums
const INCLUDED_BY_MAP: Record<string, string[]> = {
    [Scope.NumbersSmaller10]: [
        Scope.NumbersSmaller20
    ],
    [Scope.NumbersSmaller20]: [
        Scope.NumbersSmaller100
    ],
    [Scope.NumbersSmaller100]: [
        Scope.NumbersSmaller1000
    ],
    [Scope.NumbersWithoutZero]: [
        Scope.NumbersWithZero
    ],
    [Scope.NumbersWithoutNegatives]: [
        Scope.NumbersWithNegatives
    ]
};

/**
 * Returns true if child is compatible with parent.
 * It traverses standard partOf relations, but also follows explicit custom INCLUDED_BY_MAP relations.
 */
export function isCompatibleConcept(child: string, parent: string): boolean {
    if (child === parent) return true;

    const visited = new Set<string>();
    const queue: string[] = [child];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === parent) return true;
        if (visited.has(current)) continue;
        visited.add(current);

        try {
            const nextNodes = [...(partOf(current as CompetencyDescriptor) || [])];
            
            // Traverse explicit capability inclusion relations
            const inclusions = INCLUDED_BY_MAP[current] || [];
            nextNodes.push(...inclusions);

            for (const n of nextNodes) {
                if (!visited.has(n)) {
                    queue.push(n);
                }
            }
        } catch {
            // Handle cases where concept is not defined in edugraph-ts
        }
    }

    return false;
}

/**
 * Resolves the numeric range boundary from a list of ontological labels.
 */
export function resolveRangeFromLabels(labels: string[]): { min: number; max: number } {
    let min = 1;
    let max = 10;

    // 1. Resolve minimum boundary (Zero scopes)
    const hasZero = labels.some(l => isSubConceptOf(l, Scope.NumbersWithZero));
    const hasNoZero = labels.some(l => isSubConceptOf(l, Scope.NumbersWithoutZero));
    if (hasZero) {
        min = 0;
    } else if (hasNoZero) {
        min = 1;
    }

    // 2. Resolve maximum boundary (SmallerThan scopes)
    if (labels.some(l => isSubConceptOf(l, Scope.NumbersSmaller1000))) {
        max = 1000;
    } else if (labels.some(l => isSubConceptOf(l, Scope.NumbersSmaller100))) {
        max = 100;
    } else if (labels.some(l => isSubConceptOf(l, Scope.NumbersSmaller20))) {
        max = 20;
    } else if (labels.some(l => isSubConceptOf(l, Scope.NumbersSmaller10))) {
        max = 10;
    }

    // 3. Resolve minimum boundary from LargerThan scopes
    if (labels.some(l => isSubConceptOf(l, Scope.NumbersLarger1000))) {
        min = 1001;
    } else if (labels.some(l => isSubConceptOf(l, Scope.NumbersLarger100))) {
        min = 101;
    } else if (labels.some(l => isSubConceptOf(l, Scope.NumbersLarger20))) {
        min = 21;
    } else if (labels.some(l => isSubConceptOf(l, Scope.NumbersLarger10))) {
        min = 11;
    }

    return { min, max };
}
