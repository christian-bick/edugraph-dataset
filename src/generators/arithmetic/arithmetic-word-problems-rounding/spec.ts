import {Area} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {ArithmeticWordProblemsTwoStepGeneratorSchema, spec as baseSpec} from '../arithmetic-word-problems-two-step/spec.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-rounding',
    generalLabels: [...baseSpec.generalLabels, Area.IntegerRounding]
};

export const ArithmeticWordProblemsRoundingGeneratorSchema = ArithmeticWordProblemsTwoStepGeneratorSchema;
export type ArithmeticWordProblemsRoundingGeneratorConfig = ConfigFromSchema<typeof ArithmeticWordProblemsRoundingGeneratorSchema>;
