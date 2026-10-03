import {Area} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'coordinate-system',
    generalLabels: [Area.CoordinateAxes, Area.Origin]
};

export const CoordinateSystemGeneratorSchema = {} as const;

export type CoordinateSystemGeneratorConfig = ConfigFromSchema<typeof CoordinateSystemGeneratorSchema>;
