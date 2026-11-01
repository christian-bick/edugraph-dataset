import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

export const spec: GeneratorSpec = {
    generatorId: 'numbers-prime-classification',
    generalLabels: [Area.PrimeNumbers, Scope.IntegerNumbers, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};

export const NumbersPrimeClassificationGeneratorSchema = {
    range: [[Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100],
        selectExactLabelMap([
            [Scope.NumbersSmaller5, createCanonicalNumericRange(5)],
            [Scope.NumbersSmaller10, createCanonicalNumericRange(10)],
            [Scope.NumbersSmaller20, createCanonicalNumericRange(20)],
            [Scope.NumbersSmaller100, createCanonicalNumericRange(100)]
        ])]
} as const;
export type NumbersPrimeClassificationGeneratorConfig = ConfigFromSchema<typeof NumbersPrimeClassificationGeneratorSchema>;
