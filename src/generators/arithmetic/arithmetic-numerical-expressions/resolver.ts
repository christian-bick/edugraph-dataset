import {Area} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export type NumericalExpressionStructure = 'grouped' | 'ungrouped';

/** Selects grouping as one joint capability; the empty choice remains a real variant. */
export function resolveNumericalExpressionStructure(labels: string[]): NumericalExpressionStructure {
    const grouped = labels.includes(Area.GroupedExpression);
    const orderOfOperations = labels.includes(Area.OrderOfOperations);
    if (grouped !== orderOfOperations) {
        throw new Error('Numerical expression grouping requires both GroupedExpression and OrderOfOperations.');
    }
    return grouped ? 'grouped' : 'ungrouped';
}

exactResolver(resolveNumericalExpressionStructure);
withLabelChoices(resolveNumericalExpressionStructure, {
    kind: 'alternatives',
    alternatives: [[], [Area.GroupedExpression, Area.OrderOfOperations]]
});
