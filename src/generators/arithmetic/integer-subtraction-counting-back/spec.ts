import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {IntegerAddSubtractStrategiesGeneratorSchema, spec as baseSpec} from '../integer-add-subtract-strategies/spec.ts';

export const spec: GeneratorSpec = {
    generatorId: 'integer-subtraction-counting-back',
    generalLabels: [...baseSpec.generalLabels, Area.SubtractionCountingBack, Scope.SingleDigitSmallestOperand]
};
export const IntegerSubtractionCountingBackGeneratorSchema = {range: IntegerAddSubtractStrategiesGeneratorSchema.range} as const;
export type IntegerSubtractionCountingBackGeneratorConfig = ConfigFromSchema<typeof IntegerSubtractionCountingBackGeneratorSchema>;
