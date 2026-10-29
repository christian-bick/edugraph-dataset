import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-place-value-expanded',
    generalLabels: [
        Area.PlaceValue,
        Area.Sum,
        Scope.ThousandthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const DecimalPlaceValueExpandedGeneratorSchema = {
    requireZeroCoefficient: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const)
    ]
} as const;

export type DecimalPlaceValueExpandedGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceValueExpandedGeneratorSchema
>;
