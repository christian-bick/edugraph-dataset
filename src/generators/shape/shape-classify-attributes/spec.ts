import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-classify-attributes',
    generalLabels: [Area.ShapeRecognition, Scope.ShapeAttributes]
};

export const ShapeClassifyAttributesGeneratorSchema = {} as const;

export type ShapeClassifyAttributesGeneratorConfig = ConfigFromSchema<
    typeof ShapeClassifyAttributesGeneratorSchema
>;
