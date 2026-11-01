import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {TwoStepExtendedGeneratorSchema, twoStepGeneralLabels} from '../two-step-capabilities.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-interpreted-remainder',
    generalLabels: [
        ...twoStepGeneralLabels.filter(label => label !== Scope.MultiLevelComposition),
        Area.ImperfectDivisibility,
        Area.Modulo,
        Area.Division
    ]
};

export const ArithmeticWordProblemsInterpretedRemainderGeneratorSchema = {range: TwoStepExtendedGeneratorSchema.range} as const;
export type ArithmeticWordProblemsInterpretedRemainderGeneratorConfig = ConfigFromSchema<typeof ArithmeticWordProblemsInterpretedRemainderGeneratorSchema>;
