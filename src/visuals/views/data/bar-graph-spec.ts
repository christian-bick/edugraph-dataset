import {Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {ViewCompatibilityRule} from '../../../types/compatibility.ts';

export const barGraphCompatibility: readonly ViewCompatibilityRule[] = [{
    id: 'five-step-axis',
    dependencies: [
        {scope: 'view', label: Scope.StepsOf5},
        {scope: 'generator', label: Scope.MultiplesOf5}
    ],
    predicate: labels => !labels.exact('view', Scope.StepsOf5)
        || labels.exact('generator', Scope.MultiplesOf5)
}];

export const BarGraphViewSchema = {
    requireFiveStepAxis: [[Scope.StepsOf5], hasLabel(Scope.StepsOf5)]
} as const;
