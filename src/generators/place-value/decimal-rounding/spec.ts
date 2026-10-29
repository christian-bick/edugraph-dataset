import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-rounding',
    generalLabels: [
        Area.DecimalRounding,
        Scope.DecimalNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const DecimalRoundingGeneratorSchema = {
    requireZeroEndpoint: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const)
    ]
} as const;

export type DecimalRoundingGeneratorConfig = ConfigFromSchema<typeof DecimalRoundingGeneratorSchema>;
