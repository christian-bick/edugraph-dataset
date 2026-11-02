import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {PrimaryWidth, primaryWidthRows, WidthDomain} from './width-domain.ts';
import {widthRangeDomain} from './range-profile.ts';

export const primaryWidthLabels = [Scope.SingleDigitLargestOperand, Scope.MultipleDigitLargestOperand] as const;
const operations = [Area.Addition, Area.AdditionPlaceValuePartitioning,
    Area.Subtraction, Area.SubtractionPlaceValuePartitioning] as const;
const rangeLabels = resolveRangeFromLabels.labelChoices!.contextLabels!;
export const primaryWidthContext = [...operations, Area.IntegerRegrouping,
    Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand, Scope.MultiplesOf10,
    Scope.NumbersWithZero, Scope.NumbersWithoutZero, ...rangeLabels] as const;
type Selected = (label: string) => boolean;
const addition = (selected: Selected) => selected(Area.Addition) || selected(Area.AdditionPlaceValuePartitioning);
const subtraction = (selected: Selected) => selected(Area.Subtraction) || selected(Area.SubtractionPlaceValuePartitioning);
const existingWidth = (selected: Selected) => selected(Scope.SingleDigitSmallestOperand)
    || selected(Scope.TwoDigitLargestOperand) || selected(Scope.MultiplesOf10);
export const needsPrimaryWidth = (selected: Selected) => !existingWidth(selected)
    && (addition(selected) || subtraction(selected) && !selected(Area.IntegerRegrouping));

const domainFromLabels = (selected: Selected): WidthDomain => {
    return {operation: addition(selected) ? 'addition' : 'subtraction',
        ...widthRangeDomain(rangeLabels.filter(label => selected(label))),
        regrouping: selected(Area.IntegerRegrouping), zeroResult: selected(Scope.NumbersWithZero),
        coefficientZero: selected(Scope.NumbersWithoutZero) ? false : undefined};
};
export const permitsPrimaryWidth = (selected: Selected, width: Exclude<PrimaryWidth, 'legacy'>) => {
    if (existingWidth(selected) || !addition(selected) && !subtraction(selected)) return false;
    if (subtraction(selected) && selected(Area.IntegerRegrouping) && width === 'single') return false;
    return primaryWidthRows(domainFromLabels(selected), width).length > 0;
};

// Reviewed owner-specific static resolver: exact identity, pure finite context lookup,
// no entropy/time/payload reads. Tests enumerate flag, range and complete-binding branches.
// Registration certifies this function only; copied metadata remains untrusted.
export const resolvePrimaryWidth = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]): PrimaryWidth | undefined => {
        const selected = (label: string) => labels.includes(label);
        const widths = primaryWidthLabels.filter(label => selected(label));
        if (widths.length > 1) return undefined;
        if (!widths.length) return needsPrimaryWidth(selected) ? undefined : 'legacy';
        const width = widths[0] === Scope.SingleDigitLargestOperand ? 'single' : 'multiple';
        if (!primaryWidthContext.some(label => selected(label))) return width;
        return permitsPrimaryWidth(selected, width) ? width : undefined;
    }
), {
    kind: 'alternatives', alternatives: [[], ...primaryWidthLabels.map(label => [label])],
    contextLabels: primaryWidthContext,
    resolvedContext: true,
    defaults: [
        {whenAll: [Scope.SingleDigitSmallestOperand], labels: []},
        {whenAll: [Scope.TwoDigitLargestOperand], labels: []},
        {whenAll: [Scope.MultiplesOf10], labels: []},
        {whenAll: [Area.Subtraction, Area.IntegerRegrouping], labels: []},
        {whenAll: [Area.SubtractionPlaceValuePartitioning, Area.IntegerRegrouping], labels: []}
    ]
}));
