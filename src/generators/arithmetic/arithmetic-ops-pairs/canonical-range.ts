import {Scope} from 'edugraph-ts';
import {canonicalRangeLabelChoices, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {arithmeticOperations} from '../helpers.ts';
import {canSampleCanonicalPair} from '../canonical-pair-sampling.ts';
import {canonicalPairConfigFromSelection, canonicalPairContextLabels, largestOperandWidthLabels, largestOperandWidthValue} from './operand-width.ts';

/** Direct resolution completes a feasible range before resolving its operand-width refinement. */
export const resolveCanonicalPairRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    if (range === undefined || !arithmeticOperations.some(label => labels.includes(label))) return range;
    const requestedWidths = largestOperandWidthLabels.filter(label => labels.includes(label));
    const widths = requestedWidths.length === 0 ? largestOperandWidthLabels
        : requestedWidths.length === 1 && requestedWidths[0] === Scope.MultipleDigitLargestOperand
            ? largestOperandWidthLabels.filter(label => label !== Scope.SingleDigitLargestOperand) : requestedWidths;
    const possible = widths.some(label => {
        const config = canonicalPairConfigFromSelection(candidate => labels.includes(candidate), largestOperandWidthValue(label));
        return config !== null && canSampleCanonicalPair(config);
    });
    return possible ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: canonicalRangeLabelChoices(),
    contextLabels: [...canonicalPairContextLabels, ...largestOperandWidthLabels], resolvedContext: true});
