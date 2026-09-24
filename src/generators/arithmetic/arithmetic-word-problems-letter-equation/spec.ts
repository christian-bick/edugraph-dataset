import {Area} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {ArithmeticWordProblemsTwoStepGeneratorSchema, spec as baseSpec} from '../arithmetic-word-problems-two-step/spec.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-letter-equation',
    compatibility: baseSpec.compatibility,
    generalLabels: [...baseSpec.generalLabels, Area.Equation]
};

export const ArithmeticWordProblemsLetterEquationGeneratorSchema = ArithmeticWordProblemsTwoStepGeneratorSchema;
export type ArithmeticWordProblemsLetterEquationGeneratorConfig = ConfigFromSchema<typeof ArithmeticWordProblemsLetterEquationGeneratorSchema>;
