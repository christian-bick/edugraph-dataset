import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'numbers-prime-classification',
    generalLabels: [Area.PrimeNumbers, Scope.IntegerNumbers, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero, Scope.NumbersSmaller100]
};

export const NumbersPrimeClassificationGeneratorSchema = {} as const;
export type NumbersPrimeClassificationGeneratorConfig = ConfigFromSchema<typeof NumbersPrimeClassificationGeneratorSchema>;
