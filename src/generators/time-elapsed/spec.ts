import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {GeneratorSpec} from '../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../types/schema.ts';

import {generatorLabelRule} from '../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'time-elapsed',
    compatibility: [generatorLabelRule('integer-elapsed-count', [
        Scope.IntegerNumbers
    ], selected => selected(Scope.IntegerNumbers))],
    generalLabels: [
        Area.MeasuringTime,
        Area.Difference,
        Scope.MinuteIntervals
    ]
};

export const TimeElapsedGeneratorSchema = {
    requireElapsedCount: [
        [Scope.IntegerNumbers],
        hasLabel(Scope.IntegerNumbers)
    ]
} as const;

export type TimeElapsedGeneratorConfig = ConfigFromSchema<
    typeof TimeElapsedGeneratorSchema
>;
