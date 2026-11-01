import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {measurementConversionUnitPairSchema} from '../conversion-schema.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {permitsConversionStoryRange, resolveConversionStoryRange, resolveStoryNumberKind,
    storyRangeChoices, storyRangeContext, storyRangeLabels} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-conversion-problems',
    generalLabels: [
        Area.Equation,
        Area.UnitScaleRelation,
        Area.Addition,
        Scope.MultiStep,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ],
    compatibility: [generatorLabelRule('conversion-story-canonical-range', [...storyRangeLabels, ...storyRangeContext], selected => {
        const labels = [...storyRangeLabels, ...storyRangeContext].filter(selected);
        const range = resolveCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsConversionStoryRange(labels, range);
    })]
};

export const MeasurementConversionProblemsGeneratorSchema = {
    unitPair: measurementConversionUnitPairSchema,
    numberKind: [
        [Scope.IntegerNumbers, Scope.DecimalNumbers],
        resolveStoryNumberKind
    ],
    range: [storyRangeLabels, resolveConversionStoryRange, storyRangeChoices]
} as const;

export type MeasurementConversionProblemsGeneratorConfig = ConfigFromSchema<
    typeof MeasurementConversionProblemsGeneratorSchema
>;
