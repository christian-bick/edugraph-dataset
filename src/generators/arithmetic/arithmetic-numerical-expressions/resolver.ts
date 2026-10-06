import {Area} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export type NumericalExpressionStructure = 'grouped' | 'ungrouped';

/** Selects grouping as one joint capability; the empty choice remains a real variant. */
export function resolveNumericalExpressionStructure(labels: string[]): NumericalExpressionStructure {
    const grouped = labels.includes(Area.GroupingSymbol);
    const orderOfOperations = labels.includes(Area.OrderOfOperations);
    if (grouped !== orderOfOperations) {
        throw new Error('Arithmetic expression grouping requires both GroupingSymbol and OrderOfOperations.');
    }
    return grouped ? 'grouped' : 'ungrouped';
}

exactResolver(resolveNumericalExpressionStructure);
withLabelChoices(resolveNumericalExpressionStructure, {
    kind: 'alternatives',
    alternatives: [[], [Area.GroupingSymbol, Area.OrderOfOperations]]
});
