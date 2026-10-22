import {Area} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const roles = [
    [[Area.UnknownVariable], 'particular-unknown'],
    [[Area.GeneralizedVariable], 'arbitrary-generalized-number']
] as const;

export const spec: GeneratorSpec = {generatorId: 'algebra-variable-models', generalLabels: []};
export const AlgebraVariableModelsGeneratorSchema = {
    role: [[Area.UnknownVariable, Area.GeneralizedVariable], selectExactLabelSetMap(roles), roles.map(([labels]) => labels)]
} as const;
export type AlgebraVariableModelsGeneratorConfig = ConfigFromSchema<typeof AlgebraVariableModelsGeneratorSchema>;
