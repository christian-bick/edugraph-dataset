import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from "../../lib/ontology.ts";

export const spec: GeneratorSpec = {
    generatorId: 'measurement-compare',
    generalLabels: [
        Area.Measurement,
        Area.ObjectSorting,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithNegatives
    ]
};


// TODO: Ontological relations could be beneficial in the future for non-range properties,
// such as inferring 'heavier' vs 'lighter' from related physics concepts.
export const MeasurementCompareGeneratorSchema = {
    attribute: [Scope.LengthMeasurement, Scope.WeightMeasurement],
    relation: [Scope.Greater, Scope.Less],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ]
} as const;

export type MeasurementCompareGeneratorConfig = ConfigFromSchema<typeof MeasurementCompareGeneratorSchema>;
