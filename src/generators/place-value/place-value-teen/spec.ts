import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-teen',
    generalLabels: [
        Area.Difference,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives]
};


export const PlaceValueTeenGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLarger10, Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ]
} as const;

export type PlaceValueTeenGeneratorConfig = ConfigFromSchema<typeof PlaceValueTeenGeneratorSchema>;
