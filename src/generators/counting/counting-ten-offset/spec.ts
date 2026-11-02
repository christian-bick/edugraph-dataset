import {Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {spec as baseSpec} from '../counting-inc-dec/spec.ts';
import {arithmeticOffsetOperandProfile} from '../arithmetic-offset-schema.ts';
import {placeValueOffsetRule, placeValueOffsetSchema} from '../counting-offset-compatibility.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-ten-offset',
    compatibility: [placeValueOffsetRule(10)],
    generalLabels: [...baseSpec.generalLabels.filter(label => label !== Scope.StepsOf1 && label !== Scope.NumbersWithoutZero),
        Scope.StepsOf10, Scope.TwoOperands]
};
export const CountingTenOffsetGeneratorSchema = placeValueOffsetSchema(10, arithmeticOffsetOperandProfile);
export type CountingTenOffsetGeneratorConfig = ConfigFromSchema<typeof CountingTenOffsetGeneratorSchema>;
