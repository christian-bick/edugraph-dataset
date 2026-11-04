import {Area, Scope} from 'edugraph-ts';
import {capabilitySatisfies, resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {exactPrimaryWidths, type ExactPrimaryWidth, type PrimaryWidth, primaryWidthRows} from './width-domain.ts';
import {widthRangeDomain} from './range-profile.ts';

const largest = [Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand, Scope.ThreeDigitLargestOperand];
const smallest = [Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand, Scope.ThreeDigitSmallestOperand];
export const primaryWidthChoices = exactPrimaryWidths.map(width =>
    [largest[Number(width[0]) - 1]!, smallest[Number(width[1]) - 1]!]);
export const primaryWidthLabels = [...largest, ...smallest];
const operations = [Area.Addition, Area.AdditionPlaceValuePartitioning,
    Area.Subtraction, Area.SubtractionPlaceValuePartitioning] as const;
const broadWidths = [Scope.MultipleDigitLargestOperand, Scope.MultipleDigitSmallestOperand];
const rangeLabels = resolveRangeFromLabels.labelChoices!.contextLabels!;
export const primaryWidthContext = [...operations, Area.IntegerRegrouping, Scope.MultiplesOf10,
    Scope.NumbersWithZero, Scope.NumbersWithoutZero, ...broadWidths, ...rangeLabels];
type Selected = (label: string) => boolean;

export const primaryWidthFromLabels = (labels: readonly string[]): ExactPrimaryWidth | undefined => {
    const selected = primaryWidthLabels.filter(label => labels.includes(label));
    const index = primaryWidthChoices.findIndex(choice => choice.length === selected.length
        && choice.every(label => selected.includes(label)));
    return index < 0 ? undefined : exactPrimaryWidths[index];
};
export const needsPrimaryWidth = (selected: Selected): boolean => operations.some(label => selected(label));

/** Mathematical feasibility only; the spec separately retains the original native domain. */
export const permitsPrimaryWidth = (selected: Selected, width: ExactPrimaryWidth): boolean => {
    const addition = selected(Area.Addition) || selected(Area.AdditionPlaceValuePartitioning);
    const subtraction = selected(Area.Subtraction) || selected(Area.SubtractionPlaceValuePartitioning);
    if (!addition && !subtraction) return true;
    if (selected(Scope.MultiplesOf10)) return width === '22' && !selected(Area.IntegerRegrouping);
    const base = {operation: addition ? 'addition' as const : 'subtraction' as const,
        ...widthRangeDomain(rangeLabels.filter(label => selected(label))), regrouping: selected(Area.IntegerRegrouping),
        coefficientZero: selected(Scope.NumbersWithoutZero) ? false : undefined};
    return [false, ...(selected(Scope.NumbersWithZero) && subtraction && !base.regrouping ? [true] : [])].some(zeroResult =>
        primaryWidthRows({...base, zeroResult}, width).length > 0);
};

// Exact, finite and entropy-free. Partial requests complete to a declared pair.
export const resolvePrimaryWidth = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]): PrimaryWidth | undefined => {
        const requested = [...primaryWidthLabels, ...broadWidths].filter(label => labels.includes(label));
        const candidates = exactPrimaryWidths.filter((width, index) => requested.every(request =>
            primaryWidthChoices[index]!.some(label => capabilitySatisfies(label, request)))
            && permitsPrimaryWidth(label => labels.includes(label), width));
        // In the direct helper an explicit zero-result request precedes width
        // completion. Keep its unspecified width feasible. A complete planned
        // binding is never replaced by this partial-request default.
        if (!primaryWidthFromLabels(labels) && labels.includes(Scope.NumbersWithZero)
            && !labels.includes(Area.IntegerRegrouping)
            && (labels.includes(Area.Subtraction) || labels.includes(Area.SubtractionPlaceValuePartitioning))) {
            return candidates.find(width => width[0] === width[1]);
        }
        return candidates.length === 1 ? candidates[0] : undefined;
    }
), {kind: 'alternatives', alternatives: primaryWidthChoices,
    contextLabels: primaryWidthContext, resolvedContext: true}));
