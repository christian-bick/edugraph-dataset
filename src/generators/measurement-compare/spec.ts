import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-compare',
    generalLabels: [
        Area.Measurement,
        Area.ObjectSorting,
    ]
};


// TODO: Ontological relations could be beneficial in the future for non-range properties,
// such as inferring 'heavier' vs 'lighter' from related physics concepts.
export const MeasurementCompareGeneratorSchema = {
    attribute: [Scope.LengthMeasurement, Scope.WeightMeasurement],
    relation: [Scope.Greater, Scope.Less],
} as const;

export type MeasurementCompareGeneratorConfig = ConfigFromSchema<typeof MeasurementCompareGeneratorSchema>;
