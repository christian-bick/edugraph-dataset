import {Area, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-comparison',
    generalLabels: [
        Area.NumerationWithDecimals,
        Area.DecimalNotation,
        Area.DecimalPrecission,
        Scope.DecimalNumbers
    ]
};

export const DecimalComparisonGeneratorSchema = {
    comparisonKind: [[Area.NumericEquality, Area.NumericInequality], selectExactMatch],
    relation: [[Scope.Greater, Scope.Equal, Scope.Less], selectExactMatch]
} as const;

export type DecimalComparisonGeneratorConfig = ConfigFromSchema<
    typeof DecimalComparisonGeneratorSchema
>;
