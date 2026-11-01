import {Area} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {TwoStepExtendedGeneratorSchema, twoStepGeneralLabels, twoStepOperationCompatibility} from '../two-step-capabilities.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-rounding',
    compatibility: twoStepOperationCompatibility,
    generalLabels: [...twoStepGeneralLabels, Area.IntegerRounding]
};

export const ArithmeticWordProblemsRoundingGeneratorSchema = TwoStepExtendedGeneratorSchema;
export type ArithmeticWordProblemsRoundingGeneratorConfig = ConfigFromSchema<typeof ArithmeticWordProblemsRoundingGeneratorSchema>;
