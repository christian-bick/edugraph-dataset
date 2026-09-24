import {Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {CountingIncDecGeneratorSchema, spec as baseSpec} from '../counting-inc-dec/spec.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-ten-offset',
    generalLabels: [...baseSpec.generalLabels.filter(label => label !== Scope.StepsOf1), Scope.StepsOf10]
};
export const CountingTenOffsetGeneratorSchema = {
    ...CountingIncDecGeneratorSchema,
    range: [
        CountingIncDecGeneratorSchema.range[0].filter(label =>
            label !== Scope.NumbersSmaller5 && label !== Scope.NumbersSmaller10),
        CountingIncDecGeneratorSchema.range[1]
    ]
} as const;
export type CountingTenOffsetGeneratorConfig = ConfigFromSchema<typeof CountingTenOffsetGeneratorSchema>;
