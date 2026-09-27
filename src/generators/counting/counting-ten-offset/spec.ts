import {Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {CountingIncDecGeneratorSchema, spec as baseSpec} from '../counting-inc-dec/spec.ts';
import {arithmeticOffsetDirection, arithmeticOffsetOperandProfile} from '../arithmetic-offset-schema.ts';
import {tenOffsetRangeRules} from '../counting-offset-compatibility.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-ten-offset',
    compatibility: tenOffsetRangeRules,
    generalLabels: [...baseSpec.generalLabels.filter(label => label !== Scope.StepsOf1), Scope.StepsOf10]
};
export const CountingTenOffsetGeneratorSchema = {
    ...CountingIncDecGeneratorSchema,
    direction: arithmeticOffsetDirection,
    operandProfile: arithmeticOffsetOperandProfile,
    range: [
        CountingIncDecGeneratorSchema.range[0].filter(label =>
            label !== Scope.NumbersSmaller5 && label !== Scope.NumbersSmaller10),
        CountingIncDecGeneratorSchema.range[1]
    ]
} as const;
export type CountingTenOffsetGeneratorConfig = ConfigFromSchema<typeof CountingTenOffsetGeneratorSchema>;
