import {Area} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {TwoStepExtendedGeneratorSchema, twoStepGeneralLabels, twoStepOperationCompatibility} from '../two-step-capabilities.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-letter-equation',
    compatibility: twoStepOperationCompatibility,
    generalLabels: [...twoStepGeneralLabels, Area.Equation]
};

export const ArithmeticWordProblemsLetterEquationGeneratorSchema = TwoStepExtendedGeneratorSchema;
export type ArithmeticWordProblemsLetterEquationGeneratorConfig = ConfigFromSchema<typeof ArithmeticWordProblemsLetterEquationGeneratorSchema>;
