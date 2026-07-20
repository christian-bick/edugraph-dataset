import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {hasLabel} from "../../lib/resolvers.ts";

export const spec: GeneratorSpec = {
    generatorId: 'measurement',
    generalLabels: [
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};


export const MeasurementGeneratorSchema = {
    useDecimals: [
        [
            Scope.IntegerNumbers,
            Scope.DecimalNumbers
        ],
        hasLabel(Scope.DecimalNumbers)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ]
} as const;

export type MeasurementGeneratorConfig = ConfigFromSchema<typeof MeasurementGeneratorSchema>;
