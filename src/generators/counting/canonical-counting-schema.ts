import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../types/schema.ts';
import {groupingCountingProfiles, groupingCountsForRange, selectionCountingProfiles} from './canonical-counting-domains.ts';

const rangeSchema = (profiles: typeof selectionCountingProfiles) => {
    const choices = profiles.map(profile => profile.labels);
    return [[...new Set(choices.flat())], withLabelChoices(selectExactLabelSetMap(
        profiles.map(profile => [profile.labels, profile.range] as const)),
    {kind: 'alternatives', alternatives: choices, relation: 'capability'}), choices] as const;
};
export const selectionCountingRangeSchema = rangeSchema(selectionCountingProfiles);
export const groupingRangeContext = [Area.EvenDivisibility, Area.UnevenDivisibility, Scope.EvenNumbers,
    Scope.OddNumbers, Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const groupingRange = selectExactLabelSetMap(groupingCountingProfiles.map(profile => [profile.labels, profile.range] as const));
export function permitsGroupingRange(labels: string[]): boolean {
    const range = groupingRange(labels);
    if (!range) return false;
    const even = labels.includes(Area.EvenDivisibility) || labels.includes(Scope.EvenNumbers);
    const odd = labels.includes(Area.UnevenDivisibility) || labels.includes(Scope.OddNumbers);
    const withZero = labels.includes(Scope.NumbersWithZero), withoutZero = labels.includes(Scope.NumbersWithoutZero);
    if (!even && !odd) return true;
    if (even === odd || withZero === withoutZero || even && withoutZero) return false;
    return groupingCountsForRange(range, even ? 'even' : withZero ? 'singleton-odd' : 'positive-odd').length > 0;
}
const groupingChoices = groupingCountingProfiles.map(profile => profile.labels);
export const groupingCountingRangeSchema = [[...new Set(groupingChoices.flat())],
    withLabelChoices(exactResolver((labels: string[]) => permitsGroupingRange(labels) ? groupingRange(labels) : undefined),
        {kind: 'alternatives', alternatives: groupingChoices, relation: 'capability',
            contextLabels: groupingRangeContext, resolvedContext: true}), groupingChoices] as const;
