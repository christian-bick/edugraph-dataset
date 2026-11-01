import {Area, Scope} from 'edugraph-ts';
import {resolveOptionalCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {banknoteRangeProfiles, banknoteRowsForRange} from './numeric-domain.ts';

export const currencyRangeChoices = [[], ...banknoteRangeProfiles.map(profile => profile.labels)];
export const currencyRangeLabels = [...new Set(currencyRangeChoices.flat())];
export const currencyRangeContext = [Scope.Coins, Scope.Banknotes, Area.Addition, Area.Subtraction];
export function permitsCurrencyRange(labels: string[], range: CanonicalNumericRange | false): boolean {
    const coins = labels.includes(Scope.Coins), banknotes = labels.includes(Scope.Banknotes);
    if (!coins && !banknotes) return true;
    if (coins) return range === false;
    if (range === false) return false;
    const operation = labels.includes(Area.Addition) ? 'addition'
        : labels.includes(Area.Subtraction) ? 'subtraction' : undefined;
    return operation === undefined || banknoteRowsForRange(operation, range).length > 0;
}
export const resolveCurrencyRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveOptionalCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsCurrencyRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: currencyRangeChoices, relation: 'capability',
    contextLabels: currencyRangeContext, resolvedContext: true});
