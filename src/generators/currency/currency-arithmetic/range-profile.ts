import {Area, Scope} from 'edugraph-ts';
import {resolveOptionalCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {banknoteRangeProfiles, banknoteRowsForRange, pennyRangeProfiles, pennyRowsForRange,
    centOnlyRangeProfiles, centOnlyRowsForRange} from './numeric-domain.ts';

export const currencyRangeChoices = [[], ...new Map([...banknoteRangeProfiles, ...pennyRangeProfiles, ...centOnlyRangeProfiles]
    .map(profile => [profile.labels.join('|'), profile.labels])).values()];
export const currencyRangeLabels = [...new Set(currencyRangeChoices.flat())];
export const currencyRangeContext = [Scope.Coins, Scope.Banknotes, Scope.HundredthDenomination,
    Scope.TwentiethDenomination, Scope.TenthDenomination, Area.Addition, Area.Subtraction];
export function permitsCurrencyRange(labels: string[], range: CanonicalNumericRange | false): boolean {
    const coins = labels.includes(Scope.Coins), banknotes = labels.includes(Scope.Banknotes);
    if (!coins && !banknotes) return true;
    const pennies = coins && !banknotes && labels.includes(Scope.HundredthDenomination);
    const nickels = coins && !banknotes && labels.includes(Scope.TwentiethDenomination);
    const dimeSubtraction = coins && !banknotes && labels.includes(Scope.TenthDenomination) && labels.includes(Area.Subtraction);
    if (coins && !pennies && !nickels && !dimeSubtraction) return range === false;
    if (range === false) return false;
    const operation = labels.includes(Area.Addition) ? 'addition'
        : labels.includes(Area.Subtraction) ? 'subtraction' : undefined;
    return operation === undefined || (pennies ? pennyRowsForRange(operation, range)
        : nickels || dimeSubtraction ? centOnlyRowsForRange(operation, nickels ? 5 : 10, range)
            : banknoteRowsForRange(operation, range)).length > 0;
}
export const resolveCurrencyRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveOptionalCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsCurrencyRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: currencyRangeChoices, relation: 'capability',
    contextLabels: currencyRangeContext, resolvedContext: true});
