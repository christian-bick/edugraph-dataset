import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'numbers-composite-classification',
    generalLabels: [Area.CompositeNumbers, Scope.IntegerNumbers, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero, Scope.NumbersSmaller100]
};

export const NumbersCompositeClassificationGeneratorSchema = {} as const;
export type NumbersCompositeClassificationGeneratorConfig = ConfigFromSchema<typeof NumbersCompositeClassificationGeneratorSchema>;
