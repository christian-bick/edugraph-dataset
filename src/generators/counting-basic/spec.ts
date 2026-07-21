import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-basic',
    generalLabels: [
        Area.NumerationWithIntegers,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.AdditiveCount
    ]
};


export const CountingBasicGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ]
} as const;

export type CountingBasicGeneratorConfig = ConfigFromSchema<typeof CountingBasicGeneratorSchema>;
