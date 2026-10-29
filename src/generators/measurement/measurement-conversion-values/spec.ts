import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {measurementConversionUnitPairSchema} from '../conversion-schema.ts';

const numericProfileFallbacks = [
    [Scope.IntegerNumbers],
    [Scope.DecimalNumbers]
] as const;

const resolveNumericProfile = selectExactLabelSetMap([
    [numericProfileFallbacks[0], 'integer'],
    [numericProfileFallbacks[1], 'decimal']
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'measurement-conversion-values',
    generalLabels: [Area.UnitScaleRelation, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};

export const MeasurementConversionValuesGeneratorSchema = {
    unitPair: measurementConversionUnitPairSchema,
    numericProfile: [
        [Scope.IntegerNumbers, Scope.DecimalNumbers],
        resolveNumericProfile,
        numericProfileFallbacks
    ]
} as const;

export type MeasurementConversionValuesGeneratorConfig = ConfigFromSchema<
    typeof MeasurementConversionValuesGeneratorSchema
>;
