import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-excluded-quadrilateral',
    generalLabels: [Area.Quadrilateral, Area.ShapeSubsumption, Scope.ShapeAttributes]
};
export const ShapeExcludedQuadrilateralGeneratorSchema = {} as const;
export type ShapeExcludedQuadrilateralGeneratorConfig = ConfigFromSchema<typeof ShapeExcludedQuadrilateralGeneratorSchema>;
