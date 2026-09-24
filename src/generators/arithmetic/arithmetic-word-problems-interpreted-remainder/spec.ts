import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {ArithmeticWordProblemsTwoStepGeneratorSchema, spec as baseSpec} from '../arithmetic-word-problems-two-step/spec.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-interpreted-remainder',
    generalLabels: [
        ...baseSpec.generalLabels.filter(label => label !== Scope.MultiLevelComposition),
        Area.ImperfectDivisibility,
        Area.Modulo,
        Area.Division
    ]
};

export const ArithmeticWordProblemsInterpretedRemainderGeneratorSchema = {range: ArithmeticWordProblemsTwoStepGeneratorSchema.range} as const;
export type ArithmeticWordProblemsInterpretedRemainderGeneratorConfig = ConfigFromSchema<typeof ArithmeticWordProblemsInterpretedRemainderGeneratorSchema>;
