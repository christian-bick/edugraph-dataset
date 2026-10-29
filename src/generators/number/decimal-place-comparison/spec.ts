import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-place-comparison',
    compatibility: [generatorLabelRule('comparison-relation', [
        Area.NumericEquality, Area.NumericInequality, Scope.Equal, Scope.Greater, Scope.Less
    ], selected => selected(Scope.Equal)
        ? selected(Area.NumericEquality)
        : selected(Area.NumericInequality) && (selected(Scope.Greater) || selected(Scope.Less)))],
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

export const DecimalPlaceComparisonGeneratorSchema = {
    comparisonKind: [[Area.NumericEquality, Area.NumericInequality], resolveComparisonKind],
    relation: [
        [Scope.Greater, Scope.Equal, Scope.Less, Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        resolveRelation,
        [[Scope.Greater, Scope.NumbersWithZero], [Scope.Greater, Scope.NumbersWithoutZero],
            [Scope.Equal, Scope.NumbersWithZero], [Scope.Less, Scope.NumbersWithZero],
            [Scope.Less, Scope.NumbersWithoutZero]]
    ]
} as const;

export type DecimalPlaceComparisonGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceComparisonGeneratorSchema
>;
