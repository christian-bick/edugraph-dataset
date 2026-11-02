import {Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {spec as baseSpec} from '../counting-inc-dec/spec.ts';
import {hundredOffsetOperandProfile} from '../arithmetic-offset-schema.ts';
import {placeValueOffsetRule, placeValueOffsetSchema} from '../counting-offset-compatibility.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-hundred-offset',
    compatibility: [placeValueOffsetRule(100)],
    generalLabels: [...baseSpec.generalLabels.filter(label => label !== Scope.StepsOf1 && label !== Scope.NumbersWithoutZero),
        Scope.StepsOf100, Scope.TwoOperands]
};
export const CountingHundredOffsetGeneratorSchema = placeValueOffsetSchema(100, hundredOffsetOperandProfile);
export type CountingHundredOffsetGeneratorConfig = ConfigFromSchema<typeof CountingHundredOffsetGeneratorSchema>;
