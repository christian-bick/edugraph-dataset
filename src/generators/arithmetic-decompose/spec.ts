import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-decompose',
    supportedLabels: [
        Area.BaseOperations,
        Scope.NumericRange,
        Scope.NumericZero,
        Scope.IntegerNumbers
    ]
};


export const ArithmeticDecomposeGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticDecomposeGeneratorConfig = ConfigFromSchema<typeof ArithmeticDecomposeGeneratorSchema>;
