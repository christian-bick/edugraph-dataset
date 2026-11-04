import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {comparisonAdjacentRangeChoices, comparisonRangeChoices, comparisonRangeLabels,
    resolveComparisonRelation, resolveComparisonRange} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-place-comparison',
    compatibility: [generatorLabelRule('comparison-relation', [
        Area.NumericEquality, Area.NumericInequality, Scope.Equal, Scope.Greater, Scope.Less
    ], selected => selected(Scope.Equal)
        ? selected(Area.NumericEquality)
        : selected(Area.NumericInequality) && (selected(Scope.Greater) || selected(Scope.Less))),
        generatorLabelRule('comparison-numeric-range', [...comparisonRangeLabels, Scope.Equal], selected =>
            !selected(Scope.Equal) || comparisonAdjacentRangeChoices.some(labels =>
                labels.every(label => selected(label))
                && comparisonRangeLabels.every(label => !selected(label) || labels.includes(label))))],
    generalLabels: [
        Area.PlaceValue,
        Scope.ThousandthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.TwoOperands
    ]
};

const resolveComparisonKind = selectExactLabelMap([
    [Area.NumericEquality, 'equality'],
    [Area.NumericInequality, 'inequality']
] as const);

export const DecimalPlaceComparisonGeneratorSchema = {
    comparisonKind: [[Area.NumericEquality, Area.NumericInequality], resolveComparisonKind],
    relation: [
        [Scope.Greater, Scope.Equal, Scope.Less], resolveComparisonRelation
    ],
    range: [comparisonRangeLabels, resolveComparisonRange, comparisonRangeChoices]
} as const;

export type DecimalPlaceComparisonGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceComparisonGeneratorSchema
>;
