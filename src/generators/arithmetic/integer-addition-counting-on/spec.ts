import {Area} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {IntegerAddSubtractStrategiesGeneratorSchema, spec as baseSpec} from '../integer-add-subtract-strategies/spec.ts';

export const spec: GeneratorSpec = {
    generatorId: 'integer-addition-counting-on',
    generalLabels: [...baseSpec.generalLabels, Area.AdditionCountingOn]
};
export const IntegerAdditionCountingOnGeneratorSchema = {range: IntegerAddSubtractStrategiesGeneratorSchema.range} as const;
export type IntegerAdditionCountingOnGeneratorConfig = ConfigFromSchema<typeof IntegerAdditionCountingOnGeneratorSchema>;
