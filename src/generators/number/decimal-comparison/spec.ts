import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-comparison',
    compatibility: [generatorLabelRule('comparison-relation', [
        Area.NumericEquality, Area.NumericInequality, Scope.Equal, Scope.Greater, Scope.Less
    ], selected => selected(Scope.Equal)
        ? selected(Area.NumericEquality)
        : selected(Area.NumericInequality) && (selected(Scope.Greater) || selected(Scope.Less)))],
    generalLabels: [
        Area.NumerationWithDecimals,
        Area.DecimalPrecission,
        Scope.DecimalNumbers
    ]
};

const resolveComparisonKind = selectExactLabelMap([
    [Area.NumericEquality, 'equality'],
    [Area.NumericInequality, 'inequality']
] as const);

const resolveRelation = selectExactLabelMap([
    [Scope.Greater, 'greater'],
    [Scope.Equal, 'equal'],
    [Scope.Less, 'less']
] as const);

export const DecimalComparisonGeneratorSchema = {
    comparisonKind: [[Area.NumericEquality, Area.NumericInequality], resolveComparisonKind],
    relation: [[Scope.Greater, Scope.Equal, Scope.Less], resolveRelation]
} as const;

export type DecimalComparisonGeneratorConfig = ConfigFromSchema<
    typeof DecimalComparisonGeneratorSchema
>;
