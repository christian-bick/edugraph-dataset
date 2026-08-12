import {Area} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'number-array',
    generalLabels: [Area.Addition]
};

export const NumberArrayGeneratorSchema = {
    requireIteratedOperation: [
        [Area.IteratedOperation],
        hasLabel(Area.IteratedOperation)
    ]
} as const;

export type NumberArrayGeneratorConfig = ConfigFromSchema<typeof NumberArrayGeneratorSchema>;
