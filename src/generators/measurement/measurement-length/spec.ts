import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema, exactResolver} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasLabel, selectExactMatch} from "../../../lib/resolvers.ts";

const exactTool = exactResolver((labels: string[]) => {
    if (labels.includes(Scope.CentimeterScale) || labels.includes(Scope.MeterScale)) return undefined;
    return selectExactMatch(labels, [Scope.PhysicalRuler, Scope.Tapemeter]);
});

export const spec: GeneratorSpec = {
    generatorId: 'measurement-length',
    generalLabels: [
        Area.MeasuringLength,
        Scope.NumbersWithoutNegatives
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
