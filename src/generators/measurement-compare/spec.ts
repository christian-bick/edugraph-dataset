import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-compare',
    supportedLabels: [
        Area.Measurement,
        Area.ObjectSorting,
        Scope.LengthMeasurement,
        Scope.WeightMeasurement,
        Scope.NumericRange,
        Scope.Greater,
        Scope.Less
    ]
};

export const MeasurementCompareGeneralLabels = [
    Area.Measurement,
    Area.ObjectSorting
];

// TODO: Ontological relations could be beneficial in the future for non-range properties,
// such as inferring 'heavier' vs 'lighter' from related physics concepts.
export const MeasurementCompareGeneratorSchema = {
    hasLength: [
        [Scope.LengthMeasurement],
        hasSubConcept(Scope.LengthMeasurement)
    ],
    hasWeight: [
        [Scope.WeightMeasurement],
        hasSubConcept(Scope.WeightMeasurement)
    ],
    wantsGreater: [
        [Scope.Greater],
        hasSubConcept(Scope.Greater)
    ],
    wantsLess: [
        [Scope.Less],
        hasSubConcept(Scope.Less)
    ]
} as const;

export type MeasurementCompareGeneratorConfig = ConfigFromSchema<typeof MeasurementCompareGeneratorSchema>;
