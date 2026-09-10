import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-extrema',
    generalLabels: [Area.Statistics, Scope.FractionNumbers, Scope.SingleFrameOfReference]
};

export const MeasurementExtremaGeneratorSchema = {
    unitScale: [[Scope.InchScale, Scope.CentimeterScale], selectExactLabelMap([
        [Scope.InchScale, 'in'],
        [Scope.CentimeterScale, 'cm']
    ] as const)],
    operation: [[Area.Addition, Area.Subtraction], selectExactLabelMap([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const)]
} as const;
export type MeasurementExtremaGeneratorConfig = ConfigFromSchema<typeof MeasurementExtremaGeneratorSchema>;
