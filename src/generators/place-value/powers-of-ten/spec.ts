import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'powers-of-ten',
    generalLabels: [Area.Exponentiation, Scope.PowersOf10, Scope.IntegerExponent,
        Scope.NumbersWithoutNegatives, Scope.Base10, Scope.IntegerNumbers]
};

const profiles = [
    [[Scope.NumbersWithZero, Scope.NumbersSmaller10], 0],
    [[Scope.NumbersWithoutZero, Scope.NumbersSmaller10], 1],
    [[Scope.NumbersWithoutZero, Scope.NumbersSmaller100], 2]
] as const;

export const PowersOfTenGeneratorSchema = {
    exponent: [[Scope.NumbersWithZero, Scope.NumbersWithoutZero, Scope.NumbersSmaller10, Scope.NumbersSmaller100],
        selectExactLabelSetMap(profiles), profiles.map(([labels]) => labels)]
} as const;
export type PowersOfTenGeneratorConfig = ConfigFromSchema<typeof PowersOfTenGeneratorSchema>;
