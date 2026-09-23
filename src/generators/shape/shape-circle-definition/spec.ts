import {Area} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {generatorId: 'shape-circle-definition', generalLabels: [Area.Circle]};
export const ShapeCircleDefinitionGeneratorSchema = {} as const;
export type ShapeCircleDefinitionGeneratorConfig = ConfigFromSchema<typeof ShapeCircleDefinitionGeneratorSchema>;
