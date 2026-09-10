import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {partitionShape} from '../partition-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-unit-share-comparison',
    generalLabels: [Area.FractionCommonNumeratorComparison, Scope.EqualShares, Scope.UnitFractions,
        Scope.HalfFractions, Scope.QuarterFractions, Scope.Less]
};

export const ShapeUnitShareComparisonGeneratorSchema = {shape: partitionShape} as const;
export type ShapeUnitShareComparisonGeneratorConfig = ConfigFromSchema<typeof ShapeUnitShareComparisonGeneratorSchema>;
