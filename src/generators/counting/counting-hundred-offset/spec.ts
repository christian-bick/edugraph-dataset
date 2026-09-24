import {Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {CountingIncDecGeneratorSchema, spec as baseSpec} from '../counting-inc-dec/spec.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-hundred-offset',
    generalLabels: [...baseSpec.generalLabels.filter(label => label !== Scope.StepsOf1), Scope.StepsOf100]
};
export const CountingHundredOffsetGeneratorSchema = {
    ...CountingIncDecGeneratorSchema,
    range: [
        CountingIncDecGeneratorSchema.range[0].filter(label =>
            label !== Scope.NumbersSmaller5 && label !== Scope.NumbersSmaller10
            && label !== Scope.NumbersSmaller20 && label !== Scope.NumbersSmaller100),
        CountingIncDecGeneratorSchema.range[1]
    ]
} as const;
export type CountingHundredOffsetGeneratorConfig = ConfigFromSchema<typeof CountingHundredOffsetGeneratorSchema>;
