import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {measurementConversionUnitPairSchema} from '../conversion-schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {conversionRangeChoices, conversionRangeContext, conversionRangeLabels, numericProfileFallbacks,
    permitsConversionValueRange, resolveConversionValueRange, resolveNumericProfile} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-conversion-values',
    generalLabels: [Area.UnitScaleRelation, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero],
    compatibility: [generatorLabelRule('conversion-canonical-range', [...conversionRangeLabels, ...conversionRangeContext], selected => {
        const labels = [...conversionRangeLabels, ...conversionRangeContext].filter(selected);
        const range = resolveCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsConversionValueRange(labels, range);
    })]
};

export const MeasurementConversionValuesGeneratorSchema = {
    unitPair: measurementConversionUnitPairSchema,
    numericProfile: [
        [Scope.IntegerNumbers, Scope.DecimalNumbers],
        resolveNumericProfile,
        numericProfileFallbacks
    ],
    range: [conversionRangeLabels, resolveConversionValueRange, conversionRangeChoices]
} as const;

export type MeasurementConversionValuesGeneratorConfig = ConfigFromSchema<
    typeof MeasurementConversionValuesGeneratorSchema
>;
