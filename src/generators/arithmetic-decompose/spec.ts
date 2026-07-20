import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-decompose',
    generalLabels: [
        Area.NumberNotation,
        Area.Addition,
        Scope.IntegerNumbers,
        Scope.Base10
    ]
};


export const ArithmeticDecomposeGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticDecomposeGeneratorConfig = ConfigFromSchema<typeof ArithmeticDecomposeGeneratorSchema>;
