import {Area} from 'edugraph-ts';
import {resolveOptionalCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {numericExpressionCaseCount, numericExpressionRangeProfiles} from './numeric-domain.ts';
import {numericContextLabels, numericProfileForLabels, numericProfileLabels} from './numeric-profiles.ts';

export const expressionRangeChoices = [[], ...numericExpressionRangeProfiles.map(profile => profile.labels)];
export const expressionRangeLabels = [...new Set(expressionRangeChoices.flat())];
export const expressionRangeContext = [...numericContextLabels, ...numericProfileLabels];
function numericRelation(labels: string[]): string | undefined {
    if (!labels.includes(Area.ArithmeticExpression) || labels.includes(Area.AlgebraicExpression)) return undefined;
    return labels.includes(Area.Term) ? 'numeric-terms' : labels.includes(Area.Factor) ? 'numeric-factors'
        : labels.includes(Area.Addition) ? 'numeric-sum' : labels.includes(Area.Multiplication) ? 'numeric-product'
            : labels.includes(Area.Division) ? 'numeric-quotient'
                : labels.includes(Area.GroupingSymbol) && labels.includes(Area.Operand) ? 'numeric-grouped' : undefined;
}
export function permitsExpressionRange(labels: string[], range: CanonicalNumericRange | false): boolean {
    if (!expressionRangeContext.some(label => labels.includes(label))) return true;
    const relation = numericRelation(labels);
    if (!relation) return range === false;
    const profile = numericProfileForLabels(label => labels.includes(label));
    return range !== false && profile !== undefined && numericExpressionCaseCount(relation, profile, range) > 0;
}
export const resolveExpressionRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveOptionalCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsExpressionRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: expressionRangeChoices, relation: 'capability',
    contextLabels: expressionRangeContext, resolvedContext: true});
