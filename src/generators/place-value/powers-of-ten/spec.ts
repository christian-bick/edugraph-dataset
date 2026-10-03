import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'powers-of-ten',
    generalLabels: [
        Area.Exponentiation,
        Scope.PowersOf10,
        Scope.IntegerExponent,
        Scope.NumbersWithoutNegatives,
        Scope.Base10,
        Scope.IntegerNumbers
    ]
};

export const PowersOfTenGeneratorSchema = {} as const;

export type PowersOfTenGeneratorConfig = ConfigFromSchema<
    typeof PowersOfTenGeneratorSchema
>;
