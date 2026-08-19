import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-line-symmetry',
    generalLabels: [Area.ShapeReflection, Scope.Foldable]
};

export const ShapeLineSymmetryGeneratorSchema = {} as const;

export type ShapeLineSymmetryGeneratorConfig = ConfigFromSchema<
    typeof ShapeLineSymmetryGeneratorSchema
>;
