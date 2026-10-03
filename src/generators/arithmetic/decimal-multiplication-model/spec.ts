import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-multiplication-model',
    generalLabels: [
        Area.Multiplication,
        Area.PlaceValue,
        Scope.HundredthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.TwoOperands
    ]
};

export const DecimalMultiplicationModelGeneratorSchema = {} as const;

export type DecimalMultiplicationModelGeneratorConfig = ConfigFromSchema<
    typeof DecimalMultiplicationModelGeneratorSchema
>;
