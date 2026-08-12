import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasLabel} from "../../../lib/resolvers.ts";

const exactTool = (labels: readonly string[]) => {
    if (labels.includes(Scope.CentimeterScale) || labels.includes(Scope.MeterScale)) return undefined;
    if (labels.includes(Scope.PhysicalRuler)) return Scope.PhysicalRuler;
    if (labels.includes(Scope.Tapemeter)) return Scope.Tapemeter;
    return undefined;
};

export const spec: GeneratorSpec = {
    generatorId: 'measurement-length',
    generalLabels: [
        Area.MeasuringObjects,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};


export const MeasurementLengthGeneratorSchema = {
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
    ],
    tool: [
        [Scope.PhysicalRuler, Scope.Tapemeter],
        exactTool
    ]
} as const;

export type MeasurementLengthGeneratorConfig = ConfigFromSchema<typeof MeasurementLengthGeneratorSchema>;
