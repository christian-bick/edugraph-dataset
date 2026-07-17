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

// Logical implication map (e.g. <100 logically implies <20 for generators).
// It's technically the reverse of taxonomic subsumption in terms of capabilities.
export const IMPLIES_MAP: Record<string, string[]> = {
    [Scope.NumbersSmaller1000]: [Scope.NumbersSmaller100, Scope.NumbersSmaller20, Scope.NumbersSmaller10],
    [Scope.NumbersSmaller100]: [Scope.NumbersSmaller20, Scope.NumbersSmaller10],
    [Scope.NumbersSmaller20]: [Scope.NumbersSmaller10],
    [Scope.NumbersLarger10]: [Scope.NumbersLarger20, Scope.NumbersLarger100, Scope.NumbersLarger1000],
    [Scope.NumbersLarger20]: [Scope.NumbersLarger100, Scope.NumbersLarger1000],
    [Scope.NumbersLarger100]: [Scope.NumbersLarger1000]
};

// Logical contradictions
export const CONTRADICTS_MAP: Record<string, string[]> = {
    [Scope.NumbersSmaller10]: [Scope.NumbersLarger10, Scope.NumbersLarger20, Scope.NumbersLarger100, Scope.NumbersLarger1000],
    [Scope.NumbersSmaller20]: [Scope.NumbersLarger20, Scope.NumbersLarger100, Scope.NumbersLarger1000],
    [Scope.NumbersSmaller100]: [Scope.NumbersLarger100, Scope.NumbersLarger1000],
    [Scope.NumbersSmaller1000]: [Scope.NumbersLarger1000],
    [Scope.NumbersLarger10]: [Scope.NumbersSmaller10],
    [Scope.NumbersLarger20]: [Scope.NumbersSmaller20, Scope.NumbersSmaller10],
    [Scope.NumbersLarger100]: [Scope.NumbersSmaller100, Scope.NumbersSmaller20, Scope.NumbersSmaller10],
    [Scope.NumbersLarger1000]: [Scope.NumbersSmaller1000, Scope.NumbersSmaller100, Scope.NumbersSmaller20, Scope.NumbersSmaller10]
};

/**
 * Deducts the exact compatible subset of bounds from a given list of base constraints,
 * applying logical implication and pruning logical contradictions.
 */
export function deductCompatible(baseConstraints: string[]): string[] {
    const implied = new Set<string>();
    
    // 1. Gather all explicit constraints and their logical implications
    for (const constraint of baseConstraints) {
        implied.add(constraint);
        if (IMPLIES_MAP[constraint]) {
            for (const imp of IMPLIES_MAP[constraint]) {
                implied.add(imp);
            }
        }
    }

    // 2. Identify all constraints that are contradicted by any of the base constraints
    const contradicted = new Set<string>();
    for (const constraint of baseConstraints) {
        if (CONTRADICTS_MAP[constraint]) {
            for (const c of CONTRADICTS_MAP[constraint]) {
                contradicted.add(c);
                // Also remove anything that the contradicted label implies
                if (IMPLIES_MAP[c]) {
                    for (const imp of IMPLIES_MAP[c]) {
                        contradicted.add(imp);
                    }
                }
            }
        }
    }

    // 3. Subtract contradicted from implied
    const finalSet = new Set<string>();
    for (const item of implied) {
        if (!contradicted.has(item)) {
            finalSet.add(item);
        }
    }

    return Array.from(finalSet);
}


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
