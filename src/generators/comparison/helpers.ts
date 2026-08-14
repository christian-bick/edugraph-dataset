import {Area, Scope} from 'edugraph-ts';

export type ComparisonRelation = Scope.Less | Scope.Equal | Scope.Greater;

export function resolveComparisonRelation(labels: string[]): ComparisonRelation | undefined {
    const supportedRelations: readonly ComparisonRelation[] = [
        Scope.Less,
        Scope.Equal,
        Scope.Greater
    ];
    const relations = supportedRelations
        .filter(relation => labels.includes(relation));
    const requiresEquality = labels.includes(Area.NumericEquality);
    const requiresInequality = labels.includes(Area.NumericInequality);

    if (relations.length > 1 || (requiresEquality && requiresInequality)) {
        throw new Error('Comparison labels request contradictory relations.');
    }

    const relation = relations[0];
    if (requiresEquality && relation && relation !== Scope.Equal) {
        throw new Error('Numeric equality requires an equal relation.');
    }
    if (requiresInequality && relation === Scope.Equal) {
        throw new Error('Numeric inequality requires a non-equal relation.');
    }

    if (relation) return relation;
    if (requiresEquality) return Scope.Equal;
    if (requiresInequality) return Scope.Less;
    return undefined;
}
