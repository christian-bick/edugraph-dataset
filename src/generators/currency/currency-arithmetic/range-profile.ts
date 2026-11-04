import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {banknoteRangeProfiles, banknoteRowsForRange, pennyRangeProfiles, pennyRowsForRange,
    centOnlyRangeProfiles, centOnlyRowsForRange, pendingCurrencyRanges} from './numeric-domain.ts';

const pendingProfiles = canonicalRangeProfiles.filter(profile =>
    (['addition', 'subtraction'] as const).some(operation => [false, true].some(banknotes => [1, 5, 10, 25].some(denomination =>
        pendingCurrencyRanges(operation, banknotes, denomination).some(range => range.min === profile.range.min && range.max === profile.range.max)))));
export const currencyRangeChoices = [...new Map([...banknoteRangeProfiles, ...pennyRangeProfiles, ...centOnlyRangeProfiles, ...pendingProfiles]
    .map(profile => [profile.labels.join('|'), profile.labels])).values()];
export const currencyRangeLabels = [...new Set(currencyRangeChoices.flat())];
export const currencyRangeContext = [Scope.Coins, Scope.Banknotes, Scope.QuarterDenomination, Scope.HundredthDenomination,
    Scope.TwentiethDenomination, Scope.TenthDenomination, Area.Addition, Area.Subtraction];
export function permitsCurrencyRange(labels: string[], range: CanonicalNumericRange): boolean {
    const coins = labels.includes(Scope.Coins), banknotes = labels.includes(Scope.Banknotes);
    if (!coins && !banknotes) return true;
    const pennies = coins && !banknotes && labels.includes(Scope.HundredthDenomination);
    const nickels = coins && !banknotes && labels.includes(Scope.TwentiethDenomination);
    const dimeSubtraction = coins && !banknotes && labels.includes(Scope.TenthDenomination) && labels.includes(Area.Subtraction);
    const operation = labels.includes(Area.Addition) ? 'addition'
        : labels.includes(Area.Subtraction) ? 'subtraction' : undefined;
    if (coins && !pennies && !nickels && !dimeSubtraction) {
        const denomination = labels.includes(Scope.QuarterDenomination) ? 25 : labels.includes(Scope.TenthDenomination) ? 10
            : labels.includes(Scope.TwentiethDenomination) ? 5 : labels.includes(Scope.HundredthDenomination) ? 1 : undefined;
        const operations: readonly ('addition' | 'subtraction')[] = operation ? [operation] : ['addition', 'subtraction'];
        return denomination === undefined || operations.some(operation =>
            pendingCurrencyRanges(operation, banknotes, denomination).some(candidate => candidate.min === range.min && candidate.max === range.max));
    }
    return operation === undefined || (pennies ? pennyRowsForRange(operation, range)
        : nickels || dimeSubtraction ? centOnlyRowsForRange(operation, nickels ? 5 : 10, range)
            : banknoteRowsForRange(operation, range)).length > 0;
}
export const resolveCurrencyRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsCurrencyRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: currencyRangeChoices, relation: 'capability',
    contextLabels: currencyRangeContext, resolvedContext: true});
