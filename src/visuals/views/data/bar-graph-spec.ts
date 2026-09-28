import {Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {ViewCompatibilityRule} from '../../../types/compatibility.ts';

const scaledAxes = [
    [Scope.StepsOf2, Scope.EvenNumbers],
    [Scope.StepsOf5, Scope.MultiplesOf5],
    [Scope.StepsOf10, Scope.MultiplesOf10]
] as const;

export const barGraphCompatibility: readonly ViewCompatibilityRule[] = [{
    id: 'axis-step-matches-quantities',
    dependencies: [
        {scope: 'view', label: Scope.StepsOf1},
        ...scaledAxes.flatMap(([step, quantity]) => [
            {scope: 'view' as const, label: step},
            {scope: 'generator' as const, label: quantity}
        ])
    ],
    predicate: labels => labels.exact('view', Scope.StepsOf1)
        ? scaledAxes.every(([, quantity]) => !labels.exact('generator', quantity))
        : scaledAxes.some(([step, quantity]) => labels.exact('view', step) && labels.exact('generator', quantity))
}];

export const BarGraphViewSchema = {
    axisStep: [
        [Scope.StepsOf1, Scope.StepsOf2, Scope.StepsOf5, Scope.StepsOf10],
        selectExactLabelMap([
            [Scope.StepsOf1, 1], [Scope.StepsOf2, 2], [Scope.StepsOf5, 5], [Scope.StepsOf10, 10]
        ])
    ]
} as const;
