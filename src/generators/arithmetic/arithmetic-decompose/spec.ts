import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-decompose',
    generalLabels: [
        Area.NumberNotation,
        Area.Addition,
        Area.PartitionOfCollections,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};


export const ArithmeticDecomposeGeneratorSchema = {
    range: [
        [Scope.NumbersSmaller5, Scope.NumbersSmaller10],
        selectExactLabelMap([
            [Scope.NumbersSmaller5, createCanonicalNumericRange(5)],
            [Scope.NumbersSmaller10, createCanonicalNumericRange(10)]
        ])
    ]
} as const;

export type ArithmeticDecomposeGeneratorConfig = ConfigFromSchema<typeof ArithmeticDecomposeGeneratorSchema>;
