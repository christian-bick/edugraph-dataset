import {Area, Scope} from 'edugraph-ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {primaryWidthRows, WidthDomain} from './width-domain.ts';
import {primaryWidthContext, primaryWidthLabels, primaryWidthFromLabels} from './width-profile.ts';
import {widthRangeDomain} from './range-profile.ts';

export const coefficientLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
export const coefficientContext = [...primaryWidthContext.filter(label => !coefficientLabels.includes(label as never)),
    ...primaryWidthLabels] as const;
type Selected = (label: string) => boolean;
const addition = (selected: Selected) => selected(Area.Addition) || selected(Area.AdditionPlaceValuePartitioning);
const subtraction = (selected: Selected) => selected(Area.Subtraction) || selected(Area.SubtractionPlaceValuePartitioning);
const width = (selected: Selected) => primaryWidthFromLabels(primaryWidthLabels.filter(label => selected(label))) ?? 'legacy';
const domain = (selected: Selected, zeroResult: boolean, coefficientZero: boolean): WidthDomain => {
    return {operation: addition(selected) ? 'addition' : 'subtraction',
        ...widthRangeDomain(coefficientContext.filter(label => selected(label))),
        regrouping: selected(Area.IntegerRegrouping), zeroResult, coefficientZero,
        multipleOf10Presence: selected(Scope.MultiplesOf10)};
};
const hasPairs = (selected: Selected, zeroResult: boolean, presence: boolean) =>
    primaryWidthRows(domain(selected, zeroResult, presence), width(selected)).length > 0;

/** Original request, rather than the later presence choice, retains explicit equality support. */
export const permitsCoefficientProfile = (selected: Selected, originalZero: boolean): boolean => {
    const presence = selected(Scope.NumbersWithZero);
    if (presence === selected(Scope.NumbersWithoutZero)) return false;
    if (addition(selected) && selected(Scope.TwoDigitLargestOperand)) return presence;
    const equality = originalZero && subtraction(selected) && !selected(Area.IntegerRegrouping);
    if (selected(Scope.MultiplesOf10) && subtraction(selected) && !selected(Area.SubtractionPlaceValuePartitioning)) return presence === equality;
    return hasPairs(selected, equality, presence);
};

// Reviewed exact owner resolver. This finite context lookup only inspects declared
// labels and numeric bounds; no entropy, clock, payload or dependency-graph reads.
// The result-only target field remains separate so broad subtraction stays positive.
export const resolveCoefficientPresence = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]): boolean | undefined => {
        const selected = (label: string) => labels.includes(label);
        const present = selected(Scope.NumbersWithZero), absent = selected(Scope.NumbersWithoutZero);
        if (present && absent) return undefined;
        if (!present && !absent) {
            if (addition(selected) && selected(Scope.TwoDigitLargestOperand)) return true;
            if (subtraction(selected) && !selected(Area.SubtractionPlaceValuePartitioning) && selected(Scope.MultiplesOf10)) return false;
            return undefined;
        }
        if (!addition(selected) && !subtraction(selected)) return present;
        if (addition(selected) && selected(Scope.TwoDigitLargestOperand)) return present ? true : undefined;
        if (selected(Scope.MultiplesOf10)) return present;
        // An explicit zero request may retain equality; an ordinary broad request
        // selects only positive pairs. The joint target/owner guard proves its exact path.
        return hasPairs(selected, false, present)
            || present && subtraction(selected) && !selected(Area.IntegerRegrouping) && hasPairs(selected, true, true)
            ? present : undefined;
    }
), {
    kind: 'alternatives', alternatives: coefficientLabels.map(label => [label]),
    contextLabels: coefficientContext, resolvedContext: true,
    defaults: [
        {whenAll: [Area.Addition, Scope.TwoDigitLargestOperand], labels: [Scope.NumbersWithZero]},
        {whenAll: [Area.AdditionPlaceValuePartitioning, Scope.TwoDigitLargestOperand], labels: [Scope.NumbersWithZero]},
        {whenAll: [Area.Subtraction, Scope.MultiplesOf10], labels: [Scope.NumbersWithoutZero]},
    ]
}));
