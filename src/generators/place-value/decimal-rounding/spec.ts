import {Area, Scope} from 'edugraph-ts';
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

export const DecimalRoundingGeneratorSchema = {} as const;

export type DecimalRoundingGeneratorConfig = ConfigFromSchema<typeof DecimalRoundingGeneratorSchema>;
