import {Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

const resolveChoice = selectExactLabelMap([
    [Scope.NumbersWithZero, 'zero'], [Scope.NumbersWithoutZero, 'positive']
] as const);
const contextLabels = [Scope.FractionDividend, Scope.IntegerDivisor, Scope.ProperFractions] as const;

/** A proper fractional dividend divided by a positive integer has no complete group. */
export const resolveGroupCountProfile = withLabelChoices(exactResolver((labels: string[]) => {
    const choice = resolveChoice(labels);
    return choice === 'positive' && contextLabels.every(label => labels.includes(label)) ? undefined : choice;
}), {...resolveChoice.labelChoices!, contextLabels, resolvedContext: true});
