import {Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'coordinate-context',
    generalLabels: [Scope.NumbersWithoutNegatives]
};

export const CoordinateContextGeneratorSchema = {} as const;

export type CoordinateContextGeneratorConfig = ConfigFromSchema<typeof CoordinateContextGeneratorSchema>;
