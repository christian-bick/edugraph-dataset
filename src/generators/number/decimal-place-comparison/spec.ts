import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {comparisonRangeChoices, comparisonRangeLabels, comparisonRelationAllowed, resolveComparisonRange} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-place-comparison',
    compatibility: [generatorLabelRule('comparison-relation', [
        Area.NumericEquality, Area.NumericInequality, Scope.Equal, Scope.Greater, Scope.Less
    ], selected => selected(Scope.Equal)
        ? selected(Area.NumericEquality)
        : selected(Area.NumericInequality) && (selected(Scope.Greater) || selected(Scope.Less))),
        generatorLabelRule('comparison-numeric-range', [...comparisonRangeLabels, Scope.NumbersWithZero, Scope.NumbersWithoutZero], selected =>
            (!selected(Scope.NumbersWithoutZero) || selected(Scope.NumbersSmaller120) || selected(Scope.NumbersSmaller1000))
            && (!selected(Scope.NumbersLarger5) || selected(Scope.NumbersWithoutZero)))],
    generalLabels: [
        Area.PlaceValue,
        Scope.ThousandthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.TwoOperands
    ]
};

const resolveComparisonKind = selectExactLabelMap([
    [Area.NumericEquality, 'equality'],
    [Area.NumericInequality, 'inequality']
] as const);

const resolveRelation = selectExactLabelSetMap([
    [[Scope.Greater, Scope.NumbersWithZero], 'greater-zero'],
    [[Scope.Greater, Scope.NumbersWithoutZero], 'greater-nonzero'],
    [[Scope.Equal], 'equal'],
    [[Scope.Equal, Scope.NumbersWithZero], 'equal'],
    [[Scope.Less, Scope.NumbersWithZero], 'less-zero'],
    [[Scope.Less, Scope.NumbersWithoutZero], 'less-nonzero']
] as const);
const relationChoices = [[Scope.Greater, Scope.NumbersWithZero], [Scope.Greater, Scope.NumbersWithoutZero],
    [Scope.Equal, Scope.NumbersWithZero], [Scope.Less, Scope.NumbersWithZero], [Scope.Less, Scope.NumbersWithoutZero]];
const resolveProfiledRelation = withLabelChoices(exactResolver((labels: string[]) => {
    const relation = resolveRelation(labels);
    return relation && !comparisonRelationAllowed(labels, relation.endsWith('-nonzero')) ? undefined : relation;
}), {...resolveRelation.labelChoices!, contextLabels: comparisonRangeLabels});

export const DecimalPlaceComparisonGeneratorSchema = {
    comparisonKind: [[Area.NumericEquality, Area.NumericInequality], resolveComparisonKind],
    relation: [
        [Scope.Greater, Scope.Equal, Scope.Less, Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        resolveProfiledRelation, relationChoices
    ],
    range: [comparisonRangeLabels, resolveComparisonRange, comparisonRangeChoices]
} as const;

export type DecimalPlaceComparisonGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceComparisonGeneratorSchema
>;
