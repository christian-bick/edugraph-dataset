import {Scope} from 'edugraph-ts';
import type {ViewCompatibilityRule} from '../../../types/compatibility.ts';

const smallerScalarUpperLabels = [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20,
    Scope.NumbersSmaller100, Scope.NumbersSmaller120] as const;

/** Positive profiles must fit the renderer; an explicit scalar zero needs no positive capacity. */
export function writingScalarCapacityRule(id: string, maximum: 120 | 1000): ViewCompatibilityRule {
    const upperLabels = maximum === 120 ? smallerScalarUpperLabels : [...smallerScalarUpperLabels, Scope.NumbersSmaller1000];
    return {
        id,
        dependencies: [Scope.NumbersWithZero, ...upperLabels].map(label => ({scope: 'generator', label})),
        predicate: labels => labels.exact('generator', Scope.NumbersWithZero)
            || upperLabels.some(label => labels.exact('generator', label))
    };
}
