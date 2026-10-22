import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'unit-dimension-relations',
    generalLabels: [Area.UnitDimensionality, Scope.RationalNumbers]
};

export const UnitDimensionRelationsGeneratorSchema = {
    operation: [[Area.Multiplication, Area.Division], selectExactLabelMap([
        [Area.Multiplication, 'multiplication'],
        [Area.Division, 'division']
    ])]
} as const;

export type UnitDimensionRelationsGeneratorConfig = ConfigFromSchema<typeof UnitDimensionRelationsGeneratorSchema>;
