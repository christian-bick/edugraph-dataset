import { CompetencyDescriptor, partOf, Scope, Area, Ability } from 'edugraph-ts';

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
 * Returns true if the view supports all the labels required by the problem.
 * A view supports a problem label if the problem label is a subconcept of the view label
 * via taxonomic partOf generalization.
 */
export function doesViewSupportProblem(viewSpecSupportedLabels: string[], problemLabels: string[]): boolean {
    if (!viewSpecSupportedLabels || viewSpecSupportedLabels.length === 0) {
        return false;
    }

    return problemLabels.every(problemLabel => {
        // If the problem label is not related to Area, Scope, or Ability (e.g., custom tags), skip validation
        if (!problemLabel.startsWith('http://edugraph.io/edu/')) {
            return true;
        }
        
        return viewSpecSupportedLabels.some(viewLabel => isSubConceptOf(problemLabel, viewLabel));
    });
}

const abilitiesList = new Set<string>(Object.values(Ability));

/**
 * Returns true if the generator supports all the labels required by the competency target.
 */
export function doesGeneratorSupportCompetency(genSupportedLabels: string[], competencyLabels: string[]): boolean {
    return competencyLabels.every(compLabel => {
        // Skip ability checks for the generator, as abilities are validated at the view level
        if (abilitiesList.has(compLabel)) {
            return true;
        }
        if (!compLabel.startsWith('http://edugraph.io/edu/')) {
            return true;
        }
        return genSupportedLabels.some(genLabel => isSubConceptOf(compLabel, genLabel));
    });
}

import { ViewSpec } from '../types/view-spec.ts';

/**
 * Finds all compatible views that support a given competency target labels and problem data constraints.
 */
export function findCompatibleViews(
    targetLabels: string[],
    problemData: Record<string, any>,
    allViews: ViewSpec[],
    targetConstraints: Record<string, any> = {}
): ViewSpec[] {
    return allViews.filter(viewSpec => {
        const labelsMatch = doesViewSupportProblem(viewSpec.supportedLabels || [], targetLabels);
        if (!labelsMatch) return false;

        if (viewSpec.constraints) {
            for (const [key, constraint] of Object.entries(viewSpec.constraints) as any) {
                const val = problemData[key] !== undefined ? problemData[key] : targetConstraints[key];
                if (val === undefined) continue;
                if (constraint.type === 'range') {
                    if (val < constraint.min || val > constraint.max) return false;
                } else if (constraint.type === 'options') {
                    if (!constraint.values.includes(val)) return false;
                }
            }
        }
        return true;
    });
}
