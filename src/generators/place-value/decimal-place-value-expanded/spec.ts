import {Area, Scope} from 'edugraph-ts';
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

export const DecimalPlaceValueExpandedGeneratorSchema = {} as const;

export type DecimalPlaceValueExpandedGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceValueExpandedGeneratorSchema
>;
