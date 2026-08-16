import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'fraction-number-line',
    generalLabels: [
        Area.NumerationWithFractions,
        Area.FractionNotation
    ]
};

export const FractionNumberLineGeneratorSchema = {
    fractionType: [
        Scope.UnitFractions,
        Scope.NonUnitFractions,
        Scope.ImproperFractions
    ]
} as const;

export type FractionNumberLineGeneratorConfig = ConfigFromSchema<
    typeof FractionNumberLineGeneratorSchema
>;
