import { partOf, Scope } from 'edugraph-ts';
import type { CompetencyDescriptor } from 'edugraph-ts';

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


/**
 * Resolves the numeric range boundary from a list of ontological labels.
 */
export function resolveRangeFromLabels(labels: string[]): { min: number; max: number } {
    let min = 1;
    let max = 10;

    // 1. Resolve minimum boundary (Zero scopes)
    const hasZero = labels.includes(Scope.NumbersWithZero);
    const hasNoZero = labels.includes(Scope.NumbersWithoutZero);
    if (hasZero) {
        min = 0;
    } else if (hasNoZero) {
        min = 1;
    }

    // 2. Resolve maximum boundary (SmallerThan scopes)
    if (labels.includes(Scope.NumbersSmaller1000)) {
        max = 1000;
    } else if (labels.includes(Scope.NumbersSmaller100)) {
        max = 100;
    } else if (labels.includes(Scope.NumbersSmaller20)) {
        max = 20;
    } else if (labels.includes(Scope.NumbersSmaller10)) {
        max = 10;
    }

    // 3. Resolve minimum boundary from LargerThan scopes
    if (labels.includes(Scope.NumbersLarger1000)) {
        min = 1001;
    } else if (labels.includes(Scope.NumbersLarger100)) {
        min = 101;
    } else if (labels.includes(Scope.NumbersLarger20)) {
        min = 21;
    } else if (labels.includes(Scope.NumbersLarger10)) {
        min = 11;
    }

    return { min, max };
}

/**
 * Checks if child and parent concepts are mutually compatible.
 * Used for abilities matching where compatibility implies one is part of another.
 */
export function isCompatibleConcept(child: string, parent: string): boolean {
    return isSubConceptOf(child, parent) || isSubConceptOf(parent, child);
}
