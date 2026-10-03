import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-division-model',
    generalLabels: [
        Area.Division,
        Area.PlaceValue,
        Scope.HundredthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.TwoOperands
    ]
};

export const DecimalDivisionModelGeneratorSchema = {} as const;

export type DecimalDivisionModelGeneratorConfig = ConfigFromSchema<
    typeof DecimalDivisionModelGeneratorSchema
>;
