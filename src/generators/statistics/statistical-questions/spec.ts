import {Area} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {generatorId: 'statistical-questions', generalLabels: []};

const variationRelations = [
    [[], 'absent'],
    [[Area.StatisticalQuestion], 'present']
] as const;

export const StatisticalQuestionsGeneratorSchema = {
    anticipatedVariation: [[Area.StatisticalQuestion], selectExactLabelSetMap(variationRelations),
        variationRelations.map(([labels]) => labels)]
} as const;

export type StatisticalQuestionsGeneratorConfig = ConfigFromSchema<typeof StatisticalQuestionsGeneratorSchema>;
