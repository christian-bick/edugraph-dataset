import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const comparisonProfiles = [
    [[Area.NumericInequality, Scope.Greater, Scope.ImproperFractions], 'greater'],
    [[Area.NumericInequality, Scope.Less, Scope.ProperFractions], 'less'],
    [[Area.NumericEquality, Scope.Equal, Scope.ImproperFractions], 'equal']
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'fraction-scaling',
    generalLabels: [Area.ProportionalScaling, Area.Multiplication]
};

export const FractionScalingGeneratorSchema = {
    comparisonProfile: [[
        Area.NumericInequality,
        Area.NumericEquality,
        Scope.Greater,
        Scope.Less,
        Scope.Equal,
        Scope.ProperFractions,
        Scope.ImproperFractions
    ], selectExactLabelSetMap(comparisonProfiles), comparisonProfiles.map(([labels]) => labels)]
} as const;

export type FractionScalingGeneratorConfig = ConfigFromSchema<
    typeof FractionScalingGeneratorSchema
>;
